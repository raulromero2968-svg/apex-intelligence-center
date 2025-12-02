/**
 * Apex Commons tRPC Router
 *
 * Handles all API operations for the educational resource library:
 * - Resource CRUD and browsing
 * - Collections management
 * - Governance proposals and voting
 * - User profiles and RC management
 * - Moderation workflows
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../init';
import { db } from '@/lib/db';
import {
  commonsProfiles,
  commonsResources,
  commonsResourceVotes,
  commonsCollections,
  commonsCollectionResources,
  commonsProposals,
  commonsProposalVotes,
  commonsRcTransactions,
  commonsModerationFlags,
  commonsComments,
  users,
  type CommonsRole,
} from '@/db/schema';
import { eq, and, or, desc, asc, sql, ilike, inArray } from 'drizzle-orm';

// =============================================================================
// Input Schemas
// =============================================================================

const browseResourcesInput = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  category: z.string().optional(),
  resourceType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional().default('approved'),
  sort: z.enum(['newest', 'popular', 'highestRated']).optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(20),
});

const createResourceInput = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['lessonPlan', 'worksheet', 'assessment', 'activity', 'other']),
  subject: z.enum(['math', 'science', 'english', 'history', 'art', 'pe', 'other']),
  gradeLevel: z.enum(['elementary', 'middle', 'high', 'college', 'professional']),
  resourceType: z.enum(['document', 'presentation', 'video', 'interactive', 'other']),
  files: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).min(1),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  standards: z.array(z.string()).optional().default([]),
  duration: z.number().positive().optional(),
});

const updateResourceInput = createResourceInput.partial().extend({
  id: z.string().uuid(),
});

const createCollectionInput = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional().default('private'),
  tags: z.array(z.string()).optional().default([]),
});

const createProposalInput = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(10).max(500),
  body: z.string().min(50).max(10000),
  category: z.enum(['policy', 'feature', 'content', 'moderation', 'other']),
  tags: z.array(z.string()).optional().default([]),
});

const updateProfileInput = z.object({
  bio: z.string().max(1000).optional(),
  subjects: z.array(z.string()).optional(),
  gradeLevel: z.string().optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get or create Commons profile for a user
 */
async function getOrCreateProfile(userId: string) {
  const existing = await db
    .select()
    .from(commonsProfiles)
    .where(eq(commonsProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new profile
  const [newProfile] = await db
    .insert(commonsProfiles)
    .values({ userId })
    .returning();

  return newProfile;
}

/**
 * Check if user has required role
 */
function hasRole(userRole: CommonsRole, requiredRole: CommonsRole): boolean {
  const hierarchy: Record<CommonsRole, number> = {
    user: 0,
    teacher: 1,
    moderator: 2,
    admin: 3,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Calculate contributor level based on RC
 */
function calculateContributorLevel(rc: number): string {
  if (rc >= 10000) return 'platinum';
  if (rc >= 2000) return 'gold';
  if (rc >= 500) return 'silver';
  return 'bronze';
}

/**
 * Award RC to a user
 */
async function awardRc(
  userId: string,
  amount: number,
  reason: string,
  meta?: Record<string, any>,
  resourceId?: string,
  proposalId?: string
) {
  // Insert transaction
  await db.insert(commonsRcTransactions).values({
    userId,
    amount,
    reason,
    meta: meta ?? {},
    resourceId,
    proposalId,
  });

  // Update profile RC
  const profile = await getOrCreateProfile(userId);
  const newRc = profile.reputationCredits + amount;
  const newLevel = calculateContributorLevel(newRc);

  await db
    .update(commonsProfiles)
    .set({
      reputationCredits: newRc,
      contributorLevel: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(commonsProfiles.userId, userId));

  return newRc;
}

// =============================================================================
// Commons Resource Router
// =============================================================================

export const commonsResourceRouter = router({
  /**
   * Browse resources with filters and pagination
   */
  browse: publicProcedure
    .input(browseResourcesInput)
    .query(async ({ input }) => {
      const { search, subject, gradeLevel, category, resourceType, tags, status, sort, cursor, limit } = input;

      // Build where conditions
      const conditions = [eq(commonsResources.status, status)];

      if (search) {
        conditions.push(
          or(
            ilike(commonsResources.title, `%${search}%`),
            ilike(commonsResources.description, `%${search}%`)
          )!
        );
      }
      if (subject) conditions.push(eq(commonsResources.subject, subject));
      if (gradeLevel) conditions.push(eq(commonsResources.gradeLevel, gradeLevel));
      if (category) conditions.push(eq(commonsResources.category, category));
      if (resourceType) conditions.push(eq(commonsResources.resourceType, resourceType));

      // Determine sort order
      let orderBy;
      switch (sort) {
        case 'popular':
          orderBy = desc(commonsResources.viewCount);
          break;
        case 'highestRated':
          orderBy = desc(sql`${commonsResources.upvotes} - ${commonsResources.downvotes}`);
          break;
        default:
          orderBy = desc(commonsResources.createdAt);
      }

      // Cursor-based pagination
      if (cursor) {
        conditions.push(sql`${commonsResources.id} < ${cursor}`);
      }

      const resources = await db
        .select({
          id: commonsResources.id,
          title: commonsResources.title,
          description: commonsResources.description,
          subject: commonsResources.subject,
          gradeLevel: commonsResources.gradeLevel,
          category: commonsResources.category,
          resourceType: commonsResources.resourceType,
          thumbnailUrl: commonsResources.thumbnailUrl,
          tags: commonsResources.tags,
          viewCount: commonsResources.viewCount,
          downloadCount: commonsResources.downloadCount,
          upvotes: commonsResources.upvotes,
          downvotes: commonsResources.downvotes,
          qualityScore: commonsResources.qualityScore,
          createdAt: commonsResources.createdAt,
          contributorId: commonsResources.contributorId,
        })
        .from(commonsResources)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit + 1);

      const hasMore = resources.length > limit;
      const items = hasMore ? resources.slice(0, -1) : resources;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return {
        resources: items,
        nextCursor,
        hasMore,
      };
    }),

  /**
   * Get resource by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.id))
        .limit(1);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      // Get contributor info
      const [contributor] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, resource.contributorId))
        .limit(1);

      return {
        ...resource,
        contributor,
      };
    }),

  /**
   * Create a new resource (teacher+ required)
   */
  create: protectedProcedure
    .input(createResourceInput)
    .mutation(async ({ input, ctx }) => {
      const profile = await getOrCreateProfile(ctx.userId);

      if (!hasRole(profile.role as CommonsRole, 'teacher')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Teacher role required to submit resources',
        });
      }

      const [resource] = await db
        .insert(commonsResources)
        .values({
          contributorId: ctx.userId,
          ...input,
        })
        .returning();

      // Update profile stats
      await db
        .update(commonsProfiles)
        .set({
          resourcesSubmitted: sql`${commonsProfiles.resourcesSubmitted} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(commonsProfiles.userId, ctx.userId));

      return resource;
    }),

  /**
   * Update a resource (owner or moderator+)
   */
  update: protectedProcedure
    .input(updateResourceInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, id))
        .limit(1);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      const profile = await getOrCreateProfile(ctx.userId);
      const isOwner = resource.contributorId === ctx.userId;
      const isModerator = hasRole(profile.role as CommonsRole, 'moderator');

      if (!isOwner && !isModerator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this resource',
        });
      }

      const [updated] = await db
        .update(commonsResources)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(commonsResources.id, id))
        .returning();

      return updated;
    }),

  /**
   * Increment view count
   */
  incrementView: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .update(commonsResources)
        .set({
          viewCount: sql`${commonsResources.viewCount} + 1`,
        })
        .where(eq(commonsResources.id, input.id));

      return { success: true };
    }),

  /**
   * Track download and return file URL
   */
  trackDownload: protectedProcedure
    .input(z.object({ id: z.string().uuid(), fileIndex: z.number().optional().default(0) }))
    .mutation(async ({ input, ctx }) => {
      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.id))
        .limit(1);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      // Update download count
      await db
        .update(commonsResources)
        .set({
          downloadCount: sql`${commonsResources.downloadCount} + 1`,
        })
        .where(eq(commonsResources.id, input.id));

      // Award small RC to contributor (capped)
      const files = resource.files as { name: string; url: string; type: string; size: number }[];
      const file = files[input.fileIndex];

      if (!file) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid file index',
        });
      }

      // Award 0.5 RC for download (capped per resource/day)
      if (resource.contributorId !== ctx.userId) {
        await awardRc(resource.contributorId, 0.5, 'resource_downloaded', {
          resourceId: input.id,
          downloaderId: ctx.userId,
        }, input.id);
      }

      return { url: file.url };
    }),

  /**
   * Vote on a resource
   */
  vote: protectedProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      value: z.enum(['1', '-1']).transform(v => parseInt(v)),
    }))
    .mutation(async ({ input, ctx }) => {
      const { resourceId, value } = input;

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, resourceId))
        .limit(1);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      // Check for existing vote
      const [existingVote] = await db
        .select()
        .from(commonsResourceVotes)
        .where(
          and(
            eq(commonsResourceVotes.resourceId, resourceId),
            eq(commonsResourceVotes.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote (toggle off)
          await db
            .delete(commonsResourceVotes)
            .where(eq(commonsResourceVotes.id, existingVote.id));

          // Update resource vote counts
          const updateField = value === 1 ? 'upvotes' : 'downvotes';
          await db
            .update(commonsResources)
            .set({
              [updateField]: sql`${commonsResources[updateField]} - 1`,
            })
            .where(eq(commonsResources.id, resourceId));

          return { action: 'removed', value: null };
        } else {
          // Change vote
          await db
            .update(commonsResourceVotes)
            .set({ value })
            .where(eq(commonsResourceVotes.id, existingVote.id));

          // Update resource vote counts
          if (value === 1) {
            await db
              .update(commonsResources)
              .set({
                upvotes: sql`${commonsResources.upvotes} + 1`,
                downvotes: sql`${commonsResources.downvotes} - 1`,
              })
              .where(eq(commonsResources.id, resourceId));
          } else {
            await db
              .update(commonsResources)
              .set({
                upvotes: sql`${commonsResources.upvotes} - 1`,
                downvotes: sql`${commonsResources.downvotes} + 1`,
              })
              .where(eq(commonsResources.id, resourceId));
          }

          return { action: 'changed', value };
        }
      }

      // New vote
      await db.insert(commonsResourceVotes).values({
        resourceId,
        userId: ctx.userId,
        value,
      });

      // Update resource vote counts
      const updateField = value === 1 ? 'upvotes' : 'downvotes';
      await db
        .update(commonsResources)
        .set({
          [updateField]: sql`${commonsResources[updateField]} + 1`,
        })
        .where(eq(commonsResources.id, resourceId));

      // Award RC for upvotes
      if (value === 1 && resource.contributorId !== ctx.userId) {
        await awardRc(resource.contributorId, 1, 'resource_upvoted', {
          resourceId,
          voterId: ctx.userId,
        }, resourceId);
      }

      return { action: 'added', value };
    }),

  /**
   * Get related resources
   */
  getRelated: publicProcedure
    .input(z.object({ resourceId: z.string().uuid(), limit: z.number().optional().default(6) }))
    .query(async ({ input }) => {
      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, input.resourceId))
        .limit(1);

      if (!resource) {
        return [];
      }

      // Find resources with same subject or grade level
      const related = await db
        .select({
          id: commonsResources.id,
          title: commonsResources.title,
          subject: commonsResources.subject,
          gradeLevel: commonsResources.gradeLevel,
          thumbnailUrl: commonsResources.thumbnailUrl,
          viewCount: commonsResources.viewCount,
        })
        .from(commonsResources)
        .where(
          and(
            eq(commonsResources.status, 'approved'),
            sql`${commonsResources.id} != ${input.resourceId}`,
            or(
              eq(commonsResources.subject, resource.subject),
              eq(commonsResources.gradeLevel, resource.gradeLevel)
            )
          )
        )
        .orderBy(desc(commonsResources.viewCount))
        .limit(input.limit);

      return related;
    }),
});

// =============================================================================
// Commons User Router
// =============================================================================

export const commonsUserRouter = router({
  /**
   * Get current user's Commons profile
   */
  getCurrentProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getOrCreateProfile(ctx.userId);
    return profile;
  }),

  /**
   * Get user profile by ID
   */
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const [profile] = await db
        .select()
        .from(commonsProfiles)
        .where(eq(commonsProfiles.userId, input.userId))
        .limit(1);

      if (!profile) {
        return null;
      }

      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      return {
        ...profile,
        name: user?.name,
      };
    }),

  /**
   * Update profile
   */
  updateProfile: protectedProcedure
    .input(updateProfileInput)
    .mutation(async ({ input, ctx }) => {
      const [updated] = await db
        .update(commonsProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(commonsProfiles.userId, ctx.userId))
        .returning();

      return updated;
    }),

  /**
   * Get user stats for dashboard
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getOrCreateProfile(ctx.userId);

    // Get resource counts by status
    const resourceStats = await db
      .select({
        status: commonsResources.status,
        count: sql<number>`count(*)::int`,
      })
      .from(commonsResources)
      .where(eq(commonsResources.contributorId, ctx.userId))
      .groupBy(commonsResources.status);

    // Get total engagement
    const [engagement] = await db
      .select({
        totalViews: sql<number>`coalesce(sum(${commonsResources.viewCount}), 0)::int`,
        totalDownloads: sql<number>`coalesce(sum(${commonsResources.downloadCount}), 0)::int`,
        totalUpvotes: sql<number>`coalesce(sum(${commonsResources.upvotes}), 0)::int`,
        totalDownvotes: sql<number>`coalesce(sum(${commonsResources.downvotes}), 0)::int`,
      })
      .from(commonsResources)
      .where(eq(commonsResources.contributorId, ctx.userId));

    // Get RC history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [rcLast30Days] = await db
      .select({
        earned: sql<number>`coalesce(sum(case when ${commonsRcTransactions.amount} > 0 then ${commonsRcTransactions.amount} else 0 end), 0)::int`,
      })
      .from(commonsRcTransactions)
      .where(
        and(
          eq(commonsRcTransactions.userId, ctx.userId),
          sql`${commonsRcTransactions.createdAt} >= ${thirtyDaysAgo}`
        )
      );

    return {
      profile,
      resources: {
        total: resourceStats.reduce((acc, r) => acc + r.count, 0),
        pending: resourceStats.find(r => r.status === 'pending')?.count ?? 0,
        approved: resourceStats.find(r => r.status === 'approved')?.count ?? 0,
        rejected: resourceStats.find(r => r.status === 'rejected')?.count ?? 0,
      },
      engagement: engagement ?? { totalViews: 0, totalDownloads: 0, totalUpvotes: 0, totalDownvotes: 0 },
      rcLast30Days: rcLast30Days?.earned ?? 0,
    };
  }),
});

// =============================================================================
// Commons Governance Router
// =============================================================================

export const commonsGovernanceRouter = router({
  /**
   * List active proposals
   */
  listActive: publicProcedure.query(async () => {
    const proposals = await db
      .select()
      .from(commonsProposals)
      .where(eq(commonsProposals.status, 'active'))
      .orderBy(desc(commonsProposals.activatedAt));

    return proposals;
  }),

  /**
   * List proposal history
   */
  listHistory: publicProcedure
    .input(z.object({
      status: z.enum(['accepted', 'rejected', 'withdrawn']).optional(),
      authorId: z.string().optional(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const conditions = [
        inArray(commonsProposals.status, ['accepted', 'rejected', 'withdrawn']),
      ];

      if (input.status) {
        conditions.push(eq(commonsProposals.status, input.status));
      }
      if (input.authorId) {
        conditions.push(eq(commonsProposals.authorId, input.authorId));
      }

      const proposals = await db
        .select()
        .from(commonsProposals)
        .where(and(...conditions))
        .orderBy(desc(commonsProposals.closedAt))
        .limit(input.limit);

      return proposals;
    }),

  /**
   * Get proposal by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [proposal] = await db
        .select()
        .from(commonsProposals)
        .where(eq(commonsProposals.id, input.id))
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, proposal.authorId))
        .limit(1);

      return {
        ...proposal,
        authorName: author?.name,
      };
    }),

  /**
   * Create a new proposal (requires minimum RC)
   */
  create: protectedProcedure
    .input(createProposalInput)
    .mutation(async ({ input, ctx }) => {
      const profile = await getOrCreateProfile(ctx.userId);
      const minRc = 500; // Configurable

      if (profile.reputationCredits < minRc) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You need at least ${minRc} RC to create proposals. You have ${profile.reputationCredits} RC.`,
        });
      }

      const [proposal] = await db
        .insert(commonsProposals)
        .values({
          authorId: ctx.userId,
          ...input,
          status: 'active',
          minRcToCreate: minRc,
          snapshotRc: profile.reputationCredits,
          activatedAt: new Date(),
        })
        .returning();

      return proposal;
    }),

  /**
   * Vote on a proposal
   */
  vote: protectedProcedure
    .input(z.object({
      proposalId: z.string().uuid(),
      choice: z.enum(['for', 'against', 'abstain']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { proposalId, choice } = input;

      const [proposal] = await db
        .select()
        .from(commonsProposals)
        .where(eq(commonsProposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      if (proposal.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This proposal is no longer accepting votes',
        });
      }

      const profile = await getOrCreateProfile(ctx.userId);
      const weightRc = profile.reputationCredits;

      // Check for existing vote
      const [existingVote] = await db
        .select()
        .from(commonsProposalVotes)
        .where(
          and(
            eq(commonsProposalVotes.proposalId, proposalId),
            eq(commonsProposalVotes.voterId, ctx.userId)
          )
        )
        .limit(1);

      if (existingVote) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already voted on this proposal',
        });
      }

      // Record vote
      await db.insert(commonsProposalVotes).values({
        proposalId,
        voterId: ctx.userId,
        choice,
        weightRc,
      });

      // Update proposal vote counts
      const updateField = choice === 'for' ? 'votesFor' : choice === 'against' ? 'votesAgainst' : 'votesAbstain';
      await db
        .update(commonsProposals)
        .set({
          [updateField]: sql`${commonsProposals[updateField]} + 1`,
          totalRcWeight: sql`${commonsProposals.totalRcWeight} + ${weightRc}`,
          updatedAt: new Date(),
        })
        .where(eq(commonsProposals.id, proposalId));

      return { success: true, weightRc };
    }),

  /**
   * Get user's vote on a proposal
   */
  getUserVote: protectedProcedure
    .input(z.object({ proposalId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [vote] = await db
        .select()
        .from(commonsProposalVotes)
        .where(
          and(
            eq(commonsProposalVotes.proposalId, input.proposalId),
            eq(commonsProposalVotes.voterId, ctx.userId)
          )
        )
        .limit(1);

      return vote ?? null;
    }),
});

// =============================================================================
// Commons Moderation Router
// =============================================================================

export const commonsModerationRouter = router({
  /**
   * List pending resources (moderator+ only)
   */
  listPending: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getOrCreateProfile(ctx.userId);

    if (!hasRole(profile.role as CommonsRole, 'moderator')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Moderator role required',
      });
    }

    const resources = await db
      .select()
      .from(commonsResources)
      .where(eq(commonsResources.status, 'pending'))
      .orderBy(asc(commonsResources.createdAt));

    return resources;
  }),

  /**
   * Review a resource (moderator+ only)
   */
  reviewResource: protectedProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      decision: z.enum(['approve', 'reject']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { resourceId, decision, notes } = input;

      const profile = await getOrCreateProfile(ctx.userId);

      if (!hasRole(profile.role as CommonsRole, 'moderator')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Moderator role required',
        });
      }

      const [resource] = await db
        .select()
        .from(commonsResources)
        .where(eq(commonsResources.id, resourceId))
        .limit(1);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      const newStatus = decision === 'approve' ? 'approved' : 'rejected';

      await db
        .update(commonsResources)
        .set({
          status: newStatus,
          reviewedBy: ctx.userId,
          reviewNotes: notes,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(commonsResources.id, resourceId));

      // Award RC for approval
      if (decision === 'approve') {
        await awardRc(resource.contributorId, 50, 'resource_approved', {
          resourceId,
          reviewerId: ctx.userId,
        }, resourceId);

        // Update profile stats
        await db
          .update(commonsProfiles)
          .set({
            resourcesApproved: sql`${commonsProfiles.resourcesApproved} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(commonsProfiles.userId, resource.contributorId));
      }

      return { success: true, status: newStatus };
    }),

  /**
   * List moderation flags
   */
  listFlags: protectedProcedure
    .input(z.object({
      status: z.enum(['open', 'under_review', 'resolved', 'dismissed']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const profile = await getOrCreateProfile(ctx.userId);

      if (!hasRole(profile.role as CommonsRole, 'moderator')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Moderator role required',
        });
      }

      const conditions = [];
      if (input.status) {
        conditions.push(eq(commonsModerationFlags.status, input.status));
      }

      const flags = await db
        .select()
        .from(commonsModerationFlags)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(commonsModerationFlags.createdAt));

      return flags;
    }),

  /**
   * Resolve a flag
   */
  resolveFlag: protectedProcedure
    .input(z.object({
      flagId: z.string().uuid(),
      resolution: z.enum(['resolved', 'dismissed']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const profile = await getOrCreateProfile(ctx.userId);

      if (!hasRole(profile.role as CommonsRole, 'moderator')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Moderator role required',
        });
      }

      await db
        .update(commonsModerationFlags)
        .set({
          status: input.resolution,
          resolvedBy: ctx.userId,
          resolution: input.notes,
          resolvedAt: new Date(),
        })
        .where(eq(commonsModerationFlags.id, input.flagId));

      return { success: true };
    }),
});

// =============================================================================
// Commons Collection Router
// =============================================================================

export const commonsCollectionRouter = router({
  /**
   * List user's collections
   */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const collections = await db
      .select()
      .from(commonsCollections)
      .where(eq(commonsCollections.ownerId, ctx.userId))
      .orderBy(desc(commonsCollections.updatedAt));

    return collections;
  }),

  /**
   * Get collection by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.id))
        .limit(1);

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      // Check visibility
      if (collection.visibility === 'private' && collection.ownerId !== ctx?.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This collection is private',
        });
      }

      // Get resources in collection
      const items = await db
        .select({
          resourceId: commonsCollectionResources.resourceId,
          orderIndex: commonsCollectionResources.orderIndex,
          resource: commonsResources,
        })
        .from(commonsCollectionResources)
        .innerJoin(commonsResources, eq(commonsCollectionResources.resourceId, commonsResources.id))
        .where(eq(commonsCollectionResources.collectionId, input.id))
        .orderBy(asc(commonsCollectionResources.orderIndex));

      return {
        ...collection,
        resources: items.map(i => i.resource),
      };
    }),

  /**
   * Create a collection
   */
  create: protectedProcedure
    .input(createCollectionInput)
    .mutation(async ({ input, ctx }) => {
      const [collection] = await db
        .insert(commonsCollections)
        .values({
          ownerId: ctx.userId,
          ...input,
        })
        .returning();

      return collection;
    }),

  /**
   * Add resource to collection
   */
  addResource: protectedProcedure
    .input(z.object({
      collectionId: z.string().uuid(),
      resourceId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.ownerId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to modify this collection',
        });
      }

      // Get next order index
      const [last] = await db
        .select({ orderIndex: commonsCollectionResources.orderIndex })
        .from(commonsCollectionResources)
        .where(eq(commonsCollectionResources.collectionId, input.collectionId))
        .orderBy(desc(commonsCollectionResources.orderIndex))
        .limit(1);

      const nextIndex = (last?.orderIndex ?? -1) + 1;

      await db.insert(commonsCollectionResources).values({
        collectionId: input.collectionId,
        resourceId: input.resourceId,
        orderIndex: nextIndex,
      });

      // Update resource count
      await db
        .update(commonsCollections)
        .set({
          resourceCount: sql`${commonsCollections.resourceCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(commonsCollections.id, input.collectionId));

      return { success: true };
    }),

  /**
   * Remove resource from collection
   */
  removeResource: protectedProcedure
    .input(z.object({
      collectionId: z.string().uuid(),
      resourceId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [collection] = await db
        .select()
        .from(commonsCollections)
        .where(eq(commonsCollections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.ownerId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to modify this collection',
        });
      }

      await db
        .delete(commonsCollectionResources)
        .where(
          and(
            eq(commonsCollectionResources.collectionId, input.collectionId),
            eq(commonsCollectionResources.resourceId, input.resourceId)
          )
        );

      // Update resource count
      await db
        .update(commonsCollections)
        .set({
          resourceCount: sql`${commonsCollections.resourceCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(commonsCollections.id, input.collectionId));

      return { success: true };
    }),
});

// =============================================================================
// Main Commons Router
// =============================================================================

export const commonsRouter = router({
  resource: commonsResourceRouter,
  user: commonsUserRouter,
  governance: commonsGovernanceRouter,
  moderation: commonsModerationRouter,
  collection: commonsCollectionRouter,
});
