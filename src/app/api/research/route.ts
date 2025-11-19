/**
 * Research API Endpoint with SSE Streaming (Feature-Flagged)
 *
 * - If FEATURE_RESEARCH_STREAMING != "1" → returns JSON stub
 * - Else (and keys present): SSE stream via ReadableStream
 *   - RAG-Fusion (5 queries), hybrid search
 *   - Cohere rerank topN=8, returnDocuments:false
 *   - Stream LLM tokens; append final line with "__SOURCES__" + JSON
 * - Upstash Ratelimit sliding window 20/min/IP
 * - Lazy AI client initialization (no module scope)
 * - Works with zero secrets in CI
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ragFusionSearch } from '@/rag/fusion';
import { rerankResults } from '@/rag/reranker';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

interface Success {
  ok: true;
  answer: string;
  sources: never[];
  requestId: string;
}

interface Fail {
  ok: false;
  error: string;
  requestId: string;
}

type ResearchResponse = Success | Fail;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy getters for AI clients (no module-scope initialization)
function getLLM() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.0,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 4096,
    streaming: true,
  });
}

// Lazy getter for rate limiter
let ratelimitInstance: Ratelimit | null = null;
let redisInstance: Redis | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;
  
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      ratelimitInstance = new Ratelimit({
        redis: redisInstance as any,
        limiter: Ratelimit.slidingWindow(20, '60 s'),
        analytics: true,
      });
      return ratelimitInstance;
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error);
      return null;
    }
  }
  
  return null;
}

// RAG prompt template (same as chain.ts)
const TCG_RAG_SYSTEM_PROMPT = `You are Apex Intelligence – the world's most trusted AI TCG analyst.
You have access to real-time eBay sales, PSA pop deltas, JustTCG prices, and 6 months of community sentiment.

CRITICAL RULES:
- Every factual claim MUST end with [source:n]
- If synthesizing, write [SYNTHESIS] and explain logic + cite ALL sources
- Always reference current top debates: reprint dilution, CGC Black Label premium (3.2×), pop growth red flags
- Use metrics investors trust: Pop Ratio, 90-day velocity, grade multiples
- NEVER hallucinate prices or pop numbers
- If a claim cannot be supported, say "Based on available data, I cannot confirm..."

CITATION FORMAT:
- Single source: "Charizard PSA 10 sold for $15,000 [source:1]"
- Synthesis: "[SYNTHESIS] Pop delta >15% in 90d typically precedes 20-30% price drops [source:2][source:5][source:7]"
- No data: "The provided sources do not contain information about..."

ANALYSIS STYLE:
- Concise and data-driven
- Compare prices, populations, grade premiums
- Reference community debates (CGC Black Label premium = 3.2× PSA 10 current market)
- Explain ROI step-by-step with sources

BASE YOUR ENTIRE RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

const tcgRagPrompt = ChatPromptTemplate.fromMessages([
  ['system', TCG_RAG_SYSTEM_PROMPT],
  ['human', '{question}'],
]);

export async function POST(req: NextRequest) {
  const rid = crypto.randomUUID().slice(0, 8);
  
  // Handle missing or invalid body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    // JSON parse error (empty body, invalid JSON, etc.)
    return NextResponse.json(
      { ok: false, error: 'Bad Request: invalid or missing body', requestId: rid },
      { status: 400 }
    );
  }

  // Validate query exists and is a non-empty string
  const { query } = body || {};
  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Bad Request: missing query', requestId: rid },
      { status: 400 }
    );
  }

  // Feature flag check: if not enabled, return JSON stub
  if (process.env.FEATURE_RESEARCH_STREAMING !== '1') {
    const response: Success = {
      ok: true,
      answer: `Research queued for: ${query}`,
      sources: [],
      requestId: rid,
    };
    return NextResponse.json(response);
  }

  // Streaming mode: check if we have required keys
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasCohereKey = !!process.env.COHERE_API_KEY;
  
  // If no keys, return stub (works in CI)
  if (!hasAnthropicKey && !hasCohereKey) {
    const response: Success = {
      ok: true,
      answer: `Research queued for: ${query} (streaming requires API keys)`,
      sources: [],
      requestId: rid,
    };
    return NextResponse.json(response);
  }

  // Get IP for rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'anonymous';

  // Rate limiting
  const ratelimit = getRateLimiter();
  if (ratelimit) {
    try {
      const { success, remaining } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { ok: false, error: 'Rate limited. Please wait before making more requests.', requestId: rid },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': '0',
              'Retry-After': '60',
            },
          }
        );
      }
    } catch (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      // Continue without rate limiting on error
    }
  }

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullAnswer = '';
      let sources: any[] = [];

      return Sentry.startSpan(
        { name: 'api.research.streaming', op: 'http.server' },
        async (span: Span) => {
          span?.setAttribute('requestId', rid);
          span?.setAttribute('query', query.slice(0, 100));
          span?.setAttribute('ip', ip);

          try {
            // Step 1: RAG-Fusion (5 queries), hybrid search
            const fusionResults = await ragFusionSearch(query, {
              numQueries: 5,
              preRerankLimit: 20,
              finalLimit: 30,
            });

            span?.setAttribute('fusionResultCount', fusionResults.length);

            // Step 2: Cohere rerank topN=8, returnDocuments:false
            const reranked = await rerankResults(query, fusionResults, 8);

            span?.setAttribute('rerankResultCount', reranked.length);

            // Step 3: Format context with source markers
            const context = reranked
              .map(
                (doc, i) =>
                  `[source:${i + 1}] ${doc.content}\n<!-- provenance: ${JSON.stringify(doc.metadata)} -->`
              )
              .join('\n\n');

            span?.setAttribute('contextLength', context.length);

            // Step 4: Stream LLM tokens
            const llm = getLLM();
            if (!llm) {
              throw new Error('Anthropic API key not configured');
            }

            const outputParser = new StringOutputParser();
            const ragChain = tcgRagPrompt.pipe(llm).pipe(outputParser);

            const streamIterator = await ragChain.stream({
              context,
              question: query,
            });

            // Stream tokens to client
            for await (const chunk of streamIterator) {
              fullAnswer += chunk;
              controller.enqueue(encoder.encode(chunk));
            }

            // Step 5: Append final line with "__SOURCES__" + JSON
            sources = reranked.map((doc, i) => ({
              index: i + 1,
              title: doc.metadata.title || doc.metadata.card_name || 'Market Data',
              url: doc.metadata.source_url || '#',
              relevance: Math.round((doc.rerankScore || 0) * 100),
              sourceType: doc.source_type,
              metadata: doc.metadata,
            }));

            controller.enqueue(
              encoder.encode(`\n\n__SOURCES__\n${JSON.stringify(sources)}`)
            );

            span?.setAttribute('answerLength', fullAnswer.length);
            span?.setAttribute('sourceCount', sources.length);

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Sentry.captureException(error, {
              extra: { requestId: rid, query },
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
        }
      );
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'X-Request-Id': rid,
    },
  });
}
