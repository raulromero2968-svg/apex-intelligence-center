/**
 * Multi-LLM Provider Types
 *
 * Unified type definitions for multi-provider LLM abstraction layer.
 * Enables seamless switching between OpenAI, Anthropic, Google, and local models.
 *
 * References:
 * - Multi-LLM Integration Plan (December 2025)
 * - Apex Antifragility Framework (fallback and independence)
 * - Ethical Safeguards Framework (cost monitoring and quality thresholds)
 */

/**
 * Supported LLM providers
 * Priority order: OpenAI (primary) -> Anthropic (secondary) -> Google (tertiary) -> Local (fallback)
 */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local';

/**
 * Model configuration for each provider
 */
export interface ModelConfig {
  /** Provider-specific model identifier */
  modelId: string;
  /** Maximum tokens for response */
  maxTokens: number;
  /** Temperature for sampling (0-1) */
  temperature: number;
  /** Cost per 1K input tokens (USD) */
  inputCostPer1k: number;
  /** Cost per 1K output tokens (USD) */
  outputCostPer1k: number;
  /** Quality score relative to GPT-4 (0-1 scale) */
  qualityScore: number;
  /** Average latency in ms */
  avgLatencyMs: number;
}

/**
 * Provider-specific model configurations
 */
export const MODEL_CONFIGS: Record<LLMProvider, Record<string, ModelConfig>> = {
  openai: {
    'gpt-4-turbo': {
      modelId: 'gpt-4-turbo',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      qualityScore: 1.0,
      avgLatencyMs: 5000,
    },
    'gpt-4o': {
      modelId: 'gpt-4o',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.005,
      outputCostPer1k: 0.015,
      qualityScore: 0.98,
      avgLatencyMs: 3000,
    },
    'gpt-4o-mini': {
      modelId: 'gpt-4o-mini',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.00015,
      outputCostPer1k: 0.0006,
      qualityScore: 0.85,
      avgLatencyMs: 1500,
    },
  },
  anthropic: {
    'claude-3-opus-20240229': {
      modelId: 'claude-3-opus-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
      qualityScore: 0.99,
      avgLatencyMs: 6000,
    },
    'claude-3-5-sonnet-20241022': {
      modelId: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
      qualityScore: 0.95,
      avgLatencyMs: 3500,
    },
    'claude-3-5-haiku-20241022': {
      modelId: 'claude-3-5-haiku-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.0008,
      outputCostPer1k: 0.004,
      qualityScore: 0.80,
      avgLatencyMs: 1200,
    },
  },
  google: {
    'gemini-1.5-pro': {
      modelId: 'gemini-1.5-pro',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.00125,
      outputCostPer1k: 0.005,
      qualityScore: 0.92,
      avgLatencyMs: 4000,
    },
    'gemini-1.5-flash': {
      modelId: 'gemini-1.5-flash',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.000075,
      outputCostPer1k: 0.0003,
      qualityScore: 0.82,
      avgLatencyMs: 1000,
    },
  },
  local: {
    'llama-3-8b': {
      modelId: 'llama3:8b',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.0001, // Amortized server cost
      outputCostPer1k: 0.0001,
      qualityScore: 0.85,
      avgLatencyMs: 2000,
    },
    'llama-3-70b': {
      modelId: 'llama3:70b',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.0005,
      outputCostPer1k: 0.0005,
      qualityScore: 0.92,
      avgLatencyMs: 8000,
    },
    'mistral-7b': {
      modelId: 'mistral:7b',
      maxTokens: 4096,
      temperature: 0.7,
      inputCostPer1k: 0.0001,
      outputCostPer1k: 0.0001,
      qualityScore: 0.80,
      avgLatencyMs: 1500,
    },
  },
};

/**
 * Chat message format (unified across providers)
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM response with cost and usage tracking
 */
export interface LLMResponse {
  /** Generated content */
  content: string;
  /** Provider that handled the request */
  provider: LLMProvider;
  /** Model used */
  model: string;
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Total cost in USD */
  cost: number;
  /** Response latency in ms */
  latencyMs: number;
  /** Whether this was a fallback from another provider */
  isFallback: boolean;
  /** Original provider if fallback occurred */
  originalProvider?: LLMProvider;
  /** Error from original provider if fallback */
  fallbackReason?: string;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  provider: LLMProvider;
  isHealthy: boolean;
  lastChecked: Date;
  lastError?: string;
  successRate: number;
  avgLatencyMs: number;
}

/**
 * Routing strategy for provider selection
 */
export type RoutingStrategy =
  | 'quality'     // Prioritize highest quality
  | 'cost'        // Prioritize lowest cost
  | 'speed'       // Prioritize lowest latency
  | 'balanced';   // Balance quality, cost, and speed

/**
 * Request options for LLM completion
 */
export interface LLMRequestOptions {
  /** Preferred provider (will fallback if unavailable) */
  preferredProvider?: LLMProvider;
  /** Specific model to use */
  model?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Routing strategy for provider selection */
  routingStrategy?: RoutingStrategy;
  /** Minimum quality threshold (0-1, fails if no provider meets threshold) */
  qualityThreshold?: number;
  /** Maximum cost per request in USD */
  maxCostUsd?: number;
  /** Whether to enable caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtlSeconds?: number;
  /** Custom timeout in ms */
  timeoutMs?: number;
  /** User ID for tracking */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Cost tracking for a user session
 */
export interface CostTracking {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  providerBreakdown: Record<LLMProvider, {
    cost: number;
    requests: number;
    tokens: number;
  }>;
}

/**
 * Quality evaluation result
 */
export interface QualityEvaluation {
  /** Self-reflection score (0-1) */
  selfReflectionScore: number;
  /** Whether response meets quality threshold */
  meetsThreshold: boolean;
  /** Suggested improvements */
  suggestions?: string[];
}

/**
 * Provider error types for proper handling
 */
export type ProviderErrorType =
  | 'rate_limit'        // 429 - Rate limited
  | 'quota_exceeded'    // Quota/billing issue
  | 'auth_error'        // API key invalid
  | 'server_error'      // 500+ server error
  | 'timeout'           // Request timeout
  | 'network_error'     // Connection failed
  | 'content_filter'    // Content filtered
  | 'invalid_request'   // Bad request
  | 'unknown';          // Unknown error

/**
 * Structured provider error
 */
export interface ProviderError extends Error {
  type: ProviderErrorType;
  provider: LLMProvider;
  statusCode?: number;
  retryable: boolean;
  retryAfterMs?: number;
}
