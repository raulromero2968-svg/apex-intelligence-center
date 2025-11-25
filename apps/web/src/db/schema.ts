/**
 * Database schema definitions for Apex Intelligence
 *
 * This schema includes the TCG RAG system for provenance-tracked market intelligence
 * Production-ready models for Card, Price, Sale, PopulationReport, Portfolio, Arbitrage, etc.
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real, serial, check, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

/**
 * Custom pgvector type for Drizzle ORM
 * Represents a vector(n) column type for storing embeddings
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return config?.dimensions ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // pgvector returns vectors as '[1,2,3]' format
    return value.slice(1, -1).split(',').map(Number);
  },
});

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

  // Vector embedding - pgvector extension
  // TODO: Re-add embedding column after fixing Drizzle type issues
  // embedding: sql`vector(1536)`,

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

/**
 * Multi-Modal Embeddings table for AI-powered video generation
 *
 * Stores multi-modal embeddings for images (CLIP) and audio (Wav2Vec2) to enable
 * RAG-based retrieval for personalized video generation. Supports hybrid search
 * for finding similar faces, poses, expressions, and voice characteristics.
 *
 * Features:
 * - Vector embeddings (512-dim for CLIP, 768-dim for Wav2Vec2)
 * - Support for both image and audio modalities
 * - User-specific embeddings for personalization
 * - File storage references (S3/local)
 * - HNSW indexing for fast similarity search
 */
export const multiModalEmbeddings = pgTable('multi_modal_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference for personalization
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Modality type (image or audio)
  type: text('type', {
    enum: ['image', 'audio']
  }).notNull(),

  // Vector embedding - dimension varies by type:
  // - image (CLIP ViT-B/32): 512 dimensions
  // - audio (Wav2Vec2): 768 dimensions
  // Using 768 to accommodate both (images will be padded/truncated if needed)
  embedding: vector('embedding', { dimensions: 768 }).notNull(),

  // File storage reference (S3 URL or local path)
  fileUrl: text('file_url').notNull(),

  // Additional metadata (facial landmarks, audio features, etc.)
  metadata: jsonb('metadata').$type<{
    filename?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // for audio
    width?: number; // for images
    height?: number; // for images
    faceLandmarks?: any; // facial landmarks for face embeddings
    emotionScores?: any; // emotion detection results
    voiceCharacteristics?: any; // pitch, tone, etc.
    [key: string]: any;
  }>().notNull().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index on user for quick user-specific queries
  userIdx: index('idx_multimodal_user').on(table.userId),
  // Index on type for filtering by modality
  typeIdx: index('idx_multimodal_type').on(table.type),
  // Composite index for common query patterns
  userTypeIdx: index('idx_multimodal_user_type').on(table.userId, table.type),
  // Timestamp index for temporal queries
  createdAtIdx: index('idx_multimodal_created_at').on(table.createdAt),
  // HNSW index for vector similarity (created in migration)
  // embeddingIdx: index('idx_multimodal_embedding').on(table.embedding).using('hnsw'),
}));

/**
 * Video Generation Requests - Track video generation jobs
 *
 * Stores metadata about video generation requests including script,
 * settings, status, and output file references.
 */
export const videoGenerationRequests = pgTable('video_generation_requests', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Request parameters
  script: text('script').notNull(),
  setting: text('setting').notNull(), // e.g., "cyberpunk", "professional", "casual"
  duration: integer('duration').notNull(), // in seconds

  // Status tracking
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed']
  }).default('pending').notNull(),

  // Output references
  outputUrl: text('output_url'), // S3 URL or local path to generated video

  // Processing metadata
  processingStartedAt: timestamp('processing_started_at'),
  processingCompletedAt: timestamp('processing_completed_at'),
  errorMessage: text('error_message'),

  // RAG retrieval metadata (which embeddings were used)
  retrievalMetadata: jsonb('retrieval_metadata').$type<{
    imageEmbeddingIds?: string[];
    audioEmbeddingIds?: string[];
    similarityScores?: number[];
    [key: string]: any;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_video_gen_user').on(table.userId),
  statusIdx: index('idx_video_gen_status').on(table.status),
  createdAtIdx: index('idx_video_gen_created_at').on(table.createdAt),
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
  sevenDayGainPercent: real('seven_day_gain_percent'), // 7-day price gain percentage
  isManipulated: boolean('is_manipulated').default(false), // Market manipulation flag
  manipulationReason: text('manipulation_reason'), // Reason for manipulation flag
  lastFlaggedAt: timestamp('last_flagged_at'), // When manipulation was last detected
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
  breakModeUntil: timestamp('break_mode_until'),
  breakModeActivatedBy: text('break_mode_activated_by', {
    enum: ['child', 'parent']
  }),
  // Trust Score System (13_LAUNCH_02)
  trustScore: integer('trust_score').default(10).notNull(),
  dataPoints: integer('data_points').default(0).notNull(), // For $APEX airdrop
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  nftMinted: boolean('nft_minted').default(false).notNull(), // Founding Member NFT
  walletAddress: text('wallet_address'), // Base wallet for NFT
  // Parent Dashboard (PROMPT_06)
  parentId: text('parent_id').references((): any => users.id, { onDelete: 'cascade' }),
  accountType: text('account_type', {
    enum: ['parent', 'child', 'independent']
  }).default('independent').notNull(),
  accountFrozen: boolean('account_frozen').default(false).notNull(),
  accountFrozenAt: timestamp('account_frozen_at'),
  accountFrozenBy: text('account_frozen_by'), // Parent user ID
  bedtimeEnabled: boolean('bedtime_enabled').default(false).notNull(),
  bedtimeStart: text('bedtime_start'), // HH:MM format
  bedtimeEnd: text('bedtime_end'), // HH:MM format
  cooldownEnabled: boolean('cooldown_enabled').default(true).notNull(),
  spendingLimitCents: integer('spending_limit_cents').default(0).notNull(), // Always $0 for child accounts
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Session History - Tracks user session activity for parent monitoring
 */
export const sessionHistory = pgTable('session_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionStart: timestamp('session_start').notNull(),
  sessionEnd: timestamp('session_end'),
  durationMinutes: integer('duration_minutes'),
  pagesViewed: integer('pages_viewed').default(0).notNull(),
  cardsViewed: jsonb('cards_viewed').$type<string[]>().default([]).notNull(),
  actionsPerformed: jsonb('actions_performed').$type<Array<{ type: string; timestamp: string; details?: any }>>().default([]).notNull(),
  deviceInfo: jsonb('device_info').$type<{ userAgent?: string; platform?: string; isMobile?: boolean }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_session_history_user').on(table.userId),
  sessionStartIdx: index('idx_session_history_start').on(table.sessionStart),
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
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  spreadExpiresIdx: index('idx_arb_spread_expires').on(table.spreadPct, table.expiresAt),
  cardIdx: index('idx_arb_card').on(table.cardId),
}));

/**
 * Card Forensics - AI-powered card authenticity analysis
 *
 * Stores comprehensive forensic analysis of TCG cards including:
 * - Visual embeddings for similarity matching (768-dim CLIP vectors)
 * - Structured reasoning trace for explainability
 * - Detected defects catalog
 * - Authenticity scoring
 */
export const cardForensics = pgTable('card_forensics', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  // pgvector extension - stores as vector(768) for CLIP ViT-L/14
  // TODO: Re-add embedding column after fixing Drizzle type issues
  // embedding: sql`vector(768)`,
  reasoningTrace: jsonb('reasoning_trace').notNull().default({}),
  detectedDefects: jsonb('detected_defects').notNull().default({}),
  authenticityScore: real('authenticity_score').notNull(),
  modelVersion: text('model_version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cardIdIdx: index('idx_card_forensics_card_id').on(table.cardId),
  authenticityScoreIdx: index('idx_card_forensics_authenticity_score').on(table.authenticityScore),
  modelVersionIdx: index('idx_card_forensics_model_version').on(table.modelVersion),
  createdAtIdx: index('idx_card_forensics_created_at').on(table.createdAt),
  uniqueCard: uniqueIndex('card_forensics_card_unique').on(table.cardId),
}));

/**
 * Manipulation Alerts - Detected coordinated pump patterns
 *
 * Stores alerts when LAMP + Contrarian detect volume spikes (>40%) with no organic drivers.
 * Used to display warning banners and send notifications to users.
 */
export const manipulationAlerts = pgTable('manipulation_alerts', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  volumeSpikePct: real('volume_spike_pct').notNull(),
  baselineVolume: real('baseline_volume').notNull(),
  currentVolume: integer('current_volume').notNull(),
  lampSentiment: text('lamp_sentiment', {
    enum: ['bullish', 'bearish', 'neutral']
  }).notNull(),
  contrarianDiversity: real('contrarian_diversity').notNull(),
  severity: text('severity', {
    enum: ['warning', 'critical']
  }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  detectedAt: timestamp('detected_at').notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardActiveIdx: index('idx_manipulation_card_active').on(table.cardId, table.isActive),
  severityIdx: index('idx_manipulation_severity').on(table.severity),
  detectedAtIdx: index('idx_manipulation_detected').on(table.detectedAt),
}));

/**
 * Market Submissions - Crowdsourced sale data from users
 *
 * Architecture: 13_LAUNCH_02
 * Users submit verified sales with proof (receipt/PWCC link/Goldin link)
 * VARC validates card identity from uploaded images
 * Trust score system prevents spam and fake submissions
 */
export const marketSubmissions = pgTable('market_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('USD'),
  saleDate: timestamp('sale_date').notNull(),
  grade: text('grade'),
  gradingCompany: text('grading_company'),
  certNumber: text('cert_number'),
  proofUrl: text('proof_url').notNull(), // S3 URL or external link
  proofType: text('proof_type', {
    enum: ['receipt', 'auction_link', 'marketplace_screenshot']
  }).notNull(),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected']
  }).default('pending').notNull(),
  verifiedByVarc: boolean('verified_by_varc').default(false).notNull(),
  varcConfidence: real('varc_confidence'), // 0.0-1.0
  reviewedBy: text('reviewed_by'), // Admin user ID
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_submissions_user').on(table.userId),
  cardIdx: index('idx_submissions_card').on(table.cardId),
  statusIdx: index('idx_submissions_status').on(table.status),
  createdIdx: index('idx_submissions_created').on(table.createdAt),
}));

/**
 * Spend Tracking - Tracks all payment transactions for spend limit enforcement
 *
 * Implements unbreakable daily ($50) and weekly ($200) spend limits across:
 * - Stripe payments (subscriptions, one-time)
 * - On-chain payments (crypto)
 *
 * Uses rolling windows: 24h for daily, 7d for weekly
 */
export const spendTracking = pgTable('spend_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Transaction details
  amountUsd: real('amount_usd').notNull(), // Normalized to USD
  paymentType: text('payment_type', {
    enum: ['stripe', 'onchain']
  }).notNull(),

  // Payment-specific identifiers
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeChargeId: text('stripe_charge_id'),
  onchainTxHash: text('onchain_tx_hash'),
  onchainNetwork: text('onchain_network'), // 'ethereum', 'polygon', etc.

  // Status tracking
  status: text('status', {
    enum: ['pending', 'completed', 'failed', 'refunded']
  }).notNull().default('pending'),

  // Metadata
  metadata: jsonb('metadata').$type<{
    currency?: string;
    originalAmount?: number;
    usdRate?: number;
    productId?: string;
    description?: string;
    [key: string]: any;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

}, (table) => ({
  // Critical indexes for spend limit queries
  userCreatedIdx: index('idx_spend_tracking_user_created').on(table.userId, table.createdAt),
  userStatusIdx: index('idx_spend_tracking_user_status').on(table.userId, table.status),
  stripePaymentIntentIdx: index('idx_spend_tracking_stripe_pi').on(table.stripePaymentIntentId),
  onchainTxIdx: index('idx_spend_tracking_onchain_tx').on(table.onchainTxHash),
  createdAtIdx: index('idx_spend_tracking_created').on(table.createdAt),
  // Unique constraints to prevent double-counting
  uniqueStripePayment: uniqueIndex('idx_spend_tracking_stripe_unique').on(table.stripePaymentIntentId),
  uniqueOnchainTx: uniqueIndex('idx_spend_tracking_onchain_unique').on(table.onchainTxHash, table.onchainNetwork),
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
  cardForensics: many(cardForensics),
  manipulationAlerts: many(manipulationAlerts),
  marketSubmissions: many(marketSubmissions),
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
export const usersRelations = relations(users, ({ one, many }) => ({
  portfolios: many(portfolios),
  alertSubscriptions: many(alertSubscriptions),
  pushSubscriptions: many(pushSubscriptions),
  watchlistItems: many(watchlistItems),
  marketSubmissions: many(marketSubmissions),
  sessionHistory: many(sessionHistory),
  multiModalEmbeddings: many(multiModalEmbeddings),
  videoGenerationRequests: many(videoGenerationRequests),
  parentLinks: many(familyLinks, { relationName: 'parent' }),
  childLinks: many(familyLinks, { relationName: 'child' }),
  spendTracking: many(spendTracking),
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id],
  }),
  children: many(users),
}));

/**
 * Session History relations
 */
export const sessionHistoryRelations = relations(sessionHistory, ({ one }) => ({
  user: one(users, {
    fields: [sessionHistory.userId],
    references: [users.id],
  }),
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
 * Card Forensics relations
 */
export const cardForensicsRelations = relations(cardForensics, ({ one }) => ({
  card: one(cards, {
    fields: [cardForensics.cardId],
    references: [cards.id],
  }),
}));

/**
 * Manipulation Alerts relations
 */
export const manipulationAlertsRelations = relations(manipulationAlerts, ({ one }) => ({
  card: one(cards, {
    fields: [manipulationAlerts.cardId],
    references: [cards.id],
  }),
}));

/**
 * Market Submissions relations
 */
export const marketSubmissionsRelations = relations(marketSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [marketSubmissions.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [marketSubmissions.cardId],
    references: [cards.id],
  }),
}));

/**
 * Spend Tracking relations
 */
export const spendTrackingRelations = relations(spendTracking, ({ one }) => ({
  user: one(users, {
    fields: [spendTracking.userId],
    references: [users.id],
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

/**
 * Multi-Modal Embeddings relations
 */
export const multiModalEmbeddingsRelations = relations(multiModalEmbeddings, ({ one }) => ({
  user: one(users, {
    fields: [multiModalEmbeddings.userId],
    references: [users.id],
  }),
}));

/**
 * Video Generation Requests relations
 */
export const videoGenerationRequestsRelations = relations(videoGenerationRequests, ({ one }) => ({
  user: one(users, {
    fields: [videoGenerationRequests.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// PARENT DASHBOARD TABLES
// ============================================================================

/**
 * Family Links - OAuth-based parent-child account linking
 *
 * Allows parents to link child accounts for supervision and monitoring.
 * Uses OAuth flow for secure authorization.
 */
export const familyLinks = pgTable('family_links', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', {
    enum: ['pending', 'active', 'revoked']
  }).default('pending').notNull(),
  // OAuth tokens for accessing child's data
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  // Child cannot revoke this link
  childCannotRevoke: boolean('child_cannot_revoke').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  parentIdx: index('idx_family_links_parent').on(table.parentId),
  childIdx: index('idx_family_links_child').on(table.childId),
  statusIdx: index('idx_family_links_status').on(table.status),
  uniqueParentChild: uniqueIndex('idx_family_links_parent_child_unique').on(table.parentId, table.childId),
}));

/**
 * Parental Controls - Per-child control settings
 *
 * Stores all parental control configurations including:
 * - Bedtime mode (disables trading during specified hours)
 * - Cool down mode (enforces waiting periods between trades)
 * - Notification controls (parent can disable child's notifications)
 */
export const parentalControls = pgTable('parental_controls', {
  id: text('id').primaryKey(),
  familyLinkId: text('family_link_id').notNull().references(() => familyLinks.id, { onDelete: 'cascade' }),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Bedtime mode
  bedtimeEnabled: boolean('bedtime_enabled').default(false).notNull(),
  bedtimeStart: text('bedtime_start'), // e.g., "21:00"
  bedtimeEnd: text('bedtime_end'), // e.g., "07:00"
  bedtimeTimezone: text('bedtime_timezone').default('America/New_York'),

  // Cool down mode
  coolDownEnabled: boolean('cool_down_enabled').default(false).notNull(),
  coolDownMinutes: integer('cool_down_minutes').default(30), // Minutes between actions

  // Notification controls
  notificationsDisabled: boolean('notifications_disabled').default(false).notNull(),
  disabledChannels: jsonb('disabled_channels').$type<string[]>().default([]), // ["email", "push", "discord"]

  // Activity limits
  dailyTradingLimit: integer('daily_trading_limit'), // Max trades per day
  maxPortfolioValue: real('max_portfolio_value'), // Max USD value

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  childIdx: index('idx_parental_controls_child').on(table.childId),
  familyLinkIdx: index('idx_parental_controls_family_link').on(table.familyLinkId),
  uniqueChild: uniqueIndex('idx_parental_controls_child_unique').on(table.childId),
}));

/**
 * Child Activity History - Tracks child activity for parent monitoring
 *
 * Records all significant child activities for real-time monitoring and history review.
 */
export const childActivityHistory = pgTable('child_activity_history', {
  id: text('id').primaryKey(),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Activity details
  activityType: text('activity_type').notNull(), // "login" | "trade" | "watchlist_add" | "alert_set" | "portfolio_update"
  activityData: jsonb('activity_data').$type<Record<string, any>>().notNull(),

  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info'),

  // Timestamps
  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Parental control enforcement
  blockedByBedtime: boolean('blocked_by_bedtime').default(false).notNull(),
  blockedByCoolDown: boolean('blocked_by_cool_down').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  childTimestampIdx: index('idx_child_activity_history_child_timestamp').on(table.childId, table.timestamp.desc()),
  activityTypeIdx: index('idx_child_activity_history_activity_type').on(table.activityType),
  timestampIdx: index('idx_child_activity_history_timestamp').on(table.timestamp.desc()),
}));

/**
 * Family Links relations
 */
export const familyLinksRelations = relations(familyLinks, ({ one, many }) => ({
  parent: one(users, {
    fields: [familyLinks.parentId],
    references: [users.id],
  }),
  child: one(users, {
    fields: [familyLinks.childId],
    references: [users.id],
  }),
  parentalControls: many(parentalControls),
}));

/**
 * Parental Controls relations
 */
export const parentalControlsRelations = relations(parentalControls, ({ one }) => ({
  familyLink: one(familyLinks, {
    fields: [parentalControls.familyLinkId],
    references: [familyLinks.id],
  }),
  child: one(users, {
    fields: [parentalControls.childId],
    references: [users.id],
  }),
}));

/**
 * Child Activity History relations
 */
export const childActivityHistoryRelations = relations(childActivityHistory, ({ one }) => ({
  child: one(users, {
    fields: [childActivityHistory.childId],
    references: [users.id],
  }),
}));

// ============================================================================
// TypeScript types for better DX
// ============================================================================

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collection_items.$inferSelect;
export type NewCollectionItem = typeof collection_items.$inferInsert;
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
export type SessionHistory = typeof sessionHistory.$inferSelect;
export type NewSessionHistory = typeof sessionHistory.$inferInsert;
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
export type CardForensics = typeof cardForensics.$inferSelect;
export type NewCardForensics = typeof cardForensics.$inferInsert;
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
export type ManipulationAlert = typeof manipulationAlerts.$inferSelect;
export type NewManipulationAlert = typeof manipulationAlerts.$inferInsert;
export type MarketSubmission = typeof marketSubmissions.$inferSelect;
export type NewMarketSubmission = typeof marketSubmissions.$inferInsert;
export type MultiModalEmbedding = typeof multiModalEmbeddings.$inferSelect;
export type NewMultiModalEmbedding = typeof multiModalEmbeddings.$inferInsert;
export type VideoGenerationRequest = typeof videoGenerationRequests.$inferSelect;
export type NewVideoGenerationRequest = typeof videoGenerationRequests.$inferInsert;
export type FamilyLink = typeof familyLinks.$inferSelect;
export type NewFamilyLink = typeof familyLinks.$inferInsert;
export type ParentalControl = typeof parentalControls.$inferSelect;
export type NewParentalControl = typeof parentalControls.$inferInsert;
export type ChildActivityHistory = typeof childActivityHistory.$inferSelect;
export type NewChildActivityHistory = typeof childActivityHistory.$inferInsert;
export type SpendTracking = typeof spendTracking.$inferSelect;
export type NewSpendTracking = typeof spendTracking.$inferInsert;

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

// ============================================================================
// AI SCIENTIST PHASE 1 SCHEMA EXPORTS
// ============================================================================
export * from './schema/ai-scientist';
