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

  // ServiceConfig 已废弃，直接使用环境变量
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      error: "未配置 OPENAI_API_KEY 环境变量",
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
        provider: "openai",
        apiKey,
        baseUrl: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL || "gpt-4",
        config: {},
      },
    },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
