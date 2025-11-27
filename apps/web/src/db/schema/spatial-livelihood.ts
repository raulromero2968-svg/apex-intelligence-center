/**
 * Spatial Intelligence & Livelihood Analysis Database Schema
 *
 * Implements Phase 1-2 of AI Livelihood Analysis master plan:
 * - Spatial embeddings for 3D TCG market visualizations (world models)
 * - Livelihood analysis tracking for job impact assessments
 * - Upskilling pathways and discovery metrics
 *
 * References:
 * - knowledge-02-ai-rag-architecture-v2 (RAG for knowledge discovery)
 * - knowledge-09-database-architecture (pgvector for spatial embeddings)
 *
 * @see master-plan-ai-livelihood-analysis
 */

import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  real,
  integer,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, cards } from '../schema';

/**
 * Custom pgvector type for Drizzle ORM
 * Represents a vector(n) column type for storing embeddings
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return config?.dimensions ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ============================================================================
// SPATIAL INTELLIGENCE EMBEDDINGS
// ============================================================================

/**
 * Spatial Embeddings table for 3D TCG market visualizations
 *
 * Stores multimodal spatial embeddings for cards enabling:
 * - 3D market space positioning (clusters, trends)
 * - World model-inspired next-frame prediction
 * - RTFM-style dynamic market simulations
 *
 * Features:
 * - Vector embeddings (1536-dim) for spatial context
 * - 3D coordinates for visualization positioning
 * - Temporal markers for prediction models
 * - HNSW indexing for fast spatial queries
 */
export const spatialEmbeddings = pgTable(
  'spatial_embeddings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Card reference (optional - can be market-level spatial data)
    cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }),

    // User reference for personalized spatial context
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Spatial embedding vector (1536-dim for OpenAI text-embedding-3-large)
    embedding: vector('embedding', { dimensions: 1536 }),

    // 3D coordinates for visualization
    coordinates: jsonb('coordinates').$type<{
      x: number;
      y: number;
      z: number;
      clusterLabel?: string;
      confidence: number;
    }>(),

    // Spatial context description (multimodal: text + visual features)
    spatialContext: text('spatial_context').notNull(),

    // Context type for categorization
    contextType: text('context_type', {
      enum: ['market_position', 'trend_vector', 'cluster_centroid', 'price_trajectory', 'volatility_surface']
    }).default('market_position').notNull(),

    // Temporal data for prediction models
    temporalData: jsonb('temporal_data').$type<{
      timestamp: string;
      priceAtTime: number;
      volumeAtTime: number;
      predictionWindow: '1h' | '24h' | '7d' | '30d';
      confidence: number;
    }>(),

    // Metadata for provenance and model tracking
    metadata: jsonb('metadata').$type<{
      modelVersion: string;
      embeddingModel: string;
      sourceData: string[];
      generatedAt: string;
      imageFeatures?: Record<string, number>;
      marketFeatures?: Record<string, number>;
    }>().notNull().default({}),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index on card for quick card-specific spatial queries
    cardIdx: index('idx_spatial_card').on(table.cardId),
    // Index on user for personalized queries
    userIdx: index('idx_spatial_user').on(table.userId),
    // Index on context type for filtering
    contextTypeIdx: index('idx_spatial_context_type').on(table.contextType),
    // Timestamp index for temporal queries
    createdAtIdx: index('idx_spatial_created_at').on(table.createdAt),
    // HNSW index for vector similarity (created in migration)
    // embeddingIdx: index('idx_spatial_embedding_hnsw').on(table.embedding).using('hnsw'),
  })
);

// ============================================================================
// LIVELIHOOD ANALYSIS SYSTEM
// ============================================================================

/**
 * Livelihood Analysis Results table
 *
 * Stores AI-generated analysis of job impacts, upskilling opportunities,
 * and discovery pathways. Addresses user anxieties about AI displacement.
 *
 * Features:
 * - Job impact assessments (displacement vs augmentation)
 * - Upskilling pathway recommendations
 * - Industry trend analysis
 * - Confidence scoring and citations
 */
export const livelihoodAnalysis = pgTable(
  'livelihood_analysis',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // User reference
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Original query that triggered analysis
    query: text('query').notNull(),

    // Analysis type
    analysisType: text('analysis_type', {
      enum: ['job_impact', 'upskilling', 'opportunity_discovery', 'trend_analysis', 'policy_compliance']
    }).notNull(),

    // Impact assessment (for job_impact type)
    impactAssessment: jsonb('impact_assessment').$type<{
      displacementRisk: 'low' | 'medium' | 'high';
      augmentationPotential: 'low' | 'medium' | 'high';
      timelineYears: number;
      affectedRoles: string[];
      emergingRoles: string[];
      skillGaps: string[];
      reasoning: string;
    }>(),

    // Upskilling recommendations
    upskillPathways: jsonb('upskill_pathways').$type<Array<{
      pathway: string;
      skills: string[];
      estimatedTimeMonths: number;
      resources: Array<{ name: string; url?: string; type: string }>;
      relevanceScore: number;
    }>>(),

    // Discovery results (new opportunities found)
    discoveryResults: jsonb('discovery_results').$type<{
      opportunities: Array<{
        title: string;
        description: string;
        category: string;
        tcgRelevance: number;
        aiAugmented: boolean;
      }>;
      insights: string[];
      relatedCards?: string[];
    }>(),

    // Policy/regulation context (EU AI Act, etc.)
    policyContext: jsonb('policy_context').$type<{
      region: string;
      applicableRegulations: string[];
      complianceStatus: 'compliant' | 'review_needed' | 'non_compliant';
      restrictions: string[];
    }>(),

    // Overall analysis response
    response: text('response').notNull(),

    // Confidence and reliability
    confidenceScore: real('confidence_score').notNull(),
    reliabilityTier: text('reliability_tier', {
      enum: ['verified', 'high', 'medium', 'low', 'speculative']
    }).default('medium').notNull(),

    // Agent execution metadata
    agentMetadata: jsonb('agent_metadata').$type<{
      agentsUsed: string[];
      executionTimeMs: number;
      tokensUsed: number;
      model: string;
      consensusReached: boolean;
    }>().notNull().default({}),

    // Citations and sources
    citations: jsonb('citations').$type<Array<{
      source: string;
      url?: string;
      relevance: number;
      quote?: string;
    }>>().notNull().default([]),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index on user for history queries
    userIdx: index('idx_livelihood_user').on(table.userId),
    // Index on analysis type
    typeIdx: index('idx_livelihood_type').on(table.analysisType),
    // Index on confidence for filtering
    confidenceIdx: index('idx_livelihood_confidence').on(table.confidenceScore),
    // Timestamp index for recent analyses
    createdAtIdx: index('idx_livelihood_created_at').on(table.createdAt),
  })
);

/**
 * Livelihood Metrics table
 *
 * Tracks user engagement with livelihood tools for platform analytics.
 * Enables FDE-inspired customer-specific insights and deployment metrics.
 */
export const livelihoodMetrics = pgTable(
  'livelihood_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // User reference
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Metric type
    metricType: text('metric_type', {
      enum: ['query', 'upskill_start', 'upskill_complete', 'discovery_click', 'feedback', 'session']
    }).notNull(),

    // Metric value (count, duration, score, etc.)
    value: real('value').notNull(),

    // Metric context
    context: jsonb('context').$type<{
      analysisId?: string;
      pathwayId?: string;
      sessionDurationMs?: number;
      queryCategory?: string;
      feedbackType?: 'helpful' | 'not_helpful' | 'inaccurate';
      feedbackText?: string;
    }>(),

    // Timestamp
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index on user for analytics
    userIdx: index('idx_metrics_user').on(table.userId),
    // Index on metric type
    typeIdx: index('idx_metrics_type').on(table.metricType),
    // Timestamp index
    createdAtIdx: index('idx_metrics_created_at').on(table.createdAt),
  })
);

/**
 * Policy Compliance Flags table
 *
 * Stores compliance flags for users based on their region and AI usage patterns.
 * Implements Phase 3 policy awareness (EU AI Act, Trump EO, etc.)
 */
export const policyComplianceFlags = pgTable(
  'policy_compliance_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // User reference
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // User's region for compliance checking
    region: text('region').notNull(), // 'EU', 'US', 'IN', etc.

    // Compliance framework
    framework: text('framework', {
      enum: ['eu_ai_act', 'us_eo_14110', 'india_ai_guidelines', 'uk_ai_framework', 'global_default']
    }).notNull(),

    // Risk classification
    riskLevel: text('risk_level', {
      enum: ['minimal', 'limited', 'high', 'unacceptable']
    }).default('minimal').notNull(),

    // Active restrictions
    restrictions: jsonb('restrictions').$type<{
      blockedFeatures: string[];
      requiresHumanReview: boolean;
      requiresConsent: boolean;
      dataRetentionDays: number;
      transparencyRequired: boolean;
    }>().notNull().default({}),

    // Last compliance check
    lastCheckedAt: timestamp('last_checked_at').defaultNow().notNull(),

    // Next review date
    nextReviewAt: timestamp('next_review_at'),

    // Audit trail
    auditLog: jsonb('audit_log').$type<Array<{
      action: string;
      timestamp: string;
      reason: string;
      performedBy: string;
    }>>().notNull().default([]),

    // Status
    isActive: boolean('is_active').default(true).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique per user + framework
    userFrameworkIdx: index('idx_compliance_user_framework').on(table.userId, table.framework),
    // Index on region
    regionIdx: index('idx_compliance_region').on(table.region),
    // Index on risk level
    riskIdx: index('idx_compliance_risk').on(table.riskLevel),
    // Index on active status
    activeIdx: index('idx_compliance_active').on(table.isActive),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const spatialEmbeddingsRelations = relations(spatialEmbeddings, ({ one }) => ({
  card: one(cards, {
    fields: [spatialEmbeddings.cardId],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [spatialEmbeddings.userId],
    references: [users.id],
  }),
}));

export const livelihoodAnalysisRelations = relations(livelihoodAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [livelihoodAnalysis.userId],
    references: [users.id],
  }),
}));

export const livelihoodMetricsRelations = relations(livelihoodMetrics, ({ one }) => ({
  user: one(users, {
    fields: [livelihoodMetrics.userId],
    references: [users.id],
  }),
}));

export const policyComplianceFlagsRelations = relations(policyComplianceFlags, ({ one }) => ({
  user: one(users, {
    fields: [policyComplianceFlags.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SpatialEmbedding = typeof spatialEmbeddings.$inferSelect;
export type NewSpatialEmbedding = typeof spatialEmbeddings.$inferInsert;
export type LivelihoodAnalysis = typeof livelihoodAnalysis.$inferSelect;
export type NewLivelihoodAnalysis = typeof livelihoodAnalysis.$inferInsert;
export type LivelihoodMetric = typeof livelihoodMetrics.$inferSelect;
export type NewLivelihoodMetric = typeof livelihoodMetrics.$inferInsert;
export type PolicyComplianceFlag = typeof policyComplianceFlags.$inferSelect;
export type NewPolicyComplianceFlag = typeof policyComplianceFlags.$inferInsert;
