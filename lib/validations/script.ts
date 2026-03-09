import { z } from "zod";

const CAMERA_TYPES = ["远景", "中景", "特写"] as const;

export const scriptSceneSchema = z.object({
  sceneNumber: z.number().int().min(1),
  description: z.string().min(1, "请输入场景描述"),
  characters: z.array(z.string().min(1, "角色名不能为空")).optional().default([]),
  action: z.string().optional().default(""),
  cameraType: z.enum(CAMERA_TYPES).optional().default("中景"),
  duration: z.number().int().min(1).max(30).default(5),
  dialogue: z.string().optional(),
});

export const scriptScenesSchema = z.array(scriptSceneSchema);

export const applyScriptTemplateSchema = z.object({
  projectId: z.string().min(1),
  templateId: z.string().min(1),
});

export const saveCustomScriptSchema = z.object({
  projectId: z.string().min(1),
  scenes: z.array(scriptSceneSchema),
});

export const updateScriptSceneSchema = z.object({
  projectId: z.string().min(1),
  sceneIndex: z.number().int().min(0),
  updates: z.object({
    description: z.string().optional(),
    characters: z.array(z.string().min(1, "角色名不能为空")).optional(),
    action: z.string().optional(),
    cameraType: z.enum(CAMERA_TYPES).optional(),
    duration: z.number().int().min(1).max(30).optional(),
    dialogue: z.string().optional(),
  }),
});

export type ScriptSceneInput = z.infer<typeof scriptSceneSchema>;
export type ScriptScenesInput = z.infer<typeof scriptScenesSchema>;
