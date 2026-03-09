"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, TriangleAlert, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CharacterCard } from "@/components/character/CharacterCard";
import { CharacterDetailDialog } from "@/components/character/CharacterDetailDialog";
import { CharacterCreateDialog } from "@/components/character/CharacterCreateDialog";
import type { SceneCharacterReference } from "@/components/character/character-impact-utils";
import { deleteCharacter } from "@/lib/actions/character";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { Character, Project, ProjectCharacter, Scene } from "@prisma/client";

type ProjectWithReferences = Project & {
  script: { content: unknown } | null;
  scenes: Pick<Scene, "id" | "sceneNumber" | "description" | "characters">[];
};

export type CharacterWithProjects = Character & {
  projects: (ProjectCharacter & { project: ProjectWithReferences })[];
};

interface CharacterGridProps {
  characters: CharacterWithProjects[];
}

interface DeleteImpactSummary {
  projectId: string;
  projectTitle: string;
  scriptScenes: SceneCharacterReference[];
  storyboardScenes: SceneCharacterReference[];
}

function normalizeScriptScenes(content: unknown): SceneCharacterReference[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content.flatMap((scene, index) => {
    if (!scene || typeof scene !== "object") {
      return [];
    }

    const item = scene as {
      sceneNumber?: unknown;
      description?: unknown;
      characters?: unknown;
    };

    return [
      {
        sceneNumber:
          typeof item.sceneNumber === "number" ? item.sceneNumber : index + 1,
        description:
          typeof item.description === "string"
            ? item.description
            : `场景 ${index + 1}`,
        characters: Array.isArray(item.characters)
          ? item.characters.filter(
              (name): name is string => typeof name === "string"
            )
          : [],
      },
    ];
  });
}

function getDeleteImpactSummaries(
  character: CharacterWithProjects | null
): DeleteImpactSummary[] {
  if (!character) {
    return [];
  }

  return character.projects
    .map((projectCharacter) => {
      const project = projectCharacter.project;
      const scriptScenes = normalizeScriptScenes(project.script?.content).filter(
        (scene) => scene.characters.includes(character.name)
      );
      const storyboardScenes = project.scenes
        .map<SceneCharacterReference>((scene) => ({
          sceneNumber: scene.sceneNumber,
          description: scene.description,
          characters: scene.characters,
        }))
        .filter((scene) => scene.characters.includes(character.name));

      return {
        projectId: project.id,
        projectTitle: project.title,
        scriptScenes,
        storyboardScenes,
      };
    })
    .filter(
      (impact) =>
        impact.scriptScenes.length > 0 || impact.storyboardScenes.length > 0
    );
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCharacter, setDetailCharacter] = useState<CharacterWithProjects | null>(null);
  const [deleteCharacterState, setDeleteCharacterState] = useState<CharacterWithProjects | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredCharacters = useMemo(() => {
    if (!search.trim()) return characters;
    const q = search.trim().toLowerCase();
    return characters.filter((c) => c.name.toLowerCase().includes(q));
  }, [characters, search]);

  const deleteImpacts = useMemo(
    () => getDeleteImpactSummaries(deleteCharacterState),
    [deleteCharacterState]
  );
  const hasDeleteImpact = deleteImpacts.length > 0;

  async function handleDelete(cleanupReferences: boolean) {
    if (!deleteCharacterState) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    const result = await deleteCharacter(deleteCharacterState.id, {
      cleanupReferences,
    });
    setDeleting(false);

    if (result?.error) {
      setDeleteError(result.error);
      return;
    }

    setDeleteError(null);
    setDeleteCharacterState(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索角色名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <CharacterCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => router.refresh()}
        >
          <Button className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
            <Plus className="size-4" />
            新建角色
          </Button>
        </CharacterCreateDialog>
      </div>

      {filteredCharacters.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardHeader>
            <Users className="mx-auto size-12 text-muted-foreground" />
            <CardTitle className="text-center">
              {characters.length === 0 ? "还没有角色" : "未找到匹配的角色"}
            </CardTitle>
            <CardDescription className="text-center">
              {characters.length === 0
                ? "创建您的第一个角色，上传照片后可生成三视图用于微电影制作"
                : `没有找到包含「${search}」的角色，请尝试其他关键词`}
            </CardDescription>
          </CardHeader>
          {characters.length === 0 && (
            <CardContent>
              <CharacterCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={() => router.refresh()}
              >
                <Button className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
                  <Plus className="size-4" />
                  新建角色
                </Button>
              </CharacterCreateDialog>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              showDelete
              projectCount={character.projects.length}
              onSelect={() => setDetailCharacter(character)}
              onDelete={() => {
                setDeleteError(null);
                setDeleteCharacterState(character);
              }}
            />
          ))}
        </div>
      )}

      {detailCharacter && (
        <CharacterDetailDialog
          character={detailCharacter}
          open={!!detailCharacter}
          onOpenChange={(open) => !open && setDetailCharacter(null)}
          onDeleted={() => setDetailCharacter(null)}
        />
      )}

      <Dialog
        open={!!deleteCharacterState}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteCharacterState(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            {hasDeleteImpact && (
              <div className="mb-2 inline-flex size-12 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <TriangleAlert className="size-6" />
              </div>
            )}
            <DialogTitle>
              {hasDeleteImpact ? "删除角色会影响现有内容" : "确认删除"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {hasDeleteImpact
                    ? `角色「${deleteCharacterState?.name ?? ""}」已在部分项目的剧本或分镜中被引用。你可以只删除角色，也可以同时清理这些引用。`
                    : `确定要删除角色「${deleteCharacterState?.name ?? ""}」吗？此操作不可恢复。`}
                </p>

                {hasDeleteImpact && (
                  <div className="space-y-3 text-left">
                    {deleteImpacts.map((impact) => (
                      <div
                        key={impact.projectId}
                        className="rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="text-sm font-medium">
                          {impact.projectTitle}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {impact.scriptScenes.length > 0 && (
                            <span className="rounded-full border px-2 py-0.5 text-xs">
                              剧本引用 {impact.scriptScenes.length}
                            </span>
                          )}
                          {impact.storyboardScenes.length > 0 && (
                            <span className="rounded-full border px-2 py-0.5 text-xs">
                              分镜引用 {impact.storyboardScenes.length}
                            </span>
                          )}
                        </div>
                        {impact.scriptScenes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {impact.scriptScenes.map((scene) => (
                              <span
                                key={`script-${impact.projectId}-${scene.sceneNumber}`}
                                className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                剧本场景 {scene.sceneNumber}
                              </span>
                            ))}
                          </div>
                        )}
                        {impact.storyboardScenes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {impact.storyboardScenes.map((scene) => (
                              <span
                                key={`storyboard-${impact.projectId}-${scene.sceneNumber}`}
                                className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                分镜场景 {scene.sceneNumber}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCharacterState(null)}
              disabled={deleting}
            >
              取消
            </Button>
            {hasDeleteImpact ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(false)}
                  disabled={deleting}
                >
                  仅删除角色
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(true)}
                  disabled={deleting}
                >
                  删除并清理引用
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleDelete(false)}
                disabled={deleting}
              >
                删除
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
