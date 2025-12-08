/**
 * AI Module Exports
 *
 * Central export point for AI-related functionality including:
 * - Spatial RAG for 3D market intelligence
 * - Market prediction (world model inspired)
 * - Blog content generation with Perplexity-style citations
 *
 * @see master-plan-ai-livelihood-analysis
 */

export {
  // Spatial RAG Pipeline
  spatialRAG,
  generateSpatialEmbeddings,
  predictMarketPosition,
  SPATIAL_CONFIG,
  buildSpatialDescription,
  calculateMarketCoordinates,
  // Types
  type SpatialQuery,
  type Coordinates3D,
  type SpatialContextType,
  type SpatialRAGParams,
  type SpatialRAGResponse,
  type MarketPrediction,
} from './spatial-rag';

export {
  // Blog Generator
  generateBlogPost,
  answerFollowUp,
  BLOG_GENERATOR_CONFIG,
  generateSlug,
  countWords,
  calculateReadingTime,
  extractCitations,
  extractTitle,
  extractSubtitle,
  generateExcerpt,
  // Types
  type BlogGenerationRequest,
  type BlogGenerationResult,
  type FollowUpRequest,
  type FollowUpResult,
  type ResearchSource,
  type ExtractedCitation,
} from './blog-generator';
