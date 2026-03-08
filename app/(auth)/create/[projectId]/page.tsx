import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreationWizard } from "@/components/wizard/CreationWizard";
import { CharacterStep } from "@/components/wizard/steps/CharacterStep";
import { ScriptStep } from "@/components/wizard/steps/ScriptStep";
import { StoryboardStep } from "@/components/wizard/steps/StoryboardStep";
import { GenerateStep } from "@/components/wizard/steps/GenerateStep";
import { ResultStep } from "@/components/wizard/steps/ResultStep";
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

  const [allCharacters, projectCharacters, script, storyboards, video] =
    await Promise.all([
      prisma.character.findMany({
        where: { userId: session.user.id },
      }),
      prisma.projectCharacter.findMany({
        where: { projectId },
        include: { character: { select: { id: true, name: true } } },
      }),
      prisma.script.findUnique({
        where: { projectId },
      }),
      prisma.storyboard.findMany({
        where: { projectId },
        orderBy: { sceneNumber: "asc" },
        include: { videoClip: true },
      }),
      prisma.video.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const selectedCharacterIds = projectCharacters.map((pc) => pc.characterId);
  const projectCharactersWithNames = projectCharacters.map((pc) => ({
    id: pc.character.id,
    name: pc.character.name,
  }));

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
    script: (
      <ScriptStep projectId={projectId} script={script} />
    ),
    storyboard: (
      <StoryboardStep
        projectId={projectId}
        storyboards={storyboards}
        projectCharacters={projectCharactersWithNames}
        hasScript={!!script}
      />
    ),
    generate: (
      <GenerateStep
        projectId={projectId}
        videoId={video?.id ?? null}
        videoStatus={video?.status ?? null}
        videoUrl={video?.videoUrl ?? null}
        subtitleUrl={video?.subtitleUrl ?? null}
        storyboardCount={storyboards.length}
        isGenerating={project.status === "GENERATING"}
      />
    ),
    result: (
      <ResultStep
        projectId={projectId}
        videoId={video?.id ?? null}
        videoUrl={video?.videoUrl ?? null}
        subtitleUrl={video?.subtitleUrl ?? null}
        posterUrl={video?.posterUrl ?? null}
        duration={video?.duration ?? null}
        resolution={video?.resolution ?? null}
        projectTitle={project.title}
        createdAt={project.createdAt}
      />
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
