/**
 * Guest Portfolio Types
 * TypeScript definitions for guest (unauthenticated) portfolio management
 * Aligned with database schema for seamless migration on sign-up
 */

import type { PortfolioItem } from '@/lib/database/schema';

/**
 * Card condition mapping for guest cards
 * Matches the database schema's condition enum
 */
export type CardCondition = PortfolioItem['condition'];

/**
 * Simplified card item for guest storage
 * Contains essential fields that map 1:1 to PortfolioItem on migration
 */
export interface GuestCardItem {
  /** Temporary UUID for guest, becomes DB ID after migration */
  id: string;
  /** TCGPlayer product ID for price lookups */
  tcgPlayerId: string;
  /** Card name for display */
  cardName: string;
  /** Set/expansion name */
  set: string;
  /** Physical condition of the card */
  condition: CardCondition;
  /** Quantity owned */
  quantity: number;
  /** Current market price (USD) */
  currentPrice: number;
  /** Optional purchase price for P&L tracking */
  purchasePrice?: number;
  /** Card image URL */
  imageUrl?: string;
  /** Timestamp when card was added to guest wallet */
  addedAt: number;
}

/**
 * Guest portfolio statistics
 */
export interface GuestPortfolioStats {
  /** Total number of unique cards */
  totalCards: number;
  /** Total quantity across all cards */
  totalQuantity: number;
  /** Sum of (currentPrice * quantity) for all cards */
  totalValue: number;
  /** Last time the portfolio was modified */
  lastUpdated: number;
}

/**
 * Guest Store state interface
 */
export interface GuestStoreState {
  /** Array of cards in guest wallet */
  cards: GuestCardItem[];
  /** Computed total portfolio value */
  totalValue: number;
  /** Store version for migration compatibility */
  version: number;
}

/**
 * Guest Store actions interface
 */
export interface GuestStoreActions {
  /** Add a card to the guest wallet */
  addCard: (card: Omit<GuestCardItem, 'id' | 'addedAt'>) => void;
  /** Update an existing card's details */
  updateCard: (id: string, updates: Partial<Omit<GuestCardItem, 'id' | 'addedAt'>>) => void;
  /** Remove a card from the guest wallet */
  removeCard: (id: string) => void;
  /** Update the price of a specific card */
  updateCardPrice: (tcgPlayerId: string, newPrice: number) => void;
  /** Bulk update prices for multiple cards */
  bulkUpdatePrices: (priceMap: Record<string, number>) => void;
  /** Clear the entire guest store (used after successful migration) */
  clearStore: () => void;
  /** Get computed statistics */
  getStats: () => GuestPortfolioStats;
  /** Check if store has any cards */
  hasCards: () => boolean;
}

/**
 * Combined Guest Store type
 */
export type GuestStore = GuestStoreState & GuestStoreActions;

/**
 * Payload for creating a portfolio item during migration
 * Maps GuestCardItem to the API request format
 */
export interface MigrationPayload {
  cardId: string;
  cardName: string;
  set: string;
  quantity: number;
  condition: CardCondition;
  purchasePrice?: number;
  imageUrl?: string;
}

/**
 * Convert a GuestCardItem to migration payload
 */
export function toMigrationPayload(card: GuestCardItem): MigrationPayload {
  return {
    cardId: card.tcgPlayerId,
    cardName: card.cardName,
    set: card.set,
    quantity: card.quantity,
    condition: card.condition,
    purchasePrice: card.purchasePrice,
    imageUrl: card.imageUrl,
  };
}
