import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { db } from '@/lib/db';
import {
  commonsUserProfiles,
  commonsResources,
  commonsResourceVotes,
  commonsCollections,
  commonsCollectionItems,
  commonsProposals,
  commonsProposalVotes,
  commonsRcTransactions,
  commonsModerationFlags,
  commonsDownloads,
  commonsViews,
  users,
  RC_REASON_CODES,
  RC_AMOUNTS,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
} from '@apex/db';
import { eq, and, desc, asc, sql, gte, lte, ilike, or, inArray, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const resourceFiltersSchema = z.object({
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  resourceType: z.enum(['lesson_plan', 'worksheet', 'video', 'article', 'presentation', 'assessment', 'template', 'other']).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'flagged', 'archived']).optional(),
  contributorId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

const sortOptionsSchema = z.enum(['newest', 'oldest', 'popular', 'top_rated', 'most_downloaded']);

const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

const createResourceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1).max(100),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  resourceType: z.enum(['lesson_plan', 'worksheet', 'video', 'article', 'presentation', 'assessment', 'template', 'other']),
  files: z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
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
});

const createProposalSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(10000),
  category: z.enum(['policy', 'feature', 'moderation', 'other']),
  endsAt: z.string().datetime(),
  quorumRequired: z.number().int().positive().default(100),
  minReputation: z.number().int().nonnegative().default(50),
});

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

const flagResourceSchema = z.object({
  resourceId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  reasonCode: z.enum(['spam', 'inappropriate', 'copyright', 'misinformation', 'low_quality', 'other']),
  description: z.string().max(2000).optional(),
});

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

  // Create new profile
  const [newProfile] = await db
    .insert(commonsUserProfiles)
    .values({ userId })
    .returning();

  return newProfile;
}

async function awardReputationCredits(
  profileId: string,
  reasonCode: keyof typeof RC_REASON_CODES,
  referenceType?: string,
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  const amount = RC_AMOUNTS[RC_REASON_CODES[reasonCode]] ?? 0;
  if (amount === 0) return;

  // Get current balance
  const [profile] = await db
    .select({ reputationCredits: commonsUserProfiles.reputationCredits })
    .from(commonsUserProfiles)
    .where(eq(commonsUserProfiles.id, profileId));

  const newBalance = (profile?.reputationCredits ?? 0) + amount;

  // Use transaction for atomic update
  await db.transaction(async (tx) => {
    // Record transaction
    await tx.insert(commonsRcTransactions).values({
      userId: profileId,
      amount,
      balance: newBalance,
      reason: RC_REASON_CODES[reasonCode],
      reasonCode: RC_REASON_CODES[reasonCode],
      referenceType,
      referenceId,
      metadata,
    });

    // Update balance and potentially level
    const newLevel = getContributorLevel(newBalance);
    await tx
      .update(commonsUserProfiles)
      .set({
        reputationCredits: newBalance,
        contributorLevel: newLevel,
      })
      .where(eq(commonsUserProfiles.id, profileId));
  });

  return { amount, newBalance };
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

export const apexCommonsRouter = router({
  // ===========================================================================
  // PROFILE PROCEDURES
  // ===========================================================================

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getOrCreateUserProfile(ctx.userId);
    return profile;
  }),

  getPublicProfile: publicProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [profile] = await db
        .select({
          id: commonsUserProfiles.id,
          bio: commonsUserProfiles.bio,
          subjects: commonsUserProfiles.subjects,
          gradeLevels: commonsUserProfiles.gradeLevels,
          school: commonsUserProfiles.school,
          location: commonsUserProfiles.location,
          reputationCredits: commonsUserProfiles.reputationCredits,
          contributorLevel: commonsUserProfiles.contributorLevel,
          totalResources: commonsUserProfiles.totalResources,
          totalUpvotesReceived: commonsUserProfiles.totalUpvotesReceived,
          totalDownloads: commonsUserProfiles.totalDownloads,
          isVerifiedTeacher: commonsUserProfiles.isVerifiedTeacher,
          createdAt: commonsUserProfiles.createdAt,
        })
        .from(commonsUserProfiles)
        .where(eq(commonsUserProfiles.id, input.profileId));

      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }

      return profile;
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      bio: z.string().max(1000).optional(),
      subjects: z.array(z.string()).optional(),
      gradeLevels: z.array(z.string()).optional(),
      school: z.string().max(200).optional(),
      location: z.string().max(100).optional(),
      preferences: z.object({
        emailNotifications: z.boolean(),
        newResourceAlerts: z.boolean(),
        weeklyDigest: z.boolean(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const [updated] = await db
        .update(commonsUserProfiles)
        .set(input)
        .where(eq(commonsUserProfiles.id, profile.id))
        .returning();

      return updated;
    }),

  // ===========================================================================
  // RESOURCE PROCEDURES
  // ===========================================================================

  listResources: publicProcedure
    .input(z.object({
      filters: resourceFiltersSchema.optional(),
      search: z.string().optional(),
      sort: sortOptionsSchema.default('newest'),
      pagination: paginationSchema.default({ page: 1, limit: 20 }),
    }))
    .query(async ({ input }) => {
      const { filters, search, sort, pagination } = input;
      const conditions = [];

      // Only show approved resources by default for public listing
      conditions.push(eq(commonsResources.status, 'approved'));

      if (filters?.subject) {
        conditions.push(eq(commonsResources.subject, filters.subject));
      }
      if (filters?.gradeLevel) {
        conditions.push(eq(commonsResources.gradeLevel, filters.gradeLevel));
      }
      if (filters?.resourceType) {
        conditions.push(eq(commonsResources.resourceType, filters.resourceType));
      }
      if (filters?.category) {
        conditions.push(eq(commonsResources.category, filters.category));
      }
      if (filters?.contributorId) {
        conditions.push(eq(commonsResources.contributorId, filters.contributorId));
      }

      // Search in title and description
      if (search) {
        conditions.push(
          or(
            ilike(commonsResources.title, `%${search}%`),
            ilike(commonsResources.description, `%${search}%`)
          )
        );
      }

      // Build order by clause
      let orderBy;
      switch (sort) {
        case 'oldest':
          orderBy = asc(commonsResources.publishedAt);
          break;
        case 'popular':
          orderBy = desc(commonsResources.views);
          break;
        case 'top_rated':
          orderBy = desc(commonsResources.upvotes);
          break;
        case 'most_downloaded':
          orderBy = desc(commonsResources.downloads);
          break;
        case 'newest':
        default:
          orderBy = desc(commonsResources.publishedAt);
      }

      const offset = (pagination.page - 1) * pagination.limit;

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(commonsResources)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get resources with contributor info
      const resources = await db
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
          downloads: commonsResources.downloads,
          views: commonsResources.views,
          tags: commonsResources.tags,
          estimatedDuration: commonsResources.estimatedDuration,
          difficulty: commonsResources.difficulty,
          publishedAt: commonsResources.publishedAt,
          contributorId: commonsResources.contributorId,
        })
        .from(commonsResources)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(pagination.limit)
        .offset(offset);

      return {
        resources,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }),

  getResource: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
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
        })
        .from(commonsUserProfiles)
        .where(eq(commonsUserProfiles.id, resource.contributorId));

      // Get base user info
      const [user] = contributor ? await db
        .select({ name: users.name, image: users.image })
        .from(users)
        .innerJoin(commonsUserProfiles, eq(commonsUserProfiles.userId, users.id))
        .where(eq(commonsUserProfiles.id, contributor.id)) : [null];

      return {
        ...resource,
        contributor: contributor ? {
          ...contributor,
          name: user?.name ?? 'Anonymous',
          image: user?.image,
        } : null,
      };
    }),

  createResource: protectedProcedure
    .input(createResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Check if user can contribute (must be teacher role or higher)
      if (profile.role === 'user' && !profile.isVerifiedTeacher) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only verified teachers can contribute resources',
        });
      }

      const [resource] = await db
        .insert(commonsResources)
        .values({
          contributorId: profile.id,
          ...input,
          status: 'pending', // New resources go to pending for review
        })
        .returning();

      // Award RC for creating resource
      await awardReputationCredits(
        profile.id,
        'RESOURCE_CREATED',
        'resource',
        resource.id
      );

      // Update total resources count
      await db
        .update(commonsUserProfiles)
        .set({ totalResources: sql`${commonsUserProfiles.totalResources} + 1` })
        .where(eq(commonsUserProfiles.id, profile.id));

      return resource;
    }),

  updateResource: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: createResourceSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Get existing resource
      const [existing] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.id));

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      // Only contributor or moderator/admin can update
      if (existing.contributorId !== profile.id && !['moderator', 'admin'].includes(profile.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this resource' });
      }

      const [updated] = await db
        .update(commonsResources)
        .set(input.data)
        .where(eq(commonsResources.id, input.id))
        .returning();

      return updated;
    }),

  submitForReview: protectedProcedure
    .input(z.object({ resourceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId));

      if (!resource) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      if (resource.contributorId !== profile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      if (resource.status !== 'draft') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Resource already submitted' });
      }

      const [updated] = await db
        .update(commonsResources)
        .set({ status: 'pending' })
        .where(eq(commonsResources.id, input.resourceId))
        .returning();

      return updated;
    }),

  // ===========================================================================
  // VOTING PROCEDURES
  // ===========================================================================

  voteResource: protectedProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      voteType: z.enum(['up', 'down']),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Check if already voted
      const [existingVote] = await db
        .select()
        .from(commonsResourceVotes)
        .where(
          and(
            eq(commonsResourceVotes.resourceId, input.resourceId),
            eq(commonsResourceVotes.userId, profile.id)
          )
        );

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId));

      if (!resource) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      // Can't vote on own resource
      if (resource.contributorId === profile.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot vote on your own resource' });
      }

      if (existingVote) {
        if (existingVote.voteType === input.voteType) {
          // Remove vote
          await db
            .delete(commonsResourceVotes)
            .where(eq(commonsResourceVotes.id, existingVote.id));

          // Update resource counts
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

          return { action: 'removed', voteType: null };
        } else {
          // Change vote
          await db
            .update(commonsResourceVotes)
            .set({ voteType: input.voteType })
            .where(eq(commonsResourceVotes.id, existingVote.id));

          // Update resource counts
          await db
            .update(commonsResources)
            .set({
              upvotes: input.voteType === 'up'
                ? sql`${commonsResources.upvotes} + 1`
                : sql`${commonsResources.upvotes} - 1`,
              downvotes: input.voteType === 'down'
                ? sql`${commonsResources.downvotes} + 1`
                : sql`${commonsResources.downvotes} - 1`,
            })
            .where(eq(commonsResources.id, input.resourceId));

          // Award/deduct RC for contributor
          const rcReason = input.voteType === 'up' ? 'UPVOTE_RECEIVED' : 'DOWNVOTE_RECEIVED';
          await awardReputationCredits(
            resource.contributorId,
            rcReason,
            'resource',
            input.resourceId
          );

          return { action: 'changed', voteType: input.voteType };
        }
      } else {
        // New vote
        await db.insert(commonsResourceVotes).values({
          resourceId: input.resourceId,
          userId: profile.id,
          voteType: input.voteType,
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

        // Award RC for contributor
        const rcReason = input.voteType === 'up' ? 'UPVOTE_RECEIVED' : 'DOWNVOTE_RECEIVED';
        await awardReputationCredits(
          resource.contributorId,
          rcReason,
          'resource',
          input.resourceId
        );

        // Update contributor's total upvotes if upvote
        if (input.voteType === 'up') {
          await db
            .update(commonsUserProfiles)
            .set({ totalUpvotesReceived: sql`${commonsUserProfiles.totalUpvotesReceived} + 1` })
            .where(eq(commonsUserProfiles.id, resource.contributorId));
        }

        return { action: 'added', voteType: input.voteType };
      }
    }),

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

  // ===========================================================================
  // DOWNLOAD/VIEW TRACKING
  // ===========================================================================

  trackDownload: protectedProcedure
    .input(z.object({ resourceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Record download
      await db.insert(commonsDownloads).values({
        resourceId: input.resourceId,
        userId: profile.id,
      });

      // Update resource download count
      await db
        .update(commonsResources)
        .set({ downloads: sql`${commonsResources.downloads} + 1` })
        .where(eq(commonsResources.id, input.resourceId));

      // Get resource to award RC to contributor
      const [resource] = await db
        .select({ contributorId: commonsResources.contributorId })
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId));

      if (resource && resource.contributorId !== profile.id) {
        await awardReputationCredits(
          resource.contributorId,
          'DOWNLOAD_RECEIVED',
          'resource',
          input.resourceId
        );

        // Update contributor's total downloads
        await db
          .update(commonsUserProfiles)
          .set({ totalDownloads: sql`${commonsUserProfiles.totalDownloads} + 1` })
          .where(eq(commonsUserProfiles.id, resource.contributorId));
      }

      return { success: true };
    }),

  trackView: publicProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Dedupe by session
      if (input.sessionId) {
        const [existing] = await db
          .select()
          .from(commonsViews)
          .where(
            and(
              eq(commonsViews.resourceId, input.resourceId),
              eq(commonsViews.sessionId, input.sessionId)
            )
          )
          .limit(1);

        if (existing) {
          return { success: true, deduplicated: true };
        }
      }

      // Record view
      await db.insert(commonsViews).values({
        resourceId: input.resourceId,
        sessionId: input.sessionId,
      });

      // Update resource view count
      await db
        .update(commonsResources)
        .set({ views: sql`${commonsResources.views} + 1` })
        .where(eq(commonsResources.id, input.resourceId));

      return { success: true, deduplicated: false };
    }),

  // ===========================================================================
  // COLLECTION PROCEDURES
  // ===========================================================================

  listCollections: protectedProcedure
    .input(z.object({
      pagination: paginationSchema.default({ page: 1, limit: 20 }),
    }))
    .query(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);
      const offset = (input.pagination.page - 1) * input.pagination.limit;

      const [{ total }] = await db
        .select({ total: count() })
        .from(commonsCollections)
        .where(eq(commonsCollections.userId, profile.id));

      const collections = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.userId, profile.id))
        .orderBy(desc(commonsCollections.updatedAt))
        .limit(input.pagination.limit)
        .offset(offset);

      return {
        collections,
        pagination: {
          page: input.pagination.page,
          limit: input.pagination.limit,
          total,
          totalPages: Math.ceil(total / input.pagination.limit),
        },
      };
    }),

  getCollection: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.id));

      if (!collection) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Collection not found' });
      }

      // Get resources in collection
      const items = await db
        .select({
          resource: commonsResources,
          order: commonsCollectionItems.order,
          addedAt: commonsCollectionItems.addedAt,
        })
        .from(commonsCollectionItems)
        .innerJoin(commonsResources, eq(commonsCollectionItems.resourceId, commonsResources.id))
        .where(eq(commonsCollectionItems.collectionId, input.id))
        .orderBy(asc(commonsCollectionItems.order));

      return {
        ...collection,
        resources: items,
      };
    }),

  createCollection: protectedProcedure
    .input(createCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const [collection] = await db
        .insert(commonsCollections)
        .values({
          userId: profile.id,
          ...input,
        })
        .returning();

      return collection;
    }),

  addToCollection: protectedProcedure
    .input(z.object({
      collectionId: z.string().uuid(),
      resourceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Verify collection ownership
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.collectionId));

      if (!collection || collection.userId !== profile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      // Check if already in collection
      const [existing] = await db
        .select()
        .from(commonsCollectionItems)
        .where(
          and(
            eq(commonsCollectionItems.collectionId, input.collectionId),
            eq(commonsCollectionItems.resourceId, input.resourceId)
          )
        );

      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Resource already in collection' });
      }

      // Get max order
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${commonsCollectionItems.order}), 0)` })
        .from(commonsCollectionItems)
        .where(eq(commonsCollectionItems.collectionId, input.collectionId));

      await db.insert(commonsCollectionItems).values({
        collectionId: input.collectionId,
        resourceId: input.resourceId,
        order: (maxOrder ?? 0) + 1,
      });

      return { success: true };
    }),

  removeFromCollection: protectedProcedure
    .input(z.object({
      collectionId: z.string().uuid(),
      resourceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Verify collection ownership
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.collectionId));

      if (!collection || collection.userId !== profile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      await db
        .delete(commonsCollectionItems)
        .where(
          and(
            eq(commonsCollectionItems.collectionId, input.collectionId),
            eq(commonsCollectionItems.resourceId, input.resourceId)
          )
        );

      return { success: true };
    }),

  // ===========================================================================
  // GOVERNANCE PROCEDURES
  // ===========================================================================

  listProposals: publicProcedure
    .input(z.object({
      status: z.enum(['active', 'passed', 'rejected', 'expired']).optional(),
      pagination: paginationSchema.default({ page: 1, limit: 20 }),
    }))
    .query(async ({ input }) => {
      const conditions = [];

      if (input.status) {
        conditions.push(eq(commonsProposals.status, input.status));
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit;

      const [{ total }] = await db
        .select({ total: count() })
        .from(commonsProposals)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const proposals = await db
        .select()
        .from(commonsProposals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(commonsProposals.createdAt))
        .limit(input.pagination.limit)
        .offset(offset);

      return {
        proposals,
        pagination: {
          page: input.pagination.page,
          limit: input.pagination.limit,
          total,
          totalPages: Math.ceil(total / input.pagination.limit),
        },
      };
    }),

  getProposal: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [proposal] = await db
        .select()
        .from(commonsProposals)
        .where(eq(commonsProposals.id, input.id));

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      return proposal;
    }),

  createProposal: protectedProcedure
    .input(createProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Check reputation requirement
      if (profile.reputationCredits < 50) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Need at least 50 RC to create proposals',
        });
      }

      const [proposal] = await db
        .insert(commonsProposals)
        .values({
          authorId: profile.id,
          ...input,
          endsAt: new Date(input.endsAt),
        })
        .returning();

      // Deduct RC for creating proposal
      await awardReputationCredits(
        profile.id,
        'PROPOSAL_CREATED',
        'proposal',
        proposal.id
      );

      return proposal;
    }),

  voteProposal: protectedProcedure
    .input(z.object({
      proposalId: z.string().uuid(),
      vote: z.enum(['for', 'against', 'abstain']),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Get proposal
      const [proposal] = await db
        .select()
        .from(commonsProposals)
        .where(eq(commonsProposals.id, input.proposalId));

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      if (proposal.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Proposal is not active' });
      }

      if (new Date(proposal.endsAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Voting has ended' });
      }

      // Check reputation requirement
      if (profile.reputationCredits < proposal.minReputation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Need at least ${proposal.minReputation} RC to vote on this proposal`,
        });
      }

      // Check if already voted
      const [existingVote] = await db
        .select()
        .from(commonsProposalVotes)
        .where(
          and(
            eq(commonsProposalVotes.proposalId, input.proposalId),
            eq(commonsProposalVotes.userId, profile.id)
          )
        );

      if (existingVote) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already voted on this proposal' });
      }

      // Calculate vote weight based on reputation
      const weight = Math.floor(Math.log10(profile.reputationCredits + 1)) + 1;

      await db.insert(commonsProposalVotes).values({
        proposalId: input.proposalId,
        userId: profile.id,
        vote: input.vote,
        weight,
      });

      // Update proposal vote counts
      const updateField = input.vote === 'for' ? 'votesFor' :
        input.vote === 'against' ? 'votesAgainst' : 'votesAbstain';

      await db
        .update(commonsProposals)
        .set({
          [updateField]: sql`${commonsProposals[updateField]} + ${weight}`,
        })
        .where(eq(commonsProposals.id, input.proposalId));

      return { success: true, weight };
    }),

  // ===========================================================================
  // MODERATION PROCEDURES
  // ===========================================================================

  flagResource: protectedProcedure
    .input(flagResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Check if already flagged by this user
      const [existing] = await db
        .select()
        .from(commonsModerationFlags)
        .where(
          and(
            eq(commonsModerationFlags.resourceId, input.resourceId),
            eq(commonsModerationFlags.reporterId, profile.id),
            eq(commonsModerationFlags.status, 'open')
          )
        );

      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already flagged this resource' });
      }

      const [flag] = await db
        .insert(commonsModerationFlags)
        .values({
          resourceId: input.resourceId,
          reporterId: profile.id,
          reason: input.reason,
          reasonCode: input.reasonCode,
          description: input.description,
        })
        .returning();

      return flag;
    }),

  // Moderator-only: Review resource
  reviewResource: protectedProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      decision: z.enum(['approved', 'rejected']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Check moderator role
      if (!['moderator', 'admin'].includes(profile.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Moderator access required' });
      }

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId));

      if (!resource) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      }

      const [updated] = await db
        .update(commonsResources)
        .set({
          status: input.decision,
          reviewedBy: profile.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes,
          publishedAt: input.decision === 'approved' ? new Date() : null,
        })
        .where(eq(commonsResources.id, input.resourceId))
        .returning();

      // Award or deduct RC for contributor
      const rcReason = input.decision === 'approved' ? 'RESOURCE_APPROVED' : 'RESOURCE_REJECTED';
      await awardReputationCredits(
        resource.contributorId,
        rcReason,
        'resource',
        input.resourceId
      );

      return updated;
    }),

  // ===========================================================================
  // STATS/DASHBOARD
  // ===========================================================================

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getOrCreateUserProfile(ctx.userId);

    // Get user's resource stats
    const resourceStats = await db
      .select({
        total: count(),
        totalViews: sql<number>`COALESCE(SUM(${commonsResources.views}), 0)`,
        totalDownloads: sql<number>`COALESCE(SUM(${commonsResources.downloads}), 0)`,
        totalUpvotes: sql<number>`COALESCE(SUM(${commonsResources.upvotes}), 0)`,
      })
      .from(commonsResources)
      .where(eq(commonsResources.contributorId, profile.id));

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(commonsRcTransactions)
      .where(eq(commonsRcTransactions.userId, profile.id))
      .orderBy(desc(commonsRcTransactions.createdAt))
      .limit(10);

    // Get pending resources count (for moderators)
    let pendingResourcesCount = 0;
    if (['moderator', 'admin'].includes(profile.role)) {
      const [{ count: pending }] = await db
        .select({ count: count() })
        .from(commonsResources)
        .where(eq(commonsResources.status, 'pending'));
      pendingResourcesCount = pending;
    }

    return {
      profile,
      resourceStats: resourceStats[0],
      recentTransactions,
      pendingResourcesCount,
    };
  }),

  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['reputation', 'resources', 'downloads', 'upvotes']),
      limit: z.number().int().positive().max(100).default(10),
    }))
    .query(async ({ input }) => {
      let orderBy;
      switch (input.type) {
        case 'resources':
          orderBy = desc(commonsUserProfiles.totalResources);
          break;
        case 'downloads':
          orderBy = desc(commonsUserProfiles.totalDownloads);
          break;
        case 'upvotes':
          orderBy = desc(commonsUserProfiles.totalUpvotesReceived);
          break;
        case 'reputation':
        default:
          orderBy = desc(commonsUserProfiles.reputationCredits);
      }

      const profiles = await db
        .select({
          id: commonsUserProfiles.id,
          contributorLevel: commonsUserProfiles.contributorLevel,
          reputationCredits: commonsUserProfiles.reputationCredits,
          totalResources: commonsUserProfiles.totalResources,
          totalUpvotesReceived: commonsUserProfiles.totalUpvotesReceived,
          totalDownloads: commonsUserProfiles.totalDownloads,
          isVerifiedTeacher: commonsUserProfiles.isVerifiedTeacher,
        })
        .from(commonsUserProfiles)
        .orderBy(orderBy)
        .limit(input.limit);

      // Get user names
      const userIds = profiles.map(p => p.id);
      const profileUserIds = await db
        .select({ id: commonsUserProfiles.id, userId: commonsUserProfiles.userId })
        .from(commonsUserProfiles)
        .where(inArray(commonsUserProfiles.id, userIds));

      const baseUsers = await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(inArray(users.id, profileUserIds.map(p => p.userId)));

      const userMap = new Map(baseUsers.map(u => [u.id, u]));
      const profileUserMap = new Map(profileUserIds.map(p => [p.id, p.userId]));

      return profiles.map((p, index) => {
        const userId = profileUserMap.get(p.id);
        const user = userId ? userMap.get(userId) : null;
        return {
          rank: index + 1,
          ...p,
          name: user?.name ?? 'Anonymous',
          image: user?.image,
        };
      });
    }),
});
