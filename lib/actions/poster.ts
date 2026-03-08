"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

function createPlaceholderPosterUrl(title: string): string {
  const safeTitle = (title.slice(0, 20) || "AI 微电影").replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="896" viewBox="0 0 512 896">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1e1b4b"/>
        <stop offset="100%" style="stop-color:#312e81"/>
      </linearGradient>
    </defs>
    <rect width="512" height="896" fill="url(#g)"/>
    <text x="256" y="420" text-anchor="middle" fill="white" font-size="36" font-weight="bold" font-family="sans-serif">${safeTitle}</text>
    <text x="256" y="470" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="16" font-family="sans-serif">AI 微电影</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generatePoster(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      storyboards: { orderBy: { sceneNumber: "asc" }, take: 1 },
      videos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) return { error: "项目不存在" };

  const video = project.videos[0];
  if (!video) return { error: "视频不存在" };

  const keyScene = project.storyboards[0]?.description ?? "";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const placeholderUrl = createPlaceholderPosterUrl(project.title);
    await prisma.video.update({
      where: { id: video.id },
      data: { posterUrl: placeholderUrl },
    });
    revalidatePath(`/create/${projectId}`);
    return { success: true, posterUrl: placeholderUrl };
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const prompt = [
      `电影海报设计，标题：${project.title}。`,
      project.description ? `${project.description}。` : "",
      keyScene ? `关键场景：${keyScene}。` : "",
      "风格：专业电影海报，高质量，4K分辨率，",
      "包含电影标题文字，戏剧性光影效果，海报构图。",
    ].join("");

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1792",
      quality: "hd",
      n: 1,
    });

    const posterUrl = response.data?.[0]?.url;
    if (!posterUrl) throw new Error("未返回图片");

    await prisma.video.update({
      where: { id: video.id },
      data: { posterUrl },
    });

    revalidatePath(`/create/${projectId}`);
    return { success: true, posterUrl };
  } catch (error) {
    console.error("Poster generation failed:", error);
    const placeholderUrl = createPlaceholderPosterUrl(project.title);
    await prisma.video.update({
      where: { id: video.id },
      data: { posterUrl: placeholderUrl },
    });
    revalidatePath(`/create/${projectId}`);
    return { success: true, posterUrl: placeholderUrl };
  }
}
