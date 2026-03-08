"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ShareDialog } from "@/components/video/ShareDialog";
import { SubtitleToggle } from "@/components/video/SubtitleToggle";

interface ResultStepProps {
  projectId: string;
  videoId: string | null;
  videoUrl: string | null;
  subtitleUrl: string | null;
  posterUrl: string | null;
  duration: number | null;
  resolution: string | null;
  projectTitle: string;
  createdAt: Date;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function ResultStep({
  projectId,
  videoId,
  videoUrl,
  subtitleUrl,
  posterUrl,
  duration,
  resolution,
  projectTitle,
  createdAt,
}: ResultStepProps) {
  const router = useRouter();

  if (!videoUrl) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          视频还未生成，请先完成前面的步骤。
        </p>
        <Link
          href={`/create/${projectId}?step=generate`}
          className={buttonVariants({ variant: "outline" })}
        >
          前往生成步骤
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VideoPlayer videoUrl={videoUrl} posterUrl={posterUrl} />

      {videoId && (
        <SubtitleToggle videoId={videoId} subtitleUrl={subtitleUrl} />
      )}

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">{projectTitle}</h3>
        <dl className="grid gap-2 text-sm text-muted-foreground">
          {duration != null && (
            <div className="flex gap-2">
              <dt>时长：</dt>
              <dd>{formatDuration(duration)}</dd>
            </div>
          )}
          {resolution && (
            <div className="flex gap-2">
              <dt>分辨率：</dt>
              <dd>{resolution}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt>创建时间：</dt>
            <dd>{formatDate(createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={videoUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          <Download className="mr-2 size-4" />
          下载视频
        </a>
        {videoId && (
          <ShareDialog videoId={videoId} />
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/create/${projectId}?step=generate`)}
        >
          <RefreshCw className="mr-2 size-4" />
          重新生成
        </Button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Home className="mr-2 size-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
