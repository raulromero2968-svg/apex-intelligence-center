/**
 * RAG Module - Public API
 *
 * Exports utopia-focused RAG functionality for
 * FHI-aligned simulation content generation.
 */

export {
  utopiaRAG,
  utopiaRAGSummary,
  requiresUtopiaFraming,
  getEthicalFraming,
  type UtopiaConfig,
  type UtopiaResponse,
} from './utopia-prompt';
