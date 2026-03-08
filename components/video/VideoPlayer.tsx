"use client";

import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string | null;
  posterUrl?: string | null;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  posterUrl,
  className,
}: VideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Film className="size-12" />
          <p className="text-sm">暂无视频</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "aspect-video w-full overflow-hidden rounded-lg border bg-black",
        className
      )}
    >
      <video
        className="h-full w-full object-contain"
        controls
        poster={posterUrl ?? undefined}
        src={videoUrl}
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}
