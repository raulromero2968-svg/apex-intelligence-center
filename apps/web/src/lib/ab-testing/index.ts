/**
 * A/B Testing Module
 *
 * Statistical experimentation framework for data-driven decisions.
 * Implements knowledge-06-data-ab-testing.
 */

// Experiment Engine
export {
  type ExperimentStatus,
  type ExperimentType,
  type AssignmentStrategy,
  type TargetModule,
  type Variant,
  type Experiment,
  type TargetingRules,
  type AssignmentContext,
  type AssignmentResult,
  type ValidationError,
  getBucketValue,
  evaluateTargeting,
  selectVariant,
  assignUserToExperiment,
  getActiveAssignments,
  getMergedFeatureFlags,
  validateExperiment,
} from './experiment-engine';

// Statistical Analysis
export {
  type SignificanceMethod,
  type VariantStats,
  type StatisticalResult,
  type SampleSizeParams,
  chiSquaredTest,
  zTestProportions,
  tTest,
  calculatePower,
  calculateRequiredSampleSize,
  runStatisticalTest,
  analyzeExperiment,
  determineWinner,
} from './statistics';

// Domain Pack (RAG)
export {
  type Category,
  type KnowledgeDocument,
  type PromptTemplate,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  initializeAbKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getPromptTemplate,
  fillPromptTemplate,
} from './domain-pack';
