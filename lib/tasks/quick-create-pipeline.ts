import { prisma } from "@/lib/prisma";
import { deductVideoQuota } from "@/lib/actions/quota";

export async function executeQuickCreatePipeline(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, title: true, description: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "GENERATING" },
    });

    const quotaResult = await deductVideoQuota(project.userId);
    if (!quotaResult.success) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "FAILED" },
      });
      throw new Error(quotaResult.error);
    }

    await generateScript(projectId, project.title, project.description);
    await generateScenes(projectId);
    await generateVideo(projectId);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED" },
    });
  } catch (error) {
    console.error("Quick create pipeline error:", error);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "FAILED" },
    });
  }
}

async function generateScript(
  projectId: string,
  title: string,
  description: string | null
) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await prisma.script.create({
    data: {
      projectId,
      type: "AI_GENERATED",
      content: {
        scenes: [
          {
            sceneNumber: 1,
            description: `${title} - 开场`,
            duration: 5,
          },
          {
            sceneNumber: 2,
            description: description || "精彩内容",
            duration: 5,
          },
          {
            sceneNumber: 3,
            description: "结尾",
            duration: 5,
          },
        ],
      },
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });
}

async function generateScenes(projectId: string) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const script = await prisma.script.findUnique({
    where: { projectId },
    select: { content: true },
  });

  if (!script) throw new Error("Script not found");

  const scenes = (script.content as { scenes: Array<{ sceneNumber: number; description: string; duration: number }> }).scenes;

  for (const scene of scenes) {
    await prisma.scene.create({
      data: {
        projectId,
        sceneNumber: scene.sceneNumber,
        description: scene.description,
        characters: [],
        duration: scene.duration,
        status: "COMPLETED",
        progress: 100,
      },
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "STORYBOARD_READY" },
  });
}

async function generateVideo(projectId: string) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const scenes = await prisma.scene.findMany({
    where: { projectId },
    select: { duration: true },
  });

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  await prisma.video.create({
    data: {
      projectId,
      duration: totalDuration,
      resolution: "1080p",
      status: "COMPLETED",
      progress: 100,
      videoUrl: "/sample-video.mp4",
    },
  });
}
