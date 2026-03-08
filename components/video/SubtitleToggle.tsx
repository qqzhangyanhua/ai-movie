"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toggleSubtitles } from "@/lib/actions/subtitle";

interface SubtitleToggleProps {
  videoId: string;
  subtitleUrl: string | null;
}

export function SubtitleToggle({ videoId, subtitleUrl }: SubtitleToggleProps) {
  const router = useRouter();
  const enabled = !!subtitleUrl;

  async function handleToggle() {
    await toggleSubtitles(videoId, !enabled);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label>字幕</Label>
        <p className="text-sm text-muted-foreground">
          {enabled ? "已启用字幕" : "关闭字幕"}
        </p>
      </div>
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
      >
        {enabled ? "关闭字幕" : "启用字幕"}
      </Button>
    </div>
  );
}
