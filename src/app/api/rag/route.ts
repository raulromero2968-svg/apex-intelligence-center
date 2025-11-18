/**
 * Streaming RAG API Endpoint
 *
 * Production-ready streaming endpoint with:
 * - RAG-Fusion → 5 diverse queries → parallel hybrid search
 * - Cohere rerank-multilingual-v3.0 (topN:8, returnDocuments:false)
 * - GPT-4o streaming via Server-Sent Events (SSE)
 * - Upstash Redis rate limiting (20/min sliding window)
 * - Sentry tracing for observability
 * - WebSocket channel prep for live price updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ragFusionSearch } from '@/rag/fusion';
import { rerankResults } from '@/rag/reranker';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

type SpanLike = {
  setAttribute: (key: string, value: unknown) => void;
  end?: () => void;
  setStatus?: (status: string) => void;
} | undefined;

// Initialize streaming LLM (GPT-4o)
const llm = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0.2,
  streaming: true,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize Upstash Redis rate limiter
let ratelimit: Ratelimit | null = null;
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis: redis as any,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      analytics: true,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Upstash Redis:', error);
}

// RAG prompt template
const PROMPT = `You are Apex Intelligence Senior TCG Investment Analyst.

Context (from real-time market data):
{context}

Question: {question}

Provide concise bullet-point analysis with:
- Exact prices and trends
- Probability assessments
- Confidence score (High/Medium/Low)
- Cite sources with [source:n] markers

Be direct, data-driven, and investor-focused.`;

const template = PromptTemplate.fromTemplate(PROMPT);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/rag
 *
 * Streaming RAG query endpoint with SSE response
 */
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.rag.streaming', op: 'http.server' },
    async (span: SpanLike) => {
      const requestId = crypto.randomUUID();
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'anonymous';

      span?.setAttribute('requestId', requestId);
      span?.setAttribute('ip', ip);

      // Rate limiting
      if (ratelimit) {
        try {
          const { success, remaining } = await ratelimit.limit(ip);
          if (!success) {
            span?.setAttribute('rateLimited', true);
            return NextResponse.json(
              { error: 'Rate limited. Please wait before making more requests.' },
              {
                status: 429,
                headers: {
                  'X-RateLimit-Remaining': '0',
                  'Retry-After': '60',
                },
              }
            );
          }
          span?.setAttribute('rateLimitRemaining', remaining);
        } catch (rateLimitError) {
          console.error('Rate limit check failed:', rateLimitError);
          // Continue without rate limiting on error
        }
      }

      try {
        const body = await request.json();
        const { query, sessionId = requestId } = body;

        if (typeof query !== 'string' || !query.trim()) {
          return NextResponse.json(
            { error: 'Missing or invalid query parameter' },
            { status: 400 }
          );
        }

        if (query.length > 500) {
          return NextResponse.json(
            { error: 'Query too long. Maximum 500 characters.' },
            { status: 400 }
          );
        }

        span?.setAttribute('query', query.slice(0, 100));
        span?.setAttribute('sessionId', sessionId);

        // Check if OpenAI key is configured
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json(
            {
              error: 'OpenAI API key not configured. Please contact support.',
              fallback: 'The RAG system requires OpenAI API access to function.',
            },
            { status: 503 }
          );
        }

        // Create streaming response
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            let fullAnswer = '';
            let sources: any[] = [];

            try {
              // Step 1: RAG-Fusion - generate diverse queries and search
              const fusionResults = await ragFusionSearch(query, {
                numQueries: 5, // 5 diverse query angles
                preRerankLimit: 15, // 15 docs per query
                finalLimit: 30, // Top 30 after fusion
              });

              span?.setAttribute('fusionResultCount', fusionResults.length);

              // Step 2: Rerank with Cohere (optimized settings)
              const reranked = await rerankResults(query, fusionResults, 8);

              span?.setAttribute('rerankResultCount', reranked.length);

              // Step 3: Format context with source markers
              const context = reranked
                .map((doc, i) => `[${i + 1}] ${doc.content}`)
                .join('\n\n');

              span?.setAttribute('contextLength', context.length);

              // Step 4: Stream LLM response
              const parser = new StringOutputParser();
              const chain = template.pipe(llm).pipe(parser);

              const streamIterator = await chain.stream({
                context,
                question: query,
              });

              // Stream tokens to client
              for await (const chunk of streamIterator) {
                fullAnswer += chunk;
                controller.enqueue(encoder.encode(chunk));
              }

              // Step 5: Send sources metadata after answer
              sources = reranked.map((doc, i) => ({
                index: i + 1,
                title: doc.metadata.title || doc.metadata.card_name || 'Market Data',
                url: doc.metadata.source_url || '#',
                relevance: Math.round((doc.rerankScore || 0) * 100),
                sourceType: doc.source_type,
              }));

              controller.enqueue(
                encoder.encode(`\n\n__SOURCES__\n${JSON.stringify(sources)}`)
              );

              // Step 6: Prepare WebSocket price watch (fire-and-forget)
              if (redis) {
                try {
                  const mentionedCards = extractCardNames(fullAnswer);
                  if (mentionedCards.length > 0) {
                    await (redis as any).sadd(`rag:prices:${sessionId}`, ...mentionedCards);
                    // Set expiry to 1 hour
                    await (redis as any).expire(`rag:prices:${sessionId}`, 3600);
                  }
                } catch (wsError) {
                  console.error('WebSocket price watch setup failed:', wsError);
                  // Non-fatal, continue
                }
              }

              span?.setAttribute('answerLength', fullAnswer.length);
              span?.setAttribute('sourceCount', sources.length);

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Sentry.captureException(error, {
                extra: { requestId, query, sessionId },
              });

              controller.enqueue(
                encoder.encode(
                  `\n\n__ERROR__\nAn error occurred while processing your request: ${errorMessage}`
                )
              );
              span?.setStatus?.('internal_error');
            } finally {
              controller.close();
              span?.end?.();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
            'X-Request-Id': requestId,
          },
        });

      } catch (error) {
        Sentry.captureException(error, {
          extra: { ip },
        });
        span?.setStatus?.('internal_error');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          {
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * Extract card names from LLM response for WebSocket price monitoring
 *
 * Simple heuristic: Look for capitalized words that might be card names
 * This can be enhanced with NER or a card database lookup
 */
function extractCardNames(text: string): string[] {
  // Match common TCG card names (capitalized words, potentially with numbers)
  const cardPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+\d+)?)\b/g;
  const matches = text.match(cardPattern) || [];

  // Filter out common false positives
  const stopWords = new Set([
    'PSA', 'BGS', 'CGC', 'TCG', 'eBay', 'Based', 'The', 'This', 'That',
    'Grade', 'Population', 'Report', 'Market', 'Price', 'Source',
  ]);

  const cardNames = matches
    .filter((name) => !stopWords.has(name))
    .filter((name) => name.length > 2) // At least 3 chars
    .slice(0, 10); // Max 10 cards to monitor

  // Deduplicate
  return Array.from(new Set(cardNames));
}

/**
 * GET /api/rag?query=...
 *
 * Non-streaming fallback endpoint for simple queries
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: query' },
      { status: 400 }
    );
  }

  // For GET requests, return a simple JSON response directing to POST
  return NextResponse.json({
    message: 'Please use POST method for RAG queries to enable streaming responses',
    query,
    endpoint: '/api/rag',
    method: 'POST',
    body: {
      query: query,
      sessionId: 'optional-session-id',
    },
  });
}
