"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import type { ScriptScene } from "@/lib/data/script-templates";
import { prisma } from "@/lib/prisma";

export async function generateStoryboardsFromScript(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { script: true },
  });
  if (!project) return { error: "项目不存在" };
  if (!project.script) return { error: "剧本不存在" };

  const content = project.script.content as ScriptScene[] | null;
  if (!Array.isArray(content) || content.length === 0) {
    return { error: "剧本内容为空" };
  }

  await prisma.storyboard.deleteMany({
    where: { projectId },
  });

  for (let index = 0; index < content.length; index++) {
    const scene = content[index];
    const storyboard = await prisma.storyboard.create({
      data: {
        projectId,
        sceneNumber: scene.sceneNumber ?? index + 1,
        description: scene.description ?? "",
        characters: scene.characters ?? [],
        action: scene.action ?? null,
        cameraType: scene.cameraType ?? null,
        duration: scene.duration ?? 5,
      },
    });

    await prisma.videoClip.create({
      data: { storyboardId: storyboard.id },
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "STORYBOARD_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function updateStoryboard(
  storyboardId: string,
  data: {
    description?: string;
    action?: string;
    cameraType?: string;
    duration?: number;
    characters?: string[];
  }
) {
  const session = await requireAuth();

  const storyboard = await prisma.storyboard.findFirst({
    where: {
      id: storyboardId,
      project: { userId: session.user.id },
    },
  });
  if (!storyboard) return { error: "分镜不存在" };

  await prisma.storyboard.update({
    where: { id: storyboardId },
    data: {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.action !== undefined && { action: data.action }),
      ...(data.cameraType !== undefined && { cameraType: data.cameraType }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.characters !== undefined && { characters: data.characters }),
    },
  });

  revalidatePath(`/create/${storyboard.projectId}`);
  return { success: true };
}

export async function deleteStoryboard(storyboardId: string) {
  const session = await requireAuth();

  const storyboard = await prisma.storyboard.findFirst({
    where: {
      id: storyboardId,
      project: { userId: session.user.id },
    },
  });
  if (!storyboard) return { error: "分镜不存在" };

  const projectId = storyboard.projectId;

  await prisma.storyboard.delete({
    where: { id: storyboardId },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function addStoryboard(
  projectId: string,
  data: {
    sceneNumber: number;
    description: string;
    action?: string;
    cameraType?: string;
    duration?: number;
  }
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const storyboard = await prisma.storyboard.create({
    data: {
      projectId,
      sceneNumber: data.sceneNumber,
      description: data.description,
      characters: [],
      action: data.action ?? null,
      cameraType: data.cameraType ?? null,
      duration: data.duration ?? 5,
    },
  });

  await prisma.videoClip.create({
    data: { storyboardId: storyboard.id },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function reorderStoryboards(
  projectId: string,
  storyboardIds: string[]
) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "项目不存在" };

  const updates = storyboardIds.map((id, index) =>
    prisma.storyboard.updateMany({
      where: { id, projectId },
      data: { sceneNumber: index + 1 },
    })
  );

  await prisma.$transaction(updates);

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
