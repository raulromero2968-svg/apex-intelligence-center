/**
 * Public API for RAG module
 * Barrel file for Retrieval-Augmented Generation functionality
 *
 * @see rag-fusion.ts for RAG-Fusion pipeline
 * @see latent-query.ts for latent space query operations
 * @see refrag-rl.ts for REFRAG RL-based chunk expansion
 * @see colbert.ts for ColBERT token-level retrieval
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

// REFRAG RL Module - RL-based selective chunk expansion
export {
  refragWithRL,
  hybridRefragRAG,
  compressChunks,
  resetPolicy,
  getPolicyVersion,
  estimateTokenSavings,
  type CompressedChunk,
  type PolicyAction,
  type RefragRLConfig,
  type RefragRLResult,
} from './refrag-rl';

// ColBERT Module - Token-level precision retrieval
export {
  colbertRetrieve,
  hybridColbertRetrieve,
  colbertRefragPipeline,
  indexDocuments,
  checkColbertIndexExists,
  createColbertIndexTable,
  explainColbertMatch,
  type ColBERTDocument,
  type ColBERTQuery,
  type ColBERTSearchResult,
  type ColBERTConfig,
  type ColBERTIndexResult,
} from './colbert';
