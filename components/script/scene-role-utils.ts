import type { ScriptScene } from "@/lib/data/script-templates";
import type { ProjectCharacterOption } from "@/components/script/types";

export interface SceneRoleIssue {
  missingCharacters: boolean;
  unknownCharacters: string[];
}

export interface SceneRoleSummary {
  missingSceneCount: number;
  unknownSceneCount: number;
  issueSceneNumbers: number[];
}

export function getSceneRoleIssue(
  scene: ScriptScene,
  projectCharacters: ProjectCharacterOption[]
): SceneRoleIssue {
  const selectedCharacters = scene.characters ?? [];
  const projectCharacterNames = new Set(projectCharacters.map((item) => item.name));

  return {
    missingCharacters: selectedCharacters.length === 0,
    unknownCharacters: selectedCharacters.filter(
      (name) => !projectCharacterNames.has(name)
    ),
  };
}

export function summarizeSceneRoleIssues(
  scenes: ScriptScene[],
  projectCharacters: ProjectCharacterOption[]
): SceneRoleSummary {
  return scenes.reduce<SceneRoleSummary>(
    (summary, scene) => {
      const issue = getSceneRoleIssue(scene, projectCharacters);
      const hasIssue = issue.missingCharacters || issue.unknownCharacters.length > 0;

      if (!hasIssue) {
        return summary;
      }

      return {
        missingSceneCount:
          summary.missingSceneCount + (issue.missingCharacters ? 1 : 0),
        unknownSceneCount:
          summary.unknownSceneCount + (issue.unknownCharacters.length > 0 ? 1 : 0),
        issueSceneNumbers: [...summary.issueSceneNumbers, scene.sceneNumber],
      };
    },
    {
      missingSceneCount: 0,
      unknownSceneCount: 0,
      issueSceneNumbers: [],
    }
  );
}
