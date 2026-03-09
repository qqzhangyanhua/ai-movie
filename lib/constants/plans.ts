import type { Plan } from "@prisma/client";

export const MB_PER_GB = 1024;
export const UNLIMITED_VIDEOS = 2147483647;

export type PlanLimit = {
  videosPerMonth: number | null;
  storageLimitMB: number;
  maxResolution: string;
};

export const PLAN_LIMITS: Record<Plan, PlanLimit> = {
  FREE: {
    videosPerMonth: 3,
    storageLimitMB: 100,
    maxResolution: "720p",
  },
  MONTHLY: {
    videosPerMonth: 30,
    storageLimitMB: 5 * MB_PER_GB,
    maxResolution: "1080p",
  },
  YEARLY: {
    videosPerMonth: null,
    storageLimitMB: 50 * MB_PER_GB,
    maxResolution: "4K",
  },
};

export function getPlanVideosRemaining(plan: Plan): number {
  const limit = PLAN_LIMITS[plan].videosPerMonth;
  return limit === null ? UNLIMITED_VIDEOS : limit;
}

export function isUnlimitedPlan(plan: Plan): boolean {
  return PLAN_LIMITS[plan].videosPerMonth === null;
}
