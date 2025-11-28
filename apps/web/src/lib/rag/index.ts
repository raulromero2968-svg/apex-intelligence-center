/**
 * Public API for RAG module
 * Explicit exports - no barrel exports allowed
 */

export {
  ragFusionPipeline,
  type RagFusionParams,
} from './rag-fusion';

// ============================================================================
// EGGROLL RAG-FUSION - Gradient-free evolution for simulation markets
// ============================================================================
export {
  type EggrollVariant,
  type BostromScenario,
  type EggrollConfig,
  type EggrollResult,
  EggrollGenerator,
  eggrollRAGFusion,
  createEggrollGenerator,
  detectBostromScenario,
} from './eggroll-fusion';

