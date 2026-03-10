"use client";

import { Users, BookOpen, LayoutGrid, Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, stepIndex, type StepKey } from "@/lib/wizard-steps";

const STEP_ICONS: Record<
  StepKey,
  React.ComponentType<{ className?: string }>
> = {
  characters: Users,
  script: BookOpen,
  storyboard: LayoutGrid,
  generate: Play,
  result: CheckCircle,
};

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
  const currentIdx = stepIndex(currentStep);

  return (
    <nav aria-label="创作步骤" className="w-full overflow-x-auto">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const Icon = STEP_ICONS[step.key];
          const isCurrent = step.key === currentStep;
          const isCompleted = completedSteps.has(step.key);
          const isClickable = isCompleted || isCurrent;

          const lineCompleted =
            completedSteps.has(step.key) &&
            (completedSteps.has(STEPS[index + 1]?.key) ||
              STEPS[index + 1]?.key === currentStep);

          return (
            <li
              key={step.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors sm:gap-1.5",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!isClickable}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 transition-colors sm:size-10",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      !isCurrent &&
                      "border-primary/50 bg-primary/10 text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted-foreground/30 bg-muted/50"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="size-4 sm:size-5" />
                  ) : (
                    <Icon className="size-4 sm:size-5" />
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isCurrent && "text-primary",
                    isCompleted && !isCurrent && "text-primary/80",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 min-w-[12px] sm:mx-2 sm:min-w-[24px]",
                    lineCompleted ? "bg-primary/50" : "bg-muted-foreground/20"
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

export type { StepKey };
