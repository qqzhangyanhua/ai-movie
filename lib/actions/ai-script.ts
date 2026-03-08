"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export type GenerateAiScriptResult =
  | { success: true; title: string }
  | { error: string };

export async function generateAiScript(
  projectId: string,
  prompt: string
): Promise<GenerateAiScriptResult> {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      characters: {
        include: { character: true },
      },
    },
  });
  if (!project) return { error: "项目不存在" };

  const characters = project.characters.map((pc) => ({
    name: pc.character.name,
    personality: pc.character.personality,
    style: pc.character.style,
  }));

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return await saveMockScript(projectId);
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const charDescriptions = characters.map((c) => {
      let desc = `- ${c.name}`;
      if (c.personality) desc += `，性格：${c.personality}`;
      if (c.style) desc += `，风格：${c.style}`;
      return desc;
    });

    const systemPrompt = `你是一位专业的微电影编剧。根据用户描述和角色信息，生成一个结构化的微电影剧本。
要求：
1. 剧本包含 3-5 个场景
2. 每个场景包含：场景编号、场景描述、角色动作、镜头类型（远景/中景/特写）、时长（4-8秒）、对白（可选）
3. 剧情要有起承转合
4. 角色行为要符合设定的性格特征
5. 总时长控制在 20-40 秒

请严格按照以下 JSON 格式返回：
{"title":"标题","scenes":[{"sceneNumber":1,"description":"场景描述","action":"角色动作","cameraType":"远景|中景|特写","duration":5,"dialogue":"对白"}]}`;

    const userMsg =
      charDescriptions.length > 0
        ? `用户描述：${prompt}\n\n角色信息：\n${charDescriptions.join("\n")}`
        : `用户描述：${prompt}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as { scenes?: unknown[]; title?: string };
    const scenes = (parsed.scenes ?? []) as Prisma.InputJsonValue;
    const title = parsed.title ?? prompt.slice(0, 20);

    await prisma.script.upsert({
      where: { projectId },
      create: {
        projectId,
        type: "AI_GENERATED",
        content: scenes,
        metadata: { title },
      },
      update: {
        type: "AI_GENERATED",
        content: scenes,
        metadata: { title },
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "SCRIPT_READY" },
    });

    revalidatePath(`/create/${projectId}`);
    return { success: true, title };
  } catch (error) {
    console.error("AI script generation failed:", error);
    return await saveMockScript(projectId);
  }
}

async function saveMockScript(
  projectId: string
): Promise<{ success: true; title: string }> {
  const mockScenes = [
    {
      sceneNumber: 1,
      description: "清晨的城市街道",
      action: "主角走在街道上",
      cameraType: "远景",
      duration: 5,
      dialogue: "",
    },
    {
      sceneNumber: 2,
      description: "咖啡厅内",
      action: "主角坐在窗边",
      cameraType: "中景",
      duration: 5,
      dialogue: "也许，是时候做出改变了。",
    },
    {
      sceneNumber: 3,
      description: "夕阳下的天台",
      action: "主角微笑望向远方",
      cameraType: "特写",
      duration: 6,
      dialogue: "",
    },
  ];

  await prisma.script.upsert({
    where: { projectId },
    create: {
      projectId,
      type: "AI_GENERATED",
      content: mockScenes,
      metadata: { title: "AI 生成剧本" },
    },
    update: {
      type: "AI_GENERATED",
      content: mockScenes,
      metadata: { title: "AI 生成剧本" },
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true, title: "AI 生成剧本（示例）" };
}
