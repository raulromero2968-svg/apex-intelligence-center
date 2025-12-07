import * as React from "react";

/**
 * useReputation - Shared state and utilities for RC (Reputation Credits)
 *
 * Design Philosophy:
 * - Centralizes RC state management
 * - Provides animation coordination between components
 * - Handles the "transfer" animation state machine
 * - Maintains the "Ledger" history for audit trail feel
 *
 * This hook does NOT handle persistence - that's the app's responsibility.
 * It only manages the UI state and animation coordination.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ReputationTransaction {
  /** Unique transaction ID */
  id: string;
  /** Amount (positive for credit, negative for debit) */
  amount: number;
  /** Type of transaction */
  type: "claim" | "purchase" | "bonus" | "referral" | "stake" | "withdrawal";
  /** Description of the transaction */
  description: string;
  /** Timestamp */
  timestamp: Date;
  /** Related item ID (e.g., intel report ID) */
  relatedItemId?: string;
  /** USD equivalent at time of transaction */
  usdEquivalent?: number;
}

export interface ReputationState {
  /** Current RC balance */
  balance: number;
  /** Previous balance (for animation) */
  previousBalance: number;
  /** Transaction history (limited for UI display) */
  recentTransactions: ReputationTransaction[];
  /** Whether a transfer animation is in progress */
  isTransferring: boolean;
  /** Current streak data */
  streak: {
    current: number;
    type: "daily" | "weekly";
    bonusMultiplier: number;
  };
  /** Pending RC (e.g., from unclaimed reports) */
  pendingRC: number;
}

export interface ReputationActions {
  /** Credit RC to the balance */
  credit: (
    amount: number,
    options?: {
      type?: ReputationTransaction["type"];
      description?: string;
      relatedItemId?: string;
      animate?: boolean;
    }
  ) => void;
  /** Debit RC from the balance */
  debit: (
    amount: number,
    options?: {
      type?: ReputationTransaction["type"];
      description?: string;
      relatedItemId?: string;
    }
  ) => void;
  /** Start a transfer animation */
  startTransfer: () => void;
  /** End a transfer animation */
  endTransfer: () => void;
  /** Set pending RC amount */
  setPendingRC: (amount: number) => void;
  /** Claim pending RC */
  claimPending: () => void;
  /** Reset state (for logout) */
  reset: () => void;
}

export type UseReputationReturn = ReputationState & ReputationActions;

// ═══════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════

const initialState: ReputationState = {
  balance: 0,
  previousBalance: 0,
  recentTransactions: [],
  isTransferring: false,
  streak: {
    current: 0,
    type: "daily",
    bonusMultiplier: 1,
  },
  pendingRC: 0,
};

// ═══════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════

type ReputationAction =
  | {
      type: "CREDIT";
      payload: {
        amount: number;
        transaction: ReputationTransaction;
      };
    }
  | {
      type: "DEBIT";
      payload: {
        amount: number;
        transaction: ReputationTransaction;
      };
    }
  | { type: "START_TRANSFER" }
  | { type: "END_TRANSFER" }
  | { type: "SET_PENDING"; payload: number }
  | { type: "CLAIM_PENDING" }
  | { type: "SET_BALANCE"; payload: number }
  | { type: "SET_STREAK"; payload: ReputationState["streak"] }
  | { type: "RESET" };

function reputationReducer(
  state: ReputationState,
  action: ReputationAction
): ReputationState {
  switch (action.type) {
    case "CREDIT":
      return {
        ...state,
        previousBalance: state.balance,
        balance: state.balance + action.payload.amount,
        recentTransactions: [
          action.payload.transaction,
          ...state.recentTransactions,
        ].slice(0, 10), // Keep last 10
      };

    case "DEBIT":
      return {
        ...state,
        previousBalance: state.balance,
        balance: Math.max(0, state.balance - action.payload.amount),
        recentTransactions: [
          action.payload.transaction,
          ...state.recentTransactions,
        ].slice(0, 10),
      };

    case "START_TRANSFER":
      return {
        ...state,
        isTransferring: true,
      };

    case "END_TRANSFER":
      return {
        ...state,
        isTransferring: false,
      };

    case "SET_PENDING":
      return {
        ...state,
        pendingRC: action.payload,
      };

    case "CLAIM_PENDING":
      if (state.pendingRC <= 0) return state;
      const pendingAmount = state.pendingRC;
      const claimTransaction: ReputationTransaction = {
        id: `claim-${Date.now()}`,
        amount: pendingAmount,
        type: "claim" as const,
        description: "Claimed pending RC",
        timestamp: new Date(),
      };
      return {
        ...state,
        previousBalance: state.balance,
        balance: state.balance + pendingAmount,
        pendingRC: 0,
        recentTransactions: [
          claimTransaction,
          ...state.recentTransactions,
        ].slice(0, 10),
      };

    case "SET_BALANCE":
      return {
        ...state,
        previousBalance: state.balance,
        balance: action.payload,
      };

    case "SET_STREAK":
      return {
        ...state,
        streak: action.payload,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Generate a unique transaction ID */
function generateTransactionId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Calculate USD equivalent at current rate */
function calculateUsdEquivalent(rcAmount: number, rate: number = 0.1): number {
  return rcAmount * rate;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════

export interface UseReputationOptions {
  /** Initial balance */
  initialBalance?: number;
  /** USD conversion rate */
  usdRate?: number;
  /** Initial streak data */
  initialStreak?: ReputationState["streak"];
  /** Callback when balance changes */
  onBalanceChange?: (newBalance: number, delta: number) => void;
  /** Callback when transaction occurs */
  onTransaction?: (transaction: ReputationTransaction) => void;
}

/**
 * useReputation - Manage RC state with animation coordination
 *
 * @example
 * ```tsx
 * const {
 *   balance,
 *   previousBalance,
 *   credit,
 *   isTransferring,
 *   startTransfer,
 *   endTransfer,
 * } = useReputation({
 *   initialBalance: 2450,
 *   onBalanceChange: (balance, delta) => {
 *     // Persist to backend
 *     api.updateBalance(balance);
 *   },
 * });
 *
 * // In claim handler:
 * const handleClaim = () => {
 *   startTransfer();
 *   setTimeout(() => {
 *     credit(10, { type: "claim", description: "Intel report claim" });
 *     endTransfer();
 *   }, 2000);
 * };
 * ```
 */
export function useReputation(
  options: UseReputationOptions = {}
): UseReputationReturn {
  const {
    initialBalance = 0,
    usdRate = 0.1,
    initialStreak,
    onBalanceChange,
    onTransaction,
  } = options;

  const [state, dispatch] = React.useReducer(reputationReducer, {
    ...initialState,
    balance: initialBalance,
    previousBalance: initialBalance,
    streak: initialStreak ?? initialState.streak,
  });

  // Track balance changes
  const prevBalanceRef = React.useRef(initialBalance);
  React.useEffect(() => {
    if (state.balance !== prevBalanceRef.current) {
      const delta = state.balance - prevBalanceRef.current;
      onBalanceChange?.(state.balance, delta);
      prevBalanceRef.current = state.balance;
    }
  }, [state.balance, onBalanceChange]);

  // Actions
  const credit = React.useCallback(
    (
      amount: number,
      options?: {
        type?: ReputationTransaction["type"];
        description?: string;
        relatedItemId?: string;
        animate?: boolean;
      }
    ) => {
      const transaction: ReputationTransaction = {
        id: generateTransactionId(),
        amount,
        type: options?.type ?? "claim",
        description: options?.description ?? `+${amount} RC`,
        timestamp: new Date(),
        relatedItemId: options?.relatedItemId,
        usdEquivalent: calculateUsdEquivalent(amount, usdRate),
      };

      dispatch({ type: "CREDIT", payload: { amount, transaction } });
      onTransaction?.(transaction);
    },
    [usdRate, onTransaction]
  );

  const debit = React.useCallback(
    (
      amount: number,
      options?: {
        type?: ReputationTransaction["type"];
        description?: string;
        relatedItemId?: string;
      }
    ) => {
      const transaction: ReputationTransaction = {
        id: generateTransactionId(),
        amount: -amount,
        type: options?.type ?? "purchase",
        description: options?.description ?? `-${amount} RC`,
        timestamp: new Date(),
        relatedItemId: options?.relatedItemId,
        usdEquivalent: calculateUsdEquivalent(amount, usdRate),
      };

      dispatch({ type: "DEBIT", payload: { amount, transaction } });
      onTransaction?.(transaction);
    },
    [usdRate, onTransaction]
  );

  const startTransfer = React.useCallback(() => {
    dispatch({ type: "START_TRANSFER" });
  }, []);

  const endTransfer = React.useCallback(() => {
    dispatch({ type: "END_TRANSFER" });
  }, []);

  const setPendingRC = React.useCallback((amount: number) => {
    dispatch({ type: "SET_PENDING", payload: amount });
  }, []);

  const claimPending = React.useCallback(() => {
    dispatch({ type: "CLAIM_PENDING" });
  }, []);

  const reset = React.useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    ...state,
    credit,
    debit,
    startTransfer,
    endTransfer,
    setPendingRC,
    claimPending,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT PROVIDER
// ═══════════════════════════════════════════════════════════════════

const ReputationContext = React.createContext<UseReputationReturn | null>(null);

export interface ReputationProviderProps {
  children: React.ReactNode;
  options?: UseReputationOptions;
}

/**
 * ReputationProvider - Context wrapper for app-wide RC state
 *
 * @example
 * ```tsx
 * // In _app.tsx or layout
 * <ReputationProvider options={{ initialBalance: user.rcBalance }}>
 *   <App />
 * </ReputationProvider>
 *
 * // In any component
 * const { balance, credit } = useReputationContext();
 * ```
 */
export function ReputationProvider({
  children,
  options,
}: ReputationProviderProps) {
  const reputation = useReputation(options);

  return (
    <ReputationContext.Provider value={reputation}>
      {children}
    </ReputationContext.Provider>
  );
}

/**
 * useReputationContext - Access RC state from context
 *
 * @throws Error if used outside of ReputationProvider
 */
export function useReputationContext(): UseReputationReturn {
  const context = React.useContext(ReputationContext);

  if (!context) {
    throw new Error(
      "useReputationContext must be used within a ReputationProvider"
    );
  }

  return context;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════

/**
 * useReputationAnimation - Simplified hook for animation coordination
 *
 * Returns only the state needed for animation, plus the transfer controls.
 * Use this in components that only need to react to balance changes.
 */
export function useReputationAnimation() {
  const { balance, previousBalance, isTransferring, startTransfer, endTransfer } =
    useReputationContext();

  return {
    balance,
    previousBalance,
    isTransferring,
    startTransfer,
    endTransfer,
    delta: balance - previousBalance,
    hasChanged: balance !== previousBalance,
  };
}

/**
 * useReputationDisplay - Hook for display-only components
 *
 * Returns formatted values ready for display.
 */
export function useReputationDisplay(usdRate: number = 0.1) {
  const { balance, streak, pendingRC } = useReputationContext();

  return {
    balance,
    formattedBalance: balance.toLocaleString("en-US"),
    usdEquivalent: balance * usdRate,
    formattedUsd: `$${(balance * usdRate).toFixed(2)}`,
    streak: streak.current,
    streakBonus: streak.bonusMultiplier,
    pendingRC,
    hasPending: pendingRC > 0,
  };
}

export default useReputation;
