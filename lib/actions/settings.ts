"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/settings";
import type { TaskStatus } from "@prisma/client";

export type GenerationHistoryItem = {
  id: string;
  projectTitle: string;
  status: TaskStatus;
  duration: number | null;
  createdAt: Date;
};

export async function updateProfile(data: {
  username?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await requireAuth();
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入无效" };
  }

  if (!parsed.data.username) return { error: "请输入用户名" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username: parsed.data.username },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await requireAuth();
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入无效" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) return { error: "用户不存在" };

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!valid) return { error: "当前密码错误" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getGenerationHistory(): Promise<
  GenerationHistoryItem[] | null
> {
  const session = await requireAuth();
  const userId = session.user.id;

  const videos = await prisma.video.findMany({
    where: { project: { userId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      duration: true,
      createdAt: true,
      project: { select: { title: true } },
    },
  });

  return videos.map((v) => ({
    id: v.id,
    projectTitle: v.project.title,
    status: v.status,
    duration: v.duration,
    createdAt: v.createdAt,
  }));
}
