'use client';

/**
 * Guest Portfolio Store
 * Zustand store with localStorage persistence for unauthenticated users
 * Implements the "Endowment Effect" UX pattern - build value before commitment
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GuestStore,
  GuestStoreState,
  GuestCardItem,
  GuestPortfolioStats,
} from '@/types/guest-portfolio';

/**
 * Storage key for localStorage persistence
 */
const STORAGE_KEY = 'apex-guest-wallet';

/**
 * Current store version for migration compatibility
 */
const STORE_VERSION = 1;

/**
 * Generate a temporary UUID for guest cards
 */
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate total portfolio value from cards array
 */
function calculateTotalValue(cards: GuestCardItem[]): number {
  return cards.reduce((total, card) => {
    return total + (card.currentPrice * card.quantity);
  }, 0);
}

/**
 * Initial state for the guest store
 */
const initialState: GuestStoreState = {
  cards: [],
  totalValue: 0,
  version: STORE_VERSION,
};

/**
 * Guest Portfolio Store
 *
 * Usage:
 * ```tsx
 * const { cards, totalValue, addCard, removeCard } = useGuestStore();
 * ```
 *
 * The store automatically persists to localStorage and handles:
 * - Next.js SSR/hydration compatibility
 * - Automatic total value calculation
 * - Price updates for live market data
 */
export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      addCard: (cardData) => {
        const newCard: GuestCardItem = {
          ...cardData,
          id: generateGuestId(),
          addedAt: Date.now(),
        };

        set((state) => {
          // Check if card already exists (by tcgPlayerId + condition)
          const existingIndex = state.cards.findIndex(
            (c) => c.tcgPlayerId === cardData.tcgPlayerId && c.condition === cardData.condition
          );

          let newCards: GuestCardItem[];

          if (existingIndex >= 0) {
            // Update quantity if card exists
            newCards = [...state.cards];
            newCards[existingIndex] = {
              ...newCards[existingIndex],
              quantity: newCards[existingIndex].quantity + cardData.quantity,
              currentPrice: cardData.currentPrice, // Update to latest price
            };
          } else {
            // Add new card
            newCards = [...state.cards, newCard];
          }

          return {
            cards: newCards,
            totalValue: calculateTotalValue(newCards),
          };
        });
      },

      updateCard: (id, updates) => {
        set((state) => {
          const newCards = state.cards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          );

          return {
            cards: newCards,
            totalValue: calculateTotalValue(newCards),
          };
        });
      },

      removeCard: (id) => {
        set((state) => {
          const newCards = state.cards.filter((card) => card.id !== id);
          return {
            cards: newCards,
            totalValue: calculateTotalValue(newCards),
          };
        });
      },

      updateCardPrice: (tcgPlayerId, newPrice) => {
        set((state) => {
          const newCards = state.cards.map((card) =>
            card.tcgPlayerId === tcgPlayerId
              ? { ...card, currentPrice: newPrice }
              : card
          );

          return {
            cards: newCards,
            totalValue: calculateTotalValue(newCards),
          };
        });
      },

      bulkUpdatePrices: (priceMap) => {
        set((state) => {
          const newCards = state.cards.map((card) => {
            const newPrice = priceMap[card.tcgPlayerId];
            return newPrice !== undefined
              ? { ...card, currentPrice: newPrice }
              : card;
          });

          return {
            cards: newCards,
            totalValue: calculateTotalValue(newCards),
          };
        });
      },

      clearStore: () => {
        set(initialState);
      },

      getStats: (): GuestPortfolioStats => {
        const { cards } = get();
        return {
          totalCards: cards.length,
          totalQuantity: cards.reduce((sum, card) => sum + card.quantity, 0),
          totalValue: calculateTotalValue(cards),
          lastUpdated: cards.length > 0
            ? Math.max(...cards.map((c) => c.addedAt))
            : 0,
        };
      },

      hasCards: () => {
        return get().cards.length > 0;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      // Handle version migrations if needed in the future
      migrate: (persistedState, version) => {
        if (version === STORE_VERSION) {
          return persistedState as GuestStoreState;
        }
        // Future migrations can be handled here
        return persistedState as GuestStoreState;
      },
      // Only persist these fields to localStorage
      partialize: (state) => ({
        cards: state.cards,
        totalValue: state.totalValue,
        version: state.version,
      }),
    }
  )
);

/**
 * Hook to safely access store on client-side only
 * Prevents hydration mismatches in Next.js SSR
 */
export function useGuestStoreHydrated() {
  const store = useGuestStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    ...store,
    isHydrated,
    // Return empty/default values during SSR
    cards: isHydrated ? store.cards : [],
    totalValue: isHydrated ? store.totalValue : 0,
  };
}

// Import React hooks at the top level for the hydration hook
import { useState, useEffect } from 'react';

/**
 * Selector hooks for optimized re-renders
 */
export const useGuestCards = () => useGuestStore((state) => state.cards);
export const useGuestTotalValue = () => useGuestStore((state) => state.totalValue);
export const useGuestCardCount = () => useGuestStore((state) => state.cards.length);
