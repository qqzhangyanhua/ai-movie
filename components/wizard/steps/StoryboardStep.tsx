"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
  const [generating, setGenerating] = useState(false);
  const hasStoryboards = storyboards.length > 0;

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateStoryboardsFromScript(projectId);
      router.refresh();
    } catch {
      toast.error("生成分镜失败，请重试");
    } finally {
      setGenerating(false);
    }
  }

  function handlePrev() {
    router.push(`/create/${projectId}?step=script`);
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
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-medium">
            {hasScript ? "从剧本生成分镜" : "需要先完成剧本"}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {hasScript
              ? "点击下方按钮，根据剧本自动拆解为分镜画面。"
              : "请先回到剧本步骤完成创作，才能生成分镜。"}
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={hasScript ? undefined : 0}>
                <Button
                  onClick={handleGenerate}
                  disabled={!hasScript || generating}
                >
                  {generating && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  从剧本生成分镜
                </Button>
              </span>
            </TooltipTrigger>
            {!hasScript && (
              <TooltipContent>请先完成剧本步骤</TooltipContent>
            )}
          </Tooltip>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button onClick={handleNext} disabled>
                  下一步：生成视频
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>请先生成分镜</TooltipContent>
          </Tooltip>
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
      <div className="flex justify-between">
        <Button variant="ghost" onClick={handlePrev}>
          <ChevronLeft className="mr-2 size-4" />
          上一步
        </Button>
        <Button onClick={handleNext}>
          下一步：生成视频
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
