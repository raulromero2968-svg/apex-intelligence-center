/**
 * Intel Reports Schema - User-Generated Market Intelligence with RAG Search
 *
 * Implements RAG (Retrieval-Augmented Generation) for report discoverability
 * in /commons and /rc-market. Uses hybrid search (vector + keyword) with
 * pgvector embeddings for semantic search.
 *
 * Key Features:
 * - OpenAI text-embedding-ada-002 embeddings (1536 dimensions)
 * - HNSW index for fast approximate nearest-neighbor search
 * - Support for both Commons (free) and RC Market (paid) posting
 * - TCG card integration for linking reports to specific cards
 *
 * Reference: knowledge-02-ai-rag-architecture-v2.md
 *
 * @module intelReports
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  boolean,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Report tier determines visibility and pricing
 * - free: Available to all users (Commons)
 * - premium: Requires RC to access (RC Market)
 * - exclusive: Limited availability or subscription-only
 */
export const reportTierEnum = pgEnum('intel_report_tier', [
  'free',
  'premium',
  'exclusive',
]);

/**
 * Report category for filtering and discovery
 */
export const reportCategoryEnum = pgEnum('intel_report_category', [
  'market_analysis',
  'price_prediction',
  'set_review',
  'card_spotlight',
  'grading_guide',
  'investment_strategy',
  'breaking_news',
  'tutorial',
  'opinion',
  'research',
]);

/**
 * Report status for moderation workflow
 */
export const reportStatusEnum = pgEnum('intel_report_status', [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
]);

/**
 * Posting destination for reports
 */
export const postingDestinationEnum = pgEnum('intel_posting_destination', [
  'commons',
  'rc_market',
  'both',
]);

// =============================================================================
// INTEL REPORTS TABLE
// =============================================================================

/**
 * Intel Reports table - Core table for user-generated intelligence
 *
 * Stores market analysis, predictions, and insights from community members.
 * Supports RAG search via pgvector embeddings with hybrid search.
 *
 * Query patterns:
 * - Semantic search: embedding <=> query_embedding
 * - Keyword search: to_tsvector('english', content) @@ websearch_to_tsquery
 * - Hybrid: RRF fusion of both approaches
 */
export const intelReports = pgTable(
  'intel_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Author reference
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Core content
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    summary: text('summary'), // Short excerpt (max 280 chars)
    content: text('content').notNull(), // Full markdown content

    // Classification
    category: reportCategoryEnum('category').notNull().default('market_analysis'),
    tier: reportTierEnum('tier').notNull().default('free'),
    status: reportStatusEnum('status').notNull().default('draft'),
    postedTo: postingDestinationEnum('posted_to').notNull().default('commons'),

    // Pricing (for RC Market)
    price: integer('price').default(0), // Price in RC (0 = free)

    // TCG-specific metadata
    game: text('game').default('pokemon'), // pokemon, mtg, lorcana, yugioh, one_piece, flesh_and_blood
    setCode: text('set_code'), // e.g., "SV06" for Twilight Masquerade
    cardIds: jsonb('card_ids').$type<string[]>().default([]), // Referenced card IDs

    // Tags for discovery
    tags: jsonb('tags').$type<string[]>().default([]),

    // RAG Embedding - OpenAI text-embedding-ada-002 (1536 dimensions)
    // Stored as text for Drizzle compatibility, actual column is vector(1536)
    // Use raw SQL for vector operations
    embedding: text('embedding'),

    // Engagement metrics
    viewCount: integer('view_count').default(0).notNull(),
    likeCount: integer('like_count').default(0).notNull(),
    purchaseCount: integer('purchase_count').default(0).notNull(),
    shareCount: integer('share_count').default(0).notNull(),

    // Quality signals
    qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).default('0'),
    isVerified: boolean('is_verified').default(false), // Moderator verified

    // AI metadata for reports generated with AI assistance
    aiMetadata: jsonb('ai_metadata').$type<{
      modelId?: string;
      tokensUsed?: number;
      generationPrompt?: string;
      confidenceScore?: number;
    }>(),

    // Moderation
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),

    // Lifecycle timestamps
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // User lookup
    userIdx: index('intel_reports_user_idx').on(table.userId),

    // Feed queries: published reports by destination
    publishedDestinationIdx: index('intel_reports_published_destination_idx').on(
      table.status,
      table.postedTo,
      table.publishedAt,
    ),

    // Category filtering
    categoryIdx: index('intel_reports_category_idx').on(table.category),

    // Game filtering
    gameIdx: index('intel_reports_game_idx').on(table.game),

    // Tier filtering for RC Market
    tierIdx: index('intel_reports_tier_idx').on(table.tier),

    // Slug lookup
    slugIdx: index('intel_reports_slug_idx').on(table.slug),

    // Quality-based ranking
    qualityIdx: index('intel_reports_quality_idx').on(table.qualityScore),

    // Full-text search using GIN index (created in migration)
    // contentFtsIdx: defined in migration with to_tsvector

    // HNSW index for vector similarity (created in migration)
    // embeddingHnswIdx: defined in migration with vector_cosine_ops
  }),
);

// =============================================================================
// REPORT PURCHASES TABLE
// =============================================================================

/**
 * Tracks purchases of premium intel reports
 * Enables access control and earnings tracking
 */
export const intelReportPurchases = pgTable(
  'intel_report_purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    reportId: uuid('report_id')
      .notNull()
      .references(() => intelReports.id, { onDelete: 'cascade' }),

    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Transaction details
    pricePaid: integer('price_paid').notNull(), // RC amount
    transactionId: uuid('transaction_id'), // Reference to RC transaction

    // Access tracking
    accessedAt: timestamp('accessed_at', { withTimezone: true }),
    accessCount: integer('access_count').default(0).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdx: index('intel_report_purchases_report_idx').on(table.reportId),
    buyerIdx: index('intel_report_purchases_buyer_idx').on(table.buyerId),
    // Ensure one purchase per buyer per report
    uniquePurchase: index('intel_report_purchases_unique_idx').on(
      table.reportId,
      table.buyerId,
    ),
  }),
);

// =============================================================================
// REPORT-CARDS JUNCTION TABLE
// =============================================================================

/**
 * Links intel reports to TCG cards
 * Enables card-specific report discovery and price context
 */
export const reportCards = pgTable(
  'report_cards',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    reportId: uuid('report_id')
      .notNull()
      .references(() => intelReports.id, { onDelete: 'cascade' }),

    // Card reference (using text for flexibility across games)
    cardId: text('card_id').notNull(),
    cardName: text('card_name'),
    game: text('game').notNull().default('pokemon'),

    // Price context at time of report
    priceAtReport: decimal('price_at_report', { precision: 10, scale: 2 }),
    priceSource: text('price_source'), // tcgplayer, cardmarket, ebay

    // Relevance metadata
    isPrimary: boolean('is_primary').default(false), // Main card of the report
    mentionCount: integer('mention_count').default(1),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdx: index('report_cards_report_idx').on(table.reportId),
    cardIdx: index('report_cards_card_idx').on(table.cardId),
    gameCardIdx: index('report_cards_game_card_idx').on(table.game, table.cardId),
    // Unique constraint per report-card pair
    uniqueReportCard: index('report_cards_unique_idx').on(table.reportId, table.cardId),
  }),
);

// =============================================================================
// REPORT LIKES TABLE
// =============================================================================

/**
 * Tracks user likes on intel reports
 */
export const intelReportLikes = pgTable(
  'intel_report_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    reportId: uuid('report_id')
      .notNull()
      .references(() => intelReports.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdx: index('intel_report_likes_report_idx').on(table.reportId),
    userIdx: index('intel_report_likes_user_idx').on(table.userId),
    // One like per user per report
    uniqueLike: index('intel_report_likes_unique_idx').on(table.reportId, table.userId),
  }),
);

// =============================================================================
// RELATIONS
// =============================================================================

export const intelReportsRelations = relations(intelReports, ({ one, many }) => ({
  user: one(users, {
    fields: [intelReports.userId],
    references: [users.id],
  }),
  purchases: many(intelReportPurchases),
  cards: many(reportCards),
  likes: many(intelReportLikes),
}));

export const intelReportPurchasesRelations = relations(intelReportPurchases, ({ one }) => ({
  report: one(intelReports, {
    fields: [intelReportPurchases.reportId],
    references: [intelReports.id],
  }),
  buyer: one(users, {
    fields: [intelReportPurchases.buyerId],
    references: [users.id],
  }),
}));

export const reportCardsRelations = relations(reportCards, ({ one }) => ({
  report: one(intelReports, {
    fields: [reportCards.reportId],
    references: [intelReports.id],
  }),
}));

export const intelReportLikesRelations = relations(intelReportLikes, ({ one }) => ({
  report: one(intelReports, {
    fields: [intelReportLikes.reportId],
    references: [intelReports.id],
  }),
  user: one(users, {
    fields: [intelReportLikes.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type IntelReport = InferSelectModel<typeof intelReports>;
export type NewIntelReport = InferInsertModel<typeof intelReports>;

export type IntelReportPurchase = InferSelectModel<typeof intelReportPurchases>;
export type NewIntelReportPurchase = InferInsertModel<typeof intelReportPurchases>;

export type ReportCard = InferSelectModel<typeof reportCards>;
export type NewReportCard = InferInsertModel<typeof reportCards>;

export type IntelReportLike = InferSelectModel<typeof intelReportLikes>;
export type NewIntelReportLike = InferInsertModel<typeof intelReportLikes>;

// Enum type exports
export type ReportTier = 'free' | 'premium' | 'exclusive';
export type ReportCategory =
  | 'market_analysis'
  | 'price_prediction'
  | 'set_review'
  | 'card_spotlight'
  | 'grading_guide'
  | 'investment_strategy'
  | 'breaking_news'
  | 'tutorial'
  | 'opinion'
  | 'research';
export type ReportStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
export type PostingDestination = 'commons' | 'rc_market' | 'both';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Embedding dimensions for different models
 */
export const EMBEDDING_DIMENSIONS = {
  'text-embedding-ada-002': 1536,
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
} as const;

/**
 * Default embedding model
 */
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';

/**
 * Minimum similarity threshold for vector search (cosine)
 */
export const VECTOR_SIMILARITY_THRESHOLD = 0.5;

/**
 * RRF constant for hybrid search fusion
 */
export const RRF_K = 60;

/**
 * Default result limits
 */
export const SEARCH_LIMITS = {
  initial_retrieve: 50, // Initial candidates from each search
  after_rrf: 20, // After RRF fusion
  final: 10, // After reranking
} as const;
