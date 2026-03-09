"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateStoryboard } from "@/lib/actions/storyboard";
import type { Storyboard } from "@prisma/client";
import { getStoryboardRoleIssue } from "./storyboard-role-utils";

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

  const roleIssue = useMemo(() => {
    if (!storyboard) {
      return undefined;
    }

    return getStoryboardRoleIssue(
      {
        sceneNumber: storyboard.sceneNumber,
        characters,
      } as Pick<Storyboard, "sceneNumber" | "characters">,
      projectCharacters
    );
  }, [characters, projectCharacters, storyboard]);

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
    setCharacters((previousCharacters) =>
      previousCharacters.includes(name)
        ? previousCharacters.filter((item) => item !== name)
        : [...previousCharacters, name]
    );
  }

  function removeCharacter(name: string) {
    setCharacters((previousCharacters) =>
      previousCharacters.filter((item) => item !== name)
    );
  }

  if (!storyboard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑分镜 - 场景 {storyboard.sceneNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {storyboard.imageUrl && (
            <div className="overflow-hidden rounded-lg bg-muted">
              <img
                src={storyboard.imageUrl}
                alt={`场景 ${storyboard.sceneNumber} 预览`}
                className="h-32 w-full object-cover"
              />
            </div>
          )}

          {roleIssue &&
            (roleIssue.missingCharacters ||
              roleIssue.unknownCharacters.length > 0) && (
              <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {roleIssue.missingCharacters && (
                        <Badge className="bg-amber-600 text-white">
                          未选择出场角色
                        </Badge>
                      )}
                      {roleIssue.unknownCharacters.map((name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="border-destructive/40 bg-background text-destructive"
                        >
                          项目外角色：{name}
                        </Badge>
                      ))}
                    </div>
                    {roleIssue.unknownCharacters.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {roleIssue.unknownCharacters.map((name) => (
                          <Button
                            key={name}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:text-destructive"
                            onClick={() => removeCharacter(name)}
                          >
                            移除 {name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sb-desc">场景描述</Label>
              <Textarea
                id="sb-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="描述该场景的画面内容"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-action">动作描述</Label>
              <Textarea
                id="sb-action"
                value={action}
                onChange={(event) => setAction(event.target.value)}
                placeholder="描述角色动作"
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>镜头类型</Label>
              <Select value={cameraType} onValueChange={setCameraType}>
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
              <Label htmlFor="sb-duration">时长（秒）</Label>
              <Input
                id="sb-duration"
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(event) =>
                  setDuration(parseInt(event.target.value, 10) || 5)
                }
              />
            </div>
          </div>

          {projectCharacters.length > 0 && (
            <div className="space-y-2">
              <Label>出场角色</Label>
              <div className="flex flex-wrap gap-2">
                {projectCharacters.map((character) => (
                  <Button
                    key={character.id}
                    type="button"
                    variant={characters.includes(character.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCharacter(character.name)}
                  >
                    {character.name}
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
