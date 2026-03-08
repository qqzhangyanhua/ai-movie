"use client";

import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

interface SceneEditorProps {
  scene: ScriptScene;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSceneChange: (field: keyof ScriptScene, value: string | number) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCameraTypeChange?: (cameraType: ScriptScene["cameraType"]) => void;
}

export function SceneEditor({
  scene,
  index,
  canMoveUp,
  canMoveDown,
  onSceneChange,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCameraTypeChange,
}: SceneEditorProps) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 text-muted-foreground shrink-0" />
          <h4 className="font-medium">场景 {scene.sceneNumber}</h4>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`desc-${index}`}>场景描述</Label>
          <Textarea
            id={`desc-${index}`}
            value={scene.description}
            onChange={(e) => onSceneChange("description", e.target.value)}
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
            onChange={(e) => onSceneChange("action", e.target.value)}
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
            onChange={(e) => onSceneChange("dialogue", e.target.value)}
            onBlur={onSave}
            placeholder="角色台词（可选）"
            className="min-h-[60px]"
          />
        </div>
        <div className="space-y-2">
          <Label>镜头类型</Label>
          <Select
            value={scene.cameraType}
            onValueChange={(v) => {
              const newCameraType = v as ScriptScene["cameraType"];
              onSceneChange("cameraType", newCameraType);
              onCameraTypeChange?.(newCameraType);
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
              onSceneChange(
                "duration",
                parseInt(e.target.value, 10) || 5
              )
            }
            onBlur={onSave}
          />
        </div>
      </div>
    </div>
  );
}
