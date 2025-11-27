/**
 * Cache Module Barrel Export
 *
 * Exports all caching functionality including:
 * - Agent response caching
 * - Latent query caching
 * - Task result caching
 *
 * @module cache
 */

export {
  AgentCache,
  latentQueryCache,
  agentResponseCache,
  taskResultCache,
  cachedLatentRAG,
  cachedAgentResponse,
  cachedTaskResult,
  invalidateEntityCaches,
  getAggregatedCacheStats,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
} from './agent-cache';
