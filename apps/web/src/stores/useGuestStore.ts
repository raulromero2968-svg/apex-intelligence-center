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
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP';

export interface CardItem {
  id: string;
  tcgPlayerId: string;
  name: string;
  set: string;
  condition: CardCondition;
  price: number;
  imageUrl: string;
  timestamp: number;
}

interface GuestState {
  cards: CardItem[];
  totalValue: number;
  hasHydrated: boolean;
}

interface GuestActions {
  addCard: (
    card: Omit<CardItem, 'id' | 'timestamp' | 'price'>,
    currentPrice: number
  ) => void;
  removeCard: (id: string) => void;
  clearStore: () => void;
  setHasHydrated: (state: boolean) => void;
}

type GuestStore = GuestState & GuestActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: GuestState = {
  cards: [],
  totalValue: 0,
  hasHydrated: false,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate total value from cards array
 */
function calculateTotalValue(cards: CardItem[]): number {
  return cards.reduce((sum, card) => sum + card.price, 0);
}

/**
 * Generate a UUID for card identification
 * Falls back to a timestamp-based ID if crypto.randomUUID is unavailable
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Store
// ============================================================================

export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      ...initialState,

      addCard: (cardData, currentPrice) => {
        const newCard: CardItem = {
          ...cardData,
          id: generateId(),
          price: currentPrice,
          timestamp: Date.now(),
        };

        set((state) => {
          const updatedCards = [...state.cards, newCard];
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

      clearStore: () => {
        set({
          cards: [],
          totalValue: 0,
        });
      },

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'apex-guest-wallet',
      storage: createJSONStorage(() => localStorage),
      // Only persist cards - totalValue is derived, hasHydrated is runtime-only
      partialize: (state) => ({
        cards: state.cards,
        totalValue: state.totalValue,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating guest store:', error);
          }
          // Mark hydration as complete
          if (state) {
            state.setHasHydrated(true);
          }
        };
      },
    }
  )
);

// ============================================================================
// Hydration-Safe Hook
// ============================================================================

/**
 * Hook that returns guest store state only after hydration is complete.
 * Use this in UI components to prevent hydration mismatch errors.
 *
 * @returns The guest store state, or null if not yet hydrated
 *
 * @example
 * ```tsx
 * function GuestWallet() {
 *   const guestState = useGuestStoreHydrated();
 *
 *   if (!guestState) {
 *     return <LoadingSkeleton />;
 *   }
 *
 *   return <CardList cards={guestState.cards} />;
 * }
 * ```
 */
export function useGuestStoreHydrated(): (GuestState & GuestActions) | null {
  const store = useGuestStore();

  if (!store.hasHydrated) {
    return null;
  }

  return store;
}

/**
 * Hook to check if the store has been hydrated.
 * Useful for conditional rendering without accessing full store state.
 */
export function useGuestStoreHasHydrated(): boolean {
  return useGuestStore((state) => state.hasHydrated);
}

/**
 * Selector for card count - useful for nav badges
 */
export function useGuestCardCount(): number {
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const cardCount = useGuestStore((state) => state.cards.length);

  // Return 0 during SSR/before hydration to prevent mismatch
  if (!hasHydrated) {
    return 0;
  }

  return cardCount;
}

/**
 * Selector for total portfolio value
 */
export function useGuestTotalValue(): number {
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const totalValue = useGuestStore((state) => state.totalValue);

  // Return 0 during SSR/before hydration to prevent mismatch
  if (!hasHydrated) {
    return 0;
  }

  return totalValue;
}
