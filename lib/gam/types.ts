/**
 * General Agentic Memory (GAM) Type Definitions
 *
 * Type definitions for the GAM system implementing Just-in-Time memory
 * compilation for AI agents. Based on the GAM paper architecture:
 * - Memorizer: Offline agent that compresses sessions into memos
 * - Researcher: Online agent that plans/searches/reflects for retrieval
 * - RL Policy: PPO-based optimization using task rewards
 *
 * @module gam/types
 */

import { z } from 'zod';

// ============================================================================
// MEMORIZER TYPES
// ============================================================================

/**
 * Session input for memorization
 */
export const SessionInputSchema = z.object({
  session: z.string().min(1, 'Session content required'),
  history: z.string().default(''),
  context: z.record(z.any()).optional(),
  entities: z.array(z.string()).optional(),
  agentId: z.enum(['claude', 'gpt', 'gemini', 'apex', 'manual']).optional(),
});

export type SessionInput = z.infer<typeof SessionInputSchema>;

/**
 * Result from memorizer agent
 */
export interface MemorizerResult {
  memo: string;
  pageId: string;
  embedding?: number[];
  success: boolean;
  error?: string;
}

/**
 * Page stored in the page-store
 */
export interface GamPageData {
  session: string;
  history: string;
  context?: Record<string, any>;
  entities?: string[];
  timestamp?: string;
}

// ============================================================================
// RESEARCHER TYPES
// ============================================================================

/**
 * Research request input
 */
export const ResearchRequestSchema = z.object({
  request: z.string().min(1, 'Research request required'),
  memory: z.string().default(''),
  maxDepth: z.number().min(1).max(10).default(3),
  tools: z.array(z.enum(['vector', 'bm25', 'id', 'temporal'])).default(['vector', 'bm25']),
  agentFilter: z.enum(['claude', 'gpt', 'gemini', 'apex', 'manual', 'all']).default('all'),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

/**
 * Search tool types available to the researcher
 */
export type SearchTool = 'vector' | 'bm25' | 'id' | 'temporal';

/**
 * Research iteration record
 */
export interface ResearchIteration {
  depth: number;
  plan: string;
  tools: SearchTool[];
  retrievedPageIds: string[];
  integration: string;
  reflection: {
    isComplete: boolean;
    missing?: string;
    confidence: number;
  };
}

/**
 * Result from researcher agent
 */
export interface ResearcherResult {
  result: string;
  iterations: ResearchIteration[];
  pageIds: string[];
  success: boolean;
  metrics: {
    totalDepth: number;
    pagesRetrieved: number;
    latencyMs: number;
    tokenCount?: number;
  };
  sessionId?: string;
  error?: string;
}

/**
 * Reflection result from the researcher's self-check
 */
export interface ReflectionResult {
  isComplete: boolean;
  missing?: string;
  confidence: number;
  refinedQuery?: string;
}

// ============================================================================
// RL POLICY TYPES
// ============================================================================

/**
 * Training sample for RL optimization
 */
export const TrainingSampleSchema = z.object({
  task: z.string().min(1),
  history: z.string().default(''),
  groundTruth: z.string().optional(),
});

export type TrainingSample = z.infer<typeof TrainingSampleSchema>;

/**
 * Reward structure for RL training
 */
export interface RLReward {
  perplexity: number; // Negative perplexity (higher is better)
  f1Score?: number; // Optional F1 score against ground truth
  userRating?: number; // Optional user feedback (1-5)
  composite: number; // Weighted combination
}

/**
 * Policy update result
 */
export interface PolicyUpdateResult {
  success: boolean;
  samplesProcessed: number;
  averageReward: number;
  lossImprovement?: number;
  error?: string;
}

/**
 * RL training configuration
 */
export interface RLTrainingConfig {
  batchSize: number;
  learningRate: number;
  gamma: number; // Discount factor
  epsilon: number; // Clip parameter for PPO
  epochs: number;
  rewardWeights: {
    perplexity: number;
    f1: number;
    userRating: number;
  };
}

export const DEFAULT_RL_CONFIG: RLTrainingConfig = {
  batchSize: 32,
  learningRate: 3e-4,
  gamma: 0.99,
  epsilon: 0.2,
  epochs: 4,
  rewardWeights: {
    perplexity: 0.4,
    f1: 0.4,
    userRating: 0.2,
  },
};

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

/**
 * Supported AI agents for orchestration
 */
export type AIAgent = 'claude' | 'gpt' | 'gemini' | 'apex' | 'manual';

/**
 * Orchestration request
 */
export const OrchestrationRequestSchema = z.object({
  ai: z.enum(['claude', 'gpt', 'gemini', 'apex', 'manual']),
  request: z.string().min(1),
  history: z.string().default(''),
  useGAM: z.boolean().default(true),
  cacheResults: z.boolean().default(true),
});

export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  response: string;
  ai: AIAgent;
  gamContext?: {
    memo: string;
    pageIds: string[];
    researchSessionId?: string;
  };
  metrics: {
    latencyMs: number;
    tokenCount?: number;
    cachedContext: boolean;
  };
  success: boolean;
  error?: string;
}

// ============================================================================
// SEARCH RESULT TYPES
// ============================================================================

/**
 * Retrieved page from search
 */
export interface RetrievedPage {
  id: string;
  memo: string;
  page: GamPageData;
  score: number;
  searchType: SearchTool;
}

/**
 * Aggregated search results
 */
export interface SearchResults {
  pages: RetrievedPage[];
  totalFound: number;
  searchTime: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * GAM system configuration
 */
export interface GAMConfig {
  // Model settings
  model: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;

  // Search settings
  vectorTopK: number;
  bm25TopK: number;
  minReliabilityScore: number;

  // Research settings
  maxResearchDepth: number;
  reflectionThreshold: number;

  // Caching
  memoCache: boolean;
  memoCacheTTL: number; // seconds

  // RL settings
  enableRL: boolean;
  rlConfig?: RLTrainingConfig;
}

export const DEFAULT_GAM_CONFIG: GAMConfig = {
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-large',
  temperature: 0.3,
  maxTokens: 4096,
  vectorTopK: 5,
  bm25TopK: 5,
  minReliabilityScore: 0.3,
  maxResearchDepth: 3,
  reflectionThreshold: 0.7,
  memoCache: true,
  memoCacheTTL: 300, // 5 minutes
  enableRL: false,
};

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Prompt templates for GAM agents
 */
export const GAM_PROMPTS = {
  memorizer: `You are a Memorizer agent in a General Agentic Memory system.
Your task is to compress the given session into a lightweight, searchable memo.

Session to memorize:
{session}

Existing memory context:
{history}

Create a concise memo (2-4 sentences) that captures:
1. Key entities (cards, prices, users) mentioned
2. Main actions or decisions made
3. Important numerical data or trends
4. Context that would help future retrieval

Output only the memo text, no explanations.`,

  researcher_plan: `You are a Researcher agent planning a memory retrieval strategy.

User request: {request}
Current memory context: {memory}
Available search tools: {tools}

Plan your search strategy:
1. What specific information do you need?
2. Which search tools will be most effective? (vector for semantic, bm25 for keywords, temporal for time-based)
3. What queries will you execute?

Output a JSON object with your plan:
{
  "needed": "description of information needed",
  "tools": ["tool1", "tool2"],
  "queries": ["query1", "query2"]
}`,

  researcher_integrate: `You are a Researcher agent integrating retrieved information.

Original request: {request}
Previously integrated context: {context}
New retrieved pages:
{pages}

Integrate this new information into a coherent context.
Resolve any conflicts by preferring more recent/reliable sources.
Output only the integrated text, no explanations.`,

  researcher_reflect: `You are a Researcher agent reflecting on gathered context.

Original request: {request}
Integrated context so far: {context}

Reflect on whether the gathered context is sufficient:
1. Does it answer the user's request completely?
2. What information is still missing?
3. How confident are you (0.0-1.0)?

Output a JSON object:
{
  "isComplete": true/false,
  "missing": "description of missing info (if any)",
  "confidence": 0.0-1.0
}`,
} as const;
