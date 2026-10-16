import { z } from 'zod';
import { redactSensitiveData } from '../evidence/redaction.ts';

/**
 * AMD Inference Client Configuration Schema
 * Validates connection, model selection, execution timeouts, and device profiles.
 */
export const AMDInferenceConfigSchema = z
  .object({
    /** Base URL of the AMD ROCm vLLM / TGI OpenAI-compatible inference server */
    endpoint: z.string().url().default('http://localhost:8000/v1'),
    /** API key / Bearer token (optional for internal VPC cluster deployments) */
    apiKey: z.string().optional(),
    /** Selected open-weights model identifier */
    modelName: z.string().min(1).default('meta-llama/Llama-3.1-8B-Instruct'),
    /** Request timeout in milliseconds */
    timeoutMs: z.number().int().positive().default(2000),
    /** Maximum retry attempts for transient server failures (HTTP 429, 503) */
    maxRetries: z.number().int().nonnegative().default(3),
    /** Whether to fall back to the deterministic local adapter if endpoint is offline */
    useFallback: z.boolean().default(false),
    /** Temperature for generation (0.0 enforces deterministic greedy decoding) */
    temperature: z.number().min(0).max(2).default(0.0),
    /** Maximum generation tokens */
    maxTokens: z.number().int().positive().default(1024),
    /** Target AMD accelerator device */
    targetDevice: z.string().default('AMD Instinct MI300X (ROCm 6.2)'),
    /** Serving runtime description */
    runtime: z.string().default('vLLM 0.6.2 (ROCm 6.2)'),
  })
  .strict();

export type AMDInferenceConfig = z.infer<typeof AMDInferenceConfigSchema>;

/**
 * Loads AMD Inference Configuration from environment variables with optional runtime overrides.
 * Environment variables:
 *  - AMD_VLLM_ENDPOINT: Base URL (default: http://localhost:8000/v1)
 *  - AMD_API_KEY: Bearer token
 *  - AMD_MODEL_NAME: Model ID (default: meta-llama/Llama-3.1-8B-Instruct)
 *  - AMD_INFERENCE_TIMEOUT_MS: Timeout in ms (default: 2000)
 *  - AMD_MAX_RETRIES: Max retries (default: 3)
 *  - AMD_USE_FALLBACK: 'true' or 'false' (default: false)
 *  - AMD_TEMPERATURE: Float (default: 0.0)
 *  - AMD_MAX_TOKENS: Integer (default: 1024)
 *  - AMD_TARGET_DEVICE: Device identifier (default: AMD Instinct MI300X (ROCm 6.2))
 *  - AMD_RUNTIME: Runtime identifier (default: vLLM 0.6.2 (ROCm 6.2))
 */
export function loadAMDInferenceConfig(overrides?: Partial<AMDInferenceConfig>): AMDInferenceConfig {
  const envConfig: Record<string, unknown> = {};

  if (process.env.AMD_VLLM_ENDPOINT) {
    envConfig.endpoint = process.env.AMD_VLLM_ENDPOINT;
  }
  if (process.env.AMD_API_KEY) {
    envConfig.apiKey = process.env.AMD_API_KEY;
  }
  if (process.env.AMD_MODEL_NAME) {
    envConfig.modelName = process.env.AMD_MODEL_NAME;
  }
  if (process.env.AMD_INFERENCE_TIMEOUT_MS) {
    const parsed = Number.parseInt(process.env.AMD_INFERENCE_TIMEOUT_MS, 10);
    if (!Number.isNaN(parsed)) envConfig.timeoutMs = parsed;
  }
  if (process.env.AMD_MAX_RETRIES) {
    const parsed = Number.parseInt(process.env.AMD_MAX_RETRIES, 10);
    if (!Number.isNaN(parsed)) envConfig.maxRetries = parsed;
  }
  if (process.env.AMD_USE_FALLBACK !== undefined) {
    envConfig.useFallback = process.env.AMD_USE_FALLBACK === 'true' || process.env.AMD_USE_FALLBACK === '1';
  }
  if (process.env.AMD_TEMPERATURE) {
    const parsed = Number.parseFloat(process.env.AMD_TEMPERATURE);
    if (!Number.isNaN(parsed)) envConfig.temperature = parsed;
  }
  if (process.env.AMD_MAX_TOKENS) {
    const parsed = Number.parseInt(process.env.AMD_MAX_TOKENS, 10);
    if (!Number.isNaN(parsed)) envConfig.maxTokens = parsed;
  }
  if (process.env.AMD_TARGET_DEVICE) {
    envConfig.targetDevice = process.env.AMD_TARGET_DEVICE;
  }
  if (process.env.AMD_RUNTIME) {
    envConfig.runtime = process.env.AMD_RUNTIME;
  }

  const merged = {
    ...envConfig,
    ...overrides,
  };

  return AMDInferenceConfigSchema.parse(merged);
}

/**
 * Returns a redacted representation of the configuration safe for logging and audit serialization.
 */
export function getSanitizedConfig(config: AMDInferenceConfig): Record<string, unknown> {
  const sanitized = redactSensitiveData({ ...config }) as Record<string, unknown>;
  if (sanitized.apiKey) {
    sanitized.apiKey = '[REDACTED]';
  }
  return sanitized;
}
