export type StepKey =
  | "characters"
  | "script"
  | "storyboard"
  | "generate"
  | "result";

export const STEPS: { key: StepKey; label: string }[] = [
  { key: "characters", label: "角色" },
  { key: "script", label: "剧本" },
  { key: "storyboard", label: "分镜" },
  { key: "generate", label: "生成" },
  { key: "result", label: "结果" },
];

export const VALID_STEP_KEYS: StepKey[] = STEPS.map((s) => s.key);

export function isValidStep(value: string | undefined): value is StepKey {
  return !!value && VALID_STEP_KEYS.includes(value as StepKey);
}

export function parseStep(value: string | undefined): StepKey {
  return isValidStep(value) ? value : "characters";
}

const STEP_INDEX: Record<StepKey, number> = Object.fromEntries(
  VALID_STEP_KEYS.map((key, i) => [key, i])
) as Record<StepKey, number>;

export function stepIndex(step: StepKey): number {
  return STEP_INDEX[step];
}

export function nextStep(step: StepKey): StepKey | null {
  const i = STEP_INDEX[step];
  return i < VALID_STEP_KEYS.length - 1 ? VALID_STEP_KEYS[i + 1] : null;
}

export function prevStep(step: StepKey): StepKey | null {
  const i = STEP_INDEX[step];
  return i > 0 ? VALID_STEP_KEYS[i - 1] : null;
}

interface CompletionCheckData {
  hasCharacters: boolean;
  hasScript: boolean;
  hasStoryboards: boolean;
  videoCompleted: boolean;
  hasVideoUrl: boolean;
}

export function computeCompletedSteps(data: CompletionCheckData): Set<StepKey> {
  const completed = new Set<StepKey>();
  if (data.hasCharacters) completed.add("characters");
  if (data.hasScript) completed.add("script");
  if (data.hasStoryboards) completed.add("storyboard");
  if (data.videoCompleted) completed.add("generate");
  if (data.hasVideoUrl) completed.add("result");
  return completed;
}

export function computeMaxAllowedStep(data: CompletionCheckData): StepKey {
  if (data.hasVideoUrl) return "result";
  if (data.videoCompleted) return "result";
  if (data.hasStoryboards) return "generate";
  if (data.hasScript) return "storyboard";
  if (data.hasCharacters) return "script";
  return "characters";
}

export function isStepAccessible(
  target: StepKey,
  maxAllowed: StepKey
): boolean {
  return STEP_INDEX[target] <= STEP_INDEX[maxAllowed];
}
