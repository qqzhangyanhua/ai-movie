"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { enqueueTask } from "@/lib/queue";
import {
  createCharacterSchema,
  addCharacterToProjectSchema,
  updateCharacterSchema,
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

export async function updateCharacter(
  characterId: string,
  data: { name?: string; personality?: string; style?: string }
) {
  const session = await requireAuth();
  const parsed = updateCharacterSchema.safeParse(data);
  if (!parsed.success) return { error: "输入无效" };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id },
  });
  if (!character) return { error: "角色不存在" };

  const updateData: { name?: string; personality?: string; style?: string } =
    {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.personality !== undefined)
    updateData.personality = parsed.data.personality;
  if (parsed.data.style !== undefined) updateData.style = parsed.data.style;

  if (Object.keys(updateData).length === 0) return { data: character };

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: updateData,
  });

  revalidatePath("/dashboard/characters");
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
