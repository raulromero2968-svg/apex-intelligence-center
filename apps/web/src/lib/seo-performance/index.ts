/**
 * SEO Performance Module
 *
 * Exports all SEO and Core Web Vitals optimization services.
 * Implements knowledge-07-seo-performance architecture.
 *
 * @see knowledge-07-seo-performance for domain mapping
 */

// Vitals Monitor
export {
  recordVital,
  recordVitals,
  getPageMetrics,
  getPageVitalsSummary,
  getVitalRating,
  getRatingColor,
  calculateOverallScore,
  getOptimizationSuggestions,
  generateVitalsCollectionCode,
  VITAL_THRESHOLDS,
  VITAL_INFO,
  type VitalType,
  type VitalRating,
  type VitalThreshold,
  type VitalsSummary,
  type VitalAttribution,
  type OptimizationSuggestion,
} from './vitals-monitor';

// Schema Builder
export {
  createSchemaMarkup,
  getSchemaMarkup,
  getProjectSchemas,
  updateSchemaMarkup,
  deleteSchemaMarkup,
  validateSchema,
  generateJsonLdScript,
  generateNextJsComponent,
  generateSchema,
  SCHEMA_TEMPLATES,
  type SchemaType,
  type SchemaTemplate,
  type ValidationResult,
} from './schema-builder';

// Domain Pack (RAG)
export {
  initializeSeoKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getPromptTemplate,
  fillPromptTemplate,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Category,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';
