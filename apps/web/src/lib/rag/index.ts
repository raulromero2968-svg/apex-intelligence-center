/**
 * Public API for RAG module
 * Barrel file for Retrieval-Augmented Generation functionality
 *
 * @see rag-fusion.ts for RAG-Fusion pipeline
 * @see latent-query.ts for latent space query operations
 */

export * from './rag-fusion';

// Latent Query Module
export {
  generateLatentQueries,
  executeLatentQuery,
  latentSimilaritySearch,
  cosineSimilarity,
  compressQuery,
  latentRAG,
  compressForAgentComm,
  type LatentQuery,
  type LatentQueryOptions,
  type LatentRAGResult,
  type LatentQueryConfig,
} from './latent-query';
