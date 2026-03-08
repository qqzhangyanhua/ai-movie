"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateScriptScene,
  deleteScript,
} from "@/lib/actions/script";
import type { ScriptScene } from "@/lib/data/script-templates";

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

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
  const scenesRef = useRef(localScenes);
  useEffect(() => {
    scenesRef.current = localScenes;
  }, [localScenes]);

  const handleSceneChange = useCallback(
    (index: number, field: keyof ScriptScene, value: string | number) => {
      setLocalScenes((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
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
          <div
            key={scene.sceneNumber}
            className="rounded-lg border p-4 space-y-4"
          >
            <h4 className="font-medium">场景 {scene.sceneNumber}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`desc-${index}`}>场景描述</Label>
                <Textarea
                  id={`desc-${index}`}
                  value={scene.description}
                  onChange={(e) =>
                    handleSceneChange(index, "description", e.target.value)
                  }
                  onBlur={() => handleSaveScene(index)}
                  placeholder="描述该场景的画面内容"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`action-${index}`}>动作描述</Label>
                <Textarea
                  id={`action-${index}`}
                  value={scene.action}
                  onChange={(e) =>
                    handleSceneChange(index, "action", e.target.value)
                  }
                  onBlur={() => handleSaveScene(index)}
                  placeholder="描述角色动作"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>镜头类型</Label>
                <Select
                  value={scene.cameraType}
                  onValueChange={(v) => {
                    const newCameraType = v as ScriptScene["cameraType"];
                    handleSceneChange(index, "cameraType", newCameraType);
                    updateScriptScene(projectId, index, {
                      cameraType: newCameraType,
                    }).then(() => router.refresh());
                  }}
                >
                  <SelectTrigger id={`camera-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`duration-${index}`}>时长（秒）</Label>
                <Input
                  id={`duration-${index}`}
                  type="number"
                  min={1}
                  max={30}
                  value={scene.duration}
                  onChange={(e) =>
                    handleSceneChange(
                      index,
                      "duration",
                      parseInt(e.target.value, 10) || 5
                    )
                  }
                  onBlur={() => handleSaveScene(index)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
