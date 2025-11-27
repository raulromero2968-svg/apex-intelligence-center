/**
 * Latent RAG Schema Extensions
 *
 * Database schema for the LatentMAS-inspired query compression system.
 * Stores latent query vectors and cached search results for efficiency.
 *
 * Features:
 * - pgvector embeddings (3072-dim for text-embedding-3-large)
 * - Query perspective tracking
 * - Cache invalidation via TTL
 * - HNSW indexing for fast similarity search
 *
 * @module latent-rag-schema
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

/**
 * Custom pgvector type for 3072 dimensions (text-embedding-3-large)
 */
const vector3072 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(3072)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ============================================================================
// LATENT QUERIES TABLE
// ============================================================================

/**
 * Latent Queries - Stores compressed query representations
 *
 * Each user query is decomposed into multiple perspectives (semantic, temporal,
 * contrarian, exploratory) and stored as latent vectors for efficient retrieval.
 *
 * Features:
 * - 3072-dim embeddings from OpenAI text-embedding-3-large
 * - Multi-perspective decomposition
 * - Query lineage tracking
 * - HNSW indexing for fast nearest neighbor search
 */
export const latentQueries = pgTable('latent_queries', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Original query text
  originalQuery: text('original_query').notNull(),

  // Compressed phrase (human-readable summary)
  compressedPhrase: text('compressed_phrase').notNull(),

  // Query perspective type
  perspective: text('perspective', {
    enum: ['semantic', 'temporal', 'contrarian', 'exploratory'],
  }).notNull(),

  // pgvector embedding (3072 dimensions for text-embedding-3-large)
  embedding: vector3072('embedding').notNull(),

  // User who generated the query (optional for anonymous queries)
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Session tracking for query lineage
  sessionId: text('session_id'),

  // Query metadata
  metadata: jsonb('metadata').$type<{
    modelVersion?: string;
    temperature?: number;
    generationLatencyMs?: number;
    tokenCount?: number;
    parentQueryId?: string;
    [key: string]: any;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // TTL for cache invalidation
}, (table) => ({
  // HNSW index for vector similarity (created in migration)
  // embeddingIdx: index('idx_latent_queries_embedding').on(table.embedding).using('hnsw'),

  // Index for user queries
  userIdx: index('idx_latent_queries_user').on(table.userId),

  // Index for session queries
  sessionIdx: index('idx_latent_queries_session').on(table.sessionId),

  // Index for perspective filtering
  perspectiveIdx: index('idx_latent_queries_perspective').on(table.perspective),

  // Composite index for common query patterns
  userPerspectiveIdx: index('idx_latent_queries_user_perspective').on(table.userId, table.perspective),

  // Timestamp index for TTL queries
  expiresAtIdx: index('idx_latent_queries_expires').on(table.expiresAt),
}));

// ============================================================================
// LATENT SEARCH CACHE TABLE
// ============================================================================

/**
 * Latent Search Cache - Caches search results for repeated queries
 *
 * Stores the results of latent hybrid searches to avoid redundant
 * vector computations. Uses query hash for fast lookup.
 */
export const latentSearchCache = pgTable('latent_search_cache', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Hash of the original query for fast lookup
  queryHash: text('query_hash').notNull().unique(),

  // Original query text
  originalQuery: text('original_query').notNull(),

  // Cached document IDs (ordered by relevance)
  documentIds: jsonb('document_ids').$type<string[]>().notNull(),

  // Cached scores for each document
  scores: jsonb('scores').$type<number[]>().notNull(),

  // Search configuration used
  searchConfig: jsonb('search_config').$type<{
    numQueries: number;
    useReranking: boolean;
    similarityThreshold: number;
    sourceTypes?: string[];
  }>().notNull(),

  // Performance metrics
  hitCount: integer('hit_count').default(0).notNull(),
  lastHitAt: timestamp('last_hit_at'),
  generationLatencyMs: integer('generation_latency_ms'),

  // Timestamps and TTL
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  queryHashIdx: index('idx_latent_cache_query_hash').on(table.queryHash),
  expiresAtIdx: index('idx_latent_cache_expires').on(table.expiresAt),
  hitCountIdx: index('idx_latent_cache_hits').on(table.hitCount),
}));

// ============================================================================
// AGENT COMMUNICATION CACHE TABLE
// ============================================================================

/**
 * Agent Communication Cache - Stores compressed inter-agent messages
 *
 * LatentMAS-inspired: Agents communicate via latent vectors instead of
 * full text, reducing token costs and improving efficiency.
 */
export const agentCommunicationCache = pgTable('agent_communication_cache', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Source and target agents
  sourceAgentId: text('source_agent_id').notNull(),
  targetAgentId: text('target_agent_id'),

  // Task context
  taskId: text('task_id').notNull(),

  // Compressed latent representation
  latentVector: vector3072('latent_vector').notNull(),

  // Human-readable summary (for debugging)
  summary: text('summary').notNull(),

  // Original message (stored for reconstruction if needed)
  originalMessage: text('original_message'),

  // Compression metrics
  tokensSaved: integer('tokens_saved').default(0),
  compressionRatio: real('compression_ratio'),

  // Message type
  messageType: text('message_type', {
    enum: ['instruction', 'observation', 'result', 'query', 'feedback'],
  }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  taskIdx: index('idx_agent_comm_task').on(table.taskId),
  sourceAgentIdx: index('idx_agent_comm_source').on(table.sourceAgentId),
  messageTypeIdx: index('idx_agent_comm_type').on(table.messageType),
  createdAtIdx: index('idx_agent_comm_created').on(table.createdAt),
}));

// ============================================================================
// LATENT KNOWLEDGE GRAPH TABLE
// ============================================================================

/**
 * Latent Knowledge Nodes - High-dimensional concept representations
 *
 * Inspired by David Shapiro's "Pigeon Paradox" - AI thinks in 11k+ dimensions.
 * Stores concept embeddings for building a latent knowledge graph.
 */
export const latentKnowledgeNodes = pgTable('latent_knowledge_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Concept identifier (e.g., "charizard_base_set", "market_crash_2023")
  conceptId: text('concept_id').notNull().unique(),

  // Human-readable label
  label: text('label').notNull(),

  // Concept type
  nodeType: text('node_type', {
    enum: ['card', 'set', 'market_event', 'trend', 'entity', 'abstract'],
  }).notNull(),

  // High-dimensional embedding
  embedding: vector3072('embedding').notNull(),

  // Concept metadata
  metadata: jsonb('metadata').$type<{
    description?: string;
    aliases?: string[];
    relatedConcepts?: string[];
    confidence?: number;
    source?: string;
    [key: string]: any;
  }>().default({}),

  // Graph connectivity (stored as JSONB for flexibility)
  edges: jsonb('edges').$type<Array<{
    targetId: string;
    relation: string;
    weight: number;
  }>>().default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  conceptIdIdx: index('idx_latent_knowledge_concept').on(table.conceptId),
  nodeTypeIdx: index('idx_latent_knowledge_type').on(table.nodeType),
  labelIdx: index('idx_latent_knowledge_label').on(table.label),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Latent Queries relations
 */
export const latentQueriesRelations = relations(latentQueries, ({ one }) => ({
  user: one(users, {
    fields: [latentQueries.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LatentQuery = typeof latentQueries.$inferSelect;
export type NewLatentQuery = typeof latentQueries.$inferInsert;
export type LatentSearchCache = typeof latentSearchCache.$inferSelect;
export type NewLatentSearchCache = typeof latentSearchCache.$inferInsert;
export type AgentCommunicationCache = typeof agentCommunicationCache.$inferSelect;
export type NewAgentCommunicationCache = typeof agentCommunicationCache.$inferInsert;
export type LatentKnowledgeNode = typeof latentKnowledgeNodes.$inferSelect;
export type NewLatentKnowledgeNode = typeof latentKnowledgeNodes.$inferInsert;
