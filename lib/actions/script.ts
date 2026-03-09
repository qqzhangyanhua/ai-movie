"use server";

import { revalidatePath } from "next/cache";
import { ScriptType } from "@prisma/client";
import { requireAuth } from "@/lib/auth-utils";
import { scriptTemplates } from "@/lib/data/script-templates";
import type { ScriptScene } from "@/lib/data/script-templates";
import { prisma } from "@/lib/prisma";

const DEFAULT_CAMERA_TYPE = "中景" as ScriptScene["cameraType"];

function normalizeScene(
  scene: Partial<ScriptScene>,
  sceneNumber: number
): ScriptScene {
  return {
    sceneNumber,
    description: scene.description ?? "",
    characters: scene.characters ?? [],
    action: scene.action ?? "",
    cameraType: scene.cameraType ?? DEFAULT_CAMERA_TYPE,
    duration: scene.duration ?? 5,
    dialogue: scene.dialogue ?? "",
  };
}

function normalizeScenes(scenes: unknown[]): ScriptScene[] {
  return scenes.map((scene, index) =>
    normalizeScene((scene ?? {}) as Partial<ScriptScene>, index + 1)
  );
}

export async function applyScriptTemplate(projectId: string, templateId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const template = scriptTemplates.find((item) => item.id === templateId);
  if (!template) return { error: "模板不存在" };

  await prisma.script.upsert({
    where: { projectId },
    create: {
      projectId,
      type: ScriptType.TEMPLATE,
      content: normalizeScenes(template.scenes) as unknown as object,
      metadata: { title: template.title, category: template.category },
    },
    update: {
      type: ScriptType.TEMPLATE,
      content: normalizeScenes(template.scenes) as unknown as object,
      metadata: { title: template.title, category: template.category },
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function saveCustomScript(projectId: string, scenes: unknown[]) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const validScenes = normalizeScenes(scenes);

  await prisma.script.upsert({
    where: { projectId },
    create: {
      projectId,
      type: ScriptType.CUSTOM,
      content: validScenes as unknown as object,
    },
    update: {
      type: ScriptType.CUSTOM,
      content: validScenes as unknown as object,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function updateScriptScene(
  projectId: string,
  sceneIndex: number,
  updates: Partial<ScriptScene>
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[];
  if (!Array.isArray(content) || sceneIndex < 0 || sceneIndex >= content.length) {
    return { error: "场景索引无效" };
  }

  const updatedScenes = [...content];
  updatedScenes[sceneIndex] = normalizeScene(
    { ...updatedScenes[sceneIndex], ...updates },
    updatedScenes[sceneIndex]?.sceneNumber ?? sceneIndex + 1
  );

  await prisma.script.update({
    where: { projectId },
    data: { content: updatedScenes as unknown as object },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function addScene(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[];
  if (!Array.isArray(content)) return { error: "剧本内容无效" };

  const newSceneNumber = content.length + 1;
  const newScene = normalizeScene({}, newSceneNumber);
  const updatedScenes = [...content, newScene];

  await prisma.script.update({
    where: { projectId },
    data: { content: updatedScenes as unknown as object },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function deleteScene(projectId: string, sceneIndex: number) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[];
  if (!Array.isArray(content) || sceneIndex < 0 || sceneIndex >= content.length) {
    return { error: "场景索引无效" };
  }

  const updatedScenes = content
    .filter((_, index) => index !== sceneIndex)
    .map((scene, index) => normalizeScene(scene, index + 1));

  await prisma.script.update({
    where: { projectId },
    data: { content: updatedScenes as unknown as object },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function reorderScenes(
  projectId: string,
  fromIndex: number,
  toIndex: number
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[];
  if (!Array.isArray(content)) return { error: "剧本内容无效" };
  if (
    fromIndex < 0 ||
    fromIndex >= content.length ||
    toIndex < 0 ||
    toIndex >= content.length
  ) {
    return { error: "场景索引无效" };
  }

  const updatedScenes = [...content];
  const [removedScene] = updatedScenes.splice(fromIndex, 1);
  updatedScenes.splice(toIndex, 0, removedScene);

  const renumberedScenes = updatedScenes.map((scene, index) =>
    normalizeScene(scene, index + 1)
  );

  await prisma.script.update({
    where: { projectId },
    data: { content: renumberedScenes as unknown as object },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function deleteScript(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  await prisma.script.deleteMany({
    where: { projectId },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "DRAFT" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
