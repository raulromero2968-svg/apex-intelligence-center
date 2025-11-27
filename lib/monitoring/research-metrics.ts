/**
 * Research Implementation Monitoring
 *
 * Metrics and monitoring for the research-based improvements:
 * - Latent RAG performance
 * - Multi-agent execution metrics
 * - Visual computing frame rates
 * - Cache efficiency
 *
 * Integrates with Sentry and Vercel Analytics for production observability.
 *
 * @module monitoring/research-metrics
 */

import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

interface LatentRAGMetrics {
  queryCount: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  rerankingRate: number;
  avgDocumentsReturned: number;
  errorRate: number;
}

interface MultiAgentMetrics {
  taskCount: number;
  avgAgentsPerTask: number;
  avgIterations: number;
  consensusRate: number;
  avgLatencyMs: number;
  errorRate: number;
  tokenCost: number;
}

interface VisualComputingMetrics {
  avgFPS: number;
  adaptiveQualityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  predictionAccuracy: number;
  frameDropRate: number;
}

interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  avgLatencyMs: number;
  memoryUsageMB: number;
}

interface ResearchMetrics {
  latentRAG: LatentRAGMetrics;
  multiAgent: MultiAgentMetrics;
  visualComputing: VisualComputingMetrics;
  cache: CacheMetrics;
  timestamp: Date;
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

/**
 * Research Metrics Collector
 *
 * Tracks performance and usage metrics for all research-based improvements.
 */
class ResearchMetricsCollector {
  private latentRAG: LatentRAGMetrics = {
    queryCount: 0,
    avgLatencyMs: 0,
    cacheHitRate: 0,
    rerankingRate: 0,
    avgDocumentsReturned: 0,
    errorRate: 0,
  };

  private multiAgent: MultiAgentMetrics = {
    taskCount: 0,
    avgAgentsPerTask: 0,
    avgIterations: 0,
    consensusRate: 0,
    avgLatencyMs: 0,
    errorRate: 0,
    tokenCost: 0,
  };

  private visualComputing: VisualComputingMetrics = {
    avgFPS: 60,
    adaptiveQualityDistribution: { low: 0, medium: 0, high: 100 },
    predictionAccuracy: 0,
    frameDropRate: 0,
  };

  private cache: CacheMetrics = {
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
    avgLatencyMs: 0,
    memoryUsageMB: 0,
  };

  private sampleCounts = {
    latentRAG: 0,
    multiAgent: 0,
    visualComputing: 0,
    cache: 0,
  };

  /**
   * Record a latent RAG query execution
   */
  recordLatentRAGQuery(metrics: {
    latencyMs: number;
    cacheHit: boolean;
    rerankingApplied: boolean;
    documentsReturned: number;
    error: boolean;
  }): void {
    const count = ++this.sampleCounts.latentRAG;

    // Update rolling averages
    this.latentRAG.queryCount++;
    this.latentRAG.avgLatencyMs = this.updateAverage(
      this.latentRAG.avgLatencyMs,
      metrics.latencyMs,
      count
    );
    this.latentRAG.cacheHitRate = this.updateAverage(
      this.latentRAG.cacheHitRate,
      metrics.cacheHit ? 100 : 0,
      count
    );
    this.latentRAG.rerankingRate = this.updateAverage(
      this.latentRAG.rerankingRate,
      metrics.rerankingApplied ? 100 : 0,
      count
    );
    this.latentRAG.avgDocumentsReturned = this.updateAverage(
      this.latentRAG.avgDocumentsReturned,
      metrics.documentsReturned,
      count
    );
    this.latentRAG.errorRate = this.updateAverage(
      this.latentRAG.errorRate,
      metrics.error ? 100 : 0,
      count
    );

    // Log to Sentry
    Sentry.addBreadcrumb({
      category: 'research.latent-rag',
      level: 'info',
      data: {
        latencyMs: metrics.latencyMs,
        cacheHit: metrics.cacheHit,
        documentsReturned: metrics.documentsReturned,
      },
    });

    // Alert on high latency
    if (metrics.latencyMs > 5000) {
      Sentry.captureMessage('High latent RAG latency detected', {
        level: 'warning',
        extra: metrics,
      });
    }
  }

  /**
   * Record a multi-agent task execution
   */
  recordMultiAgentTask(metrics: {
    agentCount: number;
    iterations: number;
    consensusAchieved: boolean;
    latencyMs: number;
    tokenCount: number;
    error: boolean;
  }): void {
    const count = ++this.sampleCounts.multiAgent;

    this.multiAgent.taskCount++;
    this.multiAgent.avgAgentsPerTask = this.updateAverage(
      this.multiAgent.avgAgentsPerTask,
      metrics.agentCount,
      count
    );
    this.multiAgent.avgIterations = this.updateAverage(
      this.multiAgent.avgIterations,
      metrics.iterations,
      count
    );
    this.multiAgent.consensusRate = this.updateAverage(
      this.multiAgent.consensusRate,
      metrics.consensusAchieved ? 100 : 0,
      count
    );
    this.multiAgent.avgLatencyMs = this.updateAverage(
      this.multiAgent.avgLatencyMs,
      metrics.latencyMs,
      count
    );
    this.multiAgent.errorRate = this.updateAverage(
      this.multiAgent.errorRate,
      metrics.error ? 100 : 0,
      count
    );
    this.multiAgent.tokenCost += metrics.tokenCount;

    // Log to Sentry
    Sentry.addBreadcrumb({
      category: 'research.multi-agent',
      level: 'info',
      data: {
        agentCount: metrics.agentCount,
        iterations: metrics.iterations,
        consensusAchieved: metrics.consensusAchieved,
        latencyMs: metrics.latencyMs,
      },
    });

    // Alert on failed consensus
    if (!metrics.consensusAchieved) {
      Sentry.captureMessage('Multi-agent consensus failed', {
        level: 'warning',
        extra: metrics,
      });
    }
  }

  /**
   * Record visual computing frame metrics
   */
  recordVisualFrame(metrics: {
    fps: number;
    quality: 'low' | 'medium' | 'high';
    predictionUsed: boolean;
    frameDropped: boolean;
  }): void {
    const count = ++this.sampleCounts.visualComputing;

    this.visualComputing.avgFPS = this.updateAverage(
      this.visualComputing.avgFPS,
      metrics.fps,
      count
    );

    // Update quality distribution
    const total = count;
    if (metrics.quality === 'low') {
      this.visualComputing.adaptiveQualityDistribution.low =
        ((this.visualComputing.adaptiveQualityDistribution.low * (total - 1)) + 100) / total;
    } else if (metrics.quality === 'medium') {
      this.visualComputing.adaptiveQualityDistribution.medium =
        ((this.visualComputing.adaptiveQualityDistribution.medium * (total - 1)) + 100) / total;
    } else {
      this.visualComputing.adaptiveQualityDistribution.high =
        ((this.visualComputing.adaptiveQualityDistribution.high * (total - 1)) + 100) / total;
    }

    this.visualComputing.predictionAccuracy = this.updateAverage(
      this.visualComputing.predictionAccuracy,
      metrics.predictionUsed ? 100 : 0,
      count
    );
    this.visualComputing.frameDropRate = this.updateAverage(
      this.visualComputing.frameDropRate,
      metrics.frameDropped ? 100 : 0,
      count
    );

    // Alert on persistent low FPS
    if (metrics.fps < 20 && this.visualComputing.avgFPS < 30) {
      Sentry.captureMessage('Persistent low FPS detected', {
        level: 'warning',
        extra: {
          currentFps: metrics.fps,
          avgFps: this.visualComputing.avgFPS,
          quality: metrics.quality,
        },
      });
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(metrics: {
    hit: boolean;
    latencyMs: number;
    memorySizeMB?: number;
  }): void {
    const count = ++this.sampleCounts.cache;

    if (metrics.hit) {
      this.cache.totalHits++;
    } else {
      this.cache.totalMisses++;
    }

    const totalOps = this.cache.totalHits + this.cache.totalMisses;
    this.cache.hitRate = (this.cache.totalHits / totalOps) * 100;
    this.cache.avgLatencyMs = this.updateAverage(
      this.cache.avgLatencyMs,
      metrics.latencyMs,
      count
    );

    if (metrics.memorySizeMB !== undefined) {
      this.cache.memoryUsageMB = metrics.memorySizeMB;
    }

    // Alert on low hit rate (after sufficient samples)
    if (totalOps > 100 && this.cache.hitRate < 30) {
      Sentry.captureMessage('Low cache hit rate', {
        level: 'warning',
        extra: {
          hitRate: this.cache.hitRate,
          totalHits: this.cache.totalHits,
          totalMisses: this.cache.totalMisses,
        },
      });
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): ResearchMetrics {
    return {
      latentRAG: { ...this.latentRAG },
      multiAgent: { ...this.multiAgent },
      visualComputing: { ...this.visualComputing },
      cache: { ...this.cache },
      timestamp: new Date(),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.latentRAG = {
      queryCount: 0,
      avgLatencyMs: 0,
      cacheHitRate: 0,
      rerankingRate: 0,
      avgDocumentsReturned: 0,
      errorRate: 0,
    };
    this.multiAgent = {
      taskCount: 0,
      avgAgentsPerTask: 0,
      avgIterations: 0,
      consensusRate: 0,
      avgLatencyMs: 0,
      errorRate: 0,
      tokenCost: 0,
    };
    this.visualComputing = {
      avgFPS: 60,
      adaptiveQualityDistribution: { low: 0, medium: 0, high: 100 },
      predictionAccuracy: 0,
      frameDropRate: 0,
    };
    this.cache = {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      avgLatencyMs: 0,
      memoryUsageMB: 0,
    };
    this.sampleCounts = {
      latentRAG: 0,
      multiAgent: 0,
      visualComputing: 0,
      cache: 0,
    };
  }

  /**
   * Send metrics to Sentry as custom metrics
   */
  flushToSentry(): void {
    const metrics = this.getMetrics();

    // Set Sentry custom context
    Sentry.setContext('research_metrics', {
      latentRAG: metrics.latentRAG,
      multiAgent: metrics.multiAgent,
      visualComputing: metrics.visualComputing,
      cache: metrics.cache,
    });

    // Log summary breadcrumb
    Sentry.addBreadcrumb({
      category: 'research.metrics',
      level: 'info',
      message: 'Research metrics flushed',
      data: {
        latentRAGQueries: metrics.latentRAG.queryCount,
        multiAgentTasks: metrics.multiAgent.taskCount,
        avgFPS: metrics.visualComputing.avgFPS,
        cacheHitRate: metrics.cache.hitRate,
      },
    });
  }

  /**
   * Helper: Update rolling average
   */
  private updateAverage(current: number, newValue: number, count: number): number {
    return (current * (count - 1) + newValue) / count;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const researchMetrics = new ResearchMetricsCollector();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Record latent RAG query with automatic metrics collection
 */
export function withLatentRAGMetrics<T>(
  executor: () => Promise<T>,
  metadata: { cacheHit?: boolean; rerankingApplied?: boolean } = {}
): Promise<T> {
  const startTime = Date.now();

  return executor()
    .then((result: any) => {
      researchMetrics.recordLatentRAGQuery({
        latencyMs: Date.now() - startTime,
        cacheHit: metadata.cacheHit ?? false,
        rerankingApplied: metadata.rerankingApplied ?? true,
        documentsReturned: Array.isArray(result?.documents) ? result.documents.length : 0,
        error: false,
      });
      return result;
    })
    .catch((error) => {
      researchMetrics.recordLatentRAGQuery({
        latencyMs: Date.now() - startTime,
        cacheHit: metadata.cacheHit ?? false,
        rerankingApplied: metadata.rerankingApplied ?? false,
        documentsReturned: 0,
        error: true,
      });
      throw error;
    });
}

/**
 * Record multi-agent task with automatic metrics collection
 */
export function withMultiAgentMetrics<T>(
  executor: () => Promise<T>,
  agentCount: number
): Promise<T> {
  const startTime = Date.now();

  return executor()
    .then((result: any) => {
      researchMetrics.recordMultiAgentTask({
        agentCount,
        iterations: result?.metadata?.iterationCount ?? 1,
        consensusAchieved: result?.consensus?.achieved ?? false,
        latencyMs: Date.now() - startTime,
        tokenCount: result?.metadata?.totalTokens ?? 0,
        error: false,
      });
      return result;
    })
    .catch((error) => {
      researchMetrics.recordMultiAgentTask({
        agentCount,
        iterations: 0,
        consensusAchieved: false,
        latencyMs: Date.now() - startTime,
        tokenCount: 0,
        error: true,
      });
      throw error;
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ResearchMetricsCollector,
  type LatentRAGMetrics,
  type MultiAgentMetrics,
  type VisualComputingMetrics,
  type CacheMetrics,
  type ResearchMetrics,
};
