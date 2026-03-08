"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanSelector } from "@/components/subscription/PlanSelector";
import { UsageStats } from "@/components/subscription/UsageStats";
import type { UserPlanInfo } from "@/lib/actions/subscription";
import type { Plan } from "@prisma/client";

interface SubscriptionSectionProps {
  planInfo: UserPlanInfo;
}

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "免费版",
  MONTHLY: "月付版",
  YEARLY: "年付版",
};

export function SubscriptionSection({ planInfo }: SubscriptionSectionProps) {
  const { plan } = planInfo;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>当前方案</CardTitle>
              <CardDescription>您的会员方案及使用量</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {PLAN_LABELS[plan]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <UsageStats info={planInfo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>会员方案</CardTitle>
          <CardDescription>升级会员享受更多权益</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanSelector currentPlan={plan} />
        </CardContent>
      </Card>
    </div>
  );
}
