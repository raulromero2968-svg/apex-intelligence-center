/**
 * Apex Design System - Organisms
 *
 * Complex components: ClaimRewardModal, MarketChart, DataGrid, etc.
 * These are large, distinct sections of the interface composed of molecules and atoms.
 *
 * Following Atomic Design methodology:
 * - Organisms are relatively complex UI components
 * - They form distinct sections of an interface
 * - They are composed of groups of molecules and atoms
 *
 * Design Philosophy: "Aerospace Dark"
 * - Modals feel like "System Upgrades", not slot machines
 * - Terminal aesthetics for transaction confirmations
 * - The "Bank Ledger Update" feel for all reward interactions
 */

// ═══════════════════════════════════════════════════════════════════
// CLAIM REWARD MODAL - "Anti-Confetti" reward experience
// ═══════════════════════════════════════════════════════════════════
export { ClaimRewardModal, RewardToast } from "./ClaimRewardModal";
export type {
  ClaimRewardModalProps,
  RewardToastProps,
} from "./ClaimRewardModal";

// Future organisms:
// export { MarketChart } from "./MarketChart";
// export { DataGrid } from "./DataGrid";
// export { NavigationHeader } from "./NavigationHeader";
