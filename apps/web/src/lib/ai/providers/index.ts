/**
 * Multi-LLM Provider Module
 *
 * Unified abstraction layer for multiple LLM providers with:
 * - Automatic fallback across providers
 * - Exponential backoff retry
 * - Redis-based prompt caching
 * - Cost tracking and optimization
 * - Local model support (Ollama/Llama)
 *
 * Usage:
 * ```typescript
 * import { chatCompletion, cachedChatCompletion } from '@/lib/ai/providers';
 *
 * // Simple completion with auto-fallback
 * const response = await chatCompletion([
 *   { role: 'user', content: 'Hello' }
 * ]);
 *
 * // Cached completion with cost tracking
 * const cachedResponse = await cachedChatCompletion([
 *   { role: 'user', content: 'Transform this post...' }
 * ], {
 *   enableCache: true,
 *   routingStrategy: 'cost',
 *   userId: 'user123',
 * });
 * ```
 *
 * References:
 * - Multi-LLM Integration Plan (December 2025)
 * - Apex Antifragility Framework
 */

// Main completion functions
export {
  chatCompletion,
  chatCompletionWithProvider,
  getProviderHealth,
  isProviderAvailable,
  estimateCost,
  resetProviderHealth,
} from './llm-provider';

// Caching
export {
  cachedChatCompletion,
  getCachedResponse,
  cacheResponse,
  invalidateCache,
  invalidateCachePattern,
  getCacheStats,
  resetCacheStats,
} from './cache';

// Cost tracking
export {
  trackCost,
  getUserCosts,
  getGlobalCosts,
  getPendingAlerts,
  clearAlerts,
  getOptimizationRecommendations,
  projectMonthlyCost,
} from './cost-tracker';

// Types
export type {
  LLMProvider,
  LLMResponse,
  LLMRequestOptions,
  ChatMessage,
  ProviderHealth,
  CostTracking,
  ModelConfig,
  RoutingStrategy,
  QualityEvaluation,
  ProviderError,
  ProviderErrorType,
} from './types';

// Model configurations
export { MODEL_CONFIGS } from './types';
