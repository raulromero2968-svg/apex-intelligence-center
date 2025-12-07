import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

/**
 * Audit Log Action Types
 * Categorizes admin actions for ethical transparency and DAO oversight
 */
export const auditActionTypeEnum = pgEnum('audit_action_type', [
  // User Management
  'ban_user',
  'unban_user',
  'suspend_user',
  'warn_user',
  'verify_user',
  // Financial/RC Actions
  'adjust_rc',
  'freeze_rc',
  'unfreeze_rc',
  'grant_premium',
  'revoke_premium',
  // Content Moderation
  'remove_resource',
  'restore_resource',
  'flag_content',
  'approve_content',
  // System Operations
  'config_change',
  'emergency_shutdown',
  'rate_limit_override',
  'api_key_rotate',
  // Multi-sig Required
  'multisig_proposal',
  'multisig_approval',
  'multisig_rejection',
  'multisig_execution',
  // Database Operations
  'data_export',
  'data_deletion',
  'backup_restore',
  'schema_migration',
]);

/**
 * Audit Severity Levels
 * Determines visibility and escalation requirements
 */
export const auditSeverityEnum = pgEnum('audit_severity', [
  'info',      // Routine actions (view logs)
  'warning',   // Notable actions (user warnings)
  'critical',  // Sensitive actions (bans, RC adjustments)
  'emergency', // System-critical (shutdowns, multi-sig)
]);

/**
 * Admin Audit Logs Table
 * Transparent logging of all admin actions for ethical oversight
 * Per Ethical Safeguards Framework: All admin actions are logged and publicly viewable
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Who performed the action
  adminId: uuid('admin_id').notNull().references(() => users.id),

  // What action was taken
  action: auditActionTypeEnum('action').notNull(),
  severity: auditSeverityEnum('severity').notNull().default('info'),

  // Target of the action (user, resource, etc.)
  targetId: uuid('target_id'),
  targetType: text('target_type'), // 'user' | 'resource' | 'proposal' | 'system'

  // Required justification for transparency
  reason: text('reason').notNull(),

  // Additional context and metadata
  metadata: jsonb('metadata').$type<{
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    relatedLogIds?: string[];
    multiSigTxHash?: string;
    rollbackOf?: string;
  }>(),

  // Multi-signature tracking for critical actions
  requiresMultiSig: boolean('requires_multi_sig').default(false),
  multiSigSignatures: jsonb('multi_sig_signatures').$type<{
    required: number;
    collected: Array<{
      signerId: string;
      signature: string;
      timestamp: string;
    }>;
  }>(),
  multiSigComplete: boolean('multi_sig_complete').default(false),

  // Immutability: once written, can only be appended to via rollback actions
  isRolledBack: boolean('is_rolled_back').default(false),
  rollbackReason: text('rollback_reason'),
  rollbackById: uuid('rollback_by_id').references(() => users.id),
  rollbackAt: timestamp('rollback_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // IPFS CID for decentralized proof (optional, for DAO governance)
  ipfsCid: text('ipfs_cid'),
}, (table) => ({
  adminIdIdx: index('audit_logs_admin_idx').on(table.adminId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  severityIdx: index('audit_logs_severity_idx').on(table.severity),
  targetIdx: index('audit_logs_target_idx').on(table.targetId, table.targetType),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt.desc()),
  multiSigIdx: index('audit_logs_multisig_idx').on(table.requiresMultiSig, table.multiSigComplete),
}));

/**
 * Relations for audit logs
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
  rollbackBy: one(users, {
    fields: [auditLogs.rollbackById],
    references: [users.id],
  }),
}));

/**
 * TypeScript types for audit logs
 */
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AuditActionType = typeof auditActionTypeEnum.enumValues[number];
export type AuditSeverity = typeof auditSeverityEnum.enumValues[number];

/**
 * Actions that require multi-signature approval
 * Critical operations that need multiple admin confirmations
 */
export const MULTISIG_REQUIRED_ACTIONS: AuditActionType[] = [
  'emergency_shutdown',
  'data_deletion',
  'backup_restore',
  'schema_migration',
  'multisig_execution',
];

/**
 * Minimum signatures required per action severity
 */
export const MULTISIG_THRESHOLDS: Record<AuditSeverity, number> = {
  info: 1,
  warning: 1,
  critical: 2,
  emergency: 3,
};
