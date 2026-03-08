"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryboardList } from "@/components/storyboard/StoryboardList";
import { generateStoryboardsFromScript } from "@/lib/actions/storyboard";
import type { Storyboard } from "@prisma/client";

interface ProjectCharacter {
  id: string;
  name: string;
}

interface StoryboardStepProps {
  projectId: string;
  storyboards: Storyboard[];
  projectCharacters: ProjectCharacter[];
  hasScript: boolean;
  onNext?: () => void;
}

export function StoryboardStep({
  projectId,
  storyboards,
  projectCharacters,
  hasScript,
  onNext,
}: StoryboardStepProps) {
  const router = useRouter();
  const hasStoryboards = storyboards.length > 0;

  async function handleGenerate() {
    await generateStoryboardsFromScript(projectId);
    router.refresh();
  }

  function handleNext() {
    if (onNext) {
      onNext();
    } else {
      router.push(`/create/${projectId}?step=generate`);
    }
  }

  if (!hasStoryboards) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          {hasScript
            ? "点击下方按钮，根据剧本自动生成分镜。"
            : "请先完成剧本步骤，再生成分镜。"}
        </p>
        <Button
          onClick={handleGenerate}
          disabled={!hasScript}
        >
          从剧本生成分镜
        </Button>
        <div className="flex justify-end">
          <Button onClick={handleNext} disabled>
            下一步：生成视频
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StoryboardList
        projectId={projectId}
        storyboards={storyboards}
        projectCharacters={projectCharacters}
      />
      <div className="flex justify-end">
        <Button onClick={handleNext}>
          下一步：生成视频
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
