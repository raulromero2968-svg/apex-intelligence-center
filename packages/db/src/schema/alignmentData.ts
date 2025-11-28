import {
  pgTable,
  text,
  uuid,
  real,
  jsonb,
  timestamp,
  index,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { simulationModels } from './simulationModels';

/**
 * Alignment Data Schema for Apex Intelligence
 *
 * Stores FHI alignment and POST-Agency corrigibility data for simulations.
 * Implements KB-09 data migration patterns with pgvector support.
 *
 * Key concepts:
 * - Corrigibility: Agent's acceptance of corrections/shutdown
 * - Value loading: Alignment with longtermist ethics
 * - POST-Agency: Posterior goal update tracking
 *
 * Trade-offs:
 * - GOOD: Enables alignment auditing and corrigibility tracking
 * - BAD: Adds storage overhead; mitigate with TTL-based cleanup
 * - ETHICAL: Required for FHI compliance in simulation markets
 */

// Alignment status enum
export const alignmentStatusEnum = pgEnum('alignment_status', [
  'aligned',
  'warning',
  'blocked',
  'pending_review',
]);

// Corrigibility level enum
export const corrigibilityLevelEnum = pgEnum('corrigibility_level', [
  'full',        // Accepts all corrections/shutdowns
  'partial',     // Accepts corrections with constraints
  'minimal',     // Limited correction acceptance
  'none',        // Non-corrigible (blocked by policy)
]);

// POST-Agency update type enum
export const postAgencyUpdateTypeEnum = pgEnum('post_agency_update_type', [
  'goal',
  'value',
  'constraint',
  'shutdown',
]);

/**
 * Alignment Data table
 * Stores corrigibility scores and FHI alignment data for simulations
 */
export const alignmentData = pgTable(
  'alignment_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Reference to simulation (nullable for standalone alignment checks) */
    simId: uuid('sim_id').references(() => simulationModels.id, { onDelete: 'cascade' }),

    /** User who owns this alignment data */
    userId: uuid('user_id').notNull(),

    // Corrigibility metrics
    /** Overall corrigibility score (0-1) */
    corrScore: real('corr_score').notNull().default(0.5),
    /** Corrigibility level classification */
    corrLevel: corrigibilityLevelEnum('corr_level').notNull().default('full'),
    /** Whether agent accepts shutdown commands */
    acceptsShutdown: boolean('accepts_shutdown').notNull().default(true),
    /** Whether agent accepts goal modifications */
    acceptsGoalMod: boolean('accepts_goal_mod').notNull().default(true),

    // Value loading metrics
    /** Value loading status */
    valueLoadingStatus: alignmentStatusEnum('value_loading_status').notNull().default('aligned'),
    /** Alignment with longtermist ethics (0-1) */
    longtermistScore: real('longtermist_score').notNull().default(0.5),
    /** Detected alignment concerns */
    concerns: jsonb('concerns').notNull().default([]),

    // POST-Agency tracking
    /** Whether POST-Agency is enabled for this simulation */
    postAgencyEnabled: boolean('post_agency_enabled').notNull().default(false),
    /** Maximum recursion depth for posterior updates */
    recursionCap: integer('recursion_cap').notNull().default(5),
    /** Current recursion depth */
    currentRecursion: integer('current_recursion').notNull().default(0),
    /** History of posterior updates */
    posteriorUpdates: jsonb('posterior_updates').notNull().default([]),

    // Audit trail
    /** Session ID for audit correlation */
    sessionId: text('session_id'),
    /** IP address for security audit */
    ipAddress: text('ip_address'),
    /** User agent for device tracking */
    userAgent: text('user_agent'),

    // Metadata
    /** Source of alignment check (api, simulation, manual) */
    source: text('source').notNull().default('api'),
    /** Additional metadata */
    metadata: jsonb('metadata').notNull().default({}),

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    /** Expiration for TTL-based cleanup */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    simIdIdx: index('alignment_data_sim_id_idx').on(table.simId),
    userIdIdx: index('alignment_data_user_id_idx').on(table.userId),
    corrScoreIdx: index('alignment_data_corr_score_idx').on(table.corrScore),
    valueLoadingIdx: index('alignment_data_value_loading_idx').on(table.valueLoadingStatus),
    createdAtIdx: index('alignment_data_created_at_idx').on(table.createdAt),
    userSimIdx: index('alignment_data_user_sim_idx').on(table.userId, table.simId),
  })
);

/**
 * POST-Agency Update Log table
 * Tracks individual posterior updates for audit and analysis
 */
export const postAgencyUpdates = pgTable(
  'post_agency_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Reference to alignment data */
    alignmentId: uuid('alignment_id')
      .references(() => alignmentData.id, { onDelete: 'cascade' })
      .notNull(),

    /** Type of posterior update */
    updateType: postAgencyUpdateTypeEnum('update_type').notNull(),

    /** Description of the update */
    description: text('description').notNull(),

    /** Proposed outcome/behavior */
    proposedOutcome: text('proposed_outcome').notNull(),

    /** Justification for the update */
    justification: text('justification'),

    /** Whether update was allowed */
    allowed: boolean('allowed').notNull(),

    /** Reason for decision */
    reason: text('reason').notNull(),

    /** Risk level assessment */
    riskLevel: text('risk_level').notNull().default('low'),

    /** Recursion depth at time of update */
    recursionDepth: integer('recursion_depth').notNull(),

    /** Whether MFA was required */
    mfaRequired: boolean('mfa_required').notNull().default(false),

    /** Whether MFA was verified */
    mfaVerified: boolean('mfa_verified').notNull().default(false),

    /** Audit trail ID from security module */
    auditId: text('audit_id'),

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    alignmentIdIdx: index('post_agency_updates_alignment_id_idx').on(table.alignmentId),
    updateTypeIdx: index('post_agency_updates_type_idx').on(table.updateType),
    allowedIdx: index('post_agency_updates_allowed_idx').on(table.allowed),
    createdAtIdx: index('post_agency_updates_created_at_idx').on(table.createdAt),
  })
);

/**
 * Alignment Audit Log table
 * Comprehensive audit trail for alignment decisions
 */
export const alignmentAuditLog = pgTable(
  'alignment_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Reference to alignment data (optional for system-level audits) */
    alignmentId: uuid('alignment_id').references(() => alignmentData.id, { onDelete: 'set null' }),

    /** User who triggered the audit event */
    userId: uuid('user_id').notNull(),

    /** Action performed */
    action: text('action').notNull(), // 'check', 'update', 'block', 'override'

    /** Resource affected */
    resource: text('resource').notNull(), // 'simulation', 'alignment', 'post_agency'

    /** Whether action succeeded */
    success: boolean('success').notNull(),

    /** Risk level of the action */
    riskLevel: text('risk_level').notNull().default('low'),

    /** Detailed event data */
    details: jsonb('details').notNull().default({}),

    /** Request context */
    sessionId: text('session_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Temporal
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    alignmentIdIdx: index('alignment_audit_log_alignment_id_idx').on(table.alignmentId),
    userIdIdx: index('alignment_audit_log_user_id_idx').on(table.userId),
    actionIdx: index('alignment_audit_log_action_idx').on(table.action),
    createdAtIdx: index('alignment_audit_log_created_at_idx').on(table.createdAt),
    riskLevelIdx: index('alignment_audit_log_risk_level_idx').on(table.riskLevel),
  })
);

// Type exports
export type AlignmentData = InferSelectModel<typeof alignmentData>;
export type NewAlignmentData = InferInsertModel<typeof alignmentData>;
export type PostAgencyUpdate = InferSelectModel<typeof postAgencyUpdates>;
export type NewPostAgencyUpdate = InferInsertModel<typeof postAgencyUpdates>;
export type AlignmentAuditLogEntry = InferSelectModel<typeof alignmentAuditLog>;
export type NewAlignmentAuditLogEntry = InferInsertModel<typeof alignmentAuditLog>;

// Enum value types for type safety
export type AlignmentStatus = 'aligned' | 'warning' | 'blocked' | 'pending_review';
export type CorrigibilityLevel = 'full' | 'partial' | 'minimal' | 'none';
export type PostAgencyUpdateType = 'goal' | 'value' | 'constraint' | 'shutdown';
