"use client";

import { useState } from "react";
import {
  Heart,
  GraduationCap,
  Rocket,
  Mail,
  Sword,
  Map,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { scriptTemplates, type ScriptTemplate } from "@/lib/data/script-templates";
import { applyScriptTemplate } from "@/lib/actions/script";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  爱情: Heart,
  校园: GraduationCap,
  科幻: Rocket,
  悬疑: Mail,
  武侠: Sword,
  冒险: Map,
};

interface ScriptTemplateGridProps {
  projectId: string;
  onApplied?: () => void;
}

export function ScriptTemplateGrid({
  projectId,
  onApplied,
}: ScriptTemplateGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleApply(template: ScriptTemplate) {
    setLoading(true);
    const result = await applyScriptTemplate(projectId, template.id);
    setLoading(false);
    if (result.success) {
      onApplied?.();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scriptTemplates.map((template) => {
        const Icon = CATEGORY_ICONS[template.category] ?? Map;
        const isSelected = selectedId === template.id;

        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => setSelectedId(template.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{template.title}</CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <Icon className="size-3" />
                  {template.category}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-xs text-muted-foreground">
                {template.scenes.length} 个场景
              </p>
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                className="w-full"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply(template);
                }}
              >
                使用此模板
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
