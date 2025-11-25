/**
 * Database Architecture Domain Pack
 *
 * RAG knowledge base for PostgreSQL, Drizzle ORM, and pgvector.
 * Implements knowledge-09-database-architecture domain integration.
 *
 * Features:
 * - Core knowledge documents for database patterns
 * - Semantic search across schemas and queries
 * - Prompt templates for LLM-powered assistance
 *
 * @see knowledge-09-database-architecture for architecture details
 */

import { db } from '@/lib/db';
import { eq, ilike, or, and } from 'drizzle-orm';
import {
  dbKnowledge,
  type DbKnowledge,
  type NewDbKnowledge,
} from '@/db/schema/database-arch';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'concept'
  | 'api_reference'
  | 'code_example'
  | 'best_practice'
  | 'troubleshooting';

export type Category =
  | 'schema'
  | 'vector'
  | 'query'
  | 'migration'
  | 'sync'
  | 'pooling'
  | 'indexing';

export interface KnowledgeQuery {
  query: string;
  category?: Category;
  documentType?: DocumentType;
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

// ============================================================================
// CORE KNOWLEDGE DOCUMENTS
// ============================================================================

export const CORE_KNOWLEDGE: Array<Omit<NewDbKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'Drizzle ORM Schema Design',
    content: `Drizzle ORM provides type-safe database schemas for PostgreSQL.

## Basic Schema Definition

\`\`\`typescript
import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
\`\`\`

## Relations

\`\`\`typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
\`\`\`

## Indexes

\`\`\`typescript
import { index } from 'drizzle-orm/pg-core';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    authorId: uuid('author_id').references(() => users.id),
  },
  (table) => [
    index('posts_author_idx').on(table.authorId),
  ]
);
\`\`\``,
    documentType: 'api_reference',
    category: 'schema',
    tags: ['drizzle', 'schema', 'postgresql', 'typescript'],
    relatedTopics: ['indexing', 'migration'],
    postgresVersion: '15+',
    drizzleVersion: '0.28+',
    isVerified: true,
  },
  {
    title: 'pgvector for Similarity Search',
    content: `pgvector enables vector similarity search in PostgreSQL.

## Installation

\`\`\`sql
CREATE EXTENSION vector;
\`\`\`

## Vector Column

\`\`\`sql
-- Add vector column (1536 dimensions for OpenAI embeddings)
ALTER TABLE items ADD COLUMN embedding vector(1536);
\`\`\`

## Indexes

### HNSW (Recommended for most cases)
\`\`\`sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
\`\`\`

### IVFFlat (Lower memory usage)
\`\`\`sql
CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Run after populating data
ANALYZE items;
\`\`\`

## Distance Operators

- \`<=>\` - Cosine distance
- \`<->\` - Euclidean (L2) distance
- \`<#>\` - Inner product (negative)

## Similarity Search

\`\`\`sql
SELECT id, content, embedding <=> $1 AS distance
FROM items
ORDER BY embedding <=> $1
LIMIT 10;
\`\`\`

## With Drizzle

\`\`\`typescript
import { cosineDistance } from 'drizzle-orm';

const results = await db
  .select({
    id: items.id,
    distance: cosineDistance(items.embedding, queryVector),
  })
  .from(items)
  .orderBy(cosineDistance(items.embedding, queryVector))
  .limit(10);
\`\`\``,
    documentType: 'api_reference',
    category: 'vector',
    tags: ['pgvector', 'embeddings', 'similarity-search', 'AI'],
    relatedTopics: ['indexing', 'query'],
    postgresVersion: '15+',
    isVerified: true,
  },
  {
    title: 'Query Optimization with EXPLAIN',
    content: `Use EXPLAIN to analyze and optimize PostgreSQL queries.

## Basic EXPLAIN

\`\`\`sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
\`\`\`

## EXPLAIN ANALYZE (with execution)

\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM users WHERE email = 'test@example.com';
\`\`\`

## Reading the Output

### Scan Types
- **Index Scan**: Using index (good)
- **Index Only Scan**: All data from index (best)
- **Seq Scan**: Full table scan (often bad for large tables)
- **Bitmap Index Scan**: Multiple index conditions

### Key Metrics
- **cost**: Estimated cost (lower is better)
- **rows**: Estimated vs actual rows
- **time**: Planning + Execution time

## Common Optimizations

### Add Missing Index
\`\`\`sql
-- If seeing Seq Scan on frequently queried column
CREATE INDEX idx_users_email ON users (email);
\`\`\`

### Partial Index
\`\`\`sql
-- Index only active users
CREATE INDEX idx_active_users ON users (email)
WHERE is_active = true;
\`\`\`

### Composite Index
\`\`\`sql
-- For queries filtering on multiple columns
CREATE INDEX idx_users_status_created
ON users (status, created_at DESC);
\`\`\``,
    documentType: 'best_practice',
    category: 'query',
    tags: ['EXPLAIN', 'optimization', 'indexes', 'performance'],
    relatedTopics: ['indexing', 'schema'],
    postgresVersion: '15+',
    isVerified: true,
  },
  {
    title: 'Database Migrations with Drizzle',
    content: `Manage schema changes safely with Drizzle migrations.

## Setup

\`\`\`typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
\`\`\`

## Generate Migrations

\`\`\`bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Push changes directly (development only)
npx drizzle-kit push:pg
\`\`\`

## Apply Migrations

\`\`\`typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';

await migrate(db, { migrationsFolder: './drizzle' });
\`\`\`

## Best Practices

1. **Always test migrations** on staging first
2. **Keep migrations small** - one logical change per migration
3. **Use transactions** for data migrations
4. **Have rollback plans** for production
5. **Don't modify existing migrations** after they're applied

## Safe Column Operations

\`\`\`sql
-- Add column (safe)
ALTER TABLE users ADD COLUMN bio text;

-- Add NOT NULL column (requires default)
ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';

-- Remove default after backfill
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
\`\`\``,
    documentType: 'best_practice',
    category: 'migration',
    tags: ['migrations', 'drizzle-kit', 'schema-changes'],
    relatedTopics: ['schema', 'pooling'],
    drizzleVersion: '0.28+',
    isVerified: true,
  },
  {
    title: 'Connection Pooling Best Practices',
    content: `Optimize database connections for production workloads.

## Why Pooling?

- PostgreSQL has connection overhead (~10MB per connection)
- Serverless environments need efficient connections
- Prevents connection exhaustion

## Neon/Vercel Postgres (Serverless)

\`\`\`typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
\`\`\`

## With Connection Pooler

\`\`\`typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
\`\`\`

## Supabase with Pooler

\`\`\`typescript
// Use pooler URL for serverless
const connectionString = process.env.DATABASE_URL!.replace(
  '.supabase.co:5432',
  '.pooler.supabase.co:6543'
);
\`\`\`

## Configuration Tips

1. **Serverless**: Use HTTP connections or external pooler
2. **Long-running**: Use persistent pool with keepalive
3. **High traffic**: Consider PgBouncer or similar
4. **Monitor**: Track active/idle connections`,
    documentType: 'best_practice',
    category: 'pooling',
    tags: ['pooling', 'connections', 'serverless', 'performance'],
    relatedTopics: ['sync', 'query'],
    postgresVersion: '15+',
    isVerified: true,
  },
  {
    title: 'Mobile-Database Sync Patterns',
    content: `Implement offline-first sync between mobile and PostgreSQL.

## Architecture

\`\`\`
Mobile App (SQLite/MMKV)
    ↕ Sync Layer
Server (PostgreSQL)
\`\`\`

## Sync Strategies

### Last-Write-Wins
\`\`\`typescript
interface SyncRecord {
  id: string;
  data: any;
  updatedAt: Date;
  deviceId: string;
}

// Server resolves conflicts
function resolve(local: SyncRecord, remote: SyncRecord) {
  return local.updatedAt > remote.updatedAt ? local : remote;
}
\`\`\`

### Version Vectors
\`\`\`typescript
interface VersionedRecord {
  id: string;
  data: any;
  version: number;
  syncedAt: Date;
}

// Increment version on each change
async function update(id: string, data: any) {
  await db.update(records)
    .set({ data, version: sql\`version + 1\` })
    .where(eq(records.id, id));
}
\`\`\`

## Delta Sync

\`\`\`typescript
// Server endpoint
app.get('/sync', async (req, res) => {
  const { lastSyncAt } = req.query;

  const changes = await db
    .select()
    .from(records)
    .where(gt(records.updatedAt, new Date(lastSyncAt)))
    .execute();

  res.json({ changes, serverTime: new Date() });
});
\`\`\`

## Client Implementation

\`\`\`typescript
// React Native with expo-sqlite
import * as SQLite from 'expo-sqlite';

const localDb = SQLite.openDatabaseSync('local.db');

async function syncWithServer() {
  const lastSync = await getLastSyncTime();
  const { changes, serverTime } = await fetchChanges(lastSync);

  for (const change of changes) {
    await localDb.runAsync(
      'INSERT OR REPLACE INTO records (id, data, updated_at) VALUES (?, ?, ?)',
      [change.id, JSON.stringify(change.data), change.updatedAt]
    );
  }

  await setLastSyncTime(serverTime);
}
\`\`\``,
    documentType: 'concept',
    category: 'sync',
    tags: ['sync', 'offline', 'mobile', 'conflict-resolution'],
    relatedTopics: ['pooling', 'query'],
    postgresVersion: '15+',
    isVerified: true,
  },
  {
    title: 'Index Types and When to Use Them',
    content: `PostgreSQL index types and their optimal use cases.

## B-tree (Default)

Best for: Equality and range queries
\`\`\`sql
CREATE INDEX idx_users_email ON users (email);
-- Supports: =, <, >, <=, >=, BETWEEN, IN
\`\`\`

## Hash

Best for: Equality only (faster than B-tree for =)
\`\`\`sql
CREATE INDEX idx_users_email_hash ON users USING hash (email);
-- Only supports: =
\`\`\`

## GIN (Generalized Inverted)

Best for: Arrays, JSONB, full-text search
\`\`\`sql
-- For JSONB queries
CREATE INDEX idx_data_gin ON items USING gin (data);

-- For array contains
CREATE INDEX idx_tags_gin ON posts USING gin (tags);
\`\`\`

## GiST (Generalized Search Tree)

Best for: Geometric data, ranges, full-text
\`\`\`sql
-- For range queries
CREATE INDEX idx_period ON events USING gist (period);
\`\`\`

## HNSW / IVFFlat (pgvector)

Best for: Vector similarity search
\`\`\`sql
-- HNSW: Faster queries, more memory
CREATE INDEX idx_embedding_hnsw ON items
USING hnsw (embedding vector_cosine_ops);

-- IVFFlat: Less memory, requires ANALYZE
CREATE INDEX idx_embedding_ivf ON items
USING ivfflat (embedding vector_cosine_ops);
\`\`\`

## Composite Indexes

\`\`\`sql
-- Order matters! Put equality columns first
CREATE INDEX idx_orders_user_date
ON orders (user_id, created_at DESC);

-- Supports queries on:
-- - user_id alone
-- - user_id AND created_at
-- - NOT created_at alone
\`\`\`

## Partial Indexes

\`\`\`sql
-- Index only relevant rows
CREATE INDEX idx_active_orders
ON orders (created_at)
WHERE status = 'active';
\`\`\``,
    documentType: 'api_reference',
    category: 'indexing',
    tags: ['indexes', 'btree', 'gin', 'gist', 'hnsw'],
    relatedTopics: ['query', 'vector'],
    postgresVersion: '15+',
    isVerified: true,
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  design_schema: {
    id: 'design_schema',
    name: 'Design Schema',
    description: 'Design a database schema for a use case',
    template: `Design a PostgreSQL database schema with Drizzle ORM for:

Use Case: {useCase}
Entities: {entities}
Requirements: {requirements}

Provide:
1. Drizzle schema definitions with proper types
2. Relations between tables
3. Recommended indexes
4. Any constraints or validations`,
    variables: ['useCase', 'entities', 'requirements'],
  },
  optimize_query: {
    id: 'optimize_query',
    name: 'Optimize Query',
    description: 'Optimize a slow database query',
    template: `Optimize this database query:

Query:
\`\`\`sql
{query}
\`\`\`

EXPLAIN Output:
{explainOutput}

Table Schema:
{schema}

Current Indexes:
{indexes}

Provide:
1. Analysis of the current execution plan
2. Recommended indexes to add
3. Query rewrite suggestions
4. Drizzle ORM equivalent code`,
    variables: ['query', 'explainOutput', 'schema', 'indexes'],
  },
  setup_vector_search: {
    id: 'setup_vector_search',
    name: 'Setup Vector Search',
    description: 'Configure pgvector for similarity search',
    template: `Setup pgvector for this use case:

Use Case: {useCase}
Data Type: {dataType}
Expected Rows: {rowCount}
Query Frequency: {queryFrequency}
Accuracy Needs: {accuracy}

Embedding Model: {embeddingModel}

Provide:
1. Schema with vector column
2. Appropriate index type and parameters
3. Similarity search query
4. Drizzle ORM implementation`,
    variables: ['useCase', 'dataType', 'rowCount', 'queryFrequency', 'accuracy', 'embeddingModel'],
  },
};

// ============================================================================
// KNOWLEDGE MANAGEMENT
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeDbKnowledge(): Promise<{ documentsLoaded: number }> {
  let count = 0;

  for (const doc of CORE_KNOWLEDGE) {
    const existing = await db
      .select()
      .from(dbKnowledge)
      .where(eq(dbKnowledge.title, doc.title))
      .execute();

    if (existing.length === 0) {
      await db.insert(dbKnowledge).values(doc);
      count++;
    }
  }

  return { documentsLoaded: count };
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<DbKnowledge[]> {
  const { query: searchQuery, category, documentType, limit = 10 } = query;

  const conditions = [];

  if (searchQuery) {
    conditions.push(
      or(
        ilike(dbKnowledge.title, `%${searchQuery}%`),
        ilike(dbKnowledge.content, `%${searchQuery}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(dbKnowledge.category, category));
  }

  if (documentType) {
    conditions.push(eq(dbKnowledge.documentType, documentType));
  }

  return db
    .select()
    .from(dbKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(category: Category): Promise<DbKnowledge[]> {
  return db.select().from(dbKnowledge).where(eq(dbKnowledge.category, category)).execute();
}

/**
 * Get a prompt template
 */
export function getPromptTemplate(templateId: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[templateId] ?? null;
}

/**
 * Fill a prompt template with variables
 */
export function fillPromptTemplate(
  templateId: string,
  variables: Record<string, string>
): string | null {
  const template = PROMPT_TEMPLATES[templateId];
  if (!template) return null;

  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return filled;
}
