/**
 * Vector Search Service
 *
 * Implements knowledge-09-database-architecture pgvector integration.
 * Manages vector indexes and similarity search.
 *
 * Features:
 * - Vector index management (HNSW, IVFFlat)
 * - Similarity search operations
 * - Embedding source configuration
 * - Performance monitoring
 *
 * @see knowledge-09-database-architecture for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import {
  vectorIndexes,
  schemaDefinitions,
  type VectorIndex,
  type NewVectorIndex,
} from '@/db/schema/database-arch';

// ============================================================================
// TYPES
// ============================================================================

export type IndexType = 'hnsw' | 'ivfflat';
export type DistanceMetric = 'cosine' | 'euclidean' | 'inner_product';

export interface HnswParams {
  m: number; // connections per element (default: 16)
  efConstruction: number; // size of dynamic candidate list (default: 64)
}

export interface IvfflatParams {
  lists: number; // number of clusters (default: 100)
}

export interface SearchConfig {
  efSearch?: number; // HNSW search param
  probes?: number; // IVFFlat probes
  preFilter?: string; // WHERE clause
}

export interface EmbeddingSource {
  model: string;
  provider: 'openai' | 'cohere' | 'local';
  sourceColumn: string;
  autoUpdate: boolean;
}

export interface VectorSearchResult {
  id: string;
  distance: number;
  data: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default HNSW parameters
 */
export const DEFAULT_HNSW_PARAMS: HnswParams = {
  m: 16,
  efConstruction: 64,
};

/**
 * Default IVFFlat parameters
 */
export const DEFAULT_IVFFLAT_PARAMS: IvfflatParams = {
  lists: 100,
};

/**
 * Distance operators for pgvector
 */
export const DISTANCE_OPERATORS: Record<DistanceMetric, string> = {
  cosine: '<=>',
  euclidean: '<->',
  inner_product: '<#>',
};

/**
 * Common embedding dimensions
 */
export const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
  'embed-english-v3.0': 1024,
  'embed-multilingual-v3.0': 1024,
};

// ============================================================================
// INDEX MANAGEMENT
// ============================================================================

/**
 * Create a vector index configuration
 */
export async function createVectorIndex(
  data: Omit<NewVectorIndex, 'id' | 'createdAt' | 'updatedAt'>
): Promise<VectorIndex> {
  const [index] = await db.insert(vectorIndexes).values(data).returning();
  return index;
}

/**
 * Get vector index by ID
 */
export async function getVectorIndex(indexId: string): Promise<VectorIndex | null> {
  const [index] = await db
    .select()
    .from(vectorIndexes)
    .where(eq(vectorIndexes.id, indexId))
    .execute();

  return index ?? null;
}

/**
 * Get vector indexes for a schema
 */
export async function getSchemaVectorIndexes(schemaId: string): Promise<VectorIndex[]> {
  return db
    .select()
    .from(vectorIndexes)
    .where(eq(vectorIndexes.schemaId, schemaId))
    .execute();
}

/**
 * Get vector indexes for a project
 */
export async function getProjectVectorIndexes(
  projectId: string,
  options: { activeOnly?: boolean } = {}
): Promise<VectorIndex[]> {
  const { activeOnly = false } = options;

  const conditions = [eq(vectorIndexes.projectId, projectId)];
  if (activeOnly) {
    conditions.push(eq(vectorIndexes.isActive, true));
  }

  return db
    .select()
    .from(vectorIndexes)
    .where(and(...conditions))
    .orderBy(desc(vectorIndexes.updatedAt))
    .execute();
}

/**
 * Update a vector index
 */
export async function updateVectorIndex(
  indexId: string,
  updates: Partial<NewVectorIndex>
): Promise<VectorIndex | null> {
  const [updated] = await db
    .update(vectorIndexes)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(vectorIndexes.id, indexId))
    .returning();

  return updated ?? null;
}

/**
 * Delete a vector index
 */
export async function deleteVectorIndex(indexId: string): Promise<boolean> {
  const result = await db
    .delete(vectorIndexes)
    .where(eq(vectorIndexes.id, indexId))
    .returning({ id: vectorIndexes.id });

  return result.length > 0;
}

// ============================================================================
// SQL GENERATION
// ============================================================================

/**
 * Generate SQL for creating vector column
 */
export function generateVectorColumnSql(
  tableName: string,
  columnName: string,
  dimensions: number
): string {
  return `-- Add vector column
ALTER TABLE ${tableName}
ADD COLUMN ${columnName} vector(${dimensions});`;
}

/**
 * Generate SQL for HNSW index
 */
export function generateHnswIndexSql(
  tableName: string,
  columnName: string,
  indexName: string,
  metric: DistanceMetric,
  params: HnswParams = DEFAULT_HNSW_PARAMS
): string {
  const ops = metric === 'cosine' ? 'vector_cosine_ops' :
              metric === 'euclidean' ? 'vector_l2_ops' : 'vector_ip_ops';

  return `-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX ${indexName}
ON ${tableName}
USING hnsw (${columnName} ${ops})
WITH (m = ${params.m}, ef_construction = ${params.efConstruction});`;
}

/**
 * Generate SQL for IVFFlat index
 */
export function generateIvfflatIndexSql(
  tableName: string,
  columnName: string,
  indexName: string,
  metric: DistanceMetric,
  params: IvfflatParams = DEFAULT_IVFFLAT_PARAMS
): string {
  const ops = metric === 'cosine' ? 'vector_cosine_ops' :
              metric === 'euclidean' ? 'vector_l2_ops' : 'vector_ip_ops';

  return `-- Create IVFFlat index
-- Note: Run ANALYZE after populating data for better performance
CREATE INDEX ${indexName}
ON ${tableName}
USING ivfflat (${columnName} ${ops})
WITH (lists = ${params.lists});

-- Run after inserting data
ANALYZE ${tableName};`;
}

/**
 * Generate similarity search SQL
 */
export function generateSimilaritySearchSql(
  tableName: string,
  columnName: string,
  metric: DistanceMetric,
  options: {
    selectColumns?: string[];
    where?: string;
    limit?: number;
  } = {}
): string {
  const { selectColumns = ['*'], where, limit = 10 } = options;
  const operator = DISTANCE_OPERATORS[metric];

  let sql = `-- Similarity search query
SELECT ${selectColumns.join(', ')},
       ${columnName} ${operator} $1 AS distance
FROM ${tableName}`;

  if (where) {
    sql += `\nWHERE ${where}`;
  }

  sql += `\nORDER BY distance
LIMIT ${limit};`;

  return sql;
}

// ============================================================================
// DRIZZLE CODE GENERATION
// ============================================================================

/**
 * Generate Drizzle schema with vector column
 */
export function generateDrizzleVectorSchema(
  tableName: string,
  columnName: string,
  dimensions: number
): string {
  return `import { pgTable, uuid, text, vector } from 'drizzle-orm/pg-core';

// Note: Requires drizzle-orm with pgvector support
export const ${tableName} = pgTable('${tableName}', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... other columns

  // Vector column for embeddings
  ${columnName}: vector('${columnName}', { dimensions: ${dimensions} }),
});`;
}

/**
 * Generate Drizzle similarity search function
 */
export function generateDrizzleSimilaritySearch(
  tableName: string,
  columnName: string,
  metric: DistanceMetric
): string {
  const metricFn = metric === 'cosine' ? 'cosineDistance' :
                   metric === 'euclidean' ? 'l2Distance' : 'innerProduct';

  return `import { db } from '@/lib/db';
import { ${tableName } } from '@/db/schema';
import { sql, ${metricFn} } from 'drizzle-orm';

interface SearchResult {
  id: string;
  distance: number;
  // ... other fields
}

export async function similaritySearch(
  queryEmbedding: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  const results = await db
    .select({
      id: ${tableName}.id,
      // ... other columns
      distance: ${metricFn}(${tableName}.${columnName}, queryEmbedding),
    })
    .from(${tableName})
    .orderBy(${metricFn}(${tableName}.${columnName}, queryEmbedding))
    .limit(limit)
    .execute();

  return results;
}

// With filtering
export async function filteredSimilaritySearch(
  queryEmbedding: number[],
  filter: { category?: string },
  limit: number = 10
): Promise<SearchResult[]> {
  const conditions = [];

  if (filter.category) {
    conditions.push(eq(${tableName}.category, filter.category));
  }

  const results = await db
    .select({
      id: ${tableName}.id,
      distance: ${metricFn}(${tableName}.${columnName}, queryEmbedding),
    })
    .from(${tableName})
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(${metricFn}(${tableName}.${columnName}, queryEmbedding))
    .limit(limit)
    .execute();

  return results;
}`;
}

/**
 * Generate embedding function
 */
export function generateEmbeddingFunction(source: EmbeddingSource): string {
  if (source.provider === 'openai') {
    return `import OpenAI from 'openai';

const openai = new OpenAI();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: '${source.model}',
    input: text,
  });

  return response.data[0].embedding;
}

// Batch embedding for efficiency
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: '${source.model}',
    input: texts,
  });

  return response.data.map(d => d.embedding);
}`;
  }

  if (source.provider === 'cohere') {
    return `import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await cohere.embed({
    texts: [text],
    model: '${source.model}',
    inputType: 'search_document',
  });

  return response.embeddings[0];
}`;
  }

  return `// Local embedding implementation
// Use sentence-transformers or similar
export async function generateEmbedding(text: string): Promise<number[]> {
  // Implement local embedding
  throw new Error('Local embedding not implemented');
}`;
}

// ============================================================================
// INDEX RECOMMENDATIONS
// ============================================================================

export interface VectorIndexRecommendation {
  indexType: IndexType;
  reason: string;
  params: HnswParams | IvfflatParams;
  tradeoffs: string[];
}

/**
 * Get index recommendation based on use case
 */
export function getIndexRecommendation(
  rowCount: number,
  queryFrequency: 'low' | 'medium' | 'high',
  accuracyRequirement: 'approximate' | 'high'
): VectorIndexRecommendation {
  // HNSW: Better for high query frequency, good accuracy
  // IVFFlat: Better for large datasets, lower memory

  if (queryFrequency === 'high' || accuracyRequirement === 'high') {
    return {
      indexType: 'hnsw',
      reason: 'HNSW provides faster queries and better accuracy',
      params: {
        m: rowCount > 100000 ? 32 : 16,
        efConstruction: accuracyRequirement === 'high' ? 128 : 64,
      },
      tradeoffs: [
        'Higher memory usage',
        'Slower index building',
        'Better query performance',
      ],
    };
  }

  return {
    indexType: 'ivfflat',
    reason: 'IVFFlat is more memory efficient for large datasets',
    params: {
      lists: Math.min(Math.sqrt(rowCount), 1000),
    },
    tradeoffs: [
      'Lower memory usage',
      'Faster index building',
      'Requires ANALYZE after data changes',
    ],
  };
}
