"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "./PlanCard";
import { upgradePlan } from "@/lib/actions/subscription";
import type { Plan } from "@prisma/client";

interface PlanSelectorProps {
  currentPlan: Plan;
}

const PLAN_FEATURES: Record<
  Plan,
  { name: string; price: string; features: string[] }
> = {
  FREE: {
    name: "免费版",
    price: "免费",
    features: [
      "最多 3 个项目",
      "每月最多 5 个视频",
      "最多 5 个角色",
    ],
  },
  MONTHLY: {
    name: "月付版",
    price: "¥29/月",
    features: [
      "最多 20 个项目",
      "每月最多 50 个视频",
      "最多 30 个角色",
    ],
  },
  YEARLY: {
    name: "年付版",
    price: "¥249/年",
    features: [
      "无限项目",
      "无限视频",
      "无限角色",
      "相当于月付 7 折",
    ],
  },
};

export function PlanSelector({ currentPlan }: PlanSelectorProps) {
  const router = useRouter();
  const [upgradingPlan, setUpgradingPlan] = useState<"MONTHLY" | "YEARLY" | null>(
    null
  );

  async function handleUpgrade(plan: "MONTHLY" | "YEARLY") {
    setUpgradingPlan(plan);
    try {
      const result = await upgradePlan(plan);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        console.error(result.error);
      }
    } finally {
      setUpgradingPlan(null);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {(["FREE", "MONTHLY", "YEARLY"] as const).map((plan) => {
        const config = PLAN_FEATURES[plan];
        return (
          <PlanCard
            key={plan}
            plan={plan}
            name={config.name}
            price={config.price}
            features={config.features}
            isCurrent={currentPlan === plan}
            isRecommended={plan === "YEARLY"}
            onUpgrade={
              plan !== "FREE" ? () => handleUpgrade(plan) : undefined
            }
            isUpgrading={upgradingPlan === plan}
          />
        );
      })}
    </div>
  );
}
