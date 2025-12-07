'use client';

/**
 * Guest Migration Provider
 *
 * This component handles the "handshake" moment when a guest user signs up.
 * It automatically migrates their guest portfolio data and provides visual feedback.
 *
 * Usage:
 * Wrap your dashboard or authenticated layout with this provider:
 *
 * ```tsx
 * <GuestMigrationProvider>
 *   <Dashboard />
 * </GuestMigrationProvider>
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGuestMigration, type MigrationResult, type MigrationStatus } from '@/hooks/useGuestMigration';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface GuestMigrationContextValue {
  /** Current migration status */
  status: MigrationStatus;
  /** Migration result */
  result: MigrationResult | null;
  /** Manually trigger migration */
  migrate: () => Promise<MigrationResult>;
  /** Whether migration is in progress */
  isMigrating: boolean;
  /** Number of cards pending migration */
  pendingCardCount: number;
  /** Total value of pending cards */
  pendingValue: number;
  /** Whether migration was successful */
  isSuccess: boolean;
  /** Whether migration failed */
  isError: boolean;
  /** Current loading message */
  loadingMessage: string;
}

// =============================================================================
// Context
// =============================================================================

const GuestMigrationContext = createContext<GuestMigrationContextValue | null>(null);

/**
 * Hook to access guest migration context
 */
export function useGuestMigrationContext() {
  const context = useContext(GuestMigrationContext);
  if (!context) {
    throw new Error('useGuestMigrationContext must be used within GuestMigrationProvider');
  }
  return context;
}

// =============================================================================
// Provider Component
// =============================================================================

interface GuestMigrationProviderProps {
  children: React.ReactNode;
  /** Disable auto-migration (useful for testing) */
  autoMigrate?: boolean;
  /** Callback after successful migration */
  onSuccess?: (result: MigrationResult) => void;
  /** Callback after failed migration */
  onError?: (error: string) => void;
}

/**
 * Toast notification wrapper for Sonner
 */
const toastWrapper = ({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => {
  if (variant === 'destructive') {
    toast.error(title, { description });
  } else {
    toast.success(title, { description });
  }
};

export function GuestMigrationProvider({
  children,
  autoMigrate = true,
  onSuccess,
  onError,
}: GuestMigrationProviderProps) {
  const migration = useGuestMigration({
    autoMigrate,
    toast: toastWrapper,
    onSuccess,
    onError,
  });

  const contextValue: GuestMigrationContextValue = {
    status: migration.status,
    result: migration.result,
    migrate: migration.migrate,
    isMigrating: migration.isMigrating,
    pendingCardCount: migration.pendingCardCount,
    pendingValue: migration.pendingValue,
    isSuccess: migration.isSuccess,
    isError: migration.isError,
    loadingMessage: migration.loadingMessage,
  };

  return (
    <GuestMigrationContext.Provider value={contextValue}>
      {/* Migration Loading Overlay */}
      {migration.isMigrating && (
        <MigrationLoadingOverlay message={migration.loadingMessage} />
      )}
      {children}
    </GuestMigrationContext.Provider>
  );
}

// =============================================================================
// Loading Overlay Component
// =============================================================================

interface MigrationLoadingOverlayProps {
  message: string;
}

function MigrationLoadingOverlay({ message }: MigrationLoadingOverlayProps) {
  const [dots, setDots] = useState('');

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-xl border border-cyan-500/30 bg-neutral-900/95 p-8 shadow-2xl shadow-cyan-500/10">
        {/* Animated Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-white">
            {message || 'Securing your portfolio'}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h3>
          <p className="text-sm text-neutral-400">
            Transferring your cards to your secure account
          </p>
        </div>

        {/* Progress bar animation */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full animate-pulse bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Migration Status Badge Component
// =============================================================================

interface MigrationStatusBadgeProps {
  className?: string;
}

/**
 * Shows the current migration status as a badge
 * Useful for displaying in the UI after migration
 */
export function MigrationStatusBadge({ className = '' }: MigrationStatusBadgeProps) {
  const { status, result, pendingCardCount } = useGuestMigrationContext();

  if (status === 'idle' || status === 'no-data') {
    return null;
  }

  const statusConfig = {
    checking: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      label: 'Checking...',
    },
    migrating: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      label: 'Migrating...',
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      label: `Migrated ${result?.migratedCount ?? 0} cards`,
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: `${pendingCardCount} cards pending`,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      {status === 'migrating' && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      )}
      {status === 'success' && (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'error' && (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {config.label}
    </span>
  );
}

// =============================================================================
// Retry Migration Button
// =============================================================================

interface RetryMigrationButtonProps {
  className?: string;
}

/**
 * Button to retry failed migration
 */
export function RetryMigrationButton({ className = '' }: RetryMigrationButtonProps) {
  const { status, migrate, isMigrating, pendingCardCount } = useGuestMigrationContext();

  // Only show if there's an error and pending cards
  if (status !== 'error' || pendingCardCount === 0) {
    return null;
  }

  return (
    <button
      onClick={() => migrate()}
      disabled={isMigrating}
      className={`inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isMigrating ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Migrating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Retry Migration ({pendingCardCount} cards)
        </>
      )}
    </button>
  );
}

export default GuestMigrationProvider;
