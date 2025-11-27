/**
 * Voyage AI Embeddings Service for Apex Intelligence RAG
 *
 * voyage-3.5-large is the SOTA embedding model for mixed text/table/numeric TCG data
 * November 2025 benchmarks show 12% better retrieval quality vs OpenAI text-embedding-3-large
 *
 * Key advantages:
 * - Optimized for mixed structured + unstructured data (perfect for TCG listings/pop reports)
 * - Separate input_type for documents vs queries (improves retrieval accuracy)
 * - 1024 dimensions (vs OpenAI's 1536) = 33% faster similarity search
 * - $0.13/1M tokens (vs OpenAI's $0.13/1M) = cost-neutral migration
 *
 * Usage:
 * ```typescript
 * import { VoyageEmbeddings } from '@/lib/embeddings';
 * const embeddings = new VoyageEmbeddings();
 * const vectors = await embeddings.embedDocuments(['text1', 'text2']);
 * const queryVector = await embeddings.embedQuery('search query');
 * ```
 */

import * as Sentry from '@sentry/nextjs';

export interface VoyageEmbeddingOptions {
  apiKey?: string;
  model?: string; // "voyage-3.5-large" | "voyage-3" | "voyage-code-3"
  batchSize?: number;
}

/**
 * Voyage AI Embeddings wrapper compatible with LangChain interface
 */
export class VoyageEmbeddings {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.voyageai.com/v1';
  private batchSize: number;

  constructor(options: VoyageEmbeddingOptions = {}) {
    this.apiKey = options.apiKey || process.env.VOYAGE_API_KEY || '';
    this.model = options.model || 'voyage-3.5-large';
    this.batchSize = options.batchSize || 128; // Voyage allows up to 128 texts per request

    if (!this.apiKey) {
      console.warn(
        'VOYAGE_API_KEY not set. Voyage embeddings will fail. Set VOYAGE_API_KEY in environment variables or pass to constructor.'
      );
    }
  }

  /**
   * Embed multiple documents with input_type="document"
   *
   * @param texts - Array of text strings to embed
   * @returns Array of embedding vectors (1024 dimensions each)
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embedBatch(texts, 'document');
  }

  /**
   * Embed a single query with input_type="query"
   *
   * @param text - Query text to embed
   * @returns Embedding vector (1024 dimensions)
   */
  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embedBatch([text], 'query');
    return results[0];
  }

  /**
   * Internal batch embedding method
   *
   * @param texts - Texts to embed
   * @param inputType - "document" for corpus, "query" for search queries
   * @returns Array of embedding vectors
   */
  private async embedBatch(
    texts: string[],
    inputType: 'document' | 'query'
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Split into batches if needed
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      batches.push(texts.slice(i, i + this.batchSize));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      try {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: batch,
            input_type: inputType,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Voyage API error (${response.status}): ${errorText}`
          );
        }

        const data = await response.json();

        // Voyage API returns { data: [{ embedding: number[] }, ...], model: string, usage: {...} }
        const embeddings = data.data.map((item: any) => item.embedding);
        allEmbeddings.push(...embeddings);
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            batchSize: batch.length,
            inputType,
            model: this.model,
          },
        });
        console.error('Voyage embedding error:', error);
        throw error;
      }
    }

    return allEmbeddings;
  }

  /**
   * Get the dimension size of embeddings from this model
   *
   * @returns 1024 for voyage-3.5-large
   */
  getDimensions(): number {
    // voyage-3.5-large and voyage-3 use 1024 dimensions
    // voyage-code-3 uses 1024 dimensions
    return 1024;
  }
}

/**
 * Factory function for easy instantiation
 *
 * @example
 * ```typescript
 * const embeddings = createVoyageEmbeddings();
 * const vectors = await embeddings.embedDocuments(['doc1', 'doc2']);
 * ```
 */
export function createVoyageEmbeddings(
  options?: VoyageEmbeddingOptions
): VoyageEmbeddings {
  return new VoyageEmbeddings(options);
}

/**
 * Cosine similarity helper for citation validation
 *
 * @param vecA - First embedding vector
 * @param vecB - Second embedding vector
 * @returns Cosine similarity score (0-1)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

