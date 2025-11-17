/**
 * Database schema definitions for Apex Intelligence
 *
 * This schema includes the TCG RAG system for provenance-tracked market intelligence
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
  embedding: sql`vector(1536)`,
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Vector similarity search index (IVFFlat for approximate nearest neighbor)
  embeddingIdx: sql`CREATE INDEX IF NOT EXISTS idx_tcg_documents_embedding ON tcg_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
  // Metadata filtering (GIN index for JSONB)
  metadataIdx: index('idx_tcg_documents_metadata').on(table.metadata),
  // Full-text search for keyword matching
  contentFtsIdx: sql`CREATE INDEX IF NOT EXISTS idx_tcg_documents_content_fts ON tcg_documents USING GIN (to_tsvector('english', content))`,
  // Source type filtering
  sourceTypeIdx: index('idx_tcg_documents_source_type').on(table.source_type),
  // Temporal queries
  createdAtIdx: index('idx_tcg_documents_created_at').on(table.created_at),
  // Idempotent ingestion via unique_id in metadata
  uniqueIdIdx: uniqueIndex('idx_tcg_documents_unique_id')
    .on(sql`(metadata->>'unique_id')`),
}));

// TypeScript types for better DX
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collection_items.$inferSelect;
export type NewCollectionItem = typeof collection_items.$inferInsert;
export type IntelItem = typeof intel_items.$inferSelect;
export type NewIntelItem = typeof intel_items.$inferInsert;
export type TcgDocument = typeof tcg_documents.$inferSelect;
export type NewTcgDocument = typeof tcg_documents.$inferInsert;

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
