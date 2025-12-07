/**
 * Multi-LLM Provider Abstraction Layer
 *
 * Unified API wrapper for chat completions across multiple LLM providers.
 * Implements automatic fallback, retry with exponential backoff, cost tracking,
 * and quality thresholds.
 *
 * References:
 * - Multi-LLM Integration Plan (December 2025)
 * - LangChain Documentation
 * - OpenAI/Anthropic API Specs
 * - Apex Antifragility Framework
 *
 * Trade-offs:
 * - GOOD: Abstraction enables quick provider switches, reducing lock-in
 * - BAD: Adds minor latency (10-50ms) for routing logic
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import * as Sentry from '@sentry/nextjs';

import {
  type LLMProvider,
  type LLMResponse,
  type LLMRequestOptions,
  type ChatMessage,
  type ProviderHealth,
  type ProviderError,
  type ProviderErrorType,
  type RoutingStrategy,
  MODEL_CONFIGS,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROVIDER_CONFIG = {
  /** Default fallback order */
  FALLBACK_ORDER: ['openai', 'anthropic', 'google', 'local'] as LLMProvider[],
  /** Default models per provider */
  DEFAULT_MODELS: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    local: 'llama-3-8b',
  } as Record<LLMProvider, string>,
  /** Retry configuration */
  RETRY: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  /** Health check interval */
  HEALTH_CHECK_INTERVAL_MS: 60000,
  /** Request timeout */
  DEFAULT_TIMEOUT_MS: 30000,
  /** Quality threshold for self-reflection */
  DEFAULT_QUALITY_THRESHOLD: 0.8,
};

// ============================================================================
// PROVIDER HEALTH TRACKING
// ============================================================================

const providerHealthMap = new Map<LLMProvider, ProviderHealth>();

function initializeHealthTracking() {
  const providers: LLMProvider[] = ['openai', 'anthropic', 'google', 'local'];
  for (const provider of providers) {
    providerHealthMap.set(provider, {
      provider,
      isHealthy: true,
      lastChecked: new Date(),
      successRate: 1.0,
      avgLatencyMs: MODEL_CONFIGS[provider][PROVIDER_CONFIG.DEFAULT_MODELS[provider]]?.avgLatencyMs || 3000,
    });
  }
}

initializeHealthTracking();

function updateProviderHealth(
  provider: LLMProvider,
  success: boolean,
  latencyMs: number,
  error?: string
) {
  const health = providerHealthMap.get(provider);
  if (!health) return;

  // Exponential moving average for success rate (alpha = 0.1)
  const alpha = 0.1;
  health.successRate = health.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  health.avgLatencyMs = health.avgLatencyMs * (1 - alpha) + latencyMs * alpha;
  health.lastChecked = new Date();
  health.isHealthy = health.successRate > 0.5;
  if (error) health.lastError = error;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function classifyError(error: unknown, provider: LLMProvider): ProviderError {
  const err = error as Error & { status?: number; code?: string };
  const statusCode = err.status || 0;
  const message = err.message || 'Unknown error';

  let type: ProviderErrorType = 'unknown';
  let retryable = false;
  let retryAfterMs: number | undefined;

  if (statusCode === 429 || message.includes('rate limit')) {
    type = 'rate_limit';
    retryable = true;
    retryAfterMs = 60000; // Default 1 minute
  } else if (statusCode === 401 || statusCode === 403) {
    type = 'auth_error';
    retryable = false;
  } else if (statusCode >= 500) {
    type = 'server_error';
    retryable = true;
    retryAfterMs = 5000;
  } else if (message.includes('timeout') || err.code === 'ETIMEDOUT') {
    type = 'timeout';
    retryable = true;
    retryAfterMs = 1000;
  } else if (message.includes('ECONNREFUSED') || message.includes('network')) {
    type = 'network_error';
    retryable = true;
    retryAfterMs = 2000;
  } else if (message.includes('content') && message.includes('filter')) {
    type = 'content_filter';
    retryable = false;
  } else if (statusCode === 400) {
    type = 'invalid_request';
    retryable = false;
  }

  const providerError = new Error(message) as ProviderError;
  providerError.type = type;
  providerError.provider = provider;
  providerError.statusCode = statusCode;
  providerError.retryable = retryable;
  providerError.retryAfterMs = retryAfterMs;

  return providerError;
}

// ============================================================================
// PROVIDER INITIALIZATION
// ============================================================================

function getOpenAIClient(model: string, options: LLMRequestOptions) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const config = MODEL_CONFIGS.openai[model] || MODEL_CONFIGS.openai['gpt-4o'];
  return new ChatOpenAI({
    modelName: config.modelId,
    temperature: options.temperature ?? config.temperature,
    maxTokens: options.maxTokens ?? config.maxTokens,
    timeout: options.timeoutMs ?? PROVIDER_CONFIG.DEFAULT_TIMEOUT_MS,
  });
}

function getAnthropicClient(model: string, options: LLMRequestOptions) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const config = MODEL_CONFIGS.anthropic[model] || MODEL_CONFIGS.anthropic['claude-3-5-sonnet-20241022'];
  return new ChatAnthropic({
    modelName: config.modelId,
    temperature: options.temperature ?? config.temperature,
    maxTokens: options.maxTokens ?? config.maxTokens,
  });
}

function getGoogleClient(model: string, options: LLMRequestOptions) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const config = MODEL_CONFIGS.google[model] || MODEL_CONFIGS.google['gemini-1.5-pro'];
  return new ChatGoogleGenerativeAI({
    modelName: config.modelId,
    temperature: options.temperature ?? config.temperature,
    maxOutputTokens: options.maxTokens ?? config.maxTokens,
  });
}

async function getLocalClient(model: string, options: LLMRequestOptions) {
  // Local model via Ollama - uses OpenAI-compatible API
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const config = MODEL_CONFIGS.local[model] || MODEL_CONFIGS.local['llama-3-8b'];

  // Check if Ollama is available
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      throw new Error('Ollama not available');
    }
  } catch {
    throw new Error('Local model server (Ollama) not available');
  }

  // Use OpenAI client with Ollama base URL
  return new ChatOpenAI({
    modelName: config.modelId,
    temperature: options.temperature ?? config.temperature,
    maxTokens: options.maxTokens ?? config.maxTokens,
    configuration: {
      baseURL: `${ollamaUrl}/v1`,
      apiKey: 'ollama', // Ollama doesn't require real API key
    },
  });
}

// ============================================================================
// COST CALCULATION
// ============================================================================

function calculateCost(
  provider: LLMProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[provider][model] ||
    MODEL_CONFIGS[provider][PROVIDER_CONFIG.DEFAULT_MODELS[provider]];

  if (!config) return 0;

  const inputCost = (inputTokens / 1000) * config.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * config.outputCostPer1k;

  return Math.round((inputCost + outputCost) * 1000000) / 1000000; // 6 decimal precision
}

// ============================================================================
// ROUTING LOGIC
// ============================================================================

function selectProvider(
  options: LLMRequestOptions,
  excludeProviders: LLMProvider[] = []
): { provider: LLMProvider; model: string } | null {
  const strategy = options.routingStrategy || 'balanced';
  const qualityThreshold = options.qualityThreshold ?? PROVIDER_CONFIG.DEFAULT_QUALITY_THRESHOLD;
  const maxCost = options.maxCostUsd ?? Infinity;

  // If preferred provider is specified and available, use it
  if (options.preferredProvider && !excludeProviders.includes(options.preferredProvider)) {
    const health = providerHealthMap.get(options.preferredProvider);
    if (health?.isHealthy) {
      return {
        provider: options.preferredProvider,
        model: options.model || PROVIDER_CONFIG.DEFAULT_MODELS[options.preferredProvider],
      };
    }
  }

  // Get available providers with their configs
  const availableProviders = PROVIDER_CONFIG.FALLBACK_ORDER
    .filter(p => !excludeProviders.includes(p))
    .filter(p => providerHealthMap.get(p)?.isHealthy)
    .map(provider => {
      const model = options.model || PROVIDER_CONFIG.DEFAULT_MODELS[provider];
      const config = MODEL_CONFIGS[provider][model] ||
        MODEL_CONFIGS[provider][PROVIDER_CONFIG.DEFAULT_MODELS[provider]];
      const health = providerHealthMap.get(provider)!;
      return { provider, model, config, health };
    })
    .filter(p => p.config && p.config.qualityScore >= qualityThreshold)
    .filter(p => {
      // Estimate cost for 1K tokens each way
      const estimatedCost = p.config.inputCostPer1k + p.config.outputCostPer1k;
      return estimatedCost <= maxCost;
    });

  if (availableProviders.length === 0) {
    return null;
  }

  // Sort based on strategy
  availableProviders.sort((a, b) => {
    switch (strategy) {
      case 'quality':
        return b.config.qualityScore - a.config.qualityScore;
      case 'cost':
        return (a.config.inputCostPer1k + a.config.outputCostPer1k) -
               (b.config.inputCostPer1k + b.config.outputCostPer1k);
      case 'speed':
        return a.health.avgLatencyMs - b.health.avgLatencyMs;
      case 'balanced':
      default:
        // Weighted score: 40% quality, 30% cost efficiency, 30% speed
        const scoreA = a.config.qualityScore * 0.4 +
          (1 / (a.config.inputCostPer1k + a.config.outputCostPer1k + 0.001)) * 0.0003 +
          (1 / a.health.avgLatencyMs) * 3000 * 0.3;
        const scoreB = b.config.qualityScore * 0.4 +
          (1 / (b.config.inputCostPer1k + b.config.outputCostPer1k + 0.001)) * 0.0003 +
          (1 / b.health.avgLatencyMs) * 3000 * 0.3;
        return scoreB - scoreA;
    }
  });

  return {
    provider: availableProviders[0].provider,
    model: availableProviders[0].model,
  };
}

// ============================================================================
// MAIN COMPLETION FUNCTION
// ============================================================================

/**
 * Execute chat completion with a specific provider
 */
async function executeCompletion(
  messages: ChatMessage[],
  provider: LLMProvider,
  model: string,
  options: LLMRequestOptions
): Promise<Omit<LLMResponse, 'isFallback' | 'originalProvider' | 'fallbackReason'>> {
  const startTime = Date.now();

  // Get the appropriate client
  let client;
  switch (provider) {
    case 'openai':
      client = getOpenAIClient(model, options);
      break;
    case 'anthropic':
      client = getAnthropicClient(model, options);
      break;
    case 'google':
      client = getGoogleClient(model, options);
      break;
    case 'local':
      client = await getLocalClient(model, options);
      break;
  }

  // Convert messages to LangChain format
  const langchainMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Execute completion
  const response = await client.invoke(langchainMessages);

  const latencyMs = Date.now() - startTime;
  const content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  // Extract token usage (varies by provider)
  const usage = (response as any).usage_metadata || (response as any).response_metadata?.usage || {};
  const inputTokens = usage.input_tokens || usage.prompt_tokens || Math.ceil(messages.map(m => m.content).join('').length / 4);
  const outputTokens = usage.output_tokens || usage.completion_tokens || Math.ceil(content.length / 4);

  const cost = calculateCost(provider, model, inputTokens, outputTokens);

  // Update health tracking
  updateProviderHealth(provider, true, latencyMs);

  return {
    content,
    provider,
    model,
    inputTokens,
    outputTokens,
    cost,
    latencyMs,
  };
}

/**
 * Execute chat completion with retry and exponential backoff
 */
async function executeWithRetry(
  messages: ChatMessage[],
  provider: LLMProvider,
  model: string,
  options: LLMRequestOptions
): Promise<Omit<LLMResponse, 'isFallback' | 'originalProvider' | 'fallbackReason'>> {
  let lastError: ProviderError | null = null;
  let delay = PROVIDER_CONFIG.RETRY.baseDelayMs;

  for (let attempt = 1; attempt <= PROVIDER_CONFIG.RETRY.maxAttempts; attempt++) {
    try {
      return await executeCompletion(messages, provider, model, options);
    } catch (error) {
      lastError = classifyError(error, provider);

      // Update health tracking on failure
      updateProviderHealth(provider, false, 0, lastError.message);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(`[LLM] Retry ${attempt}/${PROVIDER_CONFIG.RETRY.maxAttempts} for ${provider}:`, lastError.message);

      // Use provider's suggested retry delay or exponential backoff
      const waitTime = Math.min(
        lastError.retryAfterMs || delay,
        PROVIDER_CONFIG.RETRY.maxDelayMs
      );

      if (attempt < PROVIDER_CONFIG.RETRY.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= PROVIDER_CONFIG.RETRY.backoffMultiplier;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Execute chat completion with automatic fallback across providers
 *
 * @param messages - Chat messages to send
 * @param options - Request options
 * @returns LLM response with cost and usage tracking
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: LLMRequestOptions = {}
): Promise<LLMResponse> {
  const excludedProviders: LLMProvider[] = [];
  let originalProvider: LLMProvider | undefined;
  let fallbackReason: string | undefined;

  // Try providers in order until one succeeds
  while (excludedProviders.length < PROVIDER_CONFIG.FALLBACK_ORDER.length) {
    const selected = selectProvider(options, excludedProviders);

    if (!selected) {
      const error = new Error('No providers available that meet requirements');
      Sentry.captureException(error, {
        tags: { component: 'llm-provider' },
        extra: { options, excludedProviders },
      });
      throw error;
    }

    const { provider, model } = selected;

    // Track original provider for fallback reporting
    if (excludedProviders.length === 0) {
      originalProvider = undefined;
    } else if (excludedProviders.length === 1) {
      originalProvider = excludedProviders[0];
    }

    try {
      const result = await executeWithRetry(messages, provider, model, options);

      return {
        ...result,
        isFallback: excludedProviders.length > 0,
        originalProvider,
        fallbackReason,
      };
    } catch (error) {
      const providerError = error as ProviderError;
      fallbackReason = providerError.message;
      excludedProviders.push(provider);

      console.warn(`[LLM] Provider ${provider} failed, trying fallback:`, providerError.message);

      // Log to Sentry for non-retryable errors
      if (!providerError.retryable) {
        Sentry.captureException(error, {
          tags: { component: 'llm-provider', provider },
          extra: { model, options },
        });
      }
    }
  }

  throw new Error('All providers failed');
}

/**
 * Execute chat completion with a specific provider (no fallback)
 */
export async function chatCompletionWithProvider(
  messages: ChatMessage[],
  provider: LLMProvider,
  options: LLMRequestOptions = {}
): Promise<LLMResponse> {
  const model = options.model || PROVIDER_CONFIG.DEFAULT_MODELS[provider];
  const result = await executeWithRetry(messages, provider, model, options);

  return {
    ...result,
    isFallback: false,
  };
}

/**
 * Get current health status of all providers
 */
export function getProviderHealth(): ProviderHealth[] {
  return Array.from(providerHealthMap.values());
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(provider: LLMProvider): boolean {
  const health = providerHealthMap.get(provider);
  return health?.isHealthy ?? false;
}

/**
 * Get cost estimate for a request
 */
export function estimateCost(
  provider: LLMProvider,
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  return calculateCost(provider, model, estimatedInputTokens, estimatedOutputTokens);
}

/**
 * Reset provider health (useful after fixing issues)
 */
export function resetProviderHealth(provider: LLMProvider): void {
  const health = providerHealthMap.get(provider);
  if (health) {
    health.isHealthy = true;
    health.successRate = 1.0;
    health.lastError = undefined;
    health.lastChecked = new Date();
  }
}

// Export types
export type { LLMProvider, LLMResponse, LLMRequestOptions, ChatMessage, ProviderHealth };
