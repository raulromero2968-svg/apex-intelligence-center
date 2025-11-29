/**
 * Research Document Ingestion Pipeline
 *
 * Processes uploaded research documents (PDFs, text, markdown, JSON)
 * and prepares them for RAG-based paper generation.
 *
 * Features:
 * - Multi-format support (PDF, MD, TXT, JSON)
 * - Intelligent text chunking with overlap
 * - OpenAI embedding generation (text-embedding-3-large)
 * - Deduplication via content hashing
 * - Metadata extraction
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pool } from '@/db';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';
import { createHash } from 'crypto';
import { z } from 'zod';
import type { PaperSource } from './generator';

/**
 * Document metadata schema
 */
export const DocumentMetadataSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  source_url: z.string().url().optional(),
  publication: z.string().optional(),
  doi: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().default('en'),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

/**
 * Ingestion configuration
 */
export interface IngestionConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  deduplicateContent?: boolean;
  generateEmbeddings?: boolean;
}

/**
 * Ingested document result
 */
export interface IngestedDocument {
  id: string;
  title: string;
  content: string;
  contentType: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  contentHash: string;
  createdAt: Date;
}

/**
 * Document chunk with embedding
 */
export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata: DocumentMetadata;
}

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Research Document Ingestion Pipeline
 */
export class DocumentIngestionPipeline {
  private config: Required<IngestionConfig>;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(config: IngestionConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize || 1500,
      chunkOverlap: config.chunkOverlap || 200,
      deduplicateContent: config.deduplicateContent ?? true,
      generateEmbeddings: config.generateEmbeddings ?? true,
    };

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', ', ', ' ', ''],
    });
  }

  /**
   * Ingest a document from raw content
   *
   * @param content - Raw document content
   * @param contentType - Content type (text, pdf, markdown, json)
   * @param metadata - Document metadata
   * @param userId - Optional user ID
   * @returns Ingested document with chunks
   */
  async ingestDocument(
    content: string,
    contentType: 'text' | 'pdf' | 'markdown' | 'json',
    metadata: Partial<DocumentMetadata> = {},
    userId?: string
  ): Promise<IngestedDocument> {
    return Sentry.startSpan(
      { name: 'papers.ingest', op: 'document_ingestion' },
      async (span: Span) => {
        span?.setAttribute('contentType', contentType);
        span?.setAttribute('contentLength', content.length);

        // Validate metadata
        const validatedMetadata = DocumentMetadataSchema.parse(metadata);

        // Generate content hash for deduplication
        const contentHash = this.hashContent(content);
        span?.setAttribute('contentHash', contentHash);

        // Check for duplicates if enabled
        if (this.config.deduplicateContent) {
          const existing = await this.findDuplicateDocument(contentHash, userId);
          if (existing) {
            console.log('Duplicate document found:', existing.id);
            return existing;
          }
        }

        // Process content based on type
        let processedContent = content;
        if (contentType === 'json') {
          processedContent = this.processJsonContent(content);
        } else if (contentType === 'markdown') {
          processedContent = this.processMarkdownContent(content);
        }

        // Split into chunks
        const textChunks = await this.textSplitter.splitText(processedContent);
        span?.setAttribute('chunkCount', textChunks.length);

        // Generate document ID
        const docId = crypto.randomUUID();

        // Generate embeddings if enabled
        let chunkEmbeddings: number[][] = [];
        if (this.config.generateEmbeddings) {
          try {
            chunkEmbeddings = await embeddings.embedDocuments(textChunks);
            span?.setAttribute('embeddingsGenerated', true);
          } catch (embedError) {
            Sentry.captureException(embedError);
            console.error('Embedding generation failed:', embedError);
            span?.setAttribute('embeddingsGenerated', false);
          }
        }

        // Build chunks
        const chunks: DocumentChunk[] = textChunks.map((text, index) => ({
          id: crypto.randomUUID(),
          content: text,
          chunkIndex: index,
          embedding: chunkEmbeddings[index],
          metadata: validatedMetadata,
        }));

        // Extract title from content if not provided
        const title = validatedMetadata.title || this.extractTitle(processedContent);

        // Save to database
        await this.saveDocument(docId, title, processedContent, contentType, validatedMetadata, chunks, contentHash, userId);

        return {
          id: docId,
          title,
          content: processedContent,
          contentType,
          metadata: validatedMetadata,
          chunks,
          contentHash,
          createdAt: new Date(),
        };
      }
    );
  }

  /**
   * Ingest multiple documents in batch
   *
   * @param documents - Array of documents to ingest
   * @param userId - Optional user ID
   * @returns Array of ingested documents
   */
  async ingestBatch(
    documents: Array<{
      content: string;
      contentType: 'text' | 'pdf' | 'markdown' | 'json';
      metadata?: Partial<DocumentMetadata>;
    }>,
    userId?: string
  ): Promise<IngestedDocument[]> {
    return Sentry.startSpan(
      { name: 'papers.ingest.batch', op: 'batch_ingestion' },
      async (span: Span) => {
        span?.setAttribute('documentCount', documents.length);

        const results: IngestedDocument[] = [];

        for (const doc of documents) {
          try {
            const ingested = await this.ingestDocument(
              doc.content,
              doc.contentType,
              doc.metadata,
              userId
            );
            results.push(ingested);
          } catch (error) {
            Sentry.captureException(error, {
              extra: { contentType: doc.contentType },
            });
            console.error('Failed to ingest document:', error);
          }
        }

        span?.setAttribute('successCount', results.length);
        return results;
      }
    );
  }

  /**
   * Search ingested documents for paper generation
   *
   * @param query - Search query
   * @param limit - Maximum results
   * @param userId - Optional user ID filter
   * @returns Array of paper sources
   */
  async searchDocuments(
    query: string,
    limit: number = 20,
    userId?: string
  ): Promise<PaperSource[]> {
    return Sentry.startSpan(
      { name: 'papers.search', op: 'document_search' },
      async (span: Span) => {
        span?.setAttribute('query', query.slice(0, 100));
        span?.setAttribute('limit', limit);

        // Generate query embedding
        const queryEmbedding = await embeddings.embedQuery(query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        // Build query with optional user filter
        const userFilter = userId ? `AND user_id = $3` : '';
        const params = userId
          ? [embeddingStr, limit, userId]
          : [embeddingStr, limit];

        const client = await pool.connect();
        try {
          const result = await client.query(
            `
            SELECT
              id,
              content,
              metadata,
              content_type as source_type,
              1 - (embedding::vector <=> $1::vector) AS score,
              created_at
            FROM research_documents
            WHERE embedding IS NOT NULL ${userFilter}
            ORDER BY embedding::vector <=> $1::vector
            LIMIT $2
            `,
            params
          );

          span?.setAttribute('resultCount', result.rows.length);

          return result.rows.map((row) => ({
            id: row.id,
            content: row.content,
            metadata: row.metadata || {},
            score: row.score,
            source_type: row.source_type,
          }));
        } finally {
          client.release();
        }
      }
    );
  }

  /**
   * Get documents by IDs
   *
   * @param ids - Document IDs
   * @returns Array of paper sources
   */
  async getDocumentsByIds(ids: string[]): Promise<PaperSource[]> {
    if (ids.length === 0) return [];

    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT
          id,
          content,
          metadata,
          content_type as source_type,
          created_at
        FROM research_documents
        WHERE id = ANY($1)
        `,
        [ids]
      );

      return result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata || {},
        score: 1.0, // Full relevance for explicit selection
        source_type: row.source_type,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Delete a document and its chunks
   *
   * @param docId - Document ID
   * @param userId - User ID for authorization
   */
  async deleteDocument(docId: string, userId?: string): Promise<void> {
    const client = await pool.connect();
    try {
      const userFilter = userId ? `AND user_id = $2` : '';
      const params = userId ? [docId, userId] : [docId];

      // Delete parent and chunks (cascade)
      await client.query(
        `DELETE FROM research_documents WHERE id = $1 OR parent_doc_id = $1 ${userFilter}`,
        params
      );
    } finally {
      client.release();
    }
  }

  /**
   * List user's documents
   *
   * @param userId - User ID
   * @param limit - Maximum results
   * @param offset - Pagination offset
   */
  async listUserDocuments(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{ id: string; title: string; contentType: string; createdAt: Date }>> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, title, content_type, created_at
        FROM research_documents
        WHERE user_id = $1 AND parent_doc_id IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit, offset]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        contentType: row.content_type,
        createdAt: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Hash content for deduplication
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Find duplicate document by content hash
   */
  private async findDuplicateDocument(
    contentHash: string,
    userId?: string
  ): Promise<IngestedDocument | null> {
    const client = await pool.connect();
    try {
      const userFilter = userId ? `AND user_id = $2` : '';
      const params = userId ? [contentHash, userId] : [contentHash];

      // Look for existing document with same hash in metadata
      const result = await client.query(
        `
        SELECT id, title, content, content_type, metadata, created_at
        FROM research_documents
        WHERE metadata->>'content_hash' = $1 ${userFilter}
        LIMIT 1
        `,
        params
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        contentType: row.content_type,
        metadata: row.metadata || {},
        chunks: [], // Chunks not loaded for duplicate check
        contentHash,
        createdAt: row.created_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Save document to database
   */
  private async saveDocument(
    docId: string,
    title: string,
    content: string,
    contentType: string,
    metadata: DocumentMetadata,
    chunks: DocumentChunk[],
    contentHash: string,
    userId?: string
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert main document
      await client.query(
        `
        INSERT INTO research_documents (id, user_id, title, content, content_type, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `,
        [docId, userId || null, title, content, contentType, { ...metadata, content_hash: contentHash }]
      );

      // Insert chunks with embeddings
      for (const chunk of chunks) {
        const embeddingJson = chunk.embedding ? JSON.stringify(chunk.embedding) : null;

        await client.query(
          `
          INSERT INTO research_documents (id, user_id, title, content, content_type, metadata, embedding, chunk_index, parent_doc_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `,
          [
            chunk.id,
            userId || null,
            `${title} (chunk ${chunk.chunkIndex + 1})`,
            chunk.content,
            contentType,
            { ...metadata, parent_id: docId },
            embeddingJson,
            chunk.chunkIndex,
            docId,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process JSON content (e.g., X posts, API responses)
   */
  private processJsonContent(content: string): string {
    try {
      const parsed = JSON.parse(content);

      // Handle array of items
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item.text) return item.text;
            if (item.content) return item.content;
            return JSON.stringify(item);
          })
          .join('\n\n');
      }

      // Handle single object
      if (parsed.text) return parsed.text;
      if (parsed.content) return parsed.content;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content; // Return as-is if not valid JSON
    }
  }

  /**
   * Process markdown content
   */
  private processMarkdownContent(content: string): string {
    // Remove excessive whitespace while preserving structure
    return content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string {
    // Try to find a heading
    const headingMatch = content.match(/^#+\s+(.+)$/m) || content.match(/^(.+)\n={3,}$/m);
    if (headingMatch) {
      return headingMatch[1].trim().slice(0, 200);
    }

    // Use first line or first 50 characters
    const firstLine = content.split('\n')[0].trim();
    return firstLine.slice(0, 200) || 'Untitled Document';
  }
}

/**
 * Factory function for ingestion pipeline
 *
 * @param config - Ingestion configuration
 * @returns Configured DocumentIngestionPipeline instance
 */
export function createIngestionPipeline(
  config?: IngestionConfig
): DocumentIngestionPipeline {
  return new DocumentIngestionPipeline(config);
}
