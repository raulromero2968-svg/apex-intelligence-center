/**
 * Market Movers Schema - Top daily price gainers with AI-powered insights
 *
 * Stores the top 5 market movers with explainable "why" reasoning.
 * Designed for high-performance queries with 15-minute refresh cycles.
 *
 * Features:
 * - Ranked ordering (1-5) for consistent UI display
 * - Foreign key to cards table for relational integrity
 * - JSONB sources array for provenance (citations)
 * - TTL via fetchedAt + expiresAt for automatic staleness detection
 * - Composite indexes for common query patterns
 * - Manipulation risk flagging via cross-reference with manipulationAlerts
 *
 * Reference: docs/MARKET_PULSE_ARCHITECTURE.md
 */

import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Market Movers table
 *
 * Tracks top daily gainers in the TCG market with AI-generated explanations.
 * Integrates with cards, market_knowledge, and manipulationAlerts tables.
 */
export const marketMovers = pgTable(
  'market_movers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Relational integrity - references cards table
    // Note: In production schema, add .references(() => cards.id, { onDelete: 'cascade' })
    cardId: text('card_id').notNull(),

    // Display rank (1 = highest gainer, 5 = 5th highest)
    rank: integer('rank').notNull(),

    // Price data (snapshot at ingestion time)
    currentPrice: real('current_price').notNull(), // Store as float, display as "$2000+"
    changePercentage: real('change_percentage').notNull(), // e.g., 45.2 for +45.2%

    // AI-powered explanation (the "why" - critical for value prop)
    reason: text('reason').notNull(),

    // Provenance array (e.g., ["TCGPlayer API", "Reddit r/pkmntcg", "Twitter @PokeInvestor"])
    sources: jsonb('sources').$type<string[]>().notNull().default('[]'),

    // Sentiment indicator (derived from market_knowledge table)
    sentiment: text('sentiment', {
      enum: ['bullish', 'bearish', 'neutral'],
    }),

    // Manipulation risk flag (cross-referenced with manipulationAlerts)
    isManipulated: boolean('is_manipulated').default(false).notNull(),

    // TTL fields (15-minute refresh cycle)
    fetchedAt: timestamp('fetched_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // fetchedAt + 15 minutes

    // Metadata for extensibility
    metadata: jsonb('metadata')
      .$type<{
        sevenDayHigh?: number;
        volumeSpike?: number;
        arbitrageSpread?: number;
        [key: string]: any;
      }>()
      .default('{}'),

    // Lifecycle timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Primary query: Get active movers ordered by rank
    rankExpiresIdx: index('idx_market_movers_rank_expires').on(
      table.rank,
      table.expiresAt,
    ),

    // Filter by card for historical tracking
    cardIdIdx: index('idx_market_movers_card_id').on(table.cardId),

    // Expiration cleanup queries
    expiresAtIdx: index('idx_market_movers_expires_at').on(table.expiresAt),

    // Timestamp index for historical analysis
    fetchedAtIdx: index('idx_market_movers_fetched_at').on(table.fetchedAt),

    // Ensure only one entry per rank per refresh cycle
    uniqueRankFetched: uniqueIndex('idx_market_movers_unique_rank_fetched').on(
      table.rank,
      table.fetchedAt,
    ),
  }),
);

/**
 * TypeScript types for Market Movers
 *
 * Use these as the source of truth for INTEL_ARCHIVE bindings and API responses.
 */
export type MarketMover = typeof marketMovers.$inferSelect;
export type NewMarketMover = typeof marketMovers.$inferInsert;
