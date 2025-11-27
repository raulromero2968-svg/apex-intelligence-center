/**
 * GAM Multi-AI Orchestration Integration
 *
 * Provides unified GAM memory access for all AI agents:
 * - Claude (Anthropic)
 * - GPT (OpenAI)
 * - Gemini (Google)
 * - Apex (Internal orchestrator)
 * - Manual (Human in the loop)
 *
 * Architecture:
 * - Shared page-store for cross-AI memory persistence
 * - Per-agent filtering for specialized contexts
 * - Centralized orchestrator (Apex) for routing
 * - Memo caching for reduced latency
 *
 * Trade-offs:
 * - Unified memory enables cross-AI learning (good)
 * - Some overhead from GAM pipeline (mitigate with caching)
 * - Complex routing logic (Apex handles)
 *
 * @module orchestrator/gam-integration
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { sql } from 'drizzle-orm';

import { memorizer, researcher, getAgentPages } from '../gam/core';
import {
  OrchestrationRequestSchema,
  type OrchestrationRequest,
  type OrchestrationResult,
  type AIAgent,
  type MemorizerResult,
  type ResearcherResult,
} from '../gam/types';

// ============================================================================
// AI CLIENT INITIALIZATION
// ============================================================================

// Lazy initialization to avoid import-time errors
let claudeClient: ChatAnthropic | null = null;
let gptClient: ChatOpenAI | null = null;

function getClaudeClient(): ChatAnthropic {
  if (!claudeClient) {
    claudeClient = new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
    });
  }
  return claudeClient;
}

function getGPTClient(): ChatOpenAI {
  if (!gptClient) {
    gptClient = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3,
    });
  }
  return gptClient;
}

async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// ============================================================================
// MEMO CACHE
// ============================================================================

interface CachedMemo {
  memo: string;
  pageIds: string[];
  timestamp: number;
}

// In-memory cache for memos (would use Redis in production)
const memoCache = new Map<string, CachedMemo>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedMemo(key: string): CachedMemo | null {
  const cached = memoCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    memoCache.delete(key);
    return null;
  }

  return cached;
}

function setCachedMemo(key: string, memo: string, pageIds: string[]): void {
  memoCache.set(key, {
    memo,
    pageIds,
    timestamp: Date.now(),
  });

  // Cleanup old entries
  if (memoCache.size > 1000) {
    const oldestKey = memoCache.keys().next().value;
    if (oldestKey) memoCache.delete(oldestKey);
  }
}

// ============================================================================
// AI AGENT CALLERS
// ============================================================================

/**
 * Call Claude with GAM context
 */
async function callClaude(
  context: string,
  request: string
): Promise<{ response: string; tokenCount?: number }> {
  const systemPrompt = `You are Claude, an AI assistant for TCG market intelligence.
You have access to persistent memory context from previous interactions.

Memory Context:
${context}

Use this context to provide informed, accurate responses about TCG markets, prices, and trends.
Always cite specific information from the context when relevant.`;

  const response = await getClaudeClient().invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: request },
  ]);

  return {
    response: typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content),
    tokenCount: response.usage_metadata?.total_tokens,
  };
}

/**
 * Call GPT with GAM context
 */
async function callGPT(
  context: string,
  request: string
): Promise<{ response: string; tokenCount?: number }> {
  const systemPrompt = `You are a TCG market intelligence assistant powered by GPT-4.
You have access to persistent memory context from previous interactions.

Memory Context:
${context}

Use this context to provide informed, accurate responses about TCG markets, prices, and trends.
Always cite specific information from the context when relevant.`;

  const response = await getGPTClient().invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: request },
  ]);

  return {
    response: typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content),
    tokenCount: response.usage_metadata?.total_tokens,
  };
}

/**
 * Call Gemini with GAM context
 * Note: Requires @langchain/google-genai package
 */
async function callGemini(
  context: string,
  request: string
): Promise<{ response: string; tokenCount?: number }> {
  // Gemini integration would require additional setup
  // For now, fall back to GPT with a note
  console.log('[GAM_ORCHESTRATOR] Gemini not fully integrated, falling back to GPT');
  return callGPT(context, `[Gemini request] ${request}`);
}

/**
 * Apex internal orchestrator - routes to best available AI
 */
async function callApex(
  context: string,
  request: string
): Promise<{ response: string; tokenCount?: number }> {
  // Apex can intelligently route based on request type
  // For now, prefer Claude for market analysis, GPT for code/data

  const isCodeOrData = /code|function|api|data|json|sql/i.test(request);

  if (isCodeOrData) {
    return callGPT(context, request);
  }
  return callClaude(context, request);
}

/**
 * Manual mode - returns context for human review
 */
async function callManual(
  context: string,
  request: string
): Promise<{ response: string; tokenCount?: number }> {
  return {
    response: `[MANUAL REVIEW REQUIRED]

Request: ${request}

Available Context:
${context}

Please review the context and provide a response manually.`,
  };
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main GAM orchestration function.
 * Routes requests to specified AI with GAM context.
 *
 * Trade-offs:
 * - Unified memory across all AIs (good)
 * - Latency overhead from GAM pipeline (mitigate with caching)
 * - Complexity in routing logic (Apex handles)
 *
 * @param input - Orchestration request
 * @returns OrchestrationResult with AI response and metrics
 */
export async function gamOrchestrate(
  input: OrchestrationRequest
): Promise<OrchestrationResult> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = OrchestrationRequestSchema.parse(input);

    let memo = '';
    let pageIds: string[] = [];
    let researchSessionId: string | undefined;
    let cachedContext = false;

    if (validated.useGAM) {
      // Check cache first
      const cacheKey = `${validated.ai}:${validated.request.slice(0, 100)}`;
      const cached = validated.cacheResults ? getCachedMemo(cacheKey) : null;

      if (cached) {
        memo = cached.memo;
        pageIds = cached.pageIds;
        cachedContext = true;
        console.log('[GAM_ORCHESTRATOR] Using cached context');
      } else {
        // Run GAM pipeline
        // 1. Memorize current request as a session
        const memResult = await memorizer(
          {
            session: validated.request,
            history: validated.history,
            agentId: validated.ai,
          }
        );

        // 2. Research for relevant context
        const researchResult = await researcher({
          request: validated.request,
          memory: memResult.memo,
          agentFilter: validated.ai === 'apex' ? 'all' : validated.ai,
        });

        memo = researchResult.result;
        pageIds = researchResult.pageIds;
        researchSessionId = researchResult.sessionId;

        // Cache the result
        if (validated.cacheResults) {
          setCachedMemo(cacheKey, memo, pageIds);
        }
      }
    }

    // Call the specified AI with context
    let aiResponse: { response: string; tokenCount?: number };

    switch (validated.ai) {
      case 'claude':
        aiResponse = await callClaude(memo, validated.request);
        break;
      case 'gpt':
        aiResponse = await callGPT(memo, validated.request);
        break;
      case 'gemini':
        aiResponse = await callGemini(memo, validated.request);
        break;
      case 'apex':
        aiResponse = await callApex(memo, validated.request);
        break;
      case 'manual':
        aiResponse = await callManual(memo, validated.request);
        break;
      default:
        throw new Error(`Unknown AI agent: ${validated.ai}`);
    }

    const latencyMs = Date.now() - startTime;

    console.log(`[GAM_ORCHESTRATOR] ${validated.ai} responded in ${latencyMs}ms`);

    return {
      response: aiResponse.response,
      ai: validated.ai,
      gamContext: validated.useGAM ? {
        memo,
        pageIds,
        researchSessionId,
      } : undefined,
      metrics: {
        latencyMs,
        tokenCount: aiResponse.tokenCount,
        cachedContext,
      },
      success: true,
    };
  } catch (error) {
    console.error('[GAM_ORCHESTRATOR_ERROR]', error);
    return {
      response: '',
      ai: input.ai,
      metrics: {
        latencyMs: Date.now() - startTime,
        cachedContext: false,
      },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// BATCH ORCHESTRATION
// ============================================================================

/**
 * Process multiple requests across different AIs
 * Useful for comparing responses or consensus building
 */
export async function batchOrchestrate(
  requests: Array<{ ai: AIAgent; request: string; history?: string }>
): Promise<OrchestrationResult[]> {
  const results: OrchestrationResult[] = [];

  for (const req of requests) {
    const result = await gamOrchestrate({
      ai: req.ai,
      request: req.request,
      history: req.history || '',
      useGAM: true,
      cacheResults: true,
    });
    results.push(result);
  }

  return results;
}

/**
 * Query all AIs with the same request for consensus
 */
export async function consensusQuery(
  request: string,
  history: string = ''
): Promise<{
  responses: Record<AIAgent, string>;
  consensus?: string;
  agreement: number;
}> {
  const ais: AIAgent[] = ['claude', 'gpt', 'apex'];
  const responses: Record<string, string> = {};

  // Get responses from all AIs
  for (const ai of ais) {
    const result = await gamOrchestrate({
      ai,
      request,
      history,
      useGAM: true,
      cacheResults: true,
    });
    responses[ai] = result.success ? result.response : `[ERROR: ${result.error}]`;
  }

  // Simple consensus: check for agreement on key points
  // In production, would use more sophisticated NLP comparison
  const responseTexts = Object.values(responses).filter(r => !r.startsWith('[ERROR'));

  if (responseTexts.length < 2) {
    return {
      responses: responses as Record<AIAgent, string>,
      agreement: 0,
    };
  }

  // Very simple agreement metric based on common words
  const wordSets = responseTexts.map(
    r => new Set(r.toLowerCase().split(/\s+/).filter(w => w.length > 4))
  );

  let totalOverlap = 0;
  let totalSize = 0;

  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      const overlap = [...wordSets[i]].filter(w => wordSets[j].has(w)).length;
      totalOverlap += overlap * 2;
      totalSize += wordSets[i].size + wordSets[j].size;
    }
  }

  const agreement = totalSize > 0 ? totalOverlap / totalSize : 0;

  return {
    responses: responses as Record<AIAgent, string>,
    agreement,
  };
}

// ============================================================================
// DAILY MEMORY MAINTENANCE
// ============================================================================

/**
 * Daily task to memorize TCG sessions and maintain memory quality.
 * Should be run as a cron job.
 */
export async function dailyMemoryMaintenance(): Promise<{
  sessionsProcessed: number;
  pagesCreated: number;
  pagesExpired: number;
}> {
  const db = await getDb();

  // 1. Memorize recent session history that hasn't been processed
  const sessionsResult = await db.execute(sql`
    SELECT id, user_id, actions_performed, cards_viewed
    FROM session_history
    WHERE session_end IS NOT NULL
      AND session_end > NOW() - INTERVAL '24 hours'
    LIMIT 100
  `);

  let sessionsProcessed = 0;
  let pagesCreated = 0;

  for (const session of sessionsResult.rows as any[]) {
    try {
      const sessionSummary = `User session: viewed cards ${JSON.stringify(session.cards_viewed)}, actions: ${JSON.stringify(session.actions_performed)}`;

      await memorizer({
        session: sessionSummary,
        history: '',
        agentId: 'apex',
        context: {
          userId: session.user_id,
          sessionId: session.id,
        },
      });

      sessionsProcessed++;
      pagesCreated++;
    } catch (error) {
      console.error('[GAM_MAINTENANCE] Session processing error:', error);
    }
  }

  // 2. Expire old pages
  const expireResult = await db.execute(sql`
    DELETE FROM gam_pages
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING id
  `);
  const pagesExpired = expireResult.rows.length;

  // 3. Update reliability scores based on access patterns
  await db.execute(sql`
    UPDATE gam_pages
    SET reliability_score = LEAST(1.0, reliability_score + 0.05)
    WHERE access_count > 10
      AND reliability_score < 1.0
  `);

  console.log(`[GAM_MAINTENANCE] Processed ${sessionsProcessed} sessions, created ${pagesCreated} pages, expired ${pagesExpired} pages`);

  return {
    sessionsProcessed,
    pagesCreated,
    pagesExpired,
  };
}

// ============================================================================
// VISUALIZATION CONTEXT GENERATION
// ============================================================================

/**
 * Generate visualization context from GAM memory.
 * Used for YouTube viz scripts and dashboard graphs.
 */
export async function generateVizContext(
  vizType: 'market_graph' | 'price_trend' | 'memory_network' | 'agent_activity',
  params: Record<string, any> = {}
): Promise<{
  context: string;
  data: any;
  suggestions: string[];
}> {
  // Research relevant memory for the visualization type
  const researchRequest = `Find information relevant to creating a ${vizType} visualization. ${
    params.focus ? `Focus on: ${params.focus}` : ''
  }`;

  const researchResult = await researcher({
    request: researchRequest,
    memory: '',
    tools: ['vector', 'temporal'],
  });

  // Generate visualization suggestions based on context
  const gptClient = getGPTClient();
  const suggestionPrompt = `Based on this context about TCG market data:
${researchResult.result}

Suggest 3-5 specific data points or trends that would be interesting to visualize in a ${vizType}.
Output as a JSON array of strings.`;

  const suggestionResponse = await gptClient.invoke(suggestionPrompt);
  const suggestionsText = typeof suggestionResponse.content === 'string'
    ? suggestionResponse.content
    : JSON.stringify(suggestionResponse.content);

  let suggestions: string[] = [];
  try {
    const match = suggestionsText.match(/\[[\s\S]*\]/);
    if (match) {
      suggestions = JSON.parse(match[0]);
    }
  } catch {
    suggestions = ['Price trends', 'Market sentiment', 'Trading volume'];
  }

  return {
    context: researchResult.result,
    data: {
      pageIds: researchResult.pageIds,
      metrics: researchResult.metrics,
    },
    suggestions,
  };
}
