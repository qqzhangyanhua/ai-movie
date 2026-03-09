"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CharacterPicker } from "@/components/character/CharacterPicker";
import {
  buildCharacterRemovalImpactMap,
  type SceneCharacterReference,
} from "@/components/character/character-impact-utils";
import {
  addCharacterToProject,
  removeCharacterFromProject,
} from "@/lib/actions/character";
import type { Character } from "@prisma/client";

interface CharacterStepProps {
  projectId: string;
  allCharacters: Character[];
  selectedCharacterIds: string[];
  scriptScenes: SceneCharacterReference[];
  storyboards: SceneCharacterReference[];
  onNext?: () => void;
}

export function CharacterStep({
  projectId,
  allCharacters,
  selectedCharacterIds,
  scriptScenes,
  storyboards,
  onNext,
}: CharacterStepProps) {
  const router = useRouter();

  const removalImpacts = useMemo(
    () =>
      buildCharacterRemovalImpactMap(
        selectedCharacterIds,
        allCharacters,
        scriptScenes,
        storyboards
      ),
    [allCharacters, scriptScenes, selectedCharacterIds, storyboards]
  );

  const impactedCharacters = Object.values(removalImpacts);

  async function handleAdd(characterId: string) {
    await addCharacterToProject(projectId, characterId);
    router.refresh();
  }

  async function handleRemove(
    characterId: string,
    options?: { cleanupReferences?: boolean }
  ) {
    await removeCharacterFromProject(projectId, characterId, options);
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
      {impactedCharacters.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p>
                以下角色已被剧本或分镜引用，移除时可选择仅解绑，或一并清理现有引用。
              </p>
              <div className="flex flex-wrap gap-2">
                {impactedCharacters.map((impact) => (
                  <Badge
                    key={impact.characterId}
                    variant="outline"
                    className="border-amber-300 bg-background text-amber-800"
                  >
                    {impact.characterName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <CharacterPicker
        allCharacters={allCharacters}
        selectedIds={selectedCharacterIds}
        removalImpacts={removalImpacts}
        onAddToProject={handleAdd}
        onRemoveFromProject={handleRemove}
      />
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={selectedCharacterIds.length === 0}>
          下一步：选择剧本
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
