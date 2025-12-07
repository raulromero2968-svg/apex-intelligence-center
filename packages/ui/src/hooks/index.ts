/**
 * Apex Design System - Hooks
 *
 * Custom React hooks for state management and UI coordination.
 *
 * Design Philosophy: "Aerospace Dark"
 * - These hooks manage the "value state" of the application
 * - Animation coordination between components
 * - Maintaining the "Ledger" feel in the UI
 */

// ═══════════════════════════════════════════════════════════════════
// REPUTATION (RC) HOOKS
// ═══════════════════════════════════════════════════════════════════
export {
  useReputation,
  useReputationContext,
  useReputationAnimation,
  useReputationDisplay,
  ReputationProvider,
} from "./useReputation.js";

export type {
  ReputationTransaction,
  ReputationState,
  ReputationActions,
  UseReputationReturn,
  UseReputationOptions,
  ReputationProviderProps,
} from "./useReputation.js";
