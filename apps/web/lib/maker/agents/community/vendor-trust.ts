/**
 * Vendor Trust Agent
 *
 * Calculates and manages vendor trust scores based on:
 * - Fair pricing adherence
 * - Community feedback (shoutouts)
 * - Sales history
 * - Scalping reports
 * - Donation activity
 */

import { db } from '@/db';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import {
  vendors,
  vendorInventories,
  communityShoutouts,
  communityDonations,
  scalpingReports,
  type Vendor,
} from '@/db/schema/tcg-community';

export interface TrustScore {
  vendorId: string;
  vendorName: string;
  overallScore: number; // 0-100
  breakdown: {
    fairPricing: number; // 0-25
    communityFeedback: number; // 0-25
    salesHistory: number; // 0-20
    donationActivity: number; // 0-15
    reportPenalty: number; // 0 to -15
    pledgeBonus: number; // 0-10
  };
  badges: string[];
  trustLevel: 'new' | 'trusted' | 'verified' | 'champion';
  warnings: string[];
  recommendations: string[];
}

export interface TrustFactors {
  fairPricedListings: number;
  totalListings: number;
  positiveShoutouts: number;
  totalShoutouts: number;
  totalSales: number;
  donationsCount: number;
  donationsValue: number;
  confirmedScalpingReports: number;
  pendingReports: number;
  hasFairPricingPledge: boolean;
  kidFriendly: boolean;
  accountAge: number; // days
}

/**
 * Calculate trust score for a vendor
 *
 * @param vendorId - Vendor ID to analyze
 * @returns Comprehensive trust score analysis
 */
export async function vendorTrustAgent(vendorId: string): Promise<TrustScore> {
  // Get vendor profile
  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.id, vendorId),
  });

  if (!vendor) {
    throw new Error(`Vendor not found: ${vendorId}`);
  }

  // Gather trust factors
  const factors = await gatherTrustFactors(vendorId, vendor);

  // Calculate score breakdown
  const breakdown = calculateScoreBreakdown(factors);

  // Calculate overall score
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      breakdown.fairPricing +
        breakdown.communityFeedback +
        breakdown.salesHistory +
        breakdown.donationActivity +
        breakdown.reportPenalty +
        breakdown.pledgeBonus
    )
  );

  // Determine trust level
  const trustLevel = determineTrustLevel(overallScore, factors);

  // Generate badges
  const badges = generateBadges(factors, overallScore);

  // Generate warnings
  const warnings = generateWarnings(factors);

  // Generate recommendations
  const recommendations = generateRecommendations(factors, breakdown);

  // Update vendor's trust score in database
  await db
    .update(vendors)
    .set({
      trustScore: overallScore / 100, // Store as 0-1
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId));

  return {
    vendorId,
    vendorName: vendor.name,
    overallScore,
    breakdown,
    badges,
    trustLevel,
    warnings,
    recommendations,
  };
}

/**
 * Get top trusted vendors
 */
export async function getTopTrustedVendors(
  limit: number = 10,
  game?: string
): Promise<Array<{ vendor: Vendor; trustScore: TrustScore }>> {
  const conditions = [gte(vendors.trustScore, 0.5)]; // At least 50% trust

  if (game) {
    conditions.push(eq(vendors.primaryGame, game as Vendor['primaryGame']));
  }

  const topVendors = await db.query.vendors.findMany({
    where: and(...conditions),
    orderBy: [desc(vendors.trustScore)],
    limit,
  });

  const results = await Promise.all(
    topVendors.map(async (vendor) => ({
      vendor,
      trustScore: await vendorTrustAgent(vendor.id),
    }))
  );

  return results;
}

/**
 * Get vendors needing trust improvement
 */
export async function getVendorsNeedingImprovement(
  limit: number = 10
): Promise<Array<{ vendor: Vendor; issues: string[] }>> {
  const lowTrustVendors = await db.query.vendors.findMany({
    where: and(
      gte(vendors.trustScore, 0), // Has some activity
      sql`${vendors.trustScore} < 0.5` // Below 50%
    ),
    orderBy: [desc(vendors.createdAt)],
    limit,
  });

  const results = await Promise.all(
    lowTrustVendors.map(async (vendor) => {
      const trustScore = await vendorTrustAgent(vendor.id);
      return {
        vendor,
        issues: [...trustScore.warnings, ...trustScore.recommendations],
      };
    })
  );

  return results;
}

async function gatherTrustFactors(
  vendorId: string,
  vendor: Vendor
): Promise<TrustFactors> {
  // Get inventory stats
  const [inventoryStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      fairPriced: sql<number>`sum(case when is_fair_priced then 1 else 0 end)::int`,
    })
    .from(vendorInventories)
    .where(
      and(eq(vendorInventories.vendorId, vendorId), eq(vendorInventories.isListed, true))
    );

  // Get shoutout stats
  const [shoutoutStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      positive: sql<number>`sum(case when shoutout_type in ('great_deal', 'fair_pricing', 'excellent_service', 'generous_donation') then 1 else 0 end)::int`,
    })
    .from(communityShoutouts)
    .where(
      and(
        eq(communityShoutouts.recipientVendorId, vendorId),
        eq(communityShoutouts.isApproved, true)
      )
    );

  // Get donation stats
  const [donationStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalValue: sql<string>`coalesce(sum(estimated_value::numeric), 0)`,
    })
    .from(communityDonations)
    .where(eq(communityDonations.vendorId, vendorId));

  // Get scalping report stats
  const [reportStats] = await db
    .select({
      confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)::int`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)::int`,
    })
    .from(scalpingReports)
    .where(eq(scalpingReports.vendorId, vendorId));

  // Calculate account age
  const accountAge = Math.floor(
    (Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    fairPricedListings: inventoryStats?.fairPriced || 0,
    totalListings: inventoryStats?.total || 0,
    positiveShoutouts: shoutoutStats?.positive || 0,
    totalShoutouts: shoutoutStats?.total || 0,
    totalSales: vendor.totalSales,
    donationsCount: donationStats?.count || 0,
    donationsValue: parseFloat(donationStats?.totalValue || '0'),
    confirmedScalpingReports: reportStats?.confirmed || 0,
    pendingReports: reportStats?.pending || 0,
    hasFairPricingPledge: vendor.fairPricingPledge,
    kidFriendly: vendor.kidFriendly,
    accountAge,
  };
}

function calculateScoreBreakdown(factors: TrustFactors): TrustScore['breakdown'] {
  // Fair pricing score (0-25)
  let fairPricing = 0;
  if (factors.totalListings > 0) {
    const fairPct = (factors.fairPricedListings / factors.totalListings) * 100;
    fairPricing = Math.min(25, fairPct * 0.25);
  } else {
    fairPricing = 12; // Neutral for new vendors
  }

  // Community feedback score (0-25)
  let communityFeedback = 0;
  if (factors.totalShoutouts > 0) {
    const positivePct = (factors.positiveShoutouts / factors.totalShoutouts) * 100;
    communityFeedback = Math.min(25, positivePct * 0.25);
  } else {
    communityFeedback = 10; // Neutral for new vendors
  }

  // Sales history score (0-20)
  const salesHistory = Math.min(20, factors.totalSales * 0.5);

  // Donation activity score (0-15)
  const donationActivity = Math.min(
    15,
    factors.donationsCount * 2 + factors.donationsValue / 50
  );

  // Report penalty (0 to -15)
  const reportPenalty =
    -(factors.confirmedScalpingReports * 5) - (factors.pendingReports * 1);

  // Pledge bonus (0-10)
  let pledgeBonus = 0;
  if (factors.hasFairPricingPledge) pledgeBonus += 7;
  if (factors.kidFriendly) pledgeBonus += 3;

  return {
    fairPricing: Math.round(fairPricing),
    communityFeedback: Math.round(communityFeedback),
    salesHistory: Math.round(salesHistory),
    donationActivity: Math.round(donationActivity),
    reportPenalty: Math.round(reportPenalty),
    pledgeBonus: Math.round(pledgeBonus),
  };
}

function determineTrustLevel(
  score: number,
  factors: TrustFactors
): TrustScore['trustLevel'] {
  if (factors.accountAge < 30 || factors.totalSales < 5) {
    return 'new';
  }

  if (score >= 80 && factors.hasFairPricingPledge && factors.donationsCount > 0) {
    return 'champion';
  }

  if (score >= 70) {
    return 'verified';
  }

  if (score >= 50) {
    return 'trusted';
  }

  return 'new';
}

function generateBadges(factors: TrustFactors, score: number): string[] {
  const badges: string[] = [];

  if (factors.hasFairPricingPledge) {
    badges.push('Fair Pricing Pledge');
  }

  if (factors.kidFriendly) {
    badges.push('Kid Friendly');
  }

  if (factors.donationsCount >= 5) {
    badges.push('Generous Donor');
  }

  if (factors.totalSales >= 100) {
    badges.push('Experienced Seller');
  }

  if (factors.positiveShoutouts >= 10) {
    badges.push('Community Favorite');
  }

  if (
    factors.totalListings > 0 &&
    factors.fairPricedListings === factors.totalListings
  ) {
    badges.push('100% Fair Priced');
  }

  if (score >= 90) {
    badges.push('Top Rated');
  }

  if (factors.accountAge >= 365) {
    badges.push('Established Vendor');
  }

  return badges;
}

function generateWarnings(factors: TrustFactors): string[] {
  const warnings: string[] = [];

  if (factors.confirmedScalpingReports > 0) {
    warnings.push(
      `${factors.confirmedScalpingReports} confirmed scalping report(s) on record`
    );
  }

  if (factors.pendingReports >= 3) {
    warnings.push(`${factors.pendingReports} pending reports under review`);
  }

  if (
    factors.totalListings > 10 &&
    factors.fairPricedListings / factors.totalListings < 0.5
  ) {
    warnings.push('Less than 50% of listings are fair-priced');
  }

  return warnings;
}

function generateRecommendations(
  factors: TrustFactors,
  breakdown: TrustScore['breakdown']
): string[] {
  const recommendations: string[] = [];

  if (!factors.hasFairPricingPledge) {
    recommendations.push('Take the Fair Pricing Pledge to boost your trust score');
  }

  if (breakdown.communityFeedback < 15) {
    recommendations.push(
      'Encourage satisfied customers to leave shoutouts'
    );
  }

  if (breakdown.donationActivity < 5) {
    recommendations.push(
      'Consider participating in community giveaways to boost goodwill'
    );
  }

  if (
    factors.totalListings > 0 &&
    factors.fairPricedListings / factors.totalListings < 0.8
  ) {
    recommendations.push('Review pricing on flagged listings to improve fair pricing score');
  }

  if (!factors.kidFriendly) {
    recommendations.push(
      'Mark your profile as kid-friendly to attract family collectors'
    );
  }

  return recommendations;
}
