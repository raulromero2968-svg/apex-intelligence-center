/**
 * RAG Module Barrel Export
 *
 * Exports all RAG-related functionality including:
 * - Contrarian RAG with sentiment diversity
 * - Latent query system (LatentMAS-inspired)
 * - REFRAG (Meta's embedding-based RAG optimization)
 *
 * @module rag
 */

// Contrarian RAG
export {
  contrarianSearch,
  validateSentimentDiversity,
  classifySentiment,
  groupBySentiment,
  calculateMMR,
  selectWithMMR,
  type Document,
} from './contrarian-rag';

// Latent Query System
export {
  generateLatentQueries,
  latentHybridSearch,
  latentRAG,
  compressForAgentComm,
  decompressFromLatent,
  type LatentQuery,
  type LatentQueryConfig,
  type LatentRAGResult,
  type LatentDocument,
} from './latent-query';

// REFRAG (Meta's embedding-based RAG optimization)
export {
  compressChunks,
  refragSelect,
  refragHybridSearch,
  refragPipeline,
  getTCGChunks,
  compressTCGChunks,
  cosineSimilarity,
  type CompressedChunk,
  type RefragConfig,
  type RefragResult,
} from './refrag';
