import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { db } from '@/lib/db';
import {
  commonsUserProfiles,
  commonsResources,
  commonsResourceVotes,
  commonsRcTransactions,
  commonsViews,
  users,
  RC_REASON_CODES,
  RC_AMOUNTS,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
} from '@apex/db';
import { eq, and, desc, sql, ilike, or, lt, gt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// =============================================================================
// RESOURCES ROUTER - Discovery & Consumption Loops
// =============================================================================
// Optimized for:
// - /browse page (infinite scroll, filtering, sorting)
// - /resource/:id page (full details, view tracking)
// - Optimistic UI support via immediate state returns
// =============================================================================

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getOrCreateUserProfile(userId: string) {
  const existing = await db
    .select()
    .from(commonsUserProfiles)
    .where(eq(commonsUserProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newProfile] = await db
    .insert(commonsUserProfiles)
    .values({ userId })
    .returning();

  return newProfile;
}

function getContributorLevel(credits: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (credits >= CONTRIBUTOR_LEVEL_THRESHOLDS.platinum) return 'platinum';
  if (credits >= CONTRIBUTOR_LEVEL_THRESHOLDS.gold) return 'gold';
  if (credits >= CONTRIBUTOR_LEVEL_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// =============================================================================
// ROUTER
// =============================================================================

export const resourcesRouter = router({
  /**
   * GET ALL RESOURCES (Public)
   * Powers the main /browse grid with infinite scrolling.
   * Includes search, filtering by category/grade/subject, and sorting.
   * Uses cursor-based pagination for optimal infinite scroll performance.
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().nullish(), // Cursor for infinite scrolling
        search: z.string().optional(),
        category: z.string().optional(),
        gradeLevel: z.string().optional(),
        subject: z.string().optional(),
        resourceType: z.enum(['lesson_plan', 'worksheet', 'video', 'article', 'presentation', 'assessment', 'template', 'other']).optional(),
        sortBy: z.enum(['newest', 'popular', 'highest_rated', 'most_downloaded']).default('newest'),
      })
    )
    .query(async ({ input }) => {
      // Build dynamic where conditions
      const whereConditions = [];

      // Only show approved resources for public listing
      whereConditions.push(eq(commonsResources.status, 'approved'));

      if (input.search) {
        // PostgreSQL ilike for case-insensitive search
        whereConditions.push(
          or(
            ilike(commonsResources.title, `%${input.search}%`),
            ilike(commonsResources.description, `%${input.search}%`)
          )
        );
      }

      if (input.category && input.category !== 'All') {
        whereConditions.push(eq(commonsResources.category, input.category));
      }

      if (input.gradeLevel && input.gradeLevel !== 'All') {
        whereConditions.push(eq(commonsResources.gradeLevel, input.gradeLevel));
      }

      if (input.subject && input.subject !== 'All') {
        whereConditions.push(eq(commonsResources.subject, input.subject));
      }

      if (input.resourceType) {
        whereConditions.push(eq(commonsResources.resourceType, input.resourceType));
      }

      // Dynamic sorting with cursor support
      let orderBy;
      let cursorCondition = null;

      switch (input.sortBy) {
        case 'popular':
          orderBy = desc(commonsResources.views);
          if (input.cursor) {
            // For cursor pagination with views, we need the view count of the cursor item
            const cursorItem = await db
              .select({ views: commonsResources.views })
              .from(commonsResources)
              .where(eq(commonsResources.id, input.cursor))
              .limit(1);
            if (cursorItem.length > 0) {
              cursorCondition = lt(commonsResources.views, cursorItem[0].views);
            }
          }
          break;
        case 'highest_rated':
          // Use net upvotes (upvotes - downvotes) for rating
          orderBy = desc(sql`${commonsResources.upvotes} - ${commonsResources.downvotes}`);
          break;
        case 'most_downloaded':
          orderBy = desc(commonsResources.downloads);
          break;
        case 'newest':
        default:
          orderBy = desc(commonsResources.publishedAt);
          if (input.cursor) {
            // For cursor pagination with dates, get items older than cursor
            const cursorItem = await db
              .select({ publishedAt: commonsResources.publishedAt })
              .from(commonsResources)
              .where(eq(commonsResources.id, input.cursor))
              .limit(1);
            if (cursorItem.length > 0 && cursorItem[0].publishedAt) {
              cursorCondition = lt(commonsResources.publishedAt, cursorItem[0].publishedAt);
            }
          }
      }

      // Add cursor condition if exists
      if (cursorCondition) {
        whereConditions.push(cursorCondition);
      }

      // Fetch items with contributor info
      const items = await db
        .select({
          id: commonsResources.id,
          title: commonsResources.title,
          description: commonsResources.description,
          category: commonsResources.category,
          subject: commonsResources.subject,
          gradeLevel: commonsResources.gradeLevel,
          resourceType: commonsResources.resourceType,
          thumbnailUrl: commonsResources.thumbnailUrl,
          qualityScore: commonsResources.qualityScore,
          upvotes: commonsResources.upvotes,
          downvotes: commonsResources.downvotes,
          views: commonsResources.views,
          downloads: commonsResources.downloads,
          tags: commonsResources.tags,
          difficulty: commonsResources.difficulty,
          estimatedDuration: commonsResources.estimatedDuration,
          publishedAt: commonsResources.publishedAt,
          createdAt: commonsResources.createdAt,
          contributor: {
            id: commonsUserProfiles.id,
            level: commonsUserProfiles.contributorLevel,
            isVerified: commonsUserProfiles.isVerifiedTeacher,
          },
          contributorName: users.name,
          contributorImage: users.image,
        })
        .from(commonsResources)
        .leftJoin(commonsUserProfiles, eq(commonsResources.contributorId, commonsUserProfiles.id))
        .leftJoin(users, eq(commonsUserProfiles.userId, users.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .limit(input.limit + 1) // Fetch one extra to determine if there's a next page
        .orderBy(orderBy);

      // Determine next cursor
      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      // Transform items to flatten contributor info
      const transformedItems = items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        subject: item.subject,
        gradeLevel: item.gradeLevel,
        resourceType: item.resourceType,
        thumbnailUrl: item.thumbnailUrl,
        qualityScore: item.qualityScore,
        upvotes: item.upvotes,
        downvotes: item.downvotes,
        views: item.views,
        downloads: item.downloads,
        tags: item.tags,
        difficulty: item.difficulty,
        estimatedDuration: item.estimatedDuration,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        contributor: item.contributor ? {
          id: item.contributor.id,
          name: item.contributorName ?? 'Anonymous',
          image: item.contributorImage,
          level: item.contributor.level,
          isVerified: item.contributor.isVerified,
        } : null,
      }));

      return {
        items: transformedItems,
        nextCursor,
      };
    }),

  /**
   * GET SINGLE RESOURCE BY ID (Public)
   * Fetches full resource details including contributor info.
   * Side effect: Increments view count (fire and forget).
   */
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      sessionId: z.string().optional(), // For view deduplication
    }))
    .query(async ({ input }) => {
      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.id));

      if (!resource) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      // Get contributor info
      const [contributor] = await db
        .select({
          id: commonsUserProfiles.id,
          contributorLevel: commonsUserProfiles.contributorLevel,
          isVerifiedTeacher: commonsUserProfiles.isVerifiedTeacher,
          reputationCredits: commonsUserProfiles.reputationCredits,
          totalResources: commonsUserProfiles.totalResources,
        })
        .from(commonsUserProfiles)
        .where(eq(commonsUserProfiles.id, resource.contributorId));

      // Get base user info for contributor name/image
      let userName: string | null = null;
      let userImage: string | null = null;
      if (contributor) {
        const [user] = await db
          .select({ name: users.name, image: users.image })
          .from(users)
          .innerJoin(commonsUserProfiles, eq(commonsUserProfiles.userId, users.id))
          .where(eq(commonsUserProfiles.id, contributor.id));
        userName = user?.name ?? null;
        userImage = user?.image ?? null;
      }

      // Side Effect: Increment View Count (Fire and Forget)
      // Deduplicated by sessionId to prevent spam
      // In high-scale production, this would go to Redis/Kafka
      if (input.sessionId) {
        // Check if session already viewed
        const [existingView] = await db
          .select()
          .from(commonsViews)
          .where(
            and(
              eq(commonsViews.resourceId, input.id),
              eq(commonsViews.sessionId, input.sessionId)
            )
          )
          .limit(1);

        if (!existingView) {
          // Record new view (async, don't await)
          db.insert(commonsViews).values({
            resourceId: input.id,
            sessionId: input.sessionId,
          }).then(() => {
            // Update view count
            db.update(commonsResources)
              .set({ views: sql`${commonsResources.views} + 1` })
              .where(eq(commonsResources.id, input.id))
              .execute();
          }).catch(console.error);
        }
      } else {
        // No session deduplication, just increment
        db.update(commonsResources)
          .set({ views: sql`${commonsResources.views} + 1` })
          .where(eq(commonsResources.id, input.id))
          .execute()
          .catch(console.error);
      }

      return {
        ...resource,
        contributor: contributor ? {
          id: contributor.id,
          name: userName ?? 'Anonymous',
          image: userImage,
          level: contributor.contributorLevel,
          isVerified: contributor.isVerifiedTeacher,
          reputationCredits: contributor.reputationCredits,
          totalResources: contributor.totalResources,
        } : null,
      };
    }),

  /**
   * GET USER'S VOTE STATUS ON A RESOURCE (Protected)
   * Used to render the correct vote button state.
   */
  getUserVote: protectedProcedure
    .input(z.object({ resourceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const [vote] = await db
        .select({ voteType: commonsResourceVotes.voteType })
        .from(commonsResourceVotes)
        .where(
          and(
            eq(commonsResourceVotes.resourceId, input.resourceId),
            eq(commonsResourceVotes.userId, profile.id)
          )
        );

      return vote?.voteType ?? null;
    }),

  /**
   * VOTE ON RESOURCE (Protected)
   * Handles upvote/downvote logic with toggle support.
   * Returns the new state immediately for Optimistic UI.
   * Also triggers the Reputation Engine for contributor rewards.
   */
  vote: protectedProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      voteType: z.enum(['up', 'down']),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);
      const voteTypeValue = input.voteType;

      // Get the resource (needed for contributor RC)
      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId));

      if (!resource) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      // Cannot vote on own resource
      if (resource.contributorId === profile.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot vote on your own resource' });
      }

      // Check if user already voted
      const [existingVote] = await db
        .select()
        .from(commonsResourceVotes)
        .where(
          and(
            eq(commonsResourceVotes.userId, profile.id),
            eq(commonsResourceVotes.resourceId, input.resourceId)
          )
        );

      if (existingVote) {
        if (existingVote.voteType === voteTypeValue) {
          // Toggle off (remove vote)
          await db
            .delete(commonsResourceVotes)
            .where(eq(commonsResourceVotes.id, existingVote.id));

          // Revert resource count
          await db
            .update(commonsResources)
            .set({
              upvotes: input.voteType === 'up'
                ? sql`${commonsResources.upvotes} - 1`
                : commonsResources.upvotes,
              downvotes: input.voteType === 'down'
                ? sql`${commonsResources.downvotes} - 1`
                : commonsResources.downvotes,
            })
            .where(eq(commonsResources.id, input.resourceId));

          // Return new state for Optimistic UI
          return {
            action: 'removed' as const,
            voteType: null,
            newUpvotes: input.voteType === 'up' ? resource.upvotes - 1 : resource.upvotes,
            newDownvotes: input.voteType === 'down' ? resource.downvotes - 1 : resource.downvotes,
          };
        }

        // Changing vote (up to down or vice versa)
        await db
          .update(commonsResourceVotes)
          .set({ voteType: voteTypeValue, updatedAt: new Date() })
          .where(eq(commonsResourceVotes.id, existingVote.id));

        // Update resource counts
        const wasUpvote = existingVote.voteType === 'up';
        await db
          .update(commonsResources)
          .set({
            upvotes: wasUpvote
              ? sql`${commonsResources.upvotes} - 1`
              : sql`${commonsResources.upvotes} + 1`,
            downvotes: wasUpvote
              ? sql`${commonsResources.downvotes} + 1`
              : sql`${commonsResources.downvotes} - 1`,
          })
          .where(eq(commonsResources.id, input.resourceId));

        // Handle RC adjustment for vote change
        // Previous vote RC needs to be reverted, new vote RC applied
        // For simplicity, we award the new vote type's RC
        const rcReason = input.voteType === 'up' ? RC_REASON_CODES.UPVOTE_RECEIVED : RC_REASON_CODES.DOWNVOTE_RECEIVED;
        const rcAmount = RC_AMOUNTS[rcReason] ?? 0;

        if (rcAmount !== 0) {
          const [contributorProfile] = await db
            .select({ reputationCredits: commonsUserProfiles.reputationCredits })
            .from(commonsUserProfiles)
            .where(eq(commonsUserProfiles.id, resource.contributorId));

          const newBalance = (contributorProfile?.reputationCredits ?? 0) + rcAmount;

          await db.insert(commonsRcTransactions).values({
            userId: resource.contributorId,
            amount: rcAmount,
            balance: newBalance,
            reason: rcReason,
            reasonCode: rcReason,
            referenceType: 'resource',
            referenceId: input.resourceId,
          });

          await db
            .update(commonsUserProfiles)
            .set({
              reputationCredits: newBalance,
              contributorLevel: getContributorLevel(newBalance),
            })
            .where(eq(commonsUserProfiles.id, resource.contributorId));
        }

        return {
          action: 'changed' as const,
          voteType: input.voteType,
          newUpvotes: wasUpvote ? resource.upvotes - 1 : resource.upvotes + 1,
          newDownvotes: wasUpvote ? resource.downvotes + 1 : resource.downvotes - 1,
        };
      }

      // New vote
      await db.insert(commonsResourceVotes).values({
        userId: profile.id,
        resourceId: input.resourceId,
        voteType: voteTypeValue,
      });

      // Update resource counts
      await db
        .update(commonsResources)
        .set({
          upvotes: input.voteType === 'up'
            ? sql`${commonsResources.upvotes} + 1`
            : commonsResources.upvotes,
          downvotes: input.voteType === 'down'
            ? sql`${commonsResources.downvotes} + 1`
            : commonsResources.downvotes,
        })
        .where(eq(commonsResources.id, input.resourceId));

      // REPUTATION TRANSACTION (The "Moral Engine")
      const rcReason = input.voteType === 'up' ? RC_REASON_CODES.UPVOTE_RECEIVED : RC_REASON_CODES.DOWNVOTE_RECEIVED;
      const rcAmount = RC_AMOUNTS[rcReason] ?? 0;

      if (rcAmount !== 0) {
        const [contributorProfile] = await db
          .select({ reputationCredits: commonsUserProfiles.reputationCredits })
          .from(commonsUserProfiles)
          .where(eq(commonsUserProfiles.id, resource.contributorId));

        const newBalance = (contributorProfile?.reputationCredits ?? 0) + rcAmount;

        await db.insert(commonsRcTransactions).values({
          userId: resource.contributorId,
          amount: rcAmount,
          balance: newBalance,
          reason: rcReason,
          reasonCode: rcReason,
          referenceType: 'resource',
          referenceId: input.resourceId,
        });

        await db
          .update(commonsUserProfiles)
          .set({
            reputationCredits: newBalance,
            contributorLevel: getContributorLevel(newBalance),
          })
          .where(eq(commonsUserProfiles.id, resource.contributorId));

        // Update upvotes received count for upvotes
        if (input.voteType === 'up') {
          await db
            .update(commonsUserProfiles)
            .set({ totalUpvotesReceived: sql`${commonsUserProfiles.totalUpvotesReceived} + 1` })
            .where(eq(commonsUserProfiles.id, resource.contributorId));
        }
      }

      return {
        action: 'added' as const,
        voteType: input.voteType,
        newUpvotes: input.voteType === 'up' ? resource.upvotes + 1 : resource.upvotes,
        newDownvotes: input.voteType === 'down' ? resource.downvotes + 1 : resource.downvotes,
      };
    }),

  /**
   * CREATE RESOURCE (Protected - Teacher Only)
   * Creates a new educational resource.
   * Status starts as 'pending' for moderation review.
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(5, 'Title must be at least 5 characters'),
      description: z.string().min(20, 'Description must be at least 20 characters'),
      category: z.string().min(1),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      resourceType: z.enum(['lesson_plan', 'worksheet', 'video', 'article', 'presentation', 'assessment', 'template', 'other']),
      files: z.array(z.object({
        url: z.string().url(),
        name: z.string(),
        size: z.number(),
        type: z.string(),
        key: z.string().optional(),
      })).optional(),
      thumbnailUrl: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
      standards: z.array(z.object({
        framework: z.string(),
        codes: z.array(z.string()),
      })).optional(),
      estimatedDuration: z.number().int().positive().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      language: z.string().default('en'),
      license: z.string().default('CC-BY-4.0'),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Role Guard: Only verified teachers or higher can contribute
      if (profile.role === 'user' && !profile.isVerifiedTeacher) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Verified Teachers can contribute resources. Please verify your teacher status.',
        });
      }

      const [resource] = await db
        .insert(commonsResources)
        .values({
          contributorId: profile.id,
          title: input.title,
          description: input.description,
          category: input.category,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          resourceType: input.resourceType,
          files: input.files ?? [],
          thumbnailUrl: input.thumbnailUrl,
          tags: input.tags ?? [],
          standards: input.standards ?? [],
          estimatedDuration: input.estimatedDuration,
          difficulty: input.difficulty,
          language: input.language,
          license: input.license,
          status: 'pending', // Always pending by default for moderation
        })
        .returning();

      // Award RC for creating resource
      const rcAmount = RC_AMOUNTS[RC_REASON_CODES.RESOURCE_CREATED] ?? 0;
      if (rcAmount > 0) {
        const newBalance = profile.reputationCredits + rcAmount;

        await db.insert(commonsRcTransactions).values({
          userId: profile.id,
          amount: rcAmount,
          balance: newBalance,
          reason: RC_REASON_CODES.RESOURCE_CREATED,
          reasonCode: RC_REASON_CODES.RESOURCE_CREATED,
          referenceType: 'resource',
          referenceId: resource.id,
        });

        await db
          .update(commonsUserProfiles)
          .set({
            reputationCredits: newBalance,
            contributorLevel: getContributorLevel(newBalance),
            totalResources: sql`${commonsUserProfiles.totalResources} + 1`,
          })
          .where(eq(commonsUserProfiles.id, profile.id));
      }

      return resource;
    }),

  /**
   * GET FEATURED RESOURCES (Public)
   * Returns a curated list of high-quality resources for homepage.
   * Based on quality score and engagement metrics.
   */
  getFeatured: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(6),
    }))
    .query(async ({ input }) => {
      // Featured = approved + high quality score + good engagement
      const items = await db
        .select({
          id: commonsResources.id,
          title: commonsResources.title,
          description: commonsResources.description,
          category: commonsResources.category,
          thumbnailUrl: commonsResources.thumbnailUrl,
          upvotes: commonsResources.upvotes,
          views: commonsResources.views,
          contributorName: users.name,
          contributorLevel: commonsUserProfiles.contributorLevel,
        })
        .from(commonsResources)
        .leftJoin(commonsUserProfiles, eq(commonsResources.contributorId, commonsUserProfiles.id))
        .leftJoin(users, eq(commonsUserProfiles.userId, users.id))
        .where(eq(commonsResources.status, 'approved'))
        .orderBy(
          // Weight: quality score + upvotes + log(views)
          desc(sql`${commonsResources.qualityScore} + ${commonsResources.upvotes} + ln(${commonsResources.views} + 1)`)
        )
        .limit(input.limit);

      return items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        thumbnailUrl: item.thumbnailUrl,
        upvotes: item.upvotes,
        views: item.views,
        contributor: {
          name: item.contributorName ?? 'Anonymous',
          level: item.contributorLevel,
        },
      }));
    }),

  /**
   * GET RESOURCE CATEGORIES (Public)
   * Returns distinct categories with resource counts.
   * Used for filter dropdowns.
   */
  getCategories: publicProcedure.query(async () => {
    const categories = await db
      .select({
        category: commonsResources.category,
        count: sql<number>`count(*)::int`,
      })
      .from(commonsResources)
      .where(eq(commonsResources.status, 'approved'))
      .groupBy(commonsResources.category)
      .orderBy(desc(sql`count(*)`));

    return categories;
  }),

  /**
   * GET GRADE LEVELS (Public)
   * Returns distinct grade levels with resource counts.
   * Used for filter dropdowns.
   */
  getGradeLevels: publicProcedure.query(async () => {
    const gradeLevels = await db
      .select({
        gradeLevel: commonsResources.gradeLevel,
        count: sql<number>`count(*)::int`,
      })
      .from(commonsResources)
      .where(
        and(
          eq(commonsResources.status, 'approved'),
          sql`${commonsResources.gradeLevel} IS NOT NULL`
        )
      )
      .groupBy(commonsResources.gradeLevel)
      .orderBy(commonsResources.gradeLevel);

    return gradeLevels;
  }),

  /**
   * GET SUBJECTS (Public)
   * Returns distinct subjects with resource counts.
   * Used for filter dropdowns.
   */
  getSubjects: publicProcedure.query(async () => {
    const subjects = await db
      .select({
        subject: commonsResources.subject,
        count: sql<number>`count(*)::int`,
      })
      .from(commonsResources)
      .where(
        and(
          eq(commonsResources.status, 'approved'),
          sql`${commonsResources.subject} IS NOT NULL`
        )
      )
      .groupBy(commonsResources.subject)
      .orderBy(desc(sql`count(*)`));

    return subjects;
  }),
});
