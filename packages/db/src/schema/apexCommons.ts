import { pgTable, pgEnum, text, uuid, integer, timestamp, jsonb, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// APEX COMMONS RESOURCE LIBRARY
// =============================================================================
// TCG-like resource management system with reputation credits, voting,
// moderation, and governance features.

// =============================================================================
// ENUMS
// =============================================================================

/**
 * User roles for RBAC (extends base user roles for Commons)
 */
export const commonsUserRoleEnum = pgEnum('commons_user_role', [
  'user',
  'teacher',
  'moderator',
  'admin',
]);

/**
 * Contributor levels based on reputation and contributions
 */
export const contributorLevelEnum = pgEnum('contributor_level', [
  'bronze',
  'silver',
  'gold',
  'platinum',
]);

/**
 * Resource approval status
 */
export const resourceStatusEnum = pgEnum('resource_status', [
  'draft',
  'pending',
  'approved',
  'rejected',
  'flagged',
  'archived',
]);

/**
 * Resource types for categorization
 */
export const resourceTypeEnum = pgEnum('resource_type', [
  'lesson_plan',
  'worksheet',
  'video',
  'article',
  'presentation',
  'assessment',
  'template',
  'other',
]);

/**
 * Vote types for resources
 */
export const voteTypeEnum = pgEnum('vote_type', ['up', 'down']);

/**
 * Proposal status for governance
 */
export const proposalStatusEnum = pgEnum('proposal_status', [
  'active',
  'passed',
  'rejected',
  'expired',
]);

/**
 * Moderation flag status
 */
export const flagStatusEnum = pgEnum('flag_status', [
  'open',
  'under_review',
  'resolved',
  'dismissed',
]);

// =============================================================================
// USER PROFILES (Extension of base users table)
// =============================================================================

/**
 * Commons user profiles - extends base users with Commons-specific fields
 * Stores reputation credits, contributor level, and teaching preferences
 */
export const commonsUserProfiles = pgTable(
  'commons_user_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    role: commonsUserRoleEnum('role').default('user').notNull(),
    bio: text('bio'),
    subjects: jsonb('subjects').$type<string[]>().default([]),
    gradeLevels: jsonb('grade_levels').$type<string[]>().default([]),
    school: text('school'),
    location: text('location'),
    reputationCredits: integer('reputation_credits').default(0).notNull(),
    contributorLevel: contributorLevelEnum('contributor_level').default('bronze').notNull(),
    totalResources: integer('total_resources').default(0).notNull(),
    totalUpvotesReceived: integer('total_upvotes_received').default(0).notNull(),
    totalDownloads: integer('total_downloads').default(0).notNull(),
    isVerifiedTeacher: boolean('is_verified_teacher').default(false).notNull(),
    preferences: jsonb('preferences').$type<{
      emailNotifications: boolean;
      newResourceAlerts: boolean;
      weeklyDigest: boolean;
    }>().default({
      emailNotifications: true,
      newResourceAlerts: true,
      weeklyDigest: true,
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('commons_profiles_user_id_idx').on(table.userId),
    roleIdx: index('commons_profiles_role_idx').on(table.role),
    contributorLevelIdx: index('commons_profiles_contributor_level_idx').on(table.contributorLevel),
    reputationIdx: index('commons_profiles_reputation_idx').on(table.reputationCredits),
  })
);

// =============================================================================
// RESOURCES
// =============================================================================

/**
 * Educational resources table
 * Core table for storing shared educational materials
 */
export const commonsResources = pgTable(
  'commons_resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contributorId: uuid('contributor_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    subject: text('subject'),
    gradeLevel: text('grade_level'),
    resourceType: resourceTypeEnum('resource_type').default('other').notNull(),
    files: jsonb('files').$type<{
      url: string;
      name: string;
      type: string;
      size: number;
      key?: string;
    }[]>().default([]),
    thumbnailUrl: text('thumbnail_url'),
    previewUrl: text('preview_url'),
    qualityScore: integer('quality_score').default(0).notNull(),
    upvotes: integer('upvotes').default(0).notNull(),
    downvotes: integer('downvotes').default(0).notNull(),
    downloads: integer('downloads').default(0).notNull(),
    views: integer('views').default(0).notNull(),
    status: resourceStatusEnum('status').default('draft').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => commonsUserProfiles.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    tags: jsonb('tags').$type<string[]>().default([]),
    standards: jsonb('standards').$type<{
      framework: string;
      codes: string[];
    }[]>().default([]),
    estimatedDuration: integer('estimated_duration'), // in minutes
    difficulty: text('difficulty'), // 'beginner' | 'intermediate' | 'advanced'
    language: text('language').default('en').notNull(),
    license: text('license').default('CC-BY-4.0').notNull(),
    embedding: text('embedding'), // JSON string for pgvector compatibility (future RAG)
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contributorIdx: index('commons_resources_contributor_idx').on(table.contributorId),
    statusIdx: index('commons_resources_status_idx').on(table.status),
    categoryIdx: index('commons_resources_category_idx').on(table.category),
    subjectIdx: index('commons_resources_subject_idx').on(table.subject),
    gradeLevelIdx: index('commons_resources_grade_level_idx').on(table.gradeLevel),
    resourceTypeIdx: index('commons_resources_type_idx').on(table.resourceType),
    qualityScoreIdx: index('commons_resources_quality_idx').on(table.qualityScore),
    publishedAtIdx: index('commons_resources_published_at_idx').on(table.publishedAt),
    createdAtIdx: index('commons_resources_created_at_idx').on(table.createdAt),
  })
);

// =============================================================================
// RESOURCE VOTES
// =============================================================================

/**
 * Resource votes table
 * Tracks up/down votes from users on resources
 */
export const commonsResourceVotes = pgTable(
  'commons_resource_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => commonsResources.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    voteType: voteTypeEnum('vote_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueVote: uniqueIndex('commons_votes_unique_idx').on(table.resourceId, table.userId),
    resourceIdx: index('commons_votes_resource_idx').on(table.resourceId),
    userIdx: index('commons_votes_user_idx').on(table.userId),
  })
);

// =============================================================================
// COLLECTIONS
// =============================================================================

/**
 * User collections for organizing resources
 */
export const commonsCollections = pgTable(
  'commons_collections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isPublic: boolean('is_public').default(false).notNull(),
    thumbnailUrl: text('thumbnail_url'),
    resourceCount: integer('resource_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('commons_collections_user_idx').on(table.userId),
    isPublicIdx: index('commons_collections_public_idx').on(table.isPublic),
  })
);

/**
 * Junction table for collections and resources (many-to-many)
 */
export const commonsCollectionItems = pgTable(
  'commons_collection_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => commonsCollections.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => commonsResources.id, { onDelete: 'cascade' }),
    order: integer('order').default(0).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueItem: uniqueIndex('commons_collection_items_unique_idx').on(
      table.collectionId,
      table.resourceId
    ),
    collectionIdx: index('commons_collection_items_collection_idx').on(table.collectionId),
    resourceIdx: index('commons_collection_items_resource_idx').on(table.resourceId),
  })
);

// =============================================================================
// GOVERNANCE PROPOSALS
// =============================================================================

/**
 * Governance proposals for community decisions
 */
export const commonsProposals = pgTable(
  'commons_proposals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(), // 'policy', 'feature', 'moderation', 'other'
    status: proposalStatusEnum('status').default('active').notNull(),
    votesFor: integer('votes_for').default(0).notNull(),
    votesAgainst: integer('votes_against').default(0).notNull(),
    votesAbstain: integer('votes_abstain').default(0).notNull(),
    quorumRequired: integer('quorum_required').default(100).notNull(),
    minReputation: integer('min_reputation').default(50).notNull(), // Min RC to vote
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index('commons_proposals_author_idx').on(table.authorId),
    statusIdx: index('commons_proposals_status_idx').on(table.status),
    endsAtIdx: index('commons_proposals_ends_at_idx').on(table.endsAt),
  })
);

/**
 * Proposal votes table
 */
export const commonsProposalVotes = pgTable(
  'commons_proposal_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => commonsProposals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    vote: text('vote').notNull(), // 'for', 'against', 'abstain'
    weight: integer('weight').default(1).notNull(), // Based on reputation
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueVote: uniqueIndex('commons_proposal_votes_unique_idx').on(table.proposalId, table.userId),
    proposalIdx: index('commons_proposal_votes_proposal_idx').on(table.proposalId),
    userIdx: index('commons_proposal_votes_user_idx').on(table.userId),
  })
);

// =============================================================================
// REPUTATION CREDITS TRANSACTIONS
// =============================================================================

/**
 * RC Transactions ledger
 * Tracks all reputation credit changes for audit trail
 */
export const commonsRcTransactions = pgTable(
  'commons_rc_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // Positive or negative
    balance: integer('balance').notNull(), // Balance after transaction
    reason: text('reason').notNull(),
    reasonCode: text('reason_code').notNull(), // Enum-like codes for categorization
    referenceType: text('reference_type'), // 'resource', 'proposal', 'vote', etc.
    referenceId: uuid('reference_id'), // ID of related entity
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('commons_rc_transactions_user_idx').on(table.userId),
    createdAtIdx: index('commons_rc_transactions_created_at_idx').on(table.createdAt),
    reasonCodeIdx: index('commons_rc_transactions_reason_code_idx').on(table.reasonCode),
    referenceIdx: index('commons_rc_transactions_reference_idx').on(
      table.referenceType,
      table.referenceId
    ),
  })
);

// =============================================================================
// MODERATION
// =============================================================================

/**
 * Moderation flags for reported content
 */
export const commonsModerationFlags = pgTable(
  'commons_moderation_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id').references(() => commonsResources.id, { onDelete: 'cascade' }),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => commonsUserProfiles.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    reasonCode: text('reason_code').notNull(), // 'spam', 'inappropriate', 'copyright', etc.
    description: text('description'),
    status: flagStatusEnum('status').default('open').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => commonsUserProfiles.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    resolution: text('resolution'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    resourceIdx: index('commons_flags_resource_idx').on(table.resourceId),
    reporterIdx: index('commons_flags_reporter_idx').on(table.reporterId),
    statusIdx: index('commons_flags_status_idx').on(table.status),
    reasonCodeIdx: index('commons_flags_reason_code_idx').on(table.reasonCode),
  })
);

/**
 * Download tracking for resources
 */
export const commonsDownloads = pgTable(
  'commons_downloads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => commonsResources.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => commonsUserProfiles.id, { onDelete: 'set null' }),
    ipHash: text('ip_hash'), // Hashed IP for anonymous tracking
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    resourceIdx: index('commons_downloads_resource_idx').on(table.resourceId),
    userIdx: index('commons_downloads_user_idx').on(table.userId),
    createdAtIdx: index('commons_downloads_created_at_idx').on(table.createdAt),
  })
);

/**
 * Resource views tracking
 */
export const commonsViews = pgTable(
  'commons_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => commonsResources.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => commonsUserProfiles.id, { onDelete: 'set null' }),
    sessionId: text('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    resourceIdx: index('commons_views_resource_idx').on(table.resourceId),
    createdAtIdx: index('commons_views_created_at_idx').on(table.createdAt),
    // Unique view per session per resource (dedupe)
    uniqueView: uniqueIndex('commons_views_unique_session_idx').on(
      table.resourceId,
      table.sessionId
    ),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const commonsUserProfilesRelations = relations(commonsUserProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [commonsUserProfiles.userId],
    references: [users.id],
  }),
  resources: many(commonsResources),
  votes: many(commonsResourceVotes),
  collections: many(commonsCollections),
  proposals: many(commonsProposals),
  proposalVotes: many(commonsProposalVotes),
  transactions: many(commonsRcTransactions),
  flags: many(commonsModerationFlags),
  downloads: many(commonsDownloads),
}));

export const commonsResourcesRelations = relations(commonsResources, ({ one, many }) => ({
  contributor: one(commonsUserProfiles, {
    fields: [commonsResources.contributorId],
    references: [commonsUserProfiles.id],
  }),
  reviewer: one(commonsUserProfiles, {
    fields: [commonsResources.reviewedBy],
    references: [commonsUserProfiles.id],
  }),
  votes: many(commonsResourceVotes),
  collectionItems: many(commonsCollectionItems),
  flags: many(commonsModerationFlags),
  downloads: many(commonsDownloads),
  views: many(commonsViews),
}));

export const commonsResourceVotesRelations = relations(commonsResourceVotes, ({ one }) => ({
  resource: one(commonsResources, {
    fields: [commonsResourceVotes.resourceId],
    references: [commonsResources.id],
  }),
  user: one(commonsUserProfiles, {
    fields: [commonsResourceVotes.userId],
    references: [commonsUserProfiles.id],
  }),
}));

export const commonsCollectionsRelations = relations(commonsCollections, ({ one, many }) => ({
  user: one(commonsUserProfiles, {
    fields: [commonsCollections.userId],
    references: [commonsUserProfiles.id],
  }),
  items: many(commonsCollectionItems),
}));

export const commonsCollectionItemsRelations = relations(commonsCollectionItems, ({ one }) => ({
  collection: one(commonsCollections, {
    fields: [commonsCollectionItems.collectionId],
    references: [commonsCollections.id],
  }),
  resource: one(commonsResources, {
    fields: [commonsCollectionItems.resourceId],
    references: [commonsResources.id],
  }),
}));

export const commonsProposalsRelations = relations(commonsProposals, ({ one, many }) => ({
  author: one(commonsUserProfiles, {
    fields: [commonsProposals.authorId],
    references: [commonsUserProfiles.id],
  }),
  votes: many(commonsProposalVotes),
}));

export const commonsProposalVotesRelations = relations(commonsProposalVotes, ({ one }) => ({
  proposal: one(commonsProposals, {
    fields: [commonsProposalVotes.proposalId],
    references: [commonsProposals.id],
  }),
  user: one(commonsUserProfiles, {
    fields: [commonsProposalVotes.userId],
    references: [commonsUserProfiles.id],
  }),
}));

export const commonsRcTransactionsRelations = relations(commonsRcTransactions, ({ one }) => ({
  user: one(commonsUserProfiles, {
    fields: [commonsRcTransactions.userId],
    references: [commonsUserProfiles.id],
  }),
}));

export const commonsModerationFlagsRelations = relations(commonsModerationFlags, ({ one }) => ({
  resource: one(commonsResources, {
    fields: [commonsModerationFlags.resourceId],
    references: [commonsResources.id],
  }),
  reporter: one(commonsUserProfiles, {
    fields: [commonsModerationFlags.reporterId],
    references: [commonsUserProfiles.id],
  }),
  reviewer: one(commonsUserProfiles, {
    fields: [commonsModerationFlags.reviewedBy],
    references: [commonsUserProfiles.id],
  }),
}));

export const commonsDownloadsRelations = relations(commonsDownloads, ({ one }) => ({
  resource: one(commonsResources, {
    fields: [commonsDownloads.resourceId],
    references: [commonsResources.id],
  }),
  user: one(commonsUserProfiles, {
    fields: [commonsDownloads.userId],
    references: [commonsUserProfiles.id],
  }),
}));

export const commonsViewsRelations = relations(commonsViews, ({ one }) => ({
  resource: one(commonsResources, {
    fields: [commonsViews.resourceId],
    references: [commonsResources.id],
  }),
  user: one(commonsUserProfiles, {
    fields: [commonsViews.userId],
    references: [commonsUserProfiles.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type CommonsUserProfile = InferSelectModel<typeof commonsUserProfiles>;
export type NewCommonsUserProfile = InferInsertModel<typeof commonsUserProfiles>;

export type CommonsResource = InferSelectModel<typeof commonsResources>;
export type NewCommonsResource = InferInsertModel<typeof commonsResources>;

export type CommonsResourceVote = InferSelectModel<typeof commonsResourceVotes>;
export type NewCommonsResourceVote = InferInsertModel<typeof commonsResourceVotes>;

export type CommonsCollection = InferSelectModel<typeof commonsCollections>;
export type NewCommonsCollection = InferInsertModel<typeof commonsCollections>;

export type CommonsCollectionItem = InferSelectModel<typeof commonsCollectionItems>;
export type NewCommonsCollectionItem = InferInsertModel<typeof commonsCollectionItems>;

export type CommonsProposal = InferSelectModel<typeof commonsProposals>;
export type NewCommonsProposal = InferInsertModel<typeof commonsProposals>;

export type CommonsProposalVote = InferSelectModel<typeof commonsProposalVotes>;
export type NewCommonsProposalVote = InferInsertModel<typeof commonsProposalVotes>;

export type CommonsRcTransaction = InferSelectModel<typeof commonsRcTransactions>;
export type NewCommonsRcTransaction = InferInsertModel<typeof commonsRcTransactions>;

export type CommonsModerationFlag = InferSelectModel<typeof commonsModerationFlags>;
export type NewCommonsModerationFlag = InferInsertModel<typeof commonsModerationFlags>;

export type CommonsDownload = InferSelectModel<typeof commonsDownloads>;
export type NewCommonsDownload = InferInsertModel<typeof commonsDownloads>;

export type CommonsView = InferSelectModel<typeof commonsViews>;
export type NewCommonsView = InferInsertModel<typeof commonsViews>;

// Enum type exports
export type CommonsUserRole = 'user' | 'teacher' | 'moderator' | 'admin';
export type ContributorLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ResourceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'flagged' | 'archived';
export type ResourceType = 'lesson_plan' | 'worksheet' | 'video' | 'article' | 'presentation' | 'assessment' | 'template' | 'other';
export type VoteType = 'up' | 'down';
export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'expired';
export type FlagStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

// =============================================================================
// RC REASON CODES (Constants)
// =============================================================================

export const RC_REASON_CODES = {
  // Earning RC
  RESOURCE_CREATED: 'resource_created',
  RESOURCE_APPROVED: 'resource_approved',
  UPVOTE_RECEIVED: 'upvote_received',
  DOWNLOAD_RECEIVED: 'download_received',
  PROPOSAL_PASSED: 'proposal_passed',
  DAILY_LOGIN: 'daily_login',
  PROFILE_COMPLETED: 'profile_completed',
  FIRST_RESOURCE: 'first_resource',
  MILESTONE_REACHED: 'milestone_reached',

  // Spending RC
  PROPOSAL_CREATED: 'proposal_created',
  BOOST_RESOURCE: 'boost_resource',
  PREMIUM_FEATURE: 'premium_feature',

  // Penalties
  RESOURCE_REJECTED: 'resource_rejected',
  FLAG_UPHELD: 'flag_upheld',
  DOWNVOTE_RECEIVED: 'downvote_received',

  // Admin adjustments
  ADMIN_GRANT: 'admin_grant',
  ADMIN_DEDUCTION: 'admin_deduction',
} as const;

export type RcReasonCode = typeof RC_REASON_CODES[keyof typeof RC_REASON_CODES];

// RC award amounts (can be configured via environment/database)
export const RC_AMOUNTS = {
  [RC_REASON_CODES.RESOURCE_CREATED]: 5,
  [RC_REASON_CODES.RESOURCE_APPROVED]: 20,
  [RC_REASON_CODES.UPVOTE_RECEIVED]: 2,
  [RC_REASON_CODES.DOWNLOAD_RECEIVED]: 1,
  [RC_REASON_CODES.PROPOSAL_PASSED]: 50,
  [RC_REASON_CODES.DAILY_LOGIN]: 1,
  [RC_REASON_CODES.PROFILE_COMPLETED]: 10,
  [RC_REASON_CODES.FIRST_RESOURCE]: 25,
  [RC_REASON_CODES.MILESTONE_REACHED]: 100,
  [RC_REASON_CODES.PROPOSAL_CREATED]: -10,
  [RC_REASON_CODES.BOOST_RESOURCE]: -5,
  [RC_REASON_CODES.RESOURCE_REJECTED]: -5,
  [RC_REASON_CODES.FLAG_UPHELD]: -10,
  [RC_REASON_CODES.DOWNVOTE_RECEIVED]: -1,
} as const;

// Contributor level thresholds
export const CONTRIBUTOR_LEVEL_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 2000,
} as const;
