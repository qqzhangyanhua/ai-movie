"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StepIndicator, type StepKey } from "./StepIndicator";

const VALID_STEPS: StepKey[] = [
  "characters",
  "script",
  "storyboard",
  "generate",
  "result",
];

function parseStep(stepParam: string | null): StepKey {
  if (stepParam && VALID_STEPS.includes(stepParam as StepKey)) {
    return stepParam as StepKey;
  }
  return "characters";
}

type CreationWizardProps = {
  projectId: string;
  initialStep: StepKey;
  children: Record<StepKey, React.ReactNode>;
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

  const stepContent = children[currentStep] ?? children.characters;

  return (
    <div className="space-y-8">
      <StepIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      <div className="min-h-[200px]">{stepContent}</div>
    </div>
  );
}
