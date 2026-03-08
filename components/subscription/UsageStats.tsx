"use client";

import { FolderOpen, Video, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserPlanInfo } from "@/lib/actions/subscription";

interface UsageStatsProps {
  info: UserPlanInfo;
}

function formatLimit(value: number | null): string {
  return value === null ? "无限" : String(value);
}

function getProgressPercent(current: number, limit: number | null): number {
  if (limit === null) return 0;
  if (limit === 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

export function UsageStats({ info }: UsageStatsProps) {
  const { projectCount, videoCount, characterCount, limits } = info;

  const items = [
    {
      label: "项目数",
      current: projectCount,
      limit: limits.maxProjects,
      icon: FolderOpen,
    },
    {
      label: "本月视频数",
      current: videoCount,
      limit: limits.maxVideosPerMonth,
      icon: Video,
    },
    {
      label: "角色数",
      current: characterCount,
      limit: limits.maxCharacters,
      icon: Users,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>使用量统计</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map(({ label, current, limit, icon: Icon }) => {
          const percent = getProgressPercent(current, limit);
          const hasLimit = limit !== null;

          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </span>
                <span className="text-muted-foreground">
                  {current} / {formatLimit(limit)}
                </span>
              </div>
              {hasLimit ? (
                <Progress value={percent} className="h-2" />
              ) : (
                <div className="h-2 rounded-full bg-muted" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
