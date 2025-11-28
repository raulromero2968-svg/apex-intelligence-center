/**
 * Public API for RAG module
 * Explicit exports - no barrel exports allowed
 */

export {
  ragFusionPipeline,
  type RagFusionParams,
} from './rag-fusion';

// ============================================================================
// Bostrom Probabilities (KB-02 Simulation Markets)
// ============================================================================
export {
  bostromProbFusion,
  mapToTCGOutcomes,
  calculateExpectedValue,
  bayesianUpdate,
  type BostromProbabilities,
  type BostromFusionParams,
  type TCGSimulationOutcome,
} from './bostrom-probabilities';

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

// Bostrom Trilemma Probability (KB-02 EGGROLL Integration)
export {
  bostromProb,
  bostromProbBatch,
  requiresEthicalDisclaimer,
  type BostromProbability,
  type BostromOptimizationConfig,
} from './bostrom-prob';

// Utopia Ethical Prompts (KB-02 RAG Integration)
export {
  utopiaRAG,
  utopiaRAGSummary,
  requiresUtopiaFraming,
  type UtopiaConfig,
  type UtopiaResponse,
} from './utopia-prompt';

// Bostrom Trilemma RAG Variants (KB-02 Simulation Markets)
export {
  bostromRAGVariants,
  quickBostromVariants,
  type BostromVariant,
  type BostromRAGParams,
  type BostromRAGResult,
  type TrilemmaOutcome,
} from './bostrom-variants';
