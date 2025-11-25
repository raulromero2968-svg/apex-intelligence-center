/**
 * TCG Community Search for Apex Intelligence
 *
 * X/Twitter integration for TCG community discovery:
 * - Keyword and semantic search
 * - User/influencer discovery
 * - Sentiment analysis via RAG
 * - Community trend detection
 *
 * @see knowledge-06-data-ab-testing for sentiment patterns
 */

import { db } from '@/db';
import {
  communitySearches,
  tcgInfluencers,
  communityPosts,
  type CommunitySearch,
  type TcgInfluencer,
} from '@/db/schema/social';
import { ethicsGuardLogs } from '@/db/schema/ethics';
import { eq, and, desc, gt } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

interface XPost {
  id: string;
  text: string;
  username: string;
  displayName?: string;
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  verified?: boolean;
}

interface XUser {
  id: string;
  username: string;
  displayName: string;
  followersCount: number;
  verified: boolean;
  bio?: string;
  profileImageUrl?: string;
}

interface SearchResult {
  posts: XPost[];
  users?: XUser[];
}

interface CommunitySearchResult {
  combined: {
    semantic: XPost[];
    keyword: XPost[];
    users: XUser[];
  };
  sentiment: string;
  cached: boolean;
  error?: string;
}

// ============================================================================
// ETHICS GUARD
// ============================================================================

/**
 * Ethics guard for social data operations
 */
async function ethicsGuard(
  config: { type: string; impactScore: number },
  requester: string
): Promise<{ approved: boolean; error?: string }> {
  try {
    // Log the check
    await db.insert(ethicsGuardLogs).values({
      requestType: config.type,
      requesterId: requester,
      requesterType: requester === 'system' ? 'system' : 'user',
      checkConfig: config,
      approved: config.impactScore < 0.7, // Auto-approve low impact
      reason: config.impactScore < 0.7
        ? 'Low impact operation approved'
        : 'High impact operation requires review',
    });

    return {
      approved: config.impactScore < 0.7,
      error: config.impactScore >= 0.7 ? 'Operation requires ethics review' : undefined,
    };
  } catch (error) {
    console.error('[Ethics] Guard check failed:', error);
    return { approved: false, error: 'Ethics check failed' };
  }
}

// ============================================================================
// X/TWITTER SEARCH FUNCTIONS (Stub implementations)
// ============================================================================

/**
 * Semantic search on X (stub - would connect to actual X API)
 */
async function x_semantic_search(params: {
  query: string;
  limit: number;
  min_score_threshold?: number;
}): Promise<{ posts: XPost[] }> {
  // In production, this would call the actual X API
  // For now, return mock data structure
  console.log('[X Search] Semantic search:', params.query);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    posts: [
      {
        id: `semantic_${Date.now()}_1`,
        text: `TCG market update: ${params.query} shows strong momentum`,
        username: 'tcg_analyst',
        displayName: 'TCG Analyst',
        createdAt: new Date().toISOString(),
        metrics: { likes: 150, retweets: 45, replies: 12 },
        verified: true,
      },
      {
        id: `semantic_${Date.now()}_2`,
        text: `Interesting developments in ${params.query} - watching closely`,
        username: 'card_collector',
        displayName: 'Card Collector',
        createdAt: new Date().toISOString(),
        metrics: { likes: 89, retweets: 23, replies: 8 },
      },
    ],
  };
}

/**
 * Keyword search on X (stub)
 */
async function x_keyword_search(params: {
  query: string;
  limit: number;
  mode: 'Top' | 'Latest';
}): Promise<{ posts: XPost[] }> {
  console.log('[X Search] Keyword search:', params.query);

  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    posts: [
      {
        id: `keyword_${Date.now()}_1`,
        text: `Breaking: ${params.query.split(' ')[0]} prices surge 20%`,
        username: 'tcg_news',
        displayName: 'TCG News',
        createdAt: new Date().toISOString(),
        metrics: { likes: 320, retweets: 156, replies: 45 },
        verified: true,
      },
    ],
  };
}

/**
 * User search on X (stub)
 */
async function x_user_search(params: {
  query: string;
  count: number;
}): Promise<{ users: XUser[] }> {
  console.log('[X Search] User search:', params.query);

  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    users: [
      {
        id: `user_${Date.now()}_1`,
        username: 'pokemon_investor',
        displayName: 'Pokemon Investor',
        followersCount: 125000,
        verified: true,
        bio: 'TCG market analysis and investment tips',
      },
      {
        id: `user_${Date.now()}_2`,
        username: 'mtg_finance',
        displayName: 'MTG Finance',
        followersCount: 89000,
        verified: true,
        bio: 'Magic: The Gathering market updates',
      },
    ],
  };
}

// ============================================================================
// RAG INTEGRATION
// ============================================================================

/**
 * Query RAG for sentiment analysis
 */
async function ragQuery(params: { query: string }): Promise<{ answer: string }> {
  try {
    const { ragFusion } = await import('@/lib/rag');
    const result = await ragFusion({
      query: params.query,
      maxResults: 5,
    });
    return { answer: result?.answer || 'Analysis complete.' };
  } catch {
    // Fallback sentiment analysis
    const query = params.query.toLowerCase();
    if (query.includes('bullish') || query.includes('surge') || query.includes('gain')) {
      return { answer: 'Community sentiment appears bullish with positive price expectations.' };
    } else if (query.includes('bearish') || query.includes('drop') || query.includes('crash')) {
      return { answer: 'Community sentiment shows concerns about potential price decline.' };
    }
    return { answer: 'Mixed sentiment detected across the TCG community.' };
  }
}

// ============================================================================
// MAIN COMMUNITY SEARCH
// ============================================================================

/**
 * Full TCG community search with caching and sentiment analysis
 */
export async function fullTCGCommunitySearch(
  query: string = 'pokemon tcg meta'
): Promise<CommunitySearchResult> {
  try {
    // Ethics check for social data privacy
    const guard = await ethicsGuard(
      { type: 'social_search', impactScore: 0.3 },
      'system'
    );

    if (!guard.approved) {
      return {
        combined: { semantic: [], keyword: [], users: [] },
        sentiment: '',
        cached: false,
        error: guard.error,
      };
    }

    // Check cache first
    const cachedResult = await db.query.communitySearches.findFirst({
      where: and(
        eq(communitySearches.query, query),
        gt(communitySearches.expiresAt, new Date())
      ),
      orderBy: [desc(communitySearches.fetchedAt)],
    });

    if (cachedResult && cachedResult.rawResults) {
      return {
        combined: {
          semantic: cachedResult.rawResults.posts || [],
          keyword: [],
          users: cachedResult.rawResults.users || [],
        },
        sentiment: cachedResult.sentimentAnalysis?.overall || 'neutral',
        cached: true,
      };
    }

    // Perform searches
    const [semanticResult, keywordResult, userResult] = await Promise.all([
      x_semantic_search({ query, limit: 20, min_score_threshold: 0.25 }),
      x_keyword_search({
        query: `${query} filter:verified min_faves:10`,
        limit: 15,
        mode: 'Top',
      }),
      x_user_search({ query: 'tcg influencer', count: 10 }),
    ]);

    const combined = {
      semantic: semanticResult.posts,
      keyword: keywordResult.posts,
      users: userResult.users,
    };

    // RAG sentiment analysis
    const topPosts = [...semanticResult.posts, ...keywordResult.posts].slice(0, 10);
    const sentimentQuery = `TCG community sentiment analysis for "${query}": ${JSON.stringify(
      topPosts.map(p => p.text).slice(0, 5)
    )}`;
    const sentiment = await ragQuery({ query: sentimentQuery });

    // Calculate sentiment breakdown
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const post of topPosts) {
      const text = post.text.toLowerCase();
      if (text.includes('bullish') || text.includes('surge') || text.includes('gain')) {
        positiveCount++;
      } else if (text.includes('bearish') || text.includes('drop') || text.includes('crash')) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }

    const total = positiveCount + negativeCount + neutralCount || 1;
    const sentimentAnalysis = {
      overall: (positiveCount > negativeCount ? 'bullish' :
                negativeCount > positiveCount ? 'bearish' : 'neutral') as 'bullish' | 'bearish' | 'neutral',
      score: (positiveCount - negativeCount) / total,
      confidence: Math.max(positiveCount, negativeCount, neutralCount) / total,
      breakdown: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount,
      },
      topics: [],
    };

    // Cache results
    await db.insert(communitySearches).values({
      query,
      searchType: 'semantic',
      resultCount: topPosts.length,
      sentimentAnalysis,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min TTL
      rawResults: {
        posts: topPosts,
        users: userResult.users,
      },
    });

    // Upsert influencers
    for (const user of userResult.users) {
      await upsertInfluencer(user);
    }

    return {
      combined,
      sentiment: sentiment.answer,
      cached: false,
    };
  } catch (error) {
    console.error('[Community Search] Error:', error);
    return {
      combined: { semantic: [], keyword: [], users: [] },
      sentiment: '',
      cached: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Upsert influencer data
 */
async function upsertInfluencer(user: XUser): Promise<void> {
  try {
    // Check if exists
    const existing = await db.query.tcgInfluencers.findFirst({
      where: and(
        eq(tcgInfluencers.platform, 'twitter'),
        eq(tcgInfluencers.platformUserId, user.id)
      ),
    });

    if (existing) {
      // Update
      await db.update(tcgInfluencers)
        .set({
          username: user.username,
          displayName: user.displayName,
          followersCount: user.followersCount,
          verified: user.verified,
          bio: user.bio,
          profileImageUrl: user.profileImageUrl,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tcgInfluencers.id, existing.id));
    } else {
      // Insert
      await db.insert(tcgInfluencers).values({
        platform: 'twitter',
        platformUserId: user.id,
        username: user.username,
        displayName: user.displayName,
        followersCount: user.followersCount,
        verified: user.verified,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        lastCheckedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Community Search] Upsert influencer error:', error);
  }
}

/**
 * Get trending influencers
 */
export async function getTrendingInfluencers(
  game?: 'pokemon' | 'mtg' | 'yugioh' | 'lorcana',
  limit: number = 10
): Promise<TcgInfluencer[]> {
  try {
    const influencers = await db.query.tcgInfluencers.findMany({
      where: game ? eq(tcgInfluencers.primaryGame, game) : undefined,
      orderBy: [desc(tcgInfluencers.followersCount)],
      limit,
    });

    return influencers;
  } catch (error) {
    console.error('[Community Search] getTrendingInfluencers error:', error);
    return [];
  }
}

/**
 * Search posts by card mention
 */
export async function searchPostsByCard(
  cardName: string,
  limit: number = 20
): Promise<XPost[]> {
  try {
    const result = await x_semantic_search({
      query: cardName,
      limit,
      min_score_threshold: 0.3,
    });

    return result.posts;
  } catch (error) {
    console.error('[Community Search] searchPostsByCard error:', error);
    return [];
  }
}
