/**
 * Monitoring Module Barrel Export
 *
 * Exports all monitoring and metrics functionality including:
 * - Research implementation metrics
 * - Performance tracking
 * - Sentry integration helpers
 *
 * @module monitoring
 */

export {
  researchMetrics,
  ResearchMetricsCollector,
  withLatentRAGMetrics,
  withMultiAgentMetrics,
  type LatentRAGMetrics,
  type MultiAgentMetrics,
  type VisualComputingMetrics,
  type CacheMetrics,
  type ResearchMetrics,
} from './research-metrics';
