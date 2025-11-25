/**
 * Delight Engine - Ahead-of-Curve Personalization for Apex Intelligence
 *
 * Implements surprise-and-delight features for enhanced customer engagement:
 * - Weather-triggered AR boosts
 * - Achievement-based quantum rewards
 * - RAG-powered personalized surprises
 * - Ethics-compliant automation
 *
 * 2025 TCG Trends Integration:
 * - ML for deck building recommendations (50% adoption growth)
 * - Ethical AI for fair play verification
 * - Metaverse-ready delights
 *
 * @see knowledge-02-ai-rag-architecture-v2 for RAG patterns
 * @see pack-ai-defense-001 for resilience/anomaly detection
 */

import { db } from '@/db';
import {
  userPreferences,
  delightMoments,
  cxMetrics,
  type UserPreference,
} from '@/db/schema/customer-ux';
import { ethicsGuard } from '@/lib/ethics';
import { eq, and, gt, desc, sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

type DelightTrigger =
  | 'login'
  | 'achievement'
  | 'weather'
  | 'streak'
  | 'milestone'
  | 'community'
  | 'market_win';

interface DelightResult {
  type: string;
  title: string;
  description: string;
  reward?: {
    type: 'apex_points' | 'xp' | 'card_boost' | 'quantum_spin' | 'ar_unlock';
    amount: number;
    details?: string;
  };
  animation?: string;
  soundEffect?: string;
  expiresAt?: Date;
  error?: string;
}

interface DelightConfig {
  maxDailyDelights: number;
  cooldownMinutes: number;
  rateLimit: {
    login: number;
    achievement: number;
    weather: number;
    streak: number;
    milestone: number;
    community: number;
    market_win: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DELIGHT_CONFIG: DelightConfig = {
  maxDailyDelights: 5, // Prevent over-notification
  cooldownMinutes: 30, // Min time between same-type delights
  rateLimit: {
    login: 1, // 1 per day
    achievement: 3, // 3 per day
    weather: 2, // 2 per day
    streak: 1, // 1 per day
    milestone: 2, // 2 per day
    community: 3, // 3 per day
    market_win: 2, // 2 per day
  },
};

// ============================================================================
// RAG INTEGRATION
// ============================================================================

/**
 * Query RAG for personalized delight content
 */
async function ragQuery(params: { query: string }): Promise<{ answer: string }> {
  try {
    const { ragFusion } = await import('@/lib/rag');
    const result = await ragFusion({
      query: params.query,
      maxResults: 3,
    });
    return { answer: result?.answer || 'A special surprise awaits!' };
  } catch {
    // Fallback content generation
    return {
      answer: 'You\'ve earned a special reward for your dedication to TCG mastery!',
    };
  }
}

/**
 * Generate embedding for delight personalization
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // In production, use OpenAI text-embedding-3-large
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return new Array(1536)
    .fill(0)
    .map((_, i) =>
      Math.sin(hash * (i + 1) * 0.001) * 0.5 + Math.cos(hash * (i + 2) * 0.002) * 0.5
    );
}

// ============================================================================
// AR EVENT INTEGRATION
// ============================================================================

/**
 * Generate AR boost delight based on weather conditions
 */
async function generateARBoostDelight(
  userId: string,
  prefs: UserPreference
): Promise<DelightResult> {
  // Weather simulation (would integrate with real weather API)
  const weatherTypes = ['sunny', 'rain', 'cloudy', 'snow', 'windy', 'storm'];
  const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

  const boostMap: Record<
    string,
    { boost: string; multiplier: number; animation: string; card: string }
  > = {
    sunny: {
      boost: 'Fire & Electric cards +20%',
      multiplier: 1.2,
      animation: 'sun_flare',
      card: 'Charizard',
    },
    rain: {
      boost: 'Water cards +25%',
      multiplier: 1.25,
      animation: 'rain_drops',
      card: 'Blastoise',
    },
    cloudy: {
      boost: 'Psychic cards +15%',
      multiplier: 1.15,
      animation: 'cloud_swirl',
      card: 'Alakazam',
    },
    snow: {
      boost: 'Ice cards +30%',
      multiplier: 1.3,
      animation: 'snowfall',
      card: 'Articuno',
    },
    windy: {
      boost: 'Flying cards +20%',
      multiplier: 1.2,
      animation: 'wind_gust',
      card: 'Pidgeot',
    },
    storm: {
      boost: 'Electric & Dragon cards +35%',
      multiplier: 1.35,
      animation: 'lightning_strike',
      card: 'Rayquaza',
    },
  };

  const boost = boostMap[weather] || boostMap.sunny;
  const tcgInterests = prefs.tcgInterests as { themes?: string[] };

  return {
    type: 'ar_boost',
    title: `${weather.charAt(0).toUpperCase() + weather.slice(1)} Event Active!`,
    description: `${boost.boost} in AR mode! ${
      tcgInterests?.themes?.includes('quantum')
        ? 'Quantum resonance detected nearby.'
        : `Perfect weather for ${boost.card} hunting!`
    }`,
    reward: {
      type: 'ar_unlock',
      amount: Math.floor(boost.multiplier * 100),
      details: boost.boost,
    },
    animation: boost.animation,
    soundEffect: `weather_${weather}`,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  };
}

// ============================================================================
// QUANTUM EFFECT INTEGRATION
// ============================================================================

/**
 * Apply quantum effect for achievement rewards
 */
async function applyQuantumEffect(
  cardId: string,
  effect: 'superpose' | 'entangle' | 'collapse'
): Promise<DelightResult> {
  const effects = {
    superpose: {
      title: 'Quantum Superposition Activated!',
      description:
        'Your card exists in multiple states! Check your collection for a surprise variant.',
      reward: { type: 'quantum_spin' as const, amount: 50, details: 'Superposition bonus' },
      animation: 'quantum_wave',
    },
    entangle: {
      title: 'Quantum Entanglement!',
      description:
        'Your cards are now entangled! Matching pairs will boost each other\'s value.',
      reward: { type: 'card_boost' as const, amount: 15, details: 'Entanglement multiplier' },
      animation: 'entangle_spiral',
    },
    collapse: {
      title: 'Wave Function Collapsed!',
      description: 'The quantum state has resolved into a rare outcome!',
      reward: { type: 'apex_points' as const, amount: 100, details: 'Collapse reward' },
      animation: 'collapse_burst',
    },
  };

  const effectData = effects[effect];

  return {
    type: 'quantum_effect',
    ...effectData,
    soundEffect: `quantum_${effect}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if user has exceeded delight rate limits
 */
async function checkDelightRateLimit(
  userId: string,
  trigger: DelightTrigger
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  // Count delights of this type today
  const todayDelights = await db.query.delightMoments.findMany({
    where: and(
      eq(delightMoments.userId, userId),
      gt(delightMoments.triggeredAt, dayStart)
    ),
  });

  const typeCount = todayDelights.filter(
    (d) => d.momentType === trigger || d.momentType === `${trigger}_reward`
  ).length;

  const limit = DELIGHT_CONFIG.rateLimit[trigger];
  const totalCount = todayDelights.length;

  // Check cooldown
  const lastDelight = todayDelights
    .filter((d) => d.momentType === trigger || d.momentType === `${trigger}_reward`)
    .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())[0];

  if (lastDelight) {
    const cooldownEnd = new Date(
      lastDelight.triggeredAt.getTime() + DELIGHT_CONFIG.cooldownMinutes * 60 * 1000
    );
    if (now < cooldownEnd) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: cooldownEnd,
      };
    }
  }

  const allowed =
    typeCount < limit && totalCount < DELIGHT_CONFIG.maxDailyDelights;

  return {
    allowed,
    remaining: Math.max(0, limit - typeCount),
    resetAt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
  };
}

// ============================================================================
// MAIN DELIGHT TRIGGER
// ============================================================================

/**
 * Trigger a delight for the user
 *
 * Ethics-aware personalization with rate limiting to prevent over-notification.
 * Integrates AR events, quantum effects, and RAG-powered surprises.
 *
 * @param userId - User ID
 * @param trigger - What triggered the delight
 * @param context - Additional context (e.g., achievement name, card ID)
 */
export async function triggerDelight(
  userId: string,
  trigger: DelightTrigger,
  context?: Record<string, unknown>
): Promise<DelightResult> {
  try {
    // Ethics check (ensure delights don't cause harm)
    const guard = await ethicsGuard(
      { type: 'ux_delight', impactScore: 0.2 },
      userId
    );

    if (!guard.approved) {
      return {
        type: 'none',
        title: '',
        description: '',
        error: guard.error || 'Delight requires ethics review',
      };
    }

    // Rate limit check
    const rateCheck = await checkDelightRateLimit(userId, trigger);
    if (!rateCheck.allowed) {
      return {
        type: 'rate_limited',
        title: '',
        description: '',
        error: `Rate limited - resets at ${rateCheck.resetAt.toLocaleTimeString()}`,
      };
    }

    // Fetch user preferences
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    if (!prefs) {
      return {
        type: 'none',
        title: '',
        description: '',
        error: 'User preferences not found',
      };
    }

    // Generate delight based on trigger
    let delight: DelightResult;

    switch (trigger) {
      case 'weather':
        delight = await generateARBoostDelight(userId, prefs);
        break;

      case 'achievement':
        const effect = ['superpose', 'entangle', 'collapse'][
          Math.floor(Math.random() * 3)
        ] as 'superpose' | 'entangle' | 'collapse';
        delight = await applyQuantumEffect(
          (context?.cardId as string) || 'default',
          effect
        );
        break;

      case 'streak': {
        const streakDays = (context?.days as number) || 7;
        delight = {
          type: 'streak_bonus',
          title: `${streakDays}-Day Streak!`,
          description: `You've logged in ${streakDays} days in a row! Here's your streak bonus.`,
          reward: {
            type: 'apex_points',
            amount: streakDays * 10,
            details: `${streakDays}x streak multiplier`,
          },
          animation: 'streak_fire',
          soundEffect: 'streak_achievement',
        };
        break;
      }

      case 'milestone': {
        const milestone = (context?.milestone as string) || 'collection_100';
        const ragDelight = await ragQuery({
          query: `Generate celebration message for TCG milestone: ${milestone}`,
        });
        delight = {
          type: 'milestone_celebration',
          title: 'Milestone Achieved!',
          description: ragDelight.answer,
          reward: {
            type: 'apex_points',
            amount: 200,
            details: milestone,
          },
          animation: 'milestone_confetti',
          soundEffect: 'milestone_fanfare',
        };
        break;
      }

      case 'community': {
        const action = (context?.action as string) || 'share';
        delight = {
          type: 'community_reward',
          title: 'Community Champion!',
          description: `Thanks for ${action}ing with the community! You're making TCG better for everyone.`,
          reward: {
            type: 'xp',
            amount: 50,
            details: `Community ${action} bonus`,
          },
          animation: 'community_hearts',
          soundEffect: 'community_cheer',
        };
        break;
      }

      case 'market_win': {
        const profit = (context?.profit as number) || 0;
        delight = {
          type: 'market_success',
          title: 'Smart Trade!',
          description: `Your market insight paid off! ${
            profit > 0 ? `+$${profit.toFixed(2)} profit` : 'Great timing!'
          }`,
          reward: {
            type: 'apex_points',
            amount: Math.min(Math.floor(profit * 10), 500),
            details: 'Market win bonus',
          },
          animation: 'money_rain',
          soundEffect: 'cash_register',
        };
        break;
      }

      case 'login':
      default: {
        const tcgInterests = prefs.tcgInterests as { themes?: string[]; favoriteGames?: string[] };
        const ragDelight = await ragQuery({
          query: `Generate personalized welcome message for TCG collector interested in: ${
            tcgInterests?.themes?.join(', ') || 'cards'
          }, games: ${tcgInterests?.favoriteGames?.join(', ') || 'Pokemon'}`,
        });

        delight = {
          type: 'daily_welcome',
          title: 'Welcome Back!',
          description: ragDelight.answer,
          reward: {
            type: 'apex_points',
            amount: 25,
            details: 'Daily login bonus',
          },
          animation: 'welcome_sparkle',
          soundEffect: 'welcome_chime',
        };
        break;
      }
    }

    // Store delight moment in database
    await db.insert(delightMoments).values({
      userId,
      momentType: trigger as any,
      title: delight.title,
      description: delight.description,
      data: {
        reward: delight.reward,
        animation: delight.animation,
        context,
      },
      expiresAt: delight.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Update user preference vector for future personalization
    const delightText = JSON.stringify({
      trigger,
      type: delight.type,
      reward: delight.reward,
    });
    const updateVector = await generateEmbedding(delightText);

    // Blend with existing preferences (weighted average)
    const existingVector = prefs.prefVector || [];
    const blendedVector = existingVector.length > 0
      ? existingVector.map((v, i) => v * 0.9 + (updateVector[i] || 0) * 0.1)
      : updateVector;

    await db
      .update(userPreferences)
      .set({
        prefVector: blendedVector,
        engagementScore: sql`${userPreferences.engagementScore} + 0.5`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.id, prefs.id));

    // Update CX metrics
    await updateCXMetricsForDelight(userId, trigger);

    return delight;
  } catch (error) {
    console.error('[Delight Engine] Error:', error);
    return {
      type: 'error',
      title: '',
      description: '',
      error: error instanceof Error ? error.message : 'Failed to generate delight',
    };
  }
}

/**
 * Update CX metrics after delight delivery
 */
async function updateCXMetricsForDelight(
  userId: string,
  trigger: DelightTrigger
): Promise<void> {
  try {
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);

    const existing = await db.query.cxMetrics.findFirst({
      where: and(
        eq(cxMetrics.userId, userId),
        eq(cxMetrics.periodStart, periodStart)
      ),
    });

    const delightBonus = {
      login: 1,
      achievement: 3,
      weather: 2,
      streak: 4,
      milestone: 5,
      community: 2,
      market_win: 3,
    }[trigger];

    if (existing) {
      await db
        .update(cxMetrics)
        .set({
          cxScore: sql`LEAST(${cxMetrics.cxScore} + ${delightBonus}, 100)`,
          featuresUsed: sql`array_append(${cxMetrics.featuresUsed}, 'delight_${trigger}')`,
          updatedAt: new Date(),
        })
        .where(eq(cxMetrics.id, existing.id));
    }
  } catch (error) {
    console.error('[Delight Engine] CX update error:', error);
  }
}

// ============================================================================
// DELIGHT RECOMMENDATIONS
// ============================================================================

/**
 * Get recommended delights for user based on activity patterns
 */
export async function getDelightRecommendations(
  userId: string
): Promise<Array<{ trigger: DelightTrigger; reason: string; priority: number }>> {
  try {
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    if (!prefs) return [];

    const recommendations: Array<{
      trigger: DelightTrigger;
      reason: string;
      priority: number;
    }> = [];

    // Check streak potential
    const lastActive = prefs.lastActiveAt;
    const daysSinceActive = Math.floor(
      (Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceActive === 0) {
      recommendations.push({
        trigger: 'streak',
        reason: 'Continue your daily streak!',
        priority: 1,
      });
    }

    // Weather delight if AR enabled
    if (prefs.arEventsEnabled) {
      recommendations.push({
        trigger: 'weather',
        reason: 'Check weather-boosted cards',
        priority: 2,
      });
    }

    // Achievement if high engagement
    if (prefs.engagementScore > 50) {
      recommendations.push({
        trigger: 'achievement',
        reason: 'Unlock quantum rewards',
        priority: 3,
      });
    }

    // Community delight for social users
    const tcgInterests = prefs.tcgInterests as { playStyle?: string };
    if (tcgInterests?.playStyle !== 'collector') {
      recommendations.push({
        trigger: 'community',
        reason: 'Join community events',
        priority: 4,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error('[Delight Engine] Recommendations error:', error);
    return [];
  }
}

// ============================================================================
// DELIGHT ANALYTICS
// ============================================================================

/**
 * Get delight effectiveness metrics for A/B testing
 */
export async function getDelightMetrics(
  userId: string,
  days: number = 30
): Promise<{
  totalDelights: number;
  byType: Record<string, number>;
  engagementLift: number;
  retentionImpact: number;
}> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const delights = await db.query.delightMoments.findMany({
      where: and(
        eq(delightMoments.userId, userId),
        gt(delightMoments.triggeredAt, startDate)
      ),
    });

    const byType: Record<string, number> = {};
    for (const d of delights) {
      byType[d.momentType] = (byType[d.momentType] || 0) + 1;
    }

    // Calculate engagement lift (simplified)
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    const engagementLift = prefs
      ? Math.min((prefs.engagementScore / 50) * 100, 150)
      : 0;

    // Calculate retention impact (simplified)
    const retentionImpact = delights.length > 0
      ? Math.min((delights.length / days) * 30, 100)
      : 0;

    return {
      totalDelights: delights.length,
      byType,
      engagementLift,
      retentionImpact,
    };
  } catch (error) {
    console.error('[Delight Engine] Metrics error:', error);
    return {
      totalDelights: 0,
      byType: {},
      engagementLift: 0,
      retentionImpact: 0,
    };
  }
}
