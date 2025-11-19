/**
 * TCG Data Ingestion Pipeline for RAG System
 *
 * This module handles the idempotent ingestion of TCG market data
 * from various sources (eBay, PSA, news articles, etc.) into the
 * vector database for semantic search.
 *
 * Key features:
 * - Idempotent: Uses unique_id to prevent duplicate ingestion
 * - Chunking: Splits large documents for better retrieval
 * - Embeddings: Generates OpenAI embeddings for semantic search
 * - Provenance: Preserves full source metadata for attribution
 */

import { OpenAIEmbeddings } from '@langchain/openai';
// TODO: Install @langchain/textsplitters package
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { db, pool } from '@/db';
import { tcg_documents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

// Initialize OpenAI embeddings
// Uses text-embedding-3-large (1536 dimensions) for high-quality semantic search
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Text splitter for chunking large documents
// Optimized for TCG content (listings, articles, reports)
// TODO: Re-enable after installing @langchain/textsplitters
// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   chunkOverlap: 200,
//   separators: ['\n\n', '\n', '. ', ' ', ''],
// });

/**
 * Source types supported by the ingestion pipeline
 */
export type SourceType =
  | 'ebay_listing'
  | 'psa_pop_report'
  | 'bgs_pop_report'
  | 'reddit_comment'
  | 'news_article'
  | 'youtube_transcript'
  | 'tcgplayer_listing'
  | 'cardmarket_listing';

/**
 * Generic TCG data item for ingestion
 */
export interface TcgDataItem {
  content: string; // The raw text content to embed
  metadata: Record<string, any>; // Source-specific metadata
  // metadata MUST include a 'unique_id' field for idempotency
}

/**
 * Ingestion result
 */
export interface IngestionResult {
  sourceType: SourceType;
  totalItems: number;
  newDocuments: number;
  updatedDocuments: number;
  chunks: number;
  errors: number;
}

/**
 * Ingest TCG data from any source with idempotency
 *
 * @param sourceType - The type of data source
 * @param items - Array of items to ingest
 * @returns Ingestion statistics
 *
 * @example
 * ```typescript
 * await ingestTcgData('ebay_listing', [
 *   {
 *     content: "1st Edition Charizard PSA 10 - Rare holo...",
 *     metadata: {
 *       card_name: "Charizard",
 *       set: "Base Set",
 *       grade: "PSA 10",
 *       sale_price: 15000,
 *       auction_id: "123456789",
 *       unique_id: "ebay_123456789"
 *     }
 *   }
 * ]);
 * ```
 */
export async function ingestTcgData(
  sourceType: SourceType,
  items: TcgDataItem[]
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sourceType,
    totalItems: items.length,
    newDocuments: 0,
    updatedDocuments: 0,
    chunks: 0,
    errors: 0,
  };

  return Sentry.startSpan(
    { name: 'rag.ingest', op: 'ingestion' },
    async (span: Span) => {
      span?.setAttribute('sourceType', sourceType);
      span?.setAttribute('itemCount', items.length);

      for (const item of items) {
        try {
          // Validate unique_id
          if (!item.metadata.unique_id) {
            throw new Error('metadata.unique_id is required for idempotent ingestion');
          }

          // Split content into chunks for better retrieval
          // TODO: Re-enable after installing @langchain/textsplitters
          const chunks = [{ pageContent: item.content, metadata: {} }]; // await splitter.createDocuments([item.content]);
          result.chunks += chunks.length;

          // Generate embeddings for all chunks
          const chunkTexts = chunks.map((c) => c.pageContent);
          const embeddingVectors = await embeddings.embedDocuments(chunkTexts);

          // Insert each chunk as a separate document
          const client = await pool.connect();
          try {
            await client.query('BEGIN');

            for (let i = 0; i < chunks.length; i++) {
              const chunkMetadata = {
                ...item.metadata,
                chunk_id: i,
                chunk_total: chunks.length,
                // Make unique_id unique per chunk
                unique_id: `${item.metadata.unique_id}_chunk_${i}`,
              };

              // Convert embedding to pgvector format
              const embeddingStr = `[${embeddingVectors[i].join(',')}]`;

              // Upsert with ON CONFLICT
              const res = await client.query(
                `
                INSERT INTO tcg_documents (source_type, content, metadata, embedding)
                VALUES ($1, $2, $3, $4::vector)
                ON CONFLICT ((metadata->>'unique_id'))
                DO UPDATE SET
                  content = EXCLUDED.content,
                  metadata = EXCLUDED.metadata,
                  embedding = EXCLUDED.embedding,
                  updated_at = now()
                RETURNING (xmax = 0) AS inserted
                `,
                [sourceType, chunks[i].pageContent, JSON.stringify(chunkMetadata), embeddingStr]
              );

              if (res.rows[0]?.inserted) {
                result.newDocuments++;
              } else {
                result.updatedDocuments++;
              }
            }

            await client.query('COMMIT');
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        } catch (error) {
          result.errors++;
          Sentry.captureException(error, {
            extra: {
              sourceType,
              itemMetadata: item.metadata,
            },
          });
          console.error(`Error ingesting item ${item.metadata.unique_id}:`, error);
        }
      }

      span?.setAttribute('newDocuments', result.newDocuments);
      span?.setAttribute('updatedDocuments', result.updatedDocuments);
      span?.setAttribute('chunks', result.chunks);
      span?.setAttribute('errors', result.errors);

      return result;
    }
  );
}

/**
 * Helper: Ingest eBay listings
 *
 * @example
 * ```typescript
 * await ingestEbayListings([
 *   {
 *     title: "1st Edition Charizard PSA 10",
 *     description: "Rare holo...",
 *     card_name: "Charizard",
 *     set: "Base Set",
 *     grade: "PSA 10",
 *     sale_price: 15000,
 *     sale_date: "2025-10-28",
 *     auction_id: "123456789",
 *     source_url: "https://ebay.com/itm/123456789"
 *   }
 * ]);
 * ```
 */
export async function ingestEbayListings(
  listings: Array<{
    title: string;
    description: string;
    card_name: string;
    set: string;
    grade?: string;
    sale_price: number;
    sale_date: string;
    auction_id: string;
    source_url: string;
  }>
): Promise<IngestionResult> {
  const items: TcgDataItem[] = listings.map((listing) => ({
    content: `${listing.title}\n\n${listing.description}`,
    metadata: {
      card_name: listing.card_name,
      set: listing.set,
      grade: listing.grade,
      sale_price: listing.sale_price,
      sale_date: listing.sale_date,
      auction_id: listing.auction_id,
      source_url: listing.source_url,
      unique_id: `ebay_${listing.auction_id}`,
    },
  }));

  return ingestTcgData('ebay_listing', items);
}

/**
 * Helper: Ingest PSA Population Reports
 *
 * @example
 * ```typescript
 * await ingestPsaPopReports([
 *   {
 *     card_name: "Charizard",
 *     set: "Base Set",
 *     set_number: "4",
 *     grade: "PSA 10",
 *     population: 54,
 *     report_date: "2025-11-01",
 *     source_url: "https://psacard.com/..."
 *   }
 * ]);
 * ```
 */
export async function ingestPsaPopReports(
  reports: Array<{
    card_name: string;
    set: string;
    set_number?: string;
    grade: string;
    population: number;
    report_date: string;
    source_url: string;
  }>
): Promise<IngestionResult> {
  const items: TcgDataItem[] = reports.map((report) => ({
    content: `PSA Population Report for ${report.card_name} from ${report.set} (${report.set_number || 'N/A'}). Grade: ${report.grade}. Population: ${report.population} as of ${report.report_date}.`,
    metadata: {
      card_name: report.card_name,
      set: report.set,
      set_number: report.set_number,
      grade: report.grade,
      population: report.population,
      report_date: report.report_date,
      source_url: report.source_url,
      unique_id: `psa_${report.card_name.toLowerCase().replace(/\s+/g, '_')}_${report.set.toLowerCase().replace(/\s+/g, '_')}_${report.grade.replace(/\s+/g, '_')}_${report.report_date}`,
    },
  }));

  return ingestTcgData('psa_pop_report', items);
}

/**
 * Helper: Ingest news articles
 *
 * @example
 * ```typescript
 * await ingestNewsArticles([
 *   {
 *     title: "Charizard Prices Hit Record High",
 *     content: "Market analysis shows...",
 *     author: "John Doe",
 *     publication: "TCGPlayer Infinite",
 *     publish_date: "2025-11-15",
 *     source_url: "https://infinite.tcgplayer.com/..."
 *   }
 * ]);
 * ```
 */
export async function ingestNewsArticles(
  articles: Array<{
    title: string;
    content: string;
    author?: string;
    publication: string;
    publish_date: string;
    source_url: string;
  }>
): Promise<IngestionResult> {
  const items: TcgDataItem[] = articles.map((article) => ({
    content: `${article.title}\n\n${article.content}`,
    metadata: {
      title: article.title,
      author: article.author,
      publication: article.publication,
      publish_date: article.publish_date,
      source_url: article.source_url,
      unique_id: `article_${new URL(article.source_url).pathname.split('/').pop() || Date.now()}`,
    },
  }));

  return ingestTcgData('news_article', items);
}
