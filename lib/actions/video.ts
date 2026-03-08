"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { generateSubtitles } from "@/lib/actions/subtitle";

export async function startVideoGeneration(
  projectId: string,
  options?: { subtitles?: boolean }
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { storyboards: true },
  });
  if (!project) return { error: "项目不存在" };
  if (project.storyboards.length === 0) return { error: "请先生成分镜" };

  const totalDuration = project.storyboards.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  const video = await prisma.video.create({
    data: {
      projectId,
      duration: totalDuration,
      resolution: "1080p",
      status: "PROCESSING",
    },
  });

  await prisma.videoClip.updateMany({
    where: { storyboard: { projectId } },
    data: { status: "PROCESSING", progress: 0 },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "GENERATING" },
  });

  if (options?.subtitles) {
    await generateSubtitles(projectId, video.id);
  }

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function simulateVideoCompletion(projectId: string) {
  const session = await requireAuth();

  await prisma.videoClip.updateMany({
    where: { storyboard: { projectId } },
    data: { status: "COMPLETED", progress: 100 },
  });

  await prisma.video.updateMany({
    where: { projectId },
    data: {
      status: "COMPLETED",
      progress: 100,
      videoUrl: "/sample-video.mp4",
    },
  });

  await prisma.project.update({
    where: { id: projectId, userId: session.user.id },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
