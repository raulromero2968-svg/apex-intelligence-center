/**
 * YouTube AI Visualization Module
 *
 * Auto-generates YouTube scripts, thumbnails, and visualizations from RAG outputs.
 * Integrates ColBERT for precise trend retrieval and REFRAG for efficient content generation.
 *
 * Features:
 * - Script generation from market data and RAG insights
 * - Thumbnail generation prompts for AI image tools
 * - Quantum spiral visualizations for video intros
 * - A/B testing support for engagement optimization
 *
 * Trade-offs:
 * ✅ GOOD: Automated content pipeline; consistent branding
 * ✅ GOOD: RAG-powered accuracy for market insights
 * ❌ BAD: Requires human review for quality; add approval workflow
 * ❌ BAD: Image generation needs external API (DALL-E/Midjourney)
 *
 * Integration:
 * - ColBERT: Precise retrieval for trend data (lib/rag/colbert.ts)
 * - REFRAG RL: Efficient chunk selection (lib/rag/refrag-rl.ts)
 * - Quantum viz: Video thumbnails/intros (lib/viz/quantum-nn.ts)
 *
 * @see knowledge-02: RAG architecture
 * @see knowledge-06: A/B testing for engagement
 */

import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

/**
 * Schema for YouTube content request
 */
const youtubeContentRequestSchema = z.object({
  topic: z.string().min(1),
  cardNames: z.array(z.string()).optional(),
  priceData: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        change: z.number(),
        trend: z.enum(['up', 'down', 'stable']),
      })
    )
    .optional(),
  style: z.enum(['educational', 'hype', 'analysis', 'news']).default('educational'),
  duration: z.enum(['short', 'medium', 'long']).default('medium'),
  includeVisualization: z.boolean().default(true),
});

export type YouTubeContentRequest = z.infer<typeof youtubeContentRequestSchema>;

/**
 * Generated YouTube content package
 */
export interface YouTubeContentPackage {
  script: YouTubeScript;
  thumbnail: ThumbnailSpec;
  visualization?: VisualizationSpec;
  metadata: ContentMetadata;
}

/**
 * YouTube script structure
 */
export interface YouTubeScript {
  title: string;
  hook: string; // First 30 seconds
  sections: ScriptSection[];
  callToAction: string;
  estimatedDuration: number; // seconds
  keywords: string[];
}

interface ScriptSection {
  heading: string;
  content: string;
  visualCue: string; // What to show on screen
  duration: number; // seconds
}

/**
 * Thumbnail specification for AI generation
 */
export interface ThumbnailSpec {
  prompt: string; // DALL-E/Midjourney prompt
  textOverlay: {
    primary: string;
    secondary?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  colorScheme: 'quantum' | 'market' | 'neon' | 'holographic';
  elements: string[]; // Visual elements to include
  style: string; // Art style description
}

/**
 * Visualization specification for video
 */
export interface VisualizationSpec {
  type: 'quantum-network' | 'price-spiral' | 'entanglement' | 'trend-flow';
  config: Record<string, any>;
  duration: number; // Animation duration in seconds
  loopable: boolean;
  exportFormat: 'mp4' | 'gif' | 'webm';
}

/**
 * Content metadata for tracking
 */
interface ContentMetadata {
  generatedAt: string;
  ragSources: string[];
  tokenCount: number;
  estimatedEngagement: number; // 0-100 score
  abTestVariant?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCRIPT_TEMPLATES = {
  educational: {
    hookDuration: 30,
    sectionCount: 4,
    ctaStyle: 'subscribe-learn',
  },
  hype: {
    hookDuration: 15,
    sectionCount: 3,
    ctaStyle: 'subscribe-alert',
  },
  analysis: {
    hookDuration: 45,
    sectionCount: 5,
    ctaStyle: 'subscribe-analyze',
  },
  news: {
    hookDuration: 20,
    sectionCount: 3,
    ctaStyle: 'subscribe-update',
  },
};

const DURATION_TARGETS = {
  short: 180, // 3 minutes
  medium: 480, // 8 minutes
  long: 900, // 15 minutes
};

const THUMBNAIL_STYLES = {
  quantum:
    'cyberpunk digital art, glowing cyan and magenta, holographic effects, dark background, high contrast',
  market:
    'professional financial aesthetic, green and red accents, clean modern design, data visualization',
  neon: 'neon lights, synthwave aesthetic, vibrant colors, retro-futuristic, glowing text',
  holographic:
    'iridescent holographic textures, rainbow reflections, premium luxury feel, metallic accents',
};

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate complete YouTube content package
 *
 * Uses RAG to gather insights and generates script, thumbnail, and visualization specs.
 *
 * @param request - Content generation request
 * @returns Complete content package ready for production
 *
 * @example
 * ```typescript
 * const content = await generateYouTubeContent({
 *   topic: "Charizard Price Surge Analysis",
 *   cardNames: ["Charizard VMAX", "Charizard Base Set"],
 *   style: "analysis",
 *   duration: "medium",
 * });
 * console.log(content.script.title);
 * ```
 */
export async function generateYouTubeContent(
  request: YouTubeContentRequest
): Promise<YouTubeContentPackage> {
  const startTime = Date.now();

  try {
    // Validate request
    const validated = youtubeContentRequestSchema.parse(request);

    // Get RAG insights for the topic
    const ragInsights = await getRAGInsights(validated.topic, validated.cardNames);

    // Generate script
    const script = await generateScript(validated, ragInsights);

    // Generate thumbnail spec
    const thumbnail = generateThumbnailSpec(validated, script);

    // Generate visualization spec if requested
    const visualization = validated.includeVisualization
      ? generateVisualizationSpec(validated, script)
      : undefined;

    // Calculate metadata
    const metadata: ContentMetadata = {
      generatedAt: new Date().toISOString(),
      ragSources: ragInsights.sources,
      tokenCount: estimateTokenCount(script),
      estimatedEngagement: calculateEngagementScore(script, thumbnail),
      abTestVariant: generateABVariant(),
    };

    Sentry.addBreadcrumb({
      category: 'viz.youtube',
      level: 'info',
      message: `Generated YouTube content for: ${validated.topic}`,
      data: {
        style: validated.style,
        duration: validated.duration,
        tokenCount: metadata.tokenCount,
        timeMs: Date.now() - startTime,
      },
    });

    return {
      script,
      thumbnail,
      visualization,
      metadata,
    };
  } catch (error) {
    console.error('[YOUTUBE_CONTENT_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'youtube-ai-viz', operation: 'generate' },
    });
    throw error;
  }
}

// ============================================================================
// RAG INTEGRATION
// ============================================================================

interface RAGInsights {
  summary: string;
  keyPoints: string[];
  priceAnalysis?: string;
  trendPrediction?: string;
  sources: string[];
}

/**
 * Get RAG insights for content generation
 *
 * Uses ColBERT for precise retrieval and REFRAG for efficient processing.
 */
async function getRAGInsights(
  topic: string,
  cardNames?: string[]
): Promise<RAGInsights> {
  try {
    // Dynamic import to avoid circular dependencies
    const { colbertRefragPipeline } = await import('../rag/colbert');

    // Build query from topic and card names
    const query = cardNames
      ? `${topic} ${cardNames.join(' ')} price trend analysis`
      : `${topic} TCG market analysis`;

    // Use ColBERT + REFRAG pipeline
    const result = await colbertRefragPipeline(query, {
      topK: 10,
      expansionThreshold: 0.6,
    });

    // Extract insights from expanded chunks
    const insights: RAGInsights = {
      summary: result.expandedChunks
        .slice(0, 3)
        .map((c) => c.content)
        .join(' ')
        .slice(0, 500),
      keyPoints: extractKeyPoints(result.expandedChunks.map((c) => c.content)),
      priceAnalysis: extractPriceAnalysis(result.results),
      trendPrediction: predictTrend(result.results),
      sources: result.results.slice(0, 5).map((r) => r.source || 'unknown'),
    };

    return insights;
  } catch (error) {
    console.warn('[RAG_INSIGHTS_ERROR]', error);
    // Return fallback insights
    return {
      summary: `Analysis of ${topic} in the TCG market.`,
      keyPoints: [
        'Market trends showing interesting patterns',
        'Collectors focusing on key sets',
        'Price movements influenced by demand',
      ],
      sources: [],
    };
  }
}

/**
 * Extract key points from content chunks
 */
function extractKeyPoints(contents: string[]): string[] {
  const points: string[] = [];
  const combinedText = contents.join(' ');

  // Simple extraction based on patterns
  const patterns = [
    /(?:importantly|notably|key point|significant)[:\s]+([^.]+)/gi,
    /(?:price|value|worth)\s+(?:is|was|reached)\s+([^.]+)/gi,
    /(?:increased|decreased|surged|dropped)\s+by\s+([^.]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = combinedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && points.length < 5) {
        points.push(match[1].trim());
      }
    }
  }

  // Fallback points
  if (points.length < 3) {
    points.push('Market showing active trading patterns');
    points.push('Collector interest remains strong');
    points.push('Prices influenced by supply and demand');
  }

  return points.slice(0, 5);
}

/**
 * Extract price analysis from search results
 */
function extractPriceAnalysis(
  results: Array<{ content: string; score: number }>
): string | undefined {
  for (const result of results) {
    const priceMatch = result.content.match(
      /\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:dollars|USD)/gi
    );
    if (priceMatch) {
      return `Price data found: ${priceMatch.slice(0, 3).join(', ')}`;
    }
  }
  return undefined;
}

/**
 * Predict trend from search results
 */
function predictTrend(
  results: Array<{ content: string; score: number }>
): string | undefined {
  let bullishSignals = 0;
  let bearishSignals = 0;

  const bullishWords = ['increase', 'surge', 'rally', 'bullish', 'growth', 'demand'];
  const bearishWords = ['decrease', 'drop', 'decline', 'bearish', 'correction', 'fall'];

  for (const result of results) {
    const text = result.content.toLowerCase();
    for (const word of bullishWords) {
      if (text.includes(word)) bullishSignals++;
    }
    for (const word of bearishWords) {
      if (text.includes(word)) bearishSignals++;
    }
  }

  if (bullishSignals > bearishSignals * 1.5) {
    return 'Bullish outlook - market showing positive momentum';
  } else if (bearishSignals > bullishSignals * 1.5) {
    return 'Cautious outlook - some bearish signals detected';
  } else {
    return 'Mixed signals - market showing consolidation';
  }
}

// ============================================================================
// SCRIPT GENERATION
// ============================================================================

/**
 * Generate YouTube script from request and RAG insights
 */
async function generateScript(
  request: YouTubeContentRequest,
  insights: RAGInsights
): Promise<YouTubeScript> {
  const template = SCRIPT_TEMPLATES[request.style];
  const targetDuration = DURATION_TARGETS[request.duration];

  // Generate hook
  const hook = generateHook(request, insights, template.hookDuration);

  // Generate sections
  const sections = generateSections(
    request,
    insights,
    template.sectionCount,
    targetDuration - template.hookDuration - 30 // Reserve 30s for CTA
  );

  // Generate CTA
  const callToAction = generateCTA(template.ctaStyle, request.topic);

  // Generate title
  const title = generateTitle(request, insights);

  // Extract keywords
  const keywords = extractKeywords(request, insights);

  return {
    title,
    hook,
    sections,
    callToAction,
    estimatedDuration: targetDuration,
    keywords,
  };
}

/**
 * Generate engaging hook for first 30 seconds
 */
function generateHook(
  request: YouTubeContentRequest,
  insights: RAGInsights,
  duration: number
): string {
  const hooks: Record<string, string> = {
    educational: `Did you know that ${request.topic} could be the key to understanding the TCG market? Today, I'm breaking down everything you need to know. ${insights.keyPoints[0] || ''} Let's dive in.`,
    hype: `HUGE NEWS! ${request.topic} is making waves in the TCG community! ${insights.trendPrediction || 'The market is moving fast.'} You're not gonna want to miss this!`,
    analysis: `Today we're doing a deep dive into ${request.topic}. I've analyzed the data, crunched the numbers, and ${insights.priceAnalysis || 'the results are fascinating'}. Let me show you what I found.`,
    news: `Breaking: ${request.topic} - here's what you need to know right now. ${insights.keyPoints[0] || ''} All the details coming up.`,
  };

  return hooks[request.style] || hooks.educational;
}

/**
 * Generate content sections
 */
function generateSections(
  request: YouTubeContentRequest,
  insights: RAGInsights,
  count: number,
  totalDuration: number
): ScriptSection[] {
  const sectionDuration = Math.floor(totalDuration / count);
  const sections: ScriptSection[] = [];

  const sectionTemplates = [
    {
      heading: 'The Current State',
      contentGen: () =>
        `Let's look at where things stand right now. ${insights.summary.slice(0, 200)}...`,
      visualCue: 'Show current market data chart',
    },
    {
      heading: 'Key Factors',
      contentGen: () =>
        `There are several factors driving this. ${insights.keyPoints.slice(0, 2).join('. ')}.`,
      visualCue: 'Display key factors infographic',
    },
    {
      heading: 'Price Analysis',
      contentGen: () =>
        insights.priceAnalysis ||
        'Looking at historical price data, we can see interesting patterns emerging.',
      visualCue: 'Show price trend visualization',
    },
    {
      heading: 'What This Means',
      contentGen: () =>
        `So what does this mean for collectors and investors? ${insights.trendPrediction || 'The market continues to evolve.'}`,
      visualCue: 'Display prediction chart',
    },
    {
      heading: 'My Take',
      contentGen: () =>
        `Here's my personal analysis based on all this data. ${insights.keyPoints[insights.keyPoints.length - 1] || 'There are opportunities for those who know where to look.'}`,
      visualCue: 'Show summary slide',
    },
  ];

  for (let i = 0; i < count && i < sectionTemplates.length; i++) {
    const template = sectionTemplates[i];
    sections.push({
      heading: template.heading,
      content: template.contentGen(),
      visualCue: template.visualCue,
      duration: sectionDuration,
    });
  }

  return sections;
}

/**
 * Generate call to action
 */
function generateCTA(style: string, topic: string): string {
  const ctas: Record<string, string> = {
    'subscribe-learn': `If you found this breakdown of ${topic} helpful, smash that subscribe button and hit the bell for more TCG insights. Drop a comment below with your thoughts!`,
    'subscribe-alert': `Don't miss out on the next big update! Subscribe and turn on notifications so you're always first to know. Drop a like if you're excited about ${topic}!`,
    'subscribe-analyze': `Want more in-depth analysis like this? Subscribe for weekly deep dives into the TCG market. Let me know in the comments what you want me to analyze next!`,
    'subscribe-update': `Stay updated on ${topic} and more - subscribe now. Follow me on Twitter for real-time updates. Links in the description!`,
  };

  return ctas[style] || ctas['subscribe-learn'];
}

/**
 * Generate engaging title
 */
function generateTitle(request: YouTubeContentRequest, insights: RAGInsights): string {
  const templates: Record<string, string[]> = {
    educational: [
      `${request.topic}: Everything You Need to Know`,
      `Understanding ${request.topic} | Complete Guide`,
      `${request.topic} Explained | TCG Market Analysis`,
    ],
    hype: [
      `${request.topic} IS EXPLODING! 🔥`,
      `HUGE: ${request.topic} Update You Can't Miss!`,
      `${request.topic} Changes EVERYTHING! 📈`,
    ],
    analysis: [
      `${request.topic} Deep Dive | Data Analysis`,
      `I Analyzed ${request.topic} - Here's What I Found`,
      `${request.topic}: Complete Market Breakdown`,
    ],
    news: [
      `BREAKING: ${request.topic} News`,
      `${request.topic} Update | What You Need to Know`,
      `${request.topic} - Latest Developments`,
    ],
  };

  const options = templates[request.style] || templates.educational;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Extract keywords for SEO
 */
function extractKeywords(request: YouTubeContentRequest, insights: RAGInsights): string[] {
  const keywords = new Set<string>();

  // Add topic words
  request.topic.split(' ').forEach((word) => {
    if (word.length > 3) keywords.add(word.toLowerCase());
  });

  // Add card names
  request.cardNames?.forEach((name) => {
    keywords.add(name.toLowerCase());
  });

  // Add common TCG keywords
  ['tcg', 'pokemon', 'cards', 'trading cards', 'collecting', 'market', 'price'].forEach(
    (kw) => keywords.add(kw)
  );

  return Array.from(keywords).slice(0, 15);
}

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

/**
 * Generate thumbnail specification for AI image generation
 */
function generateThumbnailSpec(
  request: YouTubeContentRequest,
  script: YouTubeScript
): ThumbnailSpec {
  const colorScheme = request.style === 'hype' ? 'neon' : 'quantum';

  // Extract main subject for visual
  const mainSubject = request.cardNames?.[0] || request.topic.split(' ')[0];

  // Generate DALL-E/Midjourney prompt
  const prompt = generateThumbnailPrompt(mainSubject, request.style, colorScheme);

  // Generate text overlay
  const textOverlay = generateTextOverlay(script.title, request.style);

  // Determine visual elements
  const elements = determineVisualElements(request);

  return {
    prompt,
    textOverlay,
    colorScheme,
    elements,
    style: THUMBNAIL_STYLES[colorScheme],
  };
}

/**
 * Generate AI image prompt for thumbnail
 */
function generateThumbnailPrompt(
  subject: string,
  style: string,
  colorScheme: 'quantum' | 'market' | 'neon' | 'holographic'
): string {
  const baseStyle = THUMBNAIL_STYLES[colorScheme];

  const styleModifiers: Record<string, string> = {
    educational: 'clean, professional, informative design',
    hype: 'explosive, dynamic, high energy with motion blur effects',
    analysis: 'data-driven, charts and graphs in background, analytical feel',
    news: 'breaking news aesthetic, urgent feel, bold typography',
  };

  return `${subject} trading card game theme, ${baseStyle}, ${styleModifiers[style] || styleModifiers.educational}, YouTube thumbnail composition, 16:9 aspect ratio, high contrast, eye-catching, trending on ArtStation`;
}

/**
 * Generate text overlay for thumbnail
 */
function generateTextOverlay(
  title: string,
  style: string
): ThumbnailSpec['textOverlay'] {
  // Shorten title for thumbnail
  const primaryText =
    title.length > 30
      ? title.split(/[:|]|-/)[0].trim().toUpperCase()
      : title.toUpperCase();

  const positions: Record<string, ThumbnailSpec['textOverlay']['position']> = {
    educational: 'bottom-left',
    hype: 'center',
    analysis: 'top-left',
    news: 'bottom-right',
  };

  return {
    primary: primaryText,
    secondary: style === 'hype' ? '🔥 MUST WATCH' : undefined,
    position: positions[style] || 'bottom-left',
  };
}

/**
 * Determine visual elements to include
 */
function determineVisualElements(request: YouTubeContentRequest): string[] {
  const elements: string[] = ['trading card'];

  if (request.priceData?.some((p) => p.trend === 'up')) {
    elements.push('upward arrow', 'green glow');
  }
  if (request.priceData?.some((p) => p.trend === 'down')) {
    elements.push('warning icon');
  }

  if (request.style === 'analysis') {
    elements.push('data chart', 'magnifying glass');
  }
  if (request.style === 'hype') {
    elements.push('fire effects', 'sparkles');
  }

  return elements;
}

// ============================================================================
// VISUALIZATION GENERATION
// ============================================================================

/**
 * Generate visualization specification for video
 */
function generateVisualizationSpec(
  request: YouTubeContentRequest,
  script: YouTubeScript
): VisualizationSpec {
  // Determine viz type based on content
  const vizType = determineVizType(request);

  // Generate config based on type
  const config = generateVizConfig(vizType, request);

  return {
    type: vizType,
    config,
    duration: 10, // 10-second animation
    loopable: true,
    exportFormat: 'mp4',
  };
}

/**
 * Determine best visualization type
 */
function determineVizType(
  request: YouTubeContentRequest
): VisualizationSpec['type'] {
  if (request.priceData && request.priceData.length > 1) {
    // Multiple cards = show relationships
    return 'entanglement';
  }

  if (request.style === 'analysis') {
    return 'price-spiral';
  }

  if (request.style === 'hype') {
    return 'trend-flow';
  }

  return 'quantum-network';
}

/**
 * Generate visualization config
 */
function generateVizConfig(
  type: VisualizationSpec['type'],
  request: YouTubeContentRequest
): Record<string, any> {
  const baseConfig = {
    width: 1920,
    height: 1080,
    quality: 'high',
    colorScheme: request.style === 'hype' ? 'neon' : 'quantum',
    enablePulses: true,
    animationSpeed: request.style === 'hype' ? 1.5 : 1.0,
  };

  switch (type) {
    case 'quantum-network':
      return {
        ...baseConfig,
        maxNodes: request.cardNames?.length || 20,
        enableEntanglement: true,
        enableSpirals: true,
      };

    case 'price-spiral':
      return {
        ...baseConfig,
        priceData: request.priceData,
        spiralTurns: 3,
        growthRate: 1.618, // Golden ratio
      };

    case 'entanglement':
      return {
        ...baseConfig,
        pairs:
          request.cardNames?.map((name, i) => ({
            nodeA: name,
            nodeB: request.cardNames?.[i + 1] || request.cardNames?.[0],
            correlation: 'positive',
          })) || [],
      };

    case 'trend-flow':
      return {
        ...baseConfig,
        flowDirection: 'right',
        particleCount: 500,
        trailLength: 20,
      };

    default:
      return baseConfig;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Estimate token count for script
 */
function estimateTokenCount(script: YouTubeScript): number {
  const text = [
    script.title,
    script.hook,
    ...script.sections.map((s) => s.content),
    script.callToAction,
  ].join(' ');

  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate engagement score prediction
 */
function calculateEngagementScore(
  script: YouTubeScript,
  thumbnail: ThumbnailSpec
): number {
  let score = 50; // Base score

  // Title factors
  if (script.title.includes('!')) score += 5;
  if (script.title.length < 60) score += 5;
  if (script.title.toUpperCase() === script.title) score += 3;

  // Keyword factors
  const highEngagementKeywords = ['secret', 'hidden', 'exclusive', 'breaking', 'huge'];
  for (const keyword of highEngagementKeywords) {
    if (script.title.toLowerCase().includes(keyword)) score += 5;
  }

  // Duration optimization (8-12 min is optimal)
  if (script.estimatedDuration >= 480 && script.estimatedDuration <= 720) {
    score += 10;
  }

  // Thumbnail factors
  if (thumbnail.textOverlay.secondary) score += 5;

  return Math.min(100, score);
}

/**
 * Generate A/B test variant ID
 */
function generateABVariant(): string {
  const variants = ['A', 'B', 'C', 'D'];
  return variants[Math.floor(Math.random() * variants.length)];
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate multiple content packages for A/B testing
 */
export async function generateABTestVariants(
  request: YouTubeContentRequest,
  variantCount: number = 2
): Promise<YouTubeContentPackage[]> {
  const variants: YouTubeContentPackage[] = [];
  const styles: YouTubeContentRequest['style'][] = [
    'educational',
    'hype',
    'analysis',
    'news',
  ];

  for (let i = 0; i < variantCount; i++) {
    const variantRequest = {
      ...request,
      style: styles[i % styles.length],
    };

    const content = await generateYouTubeContent(variantRequest);
    content.metadata.abTestVariant = `variant_${i + 1}`;
    variants.push(content);
  }

  return variants;
}

/**
 * Schedule content generation for daily automation
 */
export async function generateDailyContent(
  topics: string[],
  options: {
    style?: YouTubeContentRequest['style'];
    duration?: YouTubeContentRequest['duration'];
  } = {}
): Promise<YouTubeContentPackage[]> {
  const packages: YouTubeContentPackage[] = [];

  for (const topic of topics) {
    try {
      const content = await generateYouTubeContent({
        topic,
        style: options.style || 'educational',
        duration: options.duration || 'medium',
        includeVisualization: true,
      });
      packages.push(content);
    } catch (error) {
      console.error(`[DAILY_CONTENT_ERROR] Failed for topic: ${topic}`, error);
    }
  }

  return packages;
}
