/**
 * A/B Testing Analysis API Routes
 *
 * Endpoints for statistical analysis.
 * Implements knowledge-06-data-ab-testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  chiSquaredTest,
  zTestProportions,
  tTest,
  analyzeExperiment,
  determineWinner,
  calculateRequiredSampleSize,
  runStatisticalTest,
  type VariantStats,
  type SignificanceMethod,
} from '@/lib/ab-testing';

/**
 * POST /api/ab-testing/analyze
 * Run statistical analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test': {
        const { control, treatment, method, confidenceLevel } = body as {
          control: VariantStats;
          treatment: VariantStats;
          method?: SignificanceMethod;
          confidenceLevel?: number;
        };

        if (!control || !treatment) {
          return NextResponse.json(
            { error: 'Control and treatment stats required' },
            { status: 400 }
          );
        }

        const result = runStatisticalTest(
          control,
          treatment,
          method || 'chi_squared',
          confidenceLevel || 0.95
        );

        return NextResponse.json({
          success: true,
          result,
          interpretation: interpretResult(result),
        });
      }

      case 'analyze-experiment': {
        const { variants, method, confidenceLevel } = body as {
          variants: VariantStats[];
          method?: SignificanceMethod;
          confidenceLevel?: number;
        };

        if (!variants || variants.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 variants required' },
            { status: 400 }
          );
        }

        const results = analyzeExperiment(
          variants,
          method || 'chi_squared',
          confidenceLevel || 0.95
        );

        const winner = determineWinner(results);

        return NextResponse.json({
          success: true,
          results,
          winner,
          summary: generateSummary(variants, results),
        });
      }

      case 'sample-size': {
        const { baselineConversionRate, minimumDetectableEffect, confidenceLevel, statisticalPower, variants } = body;

        if (!baselineConversionRate || !minimumDetectableEffect) {
          return NextResponse.json(
            { error: 'baselineConversionRate and minimumDetectableEffect required' },
            { status: 400 }
          );
        }

        const sampleSize = calculateRequiredSampleSize({
          baselineConversionRate,
          minimumDetectableEffect,
          confidenceLevel: confidenceLevel || 0.95,
          statisticalPower: statisticalPower || 0.8,
          variants: variants || 2,
        });

        return NextResponse.json({
          success: true,
          sampleSizePerVariant: sampleSize,
          totalSampleSize: sampleSize * (variants || 2),
          parameters: {
            baselineConversionRate,
            minimumDetectableEffect,
            confidenceLevel: confidenceLevel || 0.95,
            statisticalPower: statisticalPower || 0.8,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test, analyze-experiment, or sample-size' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing analysis request:', error);
    return NextResponse.json(
      { error: 'Failed to process analysis request' },
      { status: 500 }
    );
  }
}

function interpretResult(result: ReturnType<typeof runStatisticalTest>): string {
  if (result.isSignificant) {
    const direction = result.relativeUplift > 0 ? 'increase' : 'decrease';
    return `Statistically significant ${direction} of ${(Math.abs(result.relativeUplift) * 100).toFixed(1)}% (p=${result.pValue.toFixed(4)})`;
  } else {
    return `No statistically significant difference detected (p=${result.pValue.toFixed(4)})`;
  }
}

function generateSummary(variants: VariantStats[], results: ReturnType<typeof analyzeExperiment>): {
  totalSampleSize: number;
  significantResults: number;
  bestPerformer: string | null;
  recommendation: string;
} {
  const totalSampleSize = variants.reduce((sum, v) => sum + v.sampleSize, 0);
  const significantResults = results.filter((r) => r.isSignificant).length;

  const bestResult = results
    .filter((r) => r.isSignificant && r.relativeUplift > 0)
    .sort((a, b) => b.relativeUplift - a.relativeUplift)[0];

  let recommendation: string;
  if (significantResults === 0) {
    recommendation = 'Continue test to gather more data or consider larger changes';
  } else if (bestResult) {
    recommendation = `Ship ${bestResult.treatmentVariant} for ${(bestResult.relativeUplift * 100).toFixed(1)}% improvement`;
  } else {
    recommendation = 'Keep control variant - no improvements detected';
  }

  return {
    totalSampleSize,
    significantResults,
    bestPerformer: bestResult?.treatmentVariant || null,
    recommendation,
  };
}
