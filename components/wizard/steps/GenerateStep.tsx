"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RefreshCw,
  FlaskConical,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProgressTracker } from "@/components/video/ProgressTracker";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import {
  startVideoGeneration,
  simulateVideoCompletion,
} from "@/lib/actions/video";
import type { TaskStatus } from "@prisma/client";

const IS_DEV = process.env.NODE_ENV === "development";

interface GenerateStepProps {
  projectId: string;
  videoId: string | null;
  videoStatus: TaskStatus | null;
  videoUrl: string | null;
  subtitleUrl: string | null;
  storyboardCount: number;
  isGenerating: boolean;
}

export function GenerateStep({
  projectId,
  videoId,
  videoStatus,
  videoUrl,
  subtitleUrl,
  storyboardCount,
  isGenerating,
}: GenerateStepProps) {
  const router = useRouter();
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [starting, setStarting] = useState(false);
  const { data, connected } = useTaskProgress(
    projectId,
    isGenerating || videoStatus === "PROCESSING"
  );

  const hasStarted = videoStatus !== null && videoStatus !== "PENDING";
  const isCompleted = videoStatus === "COMPLETED" && videoUrl;
  const isFailed = videoStatus === "FAILED";

  async function handleStart() {
    setStarting(true);
    try {
      const result = await startVideoGeneration(projectId, {
        subtitles: subtitlesEnabled,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error("启动视频生成失败，请重试");
    } finally {
      setStarting(false);
    }
  }

  async function handleSimulate() {
    await simulateVideoCompletion(projectId);
    router.refresh();
  }

  function handlePrev() {
    router.push(`/create/${projectId}?step=storyboard`);
  }

  function handleViewResult() {
    router.push(`/create/${projectId}?step=result`);
  }

  if (storyboardCount === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Film className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-medium">需要先完成分镜</h3>
          <p className="text-sm text-muted-foreground">
            请先回到分镜步骤完成创作，才能生成视频。
          </p>
        </div>
        <div className="flex justify-start">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          视频已生成完成，可以查看结果。
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
          <Button onClick={handleViewResult}>
            查看结果
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          视频生成失败，请重试。
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
          <Button onClick={handleStart} disabled={starting}>
            <RefreshCw className="mr-2 size-4" />
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          将根据 {storyboardCount} 个分镜生成视频。点击下方按钮开始生成。
        </p>
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="subtitle-switch">字幕</Label>
              <p className="text-sm text-muted-foreground">
                根据剧本对白生成字幕并叠加到视频中
              </p>
            </div>
            <Switch
              id="subtitle-switch"
              checked={subtitlesEnabled}
              onCheckedChange={setSubtitlesEnabled}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStart} disabled={starting}>
              {starting ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <Play className="mr-2 size-4" />
              )}
              开始生成
            </Button>
            {IS_DEV && (
              <Button
                variant="outline"
                onClick={handleSimulate}
                className="text-muted-foreground"
              >
                <FlaskConical className="mr-2 size-4" />
                模拟完成
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {connected && (
        <p className="text-sm text-muted-foreground">实时进度已连接</p>
      )}
      <ProgressTracker video={data.video} clips={data.clips} />
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handlePrev}>
          <ChevronLeft className="mr-2 size-4" />
          上一步
        </Button>
        {IS_DEV && (
          <Button
            variant="outline"
            onClick={handleSimulate}
            className="text-muted-foreground"
          >
            <FlaskConical className="mr-2 size-4" />
            模拟完成
          </Button>
        )}
      </div>
    </div>
  );
}
