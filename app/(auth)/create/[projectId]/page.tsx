import { redirect, notFound } from "next/navigation";
import { Users, BookOpen, LayoutGrid, Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { scriptScenesSchema } from "@/lib/validations/script";
import {
  parseStep,
  computeCompletedSteps,
  computeMaxAllowedStep,
  isStepAccessible,
  type StepKey,
} from "@/lib/wizard-steps";
import { CreationWizard } from "@/components/wizard/CreationWizard";
import { CharacterStep } from "@/components/wizard/steps/CharacterStep";
import { ScriptStep } from "@/components/wizard/steps/ScriptStep";
import { StoryboardStep } from "@/components/wizard/steps/StoryboardStep";
import { GenerateStep } from "@/components/wizard/steps/GenerateStep";
import { ResultStep } from "@/components/wizard/steps/ResultStep";
import type { SceneCharacterReference } from "@/components/character/character-impact-utils";

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
    return notFound();
  }

  const { title: projectTitle, status: projectStatus, createdAt } = project;

  const [allCharacters, projectCharacters, script, scenes, video] =
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
      prisma.scene.findMany({
        where: { projectId },
        orderBy: { sceneNumber: "asc" },
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

  const parsedScenes = scriptScenesSchema.safeParse(script?.content);
  const scriptScenes: SceneCharacterReference[] = parsedScenes.success
    ? parsedScenes.data.map((scene) => ({
        sceneNumber: scene.sceneNumber,
        description: scene.description,
        characters: scene.characters ?? [],
      }))
    : [];
  const storyboardReferences: SceneCharacterReference[] = scenes.map(
    (scene) => ({
      sceneNumber: scene.sceneNumber,
      description: scene.description ?? "",
      characters: scene.characters ?? [],
    })
  );

  const completionData = {
    hasCharacters: selectedCharacterIds.length > 0,
    hasScript: parsedScenes.success && parsedScenes.data.length > 0,
    hasStoryboards: scenes.length > 0,
    videoCompleted: video?.status === "COMPLETED",
    hasVideoUrl: !!video?.videoUrl,
  };
  const completedSteps = computeCompletedSteps(completionData);
  const maxAllowedStep = computeMaxAllowedStep(completionData);

  const requestedStep = parseStep(step);
  const initialStep: StepKey = isStepAccessible(requestedStep, maxAllowedStep)
    ? requestedStep
    : maxAllowedStep;

  if (step && requestedStep !== initialStep) {
    redirect(`/create/${projectId}?step=${initialStep}`);
  }

  const stats = [
    { icon: Users, label: "角色", value: selectedCharacterIds.length },
    { icon: BookOpen, label: "场景", value: scriptScenes.length },
    { icon: LayoutGrid, label: "分镜", value: scenes.length },
  ];

  function renderCurrentStep() {
    switch (initialStep) {
      case "characters":
        return (
          <CharacterStep
            projectId={projectId}
            allCharacters={allCharacters}
            selectedCharacterIds={selectedCharacterIds}
            scriptScenes={scriptScenes}
            storyboards={storyboardReferences}
          />
        );
      case "script":
        return (
          <ScriptStep
            projectId={projectId}
            script={script}
            projectCharacters={projectCharactersWithNames}
          />
        );
      case "storyboard":
        return (
          <StoryboardStep
            projectId={projectId}
            storyboards={scenes}
            projectCharacters={projectCharactersWithNames}
            hasScript={!!script}
          />
        );
      case "generate":
        return (
          <GenerateStep
            projectId={projectId}
            videoId={video?.id ?? null}
            videoStatus={video?.status ?? null}
            videoUrl={video?.videoUrl ?? null}
            subtitleUrl={video?.subtitleUrl ?? null}
            storyboardCount={scenes.length}
            isGenerating={projectStatus === "GENERATING"}
          />
        );
      case "result":
        return (
          <ResultStep
            projectId={projectId}
            videoId={video?.id ?? null}
            videoUrl={video?.videoUrl ?? null}
            subtitleUrl={video?.subtitleUrl ?? null}
            posterUrl={video?.posterUrl ?? null}
            duration={video?.duration ?? null}
            resolution={video?.resolution ?? null}
            projectTitle={projectTitle}
            createdAt={createdAt}
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {projectTitle}
          </h1>
          <p className="text-muted-foreground">创作工作台</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="size-4" />
              <span>
                {value} {label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>
              {new Intl.DateTimeFormat("zh-CN", {
                month: "short",
                day: "numeric",
              }).format(createdAt)}
            </span>
          </div>
        </div>
      </div>
      <CreationWizard
        projectId={projectId}
        initialStep={initialStep}
        completedSteps={completedSteps}
      >
        {renderCurrentStep()}
      </CreationWizard>
    </div>
  );
}
