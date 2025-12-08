/**
 * A/B Test Results API - View experiment metrics and significance
 *
 * GET: Get current A/B test results with statistical analysis
 *
 * Features:
 * - Live metrics from Redis
 * - Chi-Squared significance test
 * - Winner determination
 * - Admin-only access
 *
 * Reference: knowledge-06-data-ab-testing.md
 *
 * @module api/ab/results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Pool } from 'pg';
import * as Sentry from '@sentry/nextjs';
import {
  getExperimentResults,
  getExperimentConfig,
  formatResults,
} from '@/lib/ab-testing/search-experiment';

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Verify user has admin role
 */
async function verifyAdminAccess(client: any, userId: string): Promise<boolean> {
  const result = await client.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) return false;

  const role = result.rows[0].role;
  return ['admin', 'super_admin', 'data_analyst'].includes(role);
}

// =============================================================================
// GET - GET A/B TEST RESULTS
// =============================================================================

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const supabase = createSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(client, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get experiment config
    const config = getExperimentConfig();

    // Get results
    const results = await getExperimentResults(config.id);

    // Format response
    const response = {
      success: true,
      experiment: {
        id: config.id,
        name: config.name,
        status: config.enabled ? 'running' : 'paused',
        startDate: config.startDate.toISOString(),
        endDate: config.endDate?.toISOString() || null,
        trafficSplit: config.trafficSplit,
        variants: config.variants,
      },
      results: {
        variantA: {
          name: config.variants.A.name,
          description: config.variants.A.description,
          metrics: results.variantA,
          conversionRate: results.conversionRateA,
        },
        variantB: {
          name: config.variants.B.name,
          description: config.variants.B.description,
          metrics: results.variantB,
          conversionRate: results.conversionRateB,
        },
        analysis: {
          chiSquared: results.chiSquared,
          pValue: results.pValue,
          isSignificant: results.isSignificant,
          confidenceLevel: results.confidenceLevel,
          winner: results.winner,
          winnerName: results.winner
            ? config.variants[results.winner].name
            : null,
        },
        sampleSize: results.sampleSize,
        recommendation: getRecommendation(results),
      },
      formattedReport: formatResults(results),
    };

    Sentry.addBreadcrumb({
      category: 'ab_testing',
      message: `A/B results viewed by ${user.id}`,
      level: 'info',
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('A/B results fetch failed:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B test results' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =============================================================================
// HELPER: GET RECOMMENDATION
// =============================================================================

function getRecommendation(results: {
  isSignificant: boolean;
  winner: 'A' | 'B' | null;
  sampleSize: number;
  conversionRateA: number;
  conversionRateB: number;
}): string {
  if (results.sampleSize < 200) {
    return 'Insufficient data. Continue running the experiment to gather more samples.';
  }

  if (!results.isSignificant) {
    if (results.sampleSize < 1000) {
      return 'Results not yet statistically significant. Continue running for more data.';
    }
    return 'No significant difference detected between variants. Consider extending the test or accepting the null hypothesis.';
  }

  const improvement = results.winner === 'B'
    ? ((results.conversionRateB - results.conversionRateA) / results.conversionRateA * 100).toFixed(1)
    : ((results.conversionRateA - results.conversionRateB) / results.conversionRateB * 100).toFixed(1);

  if (results.winner === 'B') {
    return `RAG-Fusion (Variant B) shows ${improvement}% improvement over Simple Keyword search. Consider rolling out RAG-Fusion to all users.`;
  }

  return `Simple Keyword (Variant A) shows ${improvement}% improvement over RAG-Fusion. The additional complexity of RAG-Fusion may not be justified.`;
}
