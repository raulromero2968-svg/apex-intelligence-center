'use client';

/**
 * Guest Store Bridge for apps/web
 *
 * This provides a type-safe interface to the guest store
 * without requiring complex cross-monorepo type dependencies.
 *
 * The actual store persists to localStorage under 'apex-guest-wallet'
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

// ============================================================================
// TYPES (Self-contained for apps/web consumption)
// ============================================================================

export interface GuestCardItem {
  id: string;
  tcgPlayerId: string;
  cardName: string;
  set: string;
  condition: string;
  quantity: number;
  currentPrice: number;
  purchasePrice?: number;
  imageUrl?: string;
  addedAt: number;
}

interface GuestStoreState {
  cards: GuestCardItem[];
  totalValue: number;
  version: number;
}

interface GuestStoreActions {
  addCard: (card: Omit<GuestCardItem, 'id' | 'addedAt'>) => void;
  updateCard: (id: string, updates: Partial<Omit<GuestCardItem, 'id' | 'addedAt'>>) => void;
  removeCard: (id: string) => void;
  updateCardPrice: (tcgPlayerId: string, newPrice: number) => void;
  bulkUpdatePrices: (priceMap: Record<string, number>) => void;
  clearStore: () => void;
  hasCards: () => boolean;
}

type GuestStore = GuestStoreState & GuestStoreActions;

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

const STORAGE_KEY = 'apex-guest-wallet';
const STORE_VERSION = 1;

function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function calculateTotalValue(cards: GuestCardItem[]): number {
  return cards.reduce((total, card) => total + card.currentPrice * card.quantity, 0);
}

const initialState: GuestStoreState = {
  cards: [],
  totalValue: 0,
  version: STORE_VERSION,
};

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCard: (cardData) => {
        const newCard: GuestCardItem = {
          ...cardData,
          id: generateGuestId(),
          addedAt: Date.now(),
        };

        set((state) => {
          const existingIndex = state.cards.findIndex(
            (c) => c.tcgPlayerId === cardData.tcgPlayerId && c.condition === cardData.condition
          );

          let newCards: GuestCardItem[];

          if (existingIndex >= 0) {
            newCards = [...state.cards];
            newCards[existingIndex] = {
              ...newCards[existingIndex],
              quantity: newCards[existingIndex].quantity + cardData.quantity,
              currentPrice: cardData.currentPrice,
            };
          } else {
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
            card.tcgPlayerId === tcgPlayerId ? { ...card, currentPrice: newPrice } : card
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
            return newPrice !== undefined ? { ...card, currentPrice: newPrice } : card;
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

      hasCards: () => {
        return get().cards.length > 0;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      partialize: (state) => ({
        cards: state.cards,
        totalValue: state.totalValue,
        version: state.version,
      }),
    }
  )
);

/**
 * SSR-safe hook that prevents hydration mismatches
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
    cards: isHydrated ? store.cards : [],
    totalValue: isHydrated ? store.totalValue : 0,
  };
}

/**
 * Selector hooks for optimized re-renders
 */
export const useGuestCards = () => useGuestStore((state) => state.cards);
export const useGuestTotalValue = () => useGuestStore((state) => state.totalValue);
export const useGuestCardCount = () => useGuestStore((state) => state.cards.length);
