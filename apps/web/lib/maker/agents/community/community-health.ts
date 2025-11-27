/**
 * Community Health Agent
 *
 * Monitors overall community health metrics including:
 * - Donation activity and generosity
 * - Fair pricing adoption
 * - Event engagement
 * - New collector onboarding
 *
 * Used for wholesome community feature suggestions.
 */

import { db } from '@/db';
import { sql, gte, eq, and, desc } from 'drizzle-orm';
import {
  communityDonations,
  communityShoutouts,
  vendors,
  tcgEvents,
  eventAttendees,
  collectorGuides,
} from '@/db/schema/tcg-community';
import { users } from '@/db/schema';

export interface CommunityMetrics {
  /** Total active vendors */
  activeVendors: number;
  /** Vendors with fair pricing pledge */
  fairPricingVendors: number;
  /** Total donations in period */
  donationsCount: number;
  /** Estimated value of donations */
  donationsValue: number;
  /** Average donations per week */
  weeklyDonationAvg: number;
  /** Total positive shoutouts */
  shoutoutsCount: number;
  /** Upcoming events count */
  upcomingEvents: number;
  /** Kid-friendly events percentage */
  kidFriendlyEventsPct: number;
  /** Published guides count */
  guidesCount: number;
  /** New collectors this month */
  newCollectors: number;
  /** Community health score (0-100) */
  healthScore: number;
  /** Areas needing improvement */
  improvementAreas: string[];
  /** Celebration highlights */
  highlights: string[];
}

export interface CommunityRecommendation {
  type: 'donation' | 'event' | 'guide' | 'shoutout' | 'fair_pricing';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
}

/**
 * Calculate community health metrics
 *
 * @param lookbackDays - Days to analyze (default: 30)
 * @returns Community health metrics
 */
export async function communityHealthAgent(
  lookbackDays: number = 30
): Promise<CommunityMetrics> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  // Get vendor metrics
  const [vendorStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      fairPricing: sql<number>`sum(case when fair_pricing_pledge then 1 else 0 end)::int`,
    })
    .from(vendors);

  const activeVendors = vendorStats?.total || 0;
  const fairPricingVendors = vendorStats?.fairPricing || 0;

  // Get donation metrics
  const [donationStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalValue: sql<string>`coalesce(sum(estimated_value::numeric), 0)`,
    })
    .from(communityDonations)
    .where(gte(communityDonations.donatedAt, lookbackDate));

  const donationsCount = donationStats?.count || 0;
  const donationsValue = parseFloat(donationStats?.totalValue || '0');
  const weeklyDonationAvg = donationsCount / (lookbackDays / 7);

  // Get shoutouts count
  const [shoutoutStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityShoutouts)
    .where(
      and(
        gte(communityShoutouts.createdAt, lookbackDate),
        eq(communityShoutouts.isApproved, true)
      )
    );

  const shoutoutsCount = shoutoutStats?.count || 0;

  // Get event metrics
  const now = new Date();
  const [eventStats] = await db
    .select({
      upcoming: sql<number>`count(*)::int`,
    })
    .from(tcgEvents)
    .where(
      and(
        gte(tcgEvents.startDate, now),
        eq(tcgEvents.status, 'published')
      )
    );

  const upcomingEvents = eventStats?.upcoming || 0;

  // Get kid-friendly events percentage (would need JSONB query in production)
  // Simplified: assume 60% for demo
  const kidFriendlyEventsPct = 60;

  // Get guides count
  const [guideStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collectorGuides)
    .where(eq(collectorGuides.status, 'published'));

  const guidesCount = guideStats?.count || 0;

  // Get new collectors (users created in period)
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [newUserStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(gte(users.createdAt, monthAgo));

  const newCollectors = newUserStats?.count || 0;

  // Calculate health score
  const healthScore = calculateHealthScore({
    activeVendors,
    fairPricingVendors,
    donationsCount,
    weeklyDonationAvg,
    shoutoutsCount,
    upcomingEvents,
    guidesCount,
    newCollectors,
  });

  // Identify improvement areas
  const improvementAreas = identifyImprovementAreas({
    fairPricingPct: activeVendors > 0 ? (fairPricingVendors / activeVendors) * 100 : 0,
    weeklyDonationAvg,
    upcomingEvents,
    guidesCount,
    kidFriendlyEventsPct,
  });

  // Generate highlights
  const highlights = generateHighlights({
    donationsCount,
    donationsValue,
    shoutoutsCount,
    newCollectors,
    fairPricingVendors,
  });

  return {
    activeVendors,
    fairPricingVendors,
    donationsCount,
    donationsValue,
    weeklyDonationAvg,
    shoutoutsCount,
    upcomingEvents,
    kidFriendlyEventsPct,
    guidesCount,
    newCollectors,
    healthScore,
    improvementAreas,
    highlights,
  };
}

/**
 * Get personalized community recommendations for a user
 */
export async function getCommunityRecommendations(
  userId: string
): Promise<CommunityRecommendation[]> {
  const recommendations: CommunityRecommendation[] = [];

  // Check if user is a vendor
  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.userId, userId),
  });

  if (vendor) {
    // Vendor-specific recommendations
    if (!vendor.fairPricingPledge) {
      recommendations.push({
        type: 'fair_pricing',
        priority: 'high',
        title: 'Take the Fair Pricing Pledge',
        description: 'Join our community of fair-pricing vendors and build trust with collectors.',
        impact: 'Increased visibility and collector trust',
      });
    }

    if (!vendor.kidFriendly) {
      recommendations.push({
        type: 'event',
        priority: 'medium',
        title: 'Consider Kid-Friendly Options',
        description: 'Mark your profile as kid-friendly to attract family collectors.',
        impact: 'Access to family-focused community events',
      });
    }
  }

  // Check recent donation activity
  const recentDonations = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityDonations)
    .where(eq(communityDonations.donorId, userId));

  if ((recentDonations[0]?.count || 0) === 0) {
    recommendations.push({
      type: 'donation',
      priority: 'low',
      title: 'Share the Joy',
      description: 'Consider donating cards to new collectors or participating in community giveaways.',
      impact: 'Build community goodwill and earn recognition',
    });
  }

  // Check if user has given shoutouts
  const recentShoutouts = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityShoutouts)
    .where(eq(communityShoutouts.authorId, userId));

  if ((recentShoutouts[0]?.count || 0) === 0) {
    recommendations.push({
      type: 'shoutout',
      priority: 'low',
      title: 'Recognize Great Vendors',
      description: 'Give a shoutout to vendors who provided great service or fair prices.',
      impact: 'Help other collectors find trustworthy vendors',
    });
  }

  // Check event attendance
  const eventAttendance = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventAttendees)
    .where(eq(eventAttendees.userId, userId));

  if ((eventAttendance[0]?.count || 0) === 0) {
    recommendations.push({
      type: 'event',
      priority: 'medium',
      title: 'Join a Local Event',
      description: 'Connect with fellow collectors at local TCG events and meetups.',
      impact: 'Build your network and find great deals',
    });
  }

  return recommendations;
}

function calculateHealthScore(metrics: {
  activeVendors: number;
  fairPricingVendors: number;
  donationsCount: number;
  weeklyDonationAvg: number;
  shoutoutsCount: number;
  upcomingEvents: number;
  guidesCount: number;
  newCollectors: number;
}): number {
  let score = 0;

  // Fair pricing adoption (up to 25 points)
  const fairPricingPct = metrics.activeVendors > 0
    ? (metrics.fairPricingVendors / metrics.activeVendors) * 100
    : 0;
  score += Math.min(25, fairPricingPct * 0.5);

  // Donation activity (up to 20 points)
  score += Math.min(20, metrics.weeklyDonationAvg * 4);

  // Community engagement via shoutouts (up to 15 points)
  score += Math.min(15, metrics.shoutoutsCount * 0.5);

  // Event activity (up to 15 points)
  score += Math.min(15, metrics.upcomingEvents * 3);

  // Educational content (up to 15 points)
  score += Math.min(15, metrics.guidesCount * 1.5);

  // New collector growth (up to 10 points)
  score += Math.min(10, metrics.newCollectors * 0.2);

  return Math.round(score);
}

function identifyImprovementAreas(metrics: {
  fairPricingPct: number;
  weeklyDonationAvg: number;
  upcomingEvents: number;
  guidesCount: number;
  kidFriendlyEventsPct: number;
}): string[] {
  const areas: string[] = [];

  if (metrics.fairPricingPct < 50) {
    areas.push('Encourage more vendors to take the fair pricing pledge');
  }

  if (metrics.weeklyDonationAvg < 2) {
    areas.push('Boost community generosity through donation campaigns');
  }

  if (metrics.upcomingEvents < 3) {
    areas.push('Organize more community events and meetups');
  }

  if (metrics.guidesCount < 10) {
    areas.push('Create more educational guides for new collectors');
  }

  if (metrics.kidFriendlyEventsPct < 40) {
    areas.push('Increase family-friendly event options');
  }

  return areas;
}

function generateHighlights(metrics: {
  donationsCount: number;
  donationsValue: number;
  shoutoutsCount: number;
  newCollectors: number;
  fairPricingVendors: number;
}): string[] {
  const highlights: string[] = [];

  if (metrics.donationsCount > 0) {
    highlights.push(
      `${metrics.donationsCount} cards donated to the community (est. $${metrics.donationsValue.toFixed(0)} value)`
    );
  }

  if (metrics.shoutoutsCount > 10) {
    highlights.push(
      `${metrics.shoutoutsCount} positive shoutouts shared this month`
    );
  }

  if (metrics.newCollectors > 0) {
    highlights.push(
      `${metrics.newCollectors} new collectors joined the community`
    );
  }

  if (metrics.fairPricingVendors > 0) {
    highlights.push(
      `${metrics.fairPricingVendors} vendors committed to fair pricing`
    );
  }

  return highlights;
}
