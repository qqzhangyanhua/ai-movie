import { z } from "zod";

export const serviceConfigSchema = z.object({
  type: z.enum(["LLM", "VIDEO_GENERATION", "STORAGE", "TTS"]),
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional(),
  region: z.string().optional(),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  isActive: z.boolean(),
  config: z.record(z.unknown()).optional(),
});

export const llmConfigSchema = z.object({
  type: z.literal("LLM"),
  name: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().min(1),
  isActive: z.boolean(),
  config: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
    })
    .optional(),
});

export const videoGenerationConfigSchema = z.object({
  type: z.literal("VIDEO_GENERATION"),
  name: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().optional(),
  isActive: z.boolean(),
  config: z
    .object({
      duration: z.number().positive().optional(),
      resolution: z.string().optional(),
    })
    .optional(),
});

export const storageConfigSchema = z.object({
  type: z.literal("STORAGE"),
  name: z.string().min(1),
  provider: z.string().min(1),
  endpoint: z.string().min(1),
  bucket: z.string().min(1),
  region: z.string().optional(),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
  isActive: z.boolean(),
  config: z
    .object({
      forcePathStyle: z.boolean().optional(),
    })
    .optional(),
});

export const ttsConfigSchema = z.object({
  type: z.literal("TTS"),
  name: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().optional(),
  isActive: z.boolean(),
  config: z
    .object({
      voice: z.string().optional(),
    })
    .optional(),
});

export type ServiceConfigInput = z.infer<typeof serviceConfigSchema>;
export type LLMConfigInput = z.infer<typeof llmConfigSchema>;
export type VideoGenerationConfigInput = z.infer<
  typeof videoGenerationConfigSchema
>;
export type StorageConfigInput = z.infer<typeof storageConfigSchema>;
export type TTSConfigInput = z.infer<typeof ttsConfigSchema>;
