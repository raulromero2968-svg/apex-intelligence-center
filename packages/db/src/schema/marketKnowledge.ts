import { pgTable, text, uuid, integer, real, jsonb, timestamp, index, customType } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Define custom vector type for pgvector
// pgvector stores vectors as arrays and returns them as strings in format '[0.1,0.2,0.3]'
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    // pgvector expects array format: '[0.1,0.2,0.3]'
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]): number[] {
    // Handle both string format from pgvector and array format from driver
    if (Array.isArray(value)) {
      return value;
    }
    // Parse string format '[0.1,0.2,0.3]'
    const cleaned = value.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned.slice(1, -1).split(',').map(Number);
    }
    return JSON.parse(value);
  },
});

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value;
    }
    const cleaned = value.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned.slice(1, -1).split(',').map(Number);
    }
    return JSON.parse(value);
  },
});

/**
 * Market Knowledge table stores RAG documents and derived sentiment/cluster information.
 * 
 * Invariants:
 * - content must not be empty
 * - sentimentScore ranges from -1.0 (negative) to 1.0 (positive)
 * - clusterId is nullable and used for grouping related market knowledge
 * - embeddings must be exactly 768 or 1536 dimensions (enforced at application layer)
 * - reasoningTrace must be valid JSON (enforced by JSONB type)
 * - sourceType values: "forum", "sale", "article", "social", "review", "other"
 */
export const marketKnowledge = pgTable(
  'market_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cardId: text('card_id').notNull(),
    sourceType: text('source_type').notNull(),
    sourceUrl: text('source_url'),
    sourceAuthor: text('source_author'),
    language: text('language').notNull().default('en'),
    content: text('content').notNull(),
    sentimentScore: real('sentiment_score'),
    clusterId: integer('cluster_id'),
    embedding768: vector('embedding_768'),
    embedding1536: vector1536('embedding_1536'),
    reasoningTrace: jsonb('reasoning_trace').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cardIdIdx: index('market_knowledge_card_id_idx').on(table.cardId),
    sourceTypeIdx: index('market_knowledge_source_type_idx').on(table.sourceType),
  })
);

export type MarketKnowledge = InferSelectModel<typeof marketKnowledge>;
export type NewMarketKnowledge = InferInsertModel<typeof marketKnowledge>;



