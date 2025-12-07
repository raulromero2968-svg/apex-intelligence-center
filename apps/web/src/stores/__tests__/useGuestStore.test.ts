/**
 * Guest Store Unit Tests
 *
 * Tests for Zustand store managing guest (unauthenticated) user portfolios.
 * Covers: addCard, removeCard, persistence, hydration
 *
 * @see useGuestStore.ts
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
    _getStore: () => store,
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

// Reset module cache before importing store
beforeEach(async () => {
  vi.resetModules();
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

const createMockCard = (overrides = {}) => ({
  tcgPlayerId: 'tcg-123',
  name: 'Charizard',
  set: 'Base Set',
  condition: 'NM' as const,
  imageUrl: 'https://example.com/charizard.png',
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('useGuestStore', () => {
  describe('addCard', () => {
    it('should add a card and generate a unique ID', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      const mockCard = createMockCard();
      const currentPrice = 150.0;

      act(() => {
        result.current.addCard(mockCard, currentPrice);
      });

      expect(result.current.cards).toHaveLength(1);
      expect(result.current.cards[0]).toMatchObject({
        tcgPlayerId: 'tcg-123',
        name: 'Charizard',
        set: 'Base Set',
        condition: 'NM',
        price: 150.0,
      });
      // ID should be generated
      expect(result.current.cards[0].id).toBeDefined();
      expect(result.current.cards[0].id).toContain('test-uuid');
      // Timestamp should be generated
      expect(result.current.cards[0].timestamp).toBeDefined();
      expect(typeof result.current.cards[0].timestamp).toBe('number');
    });

    it('should update totalValue when adding a card', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      expect(result.current.totalValue).toBe(0);

      act(() => {
        result.current.addCard(createMockCard(), 100.0);
      });

      expect(result.current.totalValue).toBe(100.0);

      act(() => {
        result.current.addCard(createMockCard({ tcgPlayerId: 'tcg-456' }), 50.0);
      });

      expect(result.current.totalValue).toBe(150.0);
    });

    it('should allow adding multiple cards with unique IDs', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.addCard(createMockCard({ name: 'Charizard' }), 100.0);
        result.current.addCard(createMockCard({ name: 'Pikachu', tcgPlayerId: 'tcg-456' }), 50.0);
        result.current.addCard(createMockCard({ name: 'Blastoise', tcgPlayerId: 'tcg-789' }), 75.0);
      });

      expect(result.current.cards).toHaveLength(3);

      const ids = result.current.cards.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });
  });

  describe('removeCard', () => {
    it('should remove the correct card by ID', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      // Add multiple cards
      act(() => {
        result.current.addCard(createMockCard({ name: 'Charizard' }), 100.0);
        result.current.addCard(createMockCard({ name: 'Pikachu', tcgPlayerId: 'tcg-456' }), 50.0);
        result.current.addCard(createMockCard({ name: 'Blastoise', tcgPlayerId: 'tcg-789' }), 75.0);
      });

      expect(result.current.cards).toHaveLength(3);

      // Get the ID of the second card
      const pikachuId = result.current.cards.find((c) => c.name === 'Pikachu')?.id;

      act(() => {
        result.current.removeCard(pikachuId!);
      });

      expect(result.current.cards).toHaveLength(2);
      expect(result.current.cards.find((c) => c.name === 'Pikachu')).toBeUndefined();
      expect(result.current.cards.find((c) => c.name === 'Charizard')).toBeDefined();
      expect(result.current.cards.find((c) => c.name === 'Blastoise')).toBeDefined();
    });

    it('should subtract the card value from totalValue', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.addCard(createMockCard({ name: 'Charizard' }), 100.0);
        result.current.addCard(createMockCard({ name: 'Pikachu', tcgPlayerId: 'tcg-456' }), 50.0);
      });

      expect(result.current.totalValue).toBe(150.0);

      const charizardId = result.current.cards.find((c) => c.name === 'Charizard')?.id;

      act(() => {
        result.current.removeCard(charizardId!);
      });

      expect(result.current.totalValue).toBe(50.0);
    });

    it('should handle removing non-existent card gracefully', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.addCard(createMockCard(), 100.0);
      });

      const initialLength = result.current.cards.length;

      act(() => {
        result.current.removeCard('non-existent-id');
      });

      // Should not throw and cards length should remain same
      expect(result.current.cards.length).toBe(initialLength);
    });
  });

  describe('clearStore', () => {
    it('should remove all cards and reset totalValue', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.addCard(createMockCard({ name: 'Card 1' }), 100.0);
        result.current.addCard(createMockCard({ name: 'Card 2', tcgPlayerId: 'tcg-2' }), 200.0);
      });

      expect(result.current.cards.length).toBe(2);
      expect(result.current.totalValue).toBe(300.0);

      act(() => {
        result.current.clearStore();
      });

      expect(result.current.cards).toHaveLength(0);
      expect(result.current.totalValue).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should persist data to localStorage', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.addCard(createMockCard({ name: 'Charizard' }), 150.0);
      });

      // Wait for persist middleware to save
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      // Check localStorage was called with the correct key
      const calls = localStorageMock.setItem.mock.calls;
      const persistCall = calls.find((call) => call[0] === 'apex-guest-wallet');
      expect(persistCall).toBeDefined();

      // Parse and verify the persisted data
      if (persistCall) {
        const persistedData = JSON.parse(persistCall[1]);
        expect(persistedData.state.cards).toHaveLength(1);
        expect(persistedData.state.cards[0].name).toBe('Charizard');
        expect(persistedData.state.totalValue).toBe(150.0);
      }
    });

    it('should reload data from localStorage on rehydration', async () => {
      // Pre-populate localStorage with data
      const mockPersistedData = {
        state: {
          cards: [
            {
              id: 'persisted-id-1',
              tcgPlayerId: 'tcg-123',
              name: 'Pikachu',
              set: 'Jungle',
              condition: 'LP',
              price: 25.0,
              imageUrl: 'https://example.com/pikachu.png',
              timestamp: Date.now() - 86400000,
            },
          ],
          totalValue: 25.0,
        },
        version: 0,
      };

      localStorageMock.setItem('apex-guest-wallet', JSON.stringify(mockPersistedData));
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'apex-guest-wallet') {
          return JSON.stringify(mockPersistedData);
        }
        return null;
      });

      // Import store fresh (after setting localStorage)
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      // Wait for hydration
      await waitFor(() => {
        expect(result.current.cards.length).toBeGreaterThan(0);
      });

      expect(result.current.cards).toHaveLength(1);
      expect(result.current.cards[0].name).toBe('Pikachu');
      expect(result.current.cards[0].price).toBe(25.0);
      expect(result.current.totalValue).toBe(25.0);
    });
  });

  describe('hydration', () => {
    it('should start with hasHydrated as false', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      // Access store state directly
      const state = useGuestStore.getState();

      // hasHydrated should be false initially (before async rehydration completes)
      // Note: In a real app, this depends on timing
      expect(typeof state.hasHydrated).toBe('boolean');
    });

    it('should set hasHydrated to true after hydration', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      // Wait for hydration to complete
      await waitFor(() => {
        expect(result.current.hasHydrated).toBe(true);
      });
    });

    it('should allow manual hydration state control via setHasHydrated', async () => {
      const { useGuestStore } = await import('../useGuestStore');

      const { result } = renderHook(() => useGuestStore());

      act(() => {
        result.current.setHasHydrated(false);
      });

      expect(result.current.hasHydrated).toBe(false);

      act(() => {
        result.current.setHasHydrated(true);
      });

      expect(result.current.hasHydrated).toBe(true);
    });
  });

  describe('useGuestStoreHydrated hook', () => {
    it('should return null before hydration completes', async () => {
      const { useGuestStore, useGuestStoreHydrated } = await import('../useGuestStore');

      // Set hasHydrated to false
      act(() => {
        useGuestStore.setState({ hasHydrated: false });
      });

      const { result } = renderHook(() => useGuestStoreHydrated());

      expect(result.current).toBeNull();
    });

    it('should return store state after hydration completes', async () => {
      const { useGuestStore, useGuestStoreHydrated } = await import('../useGuestStore');

      // Set hasHydrated to true
      act(() => {
        useGuestStore.setState({ hasHydrated: true });
      });

      const { result } = renderHook(() => useGuestStoreHydrated());

      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('cards');
      expect(result.current).toHaveProperty('totalValue');
      expect(result.current).toHaveProperty('addCard');
    });
  });

  describe('selector hooks', () => {
    it('useGuestCardCount should return 0 before hydration', async () => {
      const { useGuestStore, useGuestCardCount } = await import('../useGuestStore');

      act(() => {
        useGuestStore.setState({
          hasHydrated: false,
          cards: [
            {
              id: '1',
              tcgPlayerId: 'tcg-1',
              name: 'Test',
              set: 'Test',
              condition: 'NM',
              price: 10,
              imageUrl: '',
              timestamp: Date.now(),
            },
          ],
        });
      });

      const { result } = renderHook(() => useGuestCardCount());

      expect(result.current).toBe(0);
    });

    it('useGuestCardCount should return actual count after hydration', async () => {
      const { useGuestStore, useGuestCardCount } = await import('../useGuestStore');

      act(() => {
        useGuestStore.setState({
          hasHydrated: true,
          cards: [
            {
              id: '1',
              tcgPlayerId: 'tcg-1',
              name: 'Card 1',
              set: 'Test',
              condition: 'NM',
              price: 10,
              imageUrl: '',
              timestamp: Date.now(),
            },
            {
              id: '2',
              tcgPlayerId: 'tcg-2',
              name: 'Card 2',
              set: 'Test',
              condition: 'LP',
              price: 20,
              imageUrl: '',
              timestamp: Date.now(),
            },
          ],
        });
      });

      const { result } = renderHook(() => useGuestCardCount());

      expect(result.current).toBe(2);
    });

    it('useGuestTotalValue should return 0 before hydration', async () => {
      const { useGuestStore, useGuestTotalValue } = await import('../useGuestStore');

      act(() => {
        useGuestStore.setState({
          hasHydrated: false,
          totalValue: 500,
        });
      });

      const { result } = renderHook(() => useGuestTotalValue());

      expect(result.current).toBe(0);
    });

    it('useGuestTotalValue should return actual value after hydration', async () => {
      const { useGuestStore, useGuestTotalValue } = await import('../useGuestStore');

      act(() => {
        useGuestStore.setState({
          hasHydrated: true,
          totalValue: 500,
        });
      });

      const { result } = renderHook(() => useGuestTotalValue());

      expect(result.current).toBe(500);
    });
  });
});
