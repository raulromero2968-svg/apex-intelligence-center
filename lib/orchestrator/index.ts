/**
 * Orchestrator Module Barrel Export
 *
 * Exports all orchestration-related functionality including:
 * - GAM multi-AI integration
 * - Batch and consensus orchestration
 * - Visualization context generation
 *
 * Usage:
 * ```typescript
 * import { gamOrchestrate, consensusQuery } from '@/lib/orchestrator';
 * ```
 *
 * @module orchestrator
 */

// ============================================================================
// GAM INTEGRATION
// ============================================================================

export {
  gamOrchestrate,
  batchOrchestrate,
  consensusQuery,
  dailyMemoryMaintenance,
  generateVizContext,
} from './gam-integration';

// Re-export types from gam for convenience
export type {
  OrchestrationRequest,
  OrchestrationResult,
  AIAgent,
} from '../gam/types';
