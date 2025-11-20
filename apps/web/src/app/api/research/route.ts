/**
 * Research API Endpoint with SSE Streaming (Feature-Flagged)
 *
 * - If FEATURE_RESEARCH_STREAMING != "1" → returns JSON stub
 * - Else (and keys present): SSE stream via ReadableStream
 *   - RAG-Fusion (5-6 queries), hybrid search
 *   - Cohere rerank topN=8, returnDocuments:false
 *   - Deduplicate sources by URL + title+domain; cap to 6 unique citations
 *   - Map sentences to sources during streaming (greedy matching with [n] citations)
 *   - Stream LLM tokens; append final line with "__SOURCES__" + JSON (index, title, url, score 0..1)
 * - Upstash Ratelimit sliding window 20/min/IP
 * - Lazy AI client initialization (no module scope)
 * - Works with zero secrets in CI
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  ragFusionSearch,
  rerankResults,
  deduplicateSources,
  formatSourcesForOutput,
  CitationMapper,
} from '@/rag';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';
import { createHash } from 'crypto';

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

// Helper: hash IP with salt for privacy-aware logging
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16); // First 16 chars for brevity
}

// Helper: structured logging
function logStructured(data: {
  level: 'info' | 'error' | 'warn';
  rid: string;
  message?: string;
  latencyMs?: number;
  tokenCount?: number;
  sourceCount?: number;
  cached?: boolean;
  mode?: string;
  ipHash?: string;
  error?: string;
}) {
  const logEntry = {
    ...data,
    ts: new Date().toISOString(),
  };
  console.info(JSON.stringify(logEntry));
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  // Get IP for rate limiting and hashing
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'anonymous';
  const ipHash = hashIP(ip);

  return Sentry.startSpan(
    { name: 'research:post', op: 'http.server' },
    async (rootSpan: Span) => {
      rootSpan?.setAttribute('requestId', rid);
      rootSpan?.setAttribute('ipHash', ipHash);

      // Handle missing or invalid body
      let body;
      try {
        body = await req.json();
      } catch (error) {
        logStructured({
          level: 'warn',
          rid,
          ipHash,
          message: 'Invalid JSON body',
        });
        return NextResponse.json(
          { ok: false, error: 'Bad Request: invalid or missing body', requestId: rid },
          { status: 400 }
        );
      }

      // Validate query exists and is a non-empty string
      const { query } = body || {};
      if (typeof query !== 'string' || !query.trim()) {
        logStructured({
          level: 'warn',
          rid,
          ipHash,
          message: 'Missing query parameter',
        });
        return NextResponse.json(
          { ok: false, error: 'Bad Request: missing query', requestId: rid },
          { status: 400 }
        );
      }

      // Log RAG API call for debugging
      console.log('RAG API called with query:', query);

      // Feature flag check: if not enabled, return JSON stub
      if (process.env.FEATURE_RESEARCH_STREAMING !== '1') {
        rootSpan?.setAttribute('mode', 'json');
        logStructured({
          level: 'info',
          rid,
          ipHash,
          mode: 'json',
          message: 'Feature flag disabled, returning stub',
          latencyMs: Date.now() - startTime,
          cached: true,
        });
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
        rootSpan?.setAttribute('mode', 'json');
        logStructured({
          level: 'info',
          rid,
          ipHash,
          mode: 'json',
          message: 'API keys missing, returning stub',
          latencyMs: Date.now() - startTime,
          cached: true,
        });
        const response: Success = {
          ok: true,
          answer: `Research queued for: ${query} (streaming requires API keys)`,
          sources: [],
          requestId: rid,
        };
        return NextResponse.json(response);
      }

      // Set mode to SSE since we're streaming
      rootSpan?.setAttribute('mode', 'sse');

      // Rate limiting
      const ratelimit = getRateLimiter();
      if (ratelimit) {
        try {
          const { success, remaining } = await ratelimit.limit(ip);
          if (!success) {
            logStructured({
              level: 'warn',
              rid,
              ipHash,
              mode: 'sse',
              message: 'Rate limit exceeded',
              latencyMs: Date.now() - startTime,
            });
            return NextResponse.json(
              { ok: false, error: 'Rate limited. Try again in 60s', requestId: rid },
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
          logStructured({
            level: 'error',
            rid,
            ipHash,
            message: 'Rate limit check failed',
            error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error',
          });
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
              span?.setAttribute('ipHash', ipHash);

              try {
                // Step 1: RAG-Fusion (5-6 queries), hybrid search
                const fusionResults = await ragFusionSearch(query, {
                  numQueries: 6, // 5-6 queries as specified
                  preRerankLimit: 20,
                  finalLimit: 30,
                });

                span?.setAttribute('fusionResultCount', fusionResults.length);

                // Step 2: Cohere rerank topN=8, returnDocuments:false
                const reranked = await rerankResults(query, fusionResults, 8);

                span?.setAttribute('rerankResultCount', reranked.length);

                // Step 3: Deduplicate sources (URL + title+domain) and cap to 6
                const dedupedSources = deduplicateSources(reranked, 6);

                span?.setAttribute('dedupedSourceCount', dedupedSources.length);

                // Step 4: Format context with source markers
                const context = dedupedSources
                  .map(
                    (doc, i) =>
                      `[source:${i + 1}] ${doc.content}\n<!-- provenance: ${JSON.stringify(doc.metadata)} -->`
                  )
                  .join('\n\n');

                span?.setAttribute('contextLength', context.length);

                // Step 5: Initialize citation mapper for sentence-level attribution
                const citationMapper = new CitationMapper(dedupedSources);

                // Step 6: Stream LLM tokens with citation mapping
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

                // Stream tokens to client with citation mapping
                for await (const chunk of streamIterator) {
                  fullAnswer += chunk;

                  // Process chunk through citation mapper
                  const processedChunk = citationMapper.processChunk(chunk);
                  if (processedChunk) {
                    controller.enqueue(encoder.encode(processedChunk));
                  }
                }

                // Flush any remaining buffered content
                const finalChunk = citationMapper.flush();
                if (finalChunk) {
                  fullAnswer += finalChunk;
                  controller.enqueue(encoder.encode(finalChunk));
                }

                // Step 7: Append final line with "__SOURCES__" + JSON
                sources = formatSourcesForOutput(dedupedSources);

                controller.enqueue(
                  encoder.encode(`\n\n__SOURCES__\n${JSON.stringify(sources)}`)
                );

                span?.setAttribute('answerLength', fullAnswer.length);
                span?.setAttribute('sourceCount', sources.length);

                // Log successful completion
                logStructured({
                  level: 'info',
                  rid,
                  ipHash,
                  mode: 'sse',
                  message: 'Research completed successfully',
                  latencyMs: Date.now() - startTime,
                  tokenCount: fullAnswer.length,
                  sourceCount: sources.length,
                  cached: false,
                });

              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                Sentry.captureException(error, {
                  extra: { requestId: rid, query },
                });

                logStructured({
                  level: 'error',
                  rid,
                  ipHash,
                  mode: 'sse',
                  message: 'Research failed',
                  latencyMs: Date.now() - startTime,
                  error: errorMessage,
                });

                controller.enqueue(
                  encoder.encode(
                    `\n\n__ERROR__\nAn error occurred while processing your request: ${errorMessage}`
                  )
                );
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
  );
}
