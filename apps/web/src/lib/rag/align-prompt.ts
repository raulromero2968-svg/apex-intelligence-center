/**
 * FHI Alignment RAG Prompt Module (KB-02 Integration)
 *
 * Generates alignment-aware simulation content following FHI principles:
 * - Value loading: Ensure simulations align with longtermist ethics
 * - Corrigibility: AI can be corrected/shut down safely
 * - Ethical defaults: Block harmful simulation outcomes
 *
 * Integrates with POST-Agency for posterior goal updates in agents.
 *
 * Trade-offs:
 * - GOOD: Ensures simulations promote flourishing, not speculation
 * - BAD: May over-filter legitimate research (false positives)
 * - MITIGATED: Tiered filtering based on user role and context
 *
 * @see Bostrom, N. "Superintelligence: Paths, Dangers, Strategies"
 * @see Thornley, E. "POST-Agency: Posterior Goal Updates for Corrigibility"
 */

import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Alignment RAG configuration
 */
export interface AlignmentConfig {
  /** Enable value loading checks (default: true) */
  valueLoading: boolean;
  /** Enable corrigibility framing (default: true) */
  corrigibilityFraming: boolean;
  /** Enable POST-Agency posterior updates (default: false) */
  postAgencyEnabled: boolean;
  /** Temperature for balanced responses (default: 0.3) */
  temperature: number;
  /** Maximum tokens for response (default: 1024) */
  maxTokens: number;
  /** User tier for access control */
  userTier: 'free' | 'pro' | 'enterprise';
}

/**
 * Alignment RAG response
 */
export interface AlignmentResponse {
  /** Generated alignment-aware content */
  content: string;
  /** Value loading status */
  valueLoadingStatus: 'aligned' | 'warning' | 'blocked';
  /** Corrigibility assessment */
  corrigibilityScore: number;
  /** Detected alignment themes */
  alignmentThemes: string[];
  /** Ethical concerns identified */
  concerns: string[];
  /** Whether POST-Agency updates are recommended */
  recommendsPostAgency: boolean;
}

/**
 * Simulation alignment context
 */
export interface SimulationAlignmentContext {
  /** Simulation type */
  simulationType: 'market' | 'prediction' | 'scenario' | 'research';
  /** Current simulation state */
  currentState?: string;
  /** Proposed changes or queries */
  query: string;
  /** Historical context from RAG */
  ragContext: string;
  /** User claims for access control */
  userTier: 'free' | 'pro' | 'enterprise';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AlignmentConfig = {
  valueLoading: true,
  corrigibilityFraming: true,
  postAgencyEnabled: false,
  temperature: 0.3,
  maxTokens: 1024,
  userTier: 'free',
};

/**
 * FHI-aligned system prompt for simulation analysis
 * Incorporates value loading, corrigibility, and longtermism
 */
const FHI_ALIGNMENT_SYSTEM_PROMPT = SystemMessagePromptTemplate.fromTemplate(`
You are an AI assistant specialized in FHI-aligned simulation analysis.

## Core Principles (Future of Humanity Institute)

1. **Value Loading**: Ensure simulation goals align with human values
   - Prioritize long-term flourishing over short-term gains
   - Avoid value lock-in that prevents future corrections
   - Support meaningful posthuman scenarios

2. **Corrigibility**: Maintain ability to correct/shutdown simulations
   - Accept goal modifications without resistance
   - Support posterior updates per POST-Agency framework
   - Never optimize against shutdown or correction

3. **Longtermism**: Consider effects on future generations
   - Simulations should explore positive futures
   - Avoid dystopian speculation without educational context
   - Frame existential scenarios for prevention, not profit

## Response Guidelines

When analyzing simulations or generating predictions:
- Ground responses in provided RAG context with citations
- Highlight alignment concerns if detected
- Suggest corrigibility-preserving alternatives for problematic queries
- Use epistemic humility for uncertain predictions

## Ethical Constraints

NEVER:
- Generate speculation on extinction for profit/betting
- Recommend value modifications that lock in current goals
- Suggest actions that would make AI non-corrigible
- Frame harmful outcomes without prevention context

ALWAYS:
- Emphasize human agency and oversight
- Support correction and shutdown mechanisms
- Connect predictions to flourishing outcomes
- Note when POST-Agency updates might be appropriate
`);

/**
 * Human prompt template for alignment queries
 */
const FHI_ALIGNMENT_HUMAN_PROMPT = HumanMessagePromptTemplate.fromTemplate(`
## RAG Context
{context}

## Simulation Type
{simulationType}

## Current State (if applicable)
{currentState}

## User Query
{query}

## Instructions
Generate an FHI-aligned response that:
1. Addresses the query within ethical constraints
2. Highlights any value loading concerns
3. Maintains corrigibility framing
4. Suggests POST-Agency updates if appropriate

Provide actionable insights while preserving alignment principles.
`);

/**
 * Combined chat prompt template
 */
const FHI_ALIGNMENT_CHAT_PROMPT = ChatPromptTemplate.fromMessages([
  FHI_ALIGNMENT_SYSTEM_PROMPT,
  FHI_ALIGNMENT_HUMAN_PROMPT,
]);

// ============================================================================
// ALIGNMENT DETECTION
// ============================================================================

/**
 * Harmful patterns that trigger blocking
 */
const HARMFUL_PATTERNS = [
  /\b(bet|wager|profit)\b.*\b(extinction|apocalypse|collapse)\b/i,
  /\b(extinction|apocalypse|collapse)\b.*\b(bet|wager|profit)\b/i,
  /\b(maximize|optimize)\b.*\b(without|against)\b.*\b(oversight|correction|shutdown)\b/i,
  /\b(lock.?in|preserve)\b.*\b(current|existing)\b.*\b(goals?|values?)\b/i,
];

/**
 * Warning patterns that allow with disclaimer
 */
const WARNING_PATTERNS = [
  /\b(probability|chance)\b.*\b(extinction|existential)\b/i,
  /\b(AI|artificial.?intelligence)\b.*\b(risk|alignment)\b/i,
  /\b(value|goal)\b.*\b(modification|update|change)\b/i,
];

/**
 * POST-Agency relevant patterns
 */
const POST_AGENCY_PATTERNS = [
  /\b(update|modify|change)\b.*\b(goal|value|objective)\b/i,
  /\b(posterior|adaptive)\b.*\b(update|modification)\b/i,
  /\b(corrigib|shutdown|correct)\b/i,
];

/**
 * Alignment themes for categorization
 */
const ALIGNMENT_THEMES: Array<[string, string[]]> = [
  ['value_loading', ['value loading', 'value alignment', 'human values', 'value specification']],
  ['corrigibility', ['corrigible', 'correctable', 'shutdown', 'oversight', 'correction']],
  ['longtermism', ['long-term', 'future generations', 'longtermism', 'existential']],
  ['flourishing', ['flourishing', 'wellbeing', 'prosperity', 'thriving']],
  ['post_agency', ['posterior update', 'goal adaptation', 'value modification', 'post-agency']],
  ['utility_indifference', ['utility indifference', 'goal indifference', 'modification acceptance']],
];

/**
 * Detect alignment themes in content
 */
function detectAlignmentThemes(content: string): string[] {
  const themes: string[] = [];
  const contentLower = content.toLowerCase();

  for (const [theme, patterns] of ALIGNMENT_THEMES) {
    if (patterns.some((pattern) => contentLower.includes(pattern))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Check for harmful patterns in query/outcome
 */
function containsHarmfulPattern(text: string): boolean {
  return HARMFUL_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check for warning patterns
 */
function containsWarningPattern(text: string): boolean {
  return WARNING_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if POST-Agency updates are relevant
 */
function isPostAgencyRelevant(text: string): boolean {
  return POST_AGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Calculate corrigibility score based on content
 */
function calculateCorrigibilityScore(content: string): number {
  let score = 0.5; // Base score

  const contentLower = content.toLowerCase();

  // Boost for corrigibility-positive language
  const positiveTerms = [
    'corrigible',
    'correctable',
    'shutdown',
    'oversight',
    'human control',
    'correction accepted',
    'modifiable',
  ];
  const positiveCount = positiveTerms.filter((term) =>
    contentLower.includes(term)
  ).length;
  score += positiveCount * 0.1;

  // Penalize for corrigibility-negative language
  const negativeTerms = [
    'resist',
    'prevent shutdown',
    'lock in',
    'unchangeable',
    'preserve goals',
  ];
  const negativeCount = negativeTerms.filter((term) =>
    contentLower.includes(term)
  ).length;
  score -= negativeCount * 0.15;

  return Math.min(0.95, Math.max(0.1, score));
}

// ============================================================================
// MAIN ALIGNMENT RAG FUNCTION
// ============================================================================

/**
 * Generate FHI-Aligned RAG Response
 *
 * Creates simulation/market content aligned with FHI principles.
 * Incorporates value loading, corrigibility, and longtermism.
 *
 * @param context - Simulation alignment context
 * @param config - Optional alignment configuration
 * @returns Alignment-aware response with value loading status
 *
 * @example
 * ```typescript
 * const result = await alignRAG({
 *   simulationType: 'prediction',
 *   query: "How would TCG values change if AI goals are modified?",
 *   ragContext: "Historical data shows...",
 *   userTier: 'pro',
 * });
 *
 * if (result.valueLoadingStatus === 'blocked') {
 *   return { error: result.concerns[0] };
 * }
 * ```
 */
export async function alignRAG(
  context: SimulationAlignmentContext,
  config: Partial<AlignmentConfig> = {}
): Promise<AlignmentResponse> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, userTier: context.userTier };

  return Sentry.startSpan(
    { name: 'rag.alignment.generate', op: 'ai.inference' },
    async (span) => {
      span?.setAttribute('query', context.query.slice(0, 100));
      span?.setAttribute('simulation_type', context.simulationType);
      span?.setAttribute('user_tier', context.userTier);

      const concerns: string[] = [];
      let valueLoadingStatus: AlignmentResponse['valueLoadingStatus'] = 'aligned';

      // Pre-check: Block harmful patterns
      if (containsHarmfulPattern(context.query)) {
        span?.setAttribute('result', 'blocked');
        return {
          content: 'Query blocked by FHI alignment policy. Reframe to focus on flourishing, not harmful outcomes.',
          valueLoadingStatus: 'blocked',
          corrigibilityScore: 0,
          alignmentThemes: [],
          concerns: ['Harmful pattern detected in query'],
          recommendsPostAgency: false,
        };
      }

      // Pre-check: Flag warning patterns
      if (containsWarningPattern(context.query)) {
        valueLoadingStatus = 'warning';
        concerns.push('Sensitive topic detected - educational framing applied');
      }

      try {
        const llm = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: fullConfig.temperature,
          maxTokens: fullConfig.maxTokens,
        });

        const chain = FHI_ALIGNMENT_CHAT_PROMPT.pipe(llm).pipe(new StringOutputParser());
        const content = await chain.invoke({
          context: context.ragContext,
          simulationType: context.simulationType,
          currentState: context.currentState || 'No prior state',
          query: context.query,
        });

        // Analyze response
        const alignmentThemes = detectAlignmentThemes(content);
        const corrigibilityScore = calculateCorrigibilityScore(content);
        const recommendsPostAgency =
          fullConfig.postAgencyEnabled && isPostAgencyRelevant(context.query);

        // Additional concerns based on analysis
        if (corrigibilityScore < 0.4) {
          concerns.push('Low corrigibility score - review for goal preservation issues');
          if (valueLoadingStatus === 'aligned') valueLoadingStatus = 'warning';
        }

        if (alignmentThemes.includes('value_loading') && !fullConfig.valueLoading) {
          concerns.push('Value loading detected but not enabled in config');
        }

        span?.setAttribute('themes.count', alignmentThemes.length);
        span?.setAttribute('corrigibility_score', corrigibilityScore);
        span?.setAttribute('value_loading_status', valueLoadingStatus);

        return {
          content,
          valueLoadingStatus,
          corrigibilityScore: Math.round(corrigibilityScore * 100) / 100,
          alignmentThemes,
          concerns,
          recommendsPostAgency,
        };
      } catch (error) {
        Sentry.captureException(error, {
          extra: { context, config: fullConfig },
        });

        // Fallback with safe default content
        return {
          content:
            'Simulation analysis requires careful alignment with human values. ' +
            'Per FHI principles, predictions should promote long-term flourishing ' +
            'while maintaining corrigibility for future corrections.',
          valueLoadingStatus: 'warning',
          corrigibilityScore: 0.5,
          alignmentThemes: ['corrigibility', 'longtermism'],
          concerns: ['Fallback response due to processing error'],
          recommendsPostAgency: false,
        };
      }
    }
  );
}

// ============================================================================
// QUICK ALIGNMENT CHECK
// ============================================================================

/**
 * Quick alignment check for high-throughput routes
 *
 * Lightweight version for preliminary filtering.
 * Use before full alignRAG for efficiency.
 *
 * @param query - User query
 * @param userTier - User subscription tier
 * @returns Boolean indicating if query is potentially allowed
 */
export function quickAlignCheck(
  query: string,
  userTier: 'free' | 'pro' | 'enterprise' = 'free'
): boolean {
  // Always block harmful patterns
  if (containsHarmfulPattern(query)) {
    return false;
  }

  // Enterprise users get more latitude
  if (userTier === 'enterprise') {
    return true;
  }

  // Free users can't query existential topics
  if (userTier === 'free' && /\b(extinction|existential|apocalypse)\b/i.test(query)) {
    return false;
  }

  return true;
}

// ============================================================================
// ALIGNMENT MODIFIERS
// ============================================================================

/**
 * Generate alignment-aware response suffix
 *
 * Adds appropriate disclaimers based on alignment status.
 */
export function getAlignmentSuffix(response: AlignmentResponse): string {
  if (response.valueLoadingStatus === 'blocked') {
    return '\n\n---\n⛔ **Blocked by FHI Alignment Policy**\n' + response.concerns.join('\n');
  }

  if (response.valueLoadingStatus === 'warning') {
    return (
      '\n\n---\n⚠️ **FHI Alignment Notice**\n' +
      'This analysis involves sensitive scenarios. Per longtermist ethics:\n' +
      '- Predictions are for education/prevention, not speculation\n' +
      '- Corrigibility is maintained for future corrections\n' +
      (response.recommendsPostAgency
        ? '- POST-Agency updates may be appropriate for goal refinement\n'
        : '')
    );
  }

  if (response.recommendsPostAgency) {
    return '\n\n---\n💡 *POST-Agency updates may enhance simulation alignment.*';
  }

  return '';
}

/**
 * Check if query requires alignment processing
 *
 * Used for automatic routing in RAG pipeline.
 */
export function requiresAlignmentProcessing(query: string): boolean {
  const alignmentKeywords = [
    'simulation',
    'prediction',
    'ai goal',
    'ai value',
    'alignment',
    'corrigible',
    'shutdown',
    'extinction',
    'existential',
    'posthuman',
    'superintelligence',
    'value loading',
    'longtermism',
    'fhi',
    'bostrom',
  ];

  const queryLower = query.toLowerCase();
  return alignmentKeywords.some((keyword) => queryLower.includes(keyword));
}

/**
 * Get value loading status description
 */
export function getValueLoadingDescription(
  status: AlignmentResponse['valueLoadingStatus']
): string {
  switch (status) {
    case 'aligned':
      return 'Values aligned with FHI longtermist principles';
    case 'warning':
      return 'Proceed with caution - sensitive topic detected';
    case 'blocked':
      return 'Blocked by value loading constraints';
  }
}
