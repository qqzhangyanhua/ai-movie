import type { Metadata } from "next";
import Link from "next/link";
import { Film, User, Calendar, Clock, Monitor, Sparkles, Download, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoActions } from "@/components/video/VideoActions";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ videoId: string }>;
};

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function toAbsoluteUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = getBaseUrl();
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

async function getPublicVideoData(videoId: string) {
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

  if (!video) return null;

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { videoId } = await params;
  const data = await getPublicVideoData(videoId);

  if (!data) {
    return {
      title: "视频不存在 | AI 微电影",
    };
  }

  const title = data.project.title;
  const description =
    data.project.description ?? "在 AI 微电影平台创作的精彩作品";
  const ogImage = toAbsoluteUrl(data.video.posterUrl);
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/movie/${videoId}`;

  return {
    title: `${title} | AI 微电影`,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      url: pageUrl,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function MovieSharePage({ params }: PageProps) {
  const { videoId } = await params;
  const data = await getPublicVideoData(videoId);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-zinc-800/50 p-6">
            <Film className="size-16 text-zinc-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">视频不存在</h1>
            <p className="max-w-sm text-zinc-400">
              该视频可能已被删除，或仍在生成中。请检查链接是否正确。
            </p>
          </div>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { video, project, author } = data;
  const createdAt = new Date(video.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatDuration = (seconds: number | null): string | null => {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 视频播放器 */}
        <div className="overflow-hidden rounded-xl border border-zinc-800/50 shadow-2xl shadow-black/50">
          <VideoPlayer
            videoUrl={video.videoUrl}
            posterUrl={video.posterUrl}
            className="border-0"
          />
        </div>

        {/* 视频操作按钮 */}
        <div className="mt-6">
          <VideoActions videoId={video.id} videoUrl={video.videoUrl} title={project.title} />
        </div>

        {/* 电影信息 */}
        <div className="mt-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-2 text-zinc-400">{project.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <User className="size-4" />
              {author.username}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="size-4" />
              {createdAt}
            </span>
            {video.duration != null && (
              <span className="flex items-center gap-2">
                <Clock className="size-4" />
                {formatDuration(video.duration)}
              </span>
            )}
            {video.resolution && (
              <span className="flex items-center gap-2">
                <Monitor className="size-4" />
                {video.resolution}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 text-center">
          <p className="mb-4 text-zinc-400">
            在 AI 微电影创建你自己的作品
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            <Sparkles className="size-4" />
            立即开始
          </Link>
        </div>
      </div>
    </div>
  );
}
