/**
 * OODA Analytics API
 *
 * Endpoints for OODA loop metrics and analysis.
 * Implements pack-ai-defense-001 §3.1 (Decision compression).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordOodaMeasurement,
  getOodaMetrics,
  analyzeBottlenecks,
  getOodaSummary,
  compareProcessingTypes,
  type OodaMeasurement,
  type ProcessingType,
} from '@/lib/defense';

/**
 * GET /api/defense/ooda
 *
 * Get OODA metrics and analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'metrics';
    const pipelineId = searchParams.get('pipelineId') ?? undefined;
    const processingType = searchParams.get('processingType') as ProcessingType | undefined;
    const days = parseInt(searchParams.get('days') ?? '7', 10);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    switch (action) {
      case 'metrics': {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await getOodaMetrics({
          pipelineId,
          processingType,
          startDate,
          limit,
        });

        return NextResponse.json({ metrics });
      }

      case 'bottlenecks': {
        const analysis = await analyzeBottlenecks({
          pipelineId,
          processingType,
          days,
        });

        return NextResponse.json({ analysis });
      }

      case 'summary': {
        const summary = await getOodaSummary({
          pipelineId,
          days,
        });

        return NextResponse.json({ summary });
      }

      case 'compare': {
        const comparison = await compareProcessingTypes({
          pipelineId,
          days,
        });

        return NextResponse.json({ comparison });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: metrics, bottlenecks, summary, compare` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in OODA analytics:', error);
    return NextResponse.json(
      { error: 'Failed to process OODA analytics request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/defense/ooda
 *
 * Record an OODA measurement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.pipelineId || !body.phases) {
      return NextResponse.json(
        { error: 'Missing required fields: pipelineId, phases' },
        { status: 400 }
      );
    }

    const { phases } = body;
    if (
      typeof phases.observe !== 'number' ||
      typeof phases.orient !== 'number' ||
      typeof phases.decide !== 'number' ||
      typeof phases.act !== 'number'
    ) {
      return NextResponse.json(
        { error: 'phases must include observe, orient, decide, act as numbers' },
        { status: 400 }
      );
    }

    const measurement: OodaMeasurement = {
      userId: body.userId,
      sessionId: body.sessionId,
      pipelineId: body.pipelineId,
      processingType: body.processingType ?? 'central',
      phases: {
        observe: phases.observe,
        orient: phases.orient,
        decide: phases.decide,
        act: phases.act,
      },
      metadata: body.metadata,
    };

    const metric = await recordOodaMeasurement(measurement);

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error('Error recording OODA measurement:', error);
    return NextResponse.json(
      { error: 'Failed to record OODA measurement' },
      { status: 500 }
    );
  }
}
