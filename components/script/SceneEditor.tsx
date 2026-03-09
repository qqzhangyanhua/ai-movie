"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { ScriptScene } from "@/lib/data/script-templates";
import type {
  ProjectCharacterOption,
  SceneFieldValue,
} from "@/components/script/types";
import type { SceneRoleIssue } from "@/components/script/scene-role-utils";

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

interface SceneEditorProps {
  scene: ScriptScene;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  projectCharacters: ProjectCharacterOption[];
  roleIssue?: SceneRoleIssue;
  onSceneChange: (field: keyof ScriptScene, value: SceneFieldValue) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCharactersChange?: (characters: string[]) => void;
  onCameraTypeChange?: (cameraType: ScriptScene["cameraType"]) => void;
}

export function SceneEditor({
  scene,
  index,
  canMoveUp,
  canMoveDown,
  projectCharacters,
  roleIssue,
  onSceneChange,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCharactersChange,
  onCameraTypeChange,
}: SceneEditorProps) {
  const selectedCharacters = scene.characters ?? [];
  const hasRoleIssue =
    !!roleIssue &&
    (roleIssue.missingCharacters || roleIssue.unknownCharacters.length > 0);

  function applyCharacters(nextCharacters: string[]) {
    if (onCharactersChange) {
      onCharactersChange(nextCharacters);
      return;
    }

    onSceneChange("characters", nextCharacters);
    onSave();
  }

  function toggleCharacter(name: string) {
    const nextCharacters = selectedCharacters.includes(name)
      ? selectedCharacters.filter((character) => character !== name)
      : [...selectedCharacters, name];

    applyCharacters(nextCharacters);
  }

  function removeCharacter(name: string) {
    applyCharacters(selectedCharacters.filter((character) => character !== name));
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 shrink-0 text-muted-foreground" />
          <h4 className="font-medium">场景 {scene.sceneNumber}</h4>
          {hasRoleIssue && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700"
            >
              角色待修正
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="上移"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="下移"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="删除场景"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {hasRoleIssue && roleIssue && (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {roleIssue.missingCharacters && (
                  <Badge className="bg-amber-600 text-white">未选择出场角色</Badge>
                )}
                {roleIssue.unknownCharacters.map((character) => (
                  <Badge
                    key={character}
                    variant="outline"
                    className="border-destructive/40 bg-background text-destructive"
                  >
                    项目外角色：{character}
                  </Badge>
                ))}
              </div>

              {roleIssue.unknownCharacters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {roleIssue.unknownCharacters.map((character) => (
                    <Button
                      key={character}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:text-destructive"
                      onClick={() => removeCharacter(character)}
                    >
                      移除 {character}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`desc-${index}`}>场景描述</Label>
          <Textarea
            id={`desc-${index}`}
            value={scene.description}
            onChange={(event) => onSceneChange("description", event.target.value)}
            onBlur={onSave}
            placeholder="描述该场景的画面内容"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`action-${index}`}>动作描述</Label>
          <Textarea
            id={`action-${index}`}
            value={scene.action}
            onChange={(event) => onSceneChange("action", event.target.value)}
            onBlur={onSave}
            placeholder="描述角色动作"
            className="min-h-[60px]"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`dialogue-${index}`}>对白</Label>
          <Textarea
            id={`dialogue-${index}`}
            value={scene.dialogue ?? ""}
            onChange={(event) => onSceneChange("dialogue", event.target.value)}
            onBlur={onSave}
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
                    selectedCharacters.includes(character.name)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => toggleCharacter(character.name)}
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
            onValueChange={(value) => {
              const nextCameraType = value as ScriptScene["cameraType"];
              onSceneChange("cameraType", nextCameraType);
              onCameraTypeChange?.(nextCameraType);
            }}
          >
            <SelectTrigger id={`camera-${index}`}>
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
          <Label htmlFor={`duration-${index}`}>时长（秒）</Label>
          <Input
            id={`duration-${index}`}
            type="number"
            min={1}
            max={30}
            value={scene.duration}
            onChange={(event) =>
              onSceneChange("duration", parseInt(event.target.value, 10) || 5)
            }
            onBlur={onSave}
          />
        </div>
      </div>
    </div>
  );
}
