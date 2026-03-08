"use server";

import { prisma } from "@/lib/prisma";

export type PublicVideoResult =
  | {
      video: {
        id: string;
        videoUrl: string | null;
        posterUrl: string | null;
        duration: number | null;
        resolution: string | null;
        createdAt: Date;
      };
      project: {
        title: string;
        description: string | null;
      };
      author: {
        username: string;
      };
    }
  | { error: string };

/**
 * 公开接口，无需登录。
 * 查询已完成视频的公开信息（Video + Project + User.username）。
 */
export async function getPublicVideo(videoId: string): Promise<PublicVideoResult> {
  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      videoUrl: true,
      posterUrl: true,
      duration: true,
      resolution: true,
      createdAt: true,
      project: {
        select: {
          title: true,
          description: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!video) {
    return { error: "视频不存在或未完成" };
  }

  return {
    video: {
      id: video.id,
      videoUrl: video.videoUrl,
      posterUrl: video.posterUrl,
      duration: video.duration,
      resolution: video.resolution,
      createdAt: video.createdAt,
    },
    project: {
      title: video.project.title,
      description: video.project.description,
    },
    author: {
      username: video.project.user.username,
    },
  };
}

/**
 * 预留：未来可统计分享次数
 */
export async function incrementShareCount(_videoId: string): Promise<void> {
  // TODO: 实现分享次数统计
  return;
}
