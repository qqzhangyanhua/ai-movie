"use client";

import { Users, BookOpen, LayoutGrid, Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepKey =
  | "characters"
  | "script"
  | "storyboard"
  | "generate"
  | "result";

const STEPS: { key: StepKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "characters", label: "角色", icon: Users },
  { key: "script", label: "剧本", icon: BookOpen },
  { key: "storyboard", label: "分镜", icon: LayoutGrid },
  { key: "generate", label: "生成", icon: Play },
  { key: "result", label: "结果", icon: CheckCircle },
];

type StepIndicatorProps = {
  currentStep: StepKey;
  onStepClick: (step: StepKey) => void;
  completedSteps: Set<StepKey>;
};

export function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="创作步骤" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = step.key === currentStep;
          const isCompleted = completedSteps.has(step.key);
          const isFuture = index > currentIndex;
          const isClickable = isCompleted || isCurrent;

          return (
            <li
              key={step.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={isFuture}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-colors",
                  isClickable && "cursor-pointer hover:opacity-80",
                  isFuture && "cursor-not-allowed opacity-50"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={isFuture}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      !isCurrent &&
                      "border-primary/50 bg-primary/10 text-primary",
                    isFuture && "border-muted-foreground/30 bg-muted/50"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent && "text-primary",
                    isCompleted && !isCurrent && "text-primary/80",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 min-w-[24px]",
                    index < currentIndex
                      ? "bg-primary/50"
                      : "bg-muted-foreground/20"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
