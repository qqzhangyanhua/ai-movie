"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptTemplateGrid } from "@/components/script/ScriptTemplateGrid";
import { ScriptEditor } from "@/components/script/ScriptEditor";
import { CustomScriptForm } from "@/components/script/CustomScriptForm";
import { ScriptGenerator } from "@/components/script/ScriptGenerator";
import type { ScriptScene } from "@/lib/data/script-templates";

interface ScriptStepProps {
  projectId: string;
  script: { content: unknown } | null;
  onNext?: () => void;
}

export function ScriptStep({
  projectId,
  script,
  onNext,
}: ScriptStepProps) {
  const router = useRouter();
  const scenes = (script?.content as ScriptScene[] | undefined) ?? null;
  const hasScript = Array.isArray(scenes) && scenes.length > 0;

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
          onReset={() => router.refresh()}
        />
        <div className="flex justify-end">
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
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
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
            onSaved={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled>
          下一步：生成分镜
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
