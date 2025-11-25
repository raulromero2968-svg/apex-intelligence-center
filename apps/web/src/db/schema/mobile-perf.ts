/**
 * Mobile Performance Schema
 *
 * Database tables for React Native performance optimization.
 * Implements knowledge-08-mobile-performance architecture.
 *
 * Tables:
 * - perfProfiles: Performance profile configurations
 * - perfMetrics: Runtime performance metrics
 * - optimizationRules: Auto-optimization patterns
 * - deviceConfigs: Device-specific tuning
 * - offlineConfigs: Offline resilience settings
 * - bridgeAnalytics: JS-Native bridge call tracking
 * - mobileKnowledge: RAG knowledge base
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

export const platformEnum = pgEnum('platform', ['ios', 'android', 'both']);

export const optimizationTypeEnum = pgEnum('optimization_type', [
  'memoization',
  'virtualization',
  'lazy_loading',
  'image_optimization',
  'bridge_batching',
  'hermes_tuning',
  'memory_management',
  'render_prevention',
]);

export const severityEnum = pgEnum('perf_severity', ['low', 'medium', 'high', 'critical']);

export const deviceTierEnum = pgEnum('device_tier', ['low_end', 'mid_range', 'high_end', 'flagship']);

export const syncStrategyEnum = pgEnum('sync_strategy', [
  'eager',
  'lazy',
  'on_demand',
  'background',
  'manual',
]);

// ============================================================================
// PERFORMANCE PROFILES
// ============================================================================

/**
 * Performance profiles for mobile apps
 */
export const perfProfiles = pgTable(
  'perf_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    userId: text('user_id'),
    projectId: text('project_id'),

    // Target configuration
    platform: platformEnum('platform').notNull().default('both'),
    targetFps: integer('target_fps').notNull().default(60),
    maxMemoryMb: integer('max_memory_mb').default(256),
    maxBundleSizeKb: integer('max_bundle_size_kb').default(5000),

    // Optimization settings
    enableHermes: boolean('enable_hermes').notNull().default(true),
    enableNewArchitecture: boolean('enable_new_architecture').default(false),
    enableFabric: boolean('enable_fabric').default(false),
    enableTurboModules: boolean('enable_turbo_modules').default(false),

    // List optimization
    listConfig: jsonb('list_config').$type<{
      windowSize: number;
      maxToRenderPerBatch: number;
      updateCellsBatchingPeriod: number;
      removeClippedSubviews: boolean;
      initialNumToRender: number;
      getItemLayout: boolean;
    }>(),

    // Image optimization
    imageConfig: jsonb('image_config').$type<{
      cachePolicy: 'memory' | 'disk' | 'both';
      maxCacheSizeMb: number;
      compressionQuality: number;
      lazyLoadThreshold: number;
      placeholderStrategy: 'blur' | 'skeleton' | 'none';
    }>(),

    // Bridge settings
    bridgeConfig: jsonb('bridge_config').$type<{
      batchingEnabled: boolean;
      batchingInterval: number;
      maxBatchSize: number;
      priorityQueue: boolean;
    }>(),

    // Thresholds for alerts
    thresholds: jsonb('thresholds').$type<{
      fpsWarning: number;
      fpsCritical: number;
      memoryWarning: number;
      memoryCritical: number;
      renderTimeWarning: number;
      renderTimeCritical: number;
    }>(),

    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('perf_profiles_user_idx').on(table.userId),
    index('perf_profiles_project_idx').on(table.projectId),
  ]
);

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Runtime performance metrics
 */
export const perfMetrics = pgTable(
  'perf_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').references(() => perfProfiles.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    userId: text('user_id'),

    // Device info
    platform: platformEnum('platform').notNull(),
    deviceModel: text('device_model'),
    osVersion: text('os_version'),
    appVersion: text('app_version'),
    deviceTier: deviceTierEnum('device_tier'),

    // Frame metrics
    avgFps: real('avg_fps'),
    minFps: real('min_fps'),
    maxFps: real('max_fps'),
    droppedFrames: integer('dropped_frames'),
    jankCount: integer('jank_count'),

    // Memory metrics
    avgMemoryMb: real('avg_memory_mb'),
    peakMemoryMb: real('peak_memory_mb'),
    memoryLeakSuspected: boolean('memory_leak_suspected').default(false),

    // Render metrics
    avgRenderTimeMs: real('avg_render_time_ms'),
    maxRenderTimeMs: real('max_render_time_ms'),
    reRenderCount: integer('re_render_count'),
    unnecessaryRenders: integer('unnecessary_renders'),

    // Bridge metrics
    bridgeCallCount: integer('bridge_call_count'),
    avgBridgeLatencyMs: real('avg_bridge_latency_ms'),
    bridgeQueueDepth: integer('bridge_queue_depth'),

    // Network metrics
    networkRequestCount: integer('network_request_count'),
    avgNetworkLatencyMs: real('avg_network_latency_ms'),
    offlineTime: integer('offline_time_ms'),

    // Battery
    batteryDrainPercent: real('battery_drain_percent'),
    cpuUsagePercent: real('cpu_usage_percent'),

    // Duration
    sessionDurationMs: integer('session_duration_ms'),

    // Raw data
    rawMetrics: jsonb('raw_metrics'),

    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => [
    index('perf_metrics_profile_idx').on(table.profileId),
    index('perf_metrics_session_idx').on(table.sessionId),
    index('perf_metrics_timestamp_idx').on(table.timestamp),
  ]
);

// ============================================================================
// OPTIMIZATION RULES
// ============================================================================

/**
 * Auto-optimization patterns and rules
 */
export const optimizationRules = pgTable(
  'optimization_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),

    // Rule type and targeting
    optimizationType: optimizationTypeEnum('optimization_type').notNull(),
    platform: platformEnum('platform').notNull().default('both'),
    severity: severityEnum('severity').notNull().default('medium'),

    // Detection pattern
    detectionPattern: jsonb('detection_pattern').$type<{
      type: 'component' | 'hook' | 'api_call' | 'metric_threshold';
      pattern: string;
      threshold?: number;
      conditions?: Record<string, unknown>;
    }>(),

    // Fix suggestion
    fixSuggestion: jsonb('fix_suggestion').$type<{
      description: string;
      codeTemplate?: string;
      imports?: string[];
      autoApplicable: boolean;
      riskLevel: 'low' | 'medium' | 'high';
    }>(),

    // Performance impact
    expectedImprovement: jsonb('expected_improvement').$type<{
      fpsGain?: number;
      memoryReduction?: number;
      renderTimeReduction?: number;
      bridgeCallReduction?: number;
    }>(),

    // Documentation
    documentation: text('documentation'),
    exampleBefore: text('example_before'),
    exampleAfter: text('example_after'),

    isBuiltIn: boolean('is_built_in').default(false),
    isEnabled: boolean('is_enabled').default(true),
    priority: integer('priority').default(0),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('opt_rules_type_idx').on(table.optimizationType),
    index('opt_rules_platform_idx').on(table.platform),
  ]
);

// ============================================================================
// DEVICE CONFIGURATIONS
// ============================================================================

/**
 * Device-specific tuning configurations
 */
export const deviceConfigs = pgTable(
  'device_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),

    // Device identification
    platform: platformEnum('platform').notNull(),
    deviceTier: deviceTierEnum('device_tier').notNull(),
    deviceModels: jsonb('device_models').$type<string[]>(),
    minOsVersion: text('min_os_version'),

    // Performance specs
    specs: jsonb('specs').$type<{
      ramGb: number;
      cpuCores: number;
      gpuTier: 'integrated' | 'dedicated' | 'high_performance';
      screenDensity: number;
      refreshRate: number;
    }>(),

    // Recommended settings
    recommendedSettings: jsonb('recommended_settings').$type<{
      targetFps: number;
      maxMemoryMb: number;
      imageQuality: 'low' | 'medium' | 'high';
      animationComplexity: 'simple' | 'standard' | 'complex';
      shadowsEnabled: boolean;
      blurEnabled: boolean;
      particleCount: number;
    }>(),

    // List optimization overrides
    listOverrides: jsonb('list_overrides').$type<{
      windowSize: number;
      maxToRenderPerBatch: number;
      initialNumToRender: number;
    }>(),

    // Hermes settings
    hermesConfig: jsonb('hermes_config').$type<{
      gcConfig: {
        minHeapSize: number;
        maxHeapSize: number;
        occupancyTarget: number;
      };
      enableES6Proxy: boolean;
      enableIntl: boolean;
    }>(),

    isBuiltIn: boolean('is_built_in').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('device_configs_platform_idx').on(table.platform),
    index('device_configs_tier_idx').on(table.deviceTier),
  ]
);

// ============================================================================
// OFFLINE CONFIGURATIONS
// ============================================================================

/**
 * Offline resilience configurations
 */
export const offlineConfigs = pgTable(
  'offline_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    profileId: uuid('profile_id').references(() => perfProfiles.id, { onDelete: 'cascade' }),

    // Sync strategy
    syncStrategy: syncStrategyEnum('sync_strategy').notNull().default('lazy'),

    // Cache configuration
    cacheConfig: jsonb('cache_config').$type<{
      maxSizeMb: number;
      expirationMs: number;
      priorityLevels: number;
      compressionEnabled: boolean;
      encryptionEnabled: boolean;
    }>(),

    // Data policies
    dataPolicies: jsonb('data_policies').$type<{
      criticalData: string[];
      cacheableEndpoints: string[];
      syncOnReconnect: boolean;
      conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
      retryConfig: {
        maxRetries: number;
        backoffMs: number;
        exponentialBackoff: boolean;
      };
    }>(),

    // Queue configuration
    queueConfig: jsonb('queue_config').$type<{
      maxQueueSize: number;
      persistQueue: boolean;
      prioritizeByAge: boolean;
      dropPolicy: 'oldest' | 'lowest_priority' | 'none';
    }>(),

    // UI fallbacks
    fallbackUi: jsonb('fallback_ui').$type<{
      showOfflineIndicator: boolean;
      offlineMessage: string;
      enableOfflineMode: boolean;
      cachedDataWarning: boolean;
    }>(),

    isEnabled: boolean('is_enabled').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('offline_configs_profile_idx').on(table.profileId)]
);

// ============================================================================
// BRIDGE ANALYTICS
// ============================================================================

/**
 * JS-Native bridge call tracking
 */
export const bridgeAnalytics = pgTable(
  'bridge_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: text('session_id'),
    profileId: uuid('profile_id').references(() => perfProfiles.id, { onDelete: 'set null' }),

    // Call information
    moduleName: text('module_name').notNull(),
    methodName: text('method_name').notNull(),
    callCount: integer('call_count').notNull().default(1),

    // Timing
    avgDurationMs: real('avg_duration_ms'),
    maxDurationMs: real('max_duration_ms'),
    totalDurationMs: real('total_duration_ms'),

    // Payload
    avgPayloadBytes: integer('avg_payload_bytes'),
    totalPayloadBytes: integer('total_payload_bytes'),

    // Analysis
    isBatched: boolean('is_batched').default(false),
    isOptimizable: boolean('is_optimizable').default(false),
    optimizationSuggestion: text('optimization_suggestion'),

    // Context
    callerComponent: text('caller_component'),
    stackTrace: text('stack_trace'),

    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => [
    index('bridge_analytics_session_idx').on(table.sessionId),
    index('bridge_analytics_module_idx').on(table.moduleName),
    index('bridge_analytics_timestamp_idx').on(table.timestamp),
  ]
);

// ============================================================================
// MOBILE KNOWLEDGE BASE
// ============================================================================

/**
 * RAG knowledge base for mobile performance
 */
export const mobileKnowledge = pgTable(
  'mobile_knowledge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),

    // Classification
    documentType: text('document_type').notNull(), // concept, api_reference, code_example, best_practice, troubleshooting
    category: text('category').notNull(), // list_optimization, render_prevention, bridge, hermes, offline, images, memory
    platform: platformEnum('platform').default('both'),

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

    // Versioning
    rnVersion: text('rn_version'), // e.g., "0.72+"
    expoVersion: text('expo_version'), // e.g., "49+"

    // Vector embedding for semantic search
    embedding: jsonb('embedding').$type<number[]>(),

    // Source
    sourceUrl: text('source_url'),
    sourceType: text('source_type'), // official_docs, blog, community, internal

    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('mobile_knowledge_type_idx').on(table.documentType),
    index('mobile_knowledge_category_idx').on(table.category),
    index('mobile_knowledge_platform_idx').on(table.platform),
  ]
);

// ============================================================================
// TYPES
// ============================================================================

export type PerfProfile = typeof perfProfiles.$inferSelect;
export type NewPerfProfile = typeof perfProfiles.$inferInsert;

export type PerfMetric = typeof perfMetrics.$inferSelect;
export type NewPerfMetric = typeof perfMetrics.$inferInsert;

export type OptimizationRule = typeof optimizationRules.$inferSelect;
export type NewOptimizationRule = typeof optimizationRules.$inferInsert;

export type DeviceConfig = typeof deviceConfigs.$inferSelect;
export type NewDeviceConfig = typeof deviceConfigs.$inferInsert;

export type OfflineConfig = typeof offlineConfigs.$inferSelect;
export type NewOfflineConfig = typeof offlineConfigs.$inferInsert;

export type BridgeAnalytic = typeof bridgeAnalytics.$inferSelect;
export type NewBridgeAnalytic = typeof bridgeAnalytics.$inferInsert;

export type MobileKnowledge = typeof mobileKnowledge.$inferSelect;
export type NewMobileKnowledge = typeof mobileKnowledge.$inferInsert;
