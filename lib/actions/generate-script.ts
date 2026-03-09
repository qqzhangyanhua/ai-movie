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

export async function generateScript(projectId: string, prompt: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
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

  const llmConfig = await prisma.serviceConfig.findFirst({
    where: {
      userId: session.user.id,
      type: "LLM",
      isActive: true,
    },
  });

  if (!llmConfig) {
    return {
      error: "未配置 AI 服务，请前往设置页面配置 OpenAI 或其他 LLM 服务",
    };
  }

  const characters = project.characters.map((pc) => ({
    name: pc.character.name,
    personality: pc.character.personality,
    style: pc.character.style,
  }));

  await queue.add("script:generate", {
    projectId,
    userId: session.user.id,
    data: {
      prompt,
      characters,
      llmConfig: {
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        baseUrl: llmConfig.baseUrl,
        model: llmConfig.model,
        config: llmConfig.config,
      },
    },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
