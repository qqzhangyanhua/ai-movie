"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";

export async function getVideoDownloadUrl(videoId: string) {
  const session = await requireAuth();

  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      project: {
        userId: session.user.id,
      },
    },
  });

  if (!video || !video.videoUrl) {
    return { error: "视频不存在" };
  }

  try {
    const downloadUrl = await getDownloadUrl(session.user.id, video.videoUrl);
    return { url: downloadUrl };
  } catch (error) {
    return { error: "生成下载链接失败" };
  }
}
