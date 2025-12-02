import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../init';
import { db } from '@/lib/db';
import {
  commonsUserProfiles,
  commonsProposals,
  commonsProposalVotes,
  commonsRcTransactions,
  users,
  RC_REASON_CODES,
} from '@apex/db';
import { eq, desc, and, sql, inArray, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// =============================================================================
// THE COMMUNITY BRAIN: GOVERNANCE ROUTER
// =============================================================================
// Manages the democratic process for platform decisions.
// Enforces RC thresholds to ensure only invested members can propose changes.

// Governance Constants
const PROPOSAL_COST = 500; // RC cost to create a proposal (anti-spam threshold)
const MIN_VOTING_RC = 50;  // Minimum RC required to vote on proposals
const MIN_PROPOSAL_DURATION_DAYS = 3;
const MAX_PROPOSAL_DURATION_DAYS = 14;
const DEFAULT_QUORUM = 100; // Default quorum required for proposals

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createProposalSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  content: z.string().min(50, 'Content must be at least 50 characters').max(10000),
  category: z.enum(['policy', 'feature', 'moderation', 'other']),
  durationDays: z.number()
    .int()
    .min(MIN_PROPOSAL_DURATION_DAYS)
    .max(MAX_PROPOSAL_DURATION_DAYS)
    .default(7),
  quorumRequired: z.number().int().positive().default(DEFAULT_QUORUM),
});

const voteSchema = z.object({
  proposalId: z.string().uuid(),
  vote: z.enum(['for', 'against', 'abstain']),
});

const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
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

async function deductReputationCredits(
  profileId: string,
  amount: number,
  reasonCode: string,
  referenceType: string,
  referenceId: string
) {
  // Get current balance
  const [profile] = await db
    .select({ reputationCredits: commonsUserProfiles.reputationCredits })
    .from(commonsUserProfiles)
    .where(eq(commonsUserProfiles.id, profileId));

  const currentBalance = profile?.reputationCredits ?? 0;
  const newBalance = currentBalance - amount;

  // Record transaction (negative amount)
  await db.insert(commonsRcTransactions).values({
    userId: profileId,
    amount: -amount,
    balance: newBalance,
    reason: `Proposal creation cost (${amount} RC)`,
    reasonCode,
    referenceType,
    referenceId,
  });

  // Update balance
  await db
    .update(commonsUserProfiles)
    .set({ reputationCredits: newBalance })
    .where(eq(commonsUserProfiles.id, profileId));

  return newBalance;
}

// =============================================================================
// ROUTER
// =============================================================================

export const governanceRouter = router({
  /**
   * GET ALL PROPOSALS (Public)
   * Returns proposals with optional status filter.
   */
  getAll: publicProcedure
    .input(z.object({
      filter: z.enum(['active', 'passed', 'rejected', 'expired', 'all']).default('active'),
      pagination: paginationSchema.default({ page: 1, limit: 20 }),
    }))
    .query(async ({ input }) => {
      const { filter, pagination } = input;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build conditions
      const conditions = [];
      if (filter !== 'all') {
        conditions.push(eq(commonsProposals.status, filter));
      }

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(commonsProposals)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get proposals with author info
      const proposals = await db
        .select({
          id: commonsProposals.id,
          title: commonsProposals.title,
          description: commonsProposals.description,
          category: commonsProposals.category,
          status: commonsProposals.status,
          votesFor: commonsProposals.votesFor,
          votesAgainst: commonsProposals.votesAgainst,
          votesAbstain: commonsProposals.votesAbstain,
          quorumRequired: commonsProposals.quorumRequired,
          minReputation: commonsProposals.minReputation,
          startsAt: commonsProposals.startsAt,
          endsAt: commonsProposals.endsAt,
          createdAt: commonsProposals.createdAt,
          authorId: commonsProposals.authorId,
        })
        .from(commonsProposals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(commonsProposals.startsAt))
        .limit(pagination.limit)
        .offset(offset);

      // Get author names
      const authorIds = [...new Set(proposals.map(p => p.authorId))];
      const profilesWithUsers = authorIds.length > 0 ? await db
        .select({
          profileId: commonsUserProfiles.id,
          userId: commonsUserProfiles.userId,
        })
        .from(commonsUserProfiles)
        .where(inArray(commonsUserProfiles.id, authorIds)) : [];

      const userIds = profilesWithUsers.map(p => p.userId);
      const baseUsers = userIds.length > 0 ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds)) : [];

      const userMap = new Map(baseUsers.map(u => [u.id, u.name]));
      const profileUserMap = new Map(profilesWithUsers.map(p => [p.profileId, p.userId]));

      const enrichedProposals = proposals.map(p => {
        const userId = profileUserMap.get(p.authorId);
        const authorName = userId ? userMap.get(userId) : null;
        return {
          ...p,
          authorName: authorName ?? 'Anonymous',
          totalVotes: p.votesFor + p.votesAgainst + p.votesAbstain,
          isActive: p.status === 'active' && new Date(p.endsAt) > new Date(),
        };
      });

      return {
        proposals: enrichedProposals,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }),

  /**
   * GET SINGLE PROPOSAL (Public)
   * Returns detailed proposal info with vote breakdown.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [proposal] = await db
        .select()
        .from(commonsProposals)
        .where(eq(commonsProposals.id, input.id));

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      // Get author info
      const [authorProfile] = await db
        .select({ userId: commonsUserProfiles.userId })
        .from(commonsUserProfiles)
        .where(eq(commonsUserProfiles.id, proposal.authorId));

      let authorName = 'Anonymous';
      if (authorProfile) {
        const [user] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, authorProfile.userId));
        authorName = user?.name ?? 'Anonymous';
      }

      // Calculate vote percentages
      const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
      const forPercentage = totalVotes > 0 ? Math.round((proposal.votesFor / totalVotes) * 100) : 0;
      const againstPercentage = totalVotes > 0 ? Math.round((proposal.votesAgainst / totalVotes) * 100) : 0;
      const abstainPercentage = totalVotes > 0 ? Math.round((proposal.votesAbstain / totalVotes) * 100) : 0;

      return {
        ...proposal,
        authorName,
        totalVotes,
        forPercentage,
        againstPercentage,
        abstainPercentage,
        quorumReached: totalVotes >= proposal.quorumRequired,
        isActive: proposal.status === 'active' && new Date(proposal.endsAt) > new Date(),
        timeRemaining: Math.max(0, new Date(proposal.endsAt).getTime() - Date.now()),
      };
    }),

  /**
   * CREATE PROPOSAL (Protected)
   * Requires 500 RC. Deducts cost automatically.
   * Prevents spam and ensures only invested members steer the ship.
   */
  create: protectedProcedure
    .input(createProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // 1. Check Balance - Enforce 500 RC Threshold
      if (profile.reputationCredits < PROPOSAL_COST) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Insufficient Reputation Credits. You need ${PROPOSAL_COST} RC to submit a proposal. Current balance: ${profile.reputationCredits} RC.`,
        });
      }

      // 2. Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.durationDays);

      // 3. Create Proposal first to get ID for transaction reference
      const [proposal] = await db
        .insert(commonsProposals)
        .values({
          authorId: profile.id,
          title: input.title,
          description: input.content,
          category: input.category,
          quorumRequired: input.quorumRequired,
          minReputation: MIN_VOTING_RC,
          endsAt: endDate,
          status: 'active',
        })
        .returning();

      // 4. Deduct RC
      await deductReputationCredits(
        profile.id,
        PROPOSAL_COST,
        RC_REASON_CODES.PROPOSAL_CREATED,
        'proposal',
        proposal.id
      );

      return {
        ...proposal,
        message: `Proposal created successfully. ${PROPOSAL_COST} RC has been deducted from your balance.`,
        newBalance: profile.reputationCredits - PROPOSAL_COST,
      };
    }),

  /**
   * VOTE ON PROPOSAL (Protected)
   * Requires minimum RC and proposal to be active.
   * Each user can only vote once per proposal.
   */
  vote: protectedProcedure
    .input(voteSchema)
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

      // Check if proposal is still active
      if (proposal.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Proposal is no longer active' });
      }

      if (new Date(proposal.endsAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Voting period has ended' });
      }

      // Check minimum RC requirement
      const requiredRC = proposal.minReputation;
      if (profile.reputationCredits < requiredRC) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You need at least ${requiredRC} RC to vote on this proposal. Current balance: ${profile.reputationCredits} RC.`,
        });
      }

      // Check if already voted
      const [existingVote] = await db
        .select()
        .from(commonsProposalVotes)
        .where(and(
          eq(commonsProposalVotes.proposalId, input.proposalId),
          eq(commonsProposalVotes.userId, profile.id)
        ));

      if (existingVote) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already voted on this proposal.' });
      }

      // Calculate vote weight based on reputation (logarithmic scale)
      const weight = Math.floor(Math.log10(profile.reputationCredits + 1)) + 1;

      // Cast Vote
      await db.insert(commonsProposalVotes).values({
        proposalId: input.proposalId,
        userId: profile.id,
        vote: input.vote,
        weight,
      });

      // Update Vote Counts
      const updateField = input.vote === 'for' ? 'votesFor'
        : input.vote === 'against' ? 'votesAgainst'
        : 'votesAbstain';

      await db
        .update(commonsProposals)
        .set({
          [updateField]: sql`${commonsProposals[updateField]} + ${weight}`,
        })
        .where(eq(commonsProposals.id, input.proposalId));

      return {
        success: true,
        vote: input.vote,
        weight,
        message: `Vote cast successfully with weight ${weight}.`,
      };
    }),

  /**
   * GET MY VOTE (Protected)
   * Returns the user's vote on a specific proposal.
   */
  getMyVote: protectedProcedure
    .input(z.object({ proposalId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      const [vote] = await db
        .select({
          vote: commonsProposalVotes.vote,
          weight: commonsProposalVotes.weight,
          createdAt: commonsProposalVotes.createdAt,
        })
        .from(commonsProposalVotes)
        .where(and(
          eq(commonsProposalVotes.proposalId, input.proposalId),
          eq(commonsProposalVotes.userId, profile.id)
        ));

      return vote ?? null;
    }),

  /**
   * GET GOVERNANCE STATS (Protected)
   * Returns user's governance participation stats.
   */
  getMyStats: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getOrCreateUserProfile(ctx.userId);

      // Count proposals created by user
      const [{ proposalsCreated }] = await db
        .select({ proposalsCreated: count() })
        .from(commonsProposals)
        .where(eq(commonsProposals.authorId, profile.id));

      // Count votes cast by user
      const [{ votesCast }] = await db
        .select({ votesCast: count() })
        .from(commonsProposalVotes)
        .where(eq(commonsProposalVotes.userId, profile.id));

      // Count passed proposals authored by user
      const [{ proposalsPassed }] = await db
        .select({ proposalsPassed: count() })
        .from(commonsProposals)
        .where(and(
          eq(commonsProposals.authorId, profile.id),
          eq(commonsProposals.status, 'passed')
        ));

      // Check if user can create proposals
      const canCreateProposal = profile.reputationCredits >= PROPOSAL_COST;

      return {
        proposalsCreated,
        proposalsPassed,
        votesCast,
        reputationCredits: profile.reputationCredits,
        canCreateProposal,
        proposalCost: PROPOSAL_COST,
        rcNeededForProposal: Math.max(0, PROPOSAL_COST - profile.reputationCredits),
      };
    }),

  /**
   * GET GOVERNANCE CONSTANTS (Public)
   * Returns the governance configuration constants for the frontend.
   */
  getConstants: publicProcedure
    .query(() => ({
      proposalCost: PROPOSAL_COST,
      minVotingRC: MIN_VOTING_RC,
      minDurationDays: MIN_PROPOSAL_DURATION_DAYS,
      maxDurationDays: MAX_PROPOSAL_DURATION_DAYS,
      defaultQuorum: DEFAULT_QUORUM,
    })),
});
