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

// ============================================================================
// EGGROLL RAG-Fusion Integration (KB-02)
// Re-exported from apps/web for convenience
// ============================================================================

/**
 * EGGROLL RAG-Fusion combines gradient-free evolution with RAG for stable
 * simulation predictions. Key features:
 * - Integer-weight (1-10) variants for interpretable confidence
 * - SVD approximations for 20% compute efficiency
 * - POST-Agency for corrigible value adaptation
 * - Deep utopia framing for posthuman scenarios
 *
 * @see apps/web/src/lib/rag/eggroll-fusion.ts for full implementation
 */
