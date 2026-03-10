"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, Home, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <PartyPopper className="size-6 text-green-600 dark:text-green-400" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-200">
              视频制作完成
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              你的视频已成功生成，可以预览、下载或分享。
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <VideoPlayer videoUrl={videoUrl} posterUrl={posterUrl} />
      </motion.div>

      {videoId && (
        <SubtitleToggle videoId={videoId} subtitleUrl={subtitleUrl} />
      )}

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">{projectTitle}</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {duration != null && (
            <div>
              <dt className="text-muted-foreground">时长</dt>
              <dd className="font-medium">{formatDuration(duration)}</dd>
            </div>
          )}
          {resolution && (
            <div>
              <dt className="text-muted-foreground">分辨率</dt>
              <dd className="font-medium">{resolution}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">创建时间</dt>
            <dd className="font-medium">{formatDate(createdAt)}</dd>
          </div>
        </dl>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-wrap gap-3"
      >
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
        {videoId && <ShareDialog videoId={videoId} />}
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
      </motion.div>
    </div>
  );
}
