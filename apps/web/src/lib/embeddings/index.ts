/**
 * Public API for embeddings module
 * Explicit exports for embedding generation functionality
 */

export {
  VoyageEmbeddings,
  createVoyageEmbeddings,
  cosineSimilarity,
  type VoyageEmbeddingOptions,
} from './voyage';

export {
  searchTCGEmbeddings,
  searchSimulationOutcomes,
  searchBostromScenarios,
  calculateOutcomeSimilarity,
  insertTCGEmbedding,
  batchInsertTCGEmbeddings,
  createHNSWIndex,
  getIndexStats,
  closeConnection,
  type TCGEmbeddingDocument,
  type TCGEmbeddingMetadata,
  type HNSWSearchResult,
  type HNSWSearchOptions,
  type HNSWConfig,
} from './pgvector-hnsw';

