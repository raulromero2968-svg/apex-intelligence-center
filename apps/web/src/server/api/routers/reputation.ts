import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../init';
import { db } from '@/lib/db';
import {
  commonsUserProfiles,
  commonsRcTransactions,
  users,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
} from '@apex/db';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// =============================================================================
// THE MORAL ENGINE: REPUTATION ROUTER
// =============================================================================
// Handles the gamification and "moral" economy of the platform.
// Manages reputation credits, contributor levels, and community leaderboards.

// Level Thresholds (Configurable constants - can be overridden by CONTRIBUTOR_LEVEL_THRESHOLDS)
const LEVEL_THRESHOLDS = {
  SILVER: CONTRIBUTOR_LEVEL_THRESHOLDS.silver,
  GOLD: CONTRIBUTOR_LEVEL_THRESHOLDS.gold,
  PLATINUM: CONTRIBUTOR_LEVEL_THRESHOLDS.platinum,
};

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

  // Create new profile with default values
  const [newProfile] = await db
    .insert(commonsUserProfiles)
    .values({ userId })
    .returning();

  return newProfile;
}

function calculateLevel(rc: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (rc >= LEVEL_THRESHOLDS.PLATINUM) return 'platinum';
  if (rc >= LEVEL_THRESHOLDS.GOLD) return 'gold';
  if (rc >= LEVEL_THRESHOLDS.SILVER) return 'silver';
  return 'bronze';
}

// =============================================================================
// ROUTER
// =============================================================================

export const reputationRouter = router({
  /**
   * GET MY HISTORY (Protected)
   * Returns the user's RC transaction ledger for the dashboard.
   * Shows all credits earned and spent with detailed reasoning.
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().max(100).default(10),
      offset: z.number().int().nonnegative().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const transactions = await db
        .select()
        .from(commonsRcTransactions)
        .where(eq(commonsRcTransactions.userId, profile.id))
        .orderBy(desc(commonsRcTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(commonsRcTransactions)
        .where(eq(commonsRcTransactions.userId, profile.id));

      return {
        transactions,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          total: Number(total),
          hasMore: input.offset + transactions.length < Number(total),
        },
      };
    }),

  /**
   * GET CURRENT STANDING (Protected)
   * Returns the user's current reputation status with level info.
   */
  getStanding: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Calculate progress to next level
      const rc = profile.reputationCredits;
      let nextLevel: string | null = null;
      let nextThreshold: number | null = null;
      let progressToNext = 100;

      if (rc < LEVEL_THRESHOLDS.SILVER) {
        nextLevel = 'silver';
        nextThreshold = LEVEL_THRESHOLDS.SILVER;
        progressToNext = Math.round((rc / LEVEL_THRESHOLDS.SILVER) * 100);
      } else if (rc < LEVEL_THRESHOLDS.GOLD) {
        nextLevel = 'gold';
        nextThreshold = LEVEL_THRESHOLDS.GOLD;
        progressToNext = Math.round(((rc - LEVEL_THRESHOLDS.SILVER) / (LEVEL_THRESHOLDS.GOLD - LEVEL_THRESHOLDS.SILVER)) * 100);
      } else if (rc < LEVEL_THRESHOLDS.PLATINUM) {
        nextLevel = 'platinum';
        nextThreshold = LEVEL_THRESHOLDS.PLATINUM;
        progressToNext = Math.round(((rc - LEVEL_THRESHOLDS.GOLD) / (LEVEL_THRESHOLDS.PLATINUM - LEVEL_THRESHOLDS.GOLD)) * 100);
      }

      return {
        id: profile.id,
        reputationCredits: rc,
        contributorLevel: profile.contributorLevel,
        nextLevel,
        nextThreshold,
        progressToNext,
        totalResources: profile.totalResources,
        totalUpvotesReceived: profile.totalUpvotesReceived,
        totalDownloads: profile.totalDownloads,
        isVerifiedTeacher: profile.isVerifiedTeacher,
      };
    }),

  /**
   * GET LEADERBOARD (Public)
   * Shows the top contributors. Fosters healthy competition.
   */
  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['reputation', 'resources', 'downloads', 'upvotes']).default('reputation'),
      limit: z.number().int().positive().max(100).default(10),
    }))
    .query(async ({ input }) => {
      // Build order by clause based on type
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
          userId: commonsUserProfiles.userId,
          reputationCredits: commonsUserProfiles.reputationCredits,
          contributorLevel: commonsUserProfiles.contributorLevel,
          totalResources: commonsUserProfiles.totalResources,
          totalUpvotesReceived: commonsUserProfiles.totalUpvotesReceived,
          totalDownloads: commonsUserProfiles.totalDownloads,
          isVerifiedTeacher: commonsUserProfiles.isVerifiedTeacher,
        })
        .from(commonsUserProfiles)
        .orderBy(orderBy)
        .limit(input.limit);

      // Get user names for display
      const userIds = profiles.map(p => p.userId);
      if (userIds.length === 0) {
        return [];
      }

      const baseUsers = await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(inArray(users.id, userIds));

      const userMap = new Map(baseUsers.map(u => [u.id, u]));

      return profiles.map((profile, index) => {
        const user = userMap.get(profile.userId);
        return {
          rank: index + 1,
          id: profile.id,
          name: user?.name ?? 'Anonymous',
          image: user?.image,
          reputationCredits: profile.reputationCredits,
          contributorLevel: profile.contributorLevel,
          totalResources: profile.totalResources,
          totalUpvotesReceived: profile.totalUpvotesReceived,
          totalDownloads: profile.totalDownloads,
          isVerifiedTeacher: profile.isVerifiedTeacher,
        };
      });
    }),

  /**
   * SYNC LEVEL (Protected)
   * A utility procedure to sync a user's level with their RC.
   * Ensures that if a user crosses a threshold, their badge updates.
   * Returns level-up information if applicable.
   */
  syncLevel: protectedProcedure
    .mutation(async ({ ctx }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const rc = profile.reputationCredits;
      const newLevel = calculateLevel(rc);
      const currentLevel = profile.contributorLevel;

      // Only update if changed to avoid unnecessary writes
      if (newLevel !== currentLevel) {
        await db
          .update(commonsUserProfiles)
          .set({ contributorLevel: newLevel })
          .where(eq(commonsUserProfiles.id, profile.id));

        // Determine if this was a level up or level down
        const levelOrder = ['bronze', 'silver', 'gold', 'platinum'];
        const oldIndex = levelOrder.indexOf(currentLevel);
        const newIndex = levelOrder.indexOf(newLevel);
        const leveledUp = newIndex > oldIndex;

        return {
          changed: true,
          leveledUp,
          previousLevel: currentLevel,
          newLevel,
          reputationCredits: rc,
        };
      }

      return {
        changed: false,
        leveledUp: false,
        currentLevel,
        reputationCredits: rc,
      };
    }),

  /**
   * GET RANK (Protected)
   * Returns the user's current rank in the community leaderboard.
   */
  getMyRank: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Count how many users have more RC than the current user
      const [{ rank }] = await db
        .select({ rank: sql<number>`count(*) + 1` })
        .from(commonsUserProfiles)
        .where(sql`${commonsUserProfiles.reputationCredits} > ${profile.reputationCredits}`);

      // Get total user count
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(commonsUserProfiles);

      return {
        rank: Number(rank),
        total: Number(total),
        percentile: Math.round(((Number(total) - Number(rank) + 1) / Number(total)) * 100),
        reputationCredits: profile.reputationCredits,
        contributorLevel: profile.contributorLevel,
      };
    }),
});
