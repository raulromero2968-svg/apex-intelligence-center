/**
 * TCG Community Integration
 *
 * X/Twitter integration for TCG community discovery and sentiment analysis.
 * Uses semantic and keyword search to find relevant discussions.
 *
 * Features:
 * - Semantic search for relevant TCG posts
 * - Keyword search for trending topics
 * - User discovery for influencers
 * - Sentiment analysis via RAG
 * - Ethics guard for privacy compliance
 *
 * References:
 * - pack-ai-defense-001 (intelligence fusion for social signals)
 * - knowledge-08 (mobile community alerts)
 *
 * Trade-offs:
 * ✅ GOOD: Community insights boost TCG engagement
 * ✅ GOOD: RAG sentiment for analysis
 * ❌ BAD: Rate limits on X tools—cache results
 * ❌ BAD: Privacy risks—anonymize posts
 */

// ============================================================================
// TYPES
// ============================================================================

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface XPost {
  id: string;
  text: string;
  username: string;
  displayName: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
  profileImageUrl?: string;
  mediaUrls?: string[];
  hashtags: string[];
  mentions: string[];
  relevanceScore?: number;
}

export interface XUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  verified: boolean;
  profileImageUrl?: string;
  isInfluencer: boolean;
}

export interface SearchParams {
  query: string;
  limit?: number;
  mode?: 'Latest' | 'Top' | 'Media';
  minScore?: number;
  includeVerifiedOnly?: boolean;
  dateRange?: {
    since?: string;
    until?: string;
  };
}

export interface CommunitySearchResult {
  posts: XPost[];
  users: XUser[];
  sentiment: SentimentAnalysis;
  trending: TrendingTopic[];
  metadata: SearchMetadata;
}

export interface SentimentAnalysis {
  overall: SentimentType;
  score: number; // -1 to 1
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topThemes: string[];
  insights: string[];
}

export interface TrendingTopic {
  topic: string;
  postCount: number;
  sentiment: SentimentType;
  relatedHashtags: string[];
}

export interface SearchMetadata {
  query: string;
  totalPosts: number;
  totalUsers: number;
  searchedAt: Date;
  cacheHit: boolean;
  processingTime: number;
}

export interface CommunityConfig {
  enableCaching: boolean;
  cacheTTL: number; // seconds
  maxResults: number;
  enableSentimentAnalysis: boolean;
  anonymizePosts: boolean;
  filterNSFW: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_CONFIG: CommunityConfig = {
  enableCaching: true,
  cacheTTL: 300, // 5 minutes
  maxResults: 50,
  enableSentimentAnalysis: true,
  anonymizePosts: false,
  filterNSFW: true,
};

export const TCG_KEYWORDS = [
  'tcg',
  'trading card game',
  'pokemon tcg',
  'magic gathering',
  'yugioh',
  'deck building',
  'card battle',
  'collectible cards',
  'booster pack',
  'meta deck',
  'competitive tcg',
  'apex tcg',
];

export const INFLUENCER_THRESHOLD = 10000; // followers

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<CommunitySearchResult>>();

function getCacheKey(params: SearchParams): string {
  return JSON.stringify({
    query: params.query.toLowerCase(),
    mode: params.mode || 'Top',
    limit: params.limit || 20,
  });
}

function getFromCache(key: string, ttl: number): CommunitySearchResult | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > ttl * 1000) {
    searchCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: CommunitySearchResult): void {
  searchCache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// MOCK X API FUNCTIONS (Replace with actual X API integration)
// ============================================================================

async function xSemanticSearch(params: {
  query: string;
  limit: number;
  minScoreThreshold: number;
}): Promise<{ posts: XPost[] }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock posts
  const posts: XPost[] = Array.from({ length: params.limit }, (_, i) => ({
    id: `post-${Date.now()}-${i}`,
    text: getMockPostText(params.query, i),
    username: `tcg_player_${i}`,
    displayName: `TCG Player ${i}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    likes: Math.floor(Math.random() * 1000),
    retweets: Math.floor(Math.random() * 200),
    replies: Math.floor(Math.random() * 50),
    verified: i < 3,
    hashtags: ['#TCG', '#CardGames', `#${params.query.split(' ')[0]}`],
    mentions: [],
    relevanceScore: 0.9 - i * 0.05,
  }));

  return { posts };
}

async function xKeywordSearch(params: {
  query: string;
  limit: number;
  mode: string;
}): Promise<{ posts: XPost[] }> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const posts: XPost[] = Array.from({ length: params.limit }, (_, i) => ({
    id: `keyword-${Date.now()}-${i}`,
    text: getMockPostText(params.query, i),
    username: `card_master_${i}`,
    displayName: `Card Master ${i}`,
    createdAt: new Date(Date.now() - i * 1800000).toISOString(),
    likes: Math.floor(Math.random() * 500),
    retweets: Math.floor(Math.random() * 100),
    replies: Math.floor(Math.random() * 30),
    verified: i === 0,
    hashtags: ['#TCG', '#MetaDeck'],
    mentions: [],
  }));

  return { posts };
}

async function xUserSearch(params: {
  query: string;
  count: number;
}): Promise<{ users: XUser[] }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const users: XUser[] = Array.from({ length: params.count }, (_, i) => ({
    id: `user-${Date.now()}-${i}`,
    username: `tcg_expert_${i}`,
    displayName: `TCG Expert ${i}`,
    bio: `Professional TCG player and content creator. ${params.query} enthusiast.`,
    followers: 10000 + Math.floor(Math.random() * 90000),
    following: Math.floor(Math.random() * 1000),
    verified: i < 2,
    isInfluencer: i < 3,
  }));

  return { users };
}

function getMockPostText(query: string, index: number): string {
  const templates = [
    `Just pulled an amazing card! ${query} is the best TCG ever! 🔥`,
    `New meta deck strategy for ${query}. Check out my build guide!`,
    `Tournament results: Went 5-1 with my ${query} deck. Here's what I learned...`,
    `Unpopular opinion: ${query} needs more balance changes. Discuss?`,
    `Community meetup this weekend! Who's bringing their ${query} decks?`,
    `Analysis: The current ${query} meta is the healthiest it's been in months.`,
    `Tips for new ${query} players: Start with the starter deck and learn fundamentals first.`,
    `Just finished crafting my dream deck! ${query} collection complete! 🎉`,
  ];

  return templates[index % templates.length];
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

async function analyzeSentiment(posts: XPost[]): Promise<SentimentAnalysis> {
  // Simulate RAG-based sentiment analysis
  await new Promise((resolve) => setTimeout(resolve, 300));

  const positivePhrases = ['amazing', 'best', 'love', 'great', 'awesome', 'complete', 'healthy'];
  const negativePhrases = ['needs', 'balance', 'broken', 'unfair', 'bad', 'worst'];

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const themes = new Set<string>();

  for (const post of posts) {
    const textLower = post.text.toLowerCase();

    const hasPositive = positivePhrases.some((p) => textLower.includes(p));
    const hasNegative = negativePhrases.some((p) => textLower.includes(p));

    if (hasPositive && !hasNegative) {
      positiveCount++;
    } else if (hasNegative && !hasPositive) {
      negativeCount++;
    } else {
      neutralCount++;
    }

    // Extract themes from hashtags
    post.hashtags.forEach((tag) => themes.add(tag));
  }

  const total = posts.length || 1;
  const score = (positiveCount - negativeCount) / total;

  let overall: SentimentType;
  if (score > 0.3) overall = 'positive';
  else if (score < -0.3) overall = 'negative';
  else if (positiveCount > 0 && negativeCount > 0) overall = 'mixed';
  else overall = 'neutral';

  return {
    overall,
    score: Math.round(score * 100) / 100,
    breakdown: {
      positive: Math.round((positiveCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
    },
    topThemes: Array.from(themes).slice(0, 5),
    insights: generateInsights(overall, score, posts.length),
  };
}

function generateInsights(overall: SentimentType, score: number, postCount: number): string[] {
  const insights: string[] = [];

  if (overall === 'positive') {
    insights.push('Community sentiment is overwhelmingly positive');
    insights.push('Good time to engage with community content');
  } else if (overall === 'negative') {
    insights.push('Community has concerns worth addressing');
    insights.push('Consider gathering specific feedback');
  } else if (overall === 'mixed') {
    insights.push('Diverse opinions present in the community');
    insights.push('Opportunity for balanced discussion');
  }

  if (postCount > 30) {
    insights.push('High community activity detected');
  }

  return insights;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Search TCG community on X
 */
export async function searchTCGCommunity(
  params: SearchParams,
  config: Partial<CommunityConfig> = {}
): Promise<CommunitySearchResult> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check cache
  if (finalConfig.enableCaching) {
    const cacheKey = getCacheKey(params);
    const cached = getFromCache(cacheKey, finalConfig.cacheTTL);
    if (cached) {
      return {
        ...cached,
        metadata: { ...cached.metadata, cacheHit: true },
      };
    }
  }

  // Build query with TCG context
  const enhancedQuery = params.query.toLowerCase().includes('tcg')
    ? params.query
    : `${params.query} tcg`;

  // Parallel searches
  const [semanticResult, keywordResult, userResult] = await Promise.all([
    xSemanticSearch({
      query: enhancedQuery,
      limit: params.limit || 15,
      minScoreThreshold: params.minScore || 0.25,
    }),
    xKeywordSearch({
      query: `${enhancedQuery}${params.dateRange?.since ? ` since:${params.dateRange.since}` : ''}${params.includeVerifiedOnly ? ' filter:verified' : ''}`,
      limit: params.limit || 10,
      mode: params.mode || 'Latest',
    }),
    xUserSearch({
      query: 'tcg expert',
      count: 5,
    }),
  ]);

  // Combine and deduplicate posts
  const allPosts = [...semanticResult.posts, ...keywordResult.posts];
  const uniquePosts = Array.from(new Map(allPosts.map((p) => [p.id, p])).values());

  // Filter and sort
  let filteredPosts = uniquePosts;

  if (params.includeVerifiedOnly) {
    filteredPosts = filteredPosts.filter((p) => p.verified);
  }

  filteredPosts = filteredPosts
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, finalConfig.maxResults);

  // Anonymize if configured
  if (finalConfig.anonymizePosts) {
    filteredPosts = filteredPosts.map((p, i) => ({
      ...p,
      username: `user_${i}`,
      displayName: `Anonymous User ${i}`,
    }));
  }

  // Analyze sentiment
  let sentiment: SentimentAnalysis = {
    overall: 'neutral',
    score: 0,
    breakdown: { positive: 0, negative: 0, neutral: 100 },
    topThemes: [],
    insights: [],
  };

  if (finalConfig.enableSentimentAnalysis && filteredPosts.length > 0) {
    sentiment = await analyzeSentiment(filteredPosts);
  }

  // Extract trending topics
  const trending = extractTrending(filteredPosts);

  const result: CommunitySearchResult = {
    posts: filteredPosts,
    users: userResult.users,
    sentiment,
    trending,
    metadata: {
      query: params.query,
      totalPosts: filteredPosts.length,
      totalUsers: userResult.users.length,
      searchedAt: new Date(),
      cacheHit: false,
      processingTime: Date.now() - startTime,
    },
  };

  // Cache result
  if (finalConfig.enableCaching) {
    const cacheKey = getCacheKey(params);
    setCache(cacheKey, result);
  }

  return result;
}

/**
 * Extract trending topics from posts
 */
function extractTrending(posts: XPost[]): TrendingTopic[] {
  const hashtagCounts = new Map<string, { count: number; posts: XPost[] }>();

  for (const post of posts) {
    for (const tag of post.hashtags) {
      const existing = hashtagCounts.get(tag) || { count: 0, posts: [] };
      existing.count++;
      existing.posts.push(post);
      hashtagCounts.set(tag, existing);
    }
  }

  return Array.from(hashtagCounts.entries())
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([topic, data]) => ({
      topic,
      postCount: data.count,
      sentiment: 'positive' as SentimentType, // Simplified
      relatedHashtags: data.posts.flatMap((p) => p.hashtags).filter((t) => t !== topic).slice(0, 3),
    }));
}

/**
 * Get influencer recommendations
 */
export async function getInfluencerRecommendations(
  topic: string,
  count: number = 5
): Promise<XUser[]> {
  const result = await xUserSearch({ query: `${topic} tcg`, count: count * 2 });

  return result.users
    .filter((u) => u.followers >= INFLUENCER_THRESHOLD)
    .sort((a, b) => b.followers - a.followers)
    .slice(0, count);
}

/**
 * Get community health metrics
 */
export function getCommunityHealth(result: CommunitySearchResult): {
  healthScore: number;
  activityLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
} {
  const { posts, sentiment, trending } = result;

  // Calculate health score (0-100)
  let healthScore = 50;

  // Sentiment contribution
  if (sentiment.overall === 'positive') healthScore += 20;
  else if (sentiment.overall === 'negative') healthScore -= 10;

  // Activity contribution
  if (posts.length > 30) healthScore += 15;
  else if (posts.length > 15) healthScore += 10;
  else if (posts.length < 5) healthScore -= 10;

  // Engagement contribution
  const avgEngagement = posts.reduce((sum, p) => sum + p.likes + p.retweets, 0) / (posts.length || 1);
  if (avgEngagement > 100) healthScore += 15;
  else if (avgEngagement > 50) healthScore += 10;

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Determine activity level
  let activityLevel: 'low' | 'medium' | 'high';
  if (posts.length > 25) activityLevel = 'high';
  else if (posts.length > 10) activityLevel = 'medium';
  else activityLevel = 'low';

  // Generate recommendations
  const recommendations: string[] = [];

  if (sentiment.overall === 'negative') {
    recommendations.push('Address community concerns through official channels');
  }

  if (activityLevel === 'low') {
    recommendations.push('Consider community events to boost engagement');
  }

  if (trending.length > 0) {
    recommendations.push(`Engage with trending topic: ${trending[0].topic}`);
  }

  return { healthScore, activityLevel, recommendations };
}

/**
 * Clear search cache
 */
export function clearCache(): void {
  searchCache.clear();
}
