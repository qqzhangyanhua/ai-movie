import type { Character } from "@prisma/client";

export interface SceneCharacterReference {
  sceneNumber: number;
  description: string;
  characters: string[];
}

export interface CharacterRemovalImpact {
  characterId: string;
  characterName: string;
  scriptScenes: SceneCharacterReference[];
  storyboards: SceneCharacterReference[];
}

export function getCharacterRemovalImpact(
  characterId: string,
  allCharacters: Pick<Character, "id" | "name">[],
  scriptScenes: SceneCharacterReference[],
  storyboards: SceneCharacterReference[]
): CharacterRemovalImpact | null {
  const character = allCharacters.find((item) => item.id === characterId);
  if (!character) {
    return null;
  }

  const scriptReferences = scriptScenes.filter((scene) =>
    (scene.characters ?? []).includes(character.name)
  );
  const storyboardReferences = storyboards.filter((scene) =>
    (scene.characters ?? []).includes(character.name)
  );

  if (scriptReferences.length === 0 && storyboardReferences.length === 0) {
    return null;
  }

  return {
    characterId,
    characterName: character.name,
    scriptScenes: scriptReferences,
    storyboards: storyboardReferences,
  };
}

export function buildCharacterRemovalImpactMap(
  selectedCharacterIds: string[],
  allCharacters: Pick<Character, "id" | "name">[],
  scriptScenes: SceneCharacterReference[],
  storyboards: SceneCharacterReference[]
): Record<string, CharacterRemovalImpact> {
  return selectedCharacterIds.reduce<Record<string, CharacterRemovalImpact>>(
    (result, characterId) => {
      const impact = getCharacterRemovalImpact(
        characterId,
        allCharacters,
        scriptScenes,
        storyboards
      );

      if (impact) {
        result[characterId] = impact;
      }

      return result;
    },
    {}
  );
}
