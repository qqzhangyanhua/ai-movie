// DEPRECATED: ServiceConfig model has been removed from schema.
// This file is kept for reference only and should not be used.
// Service configurations are now managed at system level via environment variables.
//
// Migration path:
// - LLM configs: Use OPENAI_API_KEY, ANTHROPIC_API_KEY env vars
// - Storage configs: Use S3_BUCKET, S3_REGION, S3_ACCESS_KEY env vars
// - TTS configs: Use TTS_API_KEY env var
//
// See lib/constants/plans.ts for plan-based feature limits.

export {};
