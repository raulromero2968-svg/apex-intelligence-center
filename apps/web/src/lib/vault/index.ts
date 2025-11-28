/**
 * Vault Module - Barrel Exports
 *
 * Processes volatile market entries requiring deep community analysis.
 * Implements priority queue processing for high-volatility card tracking.
 *
 * @see master-plan-kb-10 (API patterns and vault architecture)
 */

export {
  // Job Processing
  processBatch,
  getQueueStats,
  // Types
  type VaultJobResult,
  type ProcessBatchResult,
} from './job-processor';
