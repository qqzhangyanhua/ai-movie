"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterPicker } from "@/components/character/CharacterPicker";
import {
  addCharacterToProject,
  removeCharacterFromProject,
} from "@/lib/actions/character";
import type { Character } from "@prisma/client";

interface CharacterStepProps {
  projectId: string;
  allCharacters: Character[];
  selectedCharacterIds: string[];
  onNext?: () => void;
}

export function CharacterStep({
  projectId,
  allCharacters,
  selectedCharacterIds,
  onNext,
}: CharacterStepProps) {
  const router = useRouter();

  async function handleAdd(characterId: string) {
    await addCharacterToProject(projectId, characterId);
    router.refresh();
  }

  async function handleRemove(characterId: string) {
    await removeCharacterFromProject(projectId, characterId);
    router.refresh();
  }

  function handleNext() {
    if (onNext) {
      onNext();
    } else {
      router.push(`/create/${projectId}?step=script`);
    }
  }

  return (
    <div className="space-y-6">
      <CharacterPicker
        allCharacters={allCharacters}
        selectedIds={selectedCharacterIds}
        onAddToProject={handleAdd}
        onRemoveFromProject={handleRemove}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={selectedCharacterIds.length === 0}
        >
          下一步：选择剧本
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
