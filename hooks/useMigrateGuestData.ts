'use client';

/**
 * @deprecated Use `useGuestMigration` from '@/hooks/useGuestMigration' instead.
 *
 * This file re-exports the new hook for backwards compatibility.
 * The new hook includes:
 * - Better fail-safe mechanisms (only clears on confirmed success)
 * - React Query cache invalidation
 * - Retry logic with exponential backoff
 * - Better TypeScript types
 */

export {
  useGuestMigration as useMigrateGuestData,
  useMigrationPrompt,
  type MigrationStatus,
  type MigrationResult,
  type UseGuestMigrationOptions as UseMigrateGuestDataOptions,
} from './useGuestMigration';

// Re-export the main hook as default for convenience
export { useGuestMigration } from './useGuestMigration';
