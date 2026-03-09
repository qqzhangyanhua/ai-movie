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
import type {
  ProjectCharacterOption,
  SceneFieldValue,
} from "@/components/script/types";

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

const emptyScene = (sceneNumber: number): ScriptScene => ({
  sceneNumber,
  description: "",
  action: "",
  cameraType: "中景",
  duration: 5,
  dialogue: "",
  characters: [],
});

interface CustomScriptFormProps {
  projectId: string;
  projectCharacters: ProjectCharacterOption[];
  onSaved?: () => void;
}

export function CustomScriptForm({
  projectId,
  projectCharacters,
  onSaved,
}: CustomScriptFormProps) {
  const router = useRouter();
  const [scenes, setScenes] = useState<ScriptScene[]>([
    emptyScene(1),
    emptyScene(2),
    emptyScene(3),
  ]);
  const [saving, setSaving] = useState(false);

  function addScene() {
    setScenes((previousScenes) => [
      ...previousScenes,
      emptyScene(previousScenes.length + 1),
    ]);
  }

  function removeScene(index: number) {
    setScenes((previousScenes) => {
      const nextScenes = previousScenes.filter((_, sceneIndex) => sceneIndex !== index);
      return nextScenes.map((scene, sceneIndex) => ({
        ...scene,
        sceneNumber: sceneIndex + 1,
      }));
    });
  }

  function updateScene(
    index: number,
    field: keyof ScriptScene,
    value: SceneFieldValue
  ) {
    setScenes((previousScenes) => {
      const nextScenes = [...previousScenes];
      const currentScene = nextScenes[index];

      if (!currentScene) {
        return previousScenes;
      }

      nextScenes[index] = { ...currentScene, [field]: value } as ScriptScene;
      return nextScenes;
    });
  }

  function toggleCharacter(index: number, name: string) {
    const characters = scenes[index]?.characters ?? [];
    const nextCharacters = characters.includes(name)
      ? characters.filter((character) => character !== name)
      : [...characters, name];

    updateScene(index, "characters", nextCharacters);
  }

  async function handleSave() {
    const valid = scenes.every((scene) => scene.description.trim().length > 0);
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
          <div key={scene.sceneNumber} className="space-y-4 rounded-lg border p-4">
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
                  onChange={(event) =>
                    updateScene(index, "description", event.target.value)
                  }
                  placeholder="描述该场景的画面内容"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>动作描述</Label>
                <Textarea
                  value={scene.action}
                  onChange={(event) =>
                    updateScene(index, "action", event.target.value)
                  }
                  placeholder="描述角色动作"
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>对白</Label>
                <Textarea
                  value={scene.dialogue ?? ""}
                  onChange={(event) =>
                    updateScene(index, "dialogue", event.target.value)
                  }
                  placeholder="角色台词，可选"
                  className="min-h-[60px]"
                />
              </div>

              {projectCharacters.length > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>出场角色</Label>
                  <div className="flex flex-wrap gap-2">
                    {projectCharacters.map((character) => (
                      <Button
                        key={character.id}
                        type="button"
                        size="sm"
                        variant={
                          (scene.characters ?? []).includes(character.name)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleCharacter(index, character.name)}
                      >
                        {character.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>镜头类型</Label>
                <Select
                  value={scene.cameraType}
                  onValueChange={(value) =>
                    updateScene(index, "cameraType", value as ScriptScene["cameraType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
                  onChange={(event) =>
                    updateScene(
                      index,
                      "duration",
                      parseInt(event.target.value, 10) || 5
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
