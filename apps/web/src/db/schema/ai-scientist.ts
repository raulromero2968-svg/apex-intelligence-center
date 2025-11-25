/**
 * AI Scientist Database Schema
 *
 * Implements Phase 1 data requirements for the AI Scientist integration.
 * Supports API logging, task management, contribution tracking, and evaluations.
 *
 * Tables:
 * - faraApiLogs: Logs for Fara-7B API calls and actions
 * - automationTasks: Task queue for automation requests
 * - ospContributions: Open Science Protocol contribution ledger
 * - apexArenaEvaluations: ApexArena evaluation results
 * - knowledgeGraphSync: Sync status between Neo4j and PostgreSQL
 *
 * @see Phase 1 Implementation Plan for data requirements
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
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'paused',
]);

export const actionTypeEnum = pgEnum('action_type', [
  'click',
  'type',
  'scroll',
  'navigate',
  'wait',
  'screenshot',
  'extract_text',
  'web_search',
  'visit_url',
]);

export const contributionTypeEnum = pgEnum('contribution_type', [
  'data_collection',
  'data_curation',
  'research_synthesis',
  'hypothesis_generation',
  'experiment_execution',
  'peer_review',
  'model_training',
]);

export const evaluationStatusEnum = pgEnum('evaluation_status', [
  'pending',
  'in_progress',
  'completed',
  'rejected',
  'appealed',
]);

// ============================================================================
// FARA API LOGS
// ============================================================================

/**
 * Logs for Fara-7B API calls and actions
 *
 * Provides a complete audit trail of all automation actions.
 * Used for debugging, compliance, and performance analysis.
 */
export const faraApiLogs = pgTable(
  'fara_api_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id').notNull(),
    userId: text('user_id'),

    // Request info
    requestType: text('request_type', {
      enum: ['submit_task', 'get_task', 'approve_critical_point', 'cancel_task'],
    }).notNull(),
    requestPayload: jsonb('request_payload').$type<{
      instruction?: string;
      context?: Record<string, unknown>;
      maxSteps?: number;
      approval?: boolean;
    }>(),

    // Response info
    responseStatus: integer('response_status'),
    responsePayload: jsonb('response_payload').$type<{
      taskId?: string;
      status?: string;
      result?: unknown;
      error?: string;
    }>(),

    // Action details (for action logs)
    actionType: actionTypeEnum('action_type'),
    actionParameters: jsonb('action_parameters').$type<{
      target?: string;
      value?: string;
      coordinates?: { x: number; y: number };
    }>(),
    actionSuccess: boolean('action_success'),
    actionReasoning: text('action_reasoning'),
    screenshotUrl: text('screenshot_url'),

    // Performance metrics
    latencyMs: integer('latency_ms'),
    tokensUsed: integer('tokens_used'),
    estimatedCost: real('estimated_cost'),

    // Error tracking
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),

    // Timestamps
    requestedAt: timestamp('requested_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
  },
  (table) => ({
    taskIdx: index('idx_fara_logs_task').on(table.taskId),
    userIdx: index('idx_fara_logs_user').on(table.userId),
    requestTypeIdx: index('idx_fara_logs_request_type').on(table.requestType),
    requestedAtIdx: index('idx_fara_logs_requested_at').on(table.requestedAt),
  })
);

export type FaraApiLog = typeof faraApiLogs.$inferSelect;
export type NewFaraApiLog = typeof faraApiLogs.$inferInsert;

// ============================================================================
// AUTOMATION TASKS
// ============================================================================

/**
 * Task queue for automation requests
 *
 * Manages the lifecycle of automation tasks from submission to completion.
 * Supports prioritization, retry logic, and scheduling.
 */
export const automationTasks = pgTable(
  'automation_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),

    // Task definition
    taskType: text('task_type', {
      enum: ['price_lookup', 'data_extraction', 'research_mining', 'market_monitoring', 'custom'],
    }).notNull(),
    instruction: text('instruction').notNull(),
    context: jsonb('context').$type<Record<string, unknown>>(),

    // Configuration
    maxSteps: integer('max_steps').default(50),
    timeoutMs: integer('timeout_ms').default(300000),
    priority: integer('priority').default(5), // 1-10, higher = more urgent
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(3),

    // Status
    status: taskStatusEnum('status').default('pending').notNull(),
    progress: real('progress').default(0),
    currentStep: integer('current_step').default(0),

    // Results
    result: jsonb('result').$type<{
      success: boolean;
      data?: unknown;
      error?: string;
    }>(),
    actionCount: integer('action_count').default(0),

    // Execution info
    workerId: text('worker_id'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Scheduling
    scheduledAt: timestamp('scheduled_at'),
    scheduleExpression: text('schedule_expression'), // Cron expression

    // Cost tracking
    estimatedCost: real('estimated_cost'),
    actualCost: real('actual_cost'),

    // Metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_automation_tasks_user').on(table.userId),
    statusIdx: index('idx_automation_tasks_status').on(table.status),
    typeIdx: index('idx_automation_tasks_type').on(table.taskType),
    priorityIdx: index('idx_automation_tasks_priority').on(table.priority),
    scheduledIdx: index('idx_automation_tasks_scheduled').on(table.scheduledAt),
    createdIdx: index('idx_automation_tasks_created').on(table.createdAt),
  })
);

export type AutomationTask = typeof automationTasks.$inferSelect;
export type NewAutomationTask = typeof automationTasks.$inferInsert;

// ============================================================================
// OSP CONTRIBUTIONS
// ============================================================================

/**
 * Open Science Protocol contribution ledger
 *
 * Tracks contributions from human and AI collaborators.
 * Used for attribution, incentive distribution, and provenance tracking.
 */
export const ospContributions = pgTable(
  'osp_contributions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contributorId: text('contributor_id').notNull(), // User ID or Agent ID
    contributorType: text('contributor_type', {
      enum: ['human', 'ai_agent', 'multi_agent_system'],
    }).notNull(),

    // Contribution details
    contributionType: contributionTypeEnum('contribution_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),

    // Content reference
    contentType: text('content_type', {
      enum: ['research_paper', 'dataset', 'model', 'code', 'review', 'annotation'],
    }),
    contentId: text('content_id'), // Reference to external content
    contentUrl: text('content_url'),

    // Provenance
    parentContributionId: uuid('parent_contribution_id'),
    derivedFrom: jsonb('derived_from').$type<{
      contributions: string[];
      papers: string[];
      datasets: string[];
    }>(),

    // Quality metrics
    qualityScore: real('quality_score'), // 0-1
    peerReviewStatus: text('peer_review_status', {
      enum: ['pending', 'approved', 'rejected', 'revision_requested'],
    }),
    reviewerNotes: text('reviewer_notes'),

    // Impact metrics
    citations: integer('citations').default(0),
    downloads: integer('downloads').default(0),
    reuses: integer('reuses').default(0),

    // Attribution
    attributionWeight: real('attribution_weight').default(1.0),
    collaborators: jsonb('collaborators').$type<{
      contributorId: string;
      role: string;
      weight: number;
    }[]>(),

    // Timestamps
    contributedAt: timestamp('contributed_at').defaultNow().notNull(),
    verifiedAt: timestamp('verified_at'),
    lastAccessedAt: timestamp('last_accessed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    contributorIdx: index('idx_osp_contributions_contributor').on(table.contributorId),
    typeIdx: index('idx_osp_contributions_type').on(table.contributionType),
    contentTypeIdx: index('idx_osp_contributions_content_type').on(table.contentType),
    contributedAtIdx: index('idx_osp_contributions_contributed_at').on(table.contributedAt),
  })
);

export type OspContribution = typeof ospContributions.$inferSelect;
export type NewOspContribution = typeof ospContributions.$inferInsert;

// ============================================================================
// APEX ARENA EVALUATIONS
// ============================================================================

/**
 * ApexArena evaluation results
 *
 * Stores evaluation metrics for AI agents and contributions.
 * Used for quality control, leaderboards, and continuous improvement.
 */
export const apexArenaEvaluations = pgTable(
  'apex_arena_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Subject of evaluation
    subjectType: text('subject_type', {
      enum: ['agent', 'contribution', 'workflow', 'hypothesis', 'experiment'],
    }).notNull(),
    subjectId: text('subject_id').notNull(),

    // Evaluator info
    evaluatorId: text('evaluator_id'),
    evaluatorType: text('evaluator_type', {
      enum: ['human_expert', 'ai_model', 'automated_test', 'peer_review'],
    }).notNull(),

    // Evaluation type
    evaluationType: text('evaluation_type', {
      enum: [
        'accuracy',
        'efficiency',
        'creativity',
        'novelty',
        'reproducibility',
        'safety',
        'ethics',
        'overall',
      ],
    }).notNull(),

    // Scores
    score: real('score').notNull(), // 0-100
    confidence: real('confidence'), // 0-1
    normalizedScore: real('normalized_score'), // Percentile rank

    // Detailed metrics
    metrics: jsonb('metrics').$type<{
      precision?: number;
      recall?: number;
      f1Score?: number;
      latency?: number;
      costEfficiency?: number;
      userSatisfaction?: number;
      [key: string]: number | undefined;
    }>(),

    // Feedback
    feedback: text('feedback'),
    strengths: jsonb('strengths').$type<string[]>(),
    weaknesses: jsonb('weaknesses').$type<string[]>(),
    recommendations: jsonb('recommendations').$type<string[]>(),

    // Status
    status: evaluationStatusEnum('status').default('pending').notNull(),

    // Context
    evaluationContext: jsonb('evaluation_context').$type<{
      benchmark?: string;
      dataset?: string;
      conditions?: Record<string, unknown>;
    }>(),

    // Timestamps
    evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    subjectIdx: index('idx_apex_evaluations_subject').on(table.subjectType, table.subjectId),
    evaluatorIdx: index('idx_apex_evaluations_evaluator').on(table.evaluatorId),
    typeIdx: index('idx_apex_evaluations_type').on(table.evaluationType),
    scoreIdx: index('idx_apex_evaluations_score').on(table.score),
    evaluatedAtIdx: index('idx_apex_evaluations_evaluated_at').on(table.evaluatedAt),
  })
);

export type ApexArenaEvaluation = typeof apexArenaEvaluations.$inferSelect;
export type NewApexArenaEvaluation = typeof apexArenaEvaluations.$inferInsert;

// ============================================================================
// KNOWLEDGE GRAPH SYNC
// ============================================================================

/**
 * Sync status between Neo4j and PostgreSQL
 *
 * Tracks synchronization state for data that exists in both databases.
 * Ensures consistency and enables offline-first operations.
 */
export const knowledgeGraphSync = pgTable(
  'knowledge_graph_sync',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Entity reference
    entityType: text('entity_type', {
      enum: ['card', 'market', 'transaction', 'research', 'concept', 'agent'],
    }).notNull(),
    entityId: text('entity_id').notNull(),

    // Sync status
    neo4jId: text('neo4j_id'),
    postgresId: text('postgres_id'),
    syncStatus: text('sync_status', {
      enum: ['synced', 'pending_neo4j', 'pending_postgres', 'conflict', 'error'],
    }).notNull(),

    // Version tracking
    neo4jVersion: integer('neo4j_version').default(0),
    postgresVersion: integer('postgres_version').default(0),

    // Checksums for conflict detection
    neo4jChecksum: text('neo4j_checksum'),
    postgresChecksum: text('postgres_checksum'),

    // Conflict resolution
    conflictData: jsonb('conflict_data').$type<{
      neo4jData?: Record<string, unknown>;
      postgresData?: Record<string, unknown>;
      resolution?: 'neo4j_wins' | 'postgres_wins' | 'manual' | 'merge';
    }>(),

    // Error tracking
    lastError: text('last_error'),
    errorCount: integer('error_count').default(0),

    // Timestamps
    lastSyncedAt: timestamp('last_synced_at'),
    lastModifiedNeo4j: timestamp('last_modified_neo4j'),
    lastModifiedPostgres: timestamp('last_modified_postgres'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index('idx_kg_sync_entity').on(table.entityType, table.entityId),
    statusIdx: index('idx_kg_sync_status').on(table.syncStatus),
    neo4jIdx: index('idx_kg_sync_neo4j').on(table.neo4jId),
    lastSyncedIdx: index('idx_kg_sync_last_synced').on(table.lastSyncedAt),
  })
);

export type KnowledgeGraphSync = typeof knowledgeGraphSync.$inferSelect;
export type NewKnowledgeGraphSync = typeof knowledgeGraphSync.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const faraApiLogsRelations = relations(faraApiLogs, ({ one }) => ({
  task: one(automationTasks, {
    fields: [faraApiLogs.taskId],
    references: [automationTasks.id],
  }),
}));

export const automationTasksRelations = relations(automationTasks, ({ many }) => ({
  logs: many(faraApiLogs),
}));

export const ospContributionsRelations = relations(ospContributions, ({ one, many }) => ({
  parentContribution: one(ospContributions, {
    fields: [ospContributions.parentContributionId],
    references: [ospContributions.id],
    relationName: 'derivedContributions',
  }),
  derivedContributions: many(ospContributions, {
    relationName: 'derivedContributions',
  }),
  evaluations: many(apexArenaEvaluations),
}));

export const apexArenaEvaluationsRelations = relations(apexArenaEvaluations, ({ one }) => ({
  contribution: one(ospContributions, {
    fields: [apexArenaEvaluations.subjectId],
    references: [ospContributions.id],
  }),
}));
