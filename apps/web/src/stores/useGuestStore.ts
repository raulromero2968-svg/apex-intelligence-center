'use client';

/**
 * Guest Wallet Store
 *
 * Zustand store for managing guest (unauthenticated) user card collections.
 * Implements the "Endowment Effect" UX pattern by allowing users to build
 * a portfolio before signing up.
 *
 * Key Features:
 * - Persists to localStorage via Zustand persist middleware
 * - Hydration-safe for Next.js SSR (prevents hydration mismatch errors)
 * - Automatic totalValue calculation on card add/remove
 * - Extended methods for price updates and bulk operations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type CardCondition = 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor' | 'NM' | 'LP' | 'MP' | 'HP';

export interface GuestCardItem {
  id: string;
  tcgPlayerId: string;
  cardName: string;
  set: string;
  condition: CardCondition | string;
  quantity: number;
  currentPrice: number;
  purchasePrice?: number;
  imageUrl?: string;
  addedAt: number;
}

// Alias for backward compatibility
export type CardItem = GuestCardItem;

interface GuestStoreState {
  cards: GuestCardItem[];
  totalValue: number;
  hasHydrated: boolean;
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
  setHasHydrated: (state: boolean) => void;
}

type GuestStore = GuestStoreState & GuestStoreActions;

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'apex-guest-wallet';
const STORE_VERSION = 1;

// ============================================================================
// Initial State
// ============================================================================

const initialState: GuestStoreState = {
  cards: [],
  totalValue: 0,
  hasHydrated: false,
  version: STORE_VERSION,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate total value from cards array
 */
function calculateTotalValue(cards: GuestCardItem[]): number {
  return cards.reduce((sum, card) => sum + card.currentPrice * card.quantity, 0);
}

/**
 * Generate a UUID for card identification
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `guest_${crypto.randomUUID()}`;
  }
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Store
// ============================================================================

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCard: (cardData) => {
        const newCard: GuestCardItem = {
          ...cardData,
          id: generateId(),
          addedAt: Date.now(),
        };

        set((state) => {
          // Check for existing card with same tcgPlayerId and condition
          const existingIndex = state.cards.findIndex(
            (c) => c.tcgPlayerId === cardData.tcgPlayerId && c.condition === cardData.condition
          );

          let updatedCards: GuestCardItem[];

          if (existingIndex >= 0) {
            // Update existing card quantity
            updatedCards = [...state.cards];
            updatedCards[existingIndex] = {
              ...updatedCards[existingIndex],
              quantity: updatedCards[existingIndex].quantity + cardData.quantity,
              currentPrice: cardData.currentPrice,
            };
          } else {
            // Add new card
            updatedCards = [...state.cards, newCard];
          }

          return {
            cards: updatedCards,
            totalValue: calculateTotalValue(updatedCards),
          };
        });
      },

      updateCard: (id, updates) => {
        set((state) => {
          const updatedCards = state.cards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          );
          return {
            cards: updatedCards,
            totalValue: calculateTotalValue(updatedCards),
          };
        });
      },

      removeCard: (id) => {
        set((state) => {
          const updatedCards = state.cards.filter((card) => card.id !== id);
          return {
            cards: updatedCards,
            totalValue: calculateTotalValue(updatedCards),
          };
        });
      },

      updateCardPrice: (tcgPlayerId, newPrice) => {
        set((state) => {
          const updatedCards = state.cards.map((card) =>
            card.tcgPlayerId === tcgPlayerId ? { ...card, currentPrice: newPrice } : card
          );
          return {
            cards: updatedCards,
            totalValue: calculateTotalValue(updatedCards),
          };
        });
      },

      bulkUpdatePrices: (priceMap) => {
        set((state) => {
          const updatedCards = state.cards.map((card) => {
            const newPrice = priceMap[card.tcgPlayerId];
            return newPrice !== undefined ? { ...card, currentPrice: newPrice } : card;
          });
          return {
            cards: updatedCards,
            totalValue: calculateTotalValue(updatedCards),
          };
        });
      },

      clearStore: () => {
        set({
          cards: [],
          totalValue: 0,
        });
      },

      hasCards: () => {
        return get().cards.length > 0;
      },

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
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
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating guest store:', error);
          }
          if (state) {
            state.setHasHydrated(true);
          }
        };
      },
    }
  )
);

// ============================================================================
// Hydration-Safe Hooks
// ============================================================================

/**
 * Hook that returns guest store state only after hydration is complete.
 * Returns object with isHydrated flag for SSR-safe rendering.
 */
export function useGuestStoreHydrated() {
  const store = useGuestStore();

  return {
    ...store,
    isHydrated: store.hasHydrated,
    cards: store.hasHydrated ? store.cards : [],
    totalValue: store.hasHydrated ? store.totalValue : 0,
  };
}

/**
 * Hook to check if the store has been hydrated.
 */
export function useGuestStoreHasHydrated(): boolean {
  return useGuestStore((state) => state.hasHydrated);
}

/**
 * Selector for cards array
 */
export function useGuestCards(): GuestCardItem[] {
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const cards = useGuestStore((state) => state.cards);
  return hasHydrated ? cards : [];
}

/**
 * Selector for card count - useful for nav badges
 */
export function useGuestCardCount(): number {
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const cardCount = useGuestStore((state) => state.cards.length);
  return hasHydrated ? cardCount : 0;
}

/**
 * Selector for total portfolio value
 */
export function useGuestTotalValue(): number {
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const totalValue = useGuestStore((state) => state.totalValue);
  return hasHydrated ? totalValue : 0;
}
