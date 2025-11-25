'use client';

/**
 * Apex TCG Nexus Dashboard
 *
 * Personalized hub for TCG collectors and investors with:
 * - Hyper-personalized recommendations (RAG + pgvector)
 * - Location-based AR events
 * - Real-time market updates
 * - Community integration
 * - Tutorial resources
 *
 * @see lib/customer-ux for personalization logic
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CommunityFeed } from '@/components/social/CommunityFeed';
import { TutorialPlayer } from '@/components/video/TutorialPlayer';
import { PurposeModeToggle } from '@/components/purpose/PurposeModeToggle';

// ============================================================================
// TYPES
// ============================================================================

interface TCGInterests {
  themes: string[];
  playStyle: string;
  favoriteGames: string[];
  priceRange: { min: number; max: number };
  rarity: string;
  gradingPreference: string;
}

interface AREventData {
  boost: string;
  multiplier: number;
  stores: Array<{ name: string; address: string; distance: number }>;
  cards?: Array<{ cardId: string; rarity: string }>;
}

interface DashboardContent {
  recommendations: string[];
  marketTrends: string;
  personalizedTips: string[];
  upcomingEvents: string[];
}

interface DelightReward {
  type: 'apex_points' | 'xp' | 'card_boost' | 'quantum_spin' | 'ar_unlock';
  amount: number;
  details?: string;
}

interface DelightMoment {
  type: string;
  title: string;
  description: string;
  reward?: DelightReward;
  animation?: string;
  soundEffect?: string;
}

interface NexusData {
  prefs: { tcgInterests: TCGInterests } | null;
  arEvent: AREventData | null;
  content: DashboardContent;
  delightMoment?: DelightMoment;
  cxScore: number;
  error?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function PreferencesCard({ interests }: { interests: TCGInterests }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Your TCG Profile
      </h3>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-400 text-sm">Themes:</span>
          {interests.themes.map((theme, i) => (
            <span key={i} className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-lg text-sm">
              {theme}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Play Style:</span>
          <span className="px-2 py-1 bg-cyan-600/30 text-cyan-300 rounded-lg text-sm capitalize">
            {interests.playStyle}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-400 text-sm">Games:</span>
          {interests.favoriteGames.map((game, i) => (
            <span key={i} className="px-2 py-1 bg-green-600/30 text-green-300 rounded-lg text-sm capitalize">
              {game}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Price Range:</span>
          <span className="text-white">
            ${interests.priceRange.min} - ${interests.priceRange.max}
          </span>
        </div>
      </div>
    </div>
  );
}

function AREventsCard({ arEvent }: { arEvent: AREventData }) {
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 rounded-xl p-6 border border-cyan-500/30">
      <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Location-Based AR Events
      </h3>

      {/* Weather Boost */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Weather Boost Active</span>
          <span className="text-green-400 font-bold">{arEvent.multiplier}x</span>
        </div>
        <p className="text-cyan-300 mt-1">{arEvent.boost}</p>
      </div>

      {/* Nearby Stores */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Nearby TCG Stores:</p>
        {arEvent.stores.map((store, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
            <div>
              <p className="text-white font-medium">{store.name}</p>
              <p className="text-gray-500 text-sm">{store.address}</p>
            </div>
            <span className="text-cyan-400 text-sm">{store.distance} mi</span>
          </div>
        ))}
      </div>

      {/* Spawning Cards */}
      {arEvent.cards && arEvent.cards.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Cards Spawning Nearby:</p>
          <div className="flex flex-wrap gap-2">
            {arEvent.cards.map((card, i) => (
              <span key={i} className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                {card.cardId} ({card.rarity})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationsCard({ content }: { content: DashboardContent }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Curated Recommendations
      </h3>

      {/* Recommendations List */}
      <div className="space-y-3 mb-6">
        {content.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600/30 text-purple-300 rounded-full flex items-center justify-center text-sm">
              {i + 1}
            </span>
            <p className="text-gray-200">{rec}</p>
          </div>
        ))}
      </div>

      {/* Market Trends */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-cyan-400 mb-2">Market Trends</h4>
        <p className="text-gray-300 text-sm">{content.marketTrends}</p>
      </div>

      {/* Tips */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Pro Tips</h4>
        <ul className="space-y-1">
          {content.personalizedTips.map((tip, i) => (
            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
              <span className="text-cyan-500">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DelightMomentBanner({ moment, onDismiss }: { moment: DelightMoment; onDismiss: () => void }) {
  const iconMap: Record<string, string> = {
    daily_reward: '🎁',
    daily_welcome: '👋',
    weather_animation: '🌤️',
    personalized_tip: '💡',
    quantum_rng: '🎲',
    quantum_effect: '⚛️',
    streak_bonus: '🔥',
    achievement: '🏆',
    ar_boost: '📍',
    community_reward: '👥',
    market_success: '📈',
    milestone_celebration: '🎉',
  };

  const rewardIconMap: Record<string, string> = {
    apex_points: '🪙',
    xp: '⭐',
    card_boost: '🃏',
    quantum_spin: '🎰',
    ar_unlock: '🗺️',
  };

  return (
    <div className={cn(
      'rounded-xl p-4 border mb-6',
      'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border-purple-500/30',
      moment.animation && 'animate-pulse'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{iconMap[moment.type] || '✨'}</span>
          <div>
            <h4 className="text-white font-bold">{moment.title}</h4>
            <p className="text-gray-300 text-sm">{moment.description}</p>
            {/* Reward Display */}
            {moment.reward && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{rewardIconMap[moment.reward.type] || '🎁'}</span>
                <span className="text-cyan-400 font-semibold">
                  +{moment.reward.amount} {moment.reward.type.replace('_', ' ')}
                </span>
                {moment.reward.details && (
                  <span className="text-gray-500 text-xs">({moment.reward.details})</span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CXScoreWidget({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 60) return 'text-cyan-400';
    if (s >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">Your CX Score</span>
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>
          {score}
        </span>
      </div>
      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', {
            'bg-green-500': score >= 80,
            'bg-cyan-500': score >= 60 && score < 80,
            'bg-yellow-500': score >= 40 && score < 60,
            'bg-red-500': score < 40,
          })}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function ApexTCGNexus() {
  const [data, setData] = useState<NexusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelight, setShowDelight] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'community' | 'tutorials'>('overview');

  // Mock userId - would come from auth context
  const userId = 'user_demo_123';

  // Trigger login delight on mount
  const triggerLoginDelight = useCallback(async () => {
    try {
      // In production, this calls the delight engine API
      // const response = await fetch('/api/nexus/delight', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ trigger: 'login' }),
      // });
      // const delight = await response.json();
      // if (delight.type && !delight.error) {
      //   setData(prev => prev ? { ...prev, delightMoment: delight } : null);
      // }
      console.log('[Nexus] Login delight triggered');
    } catch (err) {
      console.error('[Nexus] Delight trigger error:', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // In production, this calls the API
      // const response = await fetch('/api/nexus/personalize', {
      //   headers: { 'x-user-id': userId },
      // });
      // const data = await response.json();
      // Then trigger login delight
      // await triggerLoginDelight();

      // Simulated API response
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: NexusData = {
        prefs: {
          tcgInterests: {
            themes: ['classic', 'competitive', 'quantum'],
            playStyle: 'balanced',
            favoriteGames: ['pokemon', 'mtg'],
            priceRange: { min: 50, max: 2000 },
            rarity: 'any',
            gradingPreference: 'psa',
          },
        },
        arEvent: {
          boost: 'Water cards +20%',
          multiplier: 1.2,
          stores: [
            { name: 'CardMaster TCG', address: '123 Main St', distance: 0.5 },
            { name: 'Elite Gaming', address: '456 Oak Ave', distance: 1.2 },
          ],
          cards: [
            { cardId: 'blastoise-base', rarity: 'holo' },
            { cardId: 'gyarados-base', rarity: 'holo' },
          ],
        },
        content: {
          recommendations: [
            'Based on your balanced style, explore vintage Pokémon holos',
            'Psychic-type cards align with your quantum theme interest',
            'Cards in your $50-$2000 range showing strong momentum this week',
          ],
          marketTrends: 'Base Set holos continue their upward trend. PSA 10 specimens commanding premium prices. Consider graded submissions for raw cards in excellent condition.',
          personalizedTips: [
            'Set price alerts for cards on your watchlist',
            'Check population reports before high-value purchases',
            'Compare across platforms for arbitrage opportunities',
          ],
          upcomingEvents: [
            'Weekly TCG Tournament - Saturday 2PM',
            'New Set Release Preview - Coming Soon',
          ],
        },
        delightMoment: {
          type: 'daily_welcome',
          title: 'Welcome Back!',
          description: 'Your favorite quantum-themed cards are trending up 12% this week!',
          reward: {
            type: 'apex_points',
            amount: 25,
            details: 'Daily login bonus',
          },
          animation: 'welcome_sparkle',
        },
        cxScore: 75,
      };

      setData(mockData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-4" />
          <p className="text-cyan-300">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-red-900/20 p-8 rounded-xl border border-red-500/30">
          <p className="text-red-400 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Apex TCG Nexus
              </h1>
              <p className="text-gray-400 text-sm">Your Personalized TCG Hub</p>
            </div>
            <div className="flex items-center gap-4">
              <CXScoreWidget score={data.cxScore} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            {(['overview', 'community', 'tutorials'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors capitalize',
                  activeTab === tab
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Delight Moment */}
        {showDelight && data.delightMoment && (
          <DelightMomentBanner
            moment={data.delightMoment}
            onDismiss={() => setShowDelight(false)}
          />
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preferences */}
            {data.prefs && (
              <PreferencesCard interests={data.prefs.tcgInterests} />
            )}

            {/* AR Events */}
            {data.arEvent && (
              <AREventsCard arEvent={data.arEvent} />
            )}

            {/* Recommendations - Full Width */}
            <div className="lg:col-span-2">
              <RecommendationsCard content={data.content} />
            </div>

            {/* Upcoming Events */}
            <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-200 mb-4">Upcoming Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.content.upcomingEvents.map((event, i) => (
                  <div key={i} className="bg-gray-900/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-200">{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <CommunityFeed defaultQuery="pokemon tcg market" />
        )}

        {activeTab === 'tutorials' && (
          <TutorialPlayer topic="TCG Investment Strategies" />
        )}
      </main>

      {/* Purpose Mode Toggle */}
      <PurposeModeToggle currentAction="Dashboard Personalization" userId={userId} />
    </div>
  );
}
