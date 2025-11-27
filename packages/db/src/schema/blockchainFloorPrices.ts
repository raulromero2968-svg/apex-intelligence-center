import { pgTable, text, uuid, numeric, integer, timestamp, index } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Blockchain Floor Prices table stores real-time floor price data from Immutable zkEVM and Ronin.
 * 
 * Invariants:
 * - id must be unique UUID
 * - chain must be one of: 'immutable_zkevm' | 'ronin'
 * - collection must be one of: 'gods_unchained' | 'parallel' | 'project_o' | 'runes_tcg'
 * - tokenContract must be valid Ethereum address (0x...)
 * - floorPrice is stored as numeric to handle bigint values
 * - floorPriceUsd is stored as numeric for USD conversion
 * - blockNumber must be non-negative integer
 * - txHash can be null for polled data (not event-driven)
 * - observedAt is the timestamp when the floor price was observed
 */
export const blockchainFloorPrices = pgTable(
  'blockchain_floor_prices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chain: text('chain').notNull(), // 'immutable_zkevm' | 'ronin'
    collection: text('collection').notNull(), // 'gods_unchained' | 'parallel' | 'project_o' | 'runes_tcg'
    tokenContract: text('token_contract').notNull(),
    currency: text('currency').notNull(),
    floorPrice: numeric('floor_price', { precision: 78, scale: 0 }).notNull(), // bigint as string
    floorPriceUsd: numeric('floor_price_usd', { precision: 20, scale: 2 }).notNull(),
    blockNumber: integer('block_number').notNull(),
    txHash: text('tx_hash'),
    liquidityVenue: text('liquidity_venue').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Composite index on (chain, collection, observedAt DESC) for efficient queries
    chainCollectionObservedIdx: index('blockchain_floor_prices_chain_collection_observed_idx')
      .on(table.chain, table.collection, table.observedAt),
    // Index on observedAt for time-range queries
    observedAtIdx: index('blockchain_floor_prices_observed_at_idx')
      .on(table.observedAt),
  })
);

export type BlockchainFloorPrice = InferSelectModel<typeof blockchainFloorPrices>;
export type NewBlockchainFloorPrice = InferInsertModel<typeof blockchainFloorPrices>;



