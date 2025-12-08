/**
 * A/B Test Feedback API - Track user satisfaction for experiments
 *
 * POST: Submit feedback for search satisfaction
 *
 * Features:
 * - Anonymous feedback tracking
 * - Dwell time measurement
 * - Report view/purchase conversions
 * - Privacy-preserving metrics
 *
 * Reference: knowledge-06-data-ab-testing.md
 *
 * @module api/ab/feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import {
  trackSatisfaction,
  trackReportView,
  type SearchVariant,
} from '@/lib/ab-testing/search-experiment';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const feedbackSchema = z.object({
  variant: z.enum(['A', 'B']),
  satisfied: z.boolean(),
  dwellTimeMs: z.number().min(0).max(3600000).optional(), // Max 1 hour
  reportViewed: z.string().uuid().optional(),
  reportPurchased: z.string().uuid().optional(),
  searchQuery: z.string().max(500).optional(),
  resultCount: z.number().min(0).optional(),
});

const reportViewSchema = z.object({
  variant: z.enum(['A', 'B']),
  reportId: z.string().uuid(),
});

// =============================================================================
// GET USER ID FROM REQUEST
// =============================================================================

function getUserIdFromRequest(request: NextRequest): string {
  // Try to get from auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) return payload.sub;
    } catch {
      // Fall through to anonymous ID
    }
  }

  // Try to get from cookie
  const userIdCookie = request.cookies.get('user_id');
  if (userIdCookie?.value) return userIdCookie.value;

  // Fall back to IP-based anonymous ID
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  return `anon:${ip}`;
}

// =============================================================================
// POST - SUBMIT FEEDBACK
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = getUserIdFromRequest(request);

    // Check if this is a report view tracking request
    if ('reportId' in body && !('satisfied' in body)) {
      const { variant, reportId } = reportViewSchema.parse(body);

      await trackReportView(userId, variant as SearchVariant, reportId);

      return NextResponse.json({
        success: true,
        message: 'Report view tracked',
      });
    }

    // Otherwise, it's satisfaction feedback
    const feedback = feedbackSchema.parse(body);

    await trackSatisfaction({
      userId,
      variant: feedback.variant as SearchVariant,
      satisfied: feedback.satisfied,
      dwellTimeMs: feedback.dwellTimeMs,
      reportViewed: feedback.reportViewed,
      reportPurchased: feedback.reportPurchased,
    });

    Sentry.addBreadcrumb({
      category: 'ab_testing',
      message: `Feedback submitted: ${feedback.satisfied ? 'satisfied' : 'unsatisfied'}`,
      level: 'info',
      data: {
        variant: feedback.variant,
        dwellTimeMs: feedback.dwellTimeMs,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('Feedback submission failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
