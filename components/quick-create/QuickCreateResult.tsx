"use client";

import { useRouter } from "next/navigation";
import { Download, Share2, Edit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type QuickCreateResultProps = {
  projectId: string;
  videoUrl: string;
  title: string;
};

export function QuickCreateResult({
  projectId,
  videoUrl,
  title,
}: QuickCreateResultProps) {
  const router = useRouter();

  function handleDownload() {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `${title}.mp4`;
    link.click();
    toast.success("视频下载已开始");
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title,
          text: `查看我用 AI 制作的视频：${title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制到剪贴板");
    }
  }

  function handleEdit() {
    router.push(`/create/${projectId}?step=script`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-6 text-primary" />
            <CardTitle>视频生成成功！</CardTitle>
          </div>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <video
              src={videoUrl}
              controls
              className="size-full"
              preload="metadata"
            >
              您的浏览器不支持视频播放
            </video>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 size-4" />
              下载视频
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="mr-2 size-4" />
              分享
            </Button>
            <Button onClick={handleEdit} variant="outline" className="flex-1">
              <Edit className="mr-2 size-4" />
              高级编辑
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-primary/5 p-4 text-center">
        <p className="text-sm text-primary">
          提示：您可以点击"高级编辑模式"来调整分镜脚本、更换角色或修改电影细节。
        </p>
      </div>
    </div>
  );
}
