/**
 * A/B Testing Engine for Apex Intelligence
 *
 * Production-ready A/B testing with:
 * - Deterministic variant assignment (hash-based)
 * - Statistical significance calculation
 * - Conversion tracking
 * - Experiment management
 *
 * @see knowledge-06-data-ab-testing for methodology
 */

import { db } from '@/db';
import {
  abExperiments,
  experimentAssignments,
  experimentConversions,
  type AbExperiment,
  type ExperimentAssignment,
} from '@/db/schema/feedback';
import { eq, and, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

// ============================================================================
// VARIANT ASSIGNMENT
// ============================================================================

/**
 * Generates a deterministic hash for user-experiment assignment
 * Ensures consistent variant assignment across sessions
 */
function generateAssignmentHash(userId: string, experimentSlug: string): number {
  const hash = createHash('sha256')
    .update(`${userId}:${experimentSlug}`)
    .digest('hex');
  // Convert first 8 chars to number (0-4294967295)
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * Gets variant assignment for a user
 * Creates assignment if doesn't exist
 */
export async function getVariant(
  userId: string,
  experimentSlug: string
): Promise<{ variantId: string; experiment: AbExperiment } | null> {
  try {
    // Get experiment
    const experiment = await db.query.abExperiments.findFirst({
      where: eq(abExperiments.slug, experimentSlug),
    });

    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check for existing assignment
    const existingAssignment = await db.query.experimentAssignments.findFirst({
      where: and(
        eq(experimentAssignments.experimentId, experiment.id),
        eq(experimentAssignments.userId, userId)
      ),
    });

    if (existingAssignment) {
      return { variantId: existingAssignment.variantId, experiment };
    }

    // Calculate variant assignment
    const hash = generateAssignmentHash(userId, experimentSlug);
    const variants = experiment.variants || [];

    let cumulativeWeight = 0;
    const threshold = hash % 100;
    let selectedVariant = variants[0]?.id || 'control';

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (threshold < cumulativeWeight) {
        selectedVariant = variant.id;
        break;
      }
    }

    // Create assignment
    await db.insert(experimentAssignments).values({
      experimentId: experiment.id,
      userId,
      variantId: selectedVariant,
    });

    return { variantId: selectedVariant, experiment };
  } catch (error) {
    console.error('[AB Testing] getVariant error:', error);
    return null;
  }
}

/**
 * Track user for experiment (alias for getVariant for API consistency)
 */
export async function trackUser(experimentSlug: string, userId: string): Promise<string | null> {
  const result = await getVariant(userId, experimentSlug);
  return result?.variantId || null;
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

/**
 * Track a conversion event for an experiment
 */
export async function trackConversion(
  experimentSlug: string,
  userId: string,
  eventType: string = 'conversion',
  eventValue?: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    // Get assignment
    const experiment = await db.query.abExperiments.findFirst({
      where: eq(abExperiments.slug, experimentSlug),
    });

    if (!experiment) return false;

    const assignment = await db.query.experimentAssignments.findFirst({
      where: and(
        eq(experimentAssignments.experimentId, experiment.id),
        eq(experimentAssignments.userId, userId)
      ),
    });

    if (!assignment) return false;

    // Record conversion
    await db.insert(experimentConversions).values({
      assignmentId: assignment.id,
      experimentId: experiment.id,
      eventType,
      eventValue,
      metadata,
    });

    return true;
  } catch (error) {
    console.error('[AB Testing] trackConversion error:', error);
    return false;
  }
}

// ============================================================================
// STATISTICAL ANALYSIS
// ============================================================================

interface VariantStats {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
}

interface SignificanceResult {
  significant: boolean;
  pValue: number;
  confidence: number;
  winner: string | null;
  variantStats: VariantStats[];
  effect: number;
}

/**
 * Calculate statistical significance using Chi-squared test
 */
export async function calculateSignificance(
  experimentSlug: string
): Promise<SignificanceResult | null> {
  try {
    const experiment = await db.query.abExperiments.findFirst({
      where: eq(abExperiments.slug, experimentSlug),
    });

    if (!experiment) return null;

    // Get variant stats
    const stats = await db.execute<{
      variant_id: string;
      participants: number;
      conversions: number;
    }>(sql`
      SELECT
        ea.variant_id,
        COUNT(DISTINCT ea.id) as participants,
        COUNT(DISTINCT ec.id) as conversions
      FROM experiment_assignments ea
      LEFT JOIN experiment_conversions ec ON ec.assignment_id = ea.id
      WHERE ea.experiment_id = ${experiment.id}
      GROUP BY ea.variant_id
    `);

    if (!stats.rows || stats.rows.length < 2) {
      return null;
    }

    const variantStats: VariantStats[] = stats.rows.map((row) => ({
      variantId: row.variant_id,
      participants: Number(row.participants),
      conversions: Number(row.conversions),
      conversionRate: Number(row.conversions) / Number(row.participants) || 0,
    }));

    // Chi-squared calculation
    const total = variantStats.reduce((sum, v) => sum + v.participants, 0);
    const totalConversions = variantStats.reduce((sum, v) => sum + v.conversions, 0);
    const expectedRate = totalConversions / total;

    let chiSquared = 0;
    for (const variant of variantStats) {
      const expectedConversions = variant.participants * expectedRate;
      const expectedNonConversions = variant.participants * (1 - expectedRate);

      if (expectedConversions > 0) {
        chiSquared += Math.pow(variant.conversions - expectedConversions, 2) / expectedConversions;
      }
      const actualNonConversions = variant.participants - variant.conversions;
      if (expectedNonConversions > 0) {
        chiSquared += Math.pow(actualNonConversions - expectedNonConversions, 2) / expectedNonConversions;
      }
    }

    // Calculate p-value (simplified approximation for df=1)
    const pValue = Math.exp(-chiSquared / 2);
    const significant = pValue < 0.05;
    const confidence = 1 - pValue;

    // Determine winner
    let winner: string | null = null;
    if (significant) {
      winner = variantStats.reduce((best, v) =>
        v.conversionRate > best.conversionRate ? v : best
      ).variantId;
    }

    // Calculate effect size
    const controlStats = variantStats.find(v => v.variantId === 'control') || variantStats[0];
    const treatmentStats = variantStats.find(v => v.variantId !== 'control') || variantStats[1];
    const effect = controlStats.conversionRate > 0
      ? (treatmentStats.conversionRate - controlStats.conversionRate) / controlStats.conversionRate
      : 0;

    return {
      significant,
      pValue,
      confidence,
      winner,
      variantStats,
      effect,
    };
  } catch (error) {
    console.error('[AB Testing] calculateSignificance error:', error);
    return null;
  }
}

// ============================================================================
// EXPERIMENT MANAGEMENT
// ============================================================================

/**
 * Create a new A/B experiment
 */
export async function createExperiment(config: {
  name: string;
  slug: string;
  description?: string;
  experimentType: 'feature' | 'ui' | 'algorithm' | 'pricing' | 'survey' | 'content';
  variants: Array<{ id: string; name: string; weight: number; config?: Record<string, any> }>;
  primaryMetric: string;
  createdBy?: string;
}): Promise<AbExperiment | null> {
  try {
    const [experiment] = await db.insert(abExperiments).values({
      name: config.name,
      slug: config.slug,
      description: config.description,
      experimentType: config.experimentType,
      variants: config.variants,
      primaryMetric: config.primaryMetric,
      status: 'draft',
      createdBy: config.createdBy,
    }).returning();

    return experiment;
  } catch (error) {
    console.error('[AB Testing] createExperiment error:', error);
    return null;
  }
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentSlug: string): Promise<boolean> {
  try {
    await db.update(abExperiments)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(abExperiments.slug, experimentSlug));
    return true;
  } catch (error) {
    console.error('[AB Testing] startExperiment error:', error);
    return false;
  }
}

/**
 * End an experiment and record results
 */
export async function endExperiment(experimentSlug: string): Promise<AbExperiment | null> {
  try {
    const results = await calculateSignificance(experimentSlug);

    const [experiment] = await db.update(abExperiments)
      .set({
        status: 'completed',
        endedAt: new Date(),
        winningVariant: results?.winner,
        statisticalSignificance: results?.confidence,
        resultsJson: results ? {
          variantResults: Object.fromEntries(
            results.variantStats.map(v => [v.variantId, {
              participants: v.participants,
              conversions: v.conversions,
              conversionRate: v.conversionRate,
            }])
          ),
          pValue: results.pValue,
          effect: results.effect,
        } : undefined,
      })
      .where(eq(abExperiments.slug, experimentSlug))
      .returning();

    return experiment;
  } catch (error) {
    console.error('[AB Testing] endExperiment error:', error);
    return null;
  }
}

/**
 * Get experiment results
 */
export async function getExperimentResults(experimentSlug: string): Promise<{
  experiment: AbExperiment;
  significance: SignificanceResult | null;
} | null> {
  try {
    const experiment = await db.query.abExperiments.findFirst({
      where: eq(abExperiments.slug, experimentSlug),
    });

    if (!experiment) return null;

    const significance = await calculateSignificance(experimentSlug);

    return { experiment, significance };
  } catch (error) {
    console.error('[AB Testing] getExperimentResults error:', error);
    return null;
  }
}
