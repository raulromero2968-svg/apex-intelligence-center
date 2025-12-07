'use client';

/**
 * Guest Data Migration Hook
 * Handles the "Handshake" - migrating guest portfolio data to authenticated user's account
 *
 * This hook:
 * 1. Listens for authentication state changes
 * 2. Detects guest portfolio data
 * 3. Batch migrates cards to the user's database portfolio
 * 4. Clears guest storage on success
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useGuestStore } from '@/stores/useGuestStore';
import { toMigrationPayload } from '@/types/guest-portfolio';
import type { GuestCardItem } from '@/types/guest-portfolio';

/**
 * Migration status states
 */
export type MigrationStatus =
  | 'idle'
  | 'checking'
  | 'migrating'
  | 'success'
  | 'error'
  | 'no-data';

/**
 * Migration result interface
 */
export interface MigrationResult {
  status: MigrationStatus;
  migratedCount: number;
  failedCount: number;
  error?: string;
}

/**
 * Toast notification function type
 */
type ToastFn = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => void;

/**
 * Options for the migration hook
 */
interface UseMigrateGuestDataOptions {
  /** Whether to automatically migrate on sign-in (default: true) */
  autoMigrate?: boolean;
  /** Custom toast function for notifications */
  toast?: ToastFn;
  /** Callback after successful migration */
  onSuccess?: (result: MigrationResult) => void;
  /** Callback after failed migration */
  onError?: (error: string) => void;
}

/**
 * Hook to handle guest portfolio migration on authentication
 *
 * Usage:
 * ```tsx
 * const { status, migrate, result } = useMigrateGuestData({
 *   toast: myToastFunction,
 *   onSuccess: (result) => console.log('Migrated!', result)
 * });
 * ```
 */
export function useMigrateGuestData(options: UseMigrateGuestDataOptions = {}) {
  const { autoMigrate = true, toast, onSuccess, onError } = options;

  const { user } = useAuth();
  const guestStore = useGuestStore();
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const migrationAttempted = useRef(false);

  /**
   * Batch migrate cards to the API
   */
  const migrateCards = useCallback(async (cards: GuestCardItem[]): Promise<MigrationResult> => {
    if (cards.length === 0) {
      return { status: 'no-data', migratedCount: 0, failedCount: 0 };
    }

    setStatus('migrating');

    try {
      // Convert guest cards to migration payloads
      const payloads = cards.map(toMigrationPayload);

      // Batch POST to the portfolio API
      const response = await fetch('/api/portfolio/batch-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: payloads }),
      });

      if (!response.ok) {
        // Try individual adds if batch fails
        const results = await Promise.allSettled(
          payloads.map(async (payload) => {
            const res = await fetch('/api/portfolio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Failed to add ${payload.cardName}`);
            return res.json();
          })
        );

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failedCount = results.filter((r) => r.status === 'rejected').length;

        if (successCount > 0) {
          // Partial success - clear store anyway
          guestStore.clearStore();
          const migrationResult: MigrationResult = {
            status: failedCount > 0 ? 'error' : 'success',
            migratedCount: successCount,
            failedCount,
            error: failedCount > 0 ? `${failedCount} cards failed to migrate` : undefined,
          };
          setResult(migrationResult);
          setStatus(migrationResult.status);
          return migrationResult;
        }

        throw new Error('Failed to migrate portfolio');
      }

      // Success - clear the guest store
      guestStore.clearStore();

      const migrationResult: MigrationResult = {
        status: 'success',
        migratedCount: cards.length,
        failedCount: 0,
      };

      setResult(migrationResult);
      setStatus('success');
      return migrationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      const migrationResult: MigrationResult = {
        status: 'error',
        migratedCount: 0,
        failedCount: cards.length,
        error: errorMessage,
      };
      setResult(migrationResult);
      setStatus('error');
      return migrationResult;
    }
  }, [guestStore]);

  /**
   * Manual migration trigger
   */
  const migrate = useCallback(async (): Promise<MigrationResult> => {
    if (!user) {
      return { status: 'error', migratedCount: 0, failedCount: 0, error: 'Not authenticated' };
    }

    const cards = guestStore.cards;
    if (cards.length === 0) {
      setStatus('no-data');
      return { status: 'no-data', migratedCount: 0, failedCount: 0 };
    }

    const migrationResult = await migrateCards(cards);

    // Show toast notification
    if (toast) {
      if (migrationResult.status === 'success') {
        toast({
          title: 'Portfolio Secured',
          description: `${migrationResult.migratedCount} card${migrationResult.migratedCount !== 1 ? 's' : ''} migrated to your account.`,
        });
      } else if (migrationResult.status === 'error') {
        toast({
          title: 'Migration Issue',
          description: migrationResult.error || 'Some cards could not be migrated.',
          variant: 'destructive',
        });
      }
    }

    // Callbacks
    if (migrationResult.status === 'success') {
      onSuccess?.(migrationResult);
    } else if (migrationResult.status === 'error') {
      onError?.(migrationResult.error || 'Migration failed');
    }

    return migrationResult;
  }, [user, guestStore.cards, migrateCards, toast, onSuccess, onError]);

  /**
   * Auto-migration on authentication state change
   */
  useEffect(() => {
    // Only run if autoMigrate is enabled and user just logged in
    if (!autoMigrate || !user || migrationAttempted.current) {
      return;
    }

    // Check if there's guest data to migrate
    const hasGuestData = guestStore.cards.length > 0;
    if (!hasGuestData) {
      setStatus('no-data');
      return;
    }

    // Attempt migration
    setStatus('checking');
    migrationAttempted.current = true;

    // Small delay to ensure auth is fully established
    const timeoutId = setTimeout(() => {
      migrate();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, autoMigrate, guestStore.cards.length, migrate]);

  /**
   * Reset migration state when user logs out
   */
  useEffect(() => {
    if (!user) {
      migrationAttempted.current = false;
      setStatus('idle');
      setResult(null);
    }
  }, [user]);

  return {
    /** Current migration status */
    status,
    /** Migration result (after migration completes) */
    result,
    /** Manually trigger migration */
    migrate,
    /** Whether there's guest data to migrate */
    hasGuestData: guestStore.cards.length > 0,
    /** Number of cards pending migration */
    pendingCardCount: guestStore.cards.length,
    /** Whether migration is in progress */
    isMigrating: status === 'migrating',
  };
}

/**
 * Hook to get migration prompt state
 * Use this to show a prompt asking users to migrate their guest data
 */
export function useMigrationPrompt() {
  const { user } = useAuth();
  const guestStore = useGuestStore();
  const [dismissed, setDismissed] = useState(false);

  const hasGuestData = guestStore.cards.length > 0;
  const shouldShowPrompt = !user && hasGuestData && !dismissed;

  return {
    shouldShowPrompt,
    guestCardCount: guestStore.cards.length,
    guestTotalValue: guestStore.totalValue,
    dismiss: () => setDismissed(true),
  };
}
