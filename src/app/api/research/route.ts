/**
 * Research Panel Streaming API
 *
 * RAG-Fusion → 5 diverse queries → parallel hybrid search → Cohere rerank v3 → gpt-4o streaming
 * Rate limit: 20/min per IP (Upstash sliding window) → prevents abuse
 * Sources rendered as clickable chips with relevance % (rounded)
 */

import { NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { CohereClient } from 'cohere-ai';
import { generateMultipleQueries } from '@/rag/query-generator';
import { hybridSearch } from '@/rag/search';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

// RAG-Fusion → 5 diverse queries → parallel hybrid search → Cohere rerank v3 → gpt-4o streaming
const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.2,
  streaming: true,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Rate limit: 20/min per IP (Upstash sliding window) → prevents abuse
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: true,
});

const PROMPT = `You are Apex Intelligence Senior Analyst. Provide investment-grade analysis only.

Context:
{context}

Question: {question}

Answer in concise, bullet-point format with exact price references and probability assessments. End with a confidence score (High/Medium/Low).`;

const template = ChatPromptTemplate.fromMessages([
  ['system', PROMPT],
]);

// Simple hash function for deduplication
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    { name: 'api.research', op: 'http.server' },
    async (span) => {
      try {
        // Extract IP for rate limiting
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'anonymous';

        span?.setAttribute('ip', ip);

        // Rate limiting
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return new Response('Rate limited. Please wait before making another request.', {
            status: 429,
          });
        }

        // Parse request
        const body = await request.json();
        const { query, sessionId } = body;

        if (!query || typeof query !== 'string') {
          return new Response('Bad Request: query is required', { status: 400 });
        }

        if (query.length > 500) {
          return new Response('Bad Request: query too long (max 500 chars)', {
            status: 400,
          });
        }

        span?.setAttribute('query', query.slice(0, 100));
        span?.setAttribute('sessionId', sessionId);

        // Return streaming response
        return new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();

              try {
                // Step 1: RAG-Fusion – generate 5 diverse queries including original
                const queries = await generateMultipleQueries(query);

                span?.setAttribute('generatedQueryCount', queries.length);

                // Step 2: Parallel hybrid search for all queries
                const allDocs = await Promise.all(
                  queries.map((q) =>
                    hybridSearch({
                      query: q,
                      limit: 15,
                    })
                  )
                );

                // Flatten and dedupe by content hash
                const uniqueDocs = Array.from(
                  new Map(
                    allDocs.flat().map((doc) => [hashCode(doc.content), doc])
                  ).values()
                );

                span?.setAttribute('uniqueDocCount', uniqueDocs.length);

                // Step 3: Cohere rerank v3 multilingual → topN: 8 for higher recall on investment queries
                const reranked = await cohere.rerank({
                  query,
                  documents: uniqueDocs.map((d) => d.content),
                  topN: 8, // Higher recall for investment queries
                  model: 'rerank-multilingual-v3.0',
                  returnDocuments: false, // Saves bandwidth
                });

                span?.setAttribute('rerankedCount', reranked.results.length);

                // Map reranked results back to original docs
                const topDocs = reranked.results.map((r) => ({
                  doc: uniqueDocs[r.index],
                  relevanceScore: r.relevanceScore,
                }));

                // Format context for LLM
                const context = topDocs
                  .map((item, i) => `[${i + 1}] ${item.doc.content}`)
                  .join('\n\n');

                // Step 4: Streaming response with source mapping
                let fullResponse = '';

                const stream = await llm.stream(
                  await template.invoke({
                    context,
                    question: query,
                  })
                );

                for await (const chunk of stream) {
                  const content = chunk.content as string;
                  fullResponse += content;
                  controller.enqueue(encoder.encode(content));
                }

                // Sources rendered as clickable chips with relevance % (rounded)
                const sources = topDocs.map((item, i) => ({
                  index: i + 1,
                  title: item.doc.metadata?.title ||
                         item.doc.metadata?.card_name ||
                         'TCG Market Data',
                  url: item.doc.metadata?.source_url || '#',
                  relevance: Math.round(item.relevanceScore * 100) / 100,
                  sourceType: item.doc.source_type,
                }));

                // Final message: source citations
                controller.enqueue(
                  encoder.encode(`\n\n__SOURCES__\n${JSON.stringify(sources)}`)
                );

                span?.setAttribute('responseLength', fullResponse.length);
                span?.setAttribute('sourceCount', sources.length);
              } catch (error: any) {
                Sentry.captureException(error);
                console.error('Research API error:', error);
                controller.enqueue(
                  encoder.encode(`\n\nError: ${error.message || 'Failed to process query'}`)
                );
              } finally {
                controller.close();
              }
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no', // Critical for Vercel Edge streaming
            },
          }
        );
      } catch (error) {
        Sentry.captureException(error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  );
}

export const runtime = 'nodejs'; // Use Node.js runtime for streaming
export const dynamic = 'force-dynamic';
