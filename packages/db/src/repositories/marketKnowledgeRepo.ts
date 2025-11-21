import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { marketKnowledge, type MarketKnowledge, type NewMarketKnowledge } from '../schema/marketKnowledge';

/**
 * Repository functions for market_knowledge table.
 * 
 * These functions provide type-safe access to RAG documents and sentiment/cluster data.
 */

/**
 * Insert a new market knowledge record.
 * 
 * @param db - Drizzle database instance
 * @param record - Market knowledge data to insert
 * @returns The inserted record with generated id and timestamps
 */
export async function insertMarketKnowledge(
  db: NodePgDatabase<Record<string, never>>,
  record: NewMarketKnowledge
): Promise<MarketKnowledge> {
  const [inserted] = await db
    .insert(marketKnowledge)
    .values(record)
    .returning();
  
  return inserted;
}

/**
 * Search market knowledge by vector similarity using pgvector.
 * 
 * Performs a vector similarity search using the L2 distance metric.
 * Results are ordered by similarity (ascending distance = higher similarity).
 * 
 * @param db - Drizzle database instance
 * @param queryEmbedding - The query vector (768 dimensions)
 * @param options - Search options
 * @param options.limit - Maximum number of results (default: 10)
 * @param options.cardId - Optional filter by cardId
 * @param options.sentimentScoreMin - Optional minimum sentiment score filter
 * @param options.sentimentScoreMax - Optional maximum sentiment score filter
 * @param options.clusterId - Optional filter by clusterId
 * @param options.language - Optional filter by language
 * @param options.sourceType - Optional filter by sourceType
 * @returns Array of matching records ordered by similarity
 */
export async function searchMarketKnowledgeByVector(
  db: NodePgDatabase<Record<string, never>>,
  queryEmbedding: number[],
  options: {
    limit?: number;
    cardId?: string;
    sentimentScoreMin?: number;
    sentimentScoreMax?: number;
    clusterId?: number;
    language?: string;
    sourceType?: string;
  } = {}
): Promise<MarketKnowledge[]> {
  const limit = options.limit ?? 10;
  
  // Validate embedding dimensions
  if (queryEmbedding.length !== 768) {
    throw new Error('Query embedding must be exactly 768 dimensions');
  }
  
  // Build WHERE conditions
  const conditions: ReturnType<typeof sql>[] = [sql`embedding_768 IS NOT NULL`];
  
  if (options.cardId) {
    conditions.push(sql`card_id = ${options.cardId}`);
  }
  if (options.sentimentScoreMin !== undefined) {
    conditions.push(sql`sentiment_score >= ${options.sentimentScoreMin}`);
  }
  if (options.sentimentScoreMax !== undefined) {
    conditions.push(sql`sentiment_score <= ${options.sentimentScoreMax}`);
  }
  if (options.clusterId !== undefined) {
    conditions.push(sql`cluster_id = ${options.clusterId}`);
  }
  if (options.language) {
    conditions.push(sql`language = ${options.language}`);
  }
  if (options.sourceType) {
    conditions.push(sql`source_type = ${options.sourceType}`);
  }
  
  // Build WHERE clause by combining conditions
  const whereClause = conditions.reduce((acc, condition, index) => {
    if (index === 0) {
      return condition;
    }
    return sql`${acc} AND ${condition}`;
  });
  
  // Convert embedding array to PostgreSQL array format for pgvector
  // pgvector expects the array in the format: '[0.1,0.2,0.3]'::vector(768)
  const embeddingArrayStr = `[${queryEmbedding.join(',')}]`;
  
  // Build the query with vector similarity search
  // Using raw SQL template for pgvector operations
  const query = sql`
    SELECT 
      id,
      card_id,
      source_type,
      source_url,
      source_author,
      language,
      content,
      sentiment_score,
      cluster_id,
      embedding_768,
      embedding_1536,
      reasoning_trace,
      created_at,
      updated_at
    FROM market_knowledge
    WHERE ${whereClause}
    ORDER BY embedding_768 <-> ${sql.raw(`${embeddingArrayStr}::vector(768)`)}
    LIMIT ${limit}
  `;
  
  const result = await db.execute(query);
  
  // Map raw results to MarketKnowledge type
  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    cardId: row.card_id as string,
    sourceType: row.source_type as string,
    sourceUrl: row.source_url as string | null,
    sourceAuthor: row.source_author as string | null,
    language: row.language as string,
    content: row.content as string,
    sentimentScore: row.sentiment_score as number | null,
    clusterId: row.cluster_id as number | null,
    embedding768: row.embedding_768 as number[],
    embedding1536: row.embedding_1536 as number[] | null,
    reasoningTrace: row.reasoning_trace as Record<string, unknown>,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  })) as MarketKnowledge[];
}

/**
 * Find market knowledge records by cardId.
 * 
 * @param db - Drizzle database instance
 * @param cardId - The card identifier to search for
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of matching records
 */
export async function findMarketKnowledgeByCardId(
  db: NodePgDatabase<Record<string, never>>,
  cardId: string,
  limit: number = 100
): Promise<MarketKnowledge[]> {
  return db
    .select()
    .from(marketKnowledge)
    .where(eq(marketKnowledge.cardId, cardId))
    .limit(limit);
}

/**
 * Find market knowledge records by sourceType.
 * 
 * @param db - Drizzle database instance
 * @param sourceType - The source type to filter by
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of matching records
 */
export async function findMarketKnowledgeBySourceType(
  db: NodePgDatabase<Record<string, never>>,
  sourceType: string,
  limit: number = 100
): Promise<MarketKnowledge[]> {
  return db
    .select()
    .from(marketKnowledge)
    .where(eq(marketKnowledge.sourceType, sourceType))
    .limit(limit);
}

