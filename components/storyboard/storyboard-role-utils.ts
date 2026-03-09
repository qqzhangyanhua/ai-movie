import type { Storyboard } from "@prisma/client";

interface ProjectCharacter {
  id: string;
  name: string;
}

export interface StoryboardRoleIssue {
  missingCharacters: boolean;
  unknownCharacters: string[];
}

export interface StoryboardRoleSummary {
  missingStoryboardCount: number;
  unknownStoryboardCount: number;
  issueSceneNumbers: number[];
}

export function getStoryboardRoleIssue(
  storyboard: Pick<Storyboard, "characters" | "sceneNumber">,
  projectCharacters: ProjectCharacter[]
): StoryboardRoleIssue {
  const selectedCharacters = storyboard.characters ?? [];
  const projectCharacterNames = new Set(projectCharacters.map((item) => item.name));

  return {
    missingCharacters: selectedCharacters.length === 0,
    unknownCharacters: selectedCharacters.filter(
      (name) => !projectCharacterNames.has(name)
    ),
  };
}

export function summarizeStoryboardRoleIssues(
  storyboards: Array<Pick<Storyboard, "characters" | "sceneNumber">>,
  projectCharacters: ProjectCharacter[]
): StoryboardRoleSummary {
  return storyboards.reduce<StoryboardRoleSummary>(
    (summary, storyboard) => {
      const issue = getStoryboardRoleIssue(storyboard, projectCharacters);
      const hasIssue = issue.missingCharacters || issue.unknownCharacters.length > 0;

      if (!hasIssue) {
        return summary;
      }

      return {
        missingStoryboardCount:
          summary.missingStoryboardCount + (issue.missingCharacters ? 1 : 0),
        unknownStoryboardCount:
          summary.unknownStoryboardCount +
          (issue.unknownCharacters.length > 0 ? 1 : 0),
        issueSceneNumbers: [...summary.issueSceneNumbers, storyboard.sceneNumber],
      };
    },
    {
      missingStoryboardCount: 0,
      unknownStoryboardCount: 0,
      issueSceneNumbers: [],
    }
  );
}
