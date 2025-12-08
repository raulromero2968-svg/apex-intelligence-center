import { eq, desc, isNotNull, and, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  clusters,
  posts,
  citations,
  type Cluster,
  type NewCluster,
  type Post,
  type NewPost,
  type Citation,
  type NewCitation,
  type PostMetaSchema,
} from '../schema/blog';

/**
 * Blog Repository - Data Access Layer for Perplexity-Style Blog
 *
 * Provides type-safe CRUD operations for:
 * - Clusters (SEO topic pillars)
 * - Posts (blog content with LLMO support)
 * - Citations (Perplexity-style sourcing)
 *
 * @module blogRepo
 */

// =============================================================================
// CLUSTER OPERATIONS
// =============================================================================

/**
 * Create a new topic cluster.
 *
 * @param db - Drizzle database instance
 * @param data - Cluster data to insert
 * @returns The created cluster
 */
export async function createCluster(
  db: NodePgDatabase<Record<string, never>>,
  data: NewCluster
): Promise<Cluster> {
  const [inserted] = await db.insert(clusters).values(data).returning();
  return inserted;
}

/**
 * Get all clusters ordered by name.
 *
 * @param db - Drizzle database instance
 * @returns Array of all clusters
 */
export async function getAllClusters(
  db: NodePgDatabase<Record<string, never>>
): Promise<Cluster[]> {
  return db.select().from(clusters).orderBy(clusters.name);
}

/**
 * Find a cluster by its URL slug.
 *
 * @param db - Drizzle database instance
 * @param slug - The URL-friendly cluster identifier
 * @returns The cluster or undefined if not found
 */
export async function getClusterBySlug(
  db: NodePgDatabase<Record<string, never>>,
  slug: string
): Promise<Cluster | undefined> {
  const [cluster] = await db
    .select()
    .from(clusters)
    .where(eq(clusters.slug, slug))
    .limit(1);
  return cluster;
}

// =============================================================================
// POST OPERATIONS
// =============================================================================

/**
 * Create a new blog post.
 *
 * @param db - Drizzle database instance
 * @param data - Post data to insert
 * @returns The created post
 */
export async function createPost(
  db: NodePgDatabase<Record<string, never>>,
  data: NewPost
): Promise<Post> {
  const [inserted] = await db.insert(posts).values(data).returning();
  return inserted;
}

/**
 * Get all published posts ordered by publish date (newest first).
 *
 * @param db - Drizzle database instance
 * @param options - Query options
 * @param options.limit - Maximum number of posts to return (default: 50)
 * @param options.includePremium - Include premium posts (default: true)
 * @returns Array of published posts
 */
export async function getPublishedPosts(
  db: NodePgDatabase<Record<string, never>>,
  options: { limit?: number; includePremium?: boolean } = {}
): Promise<Post[]> {
  const { limit = 50, includePremium = true } = options;

  const conditions = [isNotNull(posts.publishedAt)];
  if (!includePremium) {
    conditions.push(eq(posts.isPremium, false));
  }

  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

/**
 * Find a post by its URL slug.
 *
 * @param db - Drizzle database instance
 * @param slug - The URL-friendly post identifier
 * @returns The post or undefined if not found
 */
export async function getPostBySlug(
  db: NodePgDatabase<Record<string, never>>,
  slug: string
): Promise<Post | undefined> {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  return post;
}

/**
 * Get a post with its cluster and citations.
 *
 * @param db - Drizzle database instance
 * @param slug - The URL-friendly post identifier
 * @returns Post with related data or null if not found
 */
export async function getPostWithRelations(
  db: NodePgDatabase<Record<string, never>>,
  slug: string
): Promise<{
  post: Post;
  cluster: Cluster | null;
  citations: Citation[];
} | null> {
  const post = await getPostBySlug(db, slug);
  if (!post) return null;

  const [cluster, postCitations] = await Promise.all([
    post.clusterId ? getClusterById(db, post.clusterId) : Promise.resolve(null),
    getCitationsByPostId(db, post.id),
  ]);

  return {
    post,
    cluster: cluster ?? null,
    citations: postCitations,
  };
}

/**
 * Get posts by cluster ID.
 *
 * @param db - Drizzle database instance
 * @param clusterId - The cluster UUID
 * @param limit - Maximum number of posts to return (default: 20)
 * @returns Array of posts in the cluster
 */
export async function getPostsByClusterId(
  db: NodePgDatabase<Record<string, never>>,
  clusterId: string,
  limit: number = 20
): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.clusterId, clusterId), isNotNull(posts.publishedAt)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

/**
 * Update a post's JSON-LD meta schema.
 *
 * @param db - Drizzle database instance
 * @param postId - The post UUID
 * @param metaSchema - The JSON-LD structured data
 * @returns The updated post
 */
export async function updatePostMetaSchema(
  db: NodePgDatabase<Record<string, never>>,
  postId: string,
  metaSchema: PostMetaSchema
): Promise<Post> {
  const [updated] = await db
    .update(posts)
    .set({ metaSchema })
    .where(eq(posts.id, postId))
    .returning();
  return updated;
}

/**
 * Publish a post by setting its publishedAt timestamp.
 *
 * @param db - Drizzle database instance
 * @param postId - The post UUID
 * @returns The published post
 */
export async function publishPost(
  db: NodePgDatabase<Record<string, never>>,
  postId: string
): Promise<Post> {
  const [published] = await db
    .update(posts)
    .set({ publishedAt: new Date() })
    .where(eq(posts.id, postId))
    .returning();
  return published;
}

// =============================================================================
// CITATION OPERATIONS
// =============================================================================

/**
 * Create a new citation for a post.
 *
 * @param db - Drizzle database instance
 * @param data - Citation data to insert
 * @returns The created citation
 */
export async function createCitation(
  db: NodePgDatabase<Record<string, never>>,
  data: NewCitation
): Promise<Citation> {
  const [inserted] = await db.insert(citations).values(data).returning();
  return inserted;
}

/**
 * Create multiple citations for a post.
 *
 * @param db - Drizzle database instance
 * @param data - Array of citation data to insert
 * @returns The created citations
 */
export async function createCitations(
  db: NodePgDatabase<Record<string, never>>,
  data: NewCitation[]
): Promise<Citation[]> {
  if (data.length === 0) return [];
  return db.insert(citations).values(data).returning();
}

/**
 * Get all citations for a post, ordered by relevance score.
 *
 * @param db - Drizzle database instance
 * @param postId - The post UUID
 * @returns Array of citations ordered by relevance
 */
export async function getCitationsByPostId(
  db: NodePgDatabase<Record<string, never>>,
  postId: string
): Promise<Citation[]> {
  return db
    .select()
    .from(citations)
    .where(eq(citations.postId, postId))
    .orderBy(desc(citations.relevanceScore));
}

/**
 * Get verified citations only.
 *
 * @param db - Drizzle database instance
 * @param postId - The post UUID
 * @returns Array of verified citations
 */
export async function getVerifiedCitations(
  db: NodePgDatabase<Record<string, never>>,
  postId: string
): Promise<Citation[]> {
  return db
    .select()
    .from(citations)
    .where(and(eq(citations.postId, postId), eq(citations.isVerified, true)))
    .orderBy(desc(citations.relevanceScore));
}

// =============================================================================
// LLMO / AI DISCOVERY OPERATIONS
// =============================================================================

/**
 * Get posts optimized for AI agent discovery (LLMO).
 * Returns posts with JSON-LD meta schemas for semantic search.
 *
 * @param db - Drizzle database instance
 * @param options - Query options
 * @param options.limit - Maximum number of posts (default: 100)
 * @param options.clusterId - Optional cluster filter
 * @returns Array of posts with meta schemas
 */
export async function getPostsForAIDiscovery(
  db: NodePgDatabase<Record<string, never>>,
  options: { limit?: number; clusterId?: string } = {}
): Promise<Post[]> {
  const { limit = 100, clusterId } = options;

  const conditions = [
    isNotNull(posts.publishedAt),
    isNotNull(posts.metaSchema),
  ];

  if (clusterId) {
    conditions.push(eq(posts.clusterId, clusterId));
  }

  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

/**
 * Search posts by keyword (full-text search on title and summary).
 *
 * @param db - Drizzle database instance
 * @param query - Search query string
 * @param limit - Maximum results (default: 20)
 * @returns Matching posts
 */
export async function searchPosts(
  db: NodePgDatabase<Record<string, never>>,
  query: string,
  limit: number = 20
): Promise<Post[]> {
  // Sanitize query for LIKE pattern
  const sanitizedQuery = `%${query.replace(/[%_]/g, '\\$&')}%`;

  const result = await db.execute(sql`
    SELECT * FROM posts
    WHERE published_at IS NOT NULL
    AND (
      title ILIKE ${sanitizedQuery}
      OR summary ILIKE ${sanitizedQuery}
    )
    ORDER BY published_at DESC
    LIMIT ${limit}
  `);

  return result.rows as Post[];
}

/**
 * Get market insights summary for AI agents.
 * Returns aggregated data suitable for semantic APIs.
 *
 * @param db - Drizzle database instance
 * @returns Summary of blog content for AI discovery
 */
export async function getMarketInsightsSummary(
  db: NodePgDatabase<Record<string, never>>
): Promise<{
  totalPosts: number;
  totalClusters: number;
  recentPosts: Post[];
  topClusters: Array<{ cluster: Cluster; postCount: number }>;
}> {
  // Execute counts and recent posts in parallel
  const [postCountResult, clusterCountResult, recentPosts, topClustersResult] =
    await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM posts WHERE published_at IS NOT NULL`),
      db.execute(sql`SELECT COUNT(*) as count FROM clusters`),
      getPublishedPosts(db, { limit: 10 }),
      db.execute(sql`
        SELECT
          c.*,
          COUNT(p.id) as post_count
        FROM clusters c
        LEFT JOIN posts p ON p.cluster_id = c.id AND p.published_at IS NOT NULL
        GROUP BY c.id
        ORDER BY post_count DESC
        LIMIT 5
      `),
    ]);

  const totalPosts = Number(postCountResult.rows[0]?.count ?? 0);
  const totalClusters = Number(clusterCountResult.rows[0]?.count ?? 0);

  const topClusters = topClustersResult.rows.map((row: Record<string, unknown>) => ({
    cluster: {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | null,
      createdAt: row.created_at as Date,
    },
    postCount: Number(row.post_count),
  }));

  return {
    totalPosts,
    totalClusters,
    recentPosts,
    topClusters,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find a cluster by ID.
 *
 * @param db - Drizzle database instance
 * @param id - The cluster UUID
 * @returns The cluster or undefined
 */
async function getClusterById(
  db: NodePgDatabase<Record<string, never>>,
  id: string
): Promise<Cluster | undefined> {
  const [cluster] = await db
    .select()
    .from(clusters)
    .where(eq(clusters.id, id))
    .limit(1);
  return cluster;
}
