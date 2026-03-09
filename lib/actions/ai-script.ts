"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export type GenerateAiScriptResult =
  | { success: true; title: string }
  | { error: string };

type CharacterSummary = {
  name: string;
  personality?: string | null;
  style?: string | null;
};

type ScriptScene = {
  sceneNumber: number;
  description: string;
  characters: string[];
  action: string;
  cameraType: "远景" | "中景" | "特写";
  duration: number;
  dialogue?: string;
};

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
      return await saveMockScript(projectId, characters);
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const charDescriptions = characters.map((character) => {
      let desc = `- ${character.name}`;
      if (character.personality) desc += `，性格：${character.personality}`;
      if (character.style) desc += `，外观：${character.style}`;
      return desc;
    });

    const systemPrompt = `你是一位专业的微电影编剧。请根据用户描述和角色信息，生成一个结构化剧本。
要求：
1. 剧本包含 3-5 个场景。
2. 每个场景必须包含：sceneNumber、description、characters、action、cameraType、duration、dialogue。
3. characters 必须是字符串数组，只能使用提供过的角色名；单角色场景也必须返回数组。
4. 故事需要有起承转合，角色行为要符合设定。
5. 总时长控制在 20-40 秒之间。

请严格返回 JSON：
{"title":"标题","scenes":[{"sceneNumber":1,"description":"场景描述","characters":["角色A"],"action":"角色动作","cameraType":"远景|中景|特写","duration":5,"dialogue":"对白"}]}`;

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
    const normalizedScenes = normalizeScenes(parsed.scenes ?? [], characters);
    const title = (parsed.title ?? prompt.slice(0, 20)) || "AI 微电影";

    await prisma.script.upsert({
      where: { projectId },
      create: {
        projectId,
        type: "AI_GENERATED",
        content: normalizedScenes as Prisma.InputJsonValue,
        metadata: { title },
      },
      update: {
        type: "AI_GENERATED",
        content: normalizedScenes as Prisma.InputJsonValue,
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
    return await saveMockScript(projectId, characters);
  }
}

async function saveMockScript(
  projectId: string,
  characters: CharacterSummary[]
): Promise<{ success: true; title: string }> {
  const charNames = characters.map((character) => character.name).filter(Boolean);
  const mainChar = charNames[0] ?? "主角";
  const supportChar = charNames[1] ?? mainChar;

  const mockScenes: ScriptScene[] = [
    {
      sceneNumber: 1,
      description: "清晨的城市街道",
      characters: [mainChar],
      action: `${mainChar}走在街道上`,
      cameraType: "远景",
      duration: 5,
      dialogue: "",
    },
    {
      sceneNumber: 2,
      description: "咖啡厅内",
      characters: supportChar === mainChar ? [mainChar] : [mainChar, supportChar],
      action: `${mainChar}坐在窗边`,
      cameraType: "中景",
      duration: 5,
      dialogue: "也许，是时候做出改变了。",
    },
    {
      sceneNumber: 3,
      description: "夕阳下的天台",
      characters: [mainChar],
      action: `${mainChar}微笑望向远方`,
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

function normalizeScenes(rawScenes: unknown[], characters: CharacterSummary[]): ScriptScene[] {
  const availableNames = characters.map((character) => character.name).filter(Boolean);

  return rawScenes.map((rawScene, index) => {
    const scene = (rawScene ?? {}) as Record<string, unknown>;
    const sceneCharacters = Array.isArray(scene.characters)
      ? scene.characters.map(String).map((name) => name.trim()).filter(Boolean)
      : [];

    return {
      sceneNumber:
        typeof scene.sceneNumber === "number" && Number.isFinite(scene.sceneNumber)
          ? scene.sceneNumber
          : index + 1,
      description: typeof scene.description === "string" ? scene.description : "",
      characters:
        sceneCharacters.length > 0
          ? sceneCharacters
          : availableNames.length > 0
            ? [availableNames[0]]
            : ["主角"],
      action: typeof scene.action === "string" ? scene.action : "",
      cameraType: normalizeCameraType(scene.cameraType),
      duration:
        typeof scene.duration === "number" && Number.isFinite(scene.duration)
          ? Math.min(Math.max(Math.round(scene.duration), 1), 30)
          : 5,
      dialogue: typeof scene.dialogue === "string" ? scene.dialogue : "",
    };
  });
}

function normalizeCameraType(cameraType: unknown): ScriptScene["cameraType"] {
  if (cameraType === "远景" || cameraType === "中景" || cameraType === "特写") {
    return cameraType;
  }
  return "中景";
}
