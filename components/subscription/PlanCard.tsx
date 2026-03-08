"use client";

import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export type PlanType = "FREE" | "MONTHLY" | "YEARLY";

export interface PlanCardProps {
  plan: PlanType;
  name: string;
  price: string;
  features: string[];
  isCurrent: boolean;
  isRecommended?: boolean;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
}

export function PlanCard({
  plan,
  name,
  price,
  features,
  isCurrent,
  isRecommended = false,
  onUpgrade,
  isUpgrading = false,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isRecommended && "border-primary shadow-md",
        isCurrent && "ring-2 ring-primary"
      )}
    >
      {isRecommended && (
        <Badge
          variant="default"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2"
        >
          推荐
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          {isCurrent && (
            <Badge variant="secondary" className="text-xs">
              当前方案
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{price}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {!isCurrent && plan !== "FREE" && onUpgrade && (
          <Button
            className={cn(buttonVariants(), "mt-auto w-full")}
            onClick={onUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? "升级中..." : "升级"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
