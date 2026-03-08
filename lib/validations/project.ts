import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "请输入电影名称").max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
