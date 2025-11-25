/**
 * A/B Testing Database Schema
 *
 * Implements knowledge-06-data-ab-testing for statistical experimentation.
 * Enables data-driven UX improvements across all platform modules.
 *
 * Features:
 * - Experiment configuration with variants
 * - User assignment tracking
 * - Event/conversion metrics
 * - Statistical significance calculations
 * - Cross-module experiment support (XR, Mobile, Defense, SEO)
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
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const experimentStatusEnum = pgEnum('experiment_status', [
  'draft',
  'running',
  'paused',
  'completed',
  'archived',
]);

export const experimentTypeEnum = pgEnum('experiment_type', [
  'ab',           // Standard A/B
  'multivariate', // Multiple variants
  'bandit',       // Multi-armed bandit
  'holdout',      // Control holdout
]);

export const targetModuleEnum = pgEnum('target_module', [
  'webxr',
  'visionos',
  'mobile',
  'defense',
  'seo',
  'cua',
  'lightfield',
  'general',
]);

export const assignmentStrategyEnum = pgEnum('assignment_strategy', [
  'random',        // Pure random
  'deterministic', // Hash-based (consistent)
  'sticky',        // Session sticky
  'geo',           // Geographic
  'device',        // Device-based
]);

export const significanceMethodEnum = pgEnum('significance_method', [
  'chi_squared',   // Chi-squared test
  'z_test',        // Z-test for proportions
  't_test',        // T-test for means
  'bayesian',      // Bayesian inference
]);

// ============================================================================
// EXPERIMENTS TABLE
// ============================================================================

export const experiments = pgTable(
  'ab_experiments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    hypothesis: text('hypothesis'),

    // Configuration
    status: experimentStatusEnum('status').default('draft').notNull(),
    type: experimentTypeEnum('type').default('ab').notNull(),
    targetModule: targetModuleEnum('target_module').default('general').notNull(),

    // Assignment
    assignmentStrategy: assignmentStrategyEnum('assignment_strategy').default('deterministic').notNull(),
    trafficAllocation: real('traffic_allocation').default(1.0).notNull(), // 0-1 percentage

    // Statistical settings
    significanceMethod: significanceMethodEnum('significance_method').default('chi_squared').notNull(),
    confidenceLevel: real('confidence_level').default(0.95).notNull(),
    minimumSampleSize: integer('minimum_sample_size').default(100),
    minimumDetectableEffect: real('minimum_detectable_effect').default(0.05),

    // Timeline
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    scheduledStart: timestamp('scheduled_start'),
    scheduledEnd: timestamp('scheduled_end'),

    // Targeting rules (JSON for flexibility)
    targetingRules: jsonb('targeting_rules').$type<{
      includeDevices?: string[];
      excludeDevices?: string[];
      includeRegions?: string[];
      excludeRegions?: string[];
      userAttributes?: Record<string, unknown>;
      customRules?: Array<{ field: string; operator: string; value: unknown }>;
    }>(),

    // Metadata
    tags: text('tags').array(),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('ab_experiments_project_idx').on(table.projectId),
    statusIdx: index('ab_experiments_status_idx').on(table.status),
    moduleIdx: index('ab_experiments_module_idx').on(table.targetModule),
    nameIdx: index('ab_experiments_name_idx').on(table.name),
  })
);

// ============================================================================
// VARIANTS TABLE
// ============================================================================

export const variants = pgTable(
  'ab_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),

    // Variant info
    name: text('name').notNull(),
    description: text('description'),
    isControl: boolean('is_control').default(false).notNull(),

    // Traffic weight (relative to other variants)
    weight: real('weight').default(1.0).notNull(),

    // Configuration payload (variant-specific settings)
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),

    // Feature flags this variant enables/disables
    featureFlags: jsonb('feature_flags').$type<Record<string, boolean>>(),

    // Visual/UI changes
    uiChanges: jsonb('ui_changes').$type<{
      component?: string;
      props?: Record<string, unknown>;
      styles?: Record<string, string>;
    }>(),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    experimentIdx: index('ab_variants_experiment_idx').on(table.experimentId),
    controlIdx: index('ab_variants_control_idx').on(table.experimentId, table.isControl),
  })
);

// ============================================================================
// USER ASSIGNMENTS TABLE
// ============================================================================

export const userAssignments = pgTable(
  'ab_user_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),

    // User identification
    userId: text('user_id'), // Authenticated user
    anonymousId: text('anonymous_id'), // Anonymous tracking ID
    sessionId: text('session_id'),

    // Assignment context
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    assignmentReason: text('assignment_reason'), // Why this variant

    // Device/context info
    deviceType: text('device_type'),
    platform: text('platform'),
    region: text('region'),
    userAgent: text('user_agent'),

    // Bucketing info
    bucketValue: integer('bucket_value'), // Hash bucket (0-99)

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    optedOut: boolean('opted_out').default(false).notNull(),
  },
  (table) => ({
    experimentUserIdx: uniqueIndex('ab_assignments_exp_user_idx').on(
      table.experimentId,
      table.userId
    ),
    experimentAnonIdx: index('ab_assignments_exp_anon_idx').on(
      table.experimentId,
      table.anonymousId
    ),
    variantIdx: index('ab_assignments_variant_idx').on(table.variantId),
    assignedAtIdx: index('ab_assignments_time_idx').on(table.assignedAt),
  })
);

// ============================================================================
// EVENTS TABLE
// ============================================================================

export const experimentEvents = pgTable(
  'ab_experiment_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => userAssignments.id, { onDelete: 'set null' }),

    // Event info
    eventName: text('event_name').notNull(),
    eventCategory: text('event_category'), // e.g., 'conversion', 'engagement', 'error'

    // Event value (for numeric metrics)
    eventValue: real('event_value'),
    eventCount: integer('event_count').default(1),

    // User identification
    userId: text('user_id'),
    anonymousId: text('anonymous_id'),
    sessionId: text('session_id'),

    // Context
    pageUrl: text('page_url'),
    componentId: text('component_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Timing
    occurredAt: timestamp('occurred_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    experimentIdx: index('ab_events_experiment_idx').on(table.experimentId),
    variantIdx: index('ab_events_variant_idx').on(table.variantId),
    eventNameIdx: index('ab_events_name_idx').on(table.eventName),
    occurredAtIdx: index('ab_events_time_idx').on(table.occurredAt),
    userIdx: index('ab_events_user_idx').on(table.userId),
  })
);

// ============================================================================
// METRICS TABLE (Aggregated)
// ============================================================================

export const experimentMetrics = pgTable(
  'ab_experiment_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),

    // Metric definition
    metricName: text('metric_name').notNull(),
    metricType: text('metric_type').notNull(), // 'conversion', 'count', 'mean', 'revenue'

    // Aggregated values
    sampleSize: integer('sample_size').default(0).notNull(),
    conversions: integer('conversions').default(0), // For conversion metrics
    totalValue: real('total_value').default(0), // Sum of values
    meanValue: real('mean_value'), // Average
    varianceValue: real('variance_value'), // For significance calcs

    // Rates
    conversionRate: real('conversion_rate'),

    // Time window
    windowStart: timestamp('window_start').notNull(),
    windowEnd: timestamp('window_end').notNull(),

    // Computed at
    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => ({
    experimentMetricIdx: uniqueIndex('ab_metrics_exp_variant_metric_idx').on(
      table.experimentId,
      table.variantId,
      table.metricName,
      table.windowStart
    ),
  })
);

// ============================================================================
// STATISTICAL RESULTS TABLE
// ============================================================================

export const statisticalResults = pgTable(
  'ab_statistical_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),

    // Comparison
    controlVariantId: uuid('control_variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    treatmentVariantId: uuid('treatment_variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    metricName: text('metric_name').notNull(),

    // Statistical values
    testStatistic: real('test_statistic').notNull(),
    pValue: real('p_value').notNull(),
    confidenceInterval: jsonb('confidence_interval').$type<{
      lower: number;
      upper: number;
      level: number;
    }>(),

    // Effect size
    relativeUplift: real('relative_uplift'), // (treatment - control) / control
    absoluteUplift: real('absolute_uplift'), // treatment - control

    // Significance
    isSignificant: boolean('is_significant').default(false).notNull(),
    significanceLevel: real('significance_level').notNull(),

    // Sample sizes
    controlSampleSize: integer('control_sample_size').notNull(),
    treatmentSampleSize: integer('treatment_sample_size').notNull(),

    // Power analysis
    statisticalPower: real('statistical_power'),
    requiredSampleSize: integer('required_sample_size'),

    // Method used
    testMethod: significanceMethodEnum('test_method').notNull(),

    // Computed at
    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => ({
    experimentResultIdx: index('ab_results_experiment_idx').on(table.experimentId),
    significantIdx: index('ab_results_significant_idx').on(table.isSignificant),
  })
);

// ============================================================================
// GOALS TABLE
// ============================================================================

export const experimentGoals = pgTable(
  'ab_experiment_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experimentId: uuid('experiment_id')
      .references(() => experiments.id, { onDelete: 'cascade' })
      .notNull(),

    // Goal definition
    name: text('name').notNull(),
    description: text('description'),
    isPrimary: boolean('is_primary').default(false).notNull(),

    // Event matching
    eventName: text('event_name').notNull(),
    eventCategory: text('event_category'),

    // Goal type
    goalType: text('goal_type').notNull(), // 'conversion', 'pageview', 'revenue', 'engagement'

    // Conversion criteria
    conversionCriteria: jsonb('conversion_criteria').$type<{
      minValue?: number;
      maxValue?: number;
      withinMinutes?: number;
      requiresEvents?: string[];
    }>(),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    experimentIdx: index('ab_goals_experiment_idx').on(table.experimentId),
    primaryIdx: index('ab_goals_primary_idx').on(table.experimentId, table.isPrimary),
  })
);

// ============================================================================
// A/B TESTING KNOWLEDGE (RAG)
// ============================================================================

export const abKnowledge = pgTable(
  'ab_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Document info
    title: text('title').notNull(),
    content: text('content').notNull(),
    category: text('category').notNull(),
    type: text('type').notNull(),
    tags: text('tags').array(),

    // Vector embedding for RAG
    embedding: text('embedding'), // JSON-encoded float array

    // Source
    sourceUrl: text('source_url'),
    version: text('version'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('ab_knowledge_project_idx').on(table.projectId),
    categoryIdx: index('ab_knowledge_category_idx').on(table.category),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const experimentsRelations = relations(experiments, ({ many }) => ({
  variants: many(variants),
  assignments: many(userAssignments),
  events: many(experimentEvents),
  metrics: many(experimentMetrics),
  results: many(statisticalResults),
  goals: many(experimentGoals),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [variants.experimentId],
    references: [experiments.id],
  }),
  assignments: many(userAssignments),
  events: many(experimentEvents),
  metrics: many(experimentMetrics),
}));

export const userAssignmentsRelations = relations(userAssignments, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [userAssignments.experimentId],
    references: [experiments.id],
  }),
  variant: one(variants, {
    fields: [userAssignments.variantId],
    references: [variants.id],
  }),
  events: many(experimentEvents),
}));

export const experimentEventsRelations = relations(experimentEvents, ({ one }) => ({
  experiment: one(experiments, {
    fields: [experimentEvents.experimentId],
    references: [experiments.id],
  }),
  variant: one(variants, {
    fields: [experimentEvents.variantId],
    references: [variants.id],
  }),
  assignment: one(userAssignments, {
    fields: [experimentEvents.assignmentId],
    references: [userAssignments.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;
export type Variant = typeof variants.$inferSelect;
export type NewVariant = typeof variants.$inferInsert;
export type UserAssignment = typeof userAssignments.$inferSelect;
export type NewUserAssignment = typeof userAssignments.$inferInsert;
export type ExperimentEvent = typeof experimentEvents.$inferSelect;
export type NewExperimentEvent = typeof experimentEvents.$inferInsert;
export type ExperimentMetric = typeof experimentMetrics.$inferSelect;
export type StatisticalResult = typeof statisticalResults.$inferSelect;
export type ExperimentGoal = typeof experimentGoals.$inferSelect;
export type AbKnowledge = typeof abKnowledge.$inferSelect;
