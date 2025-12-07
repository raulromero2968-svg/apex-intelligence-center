/**
 * Guest Migration Hook Integration Tests
 *
 * Tests the migration flow from guest wallet to authenticated account.
 * Covers: API success, API failure (data safety), and edge cases.
 *
 * @see useGuestMigration.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

// ============================================================================
// Mocks
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => `test-uuid-${Date.now()}-${Math.random()}`),
  },
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Reset modules and mocks before each test
beforeEach(() => {
  vi.resetModules();
  localStorageMock.clear();
  vi.clearAllMocks();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

const createMockCard = (overrides = {}) => ({
  id: `test-id-${Date.now()}`,
  tcgPlayerId: 'tcg-123',
  name: 'Charizard',
  set: 'Base Set',
  condition: 'NM' as const,
  price: 150.0,
  imageUrl: 'https://example.com/charizard.png',
  timestamp: Date.now(),
  ...overrides,
});

/**
 * Setup guest store with test data
 */
async function setupGuestStoreWithCards(cards: ReturnType<typeof createMockCard>[]) {
  const { useGuestStore } = await import('@/stores/useGuestStore');

  // Calculate total value
  const totalValue = cards.reduce((sum, card) => sum + card.price, 0);

  // Set store state directly
  act(() => {
    useGuestStore.setState({
      cards,
      totalValue,
      hasHydrated: true,
    });
  });

  return { useGuestStore };
}

// ============================================================================
// Tests
// ============================================================================

describe('useGuestMigration', () => {
  describe('Scenario A: Successful Migration', () => {
    it('should call API with guest items and clear store on success', async () => {
      // Setup: Guest has items in their wallet
      const guestCards = [
        createMockCard({ name: 'Charizard', tcgPlayerId: 'tcg-1', price: 150 }),
        createMockCard({ name: 'Pikachu', tcgPlayerId: 'tcg-2', price: 50 }),
      ];

      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          migratedCount: 2,
          failedCount: 0,
        }),
      });

      // Import hook after store is setup
      const { useGuestMigration } = await import('../useGuestMigration');

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useGuestMigration({
          onSuccess,
          onError,
        })
      );

      // Verify initial state
      expect(result.current.hasPendingItems).toBe(true);
      expect(result.current.pendingItemCount).toBe(2);
      expect(result.current.pendingTotalValue).toBe(200);

      // Execute migration
      let migrationSuccess: boolean;
      await act(async () => {
        migrationSuccess = await result.current.migrateGuestItems();
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/portfolio/batch',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      // Verify payload structure
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.items).toHaveLength(2);
      expect(callBody.items[0]).toMatchObject({
        tcgPlayerId: 'tcg-1',
        name: 'Charizard',
      });

      // Verify migration succeeded
      expect(migrationSuccess!).toBe(true);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.result?.success).toBe(true);
      expect(result.current.result?.migratedCount).toBe(2);
      expect(result.current.error).toBeNull();

      // Verify callbacks
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          migratedCount: 2,
        })
      );
      expect(onError).not.toHaveBeenCalled();

      // CRITICAL: Verify store was cleared after successful migration
      const storeState = useGuestStore.getState();
      expect(storeState.cards).toHaveLength(0);
      expect(storeState.totalValue).toBe(0);
    });

    it('should handle empty guest wallet gracefully', async () => {
      // Setup: No guest items
      await setupGuestStoreWithCards([]);

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      expect(result.current.hasPendingItems).toBe(false);
      expect(result.current.pendingItemCount).toBe(0);

      let migrationSuccess: boolean;
      await act(async () => {
        migrationSuccess = await result.current.migrateGuestItems();
      });

      // Should succeed without calling API
      expect(migrationSuccess!).toBe(true);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.result?.migratedCount).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Scenario B: API Failure (Data Safety Check)', () => {
    it('should NOT clear store when API returns 500 error', async () => {
      // Setup: Guest has items
      const guestCards = [
        createMockCard({ name: 'Charizard', tcgPlayerId: 'tcg-1', price: 150 }),
        createMockCard({ name: 'Pikachu', tcgPlayerId: 'tcg-2', price: 50 }),
      ];

      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // Mock API 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
        }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useGuestMigration({
          onSuccess,
          onError,
        })
      );

      // Execute migration
      let migrationSuccess: boolean;
      await act(async () => {
        migrationSuccess = await result.current.migrateGuestItems();
      });

      // Verify migration failed
      expect(migrationSuccess!).toBe(false);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBe('Internal server error');

      // Verify callbacks
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('Internal server error');
      expect(onSuccess).not.toHaveBeenCalled();

      // CRITICAL: Verify store was NOT cleared - user's data is preserved
      const storeState = useGuestStore.getState();
      expect(storeState.cards).toHaveLength(2);
      expect(storeState.totalValue).toBe(200);
      expect(storeState.cards[0].name).toBe('Charizard');
      expect(storeState.cards[1].name).toBe('Pikachu');
    });

    it('should NOT clear store on network error', async () => {
      // Setup: Guest has items
      const guestCards = [
        createMockCard({ name: 'Blastoise', tcgPlayerId: 'tcg-3', price: 100 }),
      ];

      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // Mock network failure
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const { useGuestMigration } = await import('../useGuestMigration');

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useGuestMigration({
          onError,
        })
      );

      let migrationSuccess: boolean;
      await act(async () => {
        migrationSuccess = await result.current.migrateGuestItems();
      });

      // Verify migration failed
      expect(migrationSuccess!).toBe(false);
      expect(result.current.error).toBe('Network request failed');

      // CRITICAL: Verify store was NOT cleared
      const storeState = useGuestStore.getState();
      expect(storeState.cards).toHaveLength(1);
      expect(storeState.cards[0].name).toBe('Blastoise');
    });

    it('should NOT clear store on 401 unauthorized error', async () => {
      const guestCards = [
        createMockCard({ name: 'Venusaur', tcgPlayerId: 'tcg-4', price: 80 }),
      ];

      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // Mock 401 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized - Please log in',
        }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      // Verify store preserved
      const storeState = useGuestStore.getState();
      expect(storeState.cards).toHaveLength(1);
      expect(result.current.error).toBe('Unauthorized - Please log in');
    });

    it('should NOT clear store on 400 bad request error', async () => {
      const guestCards = [
        createMockCard({ name: 'Mewtwo', tcgPlayerId: 'tcg-5', price: 200 }),
      ];

      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // Mock 400 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid card data provided',
        }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      // Verify store preserved
      const storeState = useGuestStore.getState();
      expect(storeState.cards).toHaveLength(1);
    });
  });

  describe('State Management', () => {
    it('should track loading state during migration', async () => {
      const guestCards = [createMockCard()];
      await setupGuestStoreWithCards(guestCards);

      // Create a delayed response to observe loading state
      let resolveResponse: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
      );

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      expect(result.current.isLoading).toBe(false);

      // Start migration (don't await)
      let migrationPromise: Promise<boolean>;
      act(() => {
        migrationPromise = result.current.migrateGuestItems();
      });

      // Should now be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the API call
      await act(async () => {
        resolveResponse!({
          ok: true,
          json: async () => ({ success: true, migratedCount: 1 }),
        });
        await migrationPromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it('should allow resetting migration state for retry', async () => {
      const guestCards = [createMockCard()];
      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // First attempt fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.isComplete).toBe(true);

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
      expect(result.current.result).toBeNull();

      // Retry - this time success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, migratedCount: 1 }),
      });

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      expect(result.current.result?.success).toBe(true);
      expect(useGuestStore.getState().cards).toHaveLength(0);
    });
  });

  describe('Auto-Migration', () => {
    it('should auto-migrate when enabled and items exist', async () => {
      const guestCards = [createMockCard()];
      await setupGuestStoreWithCards(guestCards);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, migratedCount: 1 }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() =>
        useGuestMigration({
          autoMigrate: true,
        })
      );

      // Wait for auto-migration to complete
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.result?.success).toBe(true);
    });

    it('should not auto-migrate when disabled', async () => {
      const guestCards = [createMockCard()];
      await setupGuestStoreWithCards(guestCards);

      const { useGuestMigration } = await import('../useGuestMigration');

      renderHook(() =>
        useGuestMigration({
          autoMigrate: false,
        })
      );

      // Wait a bit to ensure no auto-migration
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Custom API Endpoint', () => {
    it('should use custom API endpoint when provided', async () => {
      const guestCards = [createMockCard()];
      await setupGuestStoreWithCards(guestCards);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, migratedCount: 1 }),
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() =>
        useGuestMigration({
          apiEndpoint: '/api/custom/migrate-portfolio',
        })
      );

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/custom/migrate-portfolio',
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed API response gracefully', async () => {
      const guestCards = [createMockCard()];
      const { useGuestStore } = await setupGuestStoreWithCards(guestCards);

      // API returns ok but malformed JSON
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      await act(async () => {
        await result.current.migrateGuestItems();
      });

      // Should handle gracefully and preserve data
      expect(result.current.error).toContain('500');
      expect(useGuestStore.getState().cards).toHaveLength(1);
    });

    it('should skip migration if store not hydrated', async () => {
      const { useGuestStore } = await import('@/stores/useGuestStore');

      // Set store with cards but NOT hydrated
      act(() => {
        useGuestStore.setState({
          cards: [createMockCard()],
          totalValue: 150,
          hasHydrated: false, // Not hydrated!
        });
      });

      const { useGuestMigration } = await import('../useGuestMigration');

      const { result } = renderHook(() => useGuestMigration());

      let migrationSuccess: boolean;
      await act(async () => {
        migrationSuccess = await result.current.migrateGuestItems();
      });

      // Should return false without calling API
      expect(migrationSuccess!).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
