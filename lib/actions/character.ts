"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { ScriptScene } from "@/lib/data/script-templates";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { enqueueTask } from "@/lib/queue";
import {
  addCharacterToProjectSchema,
  createCharacterSchema,
  updateCharacterSchema,
} from "@/lib/validations/character";

function removeCharacterNameFromScenes(
  scenes: ScriptScene[],
  characterName: string
): ScriptScene[] {
  return scenes.map((scene) => ({
    ...scene,
    characters: (scene.characters ?? []).filter((name) => name !== characterName),
  }));
}

function renameCharacterInScenes(
  scenes: ScriptScene[],
  previousName: string,
  nextName: string
): ScriptScene[] {
  return scenes.map((scene) => ({
    ...scene,
    characters: (scene.characters ?? []).map((name) =>
      name === previousName ? nextName : name
    ),
  }));
}

export async function createCharacter(data: {
  name: string;
  photoUrl: string;
  personality?: string;
  style?: string;
}) {
  const session = await requireAuth();
  const parsed = createCharacterSchema.safeParse(data);
  if (!parsed.success) return { error: "输入无效" };

  const character = await prisma.character.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  revalidatePath("/dashboard/characters");
  revalidatePath("/create");
  return { data: character };
}

export async function addCharacterToProject(
  projectId: string,
  characterId: string,
  relationship?: string,
  roleName?: string
) {
  const session = await requireAuth();
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const parsed = addCharacterToProjectSchema.safeParse({
    characterId,
    relationship,
    roleName,
  });
  if (!parsed.success) return { error: "输入无效" };

  await prisma.projectCharacter.upsert({
    where: { projectId_characterId: { projectId, characterId } },
    create: {
      projectId,
      characterId,
      relationship: parsed.data.relationship,
      roleName: parsed.data.roleName,
    },
    update: {
      relationship: parsed.data.relationship,
      roleName: parsed.data.roleName,
    },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function removeCharacterFromProject(
  projectId: string,
  characterId: string,
  options?: { cleanupReferences?: boolean }
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      script: true,
      scenes: true,
      characters: {
        where: { characterId },
        include: { character: { select: { name: true } } },
      },
    },
  });

  if (!project) return { error: "项目不存在" };

  const projectCharacter = project.characters[0];
  const characterName = projectCharacter?.character.name;
  const cleanupCharacterName =
    options?.cleanupReferences && characterName ? characterName : null;

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.projectCharacter.deleteMany({
      where: {
        projectId,
        characterId,
        project: { userId: session.user.id },
      },
    }),
  ];

  if (cleanupCharacterName && project.script) {
    const content = project.script.content as ScriptScene[] | null;
    if (Array.isArray(content)) {
      operations.push(
        prisma.script.update({
          where: { projectId },
          data: {
            content: removeCharacterNameFromScenes(
              content,
              cleanupCharacterName
            ) as unknown as object,
          },
        })
      );
    }
  }

  if (cleanupCharacterName) {
    for (const scene of project.scenes) {
      if (!scene.characters.includes(cleanupCharacterName)) {
        continue;
      }

      operations.push(
        prisma.scene.update({
          where: { id: scene.id },
          data: {
            characters: scene.characters.filter(
              (name) => name !== cleanupCharacterName
            ),
          },
        })
      );
    }
  }

  await prisma.$transaction(operations);
  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function deleteCharacter(
  characterId: string,
  options?: { cleanupReferences?: boolean }
) {
  const session = await requireAuth();
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id },
    include: {
      projects: {
        include: {
          project: {
            include: {
              script: true,
              scenes: true,
            },
          },
        },
      },
    },
  });
  if (!character) return { error: "角色不存在" };

  await prisma.$transaction(async (tx) => {
    if (options?.cleanupReferences) {
      for (const projectCharacter of character.projects) {
        const project = projectCharacter.project;

        if (project.script) {
          const content = project.script.content as ScriptScene[] | null;
          if (Array.isArray(content)) {
            await tx.script.update({
              where: { projectId: project.id },
              data: {
                content: removeCharacterNameFromScenes(
                  content,
                  character.name
                ) as Prisma.InputJsonValue,
              },
            });
          }
        }

        for (const scene of project.scenes) {
          if (!scene.characters.includes(character.name)) {
            continue;
          }

          await tx.scene.update({
            where: { id: scene.id },
            data: {
              characters: scene.characters.filter(
                (name) => name !== character.name
              ),
            },
          });
        }
      }
    }

    await tx.character.delete({
      where: { id: characterId },
    });
  });
  revalidatePath("/dashboard/characters");
  revalidatePath("/create");
  for (const projectCharacter of character.projects) {
    revalidatePath(`/create/${projectCharacter.projectId}`);
  }

  return { success: true };
}

export async function updateCharacter(
  characterId: string,
  data: { name?: string; personality?: string; style?: string },
  options?: { syncProjectReferences?: boolean }
) {
  const session = await requireAuth();
  const parsed = updateCharacterSchema.safeParse(data);
  if (!parsed.success) return { error: "输入无效" };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id },
    include: {
      projects: {
        include: {
          project: {
            include: {
              script: true,
              scenes: true,
            },
          },
        },
      },
    },
  });
  if (!character) return { error: "角色不存在" };

  const trimmedName =
    parsed.data.name !== undefined ? parsed.data.name.trim() : undefined;

  if (parsed.data.name !== undefined && !trimmedName) {
    return { error: "请输入角色名称" };
  }

  const updateData: { name?: string; personality?: string; style?: string } =
    {};
  if (trimmedName !== undefined) updateData.name = trimmedName;
  if (parsed.data.personality !== undefined) {
    updateData.personality = parsed.data.personality;
  }
  if (parsed.data.style !== undefined) updateData.style = parsed.data.style;

  if (Object.keys(updateData).length === 0) return { data: character };

  const nextName = trimmedName;
  const previousName = character.name;
  const shouldSyncReferences =
    !!options?.syncProjectReferences &&
    !!nextName &&
    nextName.length > 0 &&
    nextName !== previousName;

  const updated = await prisma.$transaction(async (tx) => {
    const nextCharacter = await tx.character.update({
      where: { id: characterId },
      data: updateData,
    });

    if (!shouldSyncReferences || !nextName) {
      return nextCharacter;
    }

    for (const projectCharacter of character.projects) {
      const project = projectCharacter.project;

      if (project.script) {
        const content = project.script.content as ScriptScene[] | null;
        if (Array.isArray(content)) {
          await tx.script.update({
            where: { projectId: project.id },
            data: {
              content: renameCharacterInScenes(
                content,
                previousName,
                nextName
              ) as Prisma.InputJsonValue,
            },
          });
        }
      }

      for (const scene of project.scenes) {
        if (!scene.characters.includes(previousName)) {
          continue;
        }

        await tx.scene.update({
          where: { id: scene.id },
          data: {
            characters: scene.characters.map((name) =>
              name === previousName ? nextName : name
            ),
          },
        });
      }
    }

    return nextCharacter;
  });

  revalidatePath("/dashboard/characters");
  revalidatePath("/create");
  for (const projectCharacter of character.projects) {
    revalidatePath(`/create/${projectCharacter.projectId}`);
  }

  return { data: updated };
}

export async function generateCharacterViews(characterId: string) {
  const session = await requireAuth();
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id },
  });
  if (!character) return { error: "角色不存在" };

  await enqueueTask({
    taskType: "character:generate",
    projectId: characterId,
    userId: session.user.id,
    data: {
      characterId,
      photoUrl: character.photoUrl,
      characterName: character.name,
    },
  });

  revalidatePath("/dashboard/characters");
  return { success: true };
}
