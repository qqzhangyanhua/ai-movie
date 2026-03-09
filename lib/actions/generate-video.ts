"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { enqueueTask } from "@/lib/queue";

type ScriptScene = {
  sceneNumber: number;
  description: string;
  characters?: string[];
  action?: string;
  cameraType?: string;
  duration: number;
  dialogue?: string;
};

export async function generateVideo(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      script: true,
      characters: {
        include: {
          character: true,
        },
      },
    },
  });

  if (!project) {
    return { error: "项目不存在" };
  }

  if (!project.script) {
    return { error: "请先生成剧本" };
  }

  const scenes = project.script.content as ScriptScene[];
  const characters = project.characters.map((pc) => ({
    name: pc.character.name,
    photoUrl: pc.character.photoUrl,
    personality: pc.character.personality,
    style: pc.character.style,
  }));

  const video = await prisma.video.create({
    data: {
      projectId,
      status: "PENDING",
      progress: 0,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "GENERATING" },
  });

  await enqueueTask({
    taskType: "video:generate",
    projectId,
    userId: session.user.id,
    data: {
      videoId: video.id,
      scenes,
      characters,
      videoGenConfig: getVideoGenConfigFromEnv(),
      storageConfig: getStorageConfigFromEnv(),
    },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true, videoId: video.id };
}

export async function getVideoProgress(videoId: string) {
  const session = await requireAuth();

  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      project: {
        userId: session.user.id,
      },
    },
  });

  if (!video) {
    return { error: "视频不存在" };
  }

  return {
    status: video.status,
    progress: video.progress,
    videoUrl: video.videoUrl,
    errorMessage: video.errorMessage,
  };
}

function getVideoGenConfigFromEnv() {
  return {
    provider: process.env.VIDEO_PROVIDER || "mock",
    apiKey: process.env.VIDEO_API_KEY || "",
    baseUrl: process.env.VIDEO_BASE_URL || "",
    model: process.env.VIDEO_MODEL || "",
    config: {},
  };
}

function getStorageConfigFromEnv() {
  return {
    endpoint: process.env.S3_ENDPOINT || "",
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "us-east-1",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
  };
}
