/**
 * Database schema definitions for Apex Intelligence
 *
 * This schema includes the TCG RAG system for provenance-tracked market intelligence
 * Production-ready models for Card, Price, Sale, PopulationReport, Portfolio, Arbitrage, etc.
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real, serial } from 'drizzle-orm/pg-core';
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
  sevenDayGainPercent: real('seven_day_gain_percent'), // 7-day price gain percentage for analytics/sorting
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  gameApexIdx: index('idx_cards_game_apex').on(table.game, table.apexScore),
  nameIdx: index('idx_cards_name').on(table.name),
  sevenDayGainIdx: index('idx_cards_seven_day_gain').on(table.sevenDayGainPercent),
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
  image: text('image'), // Profile image URL
  parentId: text('parent_id'), // For family hierarchies; optional reference to parent user
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionTier: text('subscription_tier', {
    enum: ['free', 'pro', 'enterprise']
  }).default('free').notNull(),
  subscriptionStatus: text('subscription_status', {
    enum: ['active', 'canceled', 'past_due', 'trialing']
  }),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  parentIdIdx: index('idx_users_parent').on(table.parentId),
}));

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
  baseCollection: text('base_collection'), // Base collection string for filtering
  status: text('status').default('open'), // Status: 'open' | 'closed' | 'expired'
  edgeBps: integer('edge_bps'), // Basis points edge
  estimatedProfitUsd: real('estimated_profit_usd'), // USD profit estimate
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(), // Timestamp for queries
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  spreadExpiresIdx: index('idx_arb_spread_expires').on(table.spreadPct, table.expiresAt),
  cardIdx: index('idx_arb_card').on(table.cardId),
  statusIdx: index('idx_arb_status').on(table.status),
  createdAtIdx: index('idx_arb_created').on(table.createdAt),
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

/**
 * Card Forensics - VARC (Visual Authentication & Rarity Classification) results
 *
 * Stores forensic analysis results from VARC jobs including:
 * - Grade assessment (PSA, BGS, CGC, etc.)
 * - Confidence scores
 * - Counterfeit detection scores
 * - Reasoning trace (JSON structure)
 */
export const cardForensics = pgTable('card_forensics', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: text('job_id').notNull().unique(),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'set null' }),
  imageUrl: text('image_url').notNull(),
  grade: text('grade'), // "PSA 10", "BGS 9.5", etc.
  confidence: real('confidence'), // 0-1 score
  counterfeitScore: real('counterfeit_score'), // 0-1, higher = more likely counterfeit
  reasoningTrace: jsonb('reasoning_trace').notNull().default({}),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  jobIdIdx: index('idx_forensics_job').on(table.jobId),
  cardIdIdx: index('idx_forensics_card').on(table.cardId),
  createdAtIdx: index('idx_forensics_created').on(table.createdAt),
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
export type CardForensics = typeof cardForensics.$inferSelect;
export type NewCardForensics = typeof cardForensics.$inferInsert;

// ============================================================================
// VAULT AND FAMILY PROTECTION TABLES
// ============================================================================

/**
 * Vault Jobs - Background processing jobs for secure data operations
 */
export const vaultJobs = pgTable('vault_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // 'backup' | 'restore' | 'sync' | 'export'
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed'
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }), // TCG card reference for card-specific jobs
  priority: integer('priority').default(5), // Job priority (1-10, lower = higher priority)
  payload: jsonb('payload'),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_vault_jobs_status').on(table.status),
  userIdx: index('idx_vault_jobs_user').on(table.userId),
  cardIdx: index('idx_vault_jobs_card').on(table.cardId),
  priorityIdx: index('idx_vault_jobs_priority').on(table.priority),
}));

/**
 * Family Links - Parent-child account relationships for family protection
 */
export const familyLinks = pgTable('family_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'revoked'
  permissions: jsonb('permissions').$type<{
    canViewActivity: boolean;
    canSetLimits: boolean;
    canApproveTransactions: boolean;
    spendingLimit?: number;
  }>().default({}),
  linkedAt: timestamp('linked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  parentIdx: index('idx_family_links_parent').on(table.parentId),
  childIdx: index('idx_family_links_child').on(table.childId),
  uniqueLink: uniqueIndex('idx_family_links_unique').on(table.parentId, table.childId),
}));

/**
 * Child Activity History - Activity tracking for minor protection
 */
export const childActivityHistory = pgTable('child_activity_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: text('activity_type').notNull(), // 'purchase' | 'view' | 'search' | 'bid'
  activityData: jsonb('activity_data').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(), // Activity time for time-based queries
  flagged: boolean('flagged').default(false).notNull(),
  flagReason: text('flag_reason'),
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  childIdx: index('idx_child_activity_child').on(table.childId),
  typeIdx: index('idx_child_activity_type').on(table.activityType),
  flaggedIdx: index('idx_child_activity_flagged').on(table.flagged),
  timestampIdx: index('idx_child_activity_timestamp').on(table.timestamp),
}));

/**
 * Manipulation Alerts - Market manipulation detection alerts
 */
export const manipulationAlerts = pgTable('manipulation_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  alertType: text('alert_type').notNull(), // 'price_spike' | 'wash_trading' | 'pump_dump' | 'artificial_scarcity'
  severity: text('severity').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  confidence: real('confidence').notNull(), // 0-1 confidence score
  details: jsonb('details').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'acknowledged' | 'dismissed' | 'resolved'
  isActive: boolean('is_active').default(true).notNull(), // Alert status for filtering active alerts
  detectedAt: timestamp('detected_at').defaultNow().notNull(), // Detection time for sorting
  acknowledgedBy: text('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  cardIdx: index('idx_manipulation_alerts_card').on(table.cardId),
  typeIdx: index('idx_manipulation_alerts_type').on(table.alertType),
  severityIdx: index('idx_manipulation_alerts_severity').on(table.severity),
  statusIdx: index('idx_manipulation_alerts_status').on(table.status),
  isActiveIdx: index('idx_manipulation_alerts_active').on(table.isActive),
  detectedAtIdx: index('idx_manipulation_alerts_detected').on(table.detectedAt),
}));

/**
 * Video Generation Requests - AI video generation job tracking
 */
export const videoGenerationRequests = pgTable('video_generation_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  prompt: text('prompt').notNull(),
  style: text('style'), // 'cinematic' | 'documentary' | 'promotional' | 'tutorial'
  duration: integer('duration'), // seconds
  inputAssets: jsonb('input_assets').$type<string[]>().default([]),
  outputUrl: text('output_url'),
  thumbnailUrl: text('thumbnail_url'),
  metadata: jsonb('metadata'),
  errorMessage: text('error_message'),
  processingStartedAt: timestamp('processing_started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_video_gen_user').on(table.userId),
  statusIdx: index('idx_video_gen_status').on(table.status),
}));

// Type exports for new tables
export type VaultJob = typeof vaultJobs.$inferSelect;
export type NewVaultJob = typeof vaultJobs.$inferInsert;
export type FamilyLink = typeof familyLinks.$inferSelect;
export type NewFamilyLink = typeof familyLinks.$inferInsert;
export type ChildActivityHistory = typeof childActivityHistory.$inferSelect;
export type NewChildActivityHistory = typeof childActivityHistory.$inferInsert;
export type ManipulationAlert = typeof manipulationAlerts.$inferSelect;
export type NewManipulationAlert = typeof manipulationAlerts.$inferInsert;
export type VideoGenerationRequest = typeof videoGenerationRequests.$inferSelect;
export type NewVideoGenerationRequest = typeof videoGenerationRequests.$inferInsert;

// ============================================================================
// ECONOMIC INFRASTRUCTURE: OMNIS, INTELLIGENCE, RC ECONOMY
// ============================================================================

/**
 * Omnis Sources - Connected data sources for intelligence extraction
 *
 * Users connect their accounts (Upwork, Twitter, Notion, etc.) and Omnis
 * extracts structured intelligence primitives from their past work.
 */
export const omnisSources = pgTable('omnis_sources', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull(), // 'upwork' | 'twitter' | 'notion' | 'github' | 'upload'
  displayName: text('display_name').notNull(),
  credentials: text('credentials'), // Encrypted OAuth tokens or API keys
  lastSyncAt: timestamp('last_sync_at'),
  itemCount: integer('item_count').default(0),
  status: text('status').notNull().default('active'), // 'active' | 'error' | 'disconnected'
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_omnis_sources_user').on(table.userId),
  typeIdx: index('idx_omnis_sources_type').on(table.sourceType),
  statusIdx: index('idx_omnis_sources_status').on(table.status),
}));

/**
 * Omnis Primitives - Extracted intelligence primitives awaiting user approval
 *
 * AI processes connected sources and generates structured intel primitives.
 * Users review, refine, and approve these before they become Intel Cards.
 */
export const omnisPrimitives = pgTable('omnis_primitives', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceId: text('source_id').notNull().references(() => omnisSources.id, { onDelete: 'cascade' }),
  sourceItemId: text('source_item_id'), // Original ID in the source system
  sourceUrl: text('source_url'), // Link to original content
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  fullContent: text('full_content').notNull(),
  keyInsights: jsonb('key_insights').$type<string[]>(),
  topics: jsonb('topics').$type<string[]>(),
  entities: jsonb('entities').$type<Array<{ name: string; type: string; }>>(),
  expertiseLevel: text('expertise_level').default('intermediate'), // 'beginner' | 'intermediate' | 'expert'
  confidenceScore: real('confidence_score'), // AI confidence in extraction quality
  suggestedPrice: real('suggested_price'), // AI-suggested price based on similar content
  status: text('status').notNull().default('draft'), // 'draft' | 'approved' | 'rejected' | 'published'
  intelCardId: text('intel_card_id'), // Reference to created Intel Card (after approval)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_omnis_primitives_user').on(table.userId),
  sourceIdx: index('idx_omnis_primitives_source').on(table.sourceId),
  statusIdx: index('idx_omnis_primitives_status').on(table.status),
}));

/**
 * Intel Cards - Marketplace intelligence assets
 *
 * The core marketplace entity. Users create, price, and sell intel cards.
 * Buyers purchase with USD, creators earn USD + RC.
 */
export const intelCards = pgTable('intel_cards', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  summary: text('summary').notNull(), // Public preview (shown to non-buyers)
  fullContent: text('full_content').notNull(), // Paid content (hidden until purchase)
  attachments: jsonb('attachments').$type<Array<{ name: string; url: string; type: string; size: number; }>>(),
  category: text('category').notNull(), // 'report' | 'analysis' | 'framework' | 'tutorial' | 'template'
  topics: jsonb('topics').$type<string[]>(),
  expertiseLevel: text('expertise_level').notNull().default('intermediate'),
  priceUsd: real('price_usd').notNull(),
  views: integer('views').default(0),
  purchases: integer('purchases').default(0),
  revenue: real('revenue').default(0), // Total USD revenue
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  averageRating: real('average_rating'),
  rcEarned: integer('rc_earned').default(0), // Total RC earned from this card
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'archived'
  visibility: text('visibility').notNull().default('public'), // 'public' | 'unlisted' | 'private'
  sourceId: text('source_id'), // Reference to Omnis primitive (if created from Omnis)
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('idx_intel_cards_author').on(table.authorId),
  statusIdx: index('idx_intel_cards_status').on(table.status),
  categoryIdx: index('idx_intel_cards_category').on(table.category),
  priceIdx: index('idx_intel_cards_price').on(table.priceUsd),
  publishedIdx: index('idx_intel_cards_published').on(table.publishedAt),
}));

/**
 * Intel Purchases - Marketplace transactions
 *
 * Records each purchase with full financial breakdown.
 * Triggers RC rewards for creators.
 */
export const intelPurchases = pgTable('intel_purchases', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => intelCards.id, { onDelete: 'cascade' }),
  amountUsd: real('amount_usd').notNull(),
  creatorShareUsd: real('creator_share_usd').notNull(), // 85% to creator
  platformShareUsd: real('platform_share_usd').notNull(), // 15% to platform
  stripePaymentId: text('stripe_payment_id'),
  stripeTransferId: text('stripe_transfer_id'), // Creator payout transfer
  status: text('status').notNull().default('completed'), // 'pending' | 'completed' | 'refunded'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  buyerIdx: index('idx_intel_purchases_buyer').on(table.buyerId),
  cardIdx: index('idx_intel_purchases_card').on(table.cardId),
  createdIdx: index('idx_intel_purchases_created').on(table.createdAt),
}));

/**
 * Intel Votes - Upvotes/downvotes on intel cards
 *
 * Community quality signals that affect visibility and creator RC.
 */
export const intelVotes = pgTable('intel_votes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => intelCards.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(), // +1 or -1
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueVote: uniqueIndex('idx_intel_votes_unique').on(table.userId, table.cardId),
  cardIdx: index('idx_intel_votes_card').on(table.cardId),
}));

/**
 * Intel Ratings - Detailed ratings from buyers
 *
 * Only purchasers can rate, ensuring authentic feedback.
 */
export const intelRatings = pgTable('intel_ratings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => intelCards.id, { onDelete: 'cascade' }),
  purchaseId: text('purchase_id').notNull().references(() => intelPurchases.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  review: text('review'),
  helpful: integer('helpful').default(0), // How many found this review helpful
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueRating: uniqueIndex('idx_intel_ratings_unique').on(table.userId, table.cardId),
  cardIdx: index('idx_intel_ratings_card').on(table.cardId),
}));

/**
 * RC Transactions - Immutable ledger of all Reputation Credit movements
 *
 * Every RC earn or spend is recorded here for full transparency.
 * This is the source of truth for user RC balances.
 */
export const rcTransactions = pgTable('rc_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Positive for earn, negative for spend
  reason: text('reason').notNull(), // Enum-like string
  sourceProduct: text('source_product').notNull(), // 'omnis' | 'intelligence' | 'commons' | 'governance' | 'system'
  referenceType: text('reference_type'), // 'intel_card' | 'proposal' | 'vote' | etc.
  referenceId: text('reference_id'), // ID of the related entity
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  balanceAfter: integer('balance_after').notNull(), // Snapshot of balance after this transaction
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_rc_transactions_user').on(table.userId),
  reasonIdx: index('idx_rc_transactions_reason').on(table.reason),
  productIdx: index('idx_rc_transactions_product').on(table.sourceProduct),
  createdIdx: index('idx_rc_transactions_created').on(table.createdAt),
}));

/**
 * RC Reasons - Valid reasons for RC transactions
 *
 * Documented for reference:
 * - 'omnis_connect_first': +50 RC - Connecting first source
 * - 'omnis_batch_process': +25 RC - Processing 10+ items
 * - 'intel_first_publish': +100 RC - Publishing first intel card
 * - 'intel_purchased': +10 RC - Someone purchased your intel
 * - 'intel_upvoted': +5 RC - Per 10 net upvotes
 * - 'intel_5star_rating': +15 RC - Receiving 5-star rating
 * - 'commons_publish': +25 RC - Publishing to Commons
 * - 'commons_upvoted': +3 RC - Per 10 net upvotes on Commons
 * - 'commons_downloaded': +1 RC - Per 100 downloads
 * - 'governance_vote': +5 RC - Voting on a proposal
 * - 'governance_proposal_passed': +25 RC - Voted with majority on passed proposal
 * - 'manual_adjustment': Admin adjustment
 */

/**
 * User RC Profile - Extended user data for the hybrid economy
 *
 * Extends the base users table with RC-specific fields.
 */
export const userRcProfiles = pgTable('user_rc_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  rcBalance: integer('rc_balance').notNull().default(0),
  rcLifetime: integer('rc_lifetime').notNull().default(0), // Total earned (never decreases)
  contributorLevel: text('contributor_level').notNull().default('newcomer'), // 'newcomer' | 'creator' | 'curator' | 'moderator' | 'governor'
  role: text('role').notNull().default('user'), // 'user' | 'teacher' | 'moderator' | 'admin'
  bio: text('bio'),
  subjects: jsonb('subjects').$type<string[]>(),
  expertiseAreas: jsonb('expertise_areas').$type<string[]>(),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  usdEarningsLifetime: real('usd_earnings_lifetime').default(0),
  usdEarningsMonth: real('usd_earnings_month').default(0),
  intelCardsPublished: integer('intel_cards_published').default(0),
  intelCardsSold: integer('intel_cards_sold').default(0),
  totalViews: integer('total_views').default(0),
  totalPurchases: integer('total_purchases').default(0),
  averageRating: real('average_rating'),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  rcBalanceIdx: index('idx_user_rc_balance').on(table.rcBalance),
  levelIdx: index('idx_user_rc_level').on(table.contributorLevel),
  roleIdx: index('idx_user_rc_role').on(table.role),
}));

/**
 * Governance Proposals - Community governance proposals
 *
 * Users with sufficient RC can create proposals for platform changes.
 * RC-weighted voting determines outcomes.
 */
export const governanceProposals = pgTable('governance_proposals', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull(), // 'feature' | 'policy' | 'economics' | 'protocol'
  status: text('status').notNull().default('draft'), // 'draft' | 'active' | 'passed' | 'rejected' | 'withdrawn'
  minRcToVote: integer('min_rc_to_vote').default(100),
  minRcToCreate: integer('min_rc_to_create').default(500),
  authorRcSnapshot: integer('author_rc_snapshot').notNull(), // Author's RC when proposal created
  votingStartsAt: timestamp('voting_starts_at'),
  votingEndsAt: timestamp('voting_ends_at'),
  quorumRc: integer('quorum_rc').notNull(), // Minimum RC required for valid vote
  forRc: integer('for_rc').default(0), // Total RC voted FOR
  againstRc: integer('against_rc').default(0), // Total RC voted AGAINST
  abstainRc: integer('abstain_rc').default(0), // Total RC voted ABSTAIN
  voteCount: integer('vote_count').default(0),
  passedAt: timestamp('passed_at'),
  implementedAt: timestamp('implemented_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('idx_governance_proposals_author').on(table.authorId),
  statusIdx: index('idx_governance_proposals_status').on(table.status),
  categoryIdx: index('idx_governance_proposals_category').on(table.category),
  votingIdx: index('idx_governance_proposals_voting').on(table.votingStartsAt, table.votingEndsAt),
}));

/**
 * Governance Votes - Individual votes on proposals
 *
 * RC-weighted voting. Vote weight = user's RC balance at vote time.
 */
export const governanceVotes = pgTable('governance_votes', {
  id: text('id').primaryKey(),
  proposalId: text('proposal_id').notNull().references(() => governanceProposals.id, { onDelete: 'cascade' }),
  voterId: text('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  choice: text('choice').notNull(), // 'for' | 'against' | 'abstain'
  weightRc: integer('weight_rc').notNull(), // Voter's RC at time of vote
  reason: text('reason'), // Optional explanation
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueVote: uniqueIndex('idx_governance_votes_unique').on(table.proposalId, table.voterId),
  proposalIdx: index('idx_governance_votes_proposal').on(table.proposalId),
  voterIdx: index('idx_governance_votes_voter').on(table.voterId),
}));

/**
 * Intel Bundles - Grouped intel cards sold together at a discount
 */
export const intelBundles = pgTable('intel_bundles', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priceUsd: real('price_usd').notNull(),
  originalPriceUsd: real('original_price_usd').notNull(), // Sum of individual card prices
  discountPercent: real('discount_percent').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'archived'
  purchases: integer('purchases').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('idx_intel_bundles_author').on(table.authorId),
  statusIdx: index('idx_intel_bundles_status').on(table.status),
}));

/**
 * Intel Bundle Items - Junction table for bundle contents
 */
export const intelBundleItems = pgTable('intel_bundle_items', {
  id: text('id').primaryKey(),
  bundleId: text('bundle_id').notNull().references(() => intelBundles.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => intelCards.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bundleIdx: index('idx_intel_bundle_items_bundle').on(table.bundleId),
  uniqueItem: uniqueIndex('idx_intel_bundle_items_unique').on(table.bundleId, table.cardId),
}));

/**
 * User Libraries - Purchased intel cards saved to user's library
 */
export const userLibraries = pgTable('user_libraries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => intelCards.id, { onDelete: 'cascade' }),
  purchaseId: text('purchase_id').references(() => intelPurchases.id, { onDelete: 'set null' }),
  notes: text('notes'), // User's private notes
  isFavorite: boolean('is_favorite').default(false),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueEntry: uniqueIndex('idx_user_libraries_unique').on(table.userId, table.cardId),
  userIdx: index('idx_user_libraries_user').on(table.userId),
  favoriteIdx: index('idx_user_libraries_favorite').on(table.isFavorite),
}));

// ============================================================================
// ECONOMIC INFRASTRUCTURE RELATIONS
// ============================================================================

/**
 * Omnis Sources relations
 */
export const omnisSourcesRelations = relations(omnisSources, ({ one, many }) => ({
  user: one(users, {
    fields: [omnisSources.userId],
    references: [users.id],
  }),
  primitives: many(omnisPrimitives),
}));

/**
 * Omnis Primitives relations
 */
export const omnisPrimitivesRelations = relations(omnisPrimitives, ({ one }) => ({
  user: one(users, {
    fields: [omnisPrimitives.userId],
    references: [users.id],
  }),
  source: one(omnisSources, {
    fields: [omnisPrimitives.sourceId],
    references: [omnisSources.id],
  }),
}));

/**
 * Intel Cards relations
 */
export const intelCardsRelations = relations(intelCards, ({ one, many }) => ({
  author: one(users, {
    fields: [intelCards.authorId],
    references: [users.id],
  }),
  purchases: many(intelPurchases),
  votes: many(intelVotes),
  ratings: many(intelRatings),
  bundleItems: many(intelBundleItems),
}));

/**
 * Intel Purchases relations
 */
export const intelPurchasesRelations = relations(intelPurchases, ({ one }) => ({
  buyer: one(users, {
    fields: [intelPurchases.buyerId],
    references: [users.id],
  }),
  card: one(intelCards, {
    fields: [intelPurchases.cardId],
    references: [intelCards.id],
  }),
}));

/**
 * Intel Votes relations
 */
export const intelVotesRelations = relations(intelVotes, ({ one }) => ({
  user: one(users, {
    fields: [intelVotes.userId],
    references: [users.id],
  }),
  card: one(intelCards, {
    fields: [intelVotes.cardId],
    references: [intelCards.id],
  }),
}));

/**
 * Intel Ratings relations
 */
export const intelRatingsRelations = relations(intelRatings, ({ one }) => ({
  user: one(users, {
    fields: [intelRatings.userId],
    references: [users.id],
  }),
  card: one(intelCards, {
    fields: [intelRatings.cardId],
    references: [intelCards.id],
  }),
  purchase: one(intelPurchases, {
    fields: [intelRatings.purchaseId],
    references: [intelPurchases.id],
  }),
}));

/**
 * RC Transactions relations
 */
export const rcTransactionsRelations = relations(rcTransactions, ({ one }) => ({
  user: one(users, {
    fields: [rcTransactions.userId],
    references: [users.id],
  }),
}));

/**
 * User RC Profiles relations
 */
export const userRcProfilesRelations = relations(userRcProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userRcProfiles.userId],
    references: [users.id],
  }),
}));

/**
 * Governance Proposals relations
 */
export const governanceProposalsRelations = relations(governanceProposals, ({ one, many }) => ({
  author: one(users, {
    fields: [governanceProposals.authorId],
    references: [users.id],
  }),
  votes: many(governanceVotes),
}));

/**
 * Governance Votes relations
 */
export const governanceVotesRelations = relations(governanceVotes, ({ one }) => ({
  proposal: one(governanceProposals, {
    fields: [governanceVotes.proposalId],
    references: [governanceProposals.id],
  }),
  voter: one(users, {
    fields: [governanceVotes.voterId],
    references: [users.id],
  }),
}));

/**
 * Intel Bundles relations
 */
export const intelBundlesRelations = relations(intelBundles, ({ one, many }) => ({
  author: one(users, {
    fields: [intelBundles.authorId],
    references: [users.id],
  }),
  items: many(intelBundleItems),
}));

/**
 * Intel Bundle Items relations
 */
export const intelBundleItemsRelations = relations(intelBundleItems, ({ one }) => ({
  bundle: one(intelBundles, {
    fields: [intelBundleItems.bundleId],
    references: [intelBundles.id],
  }),
  card: one(intelCards, {
    fields: [intelBundleItems.cardId],
    references: [intelCards.id],
  }),
}));

/**
 * User Libraries relations
 */
export const userLibrariesRelations = relations(userLibraries, ({ one }) => ({
  user: one(users, {
    fields: [userLibraries.userId],
    references: [users.id],
  }),
  card: one(intelCards, {
    fields: [userLibraries.cardId],
    references: [intelCards.id],
  }),
  purchase: one(intelPurchases, {
    fields: [userLibraries.purchaseId],
    references: [intelPurchases.id],
  }),
}));

// ============================================================================
// ECONOMIC INFRASTRUCTURE TYPE EXPORTS
// ============================================================================

export type OmnisSource = typeof omnisSources.$inferSelect;
export type NewOmnisSource = typeof omnisSources.$inferInsert;
export type OmnisPrimitive = typeof omnisPrimitives.$inferSelect;
export type NewOmnisPrimitive = typeof omnisPrimitives.$inferInsert;
export type IntelCard = typeof intelCards.$inferSelect;
export type NewIntelCard = typeof intelCards.$inferInsert;
export type IntelPurchase = typeof intelPurchases.$inferSelect;
export type NewIntelPurchase = typeof intelPurchases.$inferInsert;
export type IntelVote = typeof intelVotes.$inferSelect;
export type NewIntelVote = typeof intelVotes.$inferInsert;
export type IntelRating = typeof intelRatings.$inferSelect;
export type NewIntelRating = typeof intelRatings.$inferInsert;
export type RcTransaction = typeof rcTransactions.$inferSelect;
export type NewRcTransaction = typeof rcTransactions.$inferInsert;
export type UserRcProfile = typeof userRcProfiles.$inferSelect;
export type NewUserRcProfile = typeof userRcProfiles.$inferInsert;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type NewGovernanceProposal = typeof governanceProposals.$inferInsert;
export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type NewGovernanceVote = typeof governanceVotes.$inferInsert;
export type IntelBundle = typeof intelBundles.$inferSelect;
export type NewIntelBundle = typeof intelBundles.$inferInsert;
export type IntelBundleItem = typeof intelBundleItems.$inferSelect;
export type NewIntelBundleItem = typeof intelBundleItems.$inferInsert;
export type UserLibrary = typeof userLibraries.$inferSelect;
export type NewUserLibrary = typeof userLibraries.$inferInsert;

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

