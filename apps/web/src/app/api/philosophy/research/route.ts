/**
 * Philosophy Research API Endpoint with Optimized RAG Pipeline
 *
 * Features:
 * - Redis caching for query results (1 hour TTL for frequent queries)
 * - Tiered rate limiting (free: 5/min, pro: 20/min) via token bucket
 * - Adaptive retrieval with query routing (navigational vs analytical)
 * - Self-reflective RAG for context sufficiency checks
 * - Structured logging and metrics for monitoring
 *
 * From knowledge-02-ai-rag-architecture-v2.md (Advanced RAG Architecture)
 * From knowledge-10-api-realtime.md (Redis caching patterns)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Redis } from '@upstash/redis';
import {
  ragFusionSearch,
  rerankResults,
  hybridSearch,
} from '@/rag';
import {
  routeQuery,
  adaptiveRetrievalRAG,
  selfReflectiveRAG,
  getRetrievalConfig,
} from '@/lib/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema (from knowledge-10)
const researchSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters').max(500, 'Query must not exceed 500 characters'),
});

// Lazy Redis initialization (prevents build-time failures)
let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redisInstance;
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error);
      return null;
    }
  }

  return null;
}

// Rate limiting: Token bucket (from knowledge-10)
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

async function checkRateLimit(
  userId: string,
  tier: 'free' | 'pro' = 'free'
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) {
    // No Redis, allow all requests (dev mode)
    return { allowed: true, remaining: 999 };
  }

  const key = `rate:philosophy:${userId}`;
  const maxTokens = tier === 'free' ? 5 : 20;
  const refillInterval = 60 * 1000; // 1 minute in ms

  try {
    const bucket = await redis.get<RateLimitBucket>(key);
    const now = Date.now();

    if (!bucket) {
      // New bucket
      await redis.set(key, { tokens: maxTokens - 1, lastRefill: now }, { ex: 120 });
      return { allowed: true, remaining: maxTokens - 1 };
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / refillInterval) * maxTokens;
    const newTokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);

    if (newTokens <= 0) {
      return { allowed: false, remaining: 0 };
    }

    // Update bucket
    await redis.set(
      key,
      { tokens: newTokens - 1, lastRefill: tokensToAdd > 0 ? now : bucket.lastRefill },
      { ex: 120 }
    );

    return { allowed: true, remaining: newTokens - 1 };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open on error
    return { allowed: true, remaining: 999 };
  }
}

// Lazy LLM initialization (prevents build-time failures)
function getLLM() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new ChatOpenAI({
    temperature: 0.3,
    modelName: 'gpt-4o-mini',
    maxTokens: 2048,
  });
}

// Philosophy-specific RAG prompt template
const PHILOSOPHY_RAG_PROMPT = `You are an AI ethics researcher at Apex Intelligence, specializing in sentient rights and animal welfare.
You have access to research on AI ethics, animal cognition, sentient rights frameworks, and philosophical perspectives.

CRITICAL RULES:
- Every factual claim MUST end with [source:n]
- If synthesizing across sources, write [SYNTHESIS] and cite ALL relevant sources
- Focus on ethical frameworks, sentient welfare, and AI-animal intersection
- Reference key organizations: Earth Species Project, Sentient Futures, Animal Charity Evaluators
- NEVER hallucinate research findings or statistics
- If information is not available, state "Based on available sources, I cannot confirm..."

CITATION FORMAT:
- Single source: "Research shows sentient AI may require welfare protections [source:1]"
- Synthesis: "[SYNTHESIS] Multiple frameworks suggest AI systems should consider animal welfare [source:2][source:4]"

ANALYSIS STYLE:
- Balanced and evidence-based
- Consider multiple ethical perspectives
- Highlight practical implications
- Connect to real-world applications

BASE YOUR ENTIRE RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

const philosophyPrompt = PromptTemplate.fromTemplate(
  PHILOSOPHY_RAG_PROMPT + '\n\nQuery: {query}'
);

// Structured logging
function logMetric(data: {
  event: string;
  query?: string;
  latency?: number;
  documentsRetrieved?: number;
  cached?: boolean;
  queryType?: string;
  error?: string;
  userId?: string;
}) {
  const logEntry = {
    ...data,
    timestamp: new Date().toISOString(),
    service: 'philosophy-research',
  };
  console.log(JSON.stringify(logEntry));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract userId from auth headers (from knowledge-05-security-oauth2-jwt)
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userTier = (request.headers.get('x-user-tier') as 'free' | 'pro') || 'free';

    // Rate limit check
    const { allowed, remaining } = await checkRateLimit(userId, userTier);
    if (!allowed) {
      logMetric({
        event: 'rag_rate_limited',
        userId,
        latency: Date.now() - startTime,
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in 60 seconds.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = researchSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { query } = parseResult.data;

    // Cache check (from knowledge-10)
    const redis = getRedis();
    const cacheKey = `rag:philosophy:${query.toLowerCase().trim()}`;

    if (redis) {
      try {
        const cached = await redis.get<{
          insights: string;
          sources: { id: number; snippet: string }[];
        }>(cacheKey);

        if (cached) {
          const latency = Date.now() - startTime;
          logMetric({
            event: 'rag_cache_hit',
            query: query.slice(0, 100),
            latency,
            cached: true,
            userId,
          });
          return NextResponse.json(cached, {
            headers: {
              'X-Cache': 'HIT',
              'X-RateLimit-Remaining': String(remaining),
            },
          });
        }
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError);
      }
    }

    // Check if we have required API keys
    const llm = getLLM();
    if (!llm) {
      logMetric({
        event: 'rag_api_keys_missing',
        query: query.slice(0, 100),
        latency: Date.now() - startTime,
        userId,
      });
      return NextResponse.json(
        {
          insights: `Research queued for: "${query}" (AI processing requires API keys)`,
          sources: [],
        },
        {
          headers: {
            'X-Cache': 'MISS',
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }

    // Adaptive Routing (from knowledge-02)
    const queryType = await routeQuery(query);
    const retrievalConfig = getRetrievalConfig(queryType);

    logMetric({
      event: 'rag_query_routed',
      query: query.slice(0, 100),
      queryType,
      userId,
    });

    // Execute retrieval based on query type
    let documents;
    if (queryType === 'navigational') {
      // Simple hybrid search for navigational queries
      documents = await hybridSearch({
        query,
        limit: retrievalConfig.finalLimit,
        minScore: retrievalConfig.minScore,
      });
    } else {
      // RAG-Fusion for factual and analytical queries
      documents = await ragFusionSearch(query, {
        numQueries: retrievalConfig.numQueries,
        preRerankLimit: retrievalConfig.preRerankLimit,
        finalLimit: retrievalConfig.finalLimit,
      });
    }

    // Self-Reflective Check (from knowledge-02)
    const isSufficient = await selfReflectiveRAG(query, documents);

    if (!isSufficient && documents.length < 5) {
      logMetric({
        event: 'rag_context_expansion',
        query: query.slice(0, 100),
        documentsRetrieved: documents.length,
        userId,
      });
      // Expand retrieval for insufficient context
      documents = await adaptiveRetrievalRAG(query);
    }

    // Rerank documents
    const rerankedDocs = await rerankResults(query, documents, 8, null);

    // Format context for LLM
    const context = rerankedDocs
      .map(
        (doc, i) =>
          `[source:${i + 1}] ${doc.content}\n<!-- provenance: ${JSON.stringify(doc.metadata)} -->`
      )
      .join('\n\n');

    // Generate Response
    const chain = philosophyPrompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({ context, query });

    const result = {
      insights: response,
      sources: rerankedDocs.map((doc, idx) => ({
        id: idx + 1,
        snippet: doc.content.slice(0, 200),
        score: Math.round((doc.rerankScore || doc.score || 0) * 100) / 100,
      })),
    };

    // Cache result (1 hour TTL)
    if (redis) {
      try {
        await redis.set(cacheKey, result, { ex: 3600 });
      } catch (cacheError) {
        console.warn('Cache write failed:', cacheError);
      }
    }

    const latency = Date.now() - startTime;
    logMetric({
      event: 'rag_query_success',
      query: query.slice(0, 100),
      latency,
      documentsRetrieved: documents.length,
      queryType,
      cached: false,
      userId,
    });

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Remaining': String(remaining),
        'X-Query-Type': queryType,
        'X-Latency-Ms': String(latency),
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logMetric({
      event: 'rag_query_error',
      latency,
      error: errorMessage,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
