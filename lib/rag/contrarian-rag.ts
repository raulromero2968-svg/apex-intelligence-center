/**
 * Contrarian RAG with Maximum Marginal Relevance (MMR)
 *
 * Implements MMR retrieval with sentiment-aware diversity enforcement.
 * Ensures balanced representation of bullish and bearish perspectives in search results.
 *
 * Key Features:
 * - MMR with lambda=0.5 (equal balance of relevance and diversity)
 * - Sentiment clustering (bullish, bearish, neutral)
 * - Guaranteed sentiment diversity in top-5 results
 * - SQL-based MMR approximation using pgvector
 *
 * @module contrarian-rag
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { Pool } from 'pg';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Document interface matching the RAG system's SearchResult structure
 */
export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number; // Similarity score (0-1)
  source_type: string;
  created_at: Date;
  embedding?: number[]; // Optional embedding vector
  sentiment?: 'bullish' | 'bearish' | 'neutral'; // Sentiment classification
}

/**
 * Sentiment keywords for classification
 */
const SENTIMENT_KEYWORDS = {
  bullish: [
    'bullish',
    'uptrend',
    'growth',
    'surge',
    'rally',
    'breakout',
    'demand',
    'appreciation',
    'strong',
    'gains',
    'outperform',
    'buy',
    'accumulate',
    'opportunity',
    'undervalued',
  ],
  bearish: [
    'bearish',
    'downtrend',
    'decline',
    'crash',
    'correction',
    'weakness',
    'overvalued',
    'risk',
    'loss',
    'sell',
    'distribute',
    'caution',
    'resistance',
    'bubble',
    'concern',
  ],
};

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

/**
 * Classify document sentiment based on keyword matching
 *
 * Uses a simple but effective keyword-based approach for sentiment classification.
 * Counts bullish and bearish keywords in content and metadata.
 *
 * @param doc - Document to classify
 * @returns Sentiment classification: 'bullish', 'bearish', or 'neutral'
 */
function classifySentiment(doc: Document): 'bullish' | 'bearish' | 'neutral' {
  const text = `${doc.content} ${JSON.stringify(doc.metadata)}`.toLowerCase();

  let bullishCount = 0;
  let bearishCount = 0;

  // Count bullish keywords
  for (const keyword of SENTIMENT_KEYWORDS.bullish) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      bullishCount += matches.length;
    }
  }

  // Count bearish keywords
  for (const keyword of SENTIMENT_KEYWORDS.bearish) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      bearishCount += matches.length;
    }
  }

  // Classify based on keyword counts
  // Require a minimum threshold to avoid false positives
  const threshold = 2; // Minimum 2 keywords to classify as bullish/bearish

  if (bullishCount >= threshold && bullishCount > bearishCount * 1.5) {
    return 'bullish';
  } else if (bearishCount >= threshold && bearishCount > bullishCount * 1.5) {
    return 'bearish';
  } else {
    return 'neutral';
  }
}

/**
 * Group documents by sentiment
 *
 * @param docs - Documents to group
 * @returns Map of sentiment to documents
 */
function groupBySentiment(docs: Document[]): Map<string, Document[]> {
  const groups = new Map<string, Document[]>();
  groups.set('bullish', []);
  groups.set('bearish', []);
  groups.set('neutral', []);

  for (const doc of docs) {
    const sentiment = doc.sentiment || classifySentiment(doc);
    doc.sentiment = sentiment; // Cache sentiment classification
    groups.get(sentiment)!.push(doc);
  }

  return groups;
}

// ============================================================================
// MMR ALGORITHM
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity (0-1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate MMR score for a document
 *
 * MMR balances relevance to the query with diversity from already-selected documents.
 *
 * Formula: MMR = λ * Sim(D, Q) - (1 - λ) * max[Sim(D, d)]
 * where:
 * - λ (lambda) controls the relevance/diversity tradeoff
 * - Sim(D, Q) is the similarity between document D and query Q
 * - max[Sim(D, d)] is the maximum similarity between D and any selected document d
 *
 * @param doc - Candidate document
 * @param queryEmbedding - Query embedding vector
 * @param selectedDocs - Already-selected documents
 * @param lambda - Relevance/diversity tradeoff (0-1, default 0.5)
 * @returns MMR score
 */
function calculateMMR(
  doc: Document,
  queryEmbedding: number[],
  selectedDocs: Document[],
  lambda: number = 0.5
): number {
  if (!doc.embedding) {
    throw new Error('Document must have embedding for MMR calculation');
  }

  // Calculate relevance to query
  const relevance = cosineSimilarity(doc.embedding, queryEmbedding);

  // Calculate maximum similarity to already-selected documents
  let maxSimilarity = 0;
  for (const selectedDoc of selectedDocs) {
    if (selectedDoc.embedding) {
      const similarity = cosineSimilarity(doc.embedding, selectedDoc.embedding);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
  }

  // MMR formula: λ * relevance - (1 - λ) * diversity_penalty
  const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

  return mmrScore;
}

/**
 * Select documents using MMR with sentiment diversity enforcement
 *
 * Iteratively selects documents that maximize MMR score while ensuring
 * sentiment diversity. Guarantees at least one bullish and one bearish
 * document in the top-5 results when enableContrarian is true.
 *
 * @param candidates - Candidate documents with embeddings
 * @param queryEmbedding - Query embedding vector
 * @param limit - Maximum number of documents to return
 * @param lambda - MMR lambda parameter (default 0.5)
 * @param enableContrarian - Enable sentiment diversity enforcement
 * @returns Selected documents ordered by MMR score
 */
function selectWithMMR(
  candidates: Document[],
  queryEmbedding: number[],
  limit: number,
  lambda: number = 0.5,
  enableContrarian: boolean = false
): Document[] {
  const selected: Document[] = [];
  const remaining = [...candidates];

  // Classify sentiment for all candidates
  for (const doc of remaining) {
    if (!doc.sentiment) {
      doc.sentiment = classifySentiment(doc);
    }
  }

  if (enableContrarian && limit >= 5) {
    // Enforce sentiment diversity: guarantee at least 1 bullish and 1 bearish in top-5
    const sentimentGroups = groupBySentiment(remaining);

    // Select top bullish document
    const bullishDocs = sentimentGroups.get('bullish')!;
    if (bullishDocs.length > 0) {
      const topBullish = bullishDocs.reduce((best, doc) =>
        calculateMMR(doc, queryEmbedding, selected, lambda) >
        calculateMMR(best, queryEmbedding, selected, lambda)
          ? doc
          : best
      );
      selected.push(topBullish);
      const index = remaining.indexOf(topBullish);
      if (index > -1) remaining.splice(index, 1);
    }

    // Select top bearish document
    const bearishDocs = sentimentGroups.get('bearish')!;
    if (bearishDocs.length > 0) {
      const topBearish = bearishDocs.reduce((best, doc) =>
        calculateMMR(doc, queryEmbedding, selected, lambda) >
        calculateMMR(best, queryEmbedding, selected, lambda)
          ? doc
          : best
      );
      selected.push(topBearish);
      const index = remaining.indexOf(topBearish);
      if (index > -1) remaining.splice(index, 1);
    }
  }

  // Iteratively select remaining documents using MMR
  while (selected.length < limit && remaining.length > 0) {
    let bestDoc: Document | null = null;
    let bestScore = -Infinity;
    let bestIndex = -1;

    // Find document with highest MMR score
    for (let i = 0; i < remaining.length; i++) {
      const doc = remaining[i];
      const mmrScore = calculateMMR(doc, queryEmbedding, selected, lambda);

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestDoc = doc;
        bestIndex = i;
      }
    }

    if (bestDoc) {
      selected.push(bestDoc);
      remaining.splice(bestIndex, 1);
    } else {
      break; // No more documents to select
    }
  }

  return selected;
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Contrarian search with MMR and sentiment diversity
 *
 * Performs vector similarity search with Maximum Marginal Relevance (MMR)
 * to balance relevance and diversity. When enableContrarian is true,
 * enforces sentiment diversity to ensure balanced perspectives.
 *
 * **Algorithm:**
 * 1. Generate query embedding
 * 2. Retrieve top-K candidates using vector similarity (K = limit * 3)
 * 3. Fetch full embeddings for candidates
 * 4. Apply MMR re-ranking with λ=0.5
 * 5. If enableContrarian: enforce sentiment diversity (≥1 bullish, ≥1 bearish)
 * 6. Return top N results
 *
 * **Performance:**
 * - Uses SQL-based candidate retrieval (fast)
 * - MMR computed in-memory (manageable for top-K)
 * - Sentiment classification via keyword matching (no LLM calls)
 *
 * @param query - Natural language query
 * @param enableContrarian - Enable sentiment diversity enforcement
 * @param pool - PostgreSQL connection pool
 * @param limit - Maximum number of results (default 10)
 * @param lambda - MMR lambda parameter (default 0.5)
 * @returns Array of documents ordered by MMR score
 *
 * @example
 * ```typescript
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 * const results = await contrarianSearch(
 *   "Will Charizard prices increase?",
 *   true,
 *   pool,
 *   10
 * );
 * // Results will include both bullish and bearish perspectives
 * ```
 */
export async function contrarianSearch(
  query: string,
  enableContrarian: boolean,
  pool: Pool,
  limit: number = 10,
  lambda: number = 0.5
): Promise<Document[]> {
  // Initialize embeddings model
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Step 1: Generate query embedding
  const queryEmbedding = await embeddings.embedQuery(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Step 2: Retrieve top-K candidates using vector similarity
  // We retrieve 3x the limit to have enough candidates for MMR re-ranking
  const candidateLimit = limit * 3;

  const client = await pool.connect();
  try {
    // SQL query: retrieve candidates with embeddings
    // Using cosine similarity via pgvector's <=> operator
    const result = await client.query(
      `
      SELECT
        id,
        content,
        metadata,
        source_type,
        created_at,
        embedding,
        1 - (embedding <=> $1::vector) AS similarity_score
      FROM tcg_documents
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      [embeddingStr, candidateLimit]
    );

    // Step 3: Parse candidates and convert embeddings
    const candidates: Document[] = result.rows.map((row) => {
      let embedding: number[] | undefined = undefined;

      if (row.embedding) {
        // Parse pgvector embedding
        // pgvector can return embeddings as string "[0.1,0.2,...]" or array
        if (typeof row.embedding === 'string') {
          // Remove brackets and parse as JSON array
          const cleaned = row.embedding.replace(/^\[|\]$/g, '');
          embedding = cleaned.split(',').map((v: string) => parseFloat(v.trim()));
        } else if (Array.isArray(row.embedding)) {
          embedding = row.embedding;
        }
      }

      return {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        score: row.similarity_score,
        source_type: row.source_type,
        created_at: row.created_at,
        embedding,
      };
    });

    // Step 4: Apply MMR re-ranking with sentiment diversity
    const selected = selectWithMMR(
      candidates,
      queryEmbedding,
      limit,
      lambda,
      enableContrarian
    );

    // Update scores to reflect MMR scores
    for (let i = 0; i < selected.length; i++) {
      selected[i].score = calculateMMR(
        selected[i],
        queryEmbedding,
        selected.slice(0, i),
        lambda
      );
    }

    return selected;
  } finally {
    client.release();
  }
}

/**
 * Validate sentiment diversity in results
 *
 * Utility function to check if results meet sentiment diversity requirements.
 * Useful for testing and debugging.
 *
 * @param results - Search results
 * @param requireBullish - Require at least one bullish document
 * @param requireBearish - Require at least one bearish document
 * @returns Validation result
 */
export function validateSentimentDiversity(
  results: Document[],
  requireBullish: boolean = true,
  requireBearish: boolean = true
): { valid: boolean; bullishCount: number; bearishCount: number; neutralCount: number } {
  const sentimentGroups = groupBySentiment(results);

  const bullishCount = sentimentGroups.get('bullish')!.length;
  const bearishCount = sentimentGroups.get('bearish')!.length;
  const neutralCount = sentimentGroups.get('neutral')!.length;

  const valid =
    (!requireBullish || bullishCount >= 1) &&
    (!requireBearish || bearishCount >= 1);

  return {
    valid,
    bullishCount,
    bearishCount,
    neutralCount,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { classifySentiment, groupBySentiment, calculateMMR, selectWithMMR };
