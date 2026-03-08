import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { Plus, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project/ProjectCard";

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
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
