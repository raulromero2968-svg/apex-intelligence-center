/**
 * Security & Authentication Database Schema
 *
 * Implements knowledge-05-security-oauth2-jwt for defense compliance.
 * Enhanced security with MFA, token rotation, and audit logging.
 *
 * Features:
 * - OAuth 2.0 / JWT token management
 * - Multi-factor authentication (MFA)
 * - Session management with device tracking
 * - Security audit logging
 * - API key management
 * - Role-based access control (RBAC)
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const mfaMethodEnum = pgEnum('mfa_method', [
  'totp',       // Time-based OTP (authenticator apps)
  'sms',        // SMS codes
  'email',      // Email codes
  'webauthn',   // Hardware keys / biometrics
  'backup',     // Backup codes
]);

export const tokenTypeEnum = pgEnum('token_type', [
  'access',
  'refresh',
  'api_key',
  'verification',
  'password_reset',
  'mfa_setup',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'active',
  'expired',
  'revoked',
  'suspicious',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'login',
  'logout',
  'login_failed',
  'mfa_enabled',
  'mfa_disabled',
  'mfa_verified',
  'mfa_failed',
  'password_changed',
  'password_reset',
  'token_rotated',
  'token_revoked',
  'api_key_created',
  'api_key_revoked',
  'permission_changed',
  'suspicious_activity',
  'defense_access',
  'sensitive_action',
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const permissionScopeEnum = pgEnum('permission_scope', [
  'read',
  'write',
  'delete',
  'admin',
  'defense',      // Defense module access
  'analytics',    // Analytics access
  'experiments',  // A/B testing
  'api',          // API access
]);

// ============================================================================
// USERS SECURITY TABLE (Extension)
// ============================================================================

export const usersSecurity = pgTable(
  'users_security',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique(),

    // Password
    passwordHash: text('password_hash'),
    passwordChangedAt: timestamp('password_changed_at'),
    passwordExpiresAt: timestamp('password_expires_at'),
    requirePasswordChange: boolean('require_password_change').default(false),

    // MFA
    mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
    mfaPrimaryMethod: mfaMethodEnum('mfa_primary_method'),
    mfaBackupCodes: text('mfa_backup_codes').array(), // Hashed
    mfaBackupCodesUsed: integer('mfa_backup_codes_used').default(0),

    // TOTP
    totpSecret: text('totp_secret'), // Encrypted
    totpVerifiedAt: timestamp('totp_verified_at'),

    // WebAuthn
    webauthnCredentials: jsonb('webauthn_credentials').$type<
      Array<{
        id: string;
        publicKey: string;
        counter: number;
        deviceType: string;
        createdAt: string;
      }>
    >(),

    // Security settings
    loginAttempts: integer('login_attempts').default(0),
    lockedUntil: timestamp('locked_until'),
    lastLoginAt: timestamp('last_login_at'),
    lastLoginIp: text('last_login_ip'),
    lastLoginDevice: text('last_login_device'),

    // Risk assessment
    riskScore: integer('risk_score').default(0),
    riskLevel: riskLevelEnum('risk_level').default('low'),
    trustedDevices: text('trusted_devices').array(),

    // Defense-specific
    defenseCleared: boolean('defense_cleared').default(false),
    defenseClearanceLevel: text('defense_clearance_level'),
    defenseClearanceExpires: timestamp('defense_clearance_expires'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('users_security_user_idx').on(table.userId),
    mfaIdx: index('users_security_mfa_idx').on(table.mfaEnabled),
    defenseIdx: index('users_security_defense_idx').on(table.defenseCleared),
  })
);

// ============================================================================
// SESSIONS TABLE
// ============================================================================

export const sessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),

    // Session tokens
    sessionToken: text('session_token').notNull().unique(),
    refreshToken: text('refresh_token'),
    refreshTokenHash: text('refresh_token_hash'),

    // Status
    status: sessionStatusEnum('status').default('active').notNull(),
    mfaVerified: boolean('mfa_verified').default(false),

    // Device info
    deviceId: text('device_id'),
    deviceType: text('device_type'),
    deviceName: text('device_name'),
    browser: text('browser'),
    os: text('os'),
    userAgent: text('user_agent'),

    // Location
    ipAddress: text('ip_address'),
    country: text('country'),
    region: text('region'),
    city: text('city'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),

    // Rotation tracking
    rotationCount: integer('rotation_count').default(0),
    lastRotatedAt: timestamp('last_rotated_at'),
  },
  (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
    tokenIdx: uniqueIndex('sessions_token_idx').on(table.sessionToken),
    statusIdx: index('sessions_status_idx').on(table.status),
    expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
  })
);

// ============================================================================
// TOKENS TABLE
// ============================================================================

export const tokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),

    // Token info
    tokenType: tokenTypeEnum('token_type').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    tokenPrefix: text('token_prefix'), // First few chars for identification

    // Scopes
    scopes: permissionScopeEnum('scopes').array(),

    // Validity
    issuedAt: timestamp('issued_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    isRevoked: boolean('is_revoked').default(false),

    // Usage
    usageCount: integer('usage_count').default(0),
    lastUsedAt: timestamp('last_used_at'),
    lastUsedIp: text('last_used_ip'),

    // Metadata
    metadata: jsonb('metadata').$type<{
      purpose?: string;
      createdBy?: string;
      revokedBy?: string;
      revokeReason?: string;
    }>(),
  },
  (table) => ({
    userIdx: index('tokens_user_idx').on(table.userId),
    typeIdx: index('tokens_type_idx').on(table.tokenType),
    hashIdx: uniqueIndex('tokens_hash_idx').on(table.tokenHash),
    expiresIdx: index('tokens_expires_idx').on(table.expiresAt),
  })
);

// ============================================================================
// API KEYS TABLE
// ============================================================================

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    projectId: uuid('project_id'),

    // Key info
    name: text('name').notNull(),
    description: text('description'),
    keyPrefix: text('key_prefix').notNull(), // e.g., "apex_live_"
    keyHash: text('key_hash').notNull().unique(),

    // Permissions
    scopes: permissionScopeEnum('scopes').array().notNull(),

    // Rate limiting
    rateLimit: integer('rate_limit').default(1000), // Requests per hour
    rateLimitWindow: integer('rate_limit_window').default(3600), // Seconds

    // IP restrictions
    allowedIps: text('allowed_ips').array(),
    allowedOrigins: text('allowed_origins').array(),

    // Validity
    isActive: boolean('is_active').default(true).notNull(),
    expiresAt: timestamp('expires_at'),
    revokedAt: timestamp('revoked_at'),

    // Usage
    usageCount: integer('usage_count').default(0),
    lastUsedAt: timestamp('last_used_at'),
    lastUsedIp: text('last_used_ip'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('api_keys_user_idx').on(table.userId),
    projectIdx: index('api_keys_project_idx').on(table.projectId),
    hashIdx: uniqueIndex('api_keys_hash_idx').on(table.keyHash),
    activeIdx: index('api_keys_active_idx').on(table.isActive),
  })
);

// ============================================================================
// ROLES TABLE
// ============================================================================

export const roles = pgTable(
  'auth_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id'),

    // Role info
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false), // Built-in roles

    // Permissions
    permissions: jsonb('permissions').$type<{
      resources: Record<
        string,
        {
          actions: string[];
          conditions?: Record<string, unknown>;
        }
      >;
    }>().notNull(),

    // Hierarchy
    parentRoleId: uuid('parent_role_id').references(() => roles.id),
    priority: integer('priority').default(0),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('roles_project_idx').on(table.projectId),
    nameIdx: uniqueIndex('roles_name_project_idx').on(table.name, table.projectId),
  })
);

// ============================================================================
// USER ROLES TABLE
// ============================================================================

export const userRoles = pgTable(
  'auth_user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id'),

    // Assignment
    assignedBy: uuid('assigned_by'),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),

    // Metadata
    reason: text('reason'),
  },
  (table) => ({
    userRoleIdx: uniqueIndex('user_roles_user_role_idx').on(
      table.userId,
      table.roleId,
      table.projectId
    ),
    userIdx: index('user_roles_user_idx').on(table.userId),
    roleIdx: index('user_roles_role_idx').on(table.roleId),
  })
);

// ============================================================================
// AUDIT LOG TABLE
// ============================================================================

export const securityAuditLog = pgTable(
  'security_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id'),
    sessionId: uuid('session_id'),
    projectId: uuid('project_id'),

    // Action
    action: auditActionEnum('action').notNull(),
    resource: text('resource'),
    resourceId: text('resource_id'),

    // Context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    country: text('country'),

    // Details
    details: jsonb('details').$type<Record<string, unknown>>(),
    previousValue: jsonb('previous_value'),
    newValue: jsonb('new_value'),

    // Risk assessment
    riskLevel: riskLevelEnum('risk_level').default('low'),
    isSuspicious: boolean('is_suspicious').default(false),
    flaggedReason: text('flagged_reason'),

    // Status
    success: boolean('success').default(true),
    errorMessage: text('error_message'),

    // Timestamp
    occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('audit_log_user_idx').on(table.userId),
    actionIdx: index('audit_log_action_idx').on(table.action),
    timeIdx: index('audit_log_time_idx').on(table.occurredAt),
    suspiciousIdx: index('audit_log_suspicious_idx').on(table.isSuspicious),
    resourceIdx: index('audit_log_resource_idx').on(table.resource, table.resourceId),
  })
);

// ============================================================================
// SECURITY KNOWLEDGE (RAG)
// ============================================================================

export const securityKnowledge = pgTable(
  'security_knowledge',
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

    // Compliance references
    complianceFramework: text('compliance_framework'), // e.g., 'SOC2', 'HIPAA', 'DoD'
    controlIds: text('control_ids').array(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('security_knowledge_project_idx').on(table.projectId),
    categoryIdx: index('security_knowledge_category_idx').on(table.category),
    complianceIdx: index('security_knowledge_compliance_idx').on(table.complianceFramework),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const sessionsRelations = relations(sessions, ({ many }) => ({
  tokens: many(tokens),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
  session: one(sessions, {
    fields: [tokens.sessionId],
    references: [sessions.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  parentRole: one(roles, {
    fields: [roles.parentRoleId],
    references: [roles.id],
  }),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UserSecurity = typeof usersSecurity.$inferSelect;
export type NewUserSecurity = typeof usersSecurity.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type NewSecurityAuditLog = typeof securityAuditLog.$inferInsert;
export type SecurityKnowledge = typeof securityKnowledge.$inferSelect;
