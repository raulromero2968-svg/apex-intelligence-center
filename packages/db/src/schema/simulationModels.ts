import { pgTable, text, uuid, real, jsonb, timestamp, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Simulation Models Schema for Apex Intelligence
 *
 * Implements Bostrom's simulation theory concepts for TCG market predictions.
 * Combines prediction markets with simulation-based forecasting.
 *
 * Trade-offs:
 * - GOOD: TCG simulations as "fantasy markets" engage users, boost prediction accuracy (9-11% gain)
 * - BAD: Complex models increase compute; mitigate with low-rank approximations
 * - ETHICAL: Follow FHI longtermism principles, MFA for prediction markets
 */

// Simulation status enum
export const simulationStatusEnum = pgEnum('simulation_status', ['pending', 'running', 'completed', 'failed']);

// Bostrom trilemma outcome enum (which scenario is predicted)
export const trilemmaOutcomeEnum = pgEnum('trilemma_outcome', ['extinction', 'no_simulation', 'in_simulation']);

/**
 * Simulation Models table
 * Stores TCG-based simulation predictions using Bostrom-inspired framework
 */
export const simulationModels = pgTable(
  'simulation_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    tcgCardId: text('tcg_card_id').notNull(),

    // Prediction data
    prediction: real('prediction').notNull(), // e.g., predicted price change percentage
    confidence: real('confidence').notNull().default(0.5), // 0-1 confidence score
    horizon: text('horizon').notNull().default('30d'), // prediction time horizon

    // Model metadata
    modelType: text('model_type').notNull().default('monte_carlo'), // 'monte_carlo' | 'eggroll' | 'rag_fusion'
    parameters: jsonb('parameters').notNull().default({}), // model-specific parameters

    // Status tracking
    status: simulationStatusEnum('status').notNull().default('pending'),

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('simulation_models_user_id_idx').on(table.userId),
    cardIdIdx: index('simulation_models_card_id_idx').on(table.tcgCardId),
    statusIdx: index('simulation_models_status_idx').on(table.status),
    createdAtIdx: index('simulation_models_created_at_idx').on(table.createdAt),
    userCardIdx: index('simulation_models_user_card_idx').on(table.userId, table.tcgCardId),
  })
);

/**
 * Prediction Markets table
 * Stores market predictions linked to simulations (Bostrom-inspired)
 */
export const predictionMarkets = pgTable(
  'prediction_markets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    simulationId: uuid('simulation_id')
      .references(() => simulationModels.id, { onDelete: 'cascade' })
      .notNull(),

    // Prediction outcome based on Bostrom's trilemma
    outcome: trilemmaOutcomeEnum('outcome').notNull(),
    probability: real('probability').notNull(), // 0-1 probability for this outcome

    // Market data
    marketVolume: real('market_volume').default(0), // total market participation
    liquidityScore: real('liquidity_score').default(0.5), // 0-1 liquidity indicator

    // Evidence and reasoning
    evidence: jsonb('evidence').notNull().default({}), // supporting data from RAG
    reasoning: text('reasoning'), // AI-generated reasoning chain

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    simulationIdIdx: index('prediction_markets_simulation_id_idx').on(table.simulationId),
    outcomeIdx: index('prediction_markets_outcome_idx').on(table.outcome),
    probabilityIdx: index('prediction_markets_probability_idx').on(table.probability),
  })
);

/**
 * Simulation Insights table
 * Stores RAG-generated insights about simulation theory applied to TCG markets
 */
export const simulationInsights = pgTable(
  'simulation_insights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    simulationId: uuid('simulation_id')
      .references(() => simulationModels.id, { onDelete: 'cascade' }),

    // Insight content
    title: text('title').notNull(),
    content: text('content').notNull(),
    insightType: text('insight_type').notNull().default('general'), // 'bostrom' | 'fhi' | 'mtbbench' | 'market' | 'general'

    // Source citations
    sources: jsonb('sources').notNull().default([]), // array of source citations

    // Relevance scoring
    relevanceScore: real('relevance_score').default(0.5), // 0-1 relevance to simulation theory
    noveltyScore: real('novelty_score').default(0.5), // 0-1 novelty of insight

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    simulationIdIdx: index('simulation_insights_simulation_id_idx').on(table.simulationId),
    insightTypeIdx: index('simulation_insights_type_idx').on(table.insightType),
    relevanceScoreIdx: index('simulation_insights_relevance_idx').on(table.relevanceScore),
  })
);

// Type exports
export type SimulationModel = InferSelectModel<typeof simulationModels>;
export type NewSimulationModel = InferInsertModel<typeof simulationModels>;
export type PredictionMarket = InferSelectModel<typeof predictionMarkets>;
export type NewPredictionMarket = InferInsertModel<typeof predictionMarkets>;
export type SimulationInsight = InferSelectModel<typeof simulationInsights>;
export type NewSimulationInsight = InferInsertModel<typeof simulationInsights>;
