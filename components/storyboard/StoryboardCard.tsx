"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { Storyboard } from "@prisma/client";

interface StoryboardCardProps {
  storyboard: Storyboard;
  onEdit: () => void;
  onDelete: () => void;
}

export function StoryboardCard({
  storyboard,
  onEdit,
  onDelete,
}: StoryboardCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4">
        {storyboard.imageUrl && (
          <div className="relative h-24 w-32 shrink-0 bg-muted">
            <img
              src={storyboard.imageUrl}
              alt={`场景 ${storyboard.sceneNumber}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="font-semibold">场景 {storyboard.sceneNumber}</span>
            <div className="flex gap-1">
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
          <CardContent className="space-y-2">
            <p className="line-clamp-2 text-sm">{storyboard.description}</p>
            {storyboard.action && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {storyboard.action}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {storyboard.cameraType && (
                <Badge variant="secondary" className="text-xs">
                  {storyboard.cameraType}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {storyboard.duration}秒
              </Badge>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
