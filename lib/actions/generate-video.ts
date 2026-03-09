"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Queue } from "bullmq";
import { revalidatePath } from "next/cache";

const queue = new Queue("ai-tasks", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

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

  const videoGenConfig = await prisma.serviceConfig.findFirst({
    where: {
      userId: session.user.id,
      type: "VIDEO_GENERATION",
      isActive: true,
    },
  });

  if (!videoGenConfig) {
    return {
      error: "未配置视频生成服务，请前往设置页面配置 Runway、Luma 或 Pika",
    };
  }

  const storageConfig = await prisma.serviceConfig.findFirst({
    where: {
      userId: session.user.id,
      type: "STORAGE",
      isActive: true,
    },
  });

  if (!storageConfig) {
    return {
      error: "未配置存储服务，请前往设置页面配置 MinIO 或 S3",
    };
  }

  const scenes = project.script.content as Array<{
    sceneNumber: number;
    description: string;
    action: string;
    cameraType: string;
    duration: number;
    dialogue?: string;
  }>;

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

  await queue.add("video:generate", {
    projectId,
    videoId: video.id,
    userId: session.user.id,
    data: {
      scenes,
      characters,
      videoGenConfig: {
        provider: videoGenConfig.provider,
        apiKey: videoGenConfig.apiKey,
        baseUrl: videoGenConfig.baseUrl,
        model: videoGenConfig.model,
        config: videoGenConfig.config,
      },
      storageConfig: {
        endpoint: storageConfig.endpoint,
        bucket: storageConfig.bucket,
        region: storageConfig.region,
        accessKey: storageConfig.accessKey,
        secretKey: storageConfig.secretKey,
      },
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
