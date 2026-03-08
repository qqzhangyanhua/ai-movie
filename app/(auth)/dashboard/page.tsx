import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { Plus, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "草稿",
  SCRIPT_READY: "脚本就绪",
  STORYBOARD_READY: "分镜就绪",
  GENERATING: "生成中",
  COMPLETED: "已完成",
  FAILED: "失败",
};

const STATUS_VARIANTS: Record<ProjectStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SCRIPT_READY: "outline",
  STORYBOARD_READY: "outline",
  GENERATING: "default",
  COMPLETED: "default",
  FAILED: "destructive",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的电影</h1>
          <p className="text-muted-foreground">管理您的微电影项目</p>
        </div>
        <Link href="/create" className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
          <Plus className="size-4" />
          创建项目
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardHeader>
            <Film className="mx-auto size-12 text-muted-foreground" />
            <CardTitle className="text-center">还没有项目</CardTitle>
            <CardDescription className="text-center">
              创建您的第一个微电影项目，上传照片，让 AI 帮您生成精彩脚本
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/create" className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
              <Plus className="size-4" />
              创建项目
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/${project.id}`}>
              <Card
                className={cn(
                  "transition-colors hover:bg-accent/50",
                  "cursor-pointer"
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {project.title}
                  </CardTitle>
                  <Badge variant={STATUS_VARIANTS[project.status]}>
                    {STATUS_LABELS[project.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    更新于 {formatDate(project.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
