"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ImagePlus,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { generateStoryboardPreview } from "@/lib/actions/storyboard-preview";
import type { Storyboard } from "@prisma/client";
import type { StoryboardRoleIssue } from "./storyboard-role-utils";

const CAMERA_OPTION_COLORS: Record<string, string> = {
  远景: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  中景: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  特写:
    "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
};

interface StoryboardCardProps {
  storyboard: Storyboard;
  roleIssue?: StoryboardRoleIssue;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function StoryboardCard({
  storyboard,
  roleIssue,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StoryboardCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cameraColor = storyboard.cameraType
    ? CAMERA_OPTION_COLORS[storyboard.cameraType] ?? "bg-muted"
    : "bg-muted";
  const hasRoleIssue =
    !!roleIssue &&
    (roleIssue.missingCharacters || roleIssue.unknownCharacters.length > 0);

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-l-md bg-muted">
          {storyboard.imageUrl ? (
            <img
              src={storyboard.imageUrl}
              alt={`场景 ${storyboard.sceneNumber}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  await generateStoryboardPreview(storyboard.id);
                  setGenerating(false);
                  router.refresh();
                }}
              >
                <ImagePlus className="size-3" />
                {generating ? "生成中..." : "生成预览"}
              </Button>
              <span className="text-xs">场景 {storyboard.sceneNumber}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-3 pr-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">场景 {storyboard.sceneNumber}</span>
              {hasRoleIssue && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700"
                >
                  角色待修正
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                aria-label="上移"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                aria-label="下移"
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="编辑">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="删除"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            {hasRoleIssue && roleIssue && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {roleIssue.missingCharacters && (
                      <Badge className="bg-amber-600 text-white">
                        未分配角色
                      </Badge>
                    )}
                    {roleIssue.unknownCharacters.map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="border-destructive/40 bg-background text-destructive"
                      >
                        项目外角色：{name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <p
              className={`cursor-pointer text-sm ${expanded ? "" : "line-clamp-2"}`}
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "点击收起" : "点击展开"}
            >
              {storyboard.description}
            </p>
            {storyboard.action && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {storyboard.action}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {storyboard.cameraType && (
                <Badge variant="outline" className={`text-xs ${cameraColor}`}>
                  {storyboard.cameraType}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 size-3" />
                {storyboard.duration}秒
              </Badge>
              {storyboard.characters.length > 0 &&
                storyboard.characters.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
