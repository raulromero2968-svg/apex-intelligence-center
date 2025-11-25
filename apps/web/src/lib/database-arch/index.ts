/**
 * Database Architecture Module
 *
 * Exports all database optimization and vector search services.
 * Implements knowledge-09-database-architecture.
 *
 * @see knowledge-09-database-architecture for domain mapping
 */

// Query Optimizer
export {
  hashQuery,
  normalizeQuery,
  parseExplainOutput,
  analyzeQuery,
  recordQueryExecution,
  getSlowQueries,
  getMostExecutedQueries,
  generateIndexRecommendations,
  generateOptimizedDrizzleQuery,
  SLOW_QUERY_THRESHOLD_MS,
  SCAN_TYPE_SEVERITY,
  type ExplainPlan,
  type QuerySuggestion,
  type QueryAnalysis,
  type IndexRecommendation,
} from './query-optimizer';

// Vector Search
export {
  createVectorIndex,
  getVectorIndex,
  getSchemaVectorIndexes,
  getProjectVectorIndexes,
  updateVectorIndex,
  deleteVectorIndex,
  generateVectorColumnSql,
  generateHnswIndexSql,
  generateIvfflatIndexSql,
  generateSimilaritySearchSql,
  generateDrizzleVectorSchema,
  generateDrizzleSimilaritySearch,
  generateEmbeddingFunction,
  getIndexRecommendation,
  DEFAULT_HNSW_PARAMS,
  DEFAULT_IVFFLAT_PARAMS,
  DISTANCE_OPERATORS,
  EMBEDDING_DIMENSIONS,
  type IndexType,
  type DistanceMetric,
  type HnswParams,
  type IvfflatParams,
  type SearchConfig,
  type EmbeddingSource,
  type VectorSearchResult,
  type VectorIndexRecommendation,
} from './vector-search';

// Domain Pack (RAG)
export {
  initializeDbKnowledge,
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
