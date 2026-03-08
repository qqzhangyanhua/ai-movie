import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

const PLAN_LIMITS: Record<
  Plan,
  { maxProjects: number | null; maxVideosPerMonth: number | null; maxCharacters: number | null }
> = {
  FREE: { maxProjects: 3, maxVideosPerMonth: 5, maxCharacters: 5 },
  MONTHLY: { maxProjects: 20, maxVideosPerMonth: 50, maxCharacters: 30 },
  YEARLY: { maxProjects: null, maxVideosPerMonth: null, maxCharacters: null },
};

const ACTION_MESSAGES: Record<
  "project" | "video" | "character",
  string
> = {
  project: "项目数量",
  video: "本月视频数量",
  character: "角色数量",
};

export async function assertPlanAllowed(
  userId: string,
  action: "project" | "video" | "character"
): Promise<void> {
  const [user, projectCount, characterCount, videoCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    prisma.project.count({ where: { userId } }),
    prisma.character.count({ where: { userId } }),
    prisma.video.count({
      where: {
        project: { userId },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
          ),
        },
      },
    }),
  ]);

  if (!user) {
    throw new Error("用户不存在");
  }

  const limits = PLAN_LIMITS[user.plan];
  let current: number;
  let limit: number | null;

  switch (action) {
    case "project":
      current = projectCount;
      limit = limits.maxProjects;
      break;
    case "video":
      current = videoCount;
      limit = limits.maxVideosPerMonth;
      break;
    case "character":
      current = characterCount;
      limit = limits.maxCharacters;
      break;
    default:
      return;
  }

  if (limit !== null && current >= limit) {
    throw new Error(
      `您的会员等级已达到${ACTION_MESSAGES[action]}限制，请升级会员以继续使用。`
    );
  }
}
