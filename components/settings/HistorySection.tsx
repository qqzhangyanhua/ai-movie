"use client";

import { Film, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerationHistoryItem } from "@/lib/actions/settings";
import type { TaskStatus } from "@prisma/client";

interface HistorySectionProps {
  items: GenerationHistoryItem[];
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "等待中",
  PROCESSING: "处理中",
  COMPLETED: "已完成",
  FAILED: "失败",
};

const STATUS_VARIANTS: Record<
  TaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  PROCESSING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistorySection({ items }: HistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="size-5" />
          生成记录
        </CardTitle>
        <CardDescription>最近 10 条视频生成记录</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Film className="size-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">暂无生成记录</p>
            <p className="mt-1 text-sm text-muted-foreground">
              创建项目并生成视频后，记录将显示在这里
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.projectTitle}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(item.createdAt)}
                    {item.duration !== null && (
                      <span className="ml-2">
                        时长 {formatDuration(item.duration)}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[item.status]} className="shrink-0">
                  {STATUS_LABELS[item.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
