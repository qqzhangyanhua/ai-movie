"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Plus } from "lucide-react";
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
  updateScriptScene,
  deleteScript,
  addScene,
  deleteScene,
  reorderScenes,
} from "@/lib/actions/script";
import { SceneEditor } from "./SceneEditor";
import type { ScriptScene } from "@/lib/data/script-templates";

interface ScriptEditorProps {
  projectId: string;
  scenes: ScriptScene[];
  onReset?: () => void;
}

export function ScriptEditor({
  projectId,
  scenes,
  onReset,
}: ScriptEditorProps) {
  const router = useRouter();
  const [localScenes, setLocalScenes] = useState<ScriptScene[]>(scenes);
  const [saving, setSaving] = useState(false);
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
    (index: number, field: keyof ScriptScene, value: string | number) => {
      setLocalScenes((prev) => {
        const next = [...prev];
        const scene = next[index];
        if (!scene) return prev;
        next[index] = { ...scene, [field]: value };
        return next;
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
    });
    setSaving(false);
    router.refresh();
  }

  async function handleCameraTypeChange(
    index: number,
    cameraType: ScriptScene["cameraType"]
  ) {
    handleSceneChange(index, "cameraType", cameraType);
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

      <div className="space-y-6">
        {localScenes.map((scene, index) => (
          <SceneEditor
            key={`${scene.sceneNumber}-${index}`}
            scene={scene}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < localScenes.length - 1}
            onSceneChange={(field, value) =>
              handleSceneChange(index, field, value)
            }
            onSave={() => handleSaveScene(index)}
            onDelete={() => setDeleteConfirmIndex(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
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
