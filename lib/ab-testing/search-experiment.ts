/**
 * A/B Testing Module for Search Experiments
 *
 * Implements RAG-Fusion vs Simple Keyword search A/B test.
 * Uses deterministic hashing for consistent user assignment,
 * Redis for tracking, and Chi-Squared test for significance.
 *
 * Features:
 * - Hash-based deterministic assignment (SHA-256)
 * - 50/50 traffic split by default
 * - Redis-backed metrics tracking
 * - Chi-Squared statistical significance test
 * - Anonymized metrics for privacy
 *
 * Trade-offs:
 * - Splits traffic 50/50; run for ~1 week minimum
 * - Tracks conversions (report views, dwell time)
 * - Privacy: metrics are anonymized
 *
 * Reference: knowledge-06-data-ab-testing.md
 *
 * @module lib/ab-testing/search-experiment
 */

import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type SearchVariant = 'A' | 'B';

export interface SearchExperimentConfig {
  id: string;
  name: string;
  variants: {
    A: { name: string; description: string };
    B: { name: string; description: string };
  };
  trafficSplit: number; // 0-100, percentage for variant B
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
}

export interface ExperimentMetrics {
  searches: number;
  satisfied: number;
  unsatisfied: number;
  avgDwellTimeMs: number;
  reportViews: number;
  reportPurchases: number;
}

export interface ExperimentResults {
  variantA: ExperimentMetrics;
  variantB: ExperimentMetrics;
  conversionRateA: number;
  conversionRateB: number;
  chiSquared: number;
  pValue: number;
  isSignificant: boolean;
  winner: SearchVariant | null;
  sampleSize: number;
  confidenceLevel: number;
}

export interface SearchFeedback {
  userId: string;
  variant: SearchVariant;
  satisfied: boolean;
  dwellTimeMs?: number;
  reportViewed?: string;
  reportPurchased?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const SEARCH_EXPERIMENT: SearchExperimentConfig = {
  id: 'search_rag_vs_simple_v1',
  name: 'RAG-Fusion vs Simple Keyword Search',
  variants: {
    A: {
      name: 'Simple Keyword',
      description: 'Traditional keyword-based search with ts_rank',
    },
    B: {
      name: 'RAG-Fusion',
      description: 'Multi-query retrieval with vector + keyword hybrid search and reranking',
    },
  },
  trafficSplit: 50, // 50% get RAG-Fusion
  startDate: new Date(),
  enabled: true,
};

const REDIS_KEY_PREFIX = 'ab:search:';
const CHI_SQUARED_CRITICAL_VALUE = 3.841; // p < 0.05 for 1 degree of freedom
const MIN_SAMPLE_SIZE = 100; // Minimum samples per variant for significance

// =============================================================================
// REDIS CLIENT (Lazy initialization)
// =============================================================================

let redisClient: any = null;

async function getRedis() {
  if (redisClient !== null) return redisClient;
  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      redisClient = undefined;
    }
  } catch {
    redisClient = undefined;
  }
  return redisClient;
}

// =============================================================================
// VARIANT ASSIGNMENT
// =============================================================================

/**
 * Get deterministic variant assignment for a user
 *
 * Uses SHA-256 hash of experiment ID + user ID for consistent assignment.
 * Same user always gets same variant for the same experiment.
 *
 * @param userId - User identifier (can be anonymous ID)
 * @param experimentId - Experiment identifier
 * @param trafficSplit - Percentage of traffic for variant B (0-100)
 * @returns Variant A or B
 */
export function getSearchVariant(
  userId: string,
  experimentId: string = SEARCH_EXPERIMENT.id,
  trafficSplit: number = SEARCH_EXPERIMENT.trafficSplit
): SearchVariant {
  // Create deterministic hash
  const hash = createHash('sha256')
    .update(`${experimentId}:${userId}`)
    .digest('hex');

  // Convert first 8 hex chars to number (0 to ~4 billion)
  const hashValue = parseInt(hash.slice(0, 8), 16);

  // Normalize to 0-100 range
  const bucket = hashValue % 100;

  // Assign variant based on traffic split
  return bucket < trafficSplit ? 'B' : 'A';
}

/**
 * Check if user is in experiment
 */
export function isUserInExperiment(
  userId: string,
  experimentId: string = SEARCH_EXPERIMENT.id
): boolean {
  const config = SEARCH_EXPERIMENT;
  if (!config.enabled) return false;

  const now = new Date();
  if (now < config.startDate) return false;
  if (config.endDate && now > config.endDate) return false;

  return true;
}

// =============================================================================
// METRICS TRACKING
// =============================================================================

/**
 * Track a search event
 */
export async function trackSearch(
  userId: string,
  variant: SearchVariant,
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const key = `${REDIS_KEY_PREFIX}${experimentId}:${variant}`;
    await redis.hincrby(key, 'searches', 1);

    // Track unique users (approximate with HyperLogLog)
    await redis.pfadd(`${key}:users`, userId);
  } catch (error) {
    console.warn('A/B tracking failed:', error);
  }
}

/**
 * Track search satisfaction feedback
 */
export async function trackSatisfaction(
  feedback: SearchFeedback,
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const key = `${REDIS_KEY_PREFIX}${experimentId}:${feedback.variant}`;

    // Increment satisfied/unsatisfied counter
    const field = feedback.satisfied ? 'satisfied' : 'unsatisfied';
    await redis.hincrby(key, field, 1);

    // Track dwell time (rolling average approximation)
    if (feedback.dwellTimeMs) {
      const currentAvg = parseFloat(await redis.hget(key, 'avg_dwell_time') || '0');
      const totalSatisfied = parseInt(await redis.hget(key, 'satisfied') || '0', 10);
      const newAvg = currentAvg + (feedback.dwellTimeMs - currentAvg) / (totalSatisfied + 1);
      await redis.hset(key, 'avg_dwell_time', newAvg.toString());
    }

    // Track report views
    if (feedback.reportViewed) {
      await redis.hincrby(key, 'report_views', 1);
    }

    // Track report purchases
    if (feedback.reportPurchased) {
      await redis.hincrby(key, 'report_purchases', 1);
    }
  } catch (error) {
    console.warn('A/B satisfaction tracking failed:', error);
  }
}

/**
 * Track report view as conversion
 */
export async function trackReportView(
  userId: string,
  variant: SearchVariant,
  reportId: string,
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const key = `${REDIS_KEY_PREFIX}${experimentId}:${variant}`;
    await redis.hincrby(key, 'report_views', 1);

    // Track unique report views per user (deduplicate)
    const viewKey = `${key}:views:${userId}`;
    const alreadyViewed = await redis.sismember(viewKey, reportId);
    if (!alreadyViewed) {
      await redis.sadd(viewKey, reportId);
      await redis.expire(viewKey, 86400 * 7); // 7 day TTL
      await redis.hincrby(key, 'unique_report_views', 1);
    }
  } catch (error) {
    console.warn('A/B report view tracking failed:', error);
  }
}

// =============================================================================
// RESULTS CALCULATION
// =============================================================================

/**
 * Get raw metrics for a variant
 */
async function getVariantMetrics(
  variant: SearchVariant,
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<ExperimentMetrics> {
  const redis = await getRedis();
  if (!redis) {
    return {
      searches: 0,
      satisfied: 0,
      unsatisfied: 0,
      avgDwellTimeMs: 0,
      reportViews: 0,
      reportPurchases: 0,
    };
  }

  try {
    const key = `${REDIS_KEY_PREFIX}${experimentId}:${variant}`;
    const data = await redis.hgetall(key);

    return {
      searches: parseInt(data?.searches || '0', 10),
      satisfied: parseInt(data?.satisfied || '0', 10),
      unsatisfied: parseInt(data?.unsatisfied || '0', 10),
      avgDwellTimeMs: parseFloat(data?.avg_dwell_time || '0'),
      reportViews: parseInt(data?.report_views || '0', 10),
      reportPurchases: parseInt(data?.report_purchases || '0', 10),
    };
  } catch (error) {
    console.warn('Failed to get variant metrics:', error);
    return {
      searches: 0,
      satisfied: 0,
      unsatisfied: 0,
      avgDwellTimeMs: 0,
      reportViews: 0,
      reportPurchases: 0,
    };
  }
}

/**
 * Compute Chi-Squared statistic for A/B test
 *
 * Tests if there's a significant difference in conversion rates
 * between variants A and B.
 */
function computeChiSquared(
  metricsA: ExperimentMetrics,
  metricsB: ExperimentMetrics
): { chiSquared: number; pValue: number } {
  // Use satisfaction as primary conversion metric
  const a_converted = metricsA.satisfied;
  const a_not_converted = metricsA.unsatisfied || (metricsA.searches - metricsA.satisfied);
  const b_converted = metricsB.satisfied;
  const b_not_converted = metricsB.unsatisfied || (metricsB.searches - metricsB.satisfied);

  // Total counts
  const a_total = a_converted + a_not_converted;
  const b_total = b_converted + b_not_converted;
  const grand_total = a_total + b_total;

  if (grand_total === 0) {
    return { chiSquared: 0, pValue: 1 };
  }

  // Expected values under null hypothesis
  const total_converted = a_converted + b_converted;
  const total_not_converted = a_not_converted + b_not_converted;

  const expected_a_converted = (a_total * total_converted) / grand_total;
  const expected_a_not = (a_total * total_not_converted) / grand_total;
  const expected_b_converted = (b_total * total_converted) / grand_total;
  const expected_b_not = (b_total * total_not_converted) / grand_total;

  // Chi-squared calculation with Yates' correction
  const chiSquared =
    Math.pow(Math.abs(a_converted - expected_a_converted) - 0.5, 2) / (expected_a_converted || 1) +
    Math.pow(Math.abs(a_not_converted - expected_a_not) - 0.5, 2) / (expected_a_not || 1) +
    Math.pow(Math.abs(b_converted - expected_b_converted) - 0.5, 2) / (expected_b_converted || 1) +
    Math.pow(Math.abs(b_not_converted - expected_b_not) - 0.5, 2) / (expected_b_not || 1);

  // Approximate p-value from chi-squared (1 degree of freedom)
  // Using Wilson-Hilferty approximation
  const pValue = chiSquared > 0 ? Math.exp(-chiSquared / 2) : 1;

  return { chiSquared, pValue };
}

/**
 * Get full experiment results with statistical analysis
 */
export async function getExperimentResults(
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<ExperimentResults> {
  const metricsA = await getVariantMetrics('A', experimentId);
  const metricsB = await getVariantMetrics('B', experimentId);

  // Calculate conversion rates (satisfaction-based)
  const totalA = metricsA.satisfied + (metricsA.unsatisfied || 0);
  const totalB = metricsB.satisfied + (metricsB.unsatisfied || 0);

  const conversionRateA = totalA > 0 ? (metricsA.satisfied / totalA) * 100 : 0;
  const conversionRateB = totalB > 0 ? (metricsB.satisfied / totalB) * 100 : 0;

  // Compute chi-squared
  const { chiSquared, pValue } = computeChiSquared(metricsA, metricsB);

  // Determine significance
  const sampleSize = totalA + totalB;
  const isSignificant =
    chiSquared > CHI_SQUARED_CRITICAL_VALUE &&
    totalA >= MIN_SAMPLE_SIZE &&
    totalB >= MIN_SAMPLE_SIZE;

  // Determine winner
  let winner: SearchVariant | null = null;
  if (isSignificant) {
    winner = conversionRateB > conversionRateA ? 'B' : 'A';
  }

  return {
    variantA: metricsA,
    variantB: metricsB,
    conversionRateA,
    conversionRateB,
    chiSquared,
    pValue,
    isSignificant,
    winner,
    sampleSize,
    confidenceLevel: isSignificant ? 95 : 0,
  };
}

/**
 * Reset experiment metrics (for new experiment)
 */
export async function resetExperiment(
  experimentId: string = SEARCH_EXPERIMENT.id
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const keysA = await redis.keys(`${REDIS_KEY_PREFIX}${experimentId}:A*`);
    const keysB = await redis.keys(`${REDIS_KEY_PREFIX}${experimentId}:B*`);

    if (keysA.length > 0) await redis.del(...keysA);
    if (keysB.length > 0) await redis.del(...keysB);
  } catch (error) {
    console.warn('Failed to reset experiment:', error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get experiment config
 */
export function getExperimentConfig(): SearchExperimentConfig {
  return { ...SEARCH_EXPERIMENT };
}

/**
 * Check if experiment should use RAG-Fusion (variant B)
 */
export function shouldUseRagFusion(userId: string): boolean {
  if (!isUserInExperiment(userId)) {
    // Default to RAG-Fusion when not in experiment
    return true;
  }

  const variant = getSearchVariant(userId);
  return variant === 'B';
}

/**
 * Format results for display
 */
export function formatResults(results: ExperimentResults): string {
  const lines = [
    '=== A/B Test Results ===',
    '',
    `Sample Size: ${results.sampleSize}`,
    '',
    'Variant A (Simple Keyword):',
    `  Searches: ${results.variantA.searches}`,
    `  Conversion Rate: ${results.conversionRateA.toFixed(2)}%`,
    `  Avg Dwell Time: ${results.variantA.avgDwellTimeMs.toFixed(0)}ms`,
    `  Report Views: ${results.variantA.reportViews}`,
    '',
    'Variant B (RAG-Fusion):',
    `  Searches: ${results.variantB.searches}`,
    `  Conversion Rate: ${results.conversionRateB.toFixed(2)}%`,
    `  Avg Dwell Time: ${results.variantB.avgDwellTimeMs.toFixed(0)}ms`,
    `  Report Views: ${results.variantB.reportViews}`,
    '',
    'Statistical Analysis:',
    `  Chi-Squared: ${results.chiSquared.toFixed(4)}`,
    `  P-Value: ${results.pValue.toFixed(4)}`,
    `  Significant: ${results.isSignificant ? 'YES' : 'NO'}`,
    '',
    results.winner
      ? `Winner: Variant ${results.winner} (${results.winner === 'A' ? 'Simple Keyword' : 'RAG-Fusion'})`
      : 'Winner: Not yet determined (need more data)',
  ];

  return lines.join('\n');
}
