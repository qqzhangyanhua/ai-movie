"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface CharacterPickerProps {
  allCharacters: Character[];
  selectedIds: string[];
  onAddToProject: (characterId: string) => Promise<void>;
  onRemoveFromProject: (characterId: string) => Promise<void>;
}

export function CharacterPicker({
  allCharacters,
  selectedIds,
  onAddToProject,
  onRemoveFromProject,
}: CharacterPickerProps) {
  const [open, setOpen] = useState(false);

  async function handleToggle(characterId: string) {
    const isSelected = selectedIds.includes(characterId);
    if (isSelected) {
      await onRemoveFromProject(characterId);
    } else {
      await onAddToProject(characterId);
    }
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
          暂无角色，点击「新建角色」创建
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {allCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              selected={selectedIds.includes(char.id)}
              onSelect={() => handleToggle(char.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
