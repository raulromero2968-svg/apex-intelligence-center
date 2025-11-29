import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Power Network Schema for Apex Intelligence Center
 *
 * Graph-Relational schema to map power structures and relationships.
 * Implements the "7 Domains of Power" framework with full provenance tracking.
 *
 * Key concepts:
 * - Entities: Nodes representing actors (Person, Institution, Asset)
 * - Relationships: Edges connecting entities with domain classification
 * - Confidence: Evidence quality tier for distinguishing truth from rumor
 * - Provenance: Source citations for all claims
 *
 * Trade-offs:
 * - GOOD: Enables precise querying by domain and confidence level
 * - BAD: Adds complexity; mitigate with clear UI filters
 * - ETHICAL: Required for "Bloomberg Terminal for Truth" - not a rumor mill
 *
 * @see "Seven Mountains of Influence" framework for domain classification
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * The 7 Domains of Power (Seven Mountains Framework)
 * Represents the spheres of societal influence
 */
export const domainTypeEnum = pgEnum('domain_type', [
  'RELIGION',    // Spiritual/moral authority
  'FAMILY',      // Bloodlines, marriages, dynasties
  'EDUCATION',   // Schools, universities, think tanks
  'GOVERNMENT',  // Political offices, agencies, military
  'MEDIA',       // News, entertainment, social platforms
  'ARTS',        // Culture, entertainment, sports
  'BUSINESS',    // Corporations, finance, trade
]);

/**
 * Evidence Confidence Levels (The "Truth Tier")
 * Critical for distinguishing between rumor and fact
 */
export const confidenceLevelEnum = pgEnum('confidence_level', [
  'SPECULATIVE',    // Rumor, uncorroborated claim, anonymous allegation
  'CIRCUMSTANTIAL', // Flight logs, social photos, co-location evidence
  'DOCUMENTED',     // Legal filings, settlements, corporate records, emails
  'ADJUDICATED',    // Criminal conviction, court ruling, official finding
]);

/**
 * Entity Type Classification
 * Distinguishes between different node types in the network
 */
export const entityTypeEnum = pgEnum('entity_type', [
  'PERSON',       // Individual human actor
  'INSTITUTION',  // Organization, corporation, agency
  'ASSET',        // Property, vehicle, vessel, aircraft
  'EVENT',        // Conference, meeting, gathering
  'DOCUMENT',     // Contract, agreement, court filing
]);

/**
 * Scandal Tier Classification
 * Allows immediate filtering by severity of allegations
 */
export const scandalTierEnum = pgEnum('scandal_tier', [
  'NONE',         // No known allegations
  'MINOR',        // Minor infractions, civil matters
  'MODERATE',     // Serious allegations, ongoing investigations
  'SEVERE',       // Criminal charges, major scandals
  'CRITICAL',     // Convictions for serious crimes
]);

/**
 * Relationship Status
 * Tracks whether a connection is current or historical
 */
export const relationshipStatusEnum = pgEnum('relationship_status', [
  'ACTIVE',       // Currently active relationship
  'INACTIVE',     // Relationship has ended
  'UNKNOWN',      // Status cannot be determined
]);

// =============================================================================
// TABLES
// =============================================================================

/**
 * Entities table - The Nodes
 * Stores actors in the power network: people, institutions, assets
 */
export const entities = pgTable(
  'power_entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Display name of the entity */
    name: text('name').notNull(),

    /** Classification of entity */
    type: entityTypeEnum('type').notNull(),

    /** Severity classification for filtering */
    scandalTier: scandalTierEnum('scandal_tier').notNull().default('NONE'),

    /** Alternative names, aliases, or former names */
    aliases: jsonb('aliases').notNull().default([]),

    /** Brief description or biography */
    description: text('description'),

    /** External identifiers (Wikipedia, Wikidata, LinkedIn, etc.) */
    externalIds: jsonb('external_ids').notNull().default({}),

    /** Profile image URL */
    imageUrl: text('image_url'),

    /** Structured metadata (birth date, founded date, etc.) */
    metadata: jsonb('metadata').notNull().default({}),

    /** Tags for categorization and search */
    tags: jsonb('tags').notNull().default([]),

    // Temporal tracking
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),

    /** User who created this entity (for audit) */
    createdBy: uuid('created_by'),
  },
  (table) => ({
    nameIdx: index('power_entities_name_idx').on(table.name),
    typeIdx: index('power_entities_type_idx').on(table.type),
    scandalTierIdx: index('power_entities_scandal_tier_idx').on(table.scandalTier),
    createdAtIdx: index('power_entities_created_at_idx').on(table.createdAt),
  })
);

/**
 * Relationships table - The Edges
 * Stores connections between entities with full provenance tracking
 */
export const relationships = pgTable(
  'power_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Source entity (edge origin) */
    sourceId: uuid('source_id')
      .references(() => entities.id, { onDelete: 'cascade' })
      .notNull(),

    /** Target entity (edge destination) */
    targetId: uuid('target_id')
      .references(() => entities.id, { onDelete: 'cascade' })
      .notNull(),

    /** Domain of power this relationship falls under */
    domain: domainTypeEnum('domain').notNull(),

    /** Description of the relationship */
    description: text('description').notNull(),

    /** Type of relationship (employed_by, owns, married_to, funded, etc.) */
    relationshipType: text('relationship_type').notNull(),

    /** Current status of relationship */
    status: relationshipStatusEnum('status').notNull().default('UNKNOWN'),

    // =========================================================================
    // PROVENANCE TRACKING (Critical for truth verification)
    // =========================================================================

    /** Evidence quality classification */
    confidence: confidenceLevelEnum('confidence').notNull().default('SPECULATIVE'),

    /** Source citation for this relationship claim */
    sourceCitation: text('source_citation'),

    /** URL to primary source document */
    sourceUrl: text('source_url'),

    /** Date source was accessed/verified */
    sourceVerifiedAt: timestamp('source_verified_at', { withTimezone: true }),

    /** Additional supporting sources */
    additionalSources: jsonb('additional_sources').notNull().default([]),

    /** Notes on evidence quality or contradicting sources */
    provenanceNotes: text('provenance_notes'),

    // =========================================================================
    // TEMPORAL DATA
    // =========================================================================

    /** When the relationship began */
    startDate: timestamp('start_date', { withTimezone: true }),

    /** When the relationship ended (null if ongoing) */
    endDate: timestamp('end_date', { withTimezone: true }),

    /** Temporal precision ('day', 'month', 'year', 'approximate') */
    temporalPrecision: text('temporal_precision').default('unknown'),

    // =========================================================================
    // METADATA
    // =========================================================================

    /** Structured metadata (financial amounts, roles, etc.) */
    metadata: jsonb('metadata').notNull().default({}),

    /** Tags for categorization */
    tags: jsonb('tags').notNull().default([]),

    // Audit trail
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),

    /** User who created this relationship (for audit) */
    createdBy: uuid('created_by'),
  },
  (table) => ({
    sourceIdIdx: index('power_relationships_source_id_idx').on(table.sourceId),
    targetIdIdx: index('power_relationships_target_id_idx').on(table.targetId),
    domainIdx: index('power_relationships_domain_idx').on(table.domain),
    confidenceIdx: index('power_relationships_confidence_idx').on(table.confidence),
    relationshipTypeIdx: index('power_relationships_type_idx').on(table.relationshipType),
    createdAtIdx: index('power_relationships_created_at_idx').on(table.createdAt),
    // Composite indexes for common queries
    sourceDomainIdx: index('power_relationships_source_domain_idx').on(table.sourceId, table.domain),
    domainConfidenceIdx: index('power_relationships_domain_confidence_idx').on(table.domain, table.confidence),
  })
);

/**
 * Evidence table
 * Stores individual pieces of evidence that support relationships
 * Allows multiple sources per relationship with individual confidence tracking
 */
export const evidence = pgTable(
  'power_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** Relationship this evidence supports */
    relationshipId: uuid('relationship_id')
      .references(() => relationships.id, { onDelete: 'cascade' })
      .notNull(),

    /** Evidence confidence level */
    confidence: confidenceLevelEnum('confidence').notNull(),

    /** Type of evidence (court_document, news_article, flight_log, photo, etc.) */
    evidenceType: text('evidence_type').notNull(),

    /** Title or brief description */
    title: text('title').notNull(),

    /** Full description of the evidence */
    description: text('description'),

    /** URL to source */
    sourceUrl: text('source_url'),

    /** Citation in academic format */
    citation: text('citation'),

    /** Date of the source document */
    sourceDate: timestamp('source_date', { withTimezone: true }),

    /** Date this evidence was added and verified */
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    /** Who verified this evidence */
    verifiedBy: uuid('verified_by'),

    /** Structured metadata */
    metadata: jsonb('metadata').notNull().default({}),

    // Audit
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by'),
  },
  (table) => ({
    relationshipIdIdx: index('power_evidence_relationship_id_idx').on(table.relationshipId),
    confidenceIdx: index('power_evidence_confidence_idx').on(table.confidence),
    evidenceTypeIdx: index('power_evidence_type_idx').on(table.evidenceType),
  })
);

/**
 * Network Audit Log
 * Tracks all modifications to the power network for accountability
 */
export const networkAuditLog = pgTable(
  'power_network_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /** User who performed the action */
    userId: uuid('user_id'),

    /** Action performed (create, update, delete, verify) */
    action: text('action').notNull(),

    /** Table affected (entities, relationships, evidence) */
    tableName: text('table_name').notNull(),

    /** ID of the affected record */
    recordId: uuid('record_id').notNull(),

    /** Previous state (for updates/deletes) */
    previousState: jsonb('previous_state'),

    /** New state (for creates/updates) */
    newState: jsonb('new_state'),

    /** Reason for the change */
    reason: text('reason'),

    /** Session/request context */
    sessionId: text('session_id'),
    ipAddress: text('ip_address'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('power_audit_user_id_idx').on(table.userId),
    actionIdx: index('power_audit_action_idx').on(table.action),
    tableNameIdx: index('power_audit_table_name_idx').on(table.tableName),
    recordIdIdx: index('power_audit_record_id_idx').on(table.recordId),
    createdAtIdx: index('power_audit_created_at_idx').on(table.createdAt),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Entity types
export type PowerEntity = InferSelectModel<typeof entities>;
export type NewPowerEntity = InferInsertModel<typeof entities>;

// Relationship types
export type PowerRelationship = InferSelectModel<typeof relationships>;
export type NewPowerRelationship = InferInsertModel<typeof relationships>;

// Evidence types
export type PowerEvidence = InferSelectModel<typeof evidence>;
export type NewPowerEvidence = InferInsertModel<typeof evidence>;

// Audit log types
export type PowerNetworkAuditLog = InferSelectModel<typeof networkAuditLog>;
export type NewPowerNetworkAuditLog = InferInsertModel<typeof networkAuditLog>;

// Enum value types for type safety
export type DomainType = 'RELIGION' | 'FAMILY' | 'EDUCATION' | 'GOVERNMENT' | 'MEDIA' | 'ARTS' | 'BUSINESS';
export type ConfidenceLevel = 'SPECULATIVE' | 'CIRCUMSTANTIAL' | 'DOCUMENTED' | 'ADJUDICATED';
export type EntityType = 'PERSON' | 'INSTITUTION' | 'ASSET' | 'EVENT' | 'DOCUMENT';
export type ScandalTier = 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type RelationshipStatus = 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
