import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreationWizard } from "@/components/wizard/CreationWizard";
import { CharacterStep } from "@/components/wizard/steps/CharacterStep";
import type { StepKey } from "@/components/wizard/StepIndicator";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ step?: string }>;
};

export default async function CreateProjectWorkbenchPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireAuth();
  const { projectId } = await params;
  const { step } = await searchParams;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    notFound();
  }

  const [allCharacters, projectCharacters] = await Promise.all([
    prisma.character.findMany({
      where: { userId: session.user.id },
    }),
    prisma.projectCharacter.findMany({
      where: { projectId },
      select: { characterId: true },
    }),
  ]);

  const selectedCharacterIds = projectCharacters.map((pc) => pc.characterId);

  const validSteps: StepKey[] = [
    "characters",
    "script",
    "storyboard",
    "generate",
    "result",
  ];
  const initialStep: StepKey =
    step && validSteps.includes(step as StepKey)
      ? (step as StepKey)
      : "characters";

  const stepPlaceholders: Record<StepKey, React.ReactNode> = {
    characters: (
      <CharacterStep
        projectId={projectId}
        allCharacters={allCharacters}
        selectedCharacterIds={selectedCharacterIds}
      />
    ),
    script: <p className="text-muted-foreground">剧本选择（待实现）</p>,
    storyboard: (
      <p className="text-muted-foreground">分镜编辑（待实现）</p>
    ),
    generate: (
      <p className="text-muted-foreground">视频生成（待实现）</p>
    ),
    result: (
      <p className="text-muted-foreground">结果预览（待实现）</p>
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-muted-foreground">创作工作台</p>
      </div>
      <CreationWizard
        projectId={projectId}
        initialStep={initialStep}
        completedSteps={new Set()}
      >
        {stepPlaceholders}
      </CreationWizard>
    </div>
  );
}
