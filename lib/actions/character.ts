"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createCharacterSchema,
  addCharacterToProjectSchema,
} from "@/lib/validations/character";

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
  characterId: string
) {
  const session = await requireAuth();
  await prisma.projectCharacter.deleteMany({
    where: {
      projectId,
      characterId,
      project: { userId: session.user.id },
    },
  });
  revalidatePath(`/create/${projectId}`);
}

export async function deleteCharacter(characterId: string) {
  const session = await requireAuth();
  await prisma.character.deleteMany({
    where: { id: characterId, userId: session.user.id },
  });
  revalidatePath("/dashboard/characters");
}
