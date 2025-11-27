/**
 * Contrarian RAG Retrieval Module
 * 
 * Implements MMR (Maximal Marginal Relevance) retrieval with sentiment/cluster filtering
 * for the Contrarian RAG Agent.
 */

import { pool } from '@/db';
import { marketKnowledge } from '@apex/db';
import { sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@apex/shared';

const logger = createLogger('contrarian-rag-retrieval');

/**
 * Candidate document from retrieval
 */
export interface CandidateDoc {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  sentimentScore: number | null;
  clusterId: number | null;
  similarity: number;
  cardId: string;
  language: string;
}

/**
 * Retrieval constraints for filtering
 */
export interface RetrievalConstraints {
  minSentiment?: number;
  maxSentiment?: number;
  clusterIds?: number[];
  excludeClusterIds?: number[];
  sourceTypes?: string[];
  excludeSourceTypes?: string[];
  minPrestige?: number; // 0-1 scale, lower = more fringe
  maxPrestige?: number;
  language?: string;
}

/**
 * Retrieve candidate documents using vector similarity search
 * 
 * @param queryEmbedding - Query embedding vector (1536 dimensions for OpenAI, 1024 for Voyage)
 * @param constraints - Optional filtering constraints
 * @param limit - Maximum number of candidates to retrieve (default: 50)
 * @returns Array of candidate documents
 */
export async function retrieveCandidates(
  queryEmbedding: number[],
  constraints: RetrievalConstraints = {},
  limit: number = 50
): Promise<CandidateDoc[]> {
  return Sentry.startSpan(
    { name: 'contrarian.retrieveCandidates', op: 'db.query' },
    async () => {
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      const embeddingDim = queryEmbedding.length;

      // Determine which embedding column to use
      const embeddingColumn = embeddingDim === 768 
        ? 'embedding768' 
        : embeddingDim === 1536 
        ? 'embedding1536' 
        : null;

      if (!embeddingColumn) {
        throw new Error(
          `Unsupported embedding dimension: ${embeddingDim}. Expected 768 or 1536.`
        );
      }

      // Build filter clauses
      const filterClauses: string[] = [];
      const filterParams: any[] = [];
      let paramIndex = 1;

      if (constraints.language) {
        filterClauses.push(`language = $${paramIndex}`);
        filterParams.push(constraints.language);
        paramIndex++;
      }

      if (constraints.minSentiment !== undefined) {
        filterClauses.push(`sentiment_score >= $${paramIndex}`);
        filterParams.push(constraints.minSentiment);
        paramIndex++;
      }

      if (constraints.maxSentiment !== undefined) {
        filterClauses.push(`sentiment_score <= $${paramIndex}`);
        filterParams.push(constraints.maxSentiment);
        paramIndex++;
      }

      if (constraints.clusterIds && constraints.clusterIds.length > 0) {
        filterClauses.push(`cluster_id = ANY($${paramIndex}::int[])`);
        filterParams.push(constraints.clusterIds);
        paramIndex++;
      }

      if (constraints.excludeClusterIds && constraints.excludeClusterIds.length > 0) {
        filterClauses.push(`(cluster_id IS NULL OR cluster_id != ALL($${paramIndex}::int[]))`);
        filterParams.push(constraints.excludeClusterIds);
        paramIndex++;
      }

      if (constraints.sourceTypes && constraints.sourceTypes.length > 0) {
        filterClauses.push(`source_type = ANY($${paramIndex}::text[])`);
        filterParams.push(constraints.sourceTypes);
        paramIndex++;
      }

      if (constraints.excludeSourceTypes && constraints.excludeSourceTypes.length > 0) {
        filterClauses.push(`source_type != ALL($${paramIndex}::text[])`);
        filterParams.push(constraints.excludeSourceTypes);
        paramIndex++;
      }

      const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')} AND ${embeddingColumn} IS NOT NULL`
        : `WHERE ${embeddingColumn} IS NOT NULL`;

      const client = await pool.connect();
      try {
        // Use cosine distance (<=>) for similarity
        // 1 - distance = similarity score
        const queryText = `
          SELECT
            id,
            content,
            source_type,
            source_url,
            source_author,
            sentiment_score,
            cluster_id,
            card_id,
            language,
            1 - (${embeddingColumn} <=> $${paramIndex}::vector(${embeddingDim})) AS similarity
          FROM market_knowledge
          ${whereClause}
          ORDER BY ${embeddingColumn} <=> $${paramIndex}::vector(${embeddingDim})
          LIMIT $${paramIndex + 1}
        `;

        const queryParams = [
          ...filterParams,
          embeddingStr,
          limit,
        ];

        const result = await client.query(queryText, queryParams);

        logger.info('Retrieved candidates', {
          count: result.rows.length,
          constraints: Object.keys(constraints).length,
        });

        return result.rows.map((row) => ({
          id: row.id,
          content: row.content,
          sourceType: row.source_type,
          sourceUrl: row.source_url,
          sourceAuthor: row.source_author,
          sentimentScore: row.sentiment_score,
          clusterId: row.cluster_id,
          similarity: parseFloat(row.similarity) || 0,
          cardId: row.card_id,
          language: row.language,
        }));
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            embeddingDim,
            constraints,
            limit,
          },
        });
        logger.error('Failed to retrieve candidates', { error: String(error) });
        throw error;
      } finally {
        client.release();
      }
    }
  );
}

/**
 * Apply Maximal Marginal Relevance (MMR) to diversify results
 * 
 * MMR balances relevance (similarity to query) with diversity (dissimilarity to already selected docs).
 * 
 * @param candidates - Initial candidate documents
 * @param queryEmbedding - Query embedding vector
 * @param lambda - MMR lambda parameter (0-1): 0 = pure diversity, 1 = pure relevance (default: 0.7)
 * @param topK - Number of documents to return after MMR (default: 10)
 * @returns Diversified candidate documents
 */
export function applyMMR(
  candidates: CandidateDoc[],
  queryEmbedding: number[],
  lambda: number = 0.7,
  topK: number = 10
): CandidateDoc[] {
  if (candidates.length === 0 || topK === 0) {
    return [];
  }

  if (candidates.length <= topK) {
    return candidates;
  }

  // Helper to compute cosine similarity between two vectors
  const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  };

  // For simplicity, we'll use the similarity scores already computed
  // In a full implementation, we'd recompute embeddings for each candidate
  // and compute inter-document similarities
  
  const selected: CandidateDoc[] = [];
  const remaining = [...candidates];

  // Start with the most relevant document
  selected.push(remaining.shift()!);

  // Greedily select documents that maximize MMR score
  while (selected.length < topK && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      
      // Relevance score (similarity to query)
      const relevance = candidate.similarity;

      // Diversity score (max dissimilarity to already selected)
      let maxSimilarity = 0;
      for (const selectedDoc of selected) {
        // Use a simplified diversity metric based on cluster/source diversity
        // In production, compute actual embedding similarity
        const diversity = candidate.clusterId !== selectedDoc.clusterId &&
          candidate.sourceType !== selectedDoc.sourceType
          ? 0.5 // Some diversity
          : 0.1; // Low diversity
        
        maxSimilarity = Math.max(maxSimilarity, diversity);
      }
      const diversity = 1 - maxSimilarity;

      // MMR score: lambda * relevance + (1 - lambda) * diversity
      const mmrScore = lambda * relevance + (1 - lambda) * diversity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  logger.debug('Applied MMR', {
    inputCount: candidates.length,
    outputCount: selected.length,
    lambda,
  });

  return selected;
}

/**
 * Filter candidates by sentiment and cluster diversity
 * 
 * Ensures representation from different sentiment clusters and source types.
 * 
 * @param candidates - Candidate documents
 * @param constraints - Filtering constraints
 * @returns Filtered candidate documents
 */
export function filterBySentimentAndCluster(
  candidates: CandidateDoc[],
  constraints: RetrievalConstraints = {}
): CandidateDoc[] {
  let filtered = [...candidates];

  // Filter by sentiment range
  if (constraints.minSentiment !== undefined) {
    filtered = filtered.filter(
      (doc) => doc.sentimentScore === null || doc.sentimentScore >= constraints.minSentiment!
    );
  }

  if (constraints.maxSentiment !== undefined) {
    filtered = filtered.filter(
      (doc) => doc.sentimentScore === null || doc.sentimentScore <= constraints.maxSentiment!
    );
  }

  // Filter by cluster IDs
  if (constraints.clusterIds && constraints.clusterIds.length > 0) {
    filtered = filtered.filter(
      (doc) => doc.clusterId !== null && constraints.clusterIds!.includes(doc.clusterId)
    );
  }

  if (constraints.excludeClusterIds && constraints.excludeClusterIds.length > 0) {
    filtered = filtered.filter(
      (doc) => doc.clusterId === null || !constraints.excludeClusterIds!.includes(doc.clusterId)
    );
  }

  // Filter by source types
  if (constraints.sourceTypes && constraints.sourceTypes.length > 0) {
    filtered = filtered.filter((doc) => constraints.sourceTypes!.includes(doc.sourceType));
  }

  if (constraints.excludeSourceTypes && constraints.excludeSourceTypes.length > 0) {
    filtered = filtered.filter(
      (doc) => !constraints.excludeSourceTypes!.includes(doc.sourceType)
    );
  }

  // Enforce diversity: ensure representation from different clusters
  const clusterMap = new Map<number | null, CandidateDoc[]>();
  for (const doc of filtered) {
    const cluster = doc.clusterId;
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, []);
    }
    clusterMap.get(cluster)!.push(doc);
  }

  // If we have multiple clusters, try to balance representation
  if (clusterMap.size > 1 && filtered.length > 10) {
    const maxPerCluster = Math.ceil(filtered.length / clusterMap.size);
    const balanced: CandidateDoc[] = [];

    for (const [cluster, docs] of clusterMap.entries()) {
      balanced.push(...docs.slice(0, maxPerCluster));
    }

    // Sort by similarity to maintain relevance
    balanced.sort((a, b) => b.similarity - a.similarity);
    filtered = balanced;
  }

  logger.debug('Filtered by sentiment/cluster', {
    inputCount: candidates.length,
    outputCount: filtered.length,
    clusterCount: clusterMap.size,
  });

  return filtered;
}


