"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { Storyboard } from "@prisma/client";

const CAMERA_OPTION_COLORS: Record<string, string> = {
  远景: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  中景: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  特写: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
};

interface StoryboardCardProps {
  storyboard: Storyboard;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function StoryboardCard({
  storyboard,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StoryboardCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cameraColor =
    storyboard.cameraType
      ? CAMERA_OPTION_COLORS[storyboard.cameraType] ?? "bg-muted"
      : "bg-muted";

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
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
              <span className="text-xs font-medium">
                场景 {storyboard.sceneNumber}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-3 pr-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
            <span className="text-lg font-semibold">
              场景 {storyboard.sceneNumber}
            </span>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label="编辑"
              >
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
            <p
              className={`text-sm ${expanded ? "" : "line-clamp-2"} cursor-pointer`}
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
                <Badge
                  variant="outline"
                  className={`text-xs ${cameraColor}`}
                >
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
