import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(2, "用户名至少 2 个字符").max(50),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 个字符").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 个字符"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
