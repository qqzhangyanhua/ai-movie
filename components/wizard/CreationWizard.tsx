"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { StepIndicator } from "./StepIndicator";
import { parseStep, type StepKey } from "@/lib/wizard-steps";

type CreationWizardProps = {
  projectId: string;
  initialStep: StepKey;
  children: React.ReactNode;
  completedSteps?: Set<StepKey>;
};

export function CreationWizard({
  projectId,
  initialStep,
  children,
  completedSteps = new Set(),
}: CreationWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStep = useMemo(() => {
    const stepParam = searchParams.get("step");
    if (!stepParam) return initialStep;
    return parseStep(stepParam);
  }, [searchParams, initialStep]);

  function goToStep(step: StepKey) {
    router.push(`/create/${projectId}?step=${step}`);
  }

  return (
    <div className="space-y-8">
      <StepIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
}
