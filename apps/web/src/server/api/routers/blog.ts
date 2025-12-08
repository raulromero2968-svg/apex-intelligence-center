/**
 * Blog Router - tRPC endpoints for Perplexity-style blog engine
 *
 * Provides API for:
 * - AI content generation
 * - Topic cluster management
 * - Blog post CRUD operations
 * - Source/citation management
 * - Hybrid content queries (MDX + Database)
 *
 * @module routers/blog
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { eq, desc, and, sql, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  blogPosts,
  blogSources,
  blogPostCitations,
  blogGenerationJobs,
  topicClusters,
  type NewBlogPost,
  type NewBlogSource,
  type NewBlogGenerationJob,
  type NewTopicCluster,
} from '@apex/db/schema';
import {
  generateBlogPost,
  generateTraceHash,
  type GenerationConfig,
  type GenerationProgress,
} from '@/lib/blog';
import { createHash } from 'crypto';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/mdx';

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

const GenerationConfigSchema = z.object({
  topic: z.string().min(3).max(500),
  clusterId: z.string().uuid().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  targetWordCount: z.number().min(500).max(10000).optional(),
  style: z.enum(['professional', 'conversational', 'technical', 'beginner-friendly']).optional(),
  persona: z.string().optional(),
  includeCharts: z.boolean().optional(),
  includeCardTickers: z.boolean().optional(),
  researchDepth: z.enum(['quick', 'standard', 'deep']).optional(),
  targetKeywords: z.array(z.string()).optional(),
  game: z.enum(['pokemon', 'mtg', 'lorcana', 'yugioh', 'one_piece', 'flesh_and_blood']).optional(),
});

const TopicClusterSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['pillar', 'cluster', 'supporting']).optional(),
  parentClusterId: z.string().uuid().optional(),
  primaryKeyword: z.string().min(2).max(100),
  secondaryKeywords: z.array(z.string()).optional(),
  searchVolume: z.number().int().optional(),
  keywordDifficulty: z.number().int().min(0).max(100).optional(),
  targetWordCount: z.number().int().optional(),
  contentBrief: z.string().optional(),
  targetAudience: z.string().optional(),
});

const BlogPostUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'generating', 'review', 'scheduled', 'published', 'archived']).optional(),
  scheduledAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// =============================================================================
// ROUTER
// =============================================================================

export const blogRouter = router({
  // ===========================================================================
  // GENERATION ENDPOINTS
  // ===========================================================================

  /**
   * Start AI blog generation job
   */
  generate: protectedProcedure
    .input(GenerationConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, traceId } = ctx;

      // Create generation job record
      const jobId = await db
        .insert(blogGenerationJobs)
        .values({
          userId,
          topic: input.topic,
          clusterId: input.clusterId,
          config: input as any,
          status: 'pending',
          progress: 0,
        })
        .returning({ id: blogGenerationJobs.id });

      // Execute generation (could be moved to background job)
      // For now, run synchronously with progress updates
      try {
        await db
          .update(blogGenerationJobs)
          .set({ status: 'researching', progress: 10, startedAt: new Date() })
          .where(eq(blogGenerationJobs.id, jobId[0].id));

        const result = await generateBlogPost(input as GenerationConfig, async (progress) => {
          // Update job progress
          await db
            .update(blogGenerationJobs)
            .set({
              status: progress.status,
              progress: progress.progress,
              currentStep: progress.currentStep,
            })
            .where(eq(blogGenerationJobs.id, jobId[0].id));
        });

        // Create blog post from result
        const traceHash = generateTraceHash(result.content);

        const [newPost] = await db
          .insert(blogPosts)
          .values({
            title: result.title,
            subtitle: result.subtitle,
            slug: result.slug,
            content: result.content,
            summary: result.summary,
            excerpt: result.excerpt,
            tableOfContents: result.tableOfContents,
            seoTitle: result.seoTitle,
            seoDescription: result.seoDescription,
            tags: result.suggestedTags,
            status: 'review',
            contentSource: 'ai_generated',
            clusterId: input.clusterId,
            authorId: userId,
            sourceCount: result.citations.length,
            citationCount: result.citations.length,
            aiMetadata: result.aiMetadata,
            traceHash,
            game: input.game || 'pokemon',
          })
          .returning();

        // Insert sources and citations
        for (const citation of result.citations) {
          const urlHash = createHash('sha256').update(citation.url).digest('hex');

          // Upsert source
          const [source] = await db
            .insert(blogSources)
            .values({
              url: citation.url,
              urlHash,
              title: citation.title,
              publisher: citation.publisher,
              excerpt: citation.excerpt,
              status: 'pending',
            })
            .onConflictDoNothing()
            .returning();

          const sourceId = source?.id || (
            await db.select({ id: blogSources.id }).from(blogSources).where(eq(blogSources.urlHash, urlHash))
          )[0]?.id;

          if (sourceId) {
            await db.insert(blogPostCitations).values({
              postId: newPost.id,
              sourceId,
              citationNumber: citation.number,
              claimText: citation.claimText,
              relevanceScore: String(citation.relevanceScore),
            });
          }
        }

        // Update job as completed
        await db
          .update(blogGenerationJobs)
          .set({
            status: 'completed',
            progress: 100,
            postId: newPost.id,
            sourcesFound: result.citations.length,
            sourcesUsed: result.citations.length,
            completedAt: new Date(),
          })
          .where(eq(blogGenerationJobs.id, jobId[0].id));

        return {
          jobId: jobId[0].id,
          postId: newPost.id,
          slug: newPost.slug,
          traceId,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await db
          .update(blogGenerationJobs)
          .set({
            status: 'failed',
            errorMessage,
            errorDetails: { error: String(error) },
          })
          .where(eq(blogGenerationJobs.id, jobId[0].id));

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Generation failed: ${errorMessage}`,
        });
      }
    }),

  /**
   * Get generation job status
   */
  getJobStatus: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [job] = await db
        .select()
        .from(blogGenerationJobs)
        .where(eq(blogGenerationJobs.id, input.jobId));

      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      return job;
    }),

  // ===========================================================================
  // BLOG POST CRUD
  // ===========================================================================

  /**
   * Get all blog posts (hybrid: MDX + Database)
   */
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'generating', 'review', 'scheduled', 'published', 'archived']).optional(),
        category: z.string().optional(),
        game: z.string().optional(),
        clusterId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        includesMdx: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      // Default to published posts for public queries
      if (input.status) {
        conditions.push(eq(blogPosts.status, input.status));
      } else {
        conditions.push(eq(blogPosts.status, 'published'));
      }

      if (input.category) {
        conditions.push(eq(blogPosts.category, input.category));
      }

      if (input.game) {
        conditions.push(eq(blogPosts.game, input.game));
      }

      if (input.clusterId) {
        conditions.push(eq(blogPosts.clusterId, input.clusterId));
      }

      // Get database posts
      const dbPosts = await db
        .select()
        .from(blogPosts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Optionally merge with MDX posts
      let allPosts = dbPosts.map((p) => ({
        ...p,
        source: 'database' as const,
      }));

      if (input.includesMdx && input.status === 'published') {
        try {
          const mdxPosts = await getAllBlogPosts();
          const mdxFormatted = mdxPosts.map((p) => ({
            id: `mdx-${p.slug}`,
            slug: p.slug,
            title: p.frontmatter.title,
            subtitle: null,
            content: null,
            summary: p.frontmatter.description || null,
            excerpt: p.frontmatter.description?.substring(0, 280) || null,
            seoTitle: p.frontmatter.title,
            seoDescription: p.frontmatter.description || null,
            status: 'published' as const,
            contentSource: 'human_written' as const,
            authorName: p.frontmatter.author,
            authorRole: p.frontmatter.authorRole || null,
            tags: p.frontmatter.tags || [],
            category: 'blog',
            game: 'pokemon',
            publishedAt: new Date(p.frontmatter.date),
            createdAt: new Date(p.frontmatter.date),
            updatedAt: new Date(p.frontmatter.date),
            readTime: p.readingTime?.minutes || 5,
            heroImage: p.frontmatter.hero || null,
            source: 'mdx' as const,
          }));

          allPosts = [...mdxFormatted, ...allPosts].sort(
            (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
          );
        } catch (e) {
          // MDX loading failed, return only DB posts
          console.error('Failed to load MDX posts:', e);
        }
      }

      return {
        posts: allPosts.slice(input.offset, input.offset + input.limit),
        total: allPosts.length,
        hasMore: allPosts.length > input.offset + input.limit,
      };
    }),

  /**
   * Get single blog post by slug (hybrid)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // Try database first
      const [dbPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, input.slug));

      if (dbPost) {
        // Get citations
        const citations = await db
          .select({
            citation: blogPostCitations,
            source: blogSources,
          })
          .from(blogPostCitations)
          .innerJoin(blogSources, eq(blogPostCitations.sourceId, blogSources.id))
          .where(eq(blogPostCitations.postId, dbPost.id))
          .orderBy(blogPostCitations.citationNumber);

        return {
          ...dbPost,
          citations: citations.map((c) => ({
            number: c.citation.citationNumber,
            url: c.source.url,
            title: c.source.title,
            publisher: c.source.publisher,
            excerpt: c.source.excerpt,
          })),
          source: 'database' as const,
        };
      }

      // Try MDX
      const mdxPost = await getBlogPostBySlug(input.slug);
      if (mdxPost) {
        return {
          id: `mdx-${mdxPost.slug}`,
          slug: mdxPost.slug,
          title: mdxPost.frontmatter.title,
          content: mdxPost.content,
          summary: mdxPost.frontmatter.description,
          authorName: mdxPost.frontmatter.author,
          tags: mdxPost.frontmatter.tags || [],
          publishedAt: new Date(mdxPost.frontmatter.date),
          readTime: mdxPost.readingTime?.minutes || 5,
          heroImage: mdxPost.frontmatter.hero,
          citations: mdxPost.frontmatter.citationList || [],
          source: 'mdx' as const,
        };
      }

      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }),

  /**
   * Update blog post
   */
  update: protectedProcedure
    .input(BlogPostUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [existing] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, id));

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      const [updated] = await db
        .update(blogPosts)
        .set({
          ...updates,
          scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, id))
        .returning();

      return updated;
    }),

  /**
   * Publish a post
   */
  publish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(blogPosts)
        .set({
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      // Update cluster post count
      if (updated.clusterId) {
        await db.execute(sql`
          UPDATE topic_clusters
          SET post_count = post_count + 1
          WHERE id = ${updated.clusterId}
        `);
      }

      return updated;
    }),

  /**
   * Delete a post
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      return { success: true };
    }),

  // ===========================================================================
  // TOPIC CLUSTERS
  // ===========================================================================

  /**
   * Create topic cluster
   */
  createCluster: protectedProcedure
    .input(TopicClusterSchema)
    .mutation(async ({ input }) => {
      const slug =
        input.slug ||
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

      const [cluster] = await db
        .insert(topicClusters)
        .values({
          ...input,
          slug,
        } as NewTopicCluster)
        .returning();

      return cluster;
    }),

  /**
   * List topic clusters
   */
  listClusters: publicProcedure
    .input(
      z.object({
        type: z.enum(['pillar', 'cluster', 'supporting']).optional(),
        parentId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.type) {
        conditions.push(eq(topicClusters.type, input.type));
      }

      if (input.parentId) {
        conditions.push(eq(topicClusters.parentClusterId, input.parentId));
      }

      const clusters = await db
        .select()
        .from(topicClusters)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(topicClusters.postCount));

      return clusters;
    }),

  /**
   * Get cluster with its posts
   */
  getCluster: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [cluster] = await db
        .select()
        .from(topicClusters)
        .where(eq(topicClusters.slug, input.slug));

      if (!cluster) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cluster not found' });
      }

      const posts = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.clusterId, cluster.id), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt));

      const childClusters = await db
        .select()
        .from(topicClusters)
        .where(eq(topicClusters.parentClusterId, cluster.id));

      return {
        ...cluster,
        posts,
        childClusters,
      };
    }),

  // ===========================================================================
  // SEARCH
  // ===========================================================================

  /**
   * Search blog posts
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2).max(200),
        limit: z.number().int().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      // Full-text search on title, content, summary
      const results = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, 'published'),
            or(
              ilike(blogPosts.title, `%${input.query}%`),
              ilike(blogPosts.summary, `%${input.query}%`),
              sql`${blogPosts.tags}::text ILIKE ${'%' + input.query + '%'}`
            )
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);

      return results;
    }),

  // ===========================================================================
  // ANALYTICS
  // ===========================================================================

  /**
   * Increment view count
   */
  trackView: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      await db.execute(sql`
        UPDATE blog_posts
        SET view_count = view_count + 1
        WHERE slug = ${input.slug}
      `);

      return { success: true };
    }),

  /**
   * Get related posts
   */
  getRelated: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().int().min(1).max(10).optional().default(4),
      })
    )
    .query(async ({ input }) => {
      // Get the post to find its cluster and tags
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.postId));

      if (!post) {
        return [];
      }

      // Find posts in same cluster or with overlapping tags
      const related = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, 'published'),
            sql`${blogPosts.id} != ${input.postId}`,
            or(
              post.clusterId ? eq(blogPosts.clusterId, post.clusterId) : sql`false`,
              sql`${blogPosts.tags}::jsonb ?| ${sql.raw(`ARRAY[${(post.tags as string[] || []).map(t => `'${t}'`).join(',')}]`)}`
            )
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);

      return related;
    }),
});
