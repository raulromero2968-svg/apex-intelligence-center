/**
 * Public API for RAG module
 * Explicit exports - no barrel exports allowed
 */

export {
  ragFusionPipeline,
  type RagFusionParams,
} from './rag-fusion';

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
