/**
 * Guest Migration Hook
 *
 * Handles the migration of guest portfolio items to a user's authenticated account.
 * Implements the "Endowment Effect" completion - users who built a portfolio
 * before signing up have their items preserved on login.
 *
 * Safety Features:
 * - Only clears guest store AFTER successful API migration
 * - Preserves data on API failure (fail-safe behavior)
 * - Idempotent - safe to call multiple times
 *
 * @see useGuestStore.ts
 */

'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useGuestStore } from '@/stores/useGuestStore';

// ============================================================================
// Types
// ============================================================================

export interface MigrationItem {
  tcgPlayerId: string;
  name: string;
  set: string;
  condition: string;
  price: number;
  imageUrl?: string;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  error?: string;
}

interface MigrationState {
  isLoading: boolean;
  isComplete: boolean;
  result: MigrationResult | null;
  error: string | null;
}

interface UseGuestMigrationOptions {
  /** Custom API endpoint for batch migration */
  apiEndpoint?: string;
  /** Callback fired on successful migration */
  onSuccess?: (result: MigrationResult) => void;
  /** Callback fired on migration failure */
  onError?: (error: string) => void;
  /** Whether to auto-migrate on mount when items exist */
  autoMigrate?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_API_ENDPOINT = '/api/portfolio/batch';

// ============================================================================
// Hook
// ============================================================================

export function useGuestMigration(options: UseGuestMigrationOptions = {}) {
  const {
    apiEndpoint = DEFAULT_API_ENDPOINT,
    onSuccess,
    onError,
    autoMigrate = false,
  } = options;

  const guestStore = useGuestStore();
  const hasMigrated = useRef(false);

  const [state, setState] = useState<MigrationState>({
    isLoading: false,
    isComplete: false,
    result: null,
    error: null,
  });

  /**
   * Migrate guest items to authenticated user account
   * Returns true if migration was successful, false otherwise
   */
  const migrateGuestItems = useCallback(async (): Promise<boolean> => {
    const { cards, clearStore, hasHydrated } = guestStore;

    // Don't migrate if not hydrated yet
    if (!hasHydrated) {
      console.warn('[GuestMigration] Store not hydrated yet, skipping migration');
      return false;
    }

    // Don't migrate if no items
    if (cards.length === 0) {
      setState((prev) => ({
        ...prev,
        isComplete: true,
        result: { success: true, migratedCount: 0, failedCount: 0 },
      }));
      return true;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Transform cards to migration payload format
      const migrationPayload: MigrationItem[] = cards.map((card) => ({
        tcgPlayerId: card.tcgPlayerId,
        name: card.name,
        set: card.set,
        condition: card.condition,
        price: card.price,
        imageUrl: card.imageUrl,
      }));

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: migrationPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Migration failed with status ${response.status}`;

        // CRITICAL: Do NOT clear store on failure - preserve user's data
        setState({
          isLoading: false,
          isComplete: true,
          result: null,
          error: errorMessage,
        });

        onError?.(errorMessage);
        return false;
      }

      const data = await response.json();

      const result: MigrationResult = {
        success: true,
        migratedCount: data.migratedCount ?? cards.length,
        failedCount: data.failedCount ?? 0,
      };

      // SUCCESS: Clear the guest store now that items are safely in the database
      clearStore();

      setState({
        isLoading: false,
        isComplete: true,
        result,
        error: null,
      });

      onSuccess?.(result);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown migration error';

      // CRITICAL: Do NOT clear store on error - preserve user's data
      setState({
        isLoading: false,
        isComplete: true,
        result: null,
        error: errorMessage,
      });

      onError?.(errorMessage);
      return false;
    }
  }, [guestStore, apiEndpoint, onSuccess, onError]);

  /**
   * Check if there are guest items pending migration
   */
  const hasPendingItems = guestStore.hasHydrated && guestStore.cards.length > 0;

  /**
   * Get the count of pending items
   */
  const pendingItemCount = guestStore.hasHydrated ? guestStore.cards.length : 0;

  /**
   * Get total value of pending items
   */
  const pendingTotalValue = guestStore.hasHydrated ? guestStore.totalValue : 0;

  /**
   * Reset migration state (useful for retry scenarios)
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isComplete: false,
      result: null,
      error: null,
    });
    hasMigrated.current = false;
  }, []);

  // Auto-migrate on mount if enabled
  useEffect(() => {
    if (
      autoMigrate &&
      guestStore.hasHydrated &&
      guestStore.cards.length > 0 &&
      !hasMigrated.current &&
      !state.isLoading &&
      !state.isComplete
    ) {
      hasMigrated.current = true;
      migrateGuestItems();
    }
  }, [
    autoMigrate,
    guestStore.hasHydrated,
    guestStore.cards.length,
    migrateGuestItems,
    state.isLoading,
    state.isComplete,
  ]);

  return {
    // State
    isLoading: state.isLoading,
    isComplete: state.isComplete,
    result: state.result,
    error: state.error,

    // Computed
    hasPendingItems,
    pendingItemCount,
    pendingTotalValue,

    // Actions
    migrateGuestItems,
    reset,
  };
}

export default useGuestMigration;
