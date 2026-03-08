"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { upgradePlanSchema } from "@/lib/validations/subscription";
import type { Plan } from "@prisma/client";

export type PlanLimits = {
  maxProjects: number | null;
  maxVideosPerMonth: number | null;
  maxCharacters: number | null;
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxProjects: 3,
    maxVideosPerMonth: 5,
    maxCharacters: 5,
  },
  MONTHLY: {
    maxProjects: 20,
    maxVideosPerMonth: 50,
    maxCharacters: 30,
  },
  YEARLY: {
    maxProjects: null,
    maxVideosPerMonth: null,
    maxCharacters: null,
  },
};

export type UserPlanInfo = {
  plan: Plan;
  projectCount: number;
  videoCount: number;
  characterCount: number;
  limits: PlanLimits;
};

export async function getUserPlan(): Promise<UserPlanInfo | null> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, projectCount, characterCount, videoCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    prisma.project.count({ where: { userId } }),
    prisma.character.count({ where: { userId } }),
    prisma.video.count({
      where: {
        project: { userId },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
          ),
        },
      },
    }),
  ]);

  if (!user) return null;

  const limits = PLAN_LIMITS[user.plan];

  return {
    plan: user.plan,
    projectCount,
    videoCount,
    characterCount,
    limits,
  };
}

export async function upgradePlan(
  plan: "MONTHLY" | "YEARLY"
): Promise<{ success?: boolean; error?: string }> {
  const session = await requireAuth();
  const parsed = upgradePlanSchema.safeParse({ plan });
  if (!parsed.success) return { error: "无效的会员方案" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: parsed.data.plan },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/create");
  return { success: true };
}

export type PlanLimitCheckResult = {
  allowed: boolean;
  current: number;
  limit: number | null;
};

export async function checkPlanLimit(
  action: "project" | "video" | "character"
): Promise<PlanLimitCheckResult | null> {
  const info = await getUserPlan();
  if (!info) return null;

  const limits = info.limits;
  let current: number;
  let limit: number | null;

  switch (action) {
    case "project":
      current = info.projectCount;
      limit = limits.maxProjects;
      break;
    case "video":
      current = info.videoCount;
      limit = limits.maxVideosPerMonth;
      break;
    case "character":
      current = info.characterCount;
      limit = limits.maxCharacters;
      break;
    default:
      return null;
  }

  const allowed = limit === null || current < limit;

  return {
    allowed,
    current,
    limit,
  };
}
