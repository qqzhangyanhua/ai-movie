"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateStoryboard } from "@/lib/actions/storyboard";
import type { Storyboard } from "@prisma/client";

const CAMERA_OPTIONS = ["远景", "中景", "特写"] as const;

interface ProjectCharacter {
  id: string;
  name: string;
}

interface StoryboardEditorProps {
  storyboard: Storyboard | null;
  projectCharacters: ProjectCharacter[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryboardEditor({
  storyboard,
  projectCharacters,
  open,
  onOpenChange,
}: StoryboardEditorProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [cameraType, setCameraType] = useState<string>("中景");
  const [duration, setDuration] = useState(5);
  const [characters, setCharacters] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storyboard) {
      setDescription(storyboard.description);
      setAction(storyboard.action ?? "");
      setCameraType(storyboard.cameraType ?? "中景");
      setDuration(storyboard.duration);
      setCharacters(storyboard.characters);
    }
  }, [storyboard]);

  async function handleSave() {
    if (!storyboard) return;
    setSaving(true);
    await updateStoryboard(storyboard.id, {
      description,
      action: action || undefined,
      cameraType: cameraType || undefined,
      duration,
      characters,
    });
    setSaving(false);
    onOpenChange(false);
    router.refresh();
  }

  function toggleCharacter(name: string) {
    setCharacters((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  }

  if (!storyboard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑分镜 - 场景 {storyboard.sceneNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sb-desc">场景描述</Label>
            <Textarea
              id="sb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述该场景的画面内容"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-action">动作描述</Label>
            <Textarea
              id="sb-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="描述角色动作"
              className="min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>镜头类型</Label>
              <Select value={cameraType} onValueChange={setCameraType}>
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
              <Label htmlFor="sb-duration">时长（秒）</Label>
              <Input
                id="sb-duration"
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value, 10) || 5)
                }
              />
            </div>
          </div>
          {projectCharacters.length > 0 && (
            <div className="space-y-2">
              <Label>出场角色</Label>
              <div className="flex flex-wrap gap-2">
                {projectCharacters.map((char) => (
                  <Button
                    key={char.id}
                    type="button"
                    variant={characters.includes(char.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCharacter(char.name)}
                  >
                    {char.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
