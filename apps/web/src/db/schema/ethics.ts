/**
 * Ethics & Certification Schema for Apex Intelligence
 *
 * Implements ISO 42001 AI ethics certification auditing:
 * - 10-step certification checklist
 * - Job impact assessments
 * - Human-in-the-loop tracking
 * - Audit trails for EU AI Act compliance
 *
 * @see pack-ai-defense-001 §4 for ethics requirements
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// ISO 42001 CERTIFICATION AUDIT SYSTEM
// ============================================================================

/**
 * ISO 42001 Certification Audits - Full certification audit records
 */
export const iso42001Audits = pgTable('iso_42001_audits', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Audit identification
  auditNumber: text('audit_number').notNull().unique(),
  auditType: text('audit_type', {
    enum: ['initial', 'surveillance', 'recertification', 'special']
  }).notNull(),

  // Audit scope
  scope: jsonb('scope').$type<{
    systems: string[];
    processes: string[];
    aiModels: string[];
    dataFlows: string[];
  }>().notNull(),

  // 10-Step Checklist Results
  checklistResults: jsonb('checklist_results').$type<{
    steps: Array<{
      stepNumber: number;
      stepName: string;
      description: string;
      status: 'pass' | 'fail' | 'partial' | 'not_applicable';
      findings: string[];
      evidence: string[];
      recommendations: string[];
      auditorNotes?: string;
    }>;
    overallScore: number; // 0-100
    criticalFindings: number;
    majorFindings: number;
    minorFindings: number;
  }>().notNull(),

  // ISO 42001 Specific Requirements
  iso42001Compliance: jsonb('iso42001_compliance').$type<{
    // 4. Context of the organization
    contextAnalysis: boolean;
    // 5. Leadership
    leadershipCommitment: boolean;
    aiPolicy: boolean;
    // 6. Planning
    riskAssessment: boolean;
    objectivesSet: boolean;
    // 7. Support
    resourcesAllocated: boolean;
    competenceVerified: boolean;
    awarenessTraining: boolean;
    // 8. Operation
    operationalPlanning: boolean;
    aiSystemLifecycle: boolean;
    // 9. Performance evaluation
    monitoringEstablished: boolean;
    internalAuditConducted: boolean;
    managementReview: boolean;
    // 10. Improvement
    correctiveActions: boolean;
    continualImprovement: boolean;
  }>().notNull(),

  // EU AI Act Compliance (additional)
  euAiActCompliance: jsonb('eu_ai_act_compliance').$type<{
    riskCategory: 'unacceptable' | 'high' | 'limited' | 'minimal';
    transparencyRequirementsMet: boolean;
    humanOversightMet: boolean;
    dataGovernanceMet: boolean;
    technicalDocumentation: boolean;
    conformityAssessment: boolean;
  }>(),

  // Overall status
  status: text('status', {
    enum: ['in_progress', 'completed', 'certified', 'failed', 'suspended']
  }).default('in_progress').notNull(),
  certificationLevel: text('certification_level', {
    enum: ['bronze', 'silver', 'gold', 'platinum']
  }),

  // Auditor info
  leadAuditorId: text('lead_auditor_id').references(() => users.id, { onDelete: 'set null' }),
  auditTeam: jsonb('audit_team').$type<Array<{
    userId?: string;
    name: string;
    role: string;
  }>>().default([]),

  // Timing
  scheduledDate: timestamp('scheduled_date'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  certificateExpiresAt: timestamp('certificate_expires_at'),

  // Report
  reportUrl: text('report_url'),
  certificateUrl: text('certificate_url'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  auditNumberIdx: uniqueIndex('idx_iso42001_audits_number').on(table.auditNumber),
  statusIdx: index('idx_iso42001_audits_status').on(table.status),
  typeIdx: index('idx_iso42001_audits_type').on(table.auditType),
  scheduledIdx: index('idx_iso42001_audits_scheduled').on(table.scheduledDate),
  certExpiresIdx: index('idx_iso42001_audits_cert_expires').on(table.certificateExpiresAt),
}));

/**
 * Job Impact Assessments - AI feature job impact tracking
 */
export const jobImpactAssessments = pgTable('job_impact_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Feature identification
  featureId: text('feature_id').notNull(),
  featureName: text('feature_name').notNull(),
  featureCategory: text('feature_category', {
    enum: ['automation', 'analytics', 'trading', 'content', 'communication', 'other']
  }).notNull(),

  // Impact analysis
  impactCategory: text('impact_category', {
    enum: ['high_impact', 'medium_impact', 'low_impact', 'positive_impact']
  }).notNull(),
  impactScore: real('impact_score').notNull(), // 0-1

  // Job roles affected
  affectedRoles: jsonb('affected_roles').$type<Array<{
    role: string;
    impactLevel: 'displacement' | 'augmentation' | 'transformation' | 'creation';
    estimatedPercentage: number;
  }>>().default([]),

  // Mitigation
  mitigationPlan: jsonb('mitigation_plan').$type<{
    reskillPrograms: string[];
    transitionSupport: string[];
    newOpportunities: string[];
    timeline: string;
  }>(),

  // Time savings (positive framing)
  timeSavingsAnalysis: jsonb('time_savings_analysis').$type<{
    hoursPerWeek: number;
    tasksAutomated: string[];
    suggestedAlternativeUses: string[];
    productivityGain: number;
  }>(),

  // Ethics review
  ethicsReviewed: boolean('ethics_reviewed').default(false).notNull(),
  ethicsReviewerId: text('ethics_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  ethicsReviewedAt: timestamp('ethics_reviewed_at'),
  ethicsApproved: boolean('ethics_approved'),
  ethicsNotes: text('ethics_notes'),

  // Audit link
  auditId: uuid('audit_id').references(() => iso42001Audits.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  featureIdx: index('idx_job_impact_feature').on(table.featureId),
  categoryIdx: index('idx_job_impact_category').on(table.impactCategory),
  reviewedIdx: index('idx_job_impact_reviewed').on(table.ethicsReviewed),
  auditIdx: index('idx_job_impact_audit').on(table.auditId),
}));

/**
 * Human-in-the-Loop Records - HITL intervention tracking
 */
export const humanInTheLoopRecords = pgTable('human_in_the_loop_records', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Operation identification
  operationType: text('operation_type', {
    enum: ['decision_override', 'content_review', 'safety_check', 'quality_assurance', 'escalation', 'approval']
  }).notNull(),
  operationId: text('operation_id').notNull(),

  // AI system info
  aiSystemId: text('ai_system_id').notNull(),
  aiModelVersion: text('ai_model_version'),
  aiConfidenceScore: real('ai_confidence_score'),

  // AI output before human review
  aiOutput: jsonb('ai_output').$type<{
    decision?: string;
    content?: string;
    reasoning?: string[];
    alternatives?: string[];
  }>().notNull(),

  // Human intervention
  humanDecision: text('human_decision', {
    enum: ['approved', 'rejected', 'modified', 'escalated']
  }).notNull(),
  humanModifications: jsonb('human_modifications').$type<{
    changes: string[];
    reason: string;
  }>(),
  humanReviewerId: text('human_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  reviewTimeSeconds: integer('review_time_seconds'),

  // Risk and impact
  riskLevel: text('risk_level', {
    enum: ['low', 'medium', 'high', 'critical']
  }).notNull(),
  impactedUsers: integer('impacted_users'),

  // Feedback loop
  feedbackProvided: boolean('feedback_provided').default(false).notNull(),
  feedbackForModel: jsonb('feedback_for_model').$type<{
    correctOutput?: any;
    errorType?: string;
    improvementSuggestion?: string;
  }>(),

  // Audit trail
  auditId: uuid('audit_id').references(() => iso42001Audits.id, { onDelete: 'set null' }),

  reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  operationIdx: index('idx_hitl_operation').on(table.operationType, table.operationId),
  aiSystemIdx: index('idx_hitl_ai_system').on(table.aiSystemId),
  reviewerIdx: index('idx_hitl_reviewer').on(table.humanReviewerId),
  decisionIdx: index('idx_hitl_decision').on(table.humanDecision),
  riskIdx: index('idx_hitl_risk').on(table.riskLevel),
  reviewedAtIdx: index('idx_hitl_reviewed_at').on(table.reviewedAt),
}));

/**
 * Ethics Guards - Real-time ethics check logs
 */
export const ethicsGuardLogs = pgTable('ethics_guard_logs', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Request context
  requestType: text('request_type').notNull(),
  requesterId: text('requester_id'), // user or system
  requesterType: text('requester_type', {
    enum: ['user', 'system', 'api', 'cron']
  }).notNull(),

  // Check details
  checkConfig: jsonb('check_config').$type<{
    type: string;
    impactScore: number;
    context?: Record<string, any>;
  }>().notNull(),

  // Result
  approved: boolean('approved').notNull(),
  reason: text('reason'),
  warnings: jsonb('warnings').$type<string[]>().default([]),

  // Escalation
  escalated: boolean('escalated').default(false).notNull(),
  escalatedTo: text('escalated_to'),
  escalationReason: text('escalation_reason'),

  // Performance
  checkDurationMs: integer('check_duration_ms'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  requestTypeIdx: index('idx_ethics_guard_request_type').on(table.requestType),
  approvedIdx: index('idx_ethics_guard_approved').on(table.approved),
  escalatedIdx: index('idx_ethics_guard_escalated').on(table.escalated),
  createdAtIdx: index('idx_ethics_guard_created').on(table.createdAt),
}));

/**
 * Purpose Mode Sessions - Tracks AI time-savings and purpose suggestions
 */
export const purposeModeSessions = pgTable('purpose_mode_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Session data
  enabled: boolean('enabled').notNull(),
  actionType: text('action_type').notNull(),

  // Time savings
  timeSavedHours: real('time_saved_hours').notNull(),
  tasksAutomated: jsonb('tasks_automated').$type<string[]>().default([]),

  // RAG suggestions
  creativeSuggestions: jsonb('creative_suggestions').$type<Array<{
    suggestion: string;
    category: 'learning' | 'creative' | 'social' | 'wellness' | 'career';
    priority: number;
  }>>().default([]),

  // User interaction
  suggestionAccepted: text('suggestion_accepted'),
  userFeedback: text('user_feedback'),
  userRating: integer('user_rating'), // 1-5

  sessionStartedAt: timestamp('session_started_at').defaultNow().notNull(),
  sessionEndedAt: timestamp('session_ended_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_purpose_mode_user').on(table.userId),
  actionIdx: index('idx_purpose_mode_action').on(table.actionType),
  startedIdx: index('idx_purpose_mode_started').on(table.sessionStartedAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const iso42001AuditsRelations = relations(iso42001Audits, ({ one, many }) => ({
  leadAuditor: one(users, {
    fields: [iso42001Audits.leadAuditorId],
    references: [users.id],
  }),
  jobImpactAssessments: many(jobImpactAssessments),
  hitlRecords: many(humanInTheLoopRecords),
}));

export const jobImpactAssessmentsRelations = relations(jobImpactAssessments, ({ one }) => ({
  ethicsReviewer: one(users, {
    fields: [jobImpactAssessments.ethicsReviewerId],
    references: [users.id],
  }),
  audit: one(iso42001Audits, {
    fields: [jobImpactAssessments.auditId],
    references: [iso42001Audits.id],
  }),
}));

export const humanInTheLoopRecordsRelations = relations(humanInTheLoopRecords, ({ one }) => ({
  humanReviewer: one(users, {
    fields: [humanInTheLoopRecords.humanReviewerId],
    references: [users.id],
  }),
  audit: one(iso42001Audits, {
    fields: [humanInTheLoopRecords.auditId],
    references: [iso42001Audits.id],
  }),
}));

export const purposeModeSessionsRelations = relations(purposeModeSessions, ({ one }) => ({
  user: one(users, {
    fields: [purposeModeSessions.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Iso42001Audit = typeof iso42001Audits.$inferSelect;
export type NewIso42001Audit = typeof iso42001Audits.$inferInsert;
export type JobImpactAssessment = typeof jobImpactAssessments.$inferSelect;
export type NewJobImpactAssessment = typeof jobImpactAssessments.$inferInsert;
export type HumanInTheLoopRecord = typeof humanInTheLoopRecords.$inferSelect;
export type NewHumanInTheLoopRecord = typeof humanInTheLoopRecords.$inferInsert;
export type EthicsGuardLog = typeof ethicsGuardLogs.$inferSelect;
export type NewEthicsGuardLog = typeof ethicsGuardLogs.$inferInsert;
export type PurposeModeSession = typeof purposeModeSessions.$inferSelect;
export type NewPurposeModeSession = typeof purposeModeSessions.$inferInsert;
