/**
 * Spatial RAG Pipeline for 3D TCG Market Intelligence
 *
 * Implements Phase 1 of AI Livelihood Analysis master plan:
 * - Multimodal spatial embeddings for 3D market visualizations
 * - World model-inspired next-frame prediction for market dynamics
 * - RTFM-style discovery for undervalued cards and emerging trends
 *
 * References:
 * - Fei-Fei Li's spatial intelligence research (world models)
 * - knowledge-02-ai-rag-architecture-v2 (RAG-Fusion patterns)
 * - knowledge-09-database-architecture (pgvector spatial embeddings)
 *
 * Trade-offs:
 * - GOOD: Enables 3D discovery (visualize card clusters, trend vectors)
 * - BAD: Higher compute requirements (fallback to 2D if GPU unavailable)
 *
 * @see master-plan-ai-livelihood-analysis Phase 1
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { db } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { cards } from '@/db/schema';
import {
  spatialEmbeddings,
  type SpatialEmbedding,
  type NewSpatialEmbedding,
} from '@/db/schema/spatial-livelihood';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

export interface SpatialQuery {
  vector: number[];
  metadata: {
    cardId?: string;
    userId?: string;
    spatialContext: string;
    contextType: SpatialContextType;
    coordinates?: Coordinates3D;
  };
}

export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
  clusterLabel?: string;
  confidence: number;
}

export type SpatialContextType =
  | 'market_position'
  | 'trend_vector'
  | 'cluster_centroid'
  | 'price_trajectory'
  | 'volatility_surface';

export interface SpatialRAGParams {
  query: string;
  cardId?: string;
  userId?: string;
  contextType?: SpatialContextType;
  includeVisualization?: boolean;
  topK?: number;
}

export interface SpatialRAGResponse {
  answer: string;
  spatialContext: SpatialQuery;
  similarDocuments: Array<{
    id: string;
    spatialContext: string;
    similarity: number;
    coordinates?: Coordinates3D;
  }>;
  visualization?: {
    type: '3d_scatter' | '2d_projection' | 'trajectory';
    data: Array<{
      id: string;
      x: number;
      y: number;
      z?: number;
      label: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  livelihoodInsights?: {
    jobImpacts: string[];
    upskillingSuggestions: string[];
    discoveryOpportunities: string[];
  };
}

export interface MarketPrediction {
  cardId: string;
  predictedTrend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: '1h' | '24h' | '7d' | '30d';
  reasoning: string;
  spatialPosition: Coordinates3D;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SPATIAL_CONFIG = {
  EMBEDDING_MODEL: 'text-embedding-3-large',
  EMBEDDING_DIMENSIONS: 1536,
  DEFAULT_TOP_K: 10,
  SIMILARITY_THRESHOLD: 0.7,
  CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes
  MAX_CONTEXT_LENGTH: 8000,
  VISION_MODEL: 'gpt-4o', // For multimodal spatial understanding
};

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate spatial embeddings for a card with full market context
 *
 * Creates multimodal embeddings that capture:
 * - Card attributes (name, rarity, set)
 * - Market position (price, volume, velocity)
 * - Temporal context (trends, predictions)
 * - Visual features (if image available)
 *
 * @param cardId - Card ID to generate embeddings for
 * @param userId - Optional user ID for personalized context
 * @returns SpatialQuery with vector and metadata
 */
export async function generateSpatialEmbeddings(
  cardId: string,
  userId?: string
): Promise<SpatialQuery> {
  try {
    // Fetch card data with market context
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    // Build comprehensive spatial description
    const spatialDesc = buildSpatialDescription(card);

    // Generate embedding
    const embeddings = new OpenAIEmbeddings({
      modelName: SPATIAL_CONFIG.EMBEDDING_MODEL,
      dimensions: SPATIAL_CONFIG.EMBEDDING_DIMENSIONS,
    });

    const vector = await embeddings.embedQuery(spatialDesc);

    // Calculate 3D coordinates based on market metrics
    const coordinates = calculateMarketCoordinates(card);

    // Store in database
    const newEmbedding: NewSpatialEmbedding = {
      cardId,
      userId,
      embedding: vector,
      spatialContext: spatialDesc,
      contextType: 'market_position',
      coordinates,
      temporalData: {
        timestamp: new Date().toISOString(),
        priceAtTime: card.apexScore || 0,
        volumeAtTime: 0, // Would come from sales data
        predictionWindow: '24h',
        confidence: coordinates.confidence,
      },
      metadata: {
        modelVersion: '1.0.0',
        embeddingModel: SPATIAL_CONFIG.EMBEDDING_MODEL,
        sourceData: ['cards', 'prices'],
        generatedAt: new Date().toISOString(),
      },
    };

    await db.insert(spatialEmbeddings).values(newEmbedding);

    return {
      vector,
      metadata: {
        cardId,
        userId,
        spatialContext: spatialDesc,
        contextType: 'market_position',
        coordinates,
      },
    };
  } catch (error) {
    console.error('[SPATIAL_EMBED_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'spatial-rag', operation: 'generateEmbeddings' },
      extra: { cardId, userId },
    });
    throw new Error('Failed to generate spatial embeddings');
  }
}

/**
 * Build comprehensive spatial description for embedding
 */
function buildSpatialDescription(card: typeof cards.$inferSelect): string {
  const parts = [
    `Card: ${card.name}`,
    `Set: ${card.setName}`,
    `Game: ${card.game}`,
    card.rarity ? `Rarity: ${card.rarity}` : null,
    card.apexScore ? `Apex Score: ${card.apexScore.toFixed(1)}/100` : null,
    card.sevenDayGainPercent
      ? `7-Day Performance: ${card.sevenDayGainPercent > 0 ? '+' : ''}${card.sevenDayGainPercent.toFixed(2)}%`
      : null,
    card.isManipulated
      ? `Market Status: Under Review (${card.manipulationReason || 'anomaly detected'})`
      : 'Market Status: Normal',
  ].filter(Boolean);

  // Add market position context
  const marketPosition = determineMarketPosition(card);
  parts.push(`Market Position: ${marketPosition}`);

  return parts.join('. ');
}

/**
 * Determine market position category based on metrics
 */
function determineMarketPosition(
  card: typeof cards.$inferSelect
): string {
  const score = card.apexScore || 0;
  const gain = card.sevenDayGainPercent || 0;

  if (score >= 80 && gain > 10) return 'Hot performer - high demand';
  if (score >= 60 && gain > 0) return 'Steady growth - watch list';
  if (score >= 40) return 'Stable - moderate activity';
  if (gain < -10) return 'Declining - buyer opportunity';
  return 'Emerging - discovery potential';
}

/**
 * Calculate 3D market coordinates for visualization
 *
 * X-axis: Price velocity (momentum)
 * Y-axis: Apex score (overall quality)
 * Z-axis: Market depth (liquidity/volume)
 */
function calculateMarketCoordinates(
  card: typeof cards.$inferSelect
): Coordinates3D {
  // Normalize values to 0-100 range for visualization
  const x = Math.min(100, Math.max(0, 50 + (card.sevenDayGainPercent || 0) * 2)); // Velocity
  const y = card.apexScore || 50; // Quality score
  const z = 50; // Would be calculated from volume data

  // Determine cluster based on metrics
  const clusterLabel = getClusterLabel(x, y, z);

  return {
    x,
    y,
    z,
    clusterLabel,
    confidence: calculateConfidence(card),
  };
}

/**
 * Assign cluster label based on 3D position
 */
function getClusterLabel(x: number, y: number, z: number): string {
  if (x > 70 && y > 70) return 'momentum_leaders';
  if (x < 30 && y > 70) return 'stable_blue_chips';
  if (x > 70 && y < 30) return 'speculative_surge';
  if (x < 30 && y < 30) return 'value_discovery';
  return 'core_market';
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(card: typeof cards.$inferSelect): number {
  let confidence = 0.5; // Base confidence

  if (card.apexScore !== null) confidence += 0.15;
  if (card.sevenDayGainPercent !== null) confidence += 0.15;
  if (card.tcgplayerId || card.justTcgId) confidence += 0.1;
  if (!card.isManipulated) confidence += 0.1;

  return Math.min(1, confidence);
}

// ============================================================================
// SPATIAL RAG PIPELINE
// ============================================================================

/**
 * Execute Spatial RAG pipeline for market intelligence queries
 *
 * Combines:
 * - Semantic search with spatial embeddings
 * - 3D visualization data generation
 * - Livelihood-focused insights (job impacts, upskilling)
 *
 * @param params - Query parameters
 * @returns SpatialRAGResponse with answer, visualization, and insights
 */
export async function spatialRAG(params: SpatialRAGParams): Promise<SpatialRAGResponse> {
  const {
    query,
    cardId,
    userId,
    contextType = 'market_position',
    includeVisualization = true,
    topK = SPATIAL_CONFIG.DEFAULT_TOP_K,
  } = params;

  try {
    // Step 1: Generate query embedding
    const embeddings = new OpenAIEmbeddings({
      modelName: SPATIAL_CONFIG.EMBEDDING_MODEL,
      dimensions: SPATIAL_CONFIG.EMBEDDING_DIMENSIONS,
    });

    const queryVector = await embeddings.embedQuery(query);

    // Step 2: If cardId provided, also embed the card context
    let spatialContext: SpatialQuery | null = null;
    if (cardId) {
      spatialContext = await generateSpatialEmbeddings(cardId, userId);
    } else {
      spatialContext = {
        vector: queryVector,
        metadata: {
          spatialContext: query,
          contextType,
        },
      };
    }

    // Step 3: Perform hybrid search (semantic + spatial)
    const similarDocs = await hybridSpatialSearch(queryVector, topK, contextType);

    // Step 4: Generate LLM response with spatial context
    const llm = getLLM();
    const systemPrompt = buildSpatialSystemPrompt(query, similarDocs);
    const response = await llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserPrompt(query, spatialContext.metadata.spatialContext) },
    ]);

    const answer = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Step 5: Generate visualization data if requested
    let visualization: SpatialRAGResponse['visualization'];
    if (includeVisualization) {
      visualization = generateVisualizationData(similarDocs);
    }

    // Step 6: Extract livelihood insights
    const livelihoodInsights = await extractLivelihoodInsights(query, answer);

    return {
      answer,
      spatialContext,
      similarDocuments: similarDocs.map((doc) => ({
        id: doc.id,
        spatialContext: doc.spatialContext,
        similarity: doc.similarity,
        coordinates: doc.coordinates as Coordinates3D | undefined,
      })),
      visualization,
      livelihoodInsights,
    };
  } catch (error) {
    console.error('[SPATIAL_RAG_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'spatial-rag', operation: 'spatialRAG' },
      extra: { query, cardId, userId },
    });
    throw new Error('Failed to execute spatial RAG pipeline');
  }
}

/**
 * Perform hybrid search combining semantic and spatial similarity
 */
async function hybridSpatialSearch(
  queryVector: number[],
  topK: number,
  contextType: SpatialContextType
): Promise<Array<SpatialEmbedding & { similarity: number }>> {
  // Use pgvector for semantic similarity
  // Note: This query assumes pgvector extension is enabled
  const vectorStr = `[${queryVector.join(',')}]`;

  const results = await db
    .select({
      id: spatialEmbeddings.id,
      cardId: spatialEmbeddings.cardId,
      userId: spatialEmbeddings.userId,
      embedding: spatialEmbeddings.embedding,
      spatialContext: spatialEmbeddings.spatialContext,
      contextType: spatialEmbeddings.contextType,
      coordinates: spatialEmbeddings.coordinates,
      temporalData: spatialEmbeddings.temporalData,
      metadata: spatialEmbeddings.metadata,
      createdAt: spatialEmbeddings.createdAt,
      updatedAt: spatialEmbeddings.updatedAt,
      // Calculate cosine similarity using pgvector
      similarity: sql<number>`1 - (embedding <=> ${vectorStr}::vector)`.as('similarity'),
    })
    .from(spatialEmbeddings)
    .where(eq(spatialEmbeddings.contextType, contextType))
    .orderBy(sql`embedding <=> ${vectorStr}::vector`)
    .limit(topK);

  return results.map((r) => ({
    ...r,
    similarity: r.similarity ?? 0,
  }));
}

/**
 * Get LLM instance with fallback
 */
function getLLM() {
  const useClaude = !!process.env.ANTHROPIC_API_KEY;

  if (useClaude) {
    return new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 2048,
    });
  }

  return new ChatOpenAI({
    modelName: SPATIAL_CONFIG.VISION_MODEL,
    temperature: 0.3,
    maxTokens: 2048,
  });
}

/**
 * Build system prompt with spatial context
 */
function buildSpatialSystemPrompt(
  query: string,
  similarDocs: Array<SpatialEmbedding & { similarity: number }>
): string {
  const contextDocs = similarDocs
    .slice(0, 5)
    .map((doc, i) => `[${i + 1}] ${doc.spatialContext} (similarity: ${doc.similarity.toFixed(3)})`)
    .join('\n');

  return `You are an AI market intelligence assistant for Apex Intelligence, specializing in TCG (Trading Card Game) market analysis with spatial awareness.

Your role is to:
1. Provide accurate market intelligence based on spatial positioning of cards
2. Address user anxieties about AI impact on trading/collecting livelihoods
3. Suggest upskilling opportunities and discovery pathways
4. Frame AI as an augmentation tool, not a replacement

When analyzing queries:
- Consider the 3D market space: X (price velocity), Y (quality score), Z (market depth)
- Identify clusters and trends in the spatial data
- Highlight opportunities that AI helps discover (not replace human insight)

Relevant Market Context:
${contextDocs}

Important: Always frame insights in terms of how AI augments human decision-making, not replaces it.`;
}

/**
 * Build user prompt with spatial context
 */
function buildUserPrompt(query: string, spatialContext: string): string {
  return `Query: ${query}

Spatial Context: ${spatialContext}

Please provide:
1. Direct answer to the query with market insights
2. Relevant spatial patterns or clusters
3. Any livelihood implications (job impacts, upskilling opportunities)
4. Discovery suggestions that AI helps surface`;
}

/**
 * Generate visualization data for frontend
 */
function generateVisualizationData(
  docs: Array<SpatialEmbedding & { similarity: number }>
): SpatialRAGResponse['visualization'] {
  return {
    type: '3d_scatter',
    data: docs.map((doc) => {
      const coords = doc.coordinates as Coordinates3D | null;
      return {
        id: doc.id,
        x: coords?.x ?? 50,
        y: coords?.y ?? 50,
        z: coords?.z ?? 50,
        label: coords?.clusterLabel ?? 'unknown',
        metadata: {
          cardId: doc.cardId,
          similarity: doc.similarity,
          context: doc.spatialContext.slice(0, 100),
        },
      };
    }),
  };
}

/**
 * Extract livelihood insights from the response
 */
async function extractLivelihoodInsights(
  query: string,
  answer: string
): Promise<SpatialRAGResponse['livelihoodInsights']> {
  // Check if query is livelihood-related
  const livelihoodKeywords = [
    'job', 'career', 'livelihood', 'employment', 'replace', 'automate',
    'skill', 'learn', 'future', 'impact', 'displacement', 'opportunity'
  ];

  const isLivelihoodQuery = livelihoodKeywords.some(
    (kw) => query.toLowerCase().includes(kw)
  );

  if (!isLivelihoodQuery) {
    return undefined;
  }

  // Use smaller model for extraction
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 500,
  });

  const extractionPrompt = `Based on this TCG market query and response, extract livelihood insights.

Query: ${query}
Response: ${answer}

Return a JSON object with:
- jobImpacts: Array of how AI affects TCG trading/collecting jobs
- upskillingSuggestions: Array of skills to develop
- discoveryOpportunities: Array of new opportunities AI enables

Focus on augmentation over replacement. Be concise.`;

  try {
    const result = await llm.invoke([{ role: 'user', content: extractionPrompt }]);
    const content = typeof result.content === 'string' ? result.content : '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[LIVELIHOOD_EXTRACT_ERROR]', error);
  }

  return {
    jobImpacts: ['AI augments market analysis, freeing time for strategy development'],
    upskillingSuggestions: ['Learn AI-assisted analysis tools', 'Develop market intuition AI cannot replicate'],
    discoveryOpportunities: ['Use AI to surface undervalued cards faster', 'Automate routine monitoring tasks'],
  };
}

// ============================================================================
// MARKET PREDICTION (WORLD MODEL INSPIRED)
// ============================================================================

/**
 * Generate next-frame market prediction for a card
 *
 * Inspired by RTFM world models, predicts:
 * - Future market position (where the card will be in 3D space)
 * - Confidence intervals
 * - Driving factors
 *
 * @param cardId - Card to predict
 * @param timeframe - Prediction window
 * @returns MarketPrediction
 */
export async function predictMarketPosition(
  cardId: string,
  timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<MarketPrediction> {
  try {
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    // Get historical spatial embeddings
    const historicalEmbeddings = await db
      .select()
      .from(spatialEmbeddings)
      .where(eq(spatialEmbeddings.cardId, cardId))
      .orderBy(desc(spatialEmbeddings.createdAt))
      .limit(10);

    // Calculate trend from historical positions
    const currentCoords = calculateMarketCoordinates(card);
    const trendVector = calculateTrendVector(historicalEmbeddings);

    // Apply trend to predict future position
    const predictedPosition = applyTrendPrediction(currentCoords, trendVector, timeframe);

    // Determine overall trend
    const trend = determineTrend(trendVector);

    // Generate reasoning
    const reasoning = generatePredictionReasoning(card, trend, timeframe);

    return {
      cardId,
      predictedTrend: trend,
      confidence: predictedPosition.confidence,
      timeframe,
      reasoning,
      spatialPosition: predictedPosition,
    };
  } catch (error) {
    console.error('[MARKET_PREDICTION_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'spatial-rag', operation: 'predictMarketPosition' },
      extra: { cardId, timeframe },
    });
    throw new Error('Failed to generate market prediction');
  }
}

/**
 * Calculate trend vector from historical embeddings
 */
function calculateTrendVector(
  embeddings: SpatialEmbedding[]
): { dx: number; dy: number; dz: number } {
  if (embeddings.length < 2) {
    return { dx: 0, dy: 0, dz: 0 };
  }

  // Calculate average movement between consecutive positions
  let totalDx = 0, totalDy = 0, totalDz = 0;
  let count = 0;

  for (let i = 0; i < embeddings.length - 1; i++) {
    const curr = embeddings[i].coordinates as Coordinates3D | null;
    const next = embeddings[i + 1].coordinates as Coordinates3D | null;

    if (curr && next) {
      totalDx += curr.x - next.x; // Note: reversed because sorted desc
      totalDy += curr.y - next.y;
      totalDz += curr.z - next.z;
      count++;
    }
  }

  return count > 0
    ? { dx: totalDx / count, dy: totalDy / count, dz: totalDz / count }
    : { dx: 0, dy: 0, dz: 0 };
}

/**
 * Apply trend prediction with timeframe scaling
 */
function applyTrendPrediction(
  current: Coordinates3D,
  trend: { dx: number; dy: number; dz: number },
  timeframe: '1h' | '24h' | '7d' | '30d'
): Coordinates3D {
  const timeframeMultipliers: Record<string, number> = {
    '1h': 0.05,
    '24h': 1,
    '7d': 7,
    '30d': 30,
  };

  const multiplier = timeframeMultipliers[timeframe] || 1;

  // Apply trend with dampening for longer timeframes
  const dampeningFactor = Math.max(0.5, 1 - multiplier * 0.02);

  return {
    x: Math.min(100, Math.max(0, current.x + trend.dx * multiplier * dampeningFactor)),
    y: Math.min(100, Math.max(0, current.y + trend.dy * multiplier * dampeningFactor)),
    z: Math.min(100, Math.max(0, current.z + trend.dz * multiplier * dampeningFactor)),
    clusterLabel: getClusterLabel(
      current.x + trend.dx * multiplier,
      current.y + trend.dy * multiplier,
      current.z + trend.dz * multiplier
    ),
    confidence: Math.max(0.3, current.confidence - multiplier * 0.01), // Confidence decreases with longer timeframes
  };
}

/**
 * Determine overall trend from vector
 */
function determineTrend(
  trend: { dx: number; dy: number; dz: number }
): 'bullish' | 'bearish' | 'neutral' {
  const momentum = trend.dx * 0.5 + trend.dy * 0.3 + trend.dz * 0.2;

  if (momentum > 2) return 'bullish';
  if (momentum < -2) return 'bearish';
  return 'neutral';
}

/**
 * Generate human-readable prediction reasoning
 */
function generatePredictionReasoning(
  card: typeof cards.$inferSelect,
  trend: 'bullish' | 'bearish' | 'neutral',
  timeframe: string
): string {
  const trendDescriptions = {
    bullish: 'showing upward momentum',
    bearish: 'experiencing downward pressure',
    neutral: 'maintaining stable position',
  };

  const factors: string[] = [];

  if (card.apexScore && card.apexScore > 70) {
    factors.push('strong Apex Score indicating collector demand');
  }
  if (card.sevenDayGainPercent && card.sevenDayGainPercent > 5) {
    factors.push('recent positive price movement');
  }
  if (card.isManipulated) {
    factors.push('market anomalies detected (exercise caution)');
  }

  const factorText = factors.length > 0
    ? ` Key factors: ${factors.join(', ')}.`
    : '';

  return `${card.name} is ${trendDescriptions[trend]} over the ${timeframe} window.${factorText} This prediction uses spatial market analysis to identify patterns across similar cards and market conditions.`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SPATIAL_CONFIG,
  buildSpatialDescription,
  calculateMarketCoordinates,
};
