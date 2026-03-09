"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCharacter } from "@/lib/actions/character";
import type { CharacterWithProjects } from "@/components/character/CharacterGrid";

interface CharacterDetailDialogProps {
  character: CharacterWithProjects;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function CharacterDetailDialog({
  character,
  open,
  onOpenChange,
}: CharacterDetailDialogProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [personality, setPersonality] = useState(character.personality ?? "");
  const [style, setStyle] = useState(character.style ?? "");
  const [syncReferences, setSyncReferences] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedProjectCount = character.projects.length;
  const hasNameChanged = name.trim() !== character.name;
  const canSyncReferences = hasNameChanged && linkedProjectCount > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setEditing(false);
    setError(null);
    setName(character.name);
    setPersonality(character.personality ?? "");
    setStyle(character.style ?? "");
    setSyncReferences(true);
  }, [
    character.id,
    character.name,
    character.personality,
    character.style,
    open,
  ]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请输入角色名称");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateCharacter(
      character.id,
      {
        name: trimmedName,
        personality: personality.trim() || undefined,
        style: style.trim() || undefined,
      },
      {
        syncProjectReferences: canSyncReferences && syncReferences,
      }
    );

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setEditing(false);
    onOpenChange(false);
    router.refresh();
  }

  function handleCancelEdit() {
    setEditing(false);
    setError(null);
    setName(character.name);
    setPersonality(character.personality ?? "");
    setStyle(character.style ?? "");
    setSyncReferences(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑角色" : character.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={character.photoUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>

            {editing ? (
              <div className="flex flex-1 flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-character-name">角色名称</Label>
                  <Input
                    id="edit-character-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="请输入角色名称"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-character-personality">性格</Label>
                  <Input
                    id="edit-character-personality"
                    value={personality}
                    onChange={(event) => setPersonality(event.target.value)}
                    placeholder="如：勇敢、温柔"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-character-style">风格</Label>
                  <Input
                    id="edit-character-style"
                    value={style}
                    onChange={(event) => setStyle(event.target.value)}
                    placeholder="如：古风、校园"
                    disabled={saving}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {character.personality && (
                    <Badge variant="secondary">{character.personality}</Badge>
                  )}
                  {character.style && (
                    <Badge variant="outline">{character.style}</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-2 size-4" />
                  编辑角色
                </Button>
              </div>
            )}
          </div>

          {editing && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="sync-character-references"
                    className="cursor-pointer"
                  >
                    改名后同步更新关联项目中的剧本和分镜角色名
                  </Label>
                  <input
                    id="sync-character-references"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={syncReferences}
                    disabled={!canSyncReferences || saving}
                    onChange={(event) => setSyncReferences(event.target.checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {linkedProjectCount > 0
                    ? `该角色当前关联 ${linkedProjectCount} 个项目。只有名称发生变化时才会同步更新引用。`
                    : "该角色目前还没有关联项目。"}
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  保存修改
                </Button>
              </div>
            </div>
          )}

          {character.projects.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                关联项目
              </h4>
              <ul className="space-y-1">
                {character.projects.map((projectCharacter) => (
                  <li key={projectCharacter.id}>
                    <Link
                      href={`/create/${projectCharacter.projectId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {projectCharacter.project.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
