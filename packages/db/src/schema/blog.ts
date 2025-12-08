/**
 * Blog Schema - Perplexity-Style Blog with Topic Clusters
 *
 * Implements a content management system designed for:
 * - Topic Cluster SEO strategy (pillar content + supporting posts)
 * - Perplexity-style citation sourcing with verified references
 * - LLMO (Large Language Model Optimization) with JSON-LD structured data
 * - Pro subscription gating for premium content
 *
 * Tables:
 * - clusters: Topic clusters / SEO pillars (e.g., "TCG Investing 101")
 * - posts: Blog content with Markdown/MDX storage
 * - citations: Perplexity-style sourcing with relevance scoring
 *
 * @module blog
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// CLUSTERS TABLE (Topic Cluster / SEO Pillar)
// =============================================================================

/**
 * Topic clusters represent SEO pillars that group related content.
 * Each cluster has a name, slug for URL routing, and optional description.
 *
 * Example clusters:
 * - "TCG Investing 101"
 * - "Pokemon Card Grading Guide"
 * - "Market Analysis Deep Dives"
 */
export const clusters = pgTable(
  'clusters',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Core content
    name: text('name').notNull(), // e.g., "TCG Investing 101"
    slug: text('slug').notNull().unique(), // URL-friendly identifier
    description: text('description'), // Optional description for SEO

    // Lifecycle timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Slug lookup for URL routing
    slugIdx: index('clusters_slug_idx').on(table.slug),
  }),
);

// =============================================================================
// POSTS TABLE (Blog Content)
// =============================================================================

/**
 * Blog posts store the actual content with full SEO and LLMO support.
 *
 * Features:
 * - Markdown/MDX content storage for flexible rendering
 * - AI summary for previews and search
 * - Premium content gating via is_premium flag
 * - JSON-LD structured data in meta_schema for AI search optimization
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Cluster relationship
    clusterId: uuid('cluster_id').references(() => clusters.id, { onDelete: 'set null' }),

    // Core content
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(), // SEO-friendly URL slug
    content: text('content').notNull(), // Markdown/MDX storage
    summary: text('summary'), // AI-generated summary for previews

    // Subscription gating
    isPremium: boolean('is_premium').default(false).notNull(), // Pro subscription gate

    // LLMO/AI Search Optimization
    metaSchema: jsonb('meta_schema').$type<{
      '@context'?: string;
      '@type'?: string;
      headline?: string;
      description?: string;
      author?: {
        '@type': string;
        name: string;
      };
      datePublished?: string;
      dateModified?: string;
      image?: string;
      [key: string]: unknown;
    }>(), // JSON-LD structured data for AI search

    // Lifecycle timestamps
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Cluster lookup for topic grouping
    clusterIdx: index('posts_cluster_idx').on(table.clusterId),

    // Slug lookup for URL routing
    slugIdx: index('posts_slug_idx').on(table.slug),

    // Published posts query (for feed)
    publishedIdx: index('posts_published_idx').on(table.publishedAt),

    // Premium content filtering
    premiumIdx: index('posts_premium_idx').on(table.isPremium),
  }),
);

// =============================================================================
// CITATIONS TABLE (Perplexity-Style Sourcing)
// =============================================================================

/**
 * Citations provide Perplexity-style source references for posts.
 *
 * Features:
 * - Source attribution with name and URL
 * - Internal relevance scoring (1-100) for quality metrics
 * - Verification status for editorial review
 * - Cascade deletion when parent post is removed
 */
export const citations = pgTable(
  'citations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Post relationship
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),

    // Source information
    sourceName: text('source_name').notNull(), // e.g., "eBay Sold Listings"
    sourceUrl: text('source_url'), // Optional URL to source

    // Quality metrics
    relevanceScore: integer('relevance_score'), // 1-100 internal quality metric
    isVerified: boolean('is_verified').default(true).notNull(), // Editorial verification

    // Lifecycle timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Post lookup for fetching all citations
    postIdx: index('citations_post_idx').on(table.postId),

    // Relevance sorting
    relevanceIdx: index('citations_relevance_idx').on(table.relevanceScore),
  }),
);

// =============================================================================
// RELATIONS
// =============================================================================

/**
 * Cluster relations - one cluster has many posts
 */
export const clustersRelations = relations(clusters, ({ many }) => ({
  posts: many(posts),
}));

/**
 * Post relations - belongs to cluster, has many citations
 */
export const postsRelations = relations(posts, ({ one, many }) => ({
  cluster: one(clusters, {
    fields: [posts.clusterId],
    references: [clusters.id],
  }),
  citations: many(citations),
}));

/**
 * Citation relations - belongs to post
 */
export const citationsRelations = relations(citations, ({ one }) => ({
  post: one(posts, {
    fields: [citations.postId],
    references: [posts.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

// Cluster types
export type Cluster = InferSelectModel<typeof clusters>;
export type NewCluster = InferInsertModel<typeof clusters>;

// Post types
export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

// Citation types
export type Citation = InferSelectModel<typeof citations>;
export type NewCitation = InferInsertModel<typeof citations>;

// JSON-LD schema type for meta_schema field
export type PostMetaSchema = {
  '@context'?: string;
  '@type'?: string;
  headline?: string;
  description?: string;
  author?: {
    '@type': string;
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  [key: string]: unknown;
};
