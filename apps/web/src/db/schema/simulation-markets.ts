/**
 * Simulation Markets Schema Extensions
 *
 * Database schema for simulation market features:
 * - TCG outcome predictions with pgvector embeddings (HNSW indexed)
 * - Polymarket integration for real-time odds
 * - Bostrom trilemma-aware existential predictions
 *
 * Features:
 * - pgvector embeddings (1536-dim for OpenAI text-embedding-3-large)
 * - HNSW indexing for fast cosine similarity search
 * - Event probability tracking from prediction markets
 * - Simulation run history with versioning
 *
 * References:
 * - KB-09: Advanced Database Architecture (pgvector HNSW)
 * - KB-02: AI RAG Architecture (embeddings)
 * - EGGROLL: Gradient-free evolution for stable predictions
 *
 * @module simulation-markets-schema
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  uuid,
  index,
  real,
  integer,
  boolean,
  customType,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, cards } from '../schema';

// ============================================================================
// CUSTOM TYPES
// ============================================================================

/**
 * Custom pgvector type for 1536 dimensions (text-embedding-3-large production)
 */
const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ============================================================================
// TCG OUTCOMES TABLE (KB-09 pgvector HNSW)
// ============================================================================

/**
 * TCG Outcomes - Stores simulation predictions with embeddings
 *
 * Each outcome represents a simulation prediction for a TCG card/event,
 * embedded with pgvector for similarity search (find similar predictions).
 *
 * HNSW indexing enables fast cosine similarity queries for:
 * - Finding similar past predictions for calibration
 * - Retrieving related market scenarios
 * - Clustering prediction patterns
 */
export const tcgOutcomes = pgTable('tcg_outcomes', {
  id: serial('id').primaryKey(),

  // Card reference (nullable for general market predictions)
  tcgCardId: text('tcg_card_id').references(() => cards.id, { onDelete: 'set null' }),

  // Simulation metadata
  simulationId: text('simulation_id').notNull(), // Groups related predictions
  scenarioType: text('scenario_type', {
    enum: ['price_prediction', 'market_correction', 'black_swan', 'trend_continuation', 'arbitrage_opportunity'],
  }).notNull(),

  // pgvector embedding (1536 dimensions for text-embedding-3-large)
  embedding: vector1536('embedding'),

  // Prediction values
  prediction: real('prediction'), // Numerical prediction (e.g., price)
  predictionText: text('prediction_text'), // Text prediction for qualitative outcomes
  confidence: real('confidence').notNull().default(0.5), // 0-1 confidence score
  integerWeight: integer('integer_weight'), // EGGROLL integer weight (1-10)

  // Actual outcome (filled in when known)
  actualOutcome: real('actual_outcome'),
  actualOutcomeText: text('actual_outcome_text'),
  outcomeDate: timestamp('outcome_date'),

  // Calibration metrics (calculated post-hoc)
  calibrationError: real('calibration_error'), // |prediction - actual|
  brierScore: real('brier_score'), // For probabilistic predictions

  // Metadata
  metadata: jsonb('metadata').$type<{
    model?: string;
    temperature?: number;
    contextSources?: string[];
    eggrollFitness?: { accuracy: number; stability: number; coherence: number };
    marketConditions?: Record<string, any>;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // TTL for cache invalidation
}, (table) => ({
  // HNSW index for vector similarity (created in migration with vector_cosine_ops)
  // Note: Drizzle doesn't support HNSW syntax directly, created in SQL migration

  // Standard indexes
  tcgCardIdx: index('idx_tcg_outcomes_card').on(table.tcgCardId),
  simulationIdx: index('idx_tcg_outcomes_simulation').on(table.simulationId),
  scenarioTypeIdx: index('idx_tcg_outcomes_scenario').on(table.scenarioType),
  confidenceIdx: index('idx_tcg_outcomes_confidence').on(table.confidence),
  createdAtIdx: index('idx_tcg_outcomes_created').on(table.createdAt),
  expiresAtIdx: index('idx_tcg_outcomes_expires').on(table.expiresAt),
}));

// ============================================================================
// POLYMARKET EVENTS TABLE
// ============================================================================

/**
 * Polymarket Events - Cached prediction market data
 *
 * Stores event data from Polymarket API with caching for rate limit compliance.
 * Events are linked to TCG outcomes for market-informed simulations.
 */
export const polymarketEvents = pgTable('polymarket_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Polymarket identifiers
  eventId: text('event_id').notNull().unique(), // Polymarket event ID
  conditionId: text('condition_id'), // Polymarket condition ID
  slug: text('slug'), // URL slug

  // Event details
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'), // e.g., 'crypto', 'politics', 'entertainment'

  // Market data
  outcomeYes: real('outcome_yes'), // Probability of YES outcome (0-1)
  outcomeNo: real('outcome_no'), // Probability of NO outcome (0-1)
  volume: real('volume'), // Total trading volume (USD)
  liquidity: real('liquidity'), // Current liquidity depth
  spreadBps: integer('spread_bps'), // Bid-ask spread in basis points

  // Resolution
  isResolved: boolean('is_resolved').default(false).notNull(),
  resolvedOutcome: text('resolved_outcome'), // 'YES' | 'NO' | 'INVALID'
  resolvedAt: timestamp('resolved_at'),

  // Timestamps and caching
  lastFetchedAt: timestamp('last_fetched_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Cache TTL
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Raw API response for debugging
  rawData: jsonb('raw_data'),
}, (table) => ({
  eventIdIdx: index('idx_polymarket_event_id').on(table.eventId),
  categoryIdx: index('idx_polymarket_category').on(table.category),
  resolvedIdx: index('idx_polymarket_resolved').on(table.isResolved),
  expiresAtIdx: index('idx_polymarket_expires').on(table.expiresAt),
}));

// ============================================================================
// SIMULATION RUNS TABLE
// ============================================================================

/**
 * Simulation Runs - Tracks simulation execution history
 *
 * Each run represents a batch of predictions generated together,
 * enabling versioning and A/B testing of simulation approaches.
 */
export const simulationRuns = pgTable('simulation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User and context
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  simulationId: text('simulation_id').notNull().unique(), // Links to tcgOutcomes

  // Run configuration
  runType: text('run_type', {
    enum: ['tcg_market', 'polymarket_sync', 'bostrom_trilemma', 'eggroll_evolution', 'hybrid'],
  }).notNull(),
  status: text('status', {
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
  }).notNull().default('pending'),

  // Configuration
  config: jsonb('config').$type<{
    numPredictions?: number;
    temperature?: number;
    eggrollConfig?: {
      numVariants: number;
      fitnessThreshold: number;
    };
    polymarketEventIds?: string[];
    targetCards?: string[];
  }>().default({}),

  // Results summary
  predictionsGenerated: integer('predictions_generated').default(0),
  avgConfidence: real('avg_confidence'),
  avgCalibrationError: real('avg_calibration_error'),

  // Execution metadata
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_simulation_runs_user').on(table.userId),
  simulationIdIdx: index('idx_simulation_runs_sim').on(table.simulationId),
  statusIdx: index('idx_simulation_runs_status').on(table.status),
  runTypeIdx: index('idx_simulation_runs_type').on(table.runType),
  createdAtIdx: index('idx_simulation_runs_created').on(table.createdAt),
}));

// ============================================================================
// MARKET ODDS CACHE TABLE
// ============================================================================

/**
 * Market Odds Cache - Unified cache for prediction market odds
 *
 * Caches odds from multiple sources (Polymarket, Metaculus, etc.)
 * with tiered TTL based on market activity.
 */
export const marketOddsCache = pgTable('market_odds_cache', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Source and identifier
  source: text('source', {
    enum: ['polymarket', 'metaculus', 'kalshi', 'predictit', 'manifold'],
  }).notNull(),
  externalId: text('external_id').notNull(), // Source-specific ID

  // Market question
  question: text('question').notNull(),
  category: text('category'),

  // Current odds
  probability: real('probability').notNull(), // Main outcome probability (0-1)
  volumeUsd: real('volume_usd'),
  numTraders: integer('num_traders'),

  // Historical tracking
  probabilityHistory: jsonb('probability_history').$type<Array<{
    timestamp: string;
    probability: number;
    volume?: number;
  }>>().default([]),

  // Cache metadata
  hitCount: integer('hit_count').default(0),
  lastHitAt: timestamp('last_hit_at'),
  expiresAt: timestamp('expires_at').notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceExternalIdx: index('idx_market_odds_source_external').on(table.source, table.externalId),
  categoryIdx: index('idx_market_odds_category').on(table.category),
  expiresAtIdx: index('idx_market_odds_expires').on(table.expiresAt),
  hitCountIdx: index('idx_market_odds_hits').on(table.hitCount),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * TCG Outcomes relations
 */
export const tcgOutcomesRelations = relations(tcgOutcomes, ({ one }) => ({
  card: one(cards, {
    fields: [tcgOutcomes.tcgCardId],
    references: [cards.id],
  }),
}));

/**
 * Simulation Runs relations
 */
export const simulationRunsRelations = relations(simulationRuns, ({ one }) => ({
  user: one(users, {
    fields: [simulationRuns.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TcgOutcome = typeof tcgOutcomes.$inferSelect;
export type NewTcgOutcome = typeof tcgOutcomes.$inferInsert;
export type PolymarketEvent = typeof polymarketEvents.$inferSelect;
export type NewPolymarketEvent = typeof polymarketEvents.$inferInsert;
export type SimulationRun = typeof simulationRuns.$inferSelect;
export type NewSimulationRun = typeof simulationRuns.$inferInsert;
export type MarketOddsCache = typeof marketOddsCache.$inferSelect;
export type NewMarketOddsCache = typeof marketOddsCache.$inferInsert;
