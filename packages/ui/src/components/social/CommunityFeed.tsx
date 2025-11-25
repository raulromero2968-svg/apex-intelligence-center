/**
 * Community Feed Component
 *
 * UI for browsing TCG community discussions from X/Twitter.
 * Features sentiment analysis, trending topics, and influencer discovery.
 *
 * Trade-offs:
 * ✅ GOOD: Real-time community insights
 * ✅ GOOD: Sentiment visualization helps gauge community health
 * ❌ BAD: Rate limits may cause delays
 * ❌ BAD: Privacy concerns with displaying user data
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

interface XPost {
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
  hashtags: string[];
  relevanceScore?: number;
}

interface XUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  verified: boolean;
  isInfluencer: boolean;
}

interface SentimentAnalysis {
  overall: SentimentType;
  score: number;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topThemes: string[];
  insights: string[];
}

interface TrendingTopic {
  topic: string;
  postCount: number;
  sentiment: SentimentType;
  relatedHashtags: string[];
}

interface CommunitySearchResult {
  posts: XPost[];
  users: XUser[];
  sentiment: SentimentAnalysis;
  trending: TrendingTopic[];
  metadata: {
    query: string;
    totalPosts: number;
    searchedAt: Date;
    processingTime: number;
  };
}

interface CommunityFeedProps {
  initialQuery?: string;
  onPostClick?: (post: XPost) => void;
  onUserClick?: (user: XUser) => void;
  compact?: boolean;
}

// ============================================================================
// MOCK SEARCH FUNCTION (Replace with actual import in production)
// ============================================================================

async function searchTCGCommunity(params: {
  query: string;
  limit?: number;
}): Promise<CommunitySearchResult> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const posts: XPost[] = Array.from({ length: 8 }, (_, i) => ({
    id: `post-${i}`,
    text: [
      `Just pulled an amazing card! ${params.query} is incredible! 🔥`,
      `New deck tech for ${params.query}. Check out my build!`,
      `Tournament recap: Went 4-2 with ${params.query}. Here's the analysis...`,
      `Hot take: ${params.query} meta needs more diversity. Thoughts?`,
      `Community meetup this weekend! Who's bringing their ${params.query} decks?`,
      `Guide: Best budget builds for ${params.query} beginners`,
      `Pack opening stream live now! ${params.query} collector's edition!`,
      `Theory crafting ${params.query} combos. This might be broken 👀`,
    ][i],
    username: `tcg_fan_${i}`,
    displayName: `TCG Fan ${i}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    likes: Math.floor(Math.random() * 500) + 10,
    retweets: Math.floor(Math.random() * 100),
    replies: Math.floor(Math.random() * 30),
    verified: i < 2,
    hashtags: ['#TCG', '#CardGames', `#${params.query.replace(/\s+/g, '')}`],
    relevanceScore: 0.95 - i * 0.05,
  }));

  const users: XUser[] = [
    { id: 'u1', username: 'tcg_pro', displayName: 'TCG Pro Player', bio: 'World champion', followers: 50000, verified: true, isInfluencer: true },
    { id: 'u2', username: 'card_collector', displayName: 'Card Collector', bio: 'Rare card hunter', followers: 25000, verified: true, isInfluencer: true },
    { id: 'u3', username: 'deck_builder', displayName: 'Deck Builder', bio: 'Theory crafter', followers: 15000, verified: false, isInfluencer: true },
  ];

  return {
    posts,
    users,
    sentiment: {
      overall: 'positive',
      score: 0.65,
      breakdown: { positive: 60, negative: 15, neutral: 25 },
      topThemes: ['#TCG', '#MetaDeck', '#Tournament', '#PackOpening'],
      insights: ['Community sentiment is positive', 'High engagement on tournament content'],
    },
    trending: [
      { topic: '#TCG', postCount: 5, sentiment: 'positive', relatedHashtags: ['#CardGames', '#Gaming'] },
      { topic: '#MetaDeck', postCount: 3, sentiment: 'mixed', relatedHashtags: ['#Strategy', '#Competitive'] },
    ],
    metadata: {
      query: params.query,
      totalPosts: posts.length,
      searchedAt: new Date(),
      processingTime: 850,
    },
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SentimentBadge({ sentiment }: { sentiment: SentimentType }) {
  const styles: Record<SentimentType, { bg: string; text: string; icon: string }> = {
    positive: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '😊' },
    negative: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '😟' },
    neutral: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '😐' },
    mixed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🤔' },
  };

  const style = styles[sentiment];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${style.bg} ${style.text}`}>
      <span>{style.icon}</span>
      <span className="capitalize">{sentiment}</span>
    </span>
  );
}

function SentimentBar({ breakdown }: { breakdown: { positive: number; negative: number; neutral: number } }) {
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
      <div className="bg-green-500" style={{ width: `${breakdown.positive}%` }} />
      <div className="bg-gray-500" style={{ width: `${breakdown.neutral}%` }} />
      <div className="bg-red-500" style={{ width: `${breakdown.negative}%` }} />
    </div>
  );
}

function PostCard({ post, onClick }: { post: XPost; onClick?: () => void }) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {post.displayName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{post.displayName}</span>
            {post.verified && (
              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-gray-500 text-sm">@{post.username}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm">{formatTime(post.createdAt)}</span>
          </div>
          <p className="mt-1 text-gray-300 text-sm">{post.text}</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {formatNumber(post.replies)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {formatNumber(post.retweets)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-cyan-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function UserCard({ user, onClick }: { user: XUser; onClick?: () => void }) {
  const formatFollowers = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-700/30 border border-gray-700 rounded-lg transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
        {user.displayName[0]}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-1">
          <span className="font-medium text-white">{user.displayName}</span>
          {user.verified && (
            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-400">@{user.username}</p>
        <p className="text-xs text-gray-500 mt-1">{formatFollowers(user.followers)} followers</p>
      </div>
      {user.isInfluencer && (
        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
          Influencer
        </span>
      )}
    </button>
  );
}

function TrendingCard({ topic }: { topic: TrendingTopic }) {
  return (
    <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="font-medium text-cyan-400">{topic.topic}</span>
        <SentimentBadge sentiment={topic.sentiment} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{topic.postCount} posts</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {topic.relatedHashtags.map((tag) => (
          <span key={tag} className="text-xs text-gray-400">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CommunityFeed({
  initialQuery = 'pokemon tcg',
  onPostClick,
  onUserClick,
  compact = false,
}: CommunityFeedProps) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<CommunitySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'trending'>('posts');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await searchTCGCommunity({ query, limit: 15 });
      setResult(data);
    } catch (err) {
      setError('Failed to search community. Please try again.');
      console.error('Community search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          TCG Community Feed
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Discover discussions, trends, and influencers
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search TCG community..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border-b border-red-700">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Sentiment Overview */}
          <div className="p-4 border-b border-gray-700 bg-gray-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Community Sentiment</span>
              <SentimentBadge sentiment={result.sentiment.overall} />
            </div>
            <SentimentBar breakdown={result.sentiment.breakdown} />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span className="text-green-400">{result.sentiment.breakdown.positive}% positive</span>
              <span className="text-gray-400">{result.sentiment.breakdown.neutral}% neutral</span>
              <span className="text-red-400">{result.sentiment.breakdown.negative}% negative</span>
            </div>
            {result.sentiment.insights.length > 0 && (
              <div className="mt-3 space-y-1">
                {result.sentiment.insights.map((insight, i) => (
                  <p key={i} className="text-xs text-cyan-400">
                    • {insight}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {(['posts', 'users', 'trending'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'posts' && `Posts (${result.posts.length})`}
                {tab === 'users' && `Influencers (${result.users.length})`}
                {tab === 'trending' && `Trending (${result.trending.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={`p-4 ${compact ? 'max-h-80' : 'max-h-[500px]'} overflow-y-auto`}>
            {activeTab === 'posts' && (
              <div className="space-y-3">
                {result.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => onPostClick?.(post)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-3">
                {result.users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onClick={() => onUserClick?.(user)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'trending' && (
              <div className="grid gap-3">
                {result.trending.map((topic) => (
                  <TrendingCard key={topic.topic} topic={topic} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700 bg-gray-800/30 text-xs text-gray-500 flex justify-between">
            <span>Searched: {result.metadata.query}</span>
            <span>{result.metadata.processingTime}ms</span>
          </div>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">Search for TCG discussions on X</p>
          <p className="text-sm text-gray-500 mt-2">
            Try "pokemon tcg", "magic gathering", or "yugioh meta"
          </p>
        </div>
      )}
    </div>
  );
}

export default CommunityFeed;
