/**
 * Newbie Guide Agent
 *
 * RAG-powered personalized guide recommendations for new collectors.
 * Especially focused on making TCG collecting accessible and affordable
 * for kids and budget-conscious collectors.
 */

import { db } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { collectorGuides, type CollectorGuide } from '@/db/schema/tcg-community';

export interface GuideRecommendation {
  guideId: string;
  title: string;
  slug: string;
  guideType: string;
  targetAudience: string;
  summary: string | null;
  relevanceScore: number;
  reason: string;
}

export interface CollectorProfile {
  isNew: boolean;
  preferredGame?: string;
  age?: 'kid' | 'teen' | 'adult';
  budget?: 'low' | 'medium' | 'high';
  interests?: string[];
  hasParent?: boolean;
}

/**
 * Get personalized guide recommendations based on collector profile
 *
 * @param profile - Collector profile for personalization
 * @param limit - Maximum guides to return
 * @returns Ranked list of guide recommendations
 */
export async function newbieGuideAgent(
  profile: CollectorProfile,
  limit: number = 5
): Promise<GuideRecommendation[]> {
  // Get all published guides
  const guides = await db.query.collectorGuides.findMany({
    where: eq(collectorGuides.status, 'published'),
    orderBy: [desc(collectorGuides.helpfulCount)],
  });

  // Score and rank guides based on profile
  const scoredGuides = guides.map((guide) => ({
    guide,
    score: calculateRelevanceScore(guide, profile),
    reason: generateRecommendationReason(guide, profile),
  }));

  // Sort by relevance score
  scoredGuides.sort((a, b) => b.score - a.score);

  // Return top recommendations
  return scoredGuides.slice(0, limit).map(({ guide, score, reason }) => ({
    guideId: guide.id,
    title: guide.title,
    slug: guide.slug,
    guideType: guide.guideType,
    targetAudience: guide.targetAudience,
    summary: guide.summary,
    relevanceScore: score,
    reason,
  }));
}

/**
 * Get starter pack recommendations for new collectors
 */
export async function getStarterRecommendations(
  game: string = 'pokemon',
  budget: 'low' | 'medium' | 'high' = 'low'
): Promise<{
  guides: GuideRecommendation[];
  budgetTips: string[];
  firstPurchases: string[];
}> {
  const profile: CollectorProfile = {
    isNew: true,
    preferredGame: game,
    budget,
  };

  const guides = await newbieGuideAgent(profile, 3);

  const budgetTips = getBudgetTips(budget);
  const firstPurchases = getFirstPurchaseRecommendations(game, budget);

  return {
    guides,
    budgetTips,
    firstPurchases,
  };
}

/**
 * Get kid-friendly content recommendations
 */
export async function getKidFriendlyContent(
  game: string = 'pokemon'
): Promise<{
  guides: GuideRecommendation[];
  safetyTips: string[];
  parentResources: GuideRecommendation[];
}> {
  // Get kid-focused guides
  const kidGuides = await newbieGuideAgent(
    { isNew: true, preferredGame: game, age: 'kid' },
    3
  );

  // Get parent guides
  const parentGuides = await newbieGuideAgent(
    { isNew: true, preferredGame: game, hasParent: true },
    2
  );

  const safetyTips = [
    'Never share personal information with strangers when trading',
    'Always trade with a parent or guardian present',
    'Meet in public, well-lit places for in-person trades',
    'If a deal seems too good to be true, it probably is',
    'Keep valuable cards in protective sleeves',
    'It\'s okay to say no to any trade you\'re not comfortable with',
  ];

  return {
    guides: kidGuides,
    safetyTips,
    parentResources: parentGuides,
  };
}

function calculateRelevanceScore(
  guide: CollectorGuide,
  profile: CollectorProfile
): number {
  let score = 0;

  // Base score from helpfulness
  score += Math.min(20, guide.helpfulCount / 5);

  // New collector bonus for getting_started guides
  if (profile.isNew && guide.guideType === 'getting_started') {
    score += 30;
  }

  // Budget matching
  if (profile.budget === 'low' && guide.budgetFriendly) {
    score += 25;
  }

  // Age appropriateness
  if (profile.age === 'kid') {
    if (guide.targetAudience === 'kids' || guide.targetAudience === 'all') {
      score += 20;
    }
    if (guide.difficultyLevel === 'beginner') {
      score += 10;
    }
  } else if (profile.age === 'teen') {
    if (guide.targetAudience === 'teens' || guide.targetAudience === 'all') {
      score += 15;
    }
  } else if (profile.age === 'adult') {
    if (guide.targetAudience === 'adults' || guide.targetAudience === 'all') {
      score += 15;
    }
  }

  // Game matching
  if (
    profile.preferredGame &&
    (guide.targetGame === profile.preferredGame || guide.targetGame === 'general')
  ) {
    score += 15;
  }

  // Parent resources
  if (profile.hasParent && guide.guideType === 'parent_guide') {
    score += 25;
  }

  // Interest matching via RAG tags
  if (profile.interests && guide.ragTags) {
    const matchingTags = profile.interests.filter((interest) =>
      guide.ragTags?.includes(interest.toLowerCase())
    );
    score += matchingTags.length * 5;
  }

  return score;
}

function generateRecommendationReason(
  guide: CollectorGuide,
  profile: CollectorProfile
): string {
  const reasons: string[] = [];

  if (profile.isNew && guide.guideType === 'getting_started') {
    reasons.push('Perfect for getting started');
  }

  if (profile.budget === 'low' && guide.budgetFriendly) {
    reasons.push('Budget-friendly tips included');
  }

  if (profile.age === 'kid' && guide.targetAudience === 'kids') {
    reasons.push('Written especially for young collectors');
  }

  if (
    profile.preferredGame &&
    guide.targetGame === profile.preferredGame
  ) {
    reasons.push(`Focused on ${profile.preferredGame}`);
  }

  if (profile.hasParent && guide.guideType === 'parent_guide') {
    reasons.push('Helpful guide for parents');
  }

  if (guide.helpfulCount > 10) {
    reasons.push('Highly rated by the community');
  }

  return reasons.length > 0
    ? reasons.join(' • ')
    : 'Recommended based on your interests';
}

function getBudgetTips(budget: 'low' | 'medium' | 'high'): string[] {
  const baseTips = [
    'Check for deals at local card shops before buying online',
    'Join community trading groups for better prices',
    'Look for vendors with the fair pricing pledge',
  ];

  if (budget === 'low') {
    return [
      ...baseTips,
      'Start with common and uncommon cards - they\'re just as fun to collect!',
      'Buy loose packs instead of booster boxes when starting out',
      'Trade duplicates instead of buying new cards',
      'Attend local events for free card giveaways',
      'Set a monthly budget and stick to it',
    ];
  }

  if (budget === 'medium') {
    return [
      ...baseTips,
      'Consider booster boxes for better per-pack value',
      'Look for sales during holidays and special events',
      'Join rewards programs at local card shops',
    ];
  }

  return [
    ...baseTips,
    'Consider graded cards for long-term value',
    'Research market trends before major purchases',
    'Build relationships with trusted vendors for exclusive deals',
  ];
}

function getFirstPurchaseRecommendations(
  game: string,
  budget: 'low' | 'medium' | 'high'
): string[] {
  const baseItems = [
    'Card sleeves (to protect your cards)',
    'A binder or deck box for storage',
    'A playmat for trading and playing',
  ];

  if (game === 'pokemon') {
    if (budget === 'low') {
      return [
        ...baseItems,
        'A theme deck or battle deck ($10-15)',
        '2-3 loose booster packs ($4-5 each)',
        'Pokemon trainer\'s toolkit (when on sale)',
      ];
    }
    return [
      ...baseItems,
      'Elite Trainer Box ($40-50)',
      'Theme deck for learning to play',
      'A few booster packs for the excitement',
    ];
  }

  if (game === 'mtg') {
    if (budget === 'low') {
      return [
        ...baseItems,
        'Welcome deck (often free at game stores)',
        'Jumpstart packs for easy play',
        '2-3 draft boosters',
      ];
    }
    return [
      ...baseItems,
      'Commander precon deck ($40-50)',
      'Draft booster box for sealed play',
      'Basic land station',
    ];
  }

  // Generic recommendations
  return [
    ...baseItems,
    'Starter deck for the game you\'re interested in',
    'A few booster packs to experience the excitement',
    'Price guide app to understand card values',
  ];
}
