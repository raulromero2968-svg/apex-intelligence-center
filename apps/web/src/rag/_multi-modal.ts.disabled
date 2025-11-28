/**
 * Multi-Modal RAG - Vector search for images and audio
 *
 * Provides hybrid search capabilities for multi-modal embeddings (CLIP, Wav2Vec2)
 * to support personalized video generation with face/voice retrieval.
 *
 * Features:
 * - Vector similarity search for face/pose matching
 * - Audio embedding retrieval for voice cloning
 * - Hybrid search combining modalities
 * - User-specific filtering
 */

import { db } from '@/db';
import { multiModalEmbeddings } from '@/db/schema';
import { sql, eq, and, desc } from 'drizzle-orm';

/**
 * Multi-modal search result
 */
export interface MultiModalSearchResult {
  id: string;
  userId: string;
  type: 'image' | 'audio';
  fileUrl: string;
  metadata: Record<string, any>;
  similarity: number;
  createdAt: Date;
}

/**
 * Search options for multi-modal RAG
 */
export interface MultiModalSearchOptions {
  userId?: string;
  type?: 'image' | 'audio';
  limit?: number;
  minSimilarity?: number;
}

/**
 * Vector similarity search for multi-modal embeddings
 *
 * Uses pgvector cosine distance for fast similarity search.
 * Supports filtering by user and modality type.
 *
 * @param embedding - Query embedding vector (768-dim)
 * @param options - Search options (user, type, limit, etc.)
 * @returns Array of similar embeddings with similarity scores
 */
export async function multiModalVectorSearch(
  embedding: number[],
  options: MultiModalSearchOptions = {}
): Promise<MultiModalSearchResult[]> {
  const {
    userId,
    type,
    limit = 5,
    minSimilarity = 0.7,
  } = options;

  // Build WHERE conditions
  const conditions = [];
  if (userId) {
    conditions.push(eq(multiModalEmbeddings.userId, userId));
  }
  if (type) {
    conditions.push(eq(multiModalEmbeddings.type, type));
  }

  // Validate embedding is array of finite numbers to prevent SQL injection
  if (!Array.isArray(embedding) || !embedding.every((v) => typeof v === 'number' && Number.isFinite(v))) {
    throw new Error('Invalid embedding vector: must be an array of finite numbers');
  }

  // Construct the query with vector similarity (using validated vector)
  const vectorLiteral = `'[${embedding.join(',')}]'::vector`;

  const results = await db
    .select({
      id: multiModalEmbeddings.id,
      userId: multiModalEmbeddings.userId,
      type: multiModalEmbeddings.type,
      fileUrl: multiModalEmbeddings.fileUrl,
      metadata: multiModalEmbeddings.metadata,
      createdAt: multiModalEmbeddings.createdAt,
      // Calculate cosine similarity (1 - cosine_distance)
      similarity: sql<number>`1 - (${multiModalEmbeddings.embedding} <=> ${sql.raw(vectorLiteral)})`,
    })
    .from(multiModalEmbeddings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${multiModalEmbeddings.embedding} <=> ${sql.raw(vectorLiteral)}`)
    .limit(limit);

  // Filter by minimum similarity
  return results
    .filter((r) => r.similarity >= minSimilarity)
    .map((r) => ({
      ...r,
      type: r.type as 'image' | 'audio',
    }));
}

/**
 * Hybrid multi-modal search
 *
 * Combines image and audio embeddings to find the best matches
 * for video generation. Uses weighted fusion of similarity scores.
 *
 * @param imageEmbedding - CLIP image embedding
 * @param audioEmbedding - Wav2Vec2 audio embedding
 * @param userId - User ID for personalization
 * @param weights - Weights for fusion (default: equal weight)
 * @returns Combined search results
 */
export async function hybridMultiModalSearch(
  imageEmbedding: number[] | null,
  audioEmbedding: number[] | null,
  userId: string,
  weights: { image: number; audio: number } = { image: 0.5, audio: 0.5 }
): Promise<{
  images: MultiModalSearchResult[];
  audio: MultiModalSearchResult[];
  combined: Array<MultiModalSearchResult & { combinedScore: number }>;
}> {
  const imageResults = imageEmbedding
    ? await multiModalVectorSearch(imageEmbedding, { userId, type: 'image', limit: 10 })
    : [];

  const audioResults = audioEmbedding
    ? await multiModalVectorSearch(audioEmbedding, { userId, type: 'audio', limit: 10 })
    : [];

  // Combine results with weighted scores
  const combined = [
    ...imageResults.map((r) => ({ ...r, combinedScore: r.similarity * weights.image })),
    ...audioResults.map((r) => ({ ...r, combinedScore: r.similarity * weights.audio })),
  ].sort((a, b) => b.combinedScore - a.combinedScore);

  return {
    images: imageResults,
    audio: audioResults,
    combined,
  };
}

/**
 * Get user embeddings by type
 *
 * Retrieves all embeddings for a user, optionally filtered by type.
 * Useful for listing available assets for video generation.
 *
 * @param userId - User ID
 * @param type - Optional modality type filter
 * @returns Array of user embeddings
 */
export async function getUserEmbeddings(
  userId: string,
  type?: 'image' | 'audio'
): Promise<MultiModalSearchResult[]> {
  const conditions = [eq(multiModalEmbeddings.userId, userId)];
  if (type) {
    conditions.push(eq(multiModalEmbeddings.type, type));
  }

  const results = await db
    .select({
      id: multiModalEmbeddings.id,
      userId: multiModalEmbeddings.userId,
      type: multiModalEmbeddings.type,
      fileUrl: multiModalEmbeddings.fileUrl,
      metadata: multiModalEmbeddings.metadata,
      createdAt: multiModalEmbeddings.createdAt,
      similarity: sql<number>`1.0`, // No similarity calculation needed
    })
    .from(multiModalEmbeddings)
    .where(and(...conditions))
    .orderBy(desc(multiModalEmbeddings.createdAt));

  return results.map((r) => ({
    ...r,
    type: r.type as 'image' | 'audio',
  }));
}

/**
 * Find similar faces/poses for video generation
 *
 * Given a reference image embedding, finds the most similar user images
 * for face swapping and pose transfer in video generation.
 *
 * @param referenceEmbedding - CLIP embedding of reference image
 * @param userId - User ID for personalization
 * @param limit - Number of results to return
 * @returns Array of similar face/pose images
 */
export async function findSimilarFaces(
  referenceEmbedding: number[],
  userId: string,
  limit: number = 5
): Promise<MultiModalSearchResult[]> {
  return multiModalVectorSearch(referenceEmbedding, {
    userId,
    type: 'image',
    limit,
    minSimilarity: 0.6, // Lower threshold for more variety
  });
}

/**
 * Find similar voice samples for TTS
 *
 * Given a reference audio embedding, finds the most similar user audio
 * for voice cloning and lip-sync in video generation.
 *
 * @param referenceEmbedding - Wav2Vec2 embedding of reference audio
 * @param userId - User ID for personalization
 * @param limit - Number of results to return
 * @returns Array of similar voice samples
 */
export async function findSimilarVoices(
  referenceEmbedding: number[],
  userId: string,
  limit: number = 5
): Promise<MultiModalSearchResult[]> {
  return multiModalVectorSearch(referenceEmbedding, {
    userId,
    type: 'audio',
    limit,
    minSimilarity: 0.7, // Higher threshold for voice quality
  });
}
