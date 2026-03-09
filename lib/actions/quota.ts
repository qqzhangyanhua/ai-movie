"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PLAN_LIMITS,
  getPlanVideosRemaining,
  isUnlimitedPlan,
} from "@/lib/constants/plans";

type QuotaResult = { success: boolean; error?: string };

function normalizeSizeInMB(sizeInMB: number): number {
  if (!Number.isFinite(sizeInMB) || sizeInMB <= 0) return 0;
  return Math.ceil(sizeInMB);
}

function isSameYearMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

type TxClient = Prisma.TransactionClient;

async function ensureMonthlyQuota(tx: TxClient, userId: string) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      quotaResetAt: true,
      videosRemaining: true,
      videosUsed: true,
      storageLimit: true,
      maxResolution: true,
    },
  });

  if (!user) return null;

  const now = new Date();
  const planLimit = PLAN_LIMITS[user.plan];
  const shouldReset = !isSameYearMonth(user.quotaResetAt, now);

  if (shouldReset) {
    const patched = await tx.user.update({
      where: { id: userId },
      data: {
        videosRemaining: getPlanVideosRemaining(user.plan),
        videosUsed: 0,
        quotaResetAt: now,
        storageLimit: planLimit.storageLimitMB,
        maxResolution: planLimit.maxResolution,
      },
      select: {
        id: true,
        plan: true,
        videosRemaining: true,
        videosUsed: true,
        storageUsed: true,
        storageLimit: true,
        maxResolution: true,
        quotaResetAt: true,
      },
    });
    return patched;
  }

  return user;
}

export async function resetMonthlyQuota(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    if (!user) return;

    const limit = PLAN_LIMITS[user.plan];
    await tx.user.update({
      where: { id: userId },
      data: {
        videosRemaining: getPlanVideosRemaining(user.plan),
        videosUsed: 0,
        quotaResetAt: new Date(),
        storageLimit: limit.storageLimitMB,
        maxResolution: limit.maxResolution,
      },
    });
  });
}

export async function checkVideoQuota(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  return prisma.$transaction(async (tx) => {
    const user = await ensureMonthlyQuota(tx, userId);
    if (!user) return { allowed: false, remaining: 0 };
    if (isUnlimitedPlan(user.plan)) {
      return { allowed: true, remaining: user.videosRemaining };
    }
    return {
      allowed: user.videosRemaining > 0,
      remaining: user.videosRemaining,
    };
  });
}

export async function deductVideoQuota(userId: string): Promise<QuotaResult> {
  return prisma.$transaction(async (tx) => {
    const user = await ensureMonthlyQuota(tx, userId);
    if (!user) return { success: false, error: "用户不存在" };

    if (isUnlimitedPlan(user.plan)) {
      await tx.user.update({
        where: { id: userId },
        data: { videosUsed: { increment: 1 } },
      });
      return { success: true };
    }

    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        videosRemaining: { gt: 0 },
      },
      data: {
        videosRemaining: { decrement: 1 },
        videosUsed: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      return { success: false, error: "本月视频生成额度已用完，请升级会员或下月重置后再试" };
    }

    return { success: true };
  });
}

export async function checkStorageQuota(
  userId: string,
  sizeInMB: number
): Promise<{ allowed: boolean; available: number }> {
  const normalized = normalizeSizeInMB(sizeInMB);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, storageLimit: true },
  });
  if (!user) return { allowed: false, available: 0 };

  const available = Math.max(0, user.storageLimit - user.storageUsed);
  return {
    allowed: available >= normalized,
    available,
  };
}

export async function addStorageUsage(
  userId: string,
  sizeInMB: number
): Promise<QuotaResult> {
  const normalized = normalizeSizeInMB(sizeInMB);
  if (normalized <= 0) {
    return { success: false, error: "无效的存储增量" };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { storageUsed: true, storageLimit: true },
    });
    if (!user) return { success: false, error: "用户不存在" };

    const available = user.storageLimit - user.storageUsed;
    if (available < normalized) {
      return { success: false, error: "存储空间不足，请释放空间或升级会员" };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        storageUsed: { increment: normalized },
      },
    });

    return { success: true };
  });
}
