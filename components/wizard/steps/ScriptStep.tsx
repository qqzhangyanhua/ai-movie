"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomScriptForm } from "@/components/script/CustomScriptForm";
import { ScriptEditor } from "@/components/script/ScriptEditor";
import { ScriptGenerator } from "@/components/script/ScriptGenerator";
import { ScriptTemplateGrid } from "@/components/script/ScriptTemplateGrid";
import type { ScriptScene } from "@/lib/data/script-templates";
import type { ProjectCharacterOption } from "@/components/script/types";

interface ScriptStepProps {
  projectId: string;
  script: { content: unknown } | null;
  projectCharacters: ProjectCharacterOption[];
  onNext?: () => void;
}

export function ScriptStep({
  projectId,
  script,
  projectCharacters,
  onNext,
}: ScriptStepProps) {
  const router = useRouter();
  const scenes = (script?.content as ScriptScene[] | undefined) ?? null;
  const hasScript = Array.isArray(scenes) && scenes.length > 0;

  function handlePrev() {
    router.push(`/create/${projectId}?step=characters`);
  }

  function handleNext() {
    if (onNext) {
      onNext();
    } else {
      router.push(`/create/${projectId}?step=storyboard`);
    }
  }

  if (hasScript) {
    return (
      <div className="space-y-6">
        <ScriptEditor
          projectId={projectId}
          scenes={scenes}
          projectCharacters={projectCharacters}
          onReset={() => router.refresh()}
        />
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="mr-2 size-4" />
            上一步
          </Button>
          <Button onClick={handleNext}>
            下一步：生成分镜
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-medium">选择或创建剧本</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          从模板选择、AI 自动生成或手动编写你的剧本
        </p>
        <Tabs defaultValue="templates" className="w-full text-left">
          <TabsList className="grid w-full max-w-lg grid-cols-3 mx-auto">
            <TabsTrigger value="templates">选择模板</TabsTrigger>
            <TabsTrigger value="ai">AI 生成</TabsTrigger>
            <TabsTrigger value="custom">自定义剧本</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="mt-4">
            <ScriptTemplateGrid
              projectId={projectId}
              onApplied={() => router.refresh()}
            />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <ScriptGenerator
              projectId={projectId}
              onGenerated={() => router.refresh()}
            />
          </TabsContent>
          <TabsContent value="custom" className="mt-4">
            <CustomScriptForm
              projectId={projectId}
              projectCharacters={projectCharacters}
              onSaved={() => router.refresh()}
            />
          </TabsContent>
        </Tabs>
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
                下一步：生成分镜
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>请先创建剧本</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
