/**
 * @apex/core
 *
 * Apex Intelligence Platform Core
 *
 * Unified primitives for:
 * - Ethics & Job Protection (NIST RMF, EU AI Act, OECD aligned)
 * - Resilient Sync (DDIL-aware, offline-first)
 * - RAG Knowledge Management
 * - TCG Battle & Market Systems
 *
 * @example
 * ```typescript
 * import { ethicsGuard, SyncQueue, searchKnowledge, createCard } from '@apex/core';
 *
 * // Ethics check before automation
 * const result = ethicsGuard('deploy-ai-agent', { teamSize: 10, ... });
 *
 * // Offline-first sync
 * const queue = new SyncQueue();
 * queue.enqueue(createSyncOperation('update', 'user', userData));
 *
 * // Knowledge retrieval
 * const docs = searchKnowledge('job protection policies', knowledgeBase);
 *
 * // TCG card creation
 * const card = createCard('Fire Dragon', 'fire', 'legendary', { attack: 25 });
 * ```
 */

// ============================================================================
// ETHICS MODULE
// ============================================================================

export {
  // Types
  type RiskCategory,
  type AutomationLevel,
  type ImpactLevel,
  type ApprovalStatus,
  type EthicsContext,
  type GuardResult,
  type FrameworkCompliance,

  // Constants
  RISK_THRESHOLDS,
  AUTOMATION_WEIGHTS,
  APPROVAL_MATRIX,

  // Functions
  calculateRiskScore,
  getRiskCategory,
  ethicsGuard,
  assessCompliance,
  hasRequiredApprovals,
} from './ethics';

// ============================================================================
// SYNC MODULE
// ============================================================================

export {
  // Types
  type ConnectionStatus,
  type SyncState,
  type ConflictStrategy,
  type SyncOperation,
  type SyncResult,
  type ConflictInfo,
  type DDILStatus,
  type SyncQueueStats,

  // Constants
  RETRY_DELAYS,
  MAX_RETRIES,
  SYNC_BATCH_SIZE,
  OFFLINE_QUEUE_LIMIT,
  DDIL_THRESHOLDS,

  // Functions
  detectDDILStatus,
  createSyncOperation,
  getRetryDelay,
  shouldRetry,
  resolveConflict,
  prioritizeOperations,

  // Classes
  SyncQueue,
} from './sync';

// ============================================================================
// RAG MODULE
// ============================================================================

export {
  // Types
  type DocumentCategory,
  type KnowledgeDocument,
  type PromptTemplate,
  type SearchResult,
  type RAGConfig,

  // Constants
  DEFAULT_RAG_CONFIG,
  CATEGORY_WEIGHTS,

  // Functions
  searchKnowledge,
  fillTemplate,
  createDocument,
  createTemplate,
  augmentPrompt,
} from './rag';

// ============================================================================
// TCG MODULE
// ============================================================================

export {
  // Types
  type ElementType,
  type Rarity,
  type BattlePhase,
  type CardStats,
  type Card,
  type CardAbility,
  type AbilityEffect,
  type BattleState,
  type BattlePlayer,

  // Constants
  ELEMENT_ADVANTAGES,
  RARITY_MULTIPLIERS,
  BATTLE_CONSTANTS,

  // Functions
  hasAdvantage,
  calculateDamage,
  createCard,
  shuffleDeck,
  initializeBattle,
  estimateCardValue,
} from './tcg';

// ============================================================================
// VERSION & METADATA
// ============================================================================

export const VERSION = '0.1.0';
export const PACKAGE_NAME = '@apex/core';

export const MODULES = {
  ethics: 'Ethics & Job Protection',
  sync: 'Resilient Synchronization',
  rag: 'RAG Knowledge Management',
  tcg: 'TCG Battle System',
} as const;
