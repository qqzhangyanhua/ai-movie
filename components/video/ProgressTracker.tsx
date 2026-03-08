"use client";

import { Loader2, Check, X, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ClipProgress {
  id: string;
  sceneNumber: number;
  status: string;
  progress: number;
}

interface VideoProgress {
  status: string;
  progress: number;
  videoUrl?: string | null;
}

interface ProgressTrackerProps {
  video: VideoProgress | null;
  clips: ClipProgress[];
}

function getStageStatus(status: string) {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "PROCESSING":
    case "PENDING":
    default:
      return status === "PROCESSING" ? "processing" : "pending";
  }
}

function StageIcon({
  status,
}: {
  status: "pending" | "processing" | "completed" | "failed";
}) {
  if (status === "completed") {
    return <Check className="size-4 text-green-600" />;
  }
  if (status === "failed") {
    return <X className="size-4 text-destructive" />;
  }
  if (status === "processing") {
    return <Loader2 className="size-4 animate-spin text-primary" />;
  }
  return <Clock className="size-4 text-muted-foreground" />;
}

export function ProgressTracker({ video, clips }: ProgressTrackerProps) {
  const clipItems = [...clips].sort((a, b) => a.sceneNumber - b.sceneNumber);

  const totalProgress =
    clipItems.length > 0 || video
      ? (clipItems.reduce((sum, c) => sum + c.progress, 0) +
          (video?.progress ?? 0)) /
        (clipItems.length + (video ? 1 : 0))
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">整体进度</span>
          <span className="font-medium">{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      <ul className="space-y-3">
        {clipItems.map((clip) => {
          const stageStatus = getStageStatus(clip.status);
          return (
            <li
              key={clip.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                stageStatus === "processing" && "border-primary/30 bg-primary/5"
              )}
            >
              <StageIcon status={stageStatus} />
              <div className="flex-1">
                <p className="font-medium">分镜 {clip.sceneNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {stageStatus === "completed"
                    ? "已完成"
                    : stageStatus === "failed"
                      ? "生成失败"
                      : stageStatus === "processing"
                        ? `${clip.progress}%`
                        : "等待中"}
                </p>
              </div>
              {stageStatus === "processing" && (
                <Progress value={clip.progress} className="h-1.5 w-20" />
              )}
            </li>
          );
        })}

        {video && (
          <li
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3",
              getStageStatus(video.status) === "processing" &&
                "border-primary/30 bg-primary/5"
            )}
          >
            <StageIcon status={getStageStatus(video.status)} />
            <div className="flex-1">
              <p className="font-medium">视频合成</p>
              <p className="text-xs text-muted-foreground">
                {getStageStatus(video.status) === "completed"
                  ? "已完成"
                  : getStageStatus(video.status) === "failed"
                    ? "合成失败"
                    : getStageStatus(video.status) === "processing"
                      ? `${video.progress}%`
                      : "等待中"}
              </p>
            </div>
            {getStageStatus(video.status) === "processing" && (
              <Progress value={video.progress} className="h-1.5 w-20" />
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
