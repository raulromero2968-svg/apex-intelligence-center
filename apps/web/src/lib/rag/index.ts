/**
 * Public API for RAG module
 * Explicit exports - no barrel exports allowed
 */

export {
  ragFusionPipeline,
  type RagFusionParams,
} from './rag-fusion';

// ============================================================================
// EGGROLL Low-Rank Fusion - Gradient-free evolution for Bostrom predictions
// ============================================================================
export {
  eggrollLowRankFusion,
  quickBostromPrediction,
  isEggrollRelevantQuery,
  performLowRankEvolution,
  type EggrollLowRankConfig,
  type EggrollFusionResult,
  type LowRankEvolutionResult,
  type ScoredVariant,
  DEFAULT_EGGROLL_CONFIG,
} from './eggroll-low-rank';

