import { ServiceType } from "@prisma/client";

export interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VideoGenerationConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  duration?: number;
  resolution?: string;
}

export interface StorageConfig {
  endpoint: string;
  bucket: string;
  region?: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle?: boolean;
}

export interface TTSConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  voice?: string;
}

export type ServiceConfigData =
  | LLMConfig
  | VideoGenerationConfig
  | StorageConfig
  | TTSConfig;

export interface ServiceConfigInput {
  type: ServiceType;
  name: string;
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  isActive: boolean;
  config?: Record<string, unknown>;
}

export interface ServiceConfigOutput {
  id: string;
  type: ServiceType;
  name: string;
  provider: string;
  baseUrl?: string;
  model?: string;
  endpoint?: string;
  bucket?: string;
  region?: string;
  isActive: boolean;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
