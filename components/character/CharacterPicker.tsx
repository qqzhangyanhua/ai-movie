"use client";

import { useMemo, useState } from "react";
import { TriangleAlert, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CharacterCard } from "./CharacterCard";
import { CharacterUploader } from "./CharacterUploader";
import type { Character } from "@prisma/client";
import type { CharacterRemovalImpact } from "./character-impact-utils";

interface CharacterPickerProps {
  allCharacters: Character[];
  selectedIds: string[];
  removalImpacts?: Record<string, CharacterRemovalImpact>;
  onAddToProject: (characterId: string) => Promise<void>;
  onRemoveFromProject: (
    characterId: string,
    options?: { cleanupReferences?: boolean }
  ) => Promise<void>;
}

export function CharacterPicker({
  allCharacters,
  selectedIds,
  removalImpacts = {},
  onAddToProject,
  onRemoveFromProject,
}: CharacterPickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const pendingImpact = useMemo(
    () => (pendingRemoveId ? removalImpacts[pendingRemoveId] ?? null : null),
    [pendingRemoveId, removalImpacts]
  );

  async function handleToggle(characterId: string) {
    const isSelected = selectedIds.includes(characterId);
    if (isSelected) {
      const impact = removalImpacts[characterId];
      if (impact) {
        setPendingRemoveId(characterId);
        return;
      }

      await onRemoveFromProject(characterId);
      return;
    }

    await onAddToProject(characterId);
  }

  async function handleConfirmRemove(cleanupReferences: boolean) {
    if (!pendingRemoveId) return;

    await onRemoveFromProject(pendingRemoveId, { cleanupReferences });
    setPendingRemoveId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">选择角色</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 size-4" />
              新建角色
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建角色</DialogTitle>
            </DialogHeader>
            <CharacterUploader onCreated={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {allCharacters.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          暂无角色，点击“新建角色”创建
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {allCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={selectedIds.includes(character.id)}
              onSelect={() => handleToggle(character.id)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingRemoveId !== null}
        onOpenChange={(openState) => {
          if (!openState) {
            setPendingRemoveId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div
              data-slot="alert-dialog-media"
              className="mb-2 inline-flex size-16 items-center justify-center rounded-md bg-amber-100 text-amber-700"
            >
              <TriangleAlert className="size-8" />
            </div>
            <AlertDialogTitle>移除角色会影响现有内容</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  {pendingImpact?.characterName ?? "该角色"} 已经被当前项目的剧本或分镜引用。
                  你可以只移除项目关联，也可以同时把剧本和分镜里的该角色名一并清理掉。
                </p>

                {pendingImpact && (
                  <div className="space-y-3">
                    {pendingImpact.scriptScenes.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-600 text-white">
                            剧本引用 {pendingImpact.scriptScenes.length}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pendingImpact.scriptScenes.map((scene) => (
                            <Badge key={`script-${scene.sceneNumber}`} variant="outline">
                              剧本场景 {scene.sceneNumber}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingImpact.storyboards.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-destructive/40 text-destructive"
                          >
                            分镜引用 {pendingImpact.storyboards.length}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pendingImpact.storyboards.map((scene) => (
                            <Badge key={`storyboard-${scene.sceneNumber}`} variant="outline">
                              分镜场景 {scene.sceneNumber}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">取消</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              size="default"
              onClick={() => handleConfirmRemove(false)}
            >
              仅移除项目关联
            </AlertDialogAction>
            <AlertDialogAction
              variant="destructive"
              size="default"
              onClick={() => handleConfirmRemove(true)}
            >
              移除并清理引用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
