import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, index } from 'drizzle-orm/pg-core';

// User table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Watchlist table
export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  game: text('game').notNull(),
  targetPrice: integer('target_price'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Portfolio table
export const portfolio = pgTable('portfolio', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  game: text('game').notNull(),
  quantity: integer('quantity').notNull().default(1),
  purchasePrice: integer('purchase_price'),
  purchaseDate: timestamp('purchase_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  email: boolean('email').default(true),
  push: boolean('push').default(true),
  priceAlerts: boolean('price_alerts').default(true),
  weeklyDigest: boolean('weekly_digest').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Push tokens (Expo/FCM/APNS)
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'expo' | 'fcm' | 'apns'
  active: boolean('active').default(true).notNull(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Push notification tickets (for receipt validation)
export const pushTickets = pgTable('push_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tokenId: uuid('token_id').references(() => pushTokens.id).notNull(),
  ticketId: text('ticket_id').notNull().unique(), // Expo ticket ID
  status: text('status').notNull().default('sent'), // 'sent' | 'delivered' | 'failed'
  retries: integer('retries').default(0).notNull(),
  nextAttemptAt: timestamp('next_attempt_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  errorDetails: jsonb('error_details'), // Store error info from Expo
  payload: jsonb('payload').notNull(), // Original notification payload
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Price history table (for Monte Carlo simulation and valuation)
export const priceHistory = pgTable('price_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: text('card_id').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  volume: integer('volume'), // Optional trading volume
  market: text('market').notNull().default('tcgplayer'), // 'tcgplayer' | 'ebay' | 'cardmarket'
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => ({
  cardDateIdx: index('price_history_card_date_idx').on(table.cardId, table.recordedAt.desc()),
  cardMarketIdx: index('price_history_card_market_idx').on(table.cardId, table.market),
}));

// =============================================================================
// RESEARCH PAPER GENERATION TABLES
// =============================================================================
// Scientific paper generation pipeline with RAG integration

/**
 * Research documents for paper generation
 * Stores ingested PDFs, text files, and other research materials
 */
export const researchDocuments = pgTable('research_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type').notNull().default('text'), // 'text' | 'pdf' | 'markdown' | 'json'
  sourceUrl: text('source_url'),
  metadata: jsonb('metadata').default({}), // Author, date, tags, etc.
  embedding: text('embedding'), // Stored as JSON string for pgvector compatibility
  chunkIndex: integer('chunk_index').default(0), // For chunked documents
  parentDocId: uuid('parent_doc_id'), // Reference to parent document if chunked
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('research_docs_user_idx').on(table.userId),
  contentTypeIdx: index('research_docs_type_idx').on(table.contentType),
}));

/**
 * Generated papers with full provenance tracking
 */
export const papers = pgTable('papers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  abstract: text('abstract'),
  content: text('content').notNull(), // Full paper content (markdown/LaTeX)
  format: text('format').notNull().default('markdown'), // 'markdown' | 'latex' | 'html'
  status: text('status').notNull().default('draft'), // 'draft' | 'review' | 'published' | 'archived'
  researchTopic: text('research_topic').notNull(),
  citationStyle: text('citation_style').notNull().default('apa'), // 'apa' | 'mla' | 'chicago' | 'ieee'
  metadata: jsonb('metadata').default({}), // Generation params, model used, etc.
  sections: jsonb('sections').default([]), // Array of section objects
  complianceReport: jsonb('compliance_report'), // EU AI Act compliance data
  ipfsCid: text('ipfs_cid'), // IPFS content ID for provenance
  traceHash: text('trace_hash'), // Provenance hash
  citationCount: integer('citation_count').default(0),
  synthesisCount: integer('synthesis_count').default(0),
  validationErrors: jsonb('validation_errors').default([]),
  isValid: boolean('is_valid').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  userIdIdx: index('papers_user_idx').on(table.userId),
  statusIdx: index('papers_status_idx').on(table.status),
  topicIdx: index('papers_topic_idx').on(table.researchTopic),
}));

/**
 * Paper citations linking papers to source documents
 */
export const paperCitations = pgTable('paper_citations', {
  id: uuid('id').defaultRandom().primaryKey(),
  paperId: uuid('paper_id').references(() => papers.id, { onDelete: 'cascade' }).notNull(),
  sourceDocId: uuid('source_doc_id').references(() => researchDocuments.id),
  externalSourceId: text('external_source_id'), // For external sources (URLs, DOIs)
  citationNumber: integer('citation_number').notNull(),
  citationText: text('citation_text').notNull(), // Formatted citation
  claimText: text('claim_text'), // The claim this citation supports
  sourceContent: text('source_content'), // Excerpt from source
  rerankScore: decimal('rerank_score', { precision: 5, scale: 4 }), // Cohere rerank score
  metadata: jsonb('metadata').default({}), // Source type, URL, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  paperIdIdx: index('citations_paper_idx').on(table.paperId),
  sourceDocIdx: index('citations_source_idx').on(table.sourceDocId),
}));

/**
 * Paper generation jobs for async processing
 */
export const paperGenerationJobs = pgTable('paper_generation_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  paperId: uuid('paper_id').references(() => papers.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  progress: integer('progress').default(0), // 0-100
  currentSection: text('current_section'), // Section being generated
  totalSections: integer('total_sections').default(6),
  completedSections: integer('completed_sections').default(0),
  errorMessage: text('error_message'),
  config: jsonb('config').notNull(), // Generation configuration
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('gen_jobs_user_idx').on(table.userId),
  statusIdx: index('gen_jobs_status_idx').on(table.status),
}));

// =============================================================================
// SECURITY & AUTHENTICATION TABLES
// =============================================================================
// Enhanced security infrastructure implementing knowledge-05-security-oauth2-jwt

/**
 * User credentials for password-based authentication
 * Stores password hashes and MFA configuration
 */
export const userCredentials = pgTable('user_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  passwordHash: text('password_hash'), // bcrypt hash
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  mfaType: text('mfa_type'), // 'totp' | 'sms' | 'email'
  mfaSecret: text('mfa_secret'), // Encrypted TOTP secret
  phone: text('phone'), // For SMS MFA
  phoneVerified: boolean('phone_verified').default(false),
  lastPasswordChange: timestamp('last_password_change'),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_credentials_user_idx').on(table.userId),
}));

/**
 * User sessions for device tracking and revocation
 * Complements Redis session cache with persistent storage
 */
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: text('session_id').notNull().unique(),
  deviceId: text('device_id').notNull(),
  deviceInfo: jsonb('device_info').notNull(), // Browser, OS, device type
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  mfaVerified: boolean('mfa_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActive: timestamp('last_active').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_sessions_user_idx').on(table.userId),
  sessionIdIdx: index('user_sessions_session_idx').on(table.sessionId),
  deviceIdIdx: index('user_sessions_device_idx').on(table.deviceId),
  activeIdx: index('user_sessions_active_idx').on(table.userId, table.isActive),
}));

/**
 * Federated identity links for OIDC/SSO
 * Enables cross-instance authentication and RC portability
 */
export const federatedIdentities = pgTable('federated_identities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // OIDC issuer URL
  subject: text('subject').notNull(), // Provider's user ID (sub claim)
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  accessToken: text('access_token'), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  tokenExpiresAt: timestamp('token_expires_at'),
  rcBalance: integer('rc_balance').default(0), // Synced RC from federation
  metadata: jsonb('metadata').default({}), // Additional claims
  lastSync: timestamp('last_sync').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('federated_identities_user_idx').on(table.userId),
  providerSubjectIdx: index('federated_identities_provider_subject_idx').on(table.provider, table.subject),
}));

/**
 * MFA backup codes for account recovery
 */
export const mfaBackupCodes = pgTable('mfa_backup_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  codeHash: text('code_hash').notNull(), // SHA-256 hash of code
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('mfa_backup_codes_user_idx').on(table.userId),
  unusedIdx: index('mfa_backup_codes_unused_idx').on(table.userId, table.usedAt),
}));

/**
 * Security audit logs for compliance and forensics
 */
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  action: text('action').notNull(), // login, logout, mfa_enabled, password_changed, etc.
  resource: text('resource'), // The resource being accessed
  resourceId: text('resource_id'),
  riskLevel: text('risk_level'), // low, medium, high, critical
  success: boolean('success').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  geoLocation: jsonb('geo_location'), // { country, city, region }
  details: jsonb('details').default({}), // Additional context
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('security_audit_user_idx').on(table.userId),
  actionIdx: index('security_audit_action_idx').on(table.action),
  occurredAtIdx: index('security_audit_occurred_idx').on(table.occurredAt.desc()),
  riskLevelIdx: index('security_audit_risk_idx').on(table.riskLevel),
}));

// =============================================================================
// EMERGENCY STUBS - Build Compatibility Layer
// =============================================================================
// These stub exports satisfy the TypeScript compiler for features under development.
// Replace with real PgTable definitions when implementing each feature.

// Vault & Job Processing
export const vaultJobs = {};

// Family & Parental Controls
export const familyLinks = {};
export const childActivityHistory = {};
export const parentalControls = {};

// Multi-Modal AI Features
export const multiModalEmbeddings = {};
export const videoGenerationRequests = {};

// Market Intelligence
export const market_knowledge = {};
export const manipulationAlerts = {};
export const cards = {};
export const sales = {};
export const prices = {};

// Financial Tracking
export const spendTracking = {};

// Alert & Notification System
export const alertSubscriptions = {};
export const pushSubscriptions = {};
export const mobilePushTokens = {};

// Portfolio & Trading
export const watchlistItems = {};
export const portfolios = {};
export const holdings = {};
export const arbitrageOpportunities = {};
export const makerTasks = {};
export const populationReports = {};

// Content & Collections
export const collections = {};
export const collection_items = {};
export const tcg_documents = {};

// Compliance
export const complianceLogs = {};

// =============================================================================
// TYPE STUBS - Build Compatibility Layer
// =============================================================================
// Placeholder types for features under development

export type ParentalControl = Record<string, unknown>;
export type SessionHistory = Record<string, unknown>;
export type WatchlistItem = Record<string, unknown>;
export type Portfolio = Record<string, unknown>;
export type ManipulationAlert = Record<string, unknown>;
export type User = Record<string, unknown>;
export type PushSubscription = Record<string, unknown>;
export type NewSpendTracking = Record<string, unknown>;

