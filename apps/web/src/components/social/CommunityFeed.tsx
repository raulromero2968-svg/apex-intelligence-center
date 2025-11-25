'use client';

/**
 * Community Feed Component
 *
 * Displays X/Twitter community search results with:
 * - Keyword and semantic search
 * - Sentiment analysis visualization
 * - Influencer highlights
 *
 * @see lib/social for community search functionality
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
}

interface CommunityFeedProps {
  className?: string;
  defaultQuery?: string;
}

const SENTIMENT_COLORS = {
  bullish: 'text-green-400',
  bearish: 'text-red-400',
  neutral: 'text-gray-400',
  mixed: 'text-yellow-400',
};

export function CommunityFeed({ className, defaultQuery = '' }: CommunityFeedProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<{
    semantic: XPost[];
    keyword: XPost[];
    users: XUser[];
  } | null>(null);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // In production, this would call the API
      // const response = await fetch('/api/social/search', {
      //   method: 'POST',
      //   body: JSON.stringify({ query }),
      // });
      // const data = await response.json();

      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockPosts: XPost[] = [
        {
          id: '1',
          text: `${query} market showing strong momentum! PSA 10 grades up 15% this month. 🚀`,
          username: 'tcg_analyst',
          displayName: 'TCG Market Analyst',
          createdAt: new Date().toISOString(),
          metrics: { likes: 342, retweets: 89, replies: 23 },
          verified: true,
        },
        {
          id: '2',
          text: `Just picked up some ${query} cards before the next wave. Who else is accumulating?`,
          username: 'collector_pro',
          displayName: 'Pro Collector',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metrics: { likes: 156, retweets: 34, replies: 67 },
        },
        {
          id: '3',
          text: `Important update on ${query}: New set announcement could impact prices significantly.`,
          username: 'tcg_news',
          displayName: 'TCG News Network',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metrics: { likes: 521, retweets: 178, replies: 45 },
          verified: true,
        },
      ];

      const mockUsers: XUser[] = [
        {
          id: 'u1',
          username: 'pokemon_investor',
          displayName: 'Pokemon Investor',
          followersCount: 125000,
          verified: true,
          bio: 'TCG market analysis & investment tips',
        },
        {
          id: 'u2',
          username: 'mtg_finance',
          displayName: 'MTG Finance',
          followersCount: 89000,
          verified: true,
          bio: 'Magic: The Gathering market updates',
        },
      ];

      setFeed({
        semantic: mockPosts,
        keyword: mockPosts.slice(0, 2),
        users: mockUsers,
      });

      setSentiment('Community sentiment appears bullish with positive price expectations and growing interest.');
    } catch (err) {
      setError('Failed to fetch community data');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className={cn('bg-gray-900 rounded-xl overflow-hidden', className)}>
      {/* Search Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">TCG Community</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search TCG communities..."
            className={cn(
              'flex-1 px-4 py-3 rounded-lg',
              'bg-gray-800 text-cyan-300 placeholder-gray-500',
              'border border-gray-700 focus:border-cyan-500',
              'outline-none transition-colors'
            )}
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className={cn(
              'px-6 py-3 rounded-lg font-bold transition-all',
              'bg-gradient-to-r from-purple-600 to-cyan-600',
              'hover:from-purple-500 hover:to-cyan-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'text-white'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Searching
              </span>
            ) : (
              'Search X'
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {feed && !error && (
        <div className="p-6 space-y-6">
          {/* Sentiment */}
          {sentiment && (
            <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-200 mb-2">
                Sentiment Analysis
              </h3>
              <p className="text-gray-300">{sentiment}</p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Posts */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Community Posts
              </h3>
              <div className="space-y-4">
                {feed.semantic.map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      'p-4 bg-gray-800/50 rounded-lg',
                      'border border-gray-700 hover:border-cyan-500/30',
                      'transition-colors duration-200'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {post.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-white font-semibold">
                              {post.displayName || post.username}
                            </span>
                            {post.verified && (
                              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-gray-500 text-sm">@{post.username}</span>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-200 mb-3">{post.text}</p>
                    <div className="flex items-center gap-6 text-gray-500 text-sm">
                      <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {formatNumber(post.metrics.likes)}
                      </span>
                      <span className="flex items-center gap-1 hover:text-green-400 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {formatNumber(post.metrics.retweets)}
                      </span>
                      <span className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {formatNumber(post.metrics.replies)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Influencers */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-4">Top Influencers</h3>
              <div className="space-y-3">
                {feed.users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'p-4 bg-gray-800/50 rounded-lg',
                      'border border-gray-700 hover:border-purple-500/30',
                      'transition-colors duration-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-semibold truncate">
                            {user.displayName}
                          </span>
                          {user.verified && (
                            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm">@{user.username}</span>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{user.bio}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-purple-300 font-bold">
                          {formatNumber(user.followersCount)}
                        </p>
                        <p className="text-gray-500 text-xs">followers</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!feed && !loading && !error && (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400">
            Search for TCG communities to see posts and influencers
          </p>
        </div>
      )}
    </div>
  );
}

export default CommunityFeed;
