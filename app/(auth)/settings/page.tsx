import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/actions/subscription";
import { getGenerationHistory } from "@/lib/actions/settings";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, planInfo, historyItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        plan: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    getUserPlan(),
    getGenerationHistory(),
  ]);

  if (!user || !planInfo) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground">管理您的账户、会员和偏好</p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <SettingsTabs
          username={user.username}
          email={user.email}
          avatarUrl={user.avatarUrl}
          createdAt={user.createdAt}
          planInfo={planInfo}
          historyItems={historyItems ?? []}
        />
      </Suspense>
    </div>
  );
}
