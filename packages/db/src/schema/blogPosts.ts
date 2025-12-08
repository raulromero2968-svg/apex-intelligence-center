/**
 * Blog Posts Schema - Topic Cluster SEO Architecture
 *
 * Implements the "Pillar Page + Cluster Content" model for SEO authority building.
 * Supports:
 * - Hierarchical content structure (Pillar Pages vs Cluster Articles)
 * - Citation tracking with Perplexity-style footnotes
 * - MDX content storage in database
 *
 * SEO Strategy Reference: Topic Cluster Model
 * - Pillar Pages: Comprehensive guides that cover a broad topic
 * - Cluster Content: Specific articles that link back to the pillar
 *
 * @see https://blog.hubspot.com/marketing/topic-clusters-seo
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Post type determines the SEO hierarchy
 * - pillar: Comprehensive guide covering a broad topic (main hub page)
 * - cluster: Specific article linking back to its pillar
 * - standalone: Independent article without cluster affiliation
 */
export const blogPostTypeEnum = pgEnum('blog_post_type', [
  'pillar',
  'cluster',
  'standalone',
]);

/**
 * Post status for editorial workflow
 */
export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'review',
  'published',
  'archived',
]);

/**
 * Citation source type for categorization
 */
export const citationSourceTypeEnum = pgEnum('citation_source_type', [
  'web',
  'database',
  'document',
  'api',
  'research_paper',
  'news_article',
  'social_media',
]);

// =============================================================================
// BLOG CLUSTERS (Topic Hubs)
// =============================================================================

/**
 * Blog Clusters table - Topic groupings for SEO authority
 *
 * Each cluster represents a topic hub with:
 * - One pillar page (comprehensive guide)
 * - Multiple cluster articles (specific content)
 *
 * Example: "Pokemon Market Analysis" cluster
 * - Pillar: "Complete Guide to Pokemon Card Investing"
 * - Clusters: "How Grading Affects Value", "Best Sets to Invest In", etc.
 */
export const blogClusters = pgTable(
  'blog_clusters',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Core cluster info
    name: text('name').notNull(), // "Pokemon Market Analysis"
    slug: text('slug').notNull().unique(), // "pokemon-market-analysis"
    description: text('description'), // Brief description for SEO

    // Visual identity
    icon: text('icon'), // Lucide icon name
    color: text('color'), // Tailwind color class (e.g., "cyan", "purple")

    // SEO metadata
    seoTitle: text('seo_title'), // Override for <title>
    seoDescription: text('seo_description'), // Override for meta description

    // Ordering
    displayOrder: integer('display_order').default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('idx_blog_clusters_slug').on(table.slug),
    orderIdx: index('idx_blog_clusters_order').on(table.displayOrder),
  }),
);

// =============================================================================
// BLOG POSTS
// =============================================================================

/**
 * Citation structure for inline footnotes
 * Matches the Perplexity-style UI in Citation.tsx
 */
export interface BlogPostCitation {
  id: string; // Unique citation ID (e.g., "1", "2")
  source: string; // Source name (e.g., "TCGPlayer", "PSA")
  url?: string; // Direct link to source
  quote?: string; // Relevant quote from source
  preview?: string; // Preview text for tooltip
  publisher?: string; // Publisher name
  accessedAt?: string; // ISO timestamp when source was accessed
  type?: 'web' | 'database' | 'document' | 'api' | 'research_paper' | 'news_article' | 'social_media';
  verified?: boolean; // Whether source has been verified
}

/**
 * Author information for byline display
 */
export interface BlogPostAuthor {
  name: string;
  role?: string;
  avatar?: string;
  bio?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * SEO metadata for structured data
 */
export interface BlogPostSeoData {
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Blog Posts table
 *
 * Core content table storing MDX content from database.
 * Integrates with clusters for topic hierarchy.
 */
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Core content
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'), // Short summary for cards/previews (max 280 chars)
    content: text('content').notNull(), // MDX content

    // Post classification
    postType: blogPostTypeEnum('post_type').default('standalone').notNull(),
    status: blogPostStatusEnum('status').default('draft').notNull(),

    // Cluster relationship
    clusterId: uuid('cluster_id').references(() => blogClusters.id, { onDelete: 'set null' }),

    // Author info (stored as JSONB for flexibility)
    author: jsonb('author').$type<BlogPostAuthor>().default({
      name: 'Apex Intelligence Team',
    }),

    // Citations for Perplexity-style footnotes
    citations: jsonb('citations').$type<BlogPostCitation[]>().default([]),

    // Tags for categorization
    tags: jsonb('tags').$type<string[]>().default([]),

    // SEO metadata
    seoData: jsonb('seo_data').$type<BlogPostSeoData>(),

    // Featured image
    heroImage: text('hero_image'),

    // Reading metrics
    wordCount: integer('word_count').default(0),
    readingTimeMinutes: integer('reading_time_minutes').default(0),

    // Engagement metrics
    viewCount: integer('view_count').default(0).notNull(),
    shareCount: integer('share_count').default(0).notNull(),
    likeCount: integer('like_count').default(0).notNull(),

    // Display order within cluster (for pillar pages: 0, clusters ordered after)
    clusterOrder: integer('cluster_order').default(0),

    // Timestamps
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Fast lookup by slug
    slugIdx: index('idx_blog_posts_slug').on(table.slug),

    // Cluster queries: "Get all posts in this cluster"
    clusterIdx: index('idx_blog_posts_cluster').on(table.clusterId),

    // Feed queries: "Get all published posts, newest first"
    publishedIdx: index('idx_blog_posts_published').on(table.status, table.publishedAt),

    // Type queries: "Get all pillar pages"
    typeIdx: index('idx_blog_posts_type').on(table.postType),

    // Cluster ordering: "Get posts in order within cluster"
    clusterOrderIdx: index('idx_blog_posts_cluster_order').on(table.clusterId, table.clusterOrder),
  }),
);

// =============================================================================
// BLOG CITATIONS (Normalized for complex queries)
// =============================================================================

/**
 * Separate citations table for complex citation queries
 * Optional - citations can also be stored as JSONB in blogPosts
 *
 * Use cases:
 * - "Find all posts citing TCGPlayer"
 * - "Build a bibliography of all sources"
 * - "Verify source freshness across all content"
 */
export const blogCitations = pgTable(
  'blog_citations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Parent post
    postId: uuid('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),

    // Citation details
    citationId: text('citation_id').notNull(), // Reference ID within post (e.g., "1")
    source: text('source').notNull(), // Source name
    url: text('url'),
    quote: text('quote'),
    preview: text('preview'),
    publisher: text('publisher'),
    sourceType: citationSourceTypeEnum('source_type').default('web'),
    verified: boolean('verified').default(false),

    // Timestamps
    accessedAt: timestamp('accessed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index('idx_blog_citations_post').on(table.postId),
    sourceIdx: index('idx_blog_citations_source').on(table.source),
    verifiedIdx: index('idx_blog_citations_verified').on(table.verified),
  }),
);

// =============================================================================
// RELATIONS
// =============================================================================

export const blogClustersRelations = relations(blogClusters, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  cluster: one(blogClusters, {
    fields: [blogPosts.clusterId],
    references: [blogClusters.id],
  }),
  normalizedCitations: many(blogCitations),
}));

export const blogCitationsRelations = relations(blogCitations, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogCitations.postId],
    references: [blogPosts.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type BlogCluster = InferSelectModel<typeof blogClusters>;
export type NewBlogCluster = InferInsertModel<typeof blogClusters>;

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type NewBlogPost = InferInsertModel<typeof blogPosts>;

export type BlogCitation = InferSelectModel<typeof blogCitations>;
export type NewBlogCitation = InferInsertModel<typeof blogCitations>;

// Enum type exports
export type BlogPostType = 'pillar' | 'cluster' | 'standalone';
export type BlogPostStatus = 'draft' | 'review' | 'published' | 'archived';
export type CitationSourceType =
  | 'web'
  | 'database'
  | 'document'
  | 'api'
  | 'research_paper'
  | 'news_article'
  | 'social_media';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate reading time from word count
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get word count from MDX content
 * Strips MDX/JSX syntax before counting
 */
export function getWordCount(content: string): number {
  // Remove MDX imports and exports
  const withoutImports = content.replace(/^(import|export)\s+.*$/gm, '');
  // Remove JSX tags
  const withoutJsx = withoutImports.replace(/<[^>]+>/g, '');
  // Remove code blocks
  const withoutCode = withoutJsx.replace(/```[\s\S]*?```/g, '');
  // Count words
  return withoutCode.trim().split(/\s+/).filter(Boolean).length;
}
