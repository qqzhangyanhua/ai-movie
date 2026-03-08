"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { scriptTemplates } from "@/lib/data/script-templates";
import { ScriptType } from "@prisma/client";
import type { ScriptScene } from "@/lib/data/script-templates";

export async function applyScriptTemplate(projectId: string, templateId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const template = scriptTemplates.find((t) => t.id === templateId);
  if (!template) return { error: "模板不存在" };

  await prisma.script.upsert({
    where: { projectId },
    create: {
      projectId,
      type: ScriptType.TEMPLATE,
      content: template.scenes as unknown as object,
      metadata: { title: template.title, category: template.category },
    },
    update: {
      type: ScriptType.TEMPLATE,
      content: template.scenes as unknown as object,
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

  const validScenes = scenes as ScriptScene[];

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
  updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], ...updates };

  await prisma.script.update({
    where: { projectId },
    data: { content: updatedScenes as unknown as object },
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
