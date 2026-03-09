"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type ProjectStatus = "DRAFT" | "GENERATING" | "SCRIPT_READY" | "STORYBOARD_READY" | "COMPLETED" | "FAILED";

type ProgressData = {
  project: { id: string; status: ProjectStatus; title: string } | null;
  scenes: Array<{ id: string; sceneNumber: number; status: string; progress: number }>;
  video: { id: string; status: string; progress: number; videoUrl: string | null } | null;
};

const STEPS = [
  { key: "DRAFT", label: "准备中" },
  { key: "GENERATING", label: "生成脚本" },
  { key: "SCRIPT_READY", label: "创建分镜" },
  { key: "STORYBOARD_READY", label: "渲染视频" },
  { key: "COMPLETED", label: "完成" },
];

export function QuickCreateProgress({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/projects/${projectId}/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          setProgress(data);

          if (data.project?.status === "COMPLETED") {
            eventSource.close();
            setTimeout(() => {
              router.push(`/create/${projectId}/result`);
            }, 1500);
          }

          if (data.project?.status === "FAILED") {
            eventSource.close();
            setError("视频生成失败，请重试");
          }
        }
      } catch (err) {
        console.error("Parse progress error:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError("连接中断，请刷新页面");
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, router]);

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="size-6 text-destructive" />
            <CardTitle>生成失败</CardTitle>
          </div>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            返回首页
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const currentStatus = progress.project?.status || "DRAFT";
  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStatus);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>正在生成视频</CardTitle>
        <CardDescription>{progress.project?.title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">总体进度</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isCompleted && (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                )}
                {isCurrent && (
                  <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                )}
                {isPending && (
                  <div className="size-5 shrink-0 rounded-full border-2 border-muted" />
                )}
                <span
                  className={`text-sm ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {currentStatus === "COMPLETED" && (
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm font-medium text-primary">
              视频生成完成！正在跳转...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
