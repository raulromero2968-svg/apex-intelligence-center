/**
 * Social Integration Module
 *
 * X/Twitter integration for TCG community discovery and engagement.
 * Features semantic search, sentiment analysis, and influencer discovery.
 *
 * Use Cases:
 * - Community sentiment monitoring
 * - Trending topic discovery
 * - Influencer identification
 * - Content curation
 */

export {
  // Types
  type SentimentType,
  type XPost,
  type XUser,
  type SearchParams,
  type CommunitySearchResult,
  type SentimentAnalysis,
  type TrendingTopic,
  type SearchMetadata,
  type CommunityConfig,

  // Constants
  DEFAULT_CONFIG,
  TCG_KEYWORDS,
  INFLUENCER_THRESHOLD,

  // Main Functions
  searchTCGCommunity,
  getInfluencerRecommendations,
  getCommunityHealth,
  clearCache,
} from './tcg-community';
