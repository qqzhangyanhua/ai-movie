"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Film, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScriptTemplate } from "@/lib/data/script-templates";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

const CATEGORY_STYLES: Record<
  string,
  { badge: string; border: string }
> = {
  爱情: { badge: "bg-pink-500/15 text-pink-600 border-pink-500/30", border: "border-l-pink-500" },
  校园: { badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", border: "border-l-emerald-500" },
  科幻: { badge: "bg-blue-500/15 text-blue-600 border-blue-500/30", border: "border-l-blue-500" },
  悬疑: { badge: "bg-violet-500/15 text-violet-600 border-violet-500/30", border: "border-l-violet-500" },
  武侠: { badge: "bg-amber-500/15 text-amber-600 border-amber-500/30", border: "border-l-amber-500" },
  冒险: { badge: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", border: "border-l-yellow-500" },
};

const DEFAULT_STYLE = {
  badge: "bg-muted text-muted-foreground",
  border: "border-l-muted-foreground",
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

function getTotalDuration(scenes: ScriptTemplate["scenes"]): number {
  return scenes.reduce((sum, s) => sum + s.duration, 0);
}

type TemplateCardProps = {
  template: ScriptTemplate;
};

export function TemplateCard({ template }: TemplateCardProps) {
  const style = getCategoryStyle(template.category);
  const totalDuration = getTotalDuration(template.scenes);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-l-4 transition-colors hover:bg-accent/30",
        style.border
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2">
            {template.title}
          </h3>
          <Badge
            variant="outline"
            className={cn("shrink-0 border", style.badge)}
          >
            {template.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Film className="size-3.5" />
            {template.scenes.length} 场景
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {totalDuration} 秒
          </span>
        </div>
        <TemplatePreviewDialog template={template}>
          <Button className="w-full" size="sm">
            <Sparkles className="size-4" />
            使用模板
          </Button>
        </TemplatePreviewDialog>
      </CardContent>
    </Card>
  );
}
