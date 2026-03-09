"use client";

import { useState } from "react";
import { Download, Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VideoActionsProps {
  videoId: string;
  videoUrl: string | null;
  title: string;
}

export function VideoActions({ videoId, videoUrl, title }: VideoActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/movie/${videoId}`
    : "";

  async function handleDownload() {
    if (!videoUrl) {
      toast.error("视频不可用");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("开始下载视频");
    } catch (error) {
      toast.error("下载失败");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("复制失败");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `观看我在 AI 微电影创作的作品：${title}`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setShareOpen(true);
        }
      }
    } else {
      setShareOpen(true);
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={!videoUrl}
          className="flex-1"
          variant="outline"
        >
          <Download className="mr-2 size-4" />
          下载视频
        </Button>
        <Button onClick={handleShare} className="flex-1" variant="outline">
          <Share2 className="mr-2 size-4" />
          分享
        </Button>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享视频</DialogTitle>
            <DialogDescription>
              复制链接分享给朋友，或在社交媒体上分享
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                {copied ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
