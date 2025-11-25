/**
 * Core Web Vitals API Routes
 *
 * Endpoints for recording and retrieving vitals metrics.
 * Implements knowledge-07-seo-performance API layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordVitals,
  getPageMetrics,
  getPageVitalsSummary,
  type VitalType,
} from '@/lib/seo-performance';

/**
 * POST /api/seo-performance/vitals
 * Record vitals metrics for a page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageUrl, projectId, vitals, deviceType, connectionType, userAgent } = body;

    if (!pageUrl || !projectId || !vitals) {
      return NextResponse.json(
        { error: 'Missing required fields: pageUrl, projectId, vitals' },
        { status: 400 }
      );
    }

    // Validate vitals object
    const validVitalTypes: VitalType[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID'];
    const validVitals: Partial<Record<VitalType, number>> = {};

    for (const [key, value] of Object.entries(vitals)) {
      if (validVitalTypes.includes(key as VitalType) && typeof value === 'number') {
        validVitals[key as VitalType] = value;
      }
    }

    if (Object.keys(validVitals).length === 0) {
      return NextResponse.json(
        { error: 'No valid vitals provided' },
        { status: 400 }
      );
    }

    const metrics = await recordVitals(pageUrl, validVitals, {
      projectId,
      deviceType,
      connectionType,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      recorded: metrics.length,
      metrics,
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    return NextResponse.json(
      { error: 'Failed to record vitals' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seo-performance/vitals
 * Get vitals metrics for a page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('pageUrl');
    const projectId = searchParams.get('projectId');
    const summary = searchParams.get('summary') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: pageUrl' },
        { status: 400 }
      );
    }

    if (summary) {
      const vitalsSummary = await getPageVitalsSummary(pageUrl, {
        projectId: projectId ?? undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return NextResponse.json({
        success: true,
        pageUrl,
        summary: vitalsSummary,
      });
    }

    const metrics = await getPageMetrics(pageUrl, {
      projectId: projectId ?? undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      pageUrl,
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}
