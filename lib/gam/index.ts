/**
 * General Agentic Memory (GAM) Module Barrel Export
 *
 * Exports all GAM-related functionality including:
 * - Core agents (Memorizer, Researcher)
 * - RL policy optimization
 * - Type definitions
 *
 * Usage:
 * ```typescript
 * import { memorizer, researcher, gamOrchestrate } from '@/lib/gam';
 * ```
 *
 * @module gam
 */

// ============================================================================
// CORE AGENTS
// ============================================================================

export {
  memorizer,
  researcher,
  memorizeAndResearch,
  batchMemorize,
  updatePageReliability,
  getAgentPages,
} from './core';

// ============================================================================
// RL POLICY OPTIMIZATION
// ============================================================================

export {
  computeReward,
  collectTrainingSample,
  trainRLPolicy,
  generateSyntheticSamples,
  runTrainingCycle,
  recordUserFeedback,
} from './rl-policy';

// ============================================================================
// TYPES
// ============================================================================

export {
  // Zod Schemas
  SessionInputSchema,
  ResearchRequestSchema,
  TrainingSampleSchema,
  OrchestrationRequestSchema,

  // Types
  type SessionInput,
  type ResearchRequest,
  type MemorizerResult,
  type ResearcherResult,
  type ResearchIteration,
  type ReflectionResult,
  type TrainingSample,
  type RLReward,
  type PolicyUpdateResult,
  type RLTrainingConfig,
  type OrchestrationRequest,
  type OrchestrationResult,
  type AIAgent,
  type SearchTool,
  type RetrievedPage,
  type SearchResults,
  type GamPageData,
  type GAMConfig,

  // Constants
  DEFAULT_RL_CONFIG,
  DEFAULT_GAM_CONFIG,
  GAM_PROMPTS,
} from './types';
