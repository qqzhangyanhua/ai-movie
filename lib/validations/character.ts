import { z } from "zod";

export const createCharacterSchema = z.object({
  name: z.string().min(1, "请输入角色名称").max(50),
  photoUrl: z.string().min(1, "请上传角色照片"),
  personality: z.string().optional(),
  style: z.string().optional(),
});

export const addCharacterToProjectSchema = z.object({
  characterId: z.string(),
  relationship: z.string().optional(),
  roleName: z.string().optional(),
});

export const updateCharacterSchema = z.object({
  name: z.string().min(1, "请输入角色名称").max(50).optional(),
  personality: z.string().optional(),
  style: z.string().optional(),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
