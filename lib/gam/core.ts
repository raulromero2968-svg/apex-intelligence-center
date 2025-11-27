/**
 * General Agentic Memory (GAM) Core Implementation
 *
 * Implements the core GAM agents:
 * - Memorizer: Compresses sessions into lightweight memos and stores full pages
 * - Researcher: Plans, searches, integrates, and reflects for context retrieval
 *
 * Architecture based on GAM paper:
 * - Offline: Memorizer creates memos + pages (page-store backed by pgvector)
 * - Online: Researcher iteratively retrieves until request is satisfied
 *
 * Trade-offs:
 * - Reduces info loss vs static memory (good)
 * - Higher online latency (mitigated by depth limit=3)
 * - RL overhead (mitigated by offline training)
 *
 * @module gam/core
 */

import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  SessionInputSchema,
  ResearchRequestSchema,
  GAM_PROMPTS,
  DEFAULT_GAM_CONFIG,
  type SessionInput,
  type ResearchRequest,
  type MemorizerResult,
  type ResearcherResult,
  type ResearchIteration,
  type ReflectionResult,
  type RetrievedPage,
  type SearchTool,
  type GAMConfig,
} from './types';

// ============================================================================
// LLM AND EMBEDDING INITIALIZATION
// ============================================================================

// Lazy initialization to avoid import-time errors
let llm: ChatOpenAI | null = null;
let embeddings: OpenAIEmbeddings | null = null;

function getLLM(config: GAMConfig = DEFAULT_GAM_CONFIG): ChatOpenAI {
  if (!llm) {
    llm = new ChatOpenAI({
      modelName: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }
  return llm;
}

function getEmbeddings(config: GAMConfig = DEFAULT_GAM_CONFIG): OpenAIEmbeddings {
  if (!embeddings) {
    embeddings = new OpenAIEmbeddings({
      modelName: config.embeddingModel,
    });
  }
  return embeddings;
}

// ============================================================================
// DATABASE HELPER (Lazy import to avoid circular deps)
// ============================================================================

async function getDb() {
  // Dynamic import to avoid circular dependency issues
  const { db } = await import('@/db');
  return db;
}

// ============================================================================
// MEMORIZER AGENT
// ============================================================================

/**
 * Memorizer: Compresses sessions into memos and stores full pages.
 *
 * Trade-offs:
 * - Lightweight memos enable fast retrieval
 * - Full pages preserve complete context for JIT compilation
 * - Some compression loss (mitigated by RL optimization)
 *
 * @param input - Session data to memorize
 * @param config - Optional GAM configuration
 * @returns MemorizerResult with memo, pageId, and success status
 */
export async function memorizer(
  input: SessionInput,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<MemorizerResult> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = SessionInputSchema.parse(input);

    // Generate memo using LLM
    const prompt = GAM_PROMPTS.memorizer
      .replace('{session}', validated.session)
      .replace('{history}', validated.history || 'No prior history');

    const memoResponse = await getLLM(config).invoke(prompt);
    const memo = typeof memoResponse.content === 'string'
      ? memoResponse.content
      : JSON.stringify(memoResponse.content);

    // Generate embedding for semantic search
    const emb = await getEmbeddings(config).embedQuery(memo);

    // Store page in database
    const db = await getDb();
    const pageData = {
      session: validated.session,
      history: validated.history,
      context: validated.context,
      entities: validated.entities,
      timestamp: new Date().toISOString(),
    };

    const result = await db.execute(sql`
      INSERT INTO gam_pages (memo, page, embedding, agent_id, reliability_score)
      VALUES (
        ${memo},
        ${JSON.stringify(pageData)}::jsonb,
        ${`[${emb.join(',')}]`}::vector,
        ${validated.agentId || null},
        ${0.5}
      )
      RETURNING id
    `);

    const pageId = (result.rows[0] as { id: string }).id;

    console.log(`[GAM_MEMORIZER] Created page ${pageId} in ${Date.now() - startTime}ms`);

    return {
      memo,
      pageId,
      embedding: emb,
      success: true,
    };
  } catch (error) {
    console.error('[GAM_MEMORIZER_ERROR]', error);
    return {
      memo: '',
      pageId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/**
 * Vector search using pgvector cosine similarity
 */
async function vectorSearch(
  query: string,
  topK: number,
  agentFilter?: string,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<RetrievedPage[]> {
  const db = await getDb();
  const queryEmb = await getEmbeddings(config).embedQuery(query);

  const agentClause = agentFilter && agentFilter !== 'all'
    ? sql`AND agent_id = ${agentFilter}`
    : sql``;

  const results = await db.execute(sql`
    SELECT
      id,
      memo,
      page,
      1 - (embedding <=> ${`[${queryEmb.join(',')}]`}::vector) as score
    FROM gam_pages
    WHERE embedding IS NOT NULL
      AND reliability_score >= ${config.minReliabilityScore}
      ${agentClause}
    ORDER BY embedding <=> ${`[${queryEmb.join(',')}]`}::vector
    LIMIT ${topK}
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    memo: row.memo,
    page: row.page,
    score: row.score,
    searchType: 'vector' as SearchTool,
  }));
}

/**
 * BM25-style keyword search using PostgreSQL ts_rank
 */
async function bm25Search(
  query: string,
  topK: number,
  agentFilter?: string,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<RetrievedPage[]> {
  const db = await getDb();

  const agentClause = agentFilter && agentFilter !== 'all'
    ? sql`AND agent_id = ${agentFilter}`
    : sql``;

  const results = await db.execute(sql`
    SELECT
      id,
      memo,
      page,
      ts_rank(to_tsvector('english', memo || ' ' || COALESCE(page->>'session', '')),
              plainto_tsquery('english', ${query})) as score
    FROM gam_pages
    WHERE to_tsvector('english', memo || ' ' || COALESCE(page->>'session', ''))
          @@ plainto_tsquery('english', ${query})
      AND reliability_score >= ${config.minReliabilityScore}
      ${agentClause}
    ORDER BY score DESC
    LIMIT ${topK}
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    memo: row.memo,
    page: row.page,
    score: row.score,
    searchType: 'bm25' as SearchTool,
  }));
}

/**
 * Temporal search - retrieve most recent pages
 */
async function temporalSearch(
  topK: number,
  agentFilter?: string,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<RetrievedPage[]> {
  const db = await getDb();

  const agentClause = agentFilter && agentFilter !== 'all'
    ? sql`AND agent_id = ${agentFilter}`
    : sql``;

  const results = await db.execute(sql`
    SELECT
      id,
      memo,
      page,
      1.0 as score
    FROM gam_pages
    WHERE reliability_score >= ${config.minReliabilityScore}
      ${agentClause}
    ORDER BY created_at DESC
    LIMIT ${topK}
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    memo: row.memo,
    page: row.page,
    score: row.score,
    searchType: 'temporal' as SearchTool,
  }));
}

/**
 * ID-based search - retrieve specific pages by ID
 */
async function idSearch(
  pageIds: string[],
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<RetrievedPage[]> {
  if (pageIds.length === 0) return [];

  const db = await getDb();
  const results = await db.execute(sql`
    SELECT id, memo, page, 1.0 as score
    FROM gam_pages
    WHERE id = ANY(${pageIds}::uuid[])
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    memo: row.memo,
    page: row.page,
    score: row.score,
    searchType: 'id' as SearchTool,
  }));
}

/**
 * Execute search with specified tool
 */
async function searchPages(
  tool: SearchTool,
  query: string,
  topK: number,
  agentFilter?: string,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<RetrievedPage[]> {
  switch (tool) {
    case 'vector':
      return vectorSearch(query, topK, agentFilter, config);
    case 'bm25':
      return bm25Search(query, topK, agentFilter, config);
    case 'temporal':
      return temporalSearch(topK, agentFilter, config);
    case 'id':
      // ID search requires page IDs, not a query string
      return [];
    default:
      return [];
  }
}

// ============================================================================
// RESEARCHER AGENT
// ============================================================================

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
function parseJSON<T>(response: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Researcher: Plans, searches, integrates, and reflects for context retrieval.
 *
 * Trade-offs:
 * - Iterative retrieval for high precision
 * - Higher latency (mitigated by depth limit)
 * - Self-reflection ensures completeness
 *
 * @param input - Research request with query and config
 * @param config - Optional GAM configuration
 * @returns ResearcherResult with integrated context and metrics
 */
export async function researcher(
  input: ResearchRequest,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<ResearcherResult> {
  const startTime = Date.now();
  const iterations: ResearchIteration[] = [];
  const allPageIds: Set<string> = new Set();

  try {
    // Validate input
    const validated = ResearchRequestSchema.parse(input);

    let integration = '';
    let currentRequest = validated.request;
    let depth = 0;

    // Create research session record
    const db = await getDb();
    const sessionResult = await db.execute(sql`
      INSERT INTO gam_research_sessions (request, initial_memory, status)
      VALUES (${validated.request}, ${validated.memory}, 'in_progress')
      RETURNING id
    `);
    const sessionId = (sessionResult.rows[0] as { id: string }).id;

    while (depth < validated.maxDepth) {
      // 1. PLAN: Generate search strategy
      const planPrompt = GAM_PROMPTS.researcher_plan
        .replace('{request}', currentRequest)
        .replace('{memory}', validated.memory || integration || 'No context yet')
        .replace('{tools}', validated.tools.join(', '));

      const planResponse = await getLLM(config).invoke(planPrompt);
      const planText = typeof planResponse.content === 'string'
        ? planResponse.content
        : JSON.stringify(planResponse.content);

      const plan = parseJSON<{ needed: string; tools: string[]; queries: string[] }>(planText);
      const toolsToUse = plan?.tools?.filter(t =>
        validated.tools.includes(t as SearchTool)
      ) as SearchTool[] || validated.tools;
      const queries = plan?.queries || [currentRequest];

      // 2. SEARCH: Execute searches with planned tools
      const retrievedPages: RetrievedPage[] = [];
      for (const tool of toolsToUse) {
        for (const query of queries) {
          const topK = tool === 'vector' ? config.vectorTopK : config.bm25TopK;
          const pages = await searchPages(
            tool,
            query,
            topK,
            validated.agentFilter,
            config
          );
          retrievedPages.push(...pages);
        }
      }

      // Deduplicate by page ID
      const uniquePages = retrievedPages.filter(p => !allPageIds.has(p.id));
      uniquePages.forEach(p => allPageIds.add(p.id));

      // 3. INTEGRATE: Combine retrieved pages into context
      const pagesText = uniquePages
        .map(p => `[Page ${p.id.slice(0, 8)}] ${p.memo}\nContent: ${JSON.stringify(p.page)}`)
        .join('\n\n');

      const integratePrompt = GAM_PROMPTS.researcher_integrate
        .replace('{request}', validated.request)
        .replace('{context}', integration || 'No prior context')
        .replace('{pages}', pagesText || 'No new pages found');

      const integrateResponse = await getLLM(config).invoke(integratePrompt);
      integration = typeof integrateResponse.content === 'string'
        ? integrateResponse.content
        : JSON.stringify(integrateResponse.content);

      // 4. REFLECT: Check if we have enough context
      const reflectPrompt = GAM_PROMPTS.researcher_reflect
        .replace('{request}', validated.request)
        .replace('{context}', integration);

      const reflectResponse = await getLLM(config).invoke(reflectPrompt);
      const reflectText = typeof reflectResponse.content === 'string'
        ? reflectResponse.content
        : JSON.stringify(reflectResponse.content);

      const reflection = parseJSON<ReflectionResult>(reflectText) || {
        isComplete: false,
        missing: 'Could not parse reflection',
        confidence: 0.5,
      };

      // Record iteration
      iterations.push({
        depth,
        plan: plan?.needed || 'Plan generation failed',
        tools: toolsToUse,
        retrievedPageIds: uniquePages.map(p => p.id),
        integration,
        reflection,
      });

      // Check completion
      if (reflection.isComplete || reflection.confidence >= config.reflectionThreshold) {
        break;
      }

      // Refine query for next iteration
      currentRequest = reflection.missing || currentRequest;
      depth++;
    }

    const latencyMs = Date.now() - startTime;

    // Update research session
    await db.execute(sql`
      UPDATE gam_research_sessions
      SET
        iterations = ${JSON.stringify(iterations)}::jsonb,
        result = ${integration},
        metrics = ${JSON.stringify({
          totalDepth: depth + 1,
          pagesRetrieved: allPageIds.size,
          latencyMs,
        })}::jsonb,
        status = 'completed',
        completed_at = NOW()
      WHERE id = ${sessionId}
    `);

    console.log(`[GAM_RESEARCHER] Completed in ${latencyMs}ms, depth=${depth + 1}, pages=${allPageIds.size}`);

    return {
      result: integration,
      iterations,
      pageIds: Array.from(allPageIds),
      success: true,
      metrics: {
        totalDepth: depth + 1,
        pagesRetrieved: allPageIds.size,
        latencyMs,
      },
      sessionId,
    };
  } catch (error) {
    console.error('[GAM_RESEARCHER_ERROR]', error);
    return {
      result: '',
      iterations,
      pageIds: Array.from(allPageIds),
      success: false,
      metrics: {
        totalDepth: iterations.length,
        pagesRetrieved: allPageIds.size,
        latencyMs: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick memorize and research in one call
 */
export async function memorizeAndResearch(
  session: string,
  query: string,
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<{
  memorized: MemorizerResult;
  researched: ResearcherResult;
}> {
  // First memorize the session
  const memorized = await memorizer({ session, history: '' }, config);

  // Then research with the new context
  const researched = await researcher(
    { request: query, memory: memorized.memo },
    config
  );

  return { memorized, researched };
}

/**
 * Batch memorize multiple sessions
 */
export async function batchMemorize(
  sessions: SessionInput[],
  config: GAMConfig = DEFAULT_GAM_CONFIG
): Promise<MemorizerResult[]> {
  const results: MemorizerResult[] = [];

  for (const session of sessions) {
    const result = await memorizer(session, config);
    results.push(result);
  }

  return results;
}

/**
 * Update reliability score for a page based on usage/feedback
 */
export async function updatePageReliability(
  pageId: string,
  newScore: number
): Promise<boolean> {
  try {
    const db = await getDb();
    await db.execute(sql`
      UPDATE gam_pages
      SET reliability_score = ${Math.max(0, Math.min(1, newScore))},
          access_count = access_count + 1,
          updated_at = NOW()
      WHERE id = ${pageId}
    `);
    return true;
  } catch (error) {
    console.error('[GAM_UPDATE_RELIABILITY_ERROR]', error);
    return false;
  }
}

/**
 * Get all pages for a specific agent
 */
export async function getAgentPages(
  agentId: string,
  limit: number = 100
): Promise<RetrievedPage[]> {
  const db = await getDb();
  const results = await db.execute(sql`
    SELECT id, memo, page, reliability_score as score
    FROM gam_pages
    WHERE agent_id = ${agentId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    memo: row.memo,
    page: row.page,
    score: row.score,
    searchType: 'id' as SearchTool,
  }));
}
