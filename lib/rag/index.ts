/**
 * RAG Module Barrel Export
 *
 * Exports all RAG-related functionality including:
 * - Contrarian RAG with sentiment diversity
 * - Latent query system (LatentMAS-inspired)
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
