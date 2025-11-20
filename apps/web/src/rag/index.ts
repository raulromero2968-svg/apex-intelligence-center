/**
 * RAG Module - Public API
 *
 * Barrel export aggregating all RAG functionality:
 * - Hybrid search (vector + keyword + metadata filtering)
 * - Reranking with Cohere
 * - RAG-Fusion for multi-query retrieval
 * - Citation enforcement and validation
 * - Data ingestion pipeline
 * - Source deduplication
 * - EU AI Act compliance
 *
 * This is the single entry point for all RAG operations across Apex Intelligence.
 */

// ============================================================================
// SEARCH - Hybrid vector + keyword search with pgvector
// ============================================================================
export {
  type SearchResult,
  type SearchFilters,
  type HybridSearchOptions,
  hybridSearch,
  vectorSearch,
  keywordSearch,
} from './search';

// ============================================================================
// RERANKER - Cohere reranking for improved relevance
// ============================================================================
export {
  type RerankedResult,
  rerankResults,
  getTcgContext,
} from './reranker';

// ============================================================================
// RAG-FUSION - Multi-query retrieval with RRF fusion (23% better recall)
// ============================================================================
export {
  type RagFusionConfig,
  RagFusionGenerator,
  createRagFusion,
  ragFusionSearch,
} from './fusion';

// ============================================================================
// CHAIN - Core RAG pipeline with citation enforcement
// ============================================================================
export {
  type RagResponse,
  type ExecuteRagQueryParams,
  executeRagQuery,
  validateCitations,
  formatRagResponse,
} from './chain';

// ============================================================================
// INGESTION - Data pipeline for TCG market data
// ============================================================================
export {
  type SourceType,
  type TcgDataItem,
  type IngestionResult,
  ingestTcgData,
  ingestEbayListings,
  ingestPsaPopReports,
  ingestNewsArticles,
} from './ingestion';

// ============================================================================
// DEDUPLICATION - Source deduplication for research citations
// ============================================================================
export {
  deduplicateSources,
  formatSourcesForOutput,
} from './dedupe';

// ============================================================================
// CITATION MAPPER - Streaming citation mapping
// ============================================================================
export {
  CitationMapper,
} from './citation-mapper';

// ============================================================================
// EXPERIMENTAL CHAINS - Not included in production build
// ============================================================================
// Lorcana Enchanted RAG chain is experimental and moved to ./experimental/
// Uncomment only when feature flag is enabled:
// export {
//   enchantedRagQuery,
//   type EnchantedRAGResult,
// } from './experimental/lorcana-enchanted.chain';
