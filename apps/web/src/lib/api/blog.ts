/**
 * Blog API Data Service
 *
 * Server-side data fetching functions for the database-driven blog.
 * Connects Drizzle ORM to Next.js Server Components for SSR/ISR.
 *
 * Implements the Topic Cluster SEO model:
 * - Pillar pages as comprehensive topic hubs
 * - Cluster content linking back to pillars
 * - Citation tracking for transparency
 *
 * @see packages/db/src/schema/blogPosts.ts for schema
 * @see apps/web/app/blog/[slug]/page.tsx for usage
 */

import { db } from '@/db';
import { eq, desc, and, asc, sql } from 'drizzle-orm';
import { cache } from 'react';
import {
  blogPosts,
  blogClusters,
  type BlogPost,
  type BlogCluster,
  type BlogPostCitation,
  type BlogPostAuthor,
  type BlogPostSeoData,
} from '@apex/db/schema';

// =============================================================================
// Types for API responses
// =============================================================================

/**
 * Full post with cluster and citations
 */
export interface BlogPostWithCluster extends BlogPost {
  cluster: BlogCluster | null;
}

/**
 * Post preview for listing pages (without full content)
 */
export interface BlogPostPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  postType: 'pillar' | 'cluster' | 'standalone';
  author: BlogPostAuthor;
  tags: string[];
  heroImage: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: Date | null;
  cluster: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

/**
 * Cluster with all its posts
 */
export interface ClusterWithPosts extends BlogCluster {
  posts: BlogPostPreview[];
  pillarPost: BlogPostPreview | null;
}

/**
 * Related posts in the same cluster for sidebar
 */
export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  postType: 'pillar' | 'cluster' | 'standalone';
  excerpt: string | null;
  readingTimeMinutes: number;
}

// =============================================================================
// Data Fetching Functions
// =============================================================================

/**
 * Get a single post by slug with cluster and citations
 *
 * Used by the dynamic [slug] page for SSR.
 * Cached with React cache() for deduplication within a request.
 */
export const getPostBySlug = cache(async (slug: string): Promise<BlogPostWithCluster | null> => {
  try {
    const result = await db
      .select({
        post: blogPosts,
        cluster: blogClusters,
      })
      .from(blogPosts)
      .leftJoin(blogClusters, eq(blogPosts.clusterId, blogClusters.id))
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.status, 'published')
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { post, cluster } = result[0];

    // Increment view count (fire and forget)
    incrementViewCount(post.id).catch(console.error);

    return {
      ...post,
      cluster,
    };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
});

/**
 * Get all published posts for the index page
 *
 * Returns previews grouped by cluster for the Topic Cluster layout.
 */
export const getAllPosts = cache(async (): Promise<BlogPostPreview[]> => {
  try {
    const result = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        postType: blogPosts.postType,
        author: blogPosts.author,
        tags: blogPosts.tags,
        heroImage: blogPosts.heroImage,
        wordCount: blogPosts.wordCount,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        clusterId: blogPosts.clusterId,
        clusterName: blogClusters.name,
        clusterSlug: blogClusters.slug,
        clusterColor: blogClusters.color,
      })
      .from(blogPosts)
      .leftJoin(blogClusters, eq(blogPosts.clusterId, blogClusters.id))
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));

    return result.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      postType: row.postType as 'pillar' | 'cluster' | 'standalone',
      author: (row.author as BlogPostAuthor) || { name: 'Apex Intelligence Team' },
      tags: (row.tags as string[]) || [],
      heroImage: row.heroImage,
      wordCount: row.wordCount || 0,
      readingTimeMinutes: row.readingTimeMinutes || 0,
      publishedAt: row.publishedAt,
      cluster: row.clusterId
        ? {
            id: row.clusterId,
            name: row.clusterName!,
            slug: row.clusterSlug!,
            color: row.clusterColor,
          }
        : null,
    }));
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }
});

/**
 * Get posts grouped by cluster for the index page
 *
 * Returns clusters with their pillar page and cluster content.
 */
export const getPostsGroupedByCluster = cache(async (): Promise<{
  clusters: ClusterWithPosts[];
  standalonePosts: BlogPostPreview[];
}> => {
  try {
    // Fetch all clusters
    const clusters = await db
      .select()
      .from(blogClusters)
      .orderBy(asc(blogClusters.displayOrder));

    // Fetch all published posts
    const posts = await getAllPosts();

    // Group posts by cluster
    const clustersWithPosts: ClusterWithPosts[] = clusters.map((cluster) => {
      const clusterPosts = posts.filter((p) => p.cluster?.id === cluster.id);
      const pillarPost = clusterPosts.find((p) => p.postType === 'pillar') || null;
      const otherPosts = clusterPosts.filter((p) => p.postType !== 'pillar');

      return {
        ...cluster,
        posts: otherPosts,
        pillarPost,
      };
    });

    // Get standalone posts (not in any cluster)
    const standalonePosts = posts.filter((p) => !p.cluster);

    return {
      clusters: clustersWithPosts.filter((c) => c.posts.length > 0 || c.pillarPost),
      standalonePosts,
    };
  } catch (error) {
    console.error('Error fetching posts grouped by cluster:', error);
    return { clusters: [], standalonePosts: [] };
  }
});

/**
 * Get related posts in the same cluster
 *
 * Used by ClusterSidebar to show contextual navigation.
 */
export const getRelatedPostsInCluster = cache(
  async (clusterId: string, currentPostId: string): Promise<RelatedPost[]> => {
    try {
      const result = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          postType: blogPosts.postType,
          excerpt: blogPosts.excerpt,
          readingTimeMinutes: blogPosts.readingTimeMinutes,
          clusterOrder: blogPosts.clusterOrder,
        })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.clusterId, clusterId),
            eq(blogPosts.status, 'published')
          )
        )
        .orderBy(asc(blogPosts.clusterOrder), desc(blogPosts.publishedAt));

      return result
        .filter((post) => post.id !== currentPostId)
        .map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          postType: post.postType as 'pillar' | 'cluster' | 'standalone',
          excerpt: post.excerpt,
          readingTimeMinutes: post.readingTimeMinutes || 0,
        }));
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }
  }
);

/**
 * Get pillar post for a cluster
 *
 * Returns the main pillar page for a cluster, used in sidebar.
 */
export const getPillarPostForCluster = cache(
  async (clusterId: string): Promise<RelatedPost | null> => {
    try {
      const result = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          postType: blogPosts.postType,
          excerpt: blogPosts.excerpt,
          readingTimeMinutes: blogPosts.readingTimeMinutes,
        })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.clusterId, clusterId),
            eq(blogPosts.postType, 'pillar'),
            eq(blogPosts.status, 'published')
          )
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const post = result[0];
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        postType: post.postType as 'pillar' | 'cluster' | 'standalone',
        excerpt: post.excerpt,
        readingTimeMinutes: post.readingTimeMinutes || 0,
      };
    } catch (error) {
      console.error('Error fetching pillar post:', error);
      return null;
    }
  }
);

/**
 * Get cluster by slug
 */
export const getClusterBySlug = cache(async (slug: string): Promise<BlogCluster | null> => {
  try {
    const result = await db
      .select()
      .from(blogClusters)
      .where(eq(blogClusters.slug, slug))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching cluster by slug:', error);
    return null;
  }
});

/**
 * Get all clusters
 */
export const getAllClusters = cache(async (): Promise<BlogCluster[]> => {
  try {
    return await db
      .select()
      .from(blogClusters)
      .orderBy(asc(blogClusters.displayOrder));
  } catch (error) {
    console.error('Error fetching all clusters:', error);
    return [];
  }
});

/**
 * Get posts by cluster slug
 */
export const getPostsByCluster = cache(async (clusterSlug: string): Promise<BlogPostPreview[]> => {
  try {
    const cluster = await getClusterBySlug(clusterSlug);
    if (!cluster) return [];

    const posts = await getAllPosts();
    return posts.filter((p) => p.cluster?.slug === clusterSlug);
  } catch (error) {
    console.error('Error fetching posts by cluster:', error);
    return [];
  }
});

/**
 * Get recent posts (for homepage widget, etc.)
 */
export const getRecentPosts = cache(async (limit: number = 5): Promise<BlogPostPreview[]> => {
  try {
    const posts = await getAllPosts();
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    return [];
  }
});

/**
 * Get all post slugs for static generation
 */
export const getAllPostSlugs = cache(async (): Promise<string[]> => {
  try {
    const result = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    return result.map((r) => r.slug);
  } catch (error) {
    console.error('Error fetching post slugs:', error);
    return [];
  }
});

// =============================================================================
// Mutation Functions (for admin/CMS)
// =============================================================================

/**
 * Increment view count for a post
 * Fire-and-forget operation
 */
async function incrementViewCount(postId: string): Promise<void> {
  try {
    await db
      .update(blogPosts)
      .set({
        viewCount: sql`${blogPosts.viewCount} + 1`,
      })
      .where(eq(blogPosts.id, postId));
  } catch (error) {
    // Silent fail - view counts are not critical
    console.error('Error incrementing view count:', error);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Format citations for display
 */
export function formatCitations(citations: BlogPostCitation[]): BlogPostCitation[] {
  return citations.map((citation, index) => ({
    ...citation,
    id: citation.id || String(index + 1),
  }));
}

/**
 * Generate JSON-LD structured data for a blog post
 * Optimized for LLM discovery (LLMO)
 */
export function generateBlogPostJsonLd(
  post: BlogPostWithCluster,
  baseUrl: string
): Record<string, unknown> {
  const author = (post.author as BlogPostAuthor) || { name: 'Apex Intelligence Team' };
  const citations = (post.citations as BlogPostCitation[]) || [];
  const seoData = post.seoData as BlogPostSeoData | null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.role && { jobTitle: author.role }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    image: post.heroImage
      ? `${baseUrl}${post.heroImage}`
      : seoData?.ogImage || `${baseUrl}/api/og?slug=${post.slug}`,
    articleSection: post.cluster?.name || 'Market Analysis',
    keywords: ((post.tags as string[]) || []).join(', '),
    wordCount: post.wordCount || 0,
    // Citation information for transparency and LLM attribution
    citation: citations.map((citation) => ({
      '@type': 'CreativeWork',
      name: citation.source,
      url: citation.url,
      ...(citation.publisher && { publisher: citation.publisher }),
      ...(citation.accessedAt && { dateAccessed: citation.accessedAt }),
    })),
    // Cluster/topic information for topic authority
    ...(post.cluster && {
      isPartOf: {
        '@type': 'CreativeWorkSeries',
        name: post.cluster.name,
        url: `${baseUrl}/blog/cluster/${post.cluster.slug}`,
      },
    }),
  };
}
