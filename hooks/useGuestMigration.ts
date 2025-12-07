'use client';

/**
 * Guest Migration Hook - The "Handshake" Protocol
 *
 * This hook handles the critical moment when we migrate guest portfolio data
 * from localStorage to the authenticated user's Postgres database.
 *
 * FAIL-SAFE DESIGN:
 * - Only clears guest store on CONFIRMED 200 OK response
 * - Never clears on partial success or errors
 * - Includes retry logic for network failures
 * - Invalidates React Query cache on success
 *
 * This is the "build trust" moment - if we lose their data, we lose them forever.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/context';
import { useGuestStore } from '@/stores/useGuestStore';
import { toMigrationPayload } from '@/types/guest-portfolio';
import type { GuestCardItem } from '@/types/guest-portfolio';

// =============================================================================
// Types
// =============================================================================

/**
 * Migration status states
 */
export type MigrationStatus =
  | 'idle' // No migration attempted yet
  | 'checking' // Checking for guest data
  | 'migrating' // Migration in progress
  | 'success' // Migration completed successfully
  | 'error' // Migration failed (guest data preserved)
  | 'no-data'; // No guest data to migrate

/**
 * Detailed migration result
 */
export interface MigrationResult {
  status: MigrationStatus;
  /** Number of new cards added */
  migratedCount: number;
  /** Number of existing cards updated (quantity increased) */
  updatedCount: number;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'INTERNAL_ERROR';
}

/**
 * Toast notification function type (compatible with Sonner and custom toast systems)
 */
type ToastFn = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => void;

/**
 * Options for the migration hook
 */
export interface UseGuestMigrationOptions {
  /** Automatically migrate on sign-in (default: true) */
  autoMigrate?: boolean;
  /** Toast function for notifications */
  toast?: ToastFn;
  /** Callback after successful migration */
  onSuccess?: (result: MigrationResult) => void;
  /** Callback after failed migration */
  onError?: (error: string, code?: string) => void;
  /** Number of retry attempts for network errors (default: 3) */
  retryAttempts?: number;
  /** React Query keys to invalidate on success */
  queryKeysToInvalidate?: string[][];
}

// =============================================================================
// API Types (from batch endpoint)
// =============================================================================

interface BatchMigrationSuccessResponse {
  success: true;
  message: string;
  migratedCount: number;
  updatedCount: number;
  items: Array<{
    id: string;
    cardName: string;
    quantity: number;
  }>;
}

interface BatchMigrationErrorResponse {
  success: false;
  error: string;
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_ERROR';
  details?: Record<string, unknown>;
}

type BatchMigrationResponse = BatchMigrationSuccessResponse | BatchMigrationErrorResponse;

// =============================================================================
// Constants
// =============================================================================

const MIGRATION_ENDPOINT = '/api/portfolio/batch';
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useGuestMigration - The "Handshake" Hook
 *
 * Handles the secure migration of guest portfolio data to the authenticated user's account.
 *
 * @example
 * ```tsx
 * const { status, migrate, isMigrating, pendingCardCount } = useGuestMigration({
 *   toast: myToastFunction,
 *   onSuccess: (result) => console.log('Migrated!', result),
 *   onError: (error) => console.error('Failed:', error),
 * });
 * ```
 */
export function useGuestMigration(options: UseGuestMigrationOptions = {}) {
  const {
    autoMigrate = true,
    toast,
    onSuccess,
    onError,
    retryAttempts = DEFAULT_RETRY_ATTEMPTS,
    queryKeysToInvalidate = [['portfolio'], ['portfolio-stats']],
  } = options;

  // Hooks
  const { user } = useAuth();
  const guestStore = useGuestStore();
  const queryClient = useQueryClient();

  // State
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Refs to prevent double-migration
  const migrationAttempted = useRef(false);
  const migrationInProgress = useRef(false);

  /**
   * Sleep utility for retry delays
   */
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Call the migration API with retry logic for network errors
   */
  const callMigrationApi = useCallback(
    async (cards: GuestCardItem[]): Promise<BatchMigrationResponse> => {
      const payloads = cards.map(toMigrationPayload);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          if (attempt > 0) {
            setLoadingMessage(`Retrying... (attempt ${attempt + 1})`);
            await sleep(RETRY_DELAYS[attempt - 1] || 4000);
          }

          const response = await fetch(MIGRATION_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cards: payloads }),
          });

          const data = await response.json();

          // If we got a response (even an error), don't retry
          return data as BatchMigrationResponse;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Network error');

          // Only retry on network errors, not on HTTP errors
          if (attempt === retryAttempts) {
            return {
              success: false,
              error: `Network error after ${retryAttempts + 1} attempts: ${lastError.message}`,
              code: 'INTERNAL_ERROR',
            };
          }
        }
      }

      // Should never reach here, but TypeScript needs it
      return {
        success: false,
        error: lastError?.message || 'Unknown error',
        code: 'INTERNAL_ERROR',
      };
    },
    [retryAttempts]
  );

  /**
   * Perform the migration
   *
   * CRITICAL: Only clears guest store on CONFIRMED success
   */
  const migrate = useCallback(async (): Promise<MigrationResult> => {
    // Prevent concurrent migrations
    if (migrationInProgress.current) {
      return {
        status: 'error',
        migratedCount: 0,
        updatedCount: 0,
        error: 'Migration already in progress',
      };
    }

    // Validate prerequisites
    if (!user) {
      const errorResult: MigrationResult = {
        status: 'error',
        migratedCount: 0,
        updatedCount: 0,
        error: 'Please sign in to save your portfolio',
        errorCode: 'UNAUTHORIZED',
      };
      setResult(errorResult);
      setStatus('error');
      return errorResult;
    }

    const cards = guestStore.cards;
    if (cards.length === 0) {
      setStatus('no-data');
      return {
        status: 'no-data',
        migratedCount: 0,
        updatedCount: 0,
      };
    }

    // Begin migration
    migrationInProgress.current = true;
    setStatus('migrating');
    setLoadingMessage('Securing your portfolio...');

    try {
      // Call the API
      const response = await callMigrationApi(cards);

      if (response.success) {
        // =================================================================
        // SUCCESS: Clear guest store and invalidate cache
        // =================================================================
        const migrationResult: MigrationResult = {
          status: 'success',
          migratedCount: response.migratedCount,
          updatedCount: response.updatedCount,
        };

        // CRITICAL: Only clear after confirmed success
        guestStore.clearStore();

        // Invalidate React Query cache to refresh portfolio data
        for (const queryKey of queryKeysToInvalidate) {
          queryClient.invalidateQueries({ queryKey });
        }

        setResult(migrationResult);
        setStatus('success');

        // Show success toast
        if (toast) {
          const totalItems = response.migratedCount + response.updatedCount;
          toast({
            title: 'Portfolio Secured',
            description: `Successfully migrated ${totalItems} card${totalItems !== 1 ? 's' : ''} to your account.`,
          });
        }

        onSuccess?.(migrationResult);
        return migrationResult;
      } else {
        // =================================================================
        // FAILURE: Preserve guest store, show error
        // =================================================================
        const migrationResult: MigrationResult = {
          status: 'error',
          migratedCount: 0,
          updatedCount: 0,
          error: response.error,
          errorCode: response.code as MigrationResult['errorCode'],
        };

        setResult(migrationResult);
        setStatus('error');

        // Show error toast (guest data preserved)
        if (toast) {
          toast({
            title: 'Migration Issue',
            description: `${response.error} Your cards are safely stored locally.`,
            variant: 'destructive',
          });
        }

        onError?.(response.error, response.code);
        return migrationResult;
      }
    } catch (error) {
      // =================================================================
      // UNEXPECTED ERROR: Preserve guest store
      // =================================================================
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      const migrationResult: MigrationResult = {
        status: 'error',
        migratedCount: 0,
        updatedCount: 0,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR',
      };

      setResult(migrationResult);
      setStatus('error');

      if (toast) {
        toast({
          title: 'Migration Failed',
          description: 'Your cards are safely stored locally. Please try again.',
          variant: 'destructive',
        });
      }

      onError?.(errorMessage, 'INTERNAL_ERROR');
      return migrationResult;
    } finally {
      migrationInProgress.current = false;
      setLoadingMessage('');
    }
  }, [user, guestStore, callMigrationApi, queryClient, queryKeysToInvalidate, toast, onSuccess, onError]);

  /**
   * Auto-migration on authentication
   */
  useEffect(() => {
    if (!autoMigrate || !user || migrationAttempted.current) {
      return;
    }

    // Check for guest data
    const hasGuestData = guestStore.cards.length > 0;
    if (!hasGuestData) {
      setStatus('no-data');
      return;
    }

    // Mark as attempted to prevent double-runs
    migrationAttempted.current = true;
    setStatus('checking');

    // Small delay to ensure auth is fully established
    const timeoutId = setTimeout(() => {
      migrate();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, autoMigrate, guestStore.cards.length, migrate]);

  /**
   * Reset on logout
   */
  useEffect(() => {
    if (!user) {
      migrationAttempted.current = false;
      migrationInProgress.current = false;
      setStatus('idle');
      setResult(null);
      setLoadingMessage('');
    }
  }, [user]);

  // Return hook interface
  return {
    /** Current migration status */
    status,
    /** Detailed migration result (after migration completes) */
    result,
    /** Manually trigger migration */
    migrate,
    /** Whether there's guest data to migrate */
    hasGuestData: guestStore.cards.length > 0,
    /** Number of cards pending migration */
    pendingCardCount: guestStore.cards.length,
    /** Total value of pending cards */
    pendingValue: guestStore.totalValue,
    /** Whether migration is in progress */
    isMigrating: status === 'migrating',
    /** Current loading message */
    loadingMessage,
    /** Whether the migration was successful */
    isSuccess: status === 'success',
    /** Whether the migration failed */
    isError: status === 'error',
  };
}

/**
 * Hook to show migration prompt to guest users
 *
 * Use this to prompt users to sign up and preserve their portfolio.
 *
 * @example
 * ```tsx
 * const { shouldShowPrompt, guestCardCount, dismiss } = useMigrationPrompt();
 * if (shouldShowPrompt) {
 *   return <SignUpPrompt cardCount={guestCardCount} onDismiss={dismiss} />;
 * }
 * ```
 */
export function useMigrationPrompt() {
  const { user } = useAuth();
  const guestStore = useGuestStore();
  const [dismissed, setDismissed] = useState(false);

  const hasGuestData = guestStore.cards.length > 0;
  const shouldShowPrompt = !user && hasGuestData && !dismissed;

  return {
    /** Whether to show the migration prompt */
    shouldShowPrompt,
    /** Number of cards in guest wallet */
    guestCardCount: guestStore.cards.length,
    /** Total value of guest portfolio */
    guestTotalValue: guestStore.totalValue,
    /** Dismiss the prompt */
    dismiss: () => setDismissed(true),
    /** Reset dismissal state */
    reset: () => setDismissed(false),
  };
}

export default useGuestMigration;
