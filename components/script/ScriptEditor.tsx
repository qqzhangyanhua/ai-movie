"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addScene,
  deleteScene,
  deleteScript,
  reorderScenes,
  updateScriptScene,
} from "@/lib/actions/script";
import { SceneEditor } from "./SceneEditor";
import {
  getSceneRoleIssue,
  summarizeSceneRoleIssues,
} from "./scene-role-utils";
import type { ScriptScene } from "@/lib/data/script-templates";
import type {
  ProjectCharacterOption,
  SceneFieldValue,
} from "@/components/script/types";

interface ScriptEditorProps {
  projectId: string;
  scenes: ScriptScene[];
  projectCharacters: ProjectCharacterOption[];
  onReset?: () => void;
}

export function ScriptEditor({
  projectId,
  scenes,
  projectCharacters,
  onReset,
}: ScriptEditorProps) {
  const router = useRouter();
  const [localScenes, setLocalScenes] = useState<ScriptScene[]>(scenes);
  const [, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null
  );
  const scenesRef = useRef(localScenes);

  useEffect(() => {
    scenesRef.current = localScenes;
  }, [localScenes]);

  useEffect(() => {
    setLocalScenes(scenes);
  }, [scenes]);

  const handleSceneChange = useCallback(
    (index: number, field: keyof ScriptScene, value: SceneFieldValue) => {
      setLocalScenes((previousScenes) => {
        const nextScenes = [...previousScenes];
        const currentScene = nextScenes[index];

        if (!currentScene) {
          return previousScenes;
        }

        nextScenes[index] = { ...currentScene, [field]: value } as ScriptScene;
        scenesRef.current = nextScenes;
        return nextScenes;
      });
    },
    []
  );

  async function handleSaveScene(index: number) {
    const scene = scenesRef.current[index];
    if (!scene) return;

    setSaving(true);
    await updateScriptScene(projectId, index, {
      description: scene.description,
      action: scene.action,
      cameraType: scene.cameraType,
      duration: scene.duration,
      dialogue: scene.dialogue,
      characters: scene.characters ?? [],
    });
    setSaving(false);
    router.refresh();
  }

  async function handleCharactersChange(index: number, characters: string[]) {
    handleSceneChange(index, "characters", characters);
    await updateScriptScene(projectId, index, { characters });
    router.refresh();
  }

  async function handleCameraTypeChange(
    index: number,
    cameraType: ScriptScene["cameraType"]
  ) {
    await updateScriptScene(projectId, index, { cameraType });
    router.refresh();
  }

  async function handleAddScene() {
    setAdding(true);
    await addScene(projectId);
    setAdding(false);
    router.refresh();
  }

  async function handleDeleteScene(index: number) {
    setDeleteConfirmIndex(null);
    await deleteScene(projectId, index);
    router.refresh();
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return;
    await reorderScenes(projectId, index, index - 1);
    router.refresh();
  }

  async function handleMoveDown(index: number) {
    if (index >= localScenes.length - 1) return;
    await reorderScenes(projectId, index, index + 1);
    router.refresh();
  }

  async function handleReset() {
    setResetting(true);
    await deleteScript(projectId);
    setResetting(false);
    onReset?.();
    router.refresh();
  }

  const hasProjectCharacters = projectCharacters.length > 0;
  const roleSummary = hasProjectCharacters
    ? summarizeSceneRoleIssues(localScenes, projectCharacters)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">编辑剧本场景</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={resetting}
          onClick={handleReset}
        >
          <RotateCcw className="mr-2 size-4" />
          重新选择模板
        </Button>
      </div>

      {!hasProjectCharacters && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 size-4 shrink-0" />
            <p>
              当前项目还没有可用角色。AI 生成的场景角色暂时无法校验，建议先回到角色步骤补齐角色，再检查场景分配。
            </p>
          </div>
        </div>
      )}

      {hasProjectCharacters &&
        roleSummary &&
        roleSummary.issueSceneNumbers.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-2">
                <p>
                  发现 {roleSummary.issueSceneNumbers.length} 个场景的角色分配需要处理。
                </p>
                <div className="flex flex-wrap gap-2">
                  {roleSummary.missingSceneCount > 0 && (
                    <Badge className="bg-amber-600 text-white">
                      未分配角色 {roleSummary.missingSceneCount} 个
                    </Badge>
                  )}
                  {roleSummary.unknownSceneCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-background text-destructive"
                    >
                      项目外角色 {roleSummary.unknownSceneCount} 个
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-background">
                    场景 {roleSummary.issueSceneNumbers.join("、")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="space-y-6">
        {localScenes.map((scene, index) => (
          <SceneEditor
            key={`${scene.sceneNumber}-${index}`}
            scene={scene}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < localScenes.length - 1}
            projectCharacters={projectCharacters}
            roleIssue={
              hasProjectCharacters
                ? getSceneRoleIssue(scene, projectCharacters)
                : undefined
            }
            onSceneChange={(field, value) =>
              handleSceneChange(index, field, value)
            }
            onSave={() => handleSaveScene(index)}
            onDelete={() => setDeleteConfirmIndex(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onCharactersChange={(characters) =>
              handleCharactersChange(index, characters)
            }
            onCameraTypeChange={(cameraType) =>
              handleCameraTypeChange(index, cameraType)
            }
          />
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        disabled={adding}
        onClick={handleAddScene}
      >
        <Plus className="mr-2 size-4" />
        添加场景
      </Button>

      <Dialog
        open={deleteConfirmIndex !== null}
        onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除场景{" "}
              {deleteConfirmIndex !== null
                ? localScenes[deleteConfirmIndex]?.sceneNumber
                : ""}{" "}
              吗？删除后其余场景将自动重新编号。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmIndex(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmIndex !== null &&
                handleDeleteScene(deleteConfirmIndex)
              }
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
