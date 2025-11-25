/**
 * Database Architecture Schema
 *
 * Database tables for schema management, vector search, and query optimization.
 * Implements knowledge-09-database-architecture.
 *
 * Tables:
 * - schemaDefinitions: Table schema definitions
 * - vectorIndexes: pgvector index configurations
 * - queryAnalytics: Query performance tracking
 * - migrationHistory: Schema migration records
 * - syncConfigs: Mobile sync configurations
 * - dbKnowledge: RAG knowledge base
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const columnTypeEnum = pgEnum('column_type', [
  'uuid',
  'text',
  'varchar',
  'integer',
  'bigint',
  'real',
  'double',
  'boolean',
  'timestamp',
  'date',
  'jsonb',
  'vector',
  'array',
]);

export const indexTypeEnum = pgEnum('index_type', [
  'btree',
  'hash',
  'gin',
  'gist',
  'hnsw',
  'ivfflat',
]);

export const distanceMetricEnum = pgEnum('distance_metric', [
  'cosine',
  'euclidean',
  'inner_product',
]);

export const migrationStatusEnum = pgEnum('migration_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'rolled_back',
]);

export const syncDirectionEnum = pgEnum('sync_direction', [
  'push',
  'pull',
  'bidirectional',
]);

export const conflictResolutionEnum = pgEnum('conflict_resolution', [
  'server_wins',
  'client_wins',
  'last_write_wins',
  'merge',
  'manual',
]);

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Table schema definitions
 */
export const schemaDefinitions = pgTable(
  'schema_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    tableName: text('table_name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Columns
    columns: jsonb('columns').$type<
      Array<{
        name: string;
        type: string;
        nullable: boolean;
        defaultValue?: string;
        primaryKey: boolean;
        unique: boolean;
        references?: {
          table: string;
          column: string;
          onDelete?: string;
          onUpdate?: string;
        };
        comment?: string;
      }>
    >(),

    // Indexes
    indexes: jsonb('indexes').$type<
      Array<{
        name: string;
        columns: string[];
        type: string;
        unique: boolean;
        where?: string;
      }>
    >(),

    // Constraints
    constraints: jsonb('constraints').$type<
      Array<{
        name: string;
        type: 'check' | 'unique' | 'foreign_key' | 'primary_key';
        columns: string[];
        expression?: string;
      }>
    >(),

    // Relations
    relations: jsonb('relations').$type<
      Array<{
        name: string;
        type: 'one_to_one' | 'one_to_many' | 'many_to_many';
        targetTable: string;
        throughTable?: string;
        foreignKey: string;
        targetKey: string;
      }>
    >(),

    // Generated code
    drizzleCode: text('drizzle_code'),
    sqlCode: text('sql_code'),

    // Versioning
    version: integer('version').default(1),
    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('schema_def_project_idx').on(table.projectId),
    index('schema_def_table_idx').on(table.tableName),
  ]
);

// ============================================================================
// VECTOR INDEXES
// ============================================================================

/**
 * pgvector index configurations
 */
export const vectorIndexes = pgTable(
  'vector_indexes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    schemaId: uuid('schema_id').references(() => schemaDefinitions.id, { onDelete: 'cascade' }),
    projectId: text('project_id'),

    // Vector configuration
    tableName: text('table_name').notNull(),
    columnName: text('column_name').notNull(),
    dimensions: integer('dimensions').notNull(),
    distanceMetric: distanceMetricEnum('distance_metric').notNull().default('cosine'),

    // Index type
    indexType: indexTypeEnum('index_type').notNull().default('hnsw'),
    indexParams: jsonb('index_params').$type<{
      // HNSW params
      m?: number; // connections per element
      efConstruction?: number; // size of dynamic candidate list
      // IVFFlat params
      lists?: number; // number of clusters
    }>(),

    // Search configuration
    searchConfig: jsonb('search_config').$type<{
      efSearch?: number; // HNSW search param
      probes?: number; // IVFFlat probes
      preFilter?: string; // WHERE clause
    }>(),

    // Embedding source
    embeddingSource: jsonb('embedding_source').$type<{
      model: string; // e.g., "text-embedding-3-small"
      provider: 'openai' | 'cohere' | 'local';
      sourceColumn: string; // column to embed
      autoUpdate: boolean;
    }>(),

    // Statistics
    rowCount: integer('row_count'),
    indexSizeBytes: integer('index_size_bytes'),
    avgSearchMs: real('avg_search_ms'),
    lastReindexed: timestamp('last_reindexed'),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('vector_idx_schema_idx').on(table.schemaId),
    index('vector_idx_table_idx').on(table.tableName),
  ]
);

// ============================================================================
// QUERY ANALYTICS
// ============================================================================

/**
 * Query performance tracking
 */
export const queryAnalytics = pgTable(
  'query_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Query info
    queryHash: text('query_hash').notNull(),
    queryText: text('query_text').notNull(),
    normalizedQuery: text('normalized_query'),

    // Execution stats
    executionCount: integer('execution_count').default(1),
    totalTimeMs: real('total_time_ms'),
    avgTimeMs: real('avg_time_ms'),
    minTimeMs: real('min_time_ms'),
    maxTimeMs: real('max_time_ms'),

    // Rows
    totalRowsReturned: integer('total_rows_returned'),
    avgRowsReturned: real('avg_rows_returned'),

    // EXPLAIN analysis
    explainPlan: jsonb('explain_plan').$type<{
      planningTime: number;
      executionTime: number;
      totalCost: number;
      nodeType: string;
      scanType?: string;
      indexUsed?: string;
      rowsEstimated: number;
      rowsActual: number;
      loops: number;
      children?: unknown[];
    }>(),

    // Optimization suggestions
    suggestions: jsonb('suggestions').$type<
      Array<{
        type: 'add_index' | 'rewrite_query' | 'add_limit' | 'use_materialized_view';
        description: string;
        impact: 'low' | 'medium' | 'high';
        implementation?: string;
      }>
    >(),

    // Context
    sourceTables: jsonb('source_tables').$type<string[]>(),
    isSlowQuery: boolean('is_slow_query').default(false),
    slowThresholdMs: integer('slow_threshold_ms').default(100),

    firstSeen: timestamp('first_seen').notNull().defaultNow(),
    lastSeen: timestamp('last_seen').notNull().defaultNow(),
  },
  (table) => [
    index('query_analytics_hash_idx').on(table.queryHash),
    index('query_analytics_project_idx').on(table.projectId),
    index('query_analytics_slow_idx').on(table.isSlowQuery),
  ]
);

// ============================================================================
// MIGRATION HISTORY
// ============================================================================

/**
 * Schema migration records
 */
export const migrationHistory = pgTable(
  'migration_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Migration content
    upSql: text('up_sql').notNull(),
    downSql: text('down_sql'),
    drizzleCode: text('drizzle_code'),

    // Status
    status: migrationStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),

    // Timing
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),

    // Checksums
    checksum: text('checksum'),
    schemaVersion: integer('schema_version'),

    // Dependencies
    dependsOn: jsonb('depends_on').$type<string[]>(),

    // Rollback info
    canRollback: boolean('can_rollback').default(true),
    rolledBackAt: timestamp('rolled_back_at'),
    rolledBackBy: text('rolled_back_by'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('migration_project_idx').on(table.projectId),
    index('migration_status_idx').on(table.status),
  ]
);

// ============================================================================
// SYNC CONFIGURATIONS
// ============================================================================

/**
 * Mobile sync configurations
 */
export const syncConfigs = pgTable(
  'sync_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Sync tables
    tables: jsonb('tables').$type<
      Array<{
        tableName: string;
        syncDirection: string;
        primaryKey: string;
        timestampColumn: string;
        softDeleteColumn?: string;
        conflictResolution: string;
        columns?: string[]; // specific columns to sync
        filters?: string; // WHERE clause
      }>
    >(),

    // Sync strategy
    syncStrategy: jsonb('sync_strategy').$type<{
      type: 'full' | 'incremental' | 'delta';
      batchSize: number;
      intervalMs: number;
      retryCount: number;
      retryDelayMs: number;
    }>(),

    // Conflict resolution
    defaultConflictResolution: conflictResolutionEnum('default_conflict_resolution')
      .notNull()
      .default('last_write_wins'),

    // Connection pooling
    poolConfig: jsonb('pool_config').$type<{
      maxConnections: number;
      idleTimeout: number;
      connectionTimeout: number;
    }>(),

    // Client-side storage
    clientStorage: jsonb('client_storage').$type<{
      type: 'sqlite' | 'indexeddb' | 'mmkv';
      encryptionEnabled: boolean;
      maxSizeMb: number;
    }>(),

    // Statistics
    lastSyncAt: timestamp('last_sync_at'),
    totalSyncs: integer('total_syncs').default(0),
    avgSyncDurationMs: real('avg_sync_duration_ms'),
    conflictCount: integer('conflict_count').default(0),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('sync_config_project_idx').on(table.projectId)]
);

// ============================================================================
// DATABASE KNOWLEDGE BASE
// ============================================================================

/**
 * RAG knowledge base for database patterns
 */
export const dbKnowledge = pgTable(
  'db_knowledge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),

    // Classification
    documentType: text('document_type').notNull(), // concept, api_reference, code_example, best_practice, troubleshooting
    category: text('category').notNull(), // schema, vector, query, migration, sync, pooling, indexing

    // Metadata
    tags: jsonb('tags').$type<string[]>(),
    relatedTopics: jsonb('related_topics').$type<string[]>(),
    codeExamples: jsonb('code_examples').$type<
      Array<{
        language: string;
        code: string;
        description: string;
      }>
    >(),

    // Version compatibility
    postgresVersion: text('postgres_version'), // e.g., "15+"
    drizzleVersion: text('drizzle_version'), // e.g., "0.28+"

    // Vector embedding
    embedding: jsonb('embedding').$type<number[]>(),

    // Source
    sourceUrl: text('source_url'),
    isVerified: boolean('is_verified').default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('db_knowledge_type_idx').on(table.documentType),
    index('db_knowledge_category_idx').on(table.category),
  ]
);

// ============================================================================
// TYPES
// ============================================================================

export type SchemaDefinition = typeof schemaDefinitions.$inferSelect;
export type NewSchemaDefinition = typeof schemaDefinitions.$inferInsert;

export type VectorIndex = typeof vectorIndexes.$inferSelect;
export type NewVectorIndex = typeof vectorIndexes.$inferInsert;

export type QueryAnalytic = typeof queryAnalytics.$inferSelect;
export type NewQueryAnalytic = typeof queryAnalytics.$inferInsert;

export type MigrationRecord = typeof migrationHistory.$inferSelect;
export type NewMigrationRecord = typeof migrationHistory.$inferInsert;

export type SyncConfig = typeof syncConfigs.$inferSelect;
export type NewSyncConfig = typeof syncConfigs.$inferInsert;

export type DbKnowledge = typeof dbKnowledge.$inferSelect;
export type NewDbKnowledge = typeof dbKnowledge.$inferInsert;
