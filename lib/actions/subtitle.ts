"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import type { ScriptScene } from "@/lib/data/script-templates";

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}

function generateSrtContent(scenes: ScriptScene[]): string {
  const entries: string[] = [];
  let currentTime = 0;
  let counter = 1;

  for (const scene of scenes) {
    const dialogue = (scene.dialogue ?? "").trim();
    const duration = scene.duration ?? 5;

    if (dialogue) {
      const startTime = currentTime + 0.5;
      const endTime = currentTime + duration - 0.5;

      entries.push(
        `${counter}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${dialogue}\n`
      );
      counter++;
    }

    currentTime += duration;
  }

  return entries.join("\n");
}

export async function generateSubtitles(
  projectId: string,
  videoId?: string
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[] | null;
  if (!Array.isArray(content) || content.length === 0) {
    return { error: "剧本内容为空" };
  }

  const srtContent = generateSrtContent(content);
  if (!srtContent.trim()) {
    return { error: "剧本中没有对白，无法生成字幕" };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "subtitles");
  const fileName = `${projectId}.srt`;
  const filePath = path.join(uploadDir, fileName);

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(filePath, srtContent, "utf-8");

  const subtitleUrl = `/uploads/subtitles/${fileName}`;

  const video = videoId
    ? await prisma.video.findFirst({
        where: { id: videoId, projectId },
      })
    : await prisma.video.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });

  if (video) {
    await prisma.video.update({
      where: { id: video.id },
      data: { subtitleUrl },
    });
  }

  revalidatePath(`/create/${projectId}`);
  return { success: true, subtitleUrl };
}

export async function toggleSubtitles(
  videoId: string,
  enabled: boolean
) {
  const session = await requireAuth();

  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      project: { userId: session.user.id },
    },
  });
  if (!video) return { error: "视频不存在" };

  if (enabled) {
    await generateSubtitles(video.projectId, videoId);
  } else {
    await prisma.video.update({
      where: { id: videoId },
      data: { subtitleUrl: null },
    });
  }

  revalidatePath(`/create/${video.projectId}`);
  return { success: true };
}
