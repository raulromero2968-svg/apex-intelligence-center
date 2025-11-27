/**
 * Agent and RAG Caching System
 *
 * Implements efficient caching for multi-agent operations and RAG queries
 * using Upstash Redis for serverless compatibility.
 *
 * Key Features:
 * - Latent query result caching (reduces OpenAI costs)
 * - Agent response caching with TTL
 * - Cache invalidation strategies
 * - Compression for large payloads
 *
 * Aligns with Jensen Huang's "energy efficiency" vision:
 * - Reduce redundant AI calls
 * - Cache high-value computations
 *
 * @module cache/agent-cache
 */

import * as Sentry from '@sentry/nextjs';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface CacheConfig {
  /** Default TTL in seconds (default: 300 = 5 minutes) */
  defaultTTL?: number;
  /** Enable compression for large values (default: true) */
  compression?: boolean;
  /** Key prefix for namespacing (default: 'apex:') */
  keyPrefix?: string;
}

interface CacheEntry<T> {
  value: T;
  metadata: {
    createdAt: number;
    expiresAt: number;
    hits: number;
    compressed: boolean;
    version: string;
  };
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  avgLatencyMs: number;
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

/**
 * Redis-compatible cache for agent operations
 *
 * Can use Upstash Redis in production or falls back to
 * in-memory Map for development/testing.
 */
class AgentCache {
  private config: Required<CacheConfig>;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    avgLatencyMs: 0,
  };
  private redis: any = null;
  private version = '1.0.0';

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 300,
      compression: config.compression ?? true,
      keyPrefix: config.keyPrefix ?? 'apex:',
    };

    // Initialize Redis if available
    this.initRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initRedis(): Promise<void> {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        // Dynamic import for Upstash Redis
        const { Redis } = await import('@upstash/redis');
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        Sentry.addBreadcrumb({
          category: 'cache',
          level: 'info',
          message: 'Redis cache initialized',
        });
      } catch (error) {
        console.warn('[CACHE] Redis initialization failed, using memory cache', error);
        Sentry.captureMessage('Redis cache fallback to memory', {
          level: 'warning',
          extra: { error },
        });
      }
    }
  }

  /**
   * Generate cache key from input
   */
  generateKey(namespace: string, input: any): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex')
      .slice(0, 16);

    return `${this.config.keyPrefix}${namespace}:${hash}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      let entry: CacheEntry<T> | null = null;

      if (this.redis) {
        // Try Redis first
        const data = await this.redis.get(key);
        if (data) {
          entry = typeof data === 'string' ? JSON.parse(data) : data;
        }
      } else {
        // Fallback to memory cache
        entry = this.memoryCache.get(key) || null;
      }

      if (entry) {
        // Check expiration
        if (Date.now() > entry.metadata.expiresAt) {
          await this.delete(key);
          this.stats.misses++;
          return null;
        }

        // Update stats
        entry.metadata.hits++;
        this.stats.hits++;
        this.updateAvgLatency(Date.now() - startTime);

        // Decompress if needed
        let value = entry.value;
        if (entry.metadata.compressed && typeof value === 'string') {
          value = JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
        }

        return value;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'cache', operation: 'get' },
        extra: { key },
      });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    const expirationTTL = ttl ?? this.config.defaultTTL;

    try {
      // Compress large values
      let storedValue: any = value;
      let compressed = false;

      if (this.config.compression) {
        const serialized = JSON.stringify(value);
        if (serialized.length > 1024) {
          storedValue = Buffer.from(serialized).toString('base64');
          compressed = true;
        }
      }

      const entry: CacheEntry<T> = {
        value: storedValue,
        metadata: {
          createdAt: Date.now(),
          expiresAt: Date.now() + expirationTTL * 1000,
          hits: 0,
          compressed,
          version: this.version,
        },
      };

      if (this.redis) {
        // Store in Redis with TTL
        await this.redis.setex(key, expirationTTL, JSON.stringify(entry));
      } else {
        // Store in memory cache
        this.memoryCache.set(key, entry);
        this.stats.size = this.memoryCache.size;

        // Auto-cleanup expired entries
        this.cleanupMemoryCache();
      }

      this.updateAvgLatency(Date.now() - startTime);
      return true;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'cache', operation: 'set' },
        extra: { key },
      });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
        this.stats.size = this.memoryCache.size;
      }
      return true;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'cache', operation: 'delete' },
        extra: { key },
      });
      return false;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate value
    const value = await factory();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (this.redis) {
        // Redis SCAN for pattern matching
        const keys = await this.redis.keys(`${this.config.keyPrefix}${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      } else {
        // Memory cache pattern matching
        let count = 0;
        const fullPattern = `${this.config.keyPrefix}${pattern}`;
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(fullPattern)) {
            this.memoryCache.delete(key);
            count++;
          }
        }
        this.stats.size = this.memoryCache.size;
        return count;
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'cache', operation: 'invalidate' },
        extra: { pattern },
      });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (this.redis) {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } else {
      this.memoryCache.clear();
      this.stats.size = 0;
    }

    Sentry.addBreadcrumb({
      category: 'cache',
      level: 'info',
      message: 'Cache cleared',
    });
  }

  /**
   * Update average latency
   */
  private updateAvgLatency(latencyMs: number): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.avgLatencyMs =
      (this.stats.avgLatencyMs * (total - 1) + latencyMs) / total;
  }

  /**
   * Cleanup expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.metadata.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
    this.stats.size = this.memoryCache.size;
  }
}

// ============================================================================
// SPECIALIZED CACHE INSTANCES
// ============================================================================

/**
 * Cache for latent RAG queries
 * Longer TTL since embedding results are stable
 */
export const latentQueryCache = new AgentCache({
  defaultTTL: 600, // 10 minutes
  compression: true,
  keyPrefix: 'apex:latent:',
});

/**
 * Cache for agent responses
 * Shorter TTL since market data changes frequently
 */
export const agentResponseCache = new AgentCache({
  defaultTTL: 300, // 5 minutes
  compression: true,
  keyPrefix: 'apex:agent:',
});

/**
 * Cache for multi-agent task results
 */
export const taskResultCache = new AgentCache({
  defaultTTL: 180, // 3 minutes
  compression: true,
  keyPrefix: 'apex:task:',
});

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Cache wrapper for latent RAG queries
 */
export async function cachedLatentRAG<T>(
  query: string,
  executor: () => Promise<T>
): Promise<T> {
  const key = latentQueryCache.generateKey('query', query);
  return latentQueryCache.getOrSet(key, executor, 600);
}

/**
 * Cache wrapper for agent responses
 */
export async function cachedAgentResponse<T>(
  agentId: string,
  input: string,
  executor: () => Promise<T>
): Promise<T> {
  const key = agentResponseCache.generateKey(`${agentId}`, input);
  return agentResponseCache.getOrSet(key, executor, 300);
}

/**
 * Cache wrapper for multi-agent tasks
 */
export async function cachedTaskResult<T>(
  taskId: string,
  taskType: string,
  executor: () => Promise<T>
): Promise<T> {
  const key = taskResultCache.generateKey(`${taskType}`, taskId);
  return taskResultCache.getOrSet(key, executor, 180);
}

/**
 * Invalidate all caches for a specific entity
 */
export async function invalidateEntityCaches(entityId: string): Promise<void> {
  await Promise.all([
    latentQueryCache.invalidatePattern(entityId),
    agentResponseCache.invalidatePattern(entityId),
    taskResultCache.invalidatePattern(entityId),
  ]);

  Sentry.addBreadcrumb({
    category: 'cache',
    level: 'info',
    message: `Invalidated caches for entity: ${entityId}`,
  });
}

/**
 * Get aggregated cache statistics
 */
export function getAggregatedCacheStats(): {
  latentQuery: CacheStats;
  agentResponse: CacheStats;
  taskResult: CacheStats;
  total: CacheStats;
} {
  const latent = latentQueryCache.getStats();
  const agent = agentResponseCache.getStats();
  const task = taskResultCache.getStats();

  return {
    latentQuery: latent,
    agentResponse: agent,
    taskResult: task,
    total: {
      hits: latent.hits + agent.hits + task.hits,
      misses: latent.misses + agent.misses + task.misses,
      size: latent.size + agent.size + task.size,
      avgLatencyMs: (latent.avgLatencyMs + agent.avgLatencyMs + task.avgLatencyMs) / 3,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  AgentCache,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
};
