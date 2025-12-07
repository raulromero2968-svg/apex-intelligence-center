/**
 * Security & Compliance Database Schema
 *
 * Drizzle ORM schema definitions for security-related tables
 * as recommended by the Security Audit Report (Sections 1-3)
 *
 * Tables:
 * - userSessions: Session management with device tracking
 * - mfaAttempts: MFA verification attempts for rate limiting
 * - userEncryptedData: Field-level encrypted PII storage
 * - encryptionKeys: Key management for data encryption
 * - gdprRequests: GDPR data subject requests
 * - dataRetentionLog: Data retention audit trail
 * - userConsents: Consent tracking for compliance
 * - securityEvents: Security event logging
 * - e2eMessages: E2E encrypted messages
 *
 * @module packages/db/src/schema/security
 * @see Security Audit Report - Database Schema
 */

import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  integer,
  inet,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// ENUMS
// =============================================================================

export const mfaAttemptTypeEnum = pgEnum('mfa_attempt_type', [
  'totp',
  'sms',
  'backup',
  'hardware',
]);

export const gdprRequestTypeEnum = pgEnum('gdpr_request_type', [
  'deletion',
  'export',
  'access',
  'rectification',
  'restriction',
]);

export const gdprRequestStatusEnum = pgEnum('gdpr_request_status', [
  'pending',
  'processing',
  'completed',
  'rejected',
  'expired',
]);

export const dataRetentionActionEnum = pgEnum('data_retention_action', [
  'retain',
  'anonymize',
  'delete',
  'export',
]);

export const securityEventSeverityEnum = pgEnum('security_event_severity', [
  'info',
  'warning',
  'critical',
  'emergency',
]);

export const encryptionKeyTypeEnum = pgEnum('encryption_key_type', [
  'master',
  'data',
  'user',
]);

// =============================================================================
// USER SESSIONS TABLE
// =============================================================================

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionToken: text('session_token').notNull().unique(),
    deviceId: text('device_id').notNull(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    deviceInfo: jsonb('device_info').default({}),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    mfaVerified: boolean('mfa_verified').default(false),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    revokeReason: text('revoke_reason'),
  },
  (table) => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    tokenIdx: index('user_sessions_token_idx').on(table.sessionToken),
    deviceIdx: index('user_sessions_device_idx').on(table.userId, table.deviceId),
    activeIdx: index('user_sessions_active_idx').on(table.userId, table.isActive),
    expiresIdx: index('user_sessions_expires_idx').on(table.expiresAt),
  })
);

export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  mfaAttempts: many(mfaAttempts),
  securityEvents: many(securityEvents),
}));

// =============================================================================
// MFA ATTEMPTS TABLE
// =============================================================================

export const mfaAttempts = pgTable(
  'mfa_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => userSessions.id, {
      onDelete: 'set null',
    }),
    attemptType: mfaAttemptTypeEnum('attempt_type').notNull(),
    success: boolean('success').notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('mfa_attempts_user_idx').on(table.userId, table.createdAt),
    recentIdx: index('mfa_attempts_recent_idx').on(table.userId, table.createdAt),
  })
);

export const mfaAttemptsRelations = relations(mfaAttempts, ({ one }) => ({
  user: one(users, {
    fields: [mfaAttempts.userId],
    references: [users.id],
  }),
  session: one(userSessions, {
    fields: [mfaAttempts.sessionId],
    references: [userSessions.id],
  }),
}));

// =============================================================================
// USER ENCRYPTED DATA TABLE
// =============================================================================

export const userEncryptedData = pgTable(
  'user_encrypted_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fieldName: text('field_name').notNull(),
    encryptedValue: text('encrypted_value').notNull(),
    searchHash: text('search_hash'),
    encryptionKeyId: text('encryption_key_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('encrypted_data_user_idx').on(table.userId),
    searchIdx: index('encrypted_data_search_idx').on(table.fieldName, table.searchHash),
    uniqueField: index('encrypted_data_unique_idx').on(table.userId, table.fieldName),
  })
);

export const userEncryptedDataRelations = relations(userEncryptedData, ({ one }) => ({
  user: one(users, {
    fields: [userEncryptedData.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// ENCRYPTION KEYS TABLE
// =============================================================================

export const encryptionKeys = pgTable(
  'encryption_keys',
  {
    id: text('id').primaryKey(),
    keyType: encryptionKeyTypeEnum('key_type').notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    purpose: text('purpose').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    rotatedAt: timestamp('rotated_at'),
    expiresAt: timestamp('expires_at'),
    retiredAt: timestamp('retired_at'),
  },
  (table) => ({
    activeIdx: index('encryption_keys_active_idx').on(table.keyType, table.isActive),
  })
);

// =============================================================================
// GDPR REQUESTS TABLE
// =============================================================================

export const gdprRequests = pgTable(
  'gdpr_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestType: gdprRequestTypeEnum('request_type').notNull(),
    status: gdprRequestStatusEnum('status').notNull().default('pending'),
    requestData: jsonb('request_data').default({}),
    responseData: jsonb('response_data'),
    ipAddress: inet('ip_address'),
    verificationToken: text('verification_token'),
    verifiedAt: timestamp('verified_at'),
    processedBy: uuid('processed_by').references(() => users.id),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    userIdx: index('gdpr_requests_user_idx').on(table.userId, table.createdAt),
    statusIdx: index('gdpr_requests_status_idx').on(table.status),
  })
);

export const gdprRequestsRelations = relations(gdprRequests, ({ one }) => ({
  user: one(users, {
    fields: [gdprRequests.userId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [gdprRequests.processedBy],
    references: [users.id],
  }),
}));

// =============================================================================
// DATA RETENTION LOG TABLE
// =============================================================================

export const dataRetentionLog = pgTable(
  'data_retention_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    dataType: text('data_type').notNull(),
    action: dataRetentionActionEnum('action').notNull(),
    retentionPolicy: text('retention_policy'),
    dataSummary: jsonb('data_summary'),
    performedBy: text('performed_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('retention_log_user_idx').on(table.userId, table.createdAt),
    typeIdx: index('retention_log_type_idx').on(table.dataType, table.createdAt),
  })
);

export const dataRetentionLogRelations = relations(dataRetentionLog, ({ one }) => ({
  user: one(users, {
    fields: [dataRetentionLog.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// USER CONSENTS TABLE
// =============================================================================

export const userConsents = pgTable(
  'user_consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consentType: text('consent_type').notNull(),
    version: text('version').notNull(),
    granted: boolean('granted').notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    withdrawnAt: timestamp('withdrawn_at'),
  },
  (table) => ({
    userIdx: index('consents_user_idx').on(table.userId, table.consentType),
    activeIdx: index('consents_active_idx').on(
      table.userId,
      table.consentType,
      table.granted
    ),
  })
);

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
  user: one(users, {
    fields: [userConsents.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// SECURITY EVENTS TABLE
// =============================================================================

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: uuid('session_id').references(() => userSessions.id, {
      onDelete: 'set null',
    }),
    eventType: text('event_type').notNull(),
    severity: securityEventSeverityEnum('severity').notNull(),
    eventData: jsonb('event_data').default({}),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    countryCode: text('country_code'),
    isSuspicious: boolean('is_suspicious').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('security_events_user_idx').on(table.userId, table.createdAt),
    typeIdx: index('security_events_type_idx').on(table.eventType, table.createdAt),
    suspiciousIdx: index('security_events_suspicious_idx').on(
      table.isSuspicious,
      table.createdAt
    ),
    severityIdx: index('security_events_severity_idx').on(table.severity, table.createdAt),
  })
);

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
  session: one(userSessions, {
    fields: [securityEvents.sessionId],
    references: [userSessions.id],
  }),
}));

// =============================================================================
// E2E MESSAGES TABLE
// =============================================================================

export const e2eMessages = pgTable(
  'e2e_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderPublicKey: text('sender_public_key').notNull(),
    encryptedContent: text('encrypted_content').notNull(),
    nonce: text('nonce').notNull(),
    tag: text('tag').notNull(),
    delivered: boolean('delivered').default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    recipientIdx: index('e2e_messages_recipient_idx').on(
      table.recipientId,
      table.delivered,
      table.createdAt
    ),
    senderIdx: index('e2e_messages_sender_idx').on(table.senderId, table.createdAt),
    expiresIdx: index('e2e_messages_expires_idx').on(table.expiresAt),
  })
);

export const e2eMessagesRelations = relations(e2eMessages, ({ one }) => ({
  sender: one(users, {
    fields: [e2eMessages.senderId],
    references: [users.id],
    relationName: 'sentMessages',
  }),
  recipient: one(users, {
    fields: [e2eMessages.recipientId],
    references: [users.id],
    relationName: 'receivedMessages',
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type MfaAttempt = typeof mfaAttempts.$inferSelect;
export type NewMfaAttempt = typeof mfaAttempts.$inferInsert;

export type UserEncryptedData = typeof userEncryptedData.$inferSelect;
export type NewUserEncryptedData = typeof userEncryptedData.$inferInsert;

export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type NewEncryptionKey = typeof encryptionKeys.$inferInsert;

export type GdprRequest = typeof gdprRequests.$inferSelect;
export type NewGdprRequest = typeof gdprRequests.$inferInsert;

export type DataRetentionLogEntry = typeof dataRetentionLog.$inferSelect;
export type NewDataRetentionLogEntry = typeof dataRetentionLog.$inferInsert;

export type UserConsent = typeof userConsents.$inferSelect;
export type NewUserConsent = typeof userConsents.$inferInsert;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;

export type E2eMessage = typeof e2eMessages.$inferSelect;
export type NewE2eMessage = typeof e2eMessages.$inferInsert;

export type MfaAttemptType = 'totp' | 'sms' | 'backup' | 'hardware';
export type GdprRequestType = 'deletion' | 'export' | 'access' | 'rectification' | 'restriction';
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'expired';
export type DataRetentionAction = 'retain' | 'anonymize' | 'delete' | 'export';
export type SecurityEventSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type EncryptionKeyType = 'master' | 'data' | 'user';
