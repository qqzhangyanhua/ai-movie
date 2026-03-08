"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import { saveCustomScript } from "@/lib/actions/script";
import type { ScriptScene } from "@/lib/data/script-templates";

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

const emptyScene = (n: number): ScriptScene => ({
  sceneNumber: n,
  description: "",
  action: "",
  cameraType: "中景",
  duration: 5,
});

interface CustomScriptFormProps {
  projectId: string;
  onSaved?: () => void;
}

export function CustomScriptForm({ projectId, onSaved }: CustomScriptFormProps) {
  const router = useRouter();
  const [scenes, setScenes] = useState<ScriptScene[]>([
    emptyScene(1),
    emptyScene(2),
    emptyScene(3),
  ]);
  const [saving, setSaving] = useState(false);

  function addScene() {
    setScenes((prev) => [
      ...prev,
      emptyScene(prev.length + 1),
    ]);
  }

  function removeScene(index: number) {
    setScenes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    });
  }

  function updateScene(index: number, field: keyof ScriptScene, value: string | number) {
    setScenes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSave() {
    const valid = scenes.every((s) => s.description.trim().length > 0);
    if (!valid) return;
    setSaving(true);
    const result = await saveCustomScript(projectId, scenes);
    setSaving(false);
    if (result.success) {
      onSaved?.();
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">自定义剧本</h3>
        <Button variant="outline" size="sm" onClick={addScene}>
          <Plus className="mr-2 size-4" />
          添加场景
        </Button>
      </div>

      <div className="space-y-6">
        {scenes.map((scene, index) => (
          <div
            key={index}
            className="rounded-lg border p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">场景 {scene.sceneNumber}</h4>
              {scenes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeScene(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>场景描述 *</Label>
                <Textarea
                  value={scene.description}
                  onChange={(e) =>
                    updateScene(index, "description", e.target.value)
                  }
                  placeholder="描述该场景的画面内容"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>动作描述</Label>
                <Textarea
                  value={scene.action}
                  onChange={(e) =>
                    updateScene(index, "action", e.target.value)
                  }
                  placeholder="描述角色动作"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>镜头类型</Label>
                <Select
                  value={scene.cameraType}
                  onValueChange={(v) =>
                    updateScene(index, "cameraType", v as ScriptScene["cameraType"])
                  }
                >
                  <SelectTrigger>
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
                <Label>时长（秒）</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={scene.duration}
                  onChange={(e) =>
                    updateScene(
                      index,
                      "duration",
                      parseInt(e.target.value, 10) || 5
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        保存自定义剧本
      </Button>
    </div>
  );
}
