/**
 * Perplexity-Style Blog Engine Schema
 *
 * Implements an AI-powered blog system with:
 * - AI-generated content with full provenance tracking
 * - Topic clusters for SEO (pillar/cluster model)
 * - Citation system with source verification
 * - Hybrid RAG search via pgvector embeddings
 *
 * Strategic Purpose: Drive LLMO (Large Language Model Optimization) and
 * organic growth through researched, cited content.
 *
 * Reference: knowledge-03-seo-llmo-strategy.md
 *
 * @module blogEngine
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  boolean,
  decimal,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Blog post status for editorial workflow
 */
export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'generating',
  'review',
  'scheduled',
  'published',
  'archived',
]);

/**
 * Content generation source
 */
export const contentSourceEnum = pgEnum('blog_content_source', [
  'ai_generated',
  'human_written',
  'ai_assisted',
  'imported',
]);

/**
 * Topic cluster type for SEO structure
 */
export const clusterTypeEnum = pgEnum('topic_cluster_type', [
  'pillar',
  'cluster',
  'supporting',
]);

/**
 * Source verification status
 */
export const sourceStatusEnum = pgEnum('blog_source_status', [
  'pending',
  'verified',
  'stale',
  'broken',
  'rejected',
]);

// =============================================================================
// TOPIC CLUSTERS TABLE (SEO Foundation)
// =============================================================================

/**
 * Topic Clusters - Implements SEO pillar/cluster model
 *
 * Structure:
 * - Pillar pages: Comprehensive guides (e.g., "Pokemon Investing 101")
 * - Cluster pages: Specific topics linking back to pillar
 * - Supporting pages: Deep dives on subtopics
 *
 * This enables topical authority and internal linking strategy.
 */
export const topicClusters = pgTable(
  'topic_clusters',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Cluster identification
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),

    // Hierarchy
    type: clusterTypeEnum('type').notNull().default('cluster'),
    parentClusterId: uuid('parent_cluster_id'), // Self-reference for cluster → pillar

    // SEO metadata
    primaryKeyword: text('primary_keyword').notNull(),
    secondaryKeywords: jsonb('secondary_keywords').$type<string[]>().default([]),
    searchVolume: integer('search_volume'), // Monthly search volume estimate
    keywordDifficulty: integer('keyword_difficulty'), // 0-100 score

    // Content strategy
    targetWordCount: integer('target_word_count').default(2000),
    contentBrief: text('content_brief'), // AI generation prompt/brief
    targetAudience: text('target_audience'), // Persona: Alex, Ben, etc.

    // Metrics
    postCount: integer('post_count').default(0).notNull(),
    totalViews: integer('total_views').default(0).notNull(),
    avgTimeOnPage: integer('avg_time_on_page').default(0), // seconds

    // Status
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('topic_clusters_slug_idx').on(table.slug),
    typeIdx: index('topic_clusters_type_idx').on(table.type),
    parentIdx: index('topic_clusters_parent_idx').on(table.parentClusterId),
    keywordIdx: index('topic_clusters_keyword_idx').on(table.primaryKeyword),
  }),
);

// =============================================================================
// BLOG POSTS TABLE (AI-Generated Content)
// =============================================================================

/**
 * Blog Posts - AI-generated content with full provenance
 *
 * Key Features:
 * - Full generation metadata (model, tokens, prompts)
 * - Citation tracking with source verification
 * - Topic cluster association for SEO
 * - Vector embedding for semantic search
 * - Perplexity-style inline citations [1][2][3]
 */
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Content identification
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    subtitle: text('subtitle'),

    // SEO metadata
    seoTitle: text('seo_title'), // Override for <title> tag
    seoDescription: text('seo_description'), // Meta description
    canonicalUrl: text('canonical_url'), // If syndicated

    // Content
    content: text('content').notNull(), // Markdown with inline citations
    summary: text('summary'), // AI-generated summary for cards
    excerpt: text('excerpt'), // First 280 chars for previews

    // Rich content
    heroImage: text('hero_image'),
    heroImageAlt: text('hero_image_alt'),
    tableOfContents: jsonb('table_of_contents').$type<
      { id: string; title: string; level: number }[]
    >(),

    // Classification
    status: blogPostStatusEnum('status').notNull().default('draft'),
    contentSource: contentSourceEnum('content_source').notNull().default('ai_generated'),

    // Topic cluster relationship
    clusterId: uuid('cluster_id').references(() => topicClusters.id, {
      onDelete: 'set null',
    }),

    // Author (human editor or AI attribution)
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name').default('Apex Intelligence'),
    authorRole: text('author_role').default('Market Research'),
    authorAvatar: text('author_avatar'),

    // Tags and categories
    tags: jsonb('tags').$type<string[]>().default([]),
    category: text('category').default('market-analysis'),

    // TCG-specific metadata
    game: text('game').default('pokemon'), // pokemon, mtg, lorcana, etc.
    cardIds: jsonb('card_ids').$type<string[]>().default([]), // Referenced card IDs
    setCode: text('set_code'), // e.g., "SV06"

    // AI Generation metadata
    aiMetadata: jsonb('ai_metadata').$type<{
      modelId: string;
      tokensUsed: number;
      generationPrompt: string;
      researchQueries: string[];
      confidenceScore: number;
      generatedAt: string;
      editedBy?: string;
      editedAt?: string;
    }>(),

    // RAG Embedding for semantic search (1536 dimensions for ada-002)
    embedding: text('embedding'), // Stored as JSON string

    // Citation statistics
    sourceCount: integer('source_count').default(0).notNull(),
    citationCount: integer('citation_count').default(0).notNull(),

    // Engagement metrics
    viewCount: integer('view_count').default(0).notNull(),
    readTime: integer('read_time').default(5), // minutes
    likeCount: integer('like_count').default(0).notNull(),
    shareCount: integer('share_count').default(0).notNull(),

    // Internal linking
    relatedPostIds: jsonb('related_post_ids').$type<string[]>().default([]),

    // Scheduling
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),

    // Provenance
    traceHash: text('trace_hash'), // Content hash for verification
    ipfsCid: text('ipfs_cid'), // Optional IPFS storage

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('blog_posts_slug_idx').on(table.slug),
    statusIdx: index('blog_posts_status_idx').on(table.status),
    clusterIdx: index('blog_posts_cluster_idx').on(table.clusterId),
    authorIdx: index('blog_posts_author_idx').on(table.authorId),
    publishedIdx: index('blog_posts_published_idx').on(table.publishedAt),
    gameIdx: index('blog_posts_game_idx').on(table.game),
    categoryIdx: index('blog_posts_category_idx').on(table.category),
    // Composite index for feed queries
    feedIdx: index('blog_posts_feed_idx').on(
      table.status,
      table.publishedAt,
    ),
  }),
);

// =============================================================================
// BLOG SOURCES TABLE (Citation Tracking)
// =============================================================================

/**
 * Blog Sources - Citation tracking with provenance
 *
 * Implements Perplexity-style citation system:
 * - Each source is verified and tracked
 * - Sources can be reused across multiple posts
 * - Automatic staleness detection for time-sensitive data
 */
export const blogSources = pgTable(
  'blog_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Source identification
    url: text('url').notNull(),
    urlHash: text('url_hash').notNull(), // SHA-256 for deduplication

    // Content snapshot
    title: text('title').notNull(),
    publisher: text('publisher'), // e.g., "TCGPlayer", "Pokemon.com"
    author: text('author'),
    publishedDate: timestamp('published_date', { withTimezone: true }),
    fetchedDate: timestamp('fetched_date', { withTimezone: true }).defaultNow().notNull(),

    // Content excerpt (for citation context)
    excerpt: text('excerpt'), // Relevant snippet from source
    fullContent: text('full_content'), // Optional: full scraped content

    // Source metadata
    sourceType: text('source_type').default('article'), // article, video, forum, social
    domain: text('domain'), // e.g., "tcgplayer.com"
    favicon: text('favicon'), // Favicon URL for UI

    // Verification
    status: sourceStatusEnum('status').notNull().default('pending'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => users.id),

    // Reliability score (0-100)
    reliabilityScore: integer('reliability_score').default(50),

    // RAG embedding for source matching
    embedding: text('embedding'),

    // Usage tracking
    citationCount: integer('citation_count').default(0).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    urlHashIdx: index('blog_sources_url_hash_idx').on(table.urlHash),
    domainIdx: index('blog_sources_domain_idx').on(table.domain),
    statusIdx: index('blog_sources_status_idx').on(table.status),
    reliabilityIdx: index('blog_sources_reliability_idx').on(table.reliabilityScore),
  }),
);

// =============================================================================
// BLOG POST CITATIONS (Junction Table)
// =============================================================================

/**
 * Blog Post Citations - Links posts to sources with context
 *
 * Tracks:
 * - Which sources are cited in which posts
 * - Citation numbers [1][2][3] for inline references
 * - The specific claim each citation supports
 */
export const blogPostCitations = pgTable(
  'blog_post_citations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    postId: uuid('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),

    sourceId: uuid('source_id')
      .notNull()
      .references(() => blogSources.id, { onDelete: 'cascade' }),

    // Citation display
    citationNumber: integer('citation_number').notNull(), // [1], [2], etc.
    citationText: text('citation_text'), // Formatted citation string

    // Context
    claimText: text('claim_text'), // The claim this citation supports
    relevanceScore: decimal('relevance_score', { precision: 5, scale: 4 }), // Rerank score

    // Position in content (for highlighting)
    contentPosition: integer('content_position'), // Character offset

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index('blog_post_citations_post_idx').on(table.postId),
    sourceIdx: index('blog_post_citations_source_idx').on(table.sourceId),
    // Unique citation number per post
    uniqueCitation: unique('blog_post_citations_unique').on(
      table.postId,
      table.citationNumber,
    ),
  }),
);

// =============================================================================
// BLOG GENERATION JOBS (Async Processing)
// =============================================================================

/**
 * Blog Generation Jobs - Track async content generation
 *
 * Supports:
 * - Progress tracking for long-running generations
 * - Retry logic for failed generations
 * - Generation history for debugging
 */
export const blogGenerationJobs = pgTable(
  'blog_generation_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Job identification
    postId: uuid('post_id').references(() => blogPosts.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Generation config
    topic: text('topic').notNull(),
    clusterId: uuid('cluster_id').references(() => topicClusters.id),
    config: jsonb('config').$type<{
      model: string;
      temperature: number;
      targetWordCount: number;
      style: string;
      persona: string;
      includeCharts: boolean;
      researchDepth: 'quick' | 'standard' | 'deep';
    }>().notNull(),

    // Progress tracking
    status: text('status').notNull().default('pending'), // pending, researching, writing, citing, review, completed, failed
    progress: integer('progress').default(0).notNull(), // 0-100
    currentStep: text('current_step'),

    // Research results
    searchQueries: jsonb('search_queries').$type<string[]>().default([]),
    sourcesFound: integer('sources_found').default(0),
    sourcesUsed: integer('sources_used').default(0),

    // Timing
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Error handling
    retryCount: integer('retry_count').default(0).notNull(),
    maxRetries: integer('max_retries').default(3).notNull(),
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index('blog_generation_jobs_post_idx').on(table.postId),
    userIdx: index('blog_generation_jobs_user_idx').on(table.userId),
    statusIdx: index('blog_generation_jobs_status_idx').on(table.status),
  }),
);

// =============================================================================
// RELATIONS
// =============================================================================

export const topicClustersRelations = relations(topicClusters, ({ one, many }) => ({
  parentCluster: one(topicClusters, {
    fields: [topicClusters.parentClusterId],
    references: [topicClusters.id],
    relationName: 'cluster_hierarchy',
  }),
  childClusters: many(topicClusters, {
    relationName: 'cluster_hierarchy',
  }),
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  cluster: one(topicClusters, {
    fields: [blogPosts.clusterId],
    references: [topicClusters.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  citations: many(blogPostCitations),
}));

export const blogSourcesRelations = relations(blogSources, ({ one, many }) => ({
  verifier: one(users, {
    fields: [blogSources.verifiedBy],
    references: [users.id],
  }),
  citations: many(blogPostCitations),
}));

export const blogPostCitationsRelations = relations(blogPostCitations, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostCitations.postId],
    references: [blogPosts.id],
  }),
  source: one(blogSources, {
    fields: [blogPostCitations.sourceId],
    references: [blogSources.id],
  }),
}));

export const blogGenerationJobsRelations = relations(blogGenerationJobs, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogGenerationJobs.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogGenerationJobs.userId],
    references: [users.id],
  }),
  cluster: one(topicClusters, {
    fields: [blogGenerationJobs.clusterId],
    references: [topicClusters.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type TopicCluster = InferSelectModel<typeof topicClusters>;
export type NewTopicCluster = InferInsertModel<typeof topicClusters>;

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type NewBlogPost = InferInsertModel<typeof blogPosts>;

export type BlogSource = InferSelectModel<typeof blogSources>;
export type NewBlogSource = InferInsertModel<typeof blogSources>;

export type BlogPostCitation = InferSelectModel<typeof blogPostCitations>;
export type NewBlogPostCitation = InferInsertModel<typeof blogPostCitations>;

export type BlogGenerationJob = InferSelectModel<typeof blogGenerationJobs>;
export type NewBlogGenerationJob = InferInsertModel<typeof blogGenerationJobs>;

// Enum type exports
export type BlogPostStatus = 'draft' | 'generating' | 'review' | 'scheduled' | 'published' | 'archived';
export type ContentSource = 'ai_generated' | 'human_written' | 'ai_assisted' | 'imported';
export type ClusterType = 'pillar' | 'cluster' | 'supporting';
export type SourceStatus = 'pending' | 'verified' | 'stale' | 'broken' | 'rejected';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default generation configuration
 */
export const DEFAULT_GENERATION_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  targetWordCount: 2000,
  style: 'professional',
  persona: 'market analyst',
  includeCharts: true,
  researchDepth: 'standard' as const,
};

/**
 * Source reliability thresholds
 */
export const SOURCE_RELIABILITY = {
  trusted: 80, // TCGPlayer, official sources
  reliable: 60, // Established blogs, forums
  moderate: 40, // Community sources
  low: 20, // Social media, unverified
} as const;

/**
 * Generation status progression
 */
export const GENERATION_STEPS = [
  'pending',
  'researching',
  'gathering_sources',
  'writing_outline',
  'writing_content',
  'adding_citations',
  'generating_metadata',
  'review',
  'completed',
] as const;
