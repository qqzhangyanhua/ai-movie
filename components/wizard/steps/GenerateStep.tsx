"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Play, RefreshCw, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProgressTracker } from "@/components/video/ProgressTracker";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import { startVideoGeneration, simulateVideoCompletion } from "@/lib/actions/video";
import type { TaskStatus } from "@prisma/client";

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
  const { data, connected } = useTaskProgress(
    projectId,
    isGenerating || videoStatus === "PROCESSING"
  );

  const hasStarted = videoStatus !== null && videoStatus !== "PENDING";
  const isCompleted = videoStatus === "COMPLETED" && videoUrl;
  const isFailed = videoStatus === "FAILED";

  async function handleStart() {
    const result = await startVideoGeneration(projectId, {
      subtitles: subtitlesEnabled,
    });
    if (result.error) {
      return;
    }
    router.refresh();
  }

  async function handleSimulate() {
    await simulateVideoCompletion(projectId);
    router.refresh();
  }

  function handleViewResult() {
    router.push(`/create/${projectId}?step=result`);
  }

  if (storyboardCount === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          请先完成分镜步骤，再生成视频。
        </p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">视频已生成完成，可以查看结果。</p>
        <div className="flex gap-3">
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
        <p className="text-destructive">视频生成失败，请重试。</p>
        <Button onClick={handleStart}>
          <RefreshCw className="mr-2 size-4" />
          重新生成
        </Button>
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
              <Label>字幕</Label>
              <p className="text-sm text-muted-foreground">
                根据剧本对白生成字幕并叠加到视频中
              </p>
            </div>
            <Button
              variant={subtitlesEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            >
              {subtitlesEnabled ? "启用字幕" : "关闭字幕"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleStart}>
            <Play className="mr-2 size-4" />
            开始生成
          </Button>
          <Button
            variant="outline"
            onClick={handleSimulate}
            className="text-muted-foreground"
          >
            <FlaskConical className="mr-2 size-4" />
            模拟完成（开发用）
          </Button>
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
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleSimulate}
          className="text-muted-foreground"
        >
          <FlaskConical className="mr-2 size-4" />
          模拟完成（开发用）
        </Button>
      </div>
    </div>
  );
}
