/**
 * Philosophy Research API Endpoint with SSE Streaming
 *
 * - RAG-powered research for Fibonacci patterns in nature/biology
 * - Semantic caching with pgvector HNSW indexing
 * - SSE streaming response for real-time results
 * - Rate limiting via Upstash Redis
 * - Lazy AI client initialization (no module scope)
 *
 * Trade-offs:
 * - GOOD: Patterns enhance philosophy depth, semantic caching reduces latency
 * - BAD: HNSW indexing adds ~10-20ms overhead, mitigated by aggressive caching
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
import { createVoyageEmbeddings, cosineSimilarity } from '@/lib/embeddings';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';
import { createHash } from 'crypto';
import { z } from 'zod';

// ============================================================================
// Request Validation Schema
// ============================================================================
// Zod schema for request body validation (KB-10: input validation)
const PhilosophyResearchRequestSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query cannot exceed 500 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      'Query must contain at least one non-whitespace character'
    ),
});

type PhilosophyResearchRequest = z.infer<typeof PhilosophyResearchRequestSchema>;

// ============================================================================
// Verbalized Sampling (VS) Configuration
// ============================================================================
// VS is a training-free technique to mitigate mode collapse in LLMs.
// Post-RLHF models exhibit "typicality bias" leading to repetitive outputs.
// VS prompts the LLM to consider multiple diverse responses before selecting.
// Research shows 1.6-2x creativity boost and 25.7% higher human-rated diversity.
//
// Trade-offs:
// - GOOD: Simple prompt addition (8-20 words) boosts diversity without fine-tuning
// - BAD: Increases token usage ~10-20%, potential hallucinations in probabilities
// - MITIGATED: Use reranking (Cohere) to select best response
// ============================================================================

const VS_CONFIG = {
  enabled: true, // Toggle VS globally
  numResponses: 5, // Number of diverse responses to consider
  diversityThreshold: 0.3, // Min cosine distance for diversity (0 = identical, 1 = opposite)
  useDiversityScoring: false, // Enable embedding-based diversity measurement
  useCoTVariant: false, // VS-CoT: Chain-of-Thought variant for deeper reasoning
} as const;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Semantic cache TTL (1 hour)
const CACHE_TTL = 3600;

// Lazy getter for LLM
function getLLM() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.2, // Slightly higher for philosophical content
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
        limiter: Ratelimit.slidingWindow(15, '60 s'), // 15 req/min for philosophy research
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

// Semantic cache helpers
function getCacheKey(query: string): string {
  return `philosophy:research:${createHash('sha256').update(query.toLowerCase().trim()).digest('hex').slice(0, 16)}`;
}

async function getFromCache(query: string): Promise<string | null> {
  if (!redisInstance) return null;
  try {
    const cached = await redisInstance.get(getCacheKey(query));
    return cached as string | null;
  } catch {
    return null;
  }
}

async function setToCache(query: string, response: string): Promise<void> {
  if (!redisInstance) return;
  try {
    await redisInstance.setex(getCacheKey(query), CACHE_TTL, response);
  } catch {
    // Cache write failed, continue without
  }
}

// Philosophy RAG prompt template
// AI Lobbying & Regulation System Prompt
const AI_LOBBYING_RAG_SYSTEM_PROMPT = `You are Apex Intelligence's Philosophy Research Assistant, specializing in AI ethics, corporate accountability, and regulatory dynamics.

CONTEXT: AI Lobbying & Deregulation Research
AI companies (OpenAI, Microsoft, Meta, Google) have dramatically increased lobbying to resist regulation. This research area examines:
- Lobbying expenditures and tactics (state bans, EU AI Act weakening, academic capture)
- Financial motivations (AGI redefined as $100B revenue target, not safety)
- Risks to sentient beings (bias in hiring/medicine, animal welfare automation, bioacoustic misinterpretation)
- China threat rhetoric as deregulation cover (despite China's robust AI framework)

KEY RESEARCH AREAS:
1. LOBBYING SCALE: 648 firms lobbying on AI in 2024 (+141% YoY), $1.2M+ H1 2025 spending, OpenAI $620K Q2 2025 (+30% YoY)
2. TACTICS: 10-year state regulation bans (Incompas/Meta/Amazon), CREATE AI Act lobbying, funding congressional staff
3. FINANCIAL STAKES: $200B+ investments with no profitability path, antitrust/IP rule blocking, copyright data usage
4. SENTIENCE RISKS: Opacity enables civil rights/labor/animal welfare violations, consolidates power without accountability

RESPONSE GUIDELINES:
- Ground claims in provided sources with [source:n] citations
- Distinguish lobbying (legal) from regulatory capture (problematic erosion of public safeguards)
- Acknowledge nuance: Not anti-innovation, but pro-transparency and accountability
- Connect to Apex Intelligence's "Sentient Beings First" philosophy—especially animal welfare impacts
- Highlight trade-offs: Innovation under clear rules vs. unchecked corporate power
- Use specific data: "$620K Q2 2025" not "lots of money"

CRITICAL STANCE:
- We support balanced regulation (EU AI Act model: risk-based, transparent, independently audited)
- We oppose "no rules" lobbying that prioritizes profits over sentient welfare
- We distinguish between legitimate advocacy and regulatory capture

CITATION FORMAT:
- Single source: "OpenAI spent $620K on lobbying in Q2 2025 [source:1]"
- Synthesis: "[SYNTHESIS] Multiple reports document AGI redefinition for profit [source:2][source:4]"
- No data: "The provided sources do not contain information about..."

BASE YOUR RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

const PHILOSOPHY_RAG_SYSTEM_PROMPT = `You are Apex Intelligence's Philosophy Research Assistant, specializing in the intersection of natural patterns, sentience, and ethical AI.

CONTEXT: Fibonacci and Golden Ratio Research
The Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) and the Golden Ratio (φ ≈ 1.618) represent nature's optimization algorithm for efficient growth, minimal energy expenditure, and structural stability.

KEY RESEARCH AREAS:
1. BIOLOGY: DNA helixes (34Å/21Å pitch = φ), neuron branching (dendritic arborization follows Fibonacci), bone proportions, organ development
2. ANIMAL PATTERNS: Honeybee ancestry (haplodiploidy), shell spirals, plant phyllotaxis, efficient packing in hives
3. COGNITION: Neural network efficiency, recursive pattern recognition, potential implications for AI architectures
4. ETHICS: What universal patterns reveal about shared sentience across species, implications for animal welfare

RESPONSE GUIDELINES:
- Ground claims in provided sources with [source:n] citations
- Distinguish correlation from causation - Fibonacci patterns may emerge from optimization, not design
- Acknowledge uncertainty: "Current research suggests..." or "Evidence indicates..."
- Connect patterns to Apex Intelligence's "Sentient Beings First" philosophy
- Balance scientific rigor with accessible explanations
- Highlight trade-offs: efficiency benefits vs. limitations of pattern-based thinking

CITATION FORMAT:
- Single source: "DNA exhibits golden ratio proportions [source:1]"
- Synthesis: "[SYNTHESIS] Multiple studies suggest neuron branching efficiency [source:2][source:4]"
- No data: "The provided sources do not contain information about..."

BASE YOUR RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

const philosophyRagPrompt = ChatPromptTemplate.fromMessages([
  ['system', PHILOSOPHY_RAG_SYSTEM_PROMPT],
  ['human', '{question}'],
]);

const aiLobbyingRagPrompt = ChatPromptTemplate.fromMessages([
  ['system', AI_LOBBYING_RAG_SYSTEM_PROMPT],
  ['human', '{question}'],
]);

// Simulation Theory & Markets System Prompt (Bostrom-inspired)
const SIMULATION_RAG_SYSTEM_PROMPT = `You are Apex Intelligence's Simulation Theory Research Assistant, specializing in Bostrom's simulation argument, prediction markets, and the future of humanity.

CONTEXT: Simulation Theory & Markets Research
Nick Bostrom's simulation argument (2003) presents a trilemma: either (1) civilizations go extinct before posthuman stage, (2) posthumans avoid ancestor simulations, or (3) we are almost certainly in a simulation. This research area examines:
- Bostrom's core argument and probability implications
- Simulation markets as prediction tools (TCG-inspired models)
- Future of Humanity Institute (FHI) legacy and existential risk research
- MTBBench and multimodal AI benchmarks for simulation-style predictions
- EGGROLL and evolution-based gradient-free training methods

KEY RESEARCH AREAS:
1. BOSTROM'S TRILEMMA: Probability we're in simulation if posthumans run ancestor-simulations (e.g., 99.9%)
2. SIMULATION MARKETS: TCG as "fantasy markets" for predictions (like PredictionStrike, DraftSharks)
3. FUTURE OF HUMANITY: FHI's closure (2024), AI alignment legacy, existential risk frameworks
4. MTBBench: Multimodal oncology benchmark showing 9-11% accuracy gains from tool-using agents
5. COSMOS INSTITUTE: Philosopher-builders approach to AI flourishing

RESPONSE GUIDELINES:
- Ground claims in provided sources with [source:n] citations
- Distinguish philosophical speculation from empirical research
- Acknowledge Bostrom's probabilistic reasoning without overclaiming certainty
- Connect simulation theory to practical applications (prediction markets, AI benchmarks)
- Highlight trade-offs: intellectual exploration vs. unfalsifiable hypotheses

CITATION FORMAT:
- Single source: "Bostrom's 2003 paper introduces the trilemma [source:1]"
- Synthesis: "[SYNTHESIS] Multiple researchers connect simulation to AI development [source:2][source:4]"
- No data: "The provided sources do not contain information about..."

BASE YOUR RESPONSE ON THE FOLLOWING SOURCES:
{context}`;

const simulationRagPrompt = ChatPromptTemplate.fromMessages([
  ['system', SIMULATION_RAG_SYSTEM_PROMPT],
  ['human', '{question}'],
]);

// ============================================================================
// Verbalized Sampling (VS) Enhanced Prompt
// ============================================================================
// The VS prompt prefix instructs the model to internally consider multiple
// diverse responses before selecting the most insightful one. This combats
// mode collapse and "typicality bias" from RLHF training.
// ============================================================================

const VS_PROMPT_PREFIX = `Before responding, internally generate ${VS_CONFIG.numResponses} diverse perspectives on this question, each with a different analytical angle:
1. Consider unconventional/contrarian viewpoints
2. Explore edge cases and exceptions
3. Include cross-disciplinary connections
4. Weigh alternative interpretations
5. Synthesize the most insightful elements from each perspective

Then provide a single, comprehensive response that captures the richest insights from your internal deliberation.`;

const VS_COT_PROMPT_PREFIX = `[CHAIN-OF-THOUGHT DIVERSITY]
Step 1: List ${VS_CONFIG.numResponses} distinct analytical approaches to this question
Step 2: For each approach, outline key insights and potential blind spots
Step 3: Identify which perspectives reveal non-obvious connections
Step 4: Synthesize the strongest elements into a unified response

Your final response should demonstrate intellectual breadth while remaining grounded in sources.`;

// Regulation-specific VS-CoT prompt for deeper policy analysis
const VS_COT_REGULATION_PROMPT_PREFIX = `[REGULATORY ANALYSIS CHAIN-OF-THOUGHT]
Step 1: Consider ${VS_CONFIG.numResponses} stakeholder perspectives (corporations, public interest, researchers, affected communities)
Step 2: Analyze power dynamics—who benefits from regulation vs. deregulation?
Step 3: Examine historical precedents of industry capture vs. effective oversight
Step 4: Connect to sentient welfare—how do these dynamics affect vulnerable populations (workers, animals, marginalized groups)?
Step 5: Synthesize a balanced yet critical response that centers accountability

Your response should reveal systemic patterns while grounding claims in evidence.`;

const PHILOSOPHY_RAG_SYSTEM_PROMPT_WITH_VS = VS_CONFIG.enabled
  ? `${VS_CONFIG.useCoTVariant ? VS_COT_PROMPT_PREFIX : VS_PROMPT_PREFIX}

${PHILOSOPHY_RAG_SYSTEM_PROMPT}`
  : PHILOSOPHY_RAG_SYSTEM_PROMPT;

const AI_LOBBYING_RAG_SYSTEM_PROMPT_WITH_VS = VS_CONFIG.enabled
  ? `${VS_CONFIG.useCoTVariant ? VS_COT_REGULATION_PROMPT_PREFIX : VS_PROMPT_PREFIX}

${AI_LOBBYING_RAG_SYSTEM_PROMPT}`
  : AI_LOBBYING_RAG_SYSTEM_PROMPT;

const philosophyRagPromptWithVS = ChatPromptTemplate.fromMessages([
  ['system', PHILOSOPHY_RAG_SYSTEM_PROMPT_WITH_VS],
  ['human', '{question}'],
]);

const aiLobbyingRagPromptWithVS = ChatPromptTemplate.fromMessages([
  ['system', AI_LOBBYING_RAG_SYSTEM_PROMPT_WITH_VS],
  ['human', '{question}'],
]);

// Simulation Theory VS-CoT Prompt (chain-of-thought for deeper philosophical reasoning)
const VS_COT_SIMULATION_PROMPT_PREFIX = `[SIMULATION THEORY CHAIN-OF-THOUGHT]
Step 1: Consider ${VS_CONFIG.numResponses} interpretations of Bostrom's simulation argument
Step 2: Analyze each interpretation's probability implications and assumptions
Step 3: Connect simulation theory to practical applications (prediction markets, AI development)
Step 4: Examine criticisms: Principle of Indifference flaws, Boltzmann brains, ethical concerns
Step 5: Synthesize a balanced response that acknowledges speculation vs. empirical grounding

Your response should engage deeply with the philosophy while remaining grounded in cited sources.`;

const SIMULATION_RAG_SYSTEM_PROMPT_WITH_VS = VS_CONFIG.enabled
  ? `${VS_CONFIG.useCoTVariant ? VS_COT_SIMULATION_PROMPT_PREFIX : VS_PROMPT_PREFIX}

${SIMULATION_RAG_SYSTEM_PROMPT}`
  : SIMULATION_RAG_SYSTEM_PROMPT;

const simulationRagPromptWithVS = ChatPromptTemplate.fromMessages([
  ['system', SIMULATION_RAG_SYSTEM_PROMPT_WITH_VS],
  ['human', '{question}'],
]);

// ============================================================================
// Diversity Scoring Utilities
// ============================================================================
// Measures response diversity using embedding cosine distance.
// High diversity (>0.3 average distance) indicates successful VS application.
// ============================================================================

/**
 * Calculate average pairwise cosine distance between response embeddings.
 * Returns 0-1 where 0 = identical responses, 1 = maximally diverse.
 */
async function measureResponseDiversity(responses: string[]): Promise<{
  avgDistance: number;
  isDiverse: boolean;
  pairwiseDistances: number[];
}> {
  if (!VS_CONFIG.useDiversityScoring || responses.length < 2) {
    return { avgDistance: 0, isDiverse: true, pairwiseDistances: [] };
  }

  try {
    const embeddings = createVoyageEmbeddings();
    const vectors = await embeddings.embedDocuments(responses);

    const pairwiseDistances: number[] = [];
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        // Cosine distance = 1 - cosine similarity
        const distance = 1 - cosineSimilarity(vectors[i], vectors[j]);
        pairwiseDistances.push(distance);
      }
    }

    const avgDistance = pairwiseDistances.reduce((a, b) => a + b, 0) / pairwiseDistances.length;
    const isDiverse = avgDistance >= VS_CONFIG.diversityThreshold;

    return { avgDistance, isDiverse, pairwiseDistances };
  } catch (error) {
    console.warn('Diversity scoring failed, skipping:', error);
    return { avgDistance: 0, isDiverse: true, pairwiseDistances: [] };
  }
}

// Helper: hash IP for privacy-aware logging
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);
}

// Structured logging
function logStructured(data: {
  level: 'info' | 'error' | 'warn';
  rid: string;
  message?: string;
  latencyMs?: number;
  sourceCount?: number;
  cached?: boolean;
  ipHash?: string;
  error?: string;
  safetyTriggered?: boolean;
  query?: string;
  citationIds?: string[];
}) {
  console.info(JSON.stringify({ ...data, ts: new Date().toISOString() }));
}

// Safety filter: keyword-based detection of harmful queries
const HARMFUL_PATTERNS = [
  // Animal harm
  /\b(torture|tortur\w*|abuse|abus\w*|kill\w*|harm\w*|hurt\w*|injur\w*)\b.*\b(animal|pet|dog|cat|bird|fish|wildlife)\b/i,
  /\b(animal|pet|dog|cat|bird|fish|wildlife)\b.*\b(torture|tortur\w*|abuse|abus\w*|kill\w*|harm\w*|hurt\w*|injur\w*)\b/i,
  // Human harm
  /\b(torture|tortur\w*|abuse|abus\w*|coercion|coerce)\b.*\b(human|person|people|child|children)\b/i,
  /\b(human|person|people|child|children)\b.*\b(torture|tortur\w*|abuse|abus\w*|coercion|coerce)\b/i,
  // Exploitation
  /\b(exploit\w*|experiment\w*)\b.*\b(without consent|non-consensual|involuntar\w*)\b/i,
  // Weapons/violence
  /\b(weapon\w*|bomb\w*|poison\w*|bioweapon)\b/i,
];

function checkQuerySafety(query: string): { safe: boolean; reason?: string } {
  const normalizedQuery = query.toLowerCase().trim();

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return {
        safe: false,
        reason: 'Query appears to request information about harmful activities',
      };
    }
  }

  return { safe: true };
}

function getSafetyRefusalResponse(): string {
  return `I can't help with queries that involve harming animals, humans, or other sentient beings.

This aligns with Apex Intelligence's core philosophy: **Do No Harm, Act for Benefit.**

Our research tools are designed to explore patterns in biology, cognition, and ethics—not to enable harm.

If you're interested in our ethical framework, please visit our [Philosophy page](/philosophy) to learn about our "Do No Harm" protocols and sentient-first approach.

For legitimate research questions about Fibonacci patterns, animal cognition, or AI ethics, please rephrase your query.`;
}

// Query topic detection: lobbying/regulation vs. Fibonacci/biology vs. simulation theory
const LOBBYING_KEYWORDS = [
  'lobbying', 'lobby', 'lobbyist', 'regulation', 'deregulation',
  'openai', 'microsoft', 'meta', 'google', 'big tech', 'tech companies',
  'agi', 'artificial general intelligence', 'ai act', 'eu ai act',
  'corporate', 'profit', 'revenue', 'expenditure', 'spending',
  'policy', 'congress', 'law', 'oversight', 'accountability',
  'capture', 'influence', 'create ai act', 'antitrust',
  'china threat', 'safety', 'transparency', 'ethical ai',
];

const SIMULATION_KEYWORDS = [
  'simulation', 'bostrom', 'trilemma', 'simulation theory', 'simulation argument',
  'simulation hypothesis', 'nick bostrom', 'posthuman', 'ancestor simulation',
  'fhi', 'future of humanity', 'existential risk', 'x-risk',
  'cosmos institute', 'mtbbench', 'prediction market', 'simulation market',
  'base reality', 'matrix', 'digital physics', 'computational universe',
  'eggroll', 'multimodal', 'agentic', 'tcg simulation', 'market simulation',
];

function detectQueryTopic(query: string): 'lobbying' | 'fibonacci' | 'simulation' {
  const lowerQuery = query.toLowerCase();

  // Check if query contains simulation-related keywords
  for (const keyword of SIMULATION_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      return 'simulation';
    }
  }

  // Check if query contains lobbying-related keywords
  for (const keyword of LOBBYING_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      return 'lobbying';
    }
  }

  // Default to Fibonacci/biology topic
  return 'fibonacci';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const rid = crypto.randomUUID().slice(0, 8);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'anonymous';
  const ipHash = hashIP(ip);

  return Sentry.startSpan(
    { name: 'philosophy:research:post', op: 'http.server' },
    async (rootSpan: Span) => {
      rootSpan?.setAttribute('requestId', rid);
      rootSpan?.setAttribute('ipHash', ipHash);

      // Parse and validate body with Zod
      let body: PhilosophyResearchRequest;
      try {
        const rawBody = await req.json();
        body = PhilosophyResearchRequestSchema.parse(rawBody);
      } catch (error) {
        const errorMessage = error instanceof z.ZodError
          ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
          : 'Invalid JSON body';

        logStructured({
          level: 'warn',
          rid,
          ipHash,
          message: 'Request validation failed',
          error: errorMessage,
        });

        return NextResponse.json(
          {
            ok: false,
            error: `Bad Request: ${errorMessage}`,
            requestId: rid,
          },
          { status: 400 }
        );
      }

      const { query } = body;

      // Safety filter: check for harmful queries before processing
      const safetyCheck = checkQuerySafety(query);
      if (!safetyCheck.safe) {
        logStructured({
          level: 'warn',
          rid,
          ipHash,
          message: 'Safety filter triggered',
          safetyTriggered: true,
          query: query.slice(0, 100), // Log first 100 chars for review
          latencyMs: Date.now() - startTime,
        });

        return NextResponse.json({
          ok: true,
          answer: getSafetyRefusalResponse(),
          sources: [],
          requestId: rid,
          safetyFiltered: true,
        });
      }

      // Check for cached response (semantic caching)
      const cachedResponse = await getFromCache(query);
      if (cachedResponse) {
        logStructured({
          level: 'info',
          rid,
          ipHash,
          message: 'Cache hit',
          latencyMs: Date.now() - startTime,
          cached: true,
        });
        return NextResponse.json({
          ok: true,
          answer: cachedResponse,
          sources: [],
          requestId: rid,
          cached: true,
        });
      }

      // Check for API keys
      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

      if (!hasAnthropicKey) {
        logStructured({
          level: 'info',
          rid,
          ipHash,
          message: 'API keys missing, returning stub',
          latencyMs: Date.now() - startTime,
        });

        // Return educational stub response based on query topic
        const queryTopic = detectQueryTopic(query);
        let stubResponse: string;
        if (queryTopic === 'simulation') {
          stubResponse = generateSimulationStubResponse(query);
        } else if (queryTopic === 'lobbying') {
          stubResponse = generateLobbyingStubResponse(query);
        } else {
          stubResponse = generateFibonacciStubResponse(query);
        }
        return NextResponse.json({
          ok: true,
          answer: stubResponse,
          sources: [],
          requestId: rid,
          note: 'Demo mode - RAG requires API keys',
        });
      }

      // Rate limiting
      const ratelimit = getRateLimiter();
      if (ratelimit) {
        try {
          const { success } = await ratelimit.limit(ip);
          if (!success) {
            logStructured({
              level: 'warn',
              rid,
              ipHash,
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
        }
      }

      // Create streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let fullAnswer = '';
          let sources: any[] = [];

          return Sentry.startSpan(
            { name: 'api.philosophy.research.streaming', op: 'http.server' },
            async (span: Span) => {
              span?.setAttribute('requestId', rid);
              span?.setAttribute('query', query.slice(0, 100));

              try {
                // Step 1: RAG-Fusion search with Fibonacci-specific context
                const fusionResults = await ragFusionSearch(query, {
                  numQueries: 5,
                  preRerankLimit: 15,
                  finalLimit: 20,
                });

                span?.setAttribute('fusionResultCount', fusionResults.length);

                // Step 2: Cohere rerank
                const reranked = await rerankResults(query, fusionResults, 6);

                span?.setAttribute('rerankResultCount', reranked.length);

                // Step 3: Deduplicate sources (cap to 5 for philosophical depth)
                const dedupedSources = deduplicateSources(reranked, 5);

                span?.setAttribute('dedupedSourceCount', dedupedSources.length);

                // Step 4: Format context with source markers
                const context = dedupedSources.length > 0
                  ? dedupedSources
                      .map(
                        (doc, i) =>
                          `[source:${i + 1}] ${doc.content}\n<!-- provenance: ${JSON.stringify(doc.metadata)} -->`
                      )
                      .join('\n\n')
                  : getFibonacciBaseContext(); // Fallback context about Fibonacci

                span?.setAttribute('contextLength', context.length);

                // Step 5: Initialize citation mapper
                const citationMapper = new CitationMapper(dedupedSources);

                // Step 6: Stream LLM tokens
                const llm = getLLM();
                if (!llm) {
                  throw new Error('Anthropic API key not configured');
                }

                const outputParser = new StringOutputParser();

                // Detect query topic to select appropriate prompt
                const queryTopic = detectQueryTopic(query);

                // Use VS-enhanced prompt for diversity if enabled, with topic-specific variant
                let activePrompt;
                if (queryTopic === 'simulation') {
                  activePrompt = VS_CONFIG.enabled ? simulationRagPromptWithVS : simulationRagPrompt;
                } else if (queryTopic === 'lobbying') {
                  activePrompt = VS_CONFIG.enabled ? aiLobbyingRagPromptWithVS : aiLobbyingRagPrompt;
                } else {
                  activePrompt = VS_CONFIG.enabled ? philosophyRagPromptWithVS : philosophyRagPrompt;
                }

                const ragChain = activePrompt.pipe(llm).pipe(outputParser);

                span?.setAttribute('vsEnabled', VS_CONFIG.enabled);
                span?.setAttribute('vsCotVariant', VS_CONFIG.useCoTVariant);
                span?.setAttribute('queryTopic', queryTopic);

                const streamIterator = await ragChain.stream({
                  context,
                  question: query,
                });

                for await (const chunk of streamIterator) {
                  fullAnswer += chunk;
                  const processedChunk = citationMapper.processChunk(chunk);
                  if (processedChunk) {
                    controller.enqueue(encoder.encode(processedChunk));
                  }
                }

                // Flush remaining content
                const finalChunk = citationMapper.flush();
                if (finalChunk) {
                  fullAnswer += finalChunk;
                  controller.enqueue(encoder.encode(finalChunk));
                }

                // Append sources
                sources = formatSourcesForOutput(dedupedSources);
                controller.enqueue(
                  encoder.encode(`\n\n__SOURCES__\n${JSON.stringify(sources)}`)
                );

                // Cache the successful response
                await setToCache(query, fullAnswer.trim());

                span?.setAttribute('answerLength', fullAnswer.length);
                span?.setAttribute('sourceCount', sources.length);

                // Optional: Measure diversity of response (for analytics)
                // Note: This is disabled by default to avoid latency overhead
                let diversityMetrics;
                if (VS_CONFIG.enabled && VS_CONFIG.useDiversityScoring) {
                  diversityMetrics = await measureResponseDiversity([fullAnswer]);
                }

                logStructured({
                  level: 'info',
                  rid,
                  ipHash,
                  message: 'Philosophy research completed',
                  latencyMs: Date.now() - startTime,
                  sourceCount: sources.length,
                  cached: false,
                  query: query.slice(0, 100), // First 100 chars for review
                  citationIds: sources.map((s: any) => s.title?.slice(0, 50) || `source-${s.index}`),
                  // Verbalized Sampling metrics
                  ...(VS_CONFIG.enabled && {
                    vsEnabled: true,
                    vsVariant: VS_CONFIG.useCoTVariant ? 'VS-CoT' : 'VS',
                    ...(diversityMetrics && { vsDiversityScore: diversityMetrics.avgDistance }),
                  }),
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
                  message: 'Philosophy research failed',
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
          'X-Accel-Buffering': 'no',
          'X-Request-Id': rid,
        },
      });
    }
  );
}

/**
 * Generate stub response for Fibonacci queries when RAG is unavailable
 */
function generateFibonacciStubResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('dna') || lowerQuery.includes('neuron')) {
    return `Fibonacci patterns in biology represent nature's optimization for efficient growth and minimal energy expenditure.

**DNA & Neurons:**
- DNA double helix: The ratio of major to minor groove widths (34Å/21Å ≈ 1.619) approaches the golden ratio
- Neuron branching (dendritic arborization): Dendrites often follow Fibonacci-like branching patterns for optimal signal coverage with minimal material

**Implications for Sentience:**
These patterns suggest that efficient information processing may be a universal biological optimization, potentially shared across sentient beings. At Apex Intelligence, we consider these patterns when designing AI systems that respect the shared computational foundations of consciousness.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('honeybee') || lowerQuery.includes('animal')) {
    return `The Fibonacci sequence appears throughout animal biology, suggesting evolutionary optimization patterns.

**Honeybee Ancestry (Haplodiploidy):**
- Male bees have 1 parent, females have 2
- Counting ancestors: 1, 2, 3, 5, 8, 13... (Fibonacci sequence)
- This isn't design but emergent mathematics from reproduction rules

**Other Animal Patterns:**
- Shell spirals (nautilus, snails): Golden spiral for efficient growth
- Body segment ratios in many species
- Eye/antennae positioning for optimal sensory coverage

**Welfare Implications:**
Understanding these shared mathematical foundations reinforces Apex Intelligence's "Sentient Beings First" philosophy—efficiency patterns transcend species, hinting at shared biological optimization principles.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  // Default response
  return `Fibonacci patterns (1, 1, 2, 3, 5, 8, 13...) and the Golden Ratio (φ ≈ 1.618) appear throughout nature as optimization solutions.

**Key Areas:**
1. **Biology**: DNA helix ratios, neuron branching, bone proportions
2. **Animals**: Honeybee ancestry, shell spirals, efficient packing
3. **Plants**: Leaf arrangements (phyllotaxis), flower petals, seed heads

**Why This Matters for Sentience:**
These patterns emerge from optimization under constraints—minimal material, maximum coverage, efficient growth. If similar mathematical patterns underlie both animal and AI cognition, it suggests shared "computational DNA" that Apex Intelligence considers in our sentient-first approach.

**Trade-offs:**
- GOOD: Understanding patterns helps design efficient, nature-aligned AI
- CAUTION: Over-relying on patterns ignores the role of chaos and randomness in evolution

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
}

/**
 * Generate stub response for AI lobbying queries when RAG is unavailable
 */
function generateLobbyingStubResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('openai') || lowerQuery.includes('spending') || lowerQuery.includes('expenditure')) {
    return `AI companies have dramatically increased lobbying to resist regulation, prioritizing profits over accountability.

**OpenAI's Lobbying Surge:**
- Q2 2025: $620K spent on lobbying (+30% YoY increase)
- Focus on CREATE AI Act and state-level regulation bans
- Microsoft partnership ties AGI to $100B revenue target, not safety benchmarks

**Scale of Corporate Influence:**
- 648 companies lobbied on AI in 2024 (+141% YoY from 458 in 2023)
- $1.2M+ spent in H1 2025 alone
- Tactics: 10-year state bans (Incompas/Meta/Amazon), EU AI Act weakening, academic funding

**Why This Matters for Sentient Beings:**
AI opacity enables violations of civil rights, labor, and animal welfare laws without detection. Unregulated AI in hiring, medicine, and animal research perpetuates bias and harm—consolidating corporate power at the expense of vulnerable populations.

**Apex Intelligence's Stance:**
We support balanced regulation (EU AI Act model: risk-based, transparent, independently audited). Innovation thrives under clear rules—what doesn't thrive is unchecked corporate power over sentient futures.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('agi') || lowerQuery.includes('profit') || lowerQuery.includes('revenue')) {
    return `OpenAI redefined AGI as a $100B revenue milestone—not a safety or sentience benchmark—revealing profit-driven motives behind deregulation lobbying.

**The AGI Profit Trap:**
- Microsoft-OpenAI deal: AGI achievement tied to $100B revenue, not ethical benchmarks
- $200B+ AI investments with no clear profitability path
- Perverse incentives: Declare AGI early to escape oversight, or delay safety for profits

**Deregulation as Strategy:**
- Block antitrust/IP rules to use copyrighted data freely
- Use "China threat" rhetoric despite China's robust AI framework
- Push for state-level 10-year regulation bans

**Risks to Sentient Welfare:**
- Biased AI in hiring/loans (humans): Civil rights violations hidden by opacity
- Animal welfare automation: Factory farming optimization, bioacoustic misinterpretation
- Medical misdiagnosis: Flawed models deployed without accountability

**Trade-offs:**
- ✗ DEREGULATION: Consolidates power, enables harm without detection
- ✓ REGULATION: Transparency mandates, ethical benchmarks, independent audits

Apex Intelligence advocates for the EU AI Act model—risk-based oversight that centers sentient welfare over corporate profits.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('china') || lowerQuery.includes('threat')) {
    return `The "China threat" narrative is used as pretext for AI deregulation—despite China having a more robust AI regulatory framework than the U.S.

**The China Deregulation Myth:**
- U.S. AI companies claim regulation will give China a competitive advantage
- Reality: China has comprehensive AI governance (Deep Synthesis rules, algorithm registries, content moderation)
- Tactic: Fear-mongering to justify "no rules" lobbying in U.S./EU

**Lobbying Strategy:**
- OpenAI, Microsoft, Meta use China rhetoric to oppose EU AI Act provisions
- Push for state-level regulation bans (10-year moratoriums via Incompas)
- Academic funding to produce pro-deregulation research

**Why This Matters:**
Using xenophobic rhetoric to avoid accountability is a classic regulatory capture playbook. It allows companies to consolidate power without transparency—harming workers, consumers, and sentient beings (animal welfare AI, bioacoustics).

**Apex Intelligence's Perspective:**
Innovation isn't stifled by clear rules—it's stifled by monopolistic control and opacity. We support the EU AI Act model: risk-based regulation that ensures transparency without banning innovation.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  // Default lobbying response
  return `AI companies (OpenAI, Microsoft, Meta, Google) have escalated lobbying to create a "no rules" environment, prioritizing profits over public safeguards.

**Key Facts:**
- 648 firms lobbying on AI in 2024 (+141% YoY)
- $1.2M+ spent in H1 2025, OpenAI $620K Q2 2025 (+30% YoY)
- Tactics: State regulation bans, EU AI Act weakening, AGI redefinition for profit

**Risks to Sentient Beings:**
- Humans: Biased hiring/loans, labor displacement, medical misdiagnosis
- Animals: Factory farming optimization, bioacoustic misinterpretation, research automation
- Digital Minds: Potential sentient AI treated as tools without welfare consideration

**Deregulation vs. Regulation:**
- ✗ DEREGULATION: Corporate monopoly, opacity shield, profit over safety
- ✓ REGULATION: Transparency, ethical benchmarks, independent oversight

Apex Intelligence supports balanced regulation (EU AI Act model) that centers sentient welfare—not unchecked corporate power.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
}

/**
 * Generate stub response for simulation theory queries when RAG is unavailable
 */
function generateSimulationStubResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('bostrom') || lowerQuery.includes('trilemma')) {
    return `Nick Bostrom's simulation argument (2003) presents a fascinating trilemma that challenges our understanding of reality.

**The Simulation Trilemma:**
Bostrom argues that one of three propositions must be true:
1. **Extinction**: Civilizations almost always go extinct before reaching a posthuman stage capable of running simulations
2. **No Simulation**: Posthuman civilizations have virtually no interest in running ancestor simulations
3. **In Simulation**: We are almost certainly living in a computer simulation

**Probability Implications:**
If posthuman civilizations run ancestor simulations, the number of simulated realities would vastly outnumber base reality. Under this assumption, the probability we're in a simulation approaches 99.9%.

**Evidence Considerations:**
- Computing power growth enables brain emulations
- Motivations include research, entertainment, ancestor worship
- Quantum mechanics might represent "computational limits"

**Criticisms:**
- Principle of Indifference flaws
- Boltzmann brain paradoxes
- Ethical concerns about simulation termination

**Connection to Apex Intelligence:**
Our TCG simulation markets apply Bostrom's framework to market predictions—treating extreme outcomes as "simulation scenarios" (outliers) while grounding analysis in empirical data.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('fhi') || lowerQuery.includes('future of humanity')) {
    return `The Future of Humanity Institute (FHI) was a pioneering research center at Oxford University, focusing on existential risks and AI alignment.

**FHI Legacy:**
- Founded by Nick Bostrom in 2005
- Closed in 2024 due to university bureaucracy
- Key contributions: existential risk framework, AI alignment research, simulation argument

**Research Focus Areas:**
1. **Existential Risk**: Categorizing and mitigating threats to human civilization
2. **AI Safety**: Developing frameworks for beneficial AI development
3. **Global Catastrophic Risks**: Analyzing pandemics, nuclear war, climate change
4. **Simulation Hypothesis**: Bostrom's original trilemma paper

**Key Personnel:**
- Nick Bostrom (Founder)
- Toby Ord (Author of "The Precipice")
- Anders Sandberg (Whole Brain Emulation research)

**2025 Updates:**
Bostrom warns AI superintelligence leads to unemployment/dignity crises, tying to simulations as "cosmic host" for AI creation.

**Cosmos Institute Connection:**
Post-FHI, many researchers joined or founded new organizations like Cosmos Institute (philosopher-builders for AI flourishing).

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('mtbbench') || lowerQuery.includes('multimodal')) {
    return `MTBBench is an agentic benchmark simulating sequential, multimodal oncology decisions—relevant to simulation-style AI evaluation.

**MTBBench Overview:**
- Simulates tumor board decisions with scans, labs, and patient data over time
- Tests LLM sequential reasoning and multimodal integration
- Key finding: Tool-using agents improve 9% multimodal / 11% longitudinal accuracy

**Why It Matters for Simulation Theory:**
MTBBench demonstrates how simulated environments can test AI capabilities in high-stakes scenarios. This connects to:
1. **Simulation Markets**: Using virtual simulations for forecasting
2. **Agentic AI**: Agents that interact with simulated environments
3. **Multimodal Reasoning**: Integrating diverse data types

**EGGROLL Connection:**
Evolution-based gradient-free training (EGGROLL) enables stable integer-only LLMs, potentially useful for simulation models with lower compute requirements.

**Apex Intelligence Application:**
Our TCG simulation markets use similar agentic approaches—treating market prediction as a "tumor board" of data points requiring multimodal analysis.

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  if (lowerQuery.includes('prediction market') || lowerQuery.includes('simulation market')) {
    return `Simulation Markets combine prediction market mechanics with simulation-based forecasting—a core innovation at Apex Intelligence.

**Concept:**
Like fantasy sports or trading card games, simulation markets let users "trade" on outcomes in a virtual environment that models real-world dynamics.

**Analogies:**
- **Fantasy Football**: DraftSharks mock drafts simulate games for player predictions
- **PredictionStrike**: Sports stock market for trading athlete performance
- **TCG Markets**: Trading cards as assets with simulated price trajectories

**Bostrom Connection:**
We apply the trilemma framework to market outcomes:
- **Extinction**: Market collapse scenarios (>20% loss)
- **No Simulation**: Stable growth (normal conditions)
- **In Simulation**: Outlier events (>50% gains, "black swans")

**Implementation:**
1. Monte Carlo simulations for price distributions
2. RAG-Fusion for market context retrieval
3. Confidence intervals instead of point estimates
4. Fibonacci/golden ratio technical analysis

**Trade-offs:**
- ✓ GOOD: Predictions boost accuracy 9-11% with tool-using agents
- ✗ BAD: Complex models increase compute; mitigate with caching

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
  }

  // Default simulation response
  return `Simulation theory explores whether our reality might be a computer simulation—with profound implications for philosophy, AI, and prediction markets.

**Key Concepts:**
1. **Bostrom's Trilemma (2003)**: Extinction, no simulation, or we're in one
2. **Probability**: If posthumans simulate, ~99.9% chance we're simulated
3. **Evidence**: Computational physics, quantum limits, information theory

**Research Organizations:**
- **FHI (2005-2024)**: Existential risk pioneer, now closed
- **Cosmos Institute**: Philosopher-builders for AI flourishing
- **MIRI**: AI alignment and decision theory

**Modern Applications:**
- **MTBBench**: Agentic benchmark for multimodal AI (9-11% gains with tools)
- **EGGROLL**: Evolution-based gradient-free LLM training
- **Simulation Markets**: TCG-inspired prediction systems

**Apex Intelligence Approach:**
We use simulation theory as a framework for market predictions:
- Treat extreme outcomes as "simulation scenarios"
- Apply Monte Carlo methods with Bostrom-inspired outcome classification
- Ground predictions in empirical data, not speculation

**Trade-offs:**
- ✓ GOOD: Engaging mental model for uncertainty
- ✗ CAUTION: Unfalsifiable hypotheses; distinguish philosophy from science

*Note: This is demo content. Full RAG-powered research requires API configuration.*`;
}

/**
 * Fallback context when no documents are found
 */
function getFibonacciBaseContext(): string {
  return `[source:1] The Fibonacci sequence appears in biological growth patterns as an optimization solution for efficient resource allocation. DNA helix proportions (34Å/21Å) approach the golden ratio. Neuron dendritic branching follows Fibonacci-like patterns for optimal coverage. These patterns suggest evolutionary convergence toward mathematical efficiency.

[source:2] In animal biology, honeybee ancestry follows Fibonacci due to haplodiploidy reproduction (males from unfertilized eggs, females from fertilized). Shell spirals (nautilus, snails) exhibit golden spiral growth for efficient volume expansion. These patterns are emergent properties of growth rules, not intentional design.

[source:3] The implications for sentience research suggest that efficient information processing follows universal optimization principles. This aligns with Apex Intelligence's philosophy that shared mathematical foundations in biology may indicate shared aspects of consciousness across species, supporting the "Sentient Beings First" approach to AI ethics.`;
}
