/**
 * YouTube AI Visualization API Endpoint
 *
 * Generates YouTube content packages including scripts, thumbnails, and visualizations
 * from RAG-powered market insights. Supports automated content generation and A/B testing.
 *
 * Features:
 * - Script generation from market data and RAG insights
 * - Thumbnail specification for AI image generation
 * - Visualization specs for video intros
 * - A/B testing variants for engagement optimization
 * - Daily automated content generation via cron
 *
 * Trade-offs:
 * ✅ GOOD: Automated content pipeline; consistent branding
 * ✅ GOOD: RAG-powered accuracy for market insights
 * ❌ BAD: Requires human review; implement approval workflow
 * ❌ BAD: Image generation needs external API
 *
 * Rate Limits:
 * - Free tier: 5 content packages/day
 * - Pro tier: 50 content packages/day
 * - Enterprise: Unlimited
 *
 * @see lib/viz/youtube-ai-viz.ts for implementation
 * @see knowledge-06: A/B testing for engagement
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

import {
  generateYouTubeContent,
  generateABTestVariants,
  generateDailyContent,
  type YouTubeContentRequest,
  type YouTubeContentPackage,
} from '@/lib/viz/youtube-ai-viz';

// ============================================================================
// SCHEMAS
// ============================================================================

const generateContentSchema = z.object({
  topic: z.string().min(1).max(200),
  cardNames: z.array(z.string()).max(10).optional(),
  priceData: z.array(z.object({
    name: z.string(),
    price: z.number(),
    change: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  })).max(20).optional(),
  style: z.enum(['educational', 'hype', 'analysis', 'news']).optional(),
  duration: z.enum(['short', 'medium', 'long']).optional(),
  includeVisualization: z.boolean().optional(),
});

const abTestSchema = z.object({
  topic: z.string().min(1).max(200),
  cardNames: z.array(z.string()).max(10).optional(),
  variantCount: z.number().min(2).max(4).optional(),
});

const dailyContentSchema = z.object({
  topics: z.array(z.string()).min(1).max(10),
  style: z.enum(['educational', 'hype', 'analysis', 'news']).optional(),
  duration: z.enum(['short', 'medium', 'long']).optional(),
});

// ============================================================================
// GET HANDLER - Status and Info
// ============================================================================

/**
 * GET /api/youtube-viz
 *
 * Returns capabilities and status of the YouTube content generation system.
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      capabilities: {
        contentGeneration: {
          enabled: true,
          styles: ['educational', 'hype', 'analysis', 'news'],
          durations: ['short', 'medium', 'long'],
          maxCardsPerRequest: 10,
        },
        abTesting: {
          enabled: true,
          maxVariants: 4,
        },
        visualization: {
          enabled: true,
          types: ['quantum-network', 'price-spiral', 'entanglement', 'trend-flow'],
          exportFormats: ['mp4', 'gif', 'webm'],
        },
        thumbnails: {
          enabled: true,
          colorSchemes: ['quantum', 'market', 'neon', 'holographic'],
          aiPromptGeneration: true,
        },
      },
      limits: {
        maxTopicLength: 200,
        maxCardsPerRequest: 10,
        maxTopicsPerBatch: 10,
      },
      integrations: {
        rag: 'ColBERT + REFRAG pipeline',
        visualization: 'Quantum Neural Network',
        imageGeneration: 'External API (DALL-E/Midjourney prompt)',
      },
    });
  } catch (error) {
    console.error('[YOUTUBE_VIZ_STATUS_ERROR]', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Content Generation
// ============================================================================

/**
 * POST /api/youtube-viz
 *
 * Generate YouTube content packages.
 *
 * Actions:
 * - generate: Generate single content package
 * - ab-test: Generate multiple variants for A/B testing
 * - daily: Generate batch content for daily automation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'generate':
        return handleGenerateContent(body, startTime);

      case 'ab-test':
        return handleABTest(body, startTime);

      case 'daily':
        return handleDailyContent(body, startTime);

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            validActions: ['generate', 'ab-test', 'daily'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[YOUTUBE_VIZ_ERROR]', error);
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handle single content generation
 */
async function handleGenerateContent(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = generateContentSchema.parse(body);

  const content = await generateYouTubeContent({
    topic: validated.topic,
    cardNames: validated.cardNames,
    priceData: validated.priceData,
    style: validated.style || 'educational',
    duration: validated.duration || 'medium',
    includeVisualization: validated.includeVisualization ?? true,
  });

  return NextResponse.json({
    success: true,
    action: 'generate',
    data: {
      script: {
        title: content.script.title,
        hook: content.script.hook,
        sections: content.script.sections.map((s) => ({
          heading: s.heading,
          content: s.content.slice(0, 500), // Truncate for response
          visualCue: s.visualCue,
          duration: s.duration,
        })),
        callToAction: content.script.callToAction,
        estimatedDuration: content.script.estimatedDuration,
        keywords: content.script.keywords,
      },
      thumbnail: content.thumbnail,
      visualization: content.visualization,
      metadata: {
        ...content.metadata,
        generationTimeMs: Date.now() - startTime,
      },
    },
  });
}

/**
 * Handle A/B test variant generation
 */
async function handleABTest(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = abTestSchema.parse(body);

  const variants = await generateABTestVariants(
    {
      topic: validated.topic,
      cardNames: validated.cardNames,
      style: 'educational', // Base style, will be varied
      duration: 'medium',
      includeVisualization: true,
    },
    validated.variantCount || 2
  );

  return NextResponse.json({
    success: true,
    action: 'ab-test',
    data: {
      variantCount: variants.length,
      variants: variants.map((v, i) => ({
        variantId: v.metadata.abTestVariant || `variant_${i + 1}`,
        title: v.script.title,
        style: v.script.keywords.includes('hype') ? 'hype' :
               v.script.keywords.includes('analysis') ? 'analysis' : 'educational',
        estimatedEngagement: v.metadata.estimatedEngagement,
        thumbnailPrompt: v.thumbnail.prompt.slice(0, 200),
        scriptPreview: v.script.hook.slice(0, 300),
      })),
      metadata: {
        generationTimeMs: Date.now() - startTime,
        topic: validated.topic,
      },
    },
  });
}

/**
 * Handle daily batch content generation
 */
async function handleDailyContent(
  body: unknown,
  startTime: number
): Promise<NextResponse> {
  const validated = dailyContentSchema.parse(body);

  const packages = await generateDailyContent(validated.topics, {
    style: validated.style,
    duration: validated.duration,
  });

  return NextResponse.json({
    success: true,
    action: 'daily',
    data: {
      generatedCount: packages.length,
      requestedCount: validated.topics.length,
      content: packages.map((p) => ({
        topic: p.script.keywords[0] || 'unknown',
        title: p.script.title,
        estimatedDuration: p.script.estimatedDuration,
        estimatedEngagement: p.metadata.estimatedEngagement,
        ragSources: p.metadata.ragSources.length,
        hasVisualization: !!p.visualization,
      })),
      metadata: {
        generationTimeMs: Date.now() - startTime,
        avgEngagement:
          packages.reduce((acc, p) => acc + p.metadata.estimatedEngagement, 0) /
          (packages.length || 1),
      },
    },
  });
}

// ============================================================================
// CRON HANDLER (for daily automation)
// ============================================================================

/**
 * Vercel Cron Handler
 *
 * Called daily to generate content for trending topics.
 * Configure in vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/youtube-viz?cron=true",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 * ```
 */
export async function handleCronRequest(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');

  // Verify cron secret
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Default trending topics (in production, fetch from analytics)
  const trendingTopics = [
    'TCG Market Weekly Recap',
    'Pokemon Card Price Movements',
    'Rare Card Spotlight',
  ];

  try {
    const packages = await generateDailyContent(trendingTopics, {
      style: 'analysis',
      duration: 'medium',
    });

    // TODO: Store in database and trigger review workflow
    console.log(`[YOUTUBE_VIZ_CRON] Generated ${packages.length} content packages`);

    return NextResponse.json({
      success: true,
      generated: packages.length,
      topics: trendingTopics,
    });
  } catch (error) {
    console.error('[YOUTUBE_VIZ_CRON_ERROR]', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
