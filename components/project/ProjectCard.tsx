"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Film, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteProject } from "@/lib/actions/project";
import type { ProjectStatus } from "@prisma/client";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "草稿",
  SCRIPT_READY: "剧本就绪",
  STORYBOARD_READY: "分镜就绪",
  GENERATING: "生成中",
  COMPLETED: "已完成",
  FAILED: "失败",
};

const STATUS_VARIANTS: Record<
  ProjectStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SCRIPT_READY: "outline",
  STORYBOARD_READY: "outline",
  GENERATING: "default",
  COMPLETED: "default",
  FAILED: "destructive",
};

export type StepKey =
  | "characters"
  | "script"
  | "storyboard"
  | "generate"
  | "result";

function getStepForStatus(status: ProjectStatus): StepKey {
  switch (status) {
    case "DRAFT":
      return "characters";
    case "SCRIPT_READY":
      return "script";
    case "STORYBOARD_READY":
      return "storyboard";
    case "GENERATING":
      return "generate";
    case "COMPLETED":
      return "result";
    case "FAILED":
      return "generate";
    default:
      return "characters";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: Date;
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const step = getStepForStatus(project.status);
  const href = `/create/${project.id}?step=${step}`;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await deleteProject(project.id);
    router.refresh();
  }

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-colors hover:bg-accent/50"
      )}
    >
      <Link href={href} className="block">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="size-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-base font-medium line-clamp-1">
              {project.title}
            </CardTitle>
          </div>
          <Badge variant={STATUS_VARIANTS[project.status]}>
            {STATUS_LABELS[project.status]}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            更新于 {formatDate(project.updatedAt)}
          </p>
        </CardContent>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        aria-label="删除项目"
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}
