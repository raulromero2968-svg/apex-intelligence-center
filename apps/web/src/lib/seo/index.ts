/**
 * SEO utilities and helpers
 * @module lib/seo
 */

// JSON-LD Schema Generators for AI/LLM Discoverability (LLMO)
export {
  generateArticleSchema,
  renderJsonLd,
  generateMinimalArticleSchema,
  type ArticleSchema,
  type ArticleSchemaOptions,
  type AuthorSchema,
  type PublisherSchema,
  type CitationSchema,
} from './json-ld';

// Specialized JSON-LD schemas (Bostrom, Literature, Predictions)
export {
  generateLiteratureSchema,
  generateLiteratureCollectionSchema,
  generatePredictionEventSchema,
  generateSimulationModelSchema,
  generateBostromVisualizationSchema,
  getBostromOgImageUrl,
  getLiteratureOgImageUrl,
  generateLiteraturePageMeta,
  generateBostromPageMeta,
  renderJsonLd as renderSpecializedJsonLd,
  type JsonLdSchema,
  type PredictionEventData,
  type SimulationModelData,
  type BostromProbabilities,
} from './json-ld-schemas';
