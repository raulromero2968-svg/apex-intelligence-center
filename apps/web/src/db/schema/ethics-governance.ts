/**
 * Ethics & Governance Database Schema
 *
 * Implements job protection and ethical AI governance.
 * Addresses AI displacement concerns with human-in-loop safeguards.
 *
 * Features:
 * - Automation impact assessment tracking
 * - Human override requirements
 * - Reskilling recommendations
 * - Ethics audit trail
 * - Job displacement risk scoring
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

export const impactLevelEnum = pgEnum('impact_level', [
  'minimal',    // No job displacement risk
  'low',        // Augments existing roles
  'medium',     // May reduce headcount
  'high',       // Likely replaces roles
  'critical',   // Replaces entire teams/functions
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'requires_review',
  'escalated',
]);

export const automationTypeEnum = pgEnum('automation_type', [
  'task_assist',      // Helps with specific tasks
  'role_augment',     // Enhances role capabilities
  'process_automate', // Automates workflows
  'function_replace', // Replaces job functions
  'team_replace',     // Replaces entire teams
]);

export const mitigationTypeEnum = pgEnum('mitigation_type', [
  'reskilling',
  'role_transition',
  'hybrid_workflow',
  'gradual_rollout',
  'human_oversight',
  'job_creation',
]);

// ============================================================================
// AUTOMATION ASSESSMENTS TABLE
// ============================================================================

export const automationAssessments = pgTable(
  'ethics_automation_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Assessment info
    name: text('name').notNull(),
    description: text('description'),
    automationType: automationTypeEnum('automation_type').notNull(),

    // Impact analysis
    impactLevel: impactLevelEnum('impact_level').notNull(),
    impactScore: integer('impact_score').notNull(), // 0-100
    affectedRoles: text('affected_roles').array(),
    estimatedJobsAffected: integer('estimated_jobs_affected'),

    // Business context
    department: text('department'),
    currentHeadcount: integer('current_headcount'),
    projectedHeadcount: integer('projected_headcount'),
    efficiencyGain: real('efficiency_gain'), // Percentage improvement

    // Risk factors
    riskFactors: jsonb('risk_factors').$type<{
      skillObsolescence: number; // 0-1
      roleRedundancy: number;
      taskAutomation: number;
      decisionAutonomy: number;
      humanInteraction: number;
    }>(),

    // Status
    status: approvalStatusEnum('status').default('pending').notNull(),
    requiresHumanApproval: boolean('requires_human_approval').default(true),

    // Review
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),

    // Timestamps
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('ethics_assessments_project_idx').on(table.projectId),
    impactIdx: index('ethics_assessments_impact_idx').on(table.impactLevel),
    statusIdx: index('ethics_assessments_status_idx').on(table.status),
  })
);

// ============================================================================
// MITIGATION PLANS TABLE
// ============================================================================

export const mitigationPlans = pgTable(
  'ethics_mitigation_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assessmentId: uuid('assessment_id')
      .references(() => automationAssessments.id, { onDelete: 'cascade' })
      .notNull(),

    // Plan info
    mitigationType: mitigationTypeEnum('mitigation_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),

    // Details
    targetRoles: text('target_roles').array(),
    timeline: text('timeline'),
    estimatedCost: real('estimated_cost'),

    // Reskilling specifics
    skillsToAcquire: text('skills_to_acquire').array(),
    trainingResources: jsonb('training_resources').$type<Array<{
      title: string;
      url?: string;
      type: 'course' | 'certification' | 'workshop' | 'mentorship';
      duration?: string;
    }>>(),

    // Role transition specifics
    newRoleOpportunities: jsonb('new_role_opportunities').$type<Array<{
      title: string;
      description: string;
      requiredSkills: string[];
      aiCollaboration: string; // How the role works with AI
    }>>(),

    // Status
    isImplemented: boolean('is_implemented').default(false),
    implementedAt: timestamp('implemented_at'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    assessmentIdx: index('mitigation_plans_assessment_idx').on(table.assessmentId),
    typeIdx: index('mitigation_plans_type_idx').on(table.mitigationType),
  })
);

// ============================================================================
// HUMAN OVERRIDES TABLE
// ============================================================================

export const humanOverrides = pgTable(
  'ethics_human_overrides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Override context
    actionType: text('action_type').notNull(),
    actionDescription: text('action_description'),
    agentId: text('agent_id'),
    automationId: uuid('automation_id'),

    // Impact
    impactLevel: impactLevelEnum('impact_level').notNull(),
    impactReason: text('impact_reason'),

    // Override decision
    overrideType: text('override_type').notNull(), // 'block', 'approve', 'modify', 'escalate'
    decision: text('decision').notNull(),
    rationale: text('rationale'),

    // Who made the decision
    decidedBy: uuid('decided_by').notNull(),
    decidedAt: timestamp('decided_at').defaultNow().notNull(),

    // Original request
    originalRequest: jsonb('original_request'),
    modifiedRequest: jsonb('modified_request'),

    // Outcome
    wasExecuted: boolean('was_executed').default(false),
    executionResult: text('execution_result'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('human_overrides_project_idx').on(table.projectId),
    impactIdx: index('human_overrides_impact_idx').on(table.impactLevel),
    decidedByIdx: index('human_overrides_decided_by_idx').on(table.decidedBy),
    timeIdx: index('human_overrides_time_idx').on(table.decidedAt),
  })
);

// ============================================================================
// ETHICS AUDIT LOG TABLE
// ============================================================================

export const ethicsAuditLog = pgTable(
  'ethics_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Event info
    eventType: text('event_type').notNull(),
    eventCategory: text('event_category'), // 'automation', 'override', 'assessment', 'mitigation'

    // Context
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    userId: uuid('user_id'),
    agentId: text('agent_id'),

    // Impact
    impactLevel: impactLevelEnum('impact_level'),
    jobsAffected: integer('jobs_affected'),

    // Details
    description: text('description'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Compliance
    complianceFlags: text('compliance_flags').array(),
    requiresReview: boolean('requires_review').default(false),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),

    // Timestamp
    occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('ethics_audit_project_idx').on(table.projectId),
    eventTypeIdx: index('ethics_audit_event_type_idx').on(table.eventType),
    impactIdx: index('ethics_audit_impact_idx').on(table.impactLevel),
    timeIdx: index('ethics_audit_time_idx').on(table.occurredAt),
  })
);

// ============================================================================
// RESKILLING PROGRAMS TABLE
// ============================================================================

export const reskillingPrograms = pgTable(
  'ethics_reskilling_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull(),

    // Program info
    name: text('name').notNull(),
    description: text('description'),
    targetAudience: text('target_audience'),

    // Skills
    skillsOffered: text('skills_offered').array(),
    aiSkills: text('ai_skills').array(), // AI-specific skills
    humanSkills: text('human_skills').array(), // Creativity, empathy, etc.

    // Structure
    modules: jsonb('modules').$type<Array<{
      title: string;
      description: string;
      duration: string;
      type: 'video' | 'hands-on' | 'assessment' | 'mentorship';
      aiTools?: string[];
    }>>(),

    // Delivery
    format: text('format'), // 'online', 'in-person', 'hybrid'
    duration: text('duration'),
    cost: real('cost'),

    // Outcomes
    certificationOffered: boolean('certification_offered').default(false),
    jobPlacementRate: real('job_placement_rate'),

    // Status
    isActive: boolean('is_active').default(true),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('reskilling_programs_project_idx').on(table.projectId),
    activeIdx: index('reskilling_programs_active_idx').on(table.isActive),
  })
);

// ============================================================================
// ETHICS KNOWLEDGE (RAG)
// ============================================================================

export const ethicsKnowledge = pgTable(
  'ethics_knowledge',
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
    embedding: text('embedding'),

    // Source/framework
    framework: text('framework'), // e.g., 'IEEE Ethically Aligned Design', 'EU AI Act'
    jurisdiction: text('jurisdiction'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('ethics_knowledge_project_idx').on(table.projectId),
    categoryIdx: index('ethics_knowledge_category_idx').on(table.category),
    frameworkIdx: index('ethics_knowledge_framework_idx').on(table.framework),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const automationAssessmentsRelations = relations(automationAssessments, ({ many }) => ({
  mitigationPlans: many(mitigationPlans),
}));

export const mitigationPlansRelations = relations(mitigationPlans, ({ one }) => ({
  assessment: one(automationAssessments, {
    fields: [mitigationPlans.assessmentId],
    references: [automationAssessments.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AutomationAssessment = typeof automationAssessments.$inferSelect;
export type NewAutomationAssessment = typeof automationAssessments.$inferInsert;
export type MitigationPlan = typeof mitigationPlans.$inferSelect;
export type NewMitigationPlan = typeof mitigationPlans.$inferInsert;
export type HumanOverride = typeof humanOverrides.$inferSelect;
export type NewHumanOverride = typeof humanOverrides.$inferInsert;
export type EthicsAuditLog = typeof ethicsAuditLog.$inferSelect;
export type ReskillingProgram = typeof reskillingPrograms.$inferSelect;
export type EthicsKnowledge = typeof ethicsKnowledge.$inferSelect;
