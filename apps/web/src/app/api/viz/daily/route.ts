/**
 * Daily YouTube Visualization API
 *
 * Generates daily TCG content for YouTube (thumbnails + scripts).
 * Designed for cron job execution or manual triggering.
 *
 * Endpoints:
 * - GET: Generate daily content package
 * - POST: Generate custom content with specific parameters
 *
 * Security:
 * - Rate limited (1 request per minute for daily content)
 * - Optional authentication for premium features
 * - Sentry monitoring
 *
 * @module api/viz/daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { pool } from '@/lib/db';
import {
  generateDailyContent,
  generateYouTubeViz,
  generateCardViz,
  type YouTubeVizConfig,
} from '@/lib/viz/youtube-gen';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Request body schema for POST endpoint
 */
const VizRequestSchema = z.object({
  /** Topic for content generation */
  topic: z.string().min(1).max(200).optional(),
  /** Specific card ID */
  cardId: z.string().optional(),
  /** Video format */
  format: z.enum(['short', 'standard']).optional(),
  /** Script style */
  style: z.enum(['energetic', 'analytical', 'casual']).optional(),
  /** Target duration in seconds */
  targetDuration: z.number().min(15).max(600).optional(),
  /** Series name */
  seriesName: z.string().max(100).optional(),
  /** Use Claude (true) or GPT-4 (false) */
  useClaude: z.boolean().optional(),
});

// ============================================================================
// RATE LIMITING (Simple in-memory for demo)
// ============================================================================

const rateLimitMap = new Map<string, number>();

function checkRateLimit(key: string, windowMs: number = 60000): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key);

  if (lastRequest && now - lastRequest < windowMs) {
    return false;
  }

  rateLimitMap.set(key, now);
  return true;
}

// ============================================================================
// GET: Daily Content Generation
// ============================================================================

/**
 * GET /api/viz/daily
 *
 * Generate daily YouTube content package.
 * Returns thumbnail SVG + script for today's TCG market trends.
 *
 * Query Parameters:
 * - format: 'short' | 'standard' (default: 'short')
 * - style: 'energetic' | 'analytical' | 'casual' (default: 'energetic')
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`daily:${clientIP}`)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Daily content generation is limited to 1 request per minute',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') as 'short' | 'standard') || 'short';
    const style = (searchParams.get('style') as YouTubeVizConfig['style']) || 'energetic';

    // Sentry tracking
    Sentry.withScope((scope: Scope) => {
      scope.setTag('endpoint', 'viz/daily');
      scope.setTag('method', 'GET');
      scope.setExtra('format', format);
      scope.setExtra('style', style);
    });

    // Generate daily content
    const result = await generateDailyContent(pool, {
      format,
      style,
    });

    // Log success
    console.log('[API/VIZ/DAILY] Generated daily content:', {
      latencyMs: Date.now() - startTime,
      format,
      style,
      scriptDuration: result.script.durationSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          thumbnail: {
            svg: result.thumbnailData.svgData,
            dimensions: result.thumbnailData.dimensions,
            elements: result.thumbnailData.elements.length,
          },
          script: {
            title: result.script.title,
            hook: result.script.hook,
            content: result.script.content,
            keyPoints: result.script.keyPoints,
            cta: result.script.cta,
            durationSeconds: result.script.durationSeconds,
            hashtags: result.script.hashtags,
          },
          metadata: {
            topic: result.metadata.topic,
            generatedAt: result.metadata.generatedAt,
            ragSources: result.metadata.ragSources,
            tokensSaved: result.metadata.tokensSaved,
            latencyMs: result.metadata.latencyMs,
            model: result.metadata.model,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-Generation-Time': String(Date.now() - startTime),
        },
      }
    );
  } catch (error) {
    // Error handling with Sentry
    Sentry.withScope((scope: Scope) => {
      scope.setTag('endpoint', 'viz/daily');
      scope.setTag('method', 'GET');
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    console.error('[API/VIZ/DAILY] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate daily content',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST: Custom Content Generation
// ============================================================================

/**
 * POST /api/viz/daily
 *
 * Generate custom YouTube content with specific parameters.
 * Supports topic-based or card-specific content generation.
 *
 * Request Body:
 * {
 *   topic?: string,
 *   cardId?: string,
 *   format?: 'short' | 'standard',
 *   style?: 'energetic' | 'analytical' | 'casual',
 *   targetDuration?: number,
 *   seriesName?: string,
 *   useClaude?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`viz:${clientIP}`, 30000)) { // 30 second window for POST
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Custom content generation is limited to 1 request per 30 seconds',
          retryAfter: 30,
        },
        {
          status: 429,
          headers: { 'Retry-After': '30' },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = VizRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parsed.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      topic,
      cardId,
      format = 'short',
      style = 'energetic',
      targetDuration,
      seriesName,
      useClaude = true,
    } = parsed.data;

    // Sentry tracking
    Sentry.withScope((scope: Scope) => {
      scope.setTag('endpoint', 'viz/daily');
      scope.setTag('method', 'POST');
      scope.setExtra('topic', topic);
      scope.setExtra('cardId', cardId);
      scope.setExtra('format', format);
    });

    // Build config
    const config: YouTubeVizConfig = {
      format,
      style,
      targetDuration,
      seriesName,
      useClaude,
    };

    // Generate content based on input
    let result;

    if (cardId) {
      // Card-specific content
      result = await generateCardViz(cardId, pool, config);
    } else if (topic) {
      // Topic-based content
      result = await generateYouTubeViz(topic, pool, config);
    } else {
      // Default daily content
      result = await generateDailyContent(pool, config);
    }

    // Log success
    console.log('[API/VIZ/DAILY] Generated custom content:', {
      latencyMs: Date.now() - startTime,
      topic: topic || cardId || 'daily',
      format,
      style,
      scriptDuration: result.script.durationSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          thumbnail: {
            svg: result.thumbnailData.svgData,
            dimensions: result.thumbnailData.dimensions,
            elements: result.thumbnailData.elements.length,
          },
          script: {
            title: result.script.title,
            hook: result.script.hook,
            content: result.script.content,
            keyPoints: result.script.keyPoints,
            cta: result.script.cta,
            durationSeconds: result.script.durationSeconds,
            hashtags: result.script.hashtags,
          },
          metadata: {
            topic: result.metadata.topic,
            cardId: result.metadata.cardId,
            generatedAt: result.metadata.generatedAt,
            ragSources: result.metadata.ragSources,
            tokensSaved: result.metadata.tokensSaved,
            latencyMs: result.metadata.latencyMs,
            model: result.metadata.model,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Generation-Time': String(Date.now() - startTime),
        },
      }
    );
  } catch (error) {
    // Error handling with Sentry
    Sentry.withScope((scope: Scope) => {
      scope.setTag('endpoint', 'viz/daily');
      scope.setTag('method', 'POST');
      scope.setExtra('error', error);
      Sentry.captureException(error);
    });

    console.error('[API/VIZ/DAILY] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';

// Runtime configuration
export const runtime = 'nodejs';
