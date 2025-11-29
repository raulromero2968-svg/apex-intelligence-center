/**
 * Power Network Schema - Seven Mountains Framework
 *
 * This schema maps power structures using the "Seven Mountains of Influence" model.
 * It provides a graph-relational structure for tracking entities (People, Organizations, Concepts)
 * and their relationships across domains of power.
 *
 * Use Case: Mapping networks like Epstein, Tech Plutocrats, and institutional power structures.
 *
 * @module powerNetwork
 * @version 1.0.0
 */

import { pgTable, text, uuid, jsonb, timestamp, index, pgEnum, customType, boolean } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// PGVECTOR SUPPORT
// =============================================================================

const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value;
    }
    const cleaned = value.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned.slice(1, -1).split(',').map(Number);
    }
    return JSON.parse(value);
  },
});

// =============================================================================
// ENUMS
// =============================================================================

/**
 * The Seven Mountains of Influence (Dominionism Framework)
 * These represent the key domains through which cultural power is exercised.
 */
export const domainTypeEnum = pgEnum('power_domain_type', [
  'RELIGION',     // Churches, spiritual movements, theological influence
  'FAMILY',       // Household, generational wealth, inheritance structures
  'EDUCATION',    // Universities, think tanks, research institutions
  'GOVERNMENT',   // Political office, regulatory agencies, law enforcement
  'MEDIA',        // News outlets, social platforms, propaganda networks
  'ARTS',         // Entertainment, culture production, narrative control
  'BUSINESS',     // Corporations, finance, technology infrastructure
]);

/**
 * Entity types in the power network
 */
export const entityTypeEnum = pgEnum('power_entity_type', [
  'PERSON',       // Individual actors
  'ORGANIZATION', // Corporations, NGOs, foundations, agencies
  'CONCEPT',      // Ideas, movements, ideologies (e.g., "Rentism", "Effective Altruism")
  'EVENT',        // Specific incidents, meetings, transactions
  'LOCATION',     // Physical places of power (e.g., "Little St. James", "Davos")
]);

/**
 * Evidence tier for scandal/allegation tracking
 * Based on journalistic standards of verification
 */
export const evidenceTierEnum = pgEnum('evidence_tier', [
  'CONFIRMED',    // Court documents, official records, direct evidence
  'DOCUMENTED',   // Credible journalism, multiple sources
  'ALLEGED',      // Single source, unverified but plausible
  'SPECULATIVE',  // Pattern-based inference, requires more evidence
]);

/**
 * Relationship types between entities
 */
export const relationshipTypeEnum = pgEnum('power_relationship_type', [
  'FINANCIAL',    // Money flows, investments, payments
  'EMPLOYMENT',   // Works for, hired by
  'OWNERSHIP',    // Owns, controls
  'POLITICAL',    // Endorses, lobbies, appoints
  'LEGAL',        // Represents, prosecutes, settles
  'SOCIAL',       // Friends with, introduced by, traveled with
  'FAMILIAL',     // Blood relation, marriage
  'IDEOLOGICAL',  // Promotes, funds, aligns with
]);

// =============================================================================
// TABLES
// =============================================================================

/**
 * Power Entities - Nodes in the graph
 * Represents people, organizations, concepts, events, and locations
 *
 * Invariants:
 * - name must not be empty
 * - type must be valid entityTypeEnum value
 * - embedding must be exactly 768 dimensions (enforced at application layer)
 */
export const powerEntities = pgTable(
  'power_entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Core identity
    name: text('name').notNull(),
    type: entityTypeEnum('type').notNull(),
    aliases: jsonb('aliases').default([]).$type<string[]>(), // Alternative names

    // Description and context
    summary: text('summary'), // Brief description
    biography: text('biography'), // Longer form for persons

    // Evidence and verification
    evidenceTier: evidenceTierEnum('evidence_tier').default('DOCUMENTED'),
    scandalNotes: text('scandal_notes'), // What they are implicated in

    // Ghost Protocol: Obfuscated entities
    // If TRUE, this node represents a hidden actor (e.g., "Unnamed Co-Conspirator")
    // Protected by legal instruments like NPAs, sealed indictments, or redacted documents
    isObfuscated: boolean('is_obfuscated').default(false).notNull(),

    // Domain classification (can operate across multiple)
    primaryDomain: domainTypeEnum('primary_domain'),
    secondaryDomains: jsonb('secondary_domains').default([]).$type<string[]>(),

    // External references
    wikipediaUrl: text('wikipedia_url'),
    sourceUrls: jsonb('source_urls').default([]).$type<string[]>(),
    imageUrl: text('image_url'),

    // Semantic search embedding
    embedding: vector768('embedding'),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('power_entities_name_idx').on(table.name),
    typeIdx: index('power_entities_type_idx').on(table.type),
    domainIdx: index('power_entities_domain_idx').on(table.primaryDomain),
    evidenceIdx: index('power_entities_evidence_idx').on(table.evidenceTier),
  })
);

/**
 * Power Relationships - Edges in the graph
 * Connects two entities with typed, temporal, and evidenced relationships
 *
 * Invariants:
 * - sourceId and targetId must reference valid power_entities
 * - domain must be valid domainTypeEnum value
 * - relationshipType must be valid relationshipTypeEnum value
 */
export const powerRelationships = pgTable(
  'power_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // The connection
    sourceId: uuid('source_id').references(() => powerEntities.id, { onDelete: 'cascade' }).notNull(),
    targetId: uuid('target_id').references(() => powerEntities.id, { onDelete: 'cascade' }).notNull(),

    // Classification
    relationshipType: relationshipTypeEnum('relationship_type').notNull(),
    domain: domainTypeEnum('domain').notNull(),

    // Description and evidence
    description: text('description'), // e.g., "Paid $290M settlement"
    evidenceLink: text('evidence_link'), // URL to court doc, article
    evidenceTier: evidenceTierEnum('evidence_tier').default('DOCUMENTED'),

    // Temporal bounds (crucial for showing "before/after" conviction)
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    isOngoing: text('is_ongoing').default('unknown'), // 'yes' | 'no' | 'unknown'

    // Relationship strength/significance
    significance: text('significance').default('medium'), // 'low' | 'medium' | 'high' | 'critical'

    // Financial details (when applicable)
    financialAmount: text('financial_amount'), // Stored as text for flexibility (e.g., "$290M", "undisclosed")
    financialCurrency: text('financial_currency').default('USD'),

    // Source tracking
    sourceUrls: jsonb('source_urls').default([]).$type<string[]>(),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index('power_relationships_source_idx').on(table.sourceId),
    targetIdx: index('power_relationships_target_idx').on(table.targetId),
    typeIdx: index('power_relationships_type_idx').on(table.relationshipType),
    domainIdx: index('power_relationships_domain_idx').on(table.domain),
    dateIdx: index('power_relationships_date_idx').on(table.startDate, table.endDate),
  })
);

/**
 * Power Network Snapshots - Versioned state captures
 * Allows tracking how the network evolves over time
 */
export const powerNetworkSnapshots = pgTable(
  'power_network_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Snapshot identity
    name: text('name').notNull(), // e.g., "Epstein Network Pre-2008"
    description: text('description'),
    snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),

    // The frozen state
    entityIds: jsonb('entity_ids').default([]).$type<string[]>(),
    relationshipIds: jsonb('relationship_ids').default([]).$type<string[]>(),

    // Analysis results
    analysisNotes: text('analysis_notes'),
    keyFindings: jsonb('key_findings').default([]).$type<string[]>(),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('power_snapshots_name_idx').on(table.name),
    dateIdx: index('power_snapshots_date_idx').on(table.snapshotDate),
  })
);

/**
 * Power Claims - Specific factual claims with citations
 * Tracks individual assertions for fact-checking and provenance
 */
export const powerClaims = pgTable(
  'power_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // The claim
    claimText: text('claim_text').notNull(), // The assertion
    context: text('context'), // Where this fits in the larger narrative

    // Linked entities
    subjectEntityId: uuid('subject_entity_id').references(() => powerEntities.id),
    objectEntityId: uuid('object_entity_id').references(() => powerEntities.id),
    relationshipId: uuid('relationship_id').references(() => powerRelationships.id),

    // Verification
    evidenceTier: evidenceTierEnum('evidence_tier').default('ALLEGED'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: text('verified_by'), // Who verified (researcher name)

    // Sources
    primarySourceUrl: text('primary_source_url'),
    secondarySources: jsonb('secondary_sources').default([]).$type<string[]>(),

    // Status
    status: text('status').default('pending'), // 'pending' | 'verified' | 'disputed' | 'debunked'
    disputeNotes: text('dispute_notes'),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    subjectIdx: index('power_claims_subject_idx').on(table.subjectEntityId),
    objectIdx: index('power_claims_object_idx').on(table.objectEntityId),
    statusIdx: index('power_claims_status_idx').on(table.status),
    tierIdx: index('power_claims_tier_idx').on(table.evidenceTier),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PowerEntity = InferSelectModel<typeof powerEntities>;
export type NewPowerEntity = InferInsertModel<typeof powerEntities>;

export type PowerRelationship = InferSelectModel<typeof powerRelationships>;
export type NewPowerRelationship = InferInsertModel<typeof powerRelationships>;

export type PowerNetworkSnapshot = InferSelectModel<typeof powerNetworkSnapshots>;
export type NewPowerNetworkSnapshot = InferInsertModel<typeof powerNetworkSnapshots>;

export type PowerClaim = InferSelectModel<typeof powerClaims>;
export type NewPowerClaim = InferInsertModel<typeof powerClaims>;

// Enum type exports for external use
export type PowerDomainType = 'RELIGION' | 'FAMILY' | 'EDUCATION' | 'GOVERNMENT' | 'MEDIA' | 'ARTS' | 'BUSINESS';
export type PowerEntityType = 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'EVENT' | 'LOCATION';
export type EvidenceTier = 'CONFIRMED' | 'DOCUMENTED' | 'ALLEGED' | 'SPECULATIVE';
export type PowerRelationshipType = 'FINANCIAL' | 'EMPLOYMENT' | 'OWNERSHIP' | 'POLITICAL' | 'LEGAL' | 'SOCIAL' | 'FAMILIAL' | 'IDEOLOGICAL';
