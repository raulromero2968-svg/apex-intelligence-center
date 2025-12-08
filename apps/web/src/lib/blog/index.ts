/**
 * Blog Engine Module
 *
 * Perplexity-style AI-powered blog system with:
 * - AI content generation with citations
 * - Topic cluster SEO strategy
 * - Hybrid content sourcing (MDX + Database)
 *
 * @module blog
 */

export {
  // Main generation function
  generateBlogPost,
  // Pipeline phases
  executeResearch,
  generateOutline,
  generateContent,
  // Utilities
  generateTraceHash,
  generateResearchQueries,
  searchWeb,
  synthesizeSourceKnowledge,
  // Types
  type GenerationConfig,
  type ResearchResult,
  type SourceResult,
  type BlogOutline,
  type OutlineSection,
  type GeneratedContent,
  type Citation,
  type AIMetadata,
  type GenerationProgress,
} from './generator';
