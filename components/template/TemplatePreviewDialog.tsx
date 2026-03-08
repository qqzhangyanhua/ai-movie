"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScriptTemplate, ScriptScene } from "@/lib/data/script-templates";
import { cloneTemplateToProject } from "@/lib/actions/template";

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  爱情: "bg-pink-500/15 text-pink-600 border-pink-500/30",
  校园: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  科幻: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  悬疑: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  武侠: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  冒险: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
};

type TemplatePreviewDialogProps = {
  template: ScriptTemplate;
  children: React.ReactNode;
};

function SceneItem({ scene }: { scene: ScriptScene }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">场景 {scene.sceneNumber}</span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {scene.cameraType}
          </Badge>
          <span>{scene.duration} 秒</span>
        </div>
      </div>
      <p className="text-muted-foreground">{scene.description}</p>
      {scene.action && (
        <p className="mt-1 text-muted-foreground">{scene.action}</p>
      )}
      {scene.dialogue && (
        <p className="mt-1 italic text-foreground/80">「{scene.dialogue}」</p>
      )}
    </div>
  );
}

export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalDuration = template.scenes.reduce((sum, s) => sum + s.duration, 0);
  const badgeStyle = CATEGORY_BADGE_STYLES[template.category] ?? "bg-muted";

  async function handleCreateProject() {
    setLoading(true);
    setError(null);
    const result = await cloneTemplateToProject(template.id);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.projectId) {
      setOpen(false);
      router.push(`/create/${result.projectId}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className={cn("border", badgeStyle)}>
              {template.category}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Film className="size-3.5" />
              {template.scenes.length} 场景
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-3.5" />
              {totalDuration} 秒
            </span>
          </div>
        </DialogHeader>
        <p className="text-muted-foreground">{template.description}</p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">场景预览</h4>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            {template.scenes.map((scene) => (
              <SceneItem key={scene.sceneNumber} scene={scene} />
            ))}
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button
          className="w-full"
          onClick={handleCreateProject}
          disabled={loading}
        >
          {loading ? "创建中…" : "使用此模板创建项目"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
