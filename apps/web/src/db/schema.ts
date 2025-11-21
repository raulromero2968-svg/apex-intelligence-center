/**
 * Database schema definitions for Apex Intelligence
 *
 * This schema includes the TCG RAG system for provenance-tracked market intelligence
 * Production-ready models for Card, Price, Sale, PopulationReport, Portfolio, Arbitrage, etc.
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real, serial, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Collections table for user-curated content
export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  is_public: boolean('is_public').default(false).notNull(),
  is_unlisted: boolean('is_unlisted').default(false).notNull(),
  type: text('type').default('default').notNull(),
  search_params: jsonb('search_params'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  publicUpdatedIdx: index('idx_collections_public_updated')
    .on(table.is_public, table.updated_at)
}));

// Collection items junction table
export const collection_items = pgTable('collection_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  collection_id: uuid('collection_id').references(() => collections.id).notNull(),
  item_id: text('item_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Intel items for general market data
export const intel_items = pgTable('intel_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  source: text('source').notNull(),
  data: jsonb('data').notNull(),
  observed_at: timestamp('observed_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * TCG Documents table for RAG system
 *
 * This is the core of the Apex Intelligence RAG engine.
 * It stores all TCG-related content with vector embeddings and full provenance metadata
 * to solve the "attribution collapse" problem.
 *
 * Every document includes:
 * - source_type: The type of data source (ebay_listing, psa_pop_report, etc.)
 * - content: Raw text for semantic search
 * - metadata: Source-specific structured data with unique_id for idempotency
 * - embedding: 1536-dimension vector from OpenAI text-embedding-3-large
 */
export const tcg_documents = pgTable('tcg_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  source_type: text('source_type').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  // pgvector extension - stores as vector(1536)
  // TODO: Re-add embedding column and indexes after fixing type issues
  // embedding: sql`vector(1536)`,
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Market Knowledge table for AI-generated market intelligence
 *
 * Stores market intelligence claims with vector embeddings, sentiment analysis,
 * and reliability scoring. Designed for high-performance semantic search with HNSW indexing.
 *
 * Features:
 * - Vector embeddings (1536-dim) for semantic similarity search
 * - Sentiment classification (bullish/bearish/neutral)
 * - Reliability scoring (0.0-1.0) for filtering high-confidence claims
 * - Cluster grouping for related knowledge
 * - HNSW indexing for fast vector search
 * - Provenance tracking via metadata
 */
export const market_knowledge = pgTable('market_knowledge', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Vector embedding - using custom type to work around Drizzle type issues
  embedding: sql<number[]>`vector(1536)`.notNull(),

  // Market sentiment (enum enforced at DB level via CHECK constraint)
  sentiment: text('sentiment', {
    enum: ['bullish', 'bearish', 'neutral']
  }).notNull(),

  // Type/category of the claim
  claim_type: text('claim_type').notNull(),

  // Reliability score (0.0 to 1.0) - CHECK constraint enforced at DB level
  reliability_score: real('reliability_score').notNull(),

  // Cluster ID for knowledge grouping
  cluster_id: integer('cluster_id'),

  // Claim content (the actual market intelligence statement)
  content: text('content').notNull(),

  // Source metadata (provenance, citations, etc.)
  metadata: jsonb('metadata').$type<{
    source?: string;
    task_id?: string;
    vote_consensus?: number;
    red_flags?: number;
    citations?: Array<{ type: string; id: string }>;
    generated_at?: string;
    model?: string;
    unique_id?: string;
    [key: string]: any;
  }>().notNull().default({}),

  // Timestamps
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // HNSW index for vector similarity (created in migration)
  // B-tree composite index on sentiment + claim_type
  sentimentClaimTypeIdx: index('idx_market_knowledge_sentiment_claim_type')
    .on(table.sentiment, table.claim_type),
  // Index on reliability_score for high-confidence filtering
  reliabilityIdx: index('idx_market_knowledge_reliability')
    .on(table.reliability_score),
  // Index on cluster_id
  clusterIdx: index('idx_market_knowledge_cluster')
    .on(table.cluster_id),
  // Composite index for common query patterns (sentiment + reliability)
  sentimentReliabilityIdx: index('idx_market_knowledge_sentiment_reliability')
    .on(table.sentiment, table.reliability_score),
  // Timestamp index for temporal queries
  createdAtIdx: index('idx_market_knowledge_created_at')
    .on(table.created_at),
}));

// ============================================================================
// PRODUCTION TCG MARKET DATA MODELS
// ============================================================================

/**
 * Cards table - Core entity for all TCG cards across Pokemon, MTG, YuGiOh, etc.
 */
export const cards = pgTable('cards', {
  id: text('id').primaryKey(), // cuid format
  name: text('name').notNull(),
  setName: text('set_name').notNull(),
  cardNumber: text('card_number').notNull(),
  game: text('game').notNull(), // "pokemon" | "mtg" | "yugioh" | "lorcana"
  artist: text('artist'),
  rarity: text('rarity'),
  tcgplayerId: integer('tcgplayer_id'),
  scryfallId: text('scryfall_id'),
  justTcgId: text('just_tcg_id'),
  apexScore: real('apex_score'), // 0-100 composite score (price velocity + pop delta + liquidity)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  gameApexIdx: index('idx_cards_game_apex').on(table.game, table.apexScore),
  nameIdx: index('idx_cards_name').on(table.name),
  uniqueCard: uniqueIndex('idx_cards_unique').on(table.name, table.setName, table.cardNumber, table.game),
}));

/**
 * Prices table - Market prices from JustTCG, TCGPlayer, Cardmarket, etc.
 */
export const prices = pgTable('prices', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  source: text('source').notNull(), // "justtcg" | "tcgplayer" | "cardmarket" | "gemrate"
  market: real('market').notNull(),
  low: real('low'),
  high: real('high'),
  psa10: real('psa10'),
  psa9: real('psa9'),
  cgcBlackLabel: real('cgc_black_label'),
  bgs95: real('bgs95'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardDateIdx: index('idx_prices_card_date').on(table.cardId, table.date),
  sourceDateIdx: index('idx_prices_source_date').on(table.source, table.date),
}));

/**
 * Sales table - Actual sale transactions with full provenance
 */
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  salePrice: real('sale_price').notNull(),
  currency: text('currency').notNull().default('USD'),
  saleDate: timestamp('sale_date').notNull(),
  grade: text('grade'),
  gradingCompany: text('grading_company'),
  certNumber: text('cert_number'),
  source: text('source').notNull(), // "ebay" | "pwcc" | "goldin" | "cardladder"
  ebayItemId: text('ebay_item_id'),
  imageUrls: jsonb('image_urls'),
  sellerUsername: text('seller_username'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardSaleDateIdx: index('idx_sales_card_date').on(table.cardId, table.saleDate),
  sourceDateIdx: index('idx_sales_source_date').on(table.source, table.saleDate),
  certNumberIdx: index('idx_sales_cert').on(table.certNumber),
  uniqueCert: uniqueIndex('idx_sales_cert_unique').on(table.certNumber),
  uniqueEbay: uniqueIndex('idx_sales_ebay_unique').on(table.ebayItemId),
}));

/**
 * Population Reports - PSA/BGS/CGC/SGC population data (GOLD for pop delta alerts)
 */
export const populationReports = pgTable('population_reports', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  gradingCompany: text('grading_company').notNull(), // "PSA" | "BGS" | "CGC" | "SGC"
  totalPop: integer('total_pop').notNull(),
  grade10Count: integer('grade10_count').notNull(),
  popHigher: integer('pop_higher'),
  lastUpdated: timestamp('last_updated').notNull(),
  delta30d: integer('delta30d'), // computed nightly
  growthRate90d: real('growth_rate_90d'), // computed
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardCompanyIdx: index('idx_pop_card_company').on(table.cardId, table.gradingCompany),
  deltaIdx: index('idx_pop_delta').on(table.delta30d),
  uniquePop: uniqueIndex('idx_pop_unique').on(table.cardId, table.gradingCompany, table.lastUpdated),
}));

/**
 * Users table - Basic user management with Stripe subscription support
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionTier: text('subscription_tier', {
    enum: ['free', 'pro', 'enterprise']
  }).default('free').notNull(),
  subscriptionStatus: text('subscription_status', {
    enum: ['active', 'canceled', 'past_due', 'trialing']
  }),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Watchlist Items - User price alerts with tiered limits
 */
export const watchlistItems = pgTable('watchlist_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  targetPrice: real('target_price').notNull(),
  direction: text('direction', { enum: ['above', 'below'] }).notNull(),
  isTriggered: boolean('is_triggered').notNull().default(false),
  triggeredAt: timestamp('triggered_at'),
  notified: boolean('notified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_watchlist_user').on(table.userId),
  cardIdx: index('idx_watchlist_card').on(table.cardId),
  triggeredIdx: index('idx_watchlist_triggered').on(table.isTriggered),
  uniqueUserCard: uniqueIndex('idx_watchlist_user_card_unique').on(table.userId, table.cardId),
}));

/**
 * Portfolios table - User portfolio containers
 */
export const portfolios = pgTable('portfolios', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Main'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_portfolios_user').on(table.userId),
}));

/**
 * Holdings table - Individual card holdings in portfolios
 */
export const holdings = pgTable('holdings', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  costBasisUsd: real('cost_basis_usd').notNull(),
  acquiredDate: timestamp('acquired_date').notNull(),
  grade: text('grade'),
  gradingCompany: text('grading_company'),
  certNumber: text('cert_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  portfolioIdx: index('idx_holdings_portfolio').on(table.portfolioId),
  uniqueCert: uniqueIndex('idx_holdings_cert_unique').on(table.certNumber),
}));

/**
 * Alert Subscriptions - User alert preferences
 */
export const alertSubscriptions = pgTable('alert_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  alertType: text('alert_type').notNull(), // "pop_delta" | "arbitrage" | "price_spike"
  threshold: real('threshold').notNull(),
  channels: jsonb('channels').notNull(), // ["discord", "telegram", "email", "push"]
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userActiveIdx: index('idx_alerts_user_active').on(table.userId, table.isActive),
  cardTypeIdx: index('idx_alerts_card_type').on(table.cardId, table.alertType),
}));

/**
 * Push Subscriptions - Web Push API subscriptions
 */
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  keys: jsonb('keys').notNull(), // { p256dh, auth }
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_push_user').on(table.userId),
}));

/**
 * Mobile Push Tokens - FCM and Expo Push tokens for mobile apps
 */
export const mobilePushTokens = pgTable('mobile_push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'fcm' or 'expo'
  deviceId: text('device_id'),
  platform: text('platform'), // 'ios' or 'android'
  active: boolean('active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_mobile_push_user').on(table.userId),
  tokenIdx: index('idx_mobile_push_token').on(table.token),
  activeIdx: index('idx_mobile_push_active').on(table.active),
}));

/**
 * Push Tickets - Track Expo push notification receipts and retries
 */
export const pushTickets = pgTable('push_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: text('ticket_id').unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  type: text('type').notNull(), // 'fcm' or 'expo'
  status: text('status').notNull().default('sent'), // 'sent', 'delivered', 'error', 'retry'
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  retries: integer('retries').default(0).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index('idx_push_ticket_id').on(table.ticketId),
  statusIdx: index('idx_push_ticket_status').on(table.status),
  userIdx: index('idx_push_ticket_user').on(table.userId),
}));

/**
 * Arbitrage Opportunities - Cached arbitrage opportunities (15min TTL)
 */
export const arbitrageOpportunities = pgTable('arbitrage_opportunities', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  buySource: text('buy_source').notNull(), // "JP" | "EU" | "US"
  buyPrice: real('buy_price').notNull(),
  sellSource: text('sell_source').notNull(),
  sellPrice: real('sell_price').notNull(),
  spreadPct: real('spread_pct').notNull(),
  riskAdjustedSpreadPct: real('risk_adjusted_spread_pct').notNull(),
  liquidity: integer('liquidity').notNull(),
  shippingCost: real('shipping_cost'),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  spreadExpiresIdx: index('idx_arb_spread_expires').on(table.spreadPct, table.expiresAt),
  cardIdx: index('idx_arb_card').on(table.cardId),
}));

/**
 * Human Conception Statements - EU AI Act compliance
 */
export const humanConceptionStatements = pgTable('human_conception_statements', {
  id: text('id').primaryKey(),
  insightId: text('insight_id').notNull().unique(),
  researcherId: text('researcher_id').notNull(),
  statement: text('statement').notNull(),
  promptChain: jsonb('prompt_chain').notNull(),
  signature: text('signature').notNull(),
  ipfsCid: text('ipfs_cid').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  researcherIdx: index('idx_conception_researcher').on(table.researcherId),
  createdIdx: index('idx_conception_created').on(table.createdAt),
}));

/**
 * Compliance Log - RAG query/response logging for EU AI Act
 */
export const complianceLogs = pgTable('compliance_logs', {
  id: text('id').primaryKey(),
  traceHash: text('trace_hash').notNull().unique(),
  ipfsCid: text('ipfs_cid').notNull().unique(),
  userId: text('user_id'),
  query: text('query').notNull(),
  response: text('response').notNull(),
  citationCount: integer('citation_count').notNull(),
  synthesisCount: integer('synthesis_count').notNull(),
  noveltyScore: real('novelty_score').notNull(), // 0-1, >0.7 triggers human review
  isValid: boolean('is_valid').notNull(),
  validationErrors: jsonb('validation_errors'),
  systemVersion: text('system_version').notNull(), // Git SHA
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('idx_compliance_user_created').on(table.userId, table.createdAt),
  noveltyIdx: index('idx_compliance_novelty').on(table.noveltyScore),
  createdIdx: index('idx_compliance_created').on(table.createdAt),
}));

// ============================================================================
// MAKER FRAMEWORK TABLES
// ============================================================================

/**
 * MAKER Tasks - Multi-Agent Knowledge Ensemble Refinement task tracking
 *
 * Tracks high-level tasks that use the MAKER voting framework for reliability.
 * Each task runs multiple micro-agents with voting to achieve 99.9%+ success rates.
 */
export const makerTasks = pgTable('maker_tasks', {
  id: text('id').primaryKey(),
  taskType: text('task_type').notNull(), // 'arbitrage_scan' | 'price_verification' | etc.
  status: text('status').notNull(), // 'running' | 'completed' | 'failed'
  totalSteps: integer('total_steps'),
  successfulSteps: integer('successful_steps').default(0),
  totalVotesCast: integer('total_votes_cast').default(0),
  redFlaggedVotes: integer('red_flagged_votes').default(0),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_maker_tasks_status').on(table.status),
  taskTypeIdx: index('idx_maker_tasks_type').on(table.taskType),
  startedAtIdx: index('idx_maker_tasks_started').on(table.startedAt),
}));

/**
 * MAKER Votes - Individual voting attempts for each step
 *
 * Records each execution attempt (vote) for micro-agent steps.
 * The MAKER framework uses "first to ahead by k" voting to determine consensus.
 * Red-flagged votes are excluded from consensus calculation.
 */
export const makerVotes = pgTable('maker_votes', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => makerTasks.id, { onDelete: 'cascade' }),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }), // nullable for non-card steps
  stepName: text('step_name').notNull(),
  voteIndex: integer('vote_index').notNull(),
  resultHash: text('result_hash'), // SHA-256 hash of deterministic JSON
  resultJson: jsonb('result_json'),
  isRedFlagged: boolean('is_red_flagged').default(false).notNull(),
  redFlagReason: text('red_flag_reason'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index('idx_maker_votes_task').on(table.taskId),
  stepNameIdx: index('idx_maker_votes_step').on(table.stepName),
  resultHashIdx: index('idx_maker_votes_hash').on(table.resultHash),
  redFlaggedIdx: index('idx_maker_votes_flagged').on(table.isRedFlagged),
}));

// ============================================================================
// DRIZZLE ORM RELATIONS (Critical for type-safe relational queries)
// ============================================================================

/**
 * Cards relations - Defines many-to-many and one-to-many relationships
 */
export const cardsRelations = relations(cards, ({ many }) => ({
  prices: many(prices),
  sales: many(sales),
  populationReports: many(populationReports),
  holdings: many(holdings),
  alertSubscriptions: many(alertSubscriptions),
  pushSubscriptions: many(pushSubscriptions),
  watchlistItems: many(watchlistItems),
  arbitrageOpportunities: many(arbitrageOpportunities),
  makerVotes: many(makerVotes),
}));

/**
 * Prices relations - Bidirectional relation to cards
 */
export const pricesRelations = relations(prices, ({ one }) => ({
  card: one(cards, {
    fields: [prices.cardId],
    references: [cards.id],
  }),
}));

/**
 * Sales relations - Bidirectional relation to cards
 */
export const salesRelations = relations(sales, ({ one }) => ({
  card: one(cards, {
    fields: [sales.cardId],
    references: [cards.id],
  }),
}));

/**
 * Population Reports relations - Bidirectional relation to cards
 */
export const populationReportsRelations = relations(populationReports, ({ one }) => ({
  card: one(cards, {
    fields: [populationReports.cardId],
    references: [cards.id],
  }),
}));

/**
 * Portfolios relations
 */
export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  holdings: many(holdings),
}));

/**
 * Holdings relations
 */
export const holdingsRelations = relations(holdings, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [holdings.portfolioId],
    references: [portfolios.id],
  }),
  card: one(cards, {
    fields: [holdings.cardId],
    references: [cards.id],
  }),
}));

/**
 * Users relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  alertSubscriptions: many(alertSubscriptions),
  pushSubscriptions: many(pushSubscriptions),
  watchlistItems: many(watchlistItems),
}));

/**
 * Watchlist Items relations
 */
export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, {
    fields: [watchlistItems.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [watchlistItems.cardId],
    references: [cards.id],
  }),
}));

/**
 * Alert Subscriptions relations
 */
export const alertSubscriptionsRelations = relations(alertSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [alertSubscriptions.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [alertSubscriptions.cardId],
    references: [cards.id],
  }),
}));

/**
 * Push Subscriptions relations
 */
export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [pushSubscriptions.cardId],
    references: [cards.id],
  }),
}));

/**
 * Arbitrage Opportunities relations
 */
export const arbitrageOpportunitiesRelations = relations(arbitrageOpportunities, ({ one }) => ({
  card: one(cards, {
    fields: [arbitrageOpportunities.cardId],
    references: [cards.id],
  }),
}));

/**
 * MAKER Tasks relations
 */
export const makerTasksRelations = relations(makerTasks, ({ many }) => ({
  votes: many(makerVotes),
}));

/**
 * MAKER Votes relations
 */
export const makerVotesRelations = relations(makerVotes, ({ one }) => ({
  task: one(makerTasks, {
    fields: [makerVotes.taskId],
    references: [makerTasks.id],
  }),
  card: one(cards, {
    fields: [makerVotes.cardId],
    references: [cards.id],
  }),
}));

// ============================================================================
// TypeScript types for better DX
// ============================================================================

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collection_items.$inferSelect;
export type NewCollectionItem = typeof collection_items.$inferInsert;
export type IntelItem = typeof intel_items.$inferSelect;
export type NewIntelItem = typeof intel_items.$inferInsert;
export type TcgDocument = typeof tcg_documents.$inferSelect;
export type NewTcgDocument = typeof tcg_documents.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type PopulationReport = typeof populationReports.$inferSelect;
export type NewPopulationReport = typeof populationReports.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type NewWatchlistItem = typeof watchlistItems.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type NewAlertSubscription = typeof alertSubscriptions.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type MobilePushToken = typeof mobilePushTokens.$inferSelect;
export type NewMobilePushToken = typeof mobilePushTokens.$inferInsert;
export type PushTicket = typeof pushTickets.$inferSelect;
export type NewPushTicket = typeof pushTickets.$inferInsert;
export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type NewArbitrageOpportunity = typeof arbitrageOpportunities.$inferInsert;
export type HumanConceptionStatement = typeof humanConceptionStatements.$inferSelect;
export type NewHumanConceptionStatement = typeof humanConceptionStatements.$inferInsert;
export type ComplianceLog = typeof complianceLogs.$inferSelect;
export type NewComplianceLog = typeof complianceLogs.$inferInsert;
export type MakerTask = typeof makerTasks.$inferSelect;
export type NewMakerTask = typeof makerTasks.$inferInsert;
export type MakerVote = typeof makerVotes.$inferSelect;
export type NewMakerVote = typeof makerVotes.$inferInsert;
export type MarketKnowledge = typeof market_knowledge.$inferSelect;
export type NewMarketKnowledge = typeof market_knowledge.$inferInsert;

/**
 * Metadata structure examples by source_type:
 *
 * ebay_listing: {
 *   card_name: "Charizard",
 *   set: "Base Set",
 *   grade: "PSA 10",
 *   sale_price: 15000.00,
 *   sale_date: "2025-10-28",
 *   auction_id: "123456789",
 *   source_url: "https://ebay.com/itm/123456789",
 *   unique_id: "ebay_123456789"
 * }
 *
 * psa_pop_report: {
 *   card_name: "Charizard",
 *   set: "Base Set",
 *   grade: "PSA 10",
 *   population: 54,
 *   report_date: "2025-11-01",
 *   source_url: "https://psacard.com/...",
 *   unique_id: "psa_charizard_base_10_20251101"
 * }
 *
 * news_article: {
 *   title: "...",
 *   author: "...",
 *   publication: "TCGPlayer Infinite",
 *   publish_date: "2025-11-15",
 *   source_url: "...",
 *   unique_id: "tcgplayer_article_12345"
 * }
 */
