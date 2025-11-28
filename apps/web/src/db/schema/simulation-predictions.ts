/**
 * Simulation Predictions Schema
 *
 * Database schema for Bostrom trilemma predictions with EGGROLL evolution
 * and Manifold Markets integration.
 *
 * Features:
 * - pgvector embeddings (1536-dim for text-embedding-3-large)
 * - EGGROLL fitness scoring (1-10 integer scale)
 * - Evolution history tracking
 * - Manifold Markets cache with Bostrom analysis
 * - HNSW indexing for fast similarity search
 *
 * Related:
 * - knowledge-09-database-architecture.md (pgvector HNSW)
 * - knowledge-02-ai-rag-architecture-v2.md (EGGROLL in RAG)
 *
 * @module simulation-predictions-schema
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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// CUSTOM TYPES
// ============================================================================

/**
 * Custom pgvector type for 1536 dimensions (text-embedding-3-large)
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
// SIMULATION PREDICTIONS TABLE
// ============================================================================

/**
 * Simulation Predictions - Stores Bostrom trilemma predictions
 *
 * Stores predictions with EGGROLL fitness scores and vector embeddings
 * for semantic search. Supports TCG "fantasy markets" as analogs for
 * existential predictions.
 */
export const simulationPredictions = pgTable('simulation_predictions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User who created the prediction
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Query that generated this prediction
  originalQuery: text('original_query').notNull(),

  // Bostrom scenario type
  scenario: text('scenario', {
    enum: ['extinction', 'posthuman', 'simulated_reality', 'general'],
  }).notNull(),

  // Prediction content
  content: text('content').notNull(),

  // Vector embedding for semantic search
  embedding: vector1536('embedding').notNull(),

  // EGGROLL fitness score (1-10)
  fitnessScore: integer('fitness_score').notNull(),

  // Probability estimate (0.0 to 1.0)
  probabilityEstimate: real('probability_estimate'),

  // Source market data
  marketSource: text('market_source', {
    enum: ['manifold', 'polymarket', 'metaculus', 'internal', 'hybrid'],
  }),

  // External market ID
  externalMarketId: text('external_market_id'),

  // EGGROLL evolution metadata
  evolutionMetadata: jsonb('evolution_metadata').$type<{
    totalGenerations: number;
    totalVariants: number;
    fitnessScore: number;
    scenario: string | null;
    latencyMs: number;
    model?: string;
  }>().default({
    totalGenerations: 0,
    totalVariants: 0,
    fitnessScore: 5,
    scenario: null,
    latencyMs: 0,
  }),

  // Source citations
  sources: jsonb('sources').$type<Array<{
    type: string;
    id?: string;
    url?: string;
    probability?: number;
    doi?: string;
  }>>().default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  // Indexes
  scenarioIdx: index('idx_simulation_predictions_scenario').on(table.scenario),
  userIdx: index('idx_simulation_predictions_user').on(table.userId),
  fitnessIdx: index('idx_simulation_predictions_fitness').on(table.fitnessScore),
  marketSourceIdx: index('idx_simulation_predictions_market_source').on(table.marketSource),
  externalMarketIdx: index('idx_simulation_predictions_external_market').on(table.externalMarketId),
  createdAtIdx: index('idx_simulation_predictions_created_at').on(table.createdAt),
  expiresAtIdx: index('idx_simulation_predictions_expires').on(table.expiresAt),
}));

// ============================================================================
// EGGROLL EVOLUTION HISTORY TABLE
// ============================================================================

/**
 * EGGROLL Evolution History - Tracks evolution generations
 *
 * Records all variants generated during EGGROLL evolution for
 * reproducibility and analysis of prediction quality.
 */
export const eggrollEvolutionHistory = pgTable('eggroll_evolution_history', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Parent prediction
  predictionId: uuid('prediction_id').references(() => simulationPredictions.id, { onDelete: 'cascade' }),

  // Evolution generation (0 = initial)
  generation: integer('generation').notNull(),

  // Variant content
  variantContent: text('variant_content').notNull(),

  // Integer weight (1-10)
  weight: integer('weight').notNull(),

  // Mutation type
  mutationType: text('mutation_type', {
    enum: [
      'initial',
      'weight_adjust',
      'perspective_shift',
      'evidence_refinement',
      'scenario_blend',
      'reranked',
      'fallback',
      'random',
    ],
  }),

  // Mutation history (lineage)
  mutationHistory: text('mutation_history').array().default([]),

  // Was this the fittest variant?
  isFittest: boolean('is_fittest').default(false),

  // Cohere rerank score
  rerankScore: real('rerank_score'),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  predictionIdx: index('idx_eggroll_history_prediction').on(table.predictionId),
  generationIdx: index('idx_eggroll_history_generation').on(table.predictionId, table.generation),
}));

// ============================================================================
// MANIFOLD MARKET CACHE TABLE
// ============================================================================

/**
 * Manifold Market Cache - Caches Manifold Markets data
 *
 * Stores market data with Bostrom trilemma analysis for reduced
 * API calls and faster access.
 */
export const manifoldMarketCache = pgTable('manifold_market_cache', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Manifold market ID
  marketId: text('market_id').notNull().unique(),

  // Market question
  question: text('question').notNull(),

  // Market description
  description: text('description'),

  // Probability (for BINARY markets)
  probability: real('probability'),

  // Outcome type
  outcomeType: text('outcome_type', {
    enum: ['BINARY', 'FREE_RESPONSE', 'NUMERIC', 'PSEUDO_NUMERIC', 'MULTIPLE_CHOICE'],
  }).notNull(),

  // Resolution status
  isResolved: boolean('is_resolved').default(false),
  resolution: text('resolution'),
  resolutionTime: timestamp('resolution_time'),

  // Market metrics
  volume: real('volume').default(0),
  volume24h: real('volume_24h').default(0),
  totalLiquidity: real('total_liquidity'),
  uniqueBettorCount: integer('unique_bettor_count').default(0),

  // Market URL
  url: text('url'),

  // Close time
  closeTime: timestamp('close_time'),

  // Bostrom analysis
  simulationAnalysis: jsonb('simulation_analysis').$type<{
    bostromRelevance: number;
    scenarioType: 'extinction' | 'posthuman' | 'simulated_reality' | 'general';
    confidenceScore: number;
  }>().default({
    bostromRelevance: 0,
    scenarioType: 'general',
    confidenceScore: 0.5,
  }),

  // Creator info
  creatorUsername: text('creator_username'),
  creatorName: text('creator_name'),

  // Tags
  tags: text('tags').array().default([]),

  // Raw API response
  rawResponse: jsonb('raw_response'),

  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  createdAt: timestamp('created_at'),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  marketIdIdx: index('idx_manifold_cache_market_id').on(table.marketId),
  expiresAtIdx: index('idx_manifold_cache_expires').on(table.expiresAt),
  probabilityIdx: index('idx_manifold_cache_probability').on(table.probability),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Simulation Predictions relations
 */
export const simulationPredictionsRelations = relations(simulationPredictions, ({ one, many }) => ({
  user: one(users, {
    fields: [simulationPredictions.userId],
    references: [users.id],
  }),
  evolutionHistory: many(eggrollEvolutionHistory),
}));

/**
 * EGGROLL Evolution History relations
 */
export const eggrollEvolutionHistoryRelations = relations(eggrollEvolutionHistory, ({ one }) => ({
  prediction: one(simulationPredictions, {
    fields: [eggrollEvolutionHistory.predictionId],
    references: [simulationPredictions.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SimulationPrediction = typeof simulationPredictions.$inferSelect;
export type NewSimulationPrediction = typeof simulationPredictions.$inferInsert;
export type EggrollEvolutionHistory = typeof eggrollEvolutionHistory.$inferSelect;
export type NewEggrollEvolutionHistory = typeof eggrollEvolutionHistory.$inferInsert;
export type ManifoldMarketCache = typeof manifoldMarketCache.$inferSelect;
export type NewManifoldMarketCache = typeof manifoldMarketCache.$inferInsert;

// Bostrom scenario type alias
export type BostromScenario = 'extinction' | 'posthuman' | 'simulated_reality' | 'general';
export type MarketSource = 'manifold' | 'polymarket' | 'metaculus' | 'internal' | 'hybrid';
export type MutationType = 'initial' | 'weight_adjust' | 'perspective_shift' | 'evidence_refinement' | 'scenario_blend' | 'reranked' | 'fallback' | 'random';
