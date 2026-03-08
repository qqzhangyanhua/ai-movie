"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

function createPlaceholderImageUrl(
  sceneNumber: number,
  description: string
): string {
  const text = `场景 ${sceneNumber}`;
  const desc = (description.slice(0, 30) || "分镜预览").replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#g)"/>
    <text x="200" y="100" text-anchor="middle" fill="white" font-size="24" font-family="sans-serif">${text}</text>
    <text x="200" y="130" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14" font-family="sans-serif">${desc}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generateStoryboardPreview(storyboardId: string) {
  const session = await requireAuth();

  const storyboard = await prisma.storyboard.findFirst({
    where: {
      id: storyboardId,
      project: { userId: session.user.id },
    },
  });
  if (!storyboard) return { error: "分镜不存在" };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const placeholderUrl = createPlaceholderImageUrl(
      storyboard.sceneNumber,
      storyboard.description
    );
    await prisma.storyboard.update({
      where: { id: storyboardId },
      data: { imageUrl: placeholderUrl },
    });
    revalidatePath(`/create/${storyboard.projectId}`);
    return { success: true, imageUrl: placeholderUrl };
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const prompt = `电影场景分镜图，${storyboard.cameraType ?? "中景"}镜头：${storyboard.description}。${storyboard.action ?? ""}。风格：电影级画质，专业分镜板风格。`;

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) throw new Error("未返回图片");

    await prisma.storyboard.update({
      where: { id: storyboardId },
      data: { imageUrl },
    });

    revalidatePath(`/create/${storyboard.projectId}`);
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Storyboard preview generation failed:", error);
    const placeholderUrl = createPlaceholderImageUrl(
      storyboard.sceneNumber,
      storyboard.description
    );
    await prisma.storyboard.update({
      where: { id: storyboardId },
      data: { imageUrl: placeholderUrl },
    });
    revalidatePath(`/create/${storyboard.projectId}`);
    return { success: true, imageUrl: placeholderUrl };
  }
}
