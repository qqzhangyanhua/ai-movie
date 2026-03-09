import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { Plus, Film, Zap, Video, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project/ProjectCard";
import { PLAN_LIMITS } from "@/lib/constants/plans";

export default async function DashboardPage() {
  const session = await requireAuth();

  const [projects, user] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        videosRemaining: true,
        videosUsed: true,
        storageUsed: true,
        storageLimit: true,
      },
    }),
  ]);

  const planLimit = user ? PLAN_LIMITS[user.plan] : null;
  const videosTotal = planLimit?.videosPerMonth ?? 0;
  const storagePercent = user
    ? Math.round((user.storageUsed / user.storageLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的电影</h1>
          <p className="text-muted-foreground">管理您的微电影项目</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/create/quick"
            className={cn(buttonVariants(), "inline-flex items-center gap-2")}
          >
            <Zap className="size-4 fill-current" />
            快速创建
          </Link>
          <Link
            href="/create"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2"
            )}
          >
            <Plus className="size-4" />
            高级创建
          </Link>
        </div>
      </div>

      {user && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">视频配额</CardTitle>
                <Video className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.videosRemaining}
                {videosTotal > 0 && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {videosTotal}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                本月剩余视频数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">存储空间</CardTitle>
                <HardDrive className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storagePercent}%
              </div>
              <p className="text-xs text-muted-foreground">
                已使用 {user.storageUsed} MB / {user.storageLimit} MB
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
            <div className="flex gap-3">
              <Link
                href="/create/quick"
                className={cn(buttonVariants(), "inline-flex items-center gap-2")}
              >
                <Zap className="size-4 fill-current" />
                快速创建
              </Link>
              <Link href="/create" className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-2")}>
                <Plus className="size-4" />
                普通创建
              </Link>
            </div>
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
