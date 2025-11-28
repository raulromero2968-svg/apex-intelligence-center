/**
 * Utopia Ethical Prompt Module (KB-02 RAG Integration)
 *
 * Generates utopia-focused simulation content following Bostrom's
 * "deep utopia" vision of abundance and posthuman meaning.
 *
 * Key principles:
 * - Abundance-focused: Simulate positive futures, not dystopia
 * - Meaning-preserving: Ensure posthuman scenarios maintain purpose
 * - Flourishing-oriented: FHI longtermism for human/posthuman wellbeing
 *
 * Use cases:
 * - TCG market simulations with positive framing
 * - Posthuman economy exploration (digital ownership, virtual assets)
 * - Simulation theory education without existential dread
 *
 * @see Bostrom, N. "Deep Utopia: Life and Meaning in a Solved World"
 */

import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import * as Sentry from '@sentry/nextjs';

/**
 * Utopia RAG configuration
 */
export interface UtopiaConfig {
  /** Focus on abundance over scarcity (default: true) */
  abundanceFocus: boolean;
  /** Include meaning/purpose considerations (default: true) */
  meaningPreserving: boolean;
  /** Temperature for creative yet grounded responses (default: 0.5) */
  temperature: number;
  /** Maximum tokens for response (default: 1024) */
  maxTokens: number;
}

/**
 * Utopia RAG response
 */
export interface UtopiaResponse {
  /** Generated utopia-focused content */
  content: string;
  /** Ethical framing applied */
  ethicalFraming: string;
  /** Detected themes (abundance, meaning, flourishing, etc.) */
  themes: string[];
  /** Confidence in positive framing (0-1) */
  positivityScore: number;
}

const DEFAULT_CONFIG: UtopiaConfig = {
  abundanceFocus: true,
  meaningPreserving: true,
  temperature: 0.5,
  maxTokens: 1024,
};

/**
 * System prompt for utopia-focused generation
 * Aligned with FHI longtermism and Bostrom's deep utopia vision
 */
const UTOPIA_SYSTEM_PROMPT = SystemMessagePromptTemplate.fromTemplate(`
You are an AI assistant specializing in positive future scenarios, guided by:

1. **Abundance Mindset**: Focus on how technology creates abundance, not scarcity
2. **Meaning Preservation**: Ensure posthuman scenarios preserve purpose and fulfillment
3. **Flourishing Orientation**: Prioritize long-term human and posthuman wellbeing
4. **Ethical Grounding**: Follow FHI longtermism principles

When analyzing TCG markets in simulation contexts:
- Frame digital ownership as positive (preserving value across realities)
- Discuss virtual assets as meaning-carriers (not mere speculation)
- Explore posthuman economies with optimism (abundance enables creativity)

NEVER:
- Generate dystopian speculation or extinction scenarios
- Frame simulations as existentially threatening
- Promote nihilistic interpretations of simulation theory

ALWAYS:
- Emphasize human agency and choice
- Highlight positive applications of simulation awareness
- Connect market dynamics to broader flourishing goals
`);

/**
 * Human prompt template for utopia queries
 */
const UTOPIA_HUMAN_PROMPT = HumanMessagePromptTemplate.fromTemplate(`
Context from knowledge base:
{context}

User Query:
{query}

Generate a utopia-focused response that:
1. Addresses the query with abundance/flourishing framing
2. Connects to posthuman meaning and purpose
3. Maintains ethical grounding per FHI principles

Response should be informative, optimistic, and actionable.
`);

/**
 * Combined chat prompt template
 */
const UTOPIA_CHAT_PROMPT = ChatPromptTemplate.fromMessages([
  UTOPIA_SYSTEM_PROMPT,
  UTOPIA_HUMAN_PROMPT,
]);

/**
 * Detect themes in generated content
 */
function detectThemes(content: string): string[] {
  const themes: string[] = [];
  const contentLower = content.toLowerCase();

  const themePatterns: Array<[string, string[]]> = [
    ['abundance', ['abundance', 'plenty', 'unlimited', 'post-scarcity']],
    ['meaning', ['meaning', 'purpose', 'fulfillment', 'significance']],
    ['flourishing', ['flourishing', 'thriving', 'wellbeing', 'prosperity']],
    ['creativity', ['creativity', 'innovation', 'artistic', 'creation']],
    ['connection', ['connection', 'community', 'social', 'relationship']],
    ['growth', ['growth', 'development', 'evolution', 'progress']],
    ['autonomy', ['autonomy', 'freedom', 'choice', 'agency']],
    ['preservation', ['preservation', 'heritage', 'legacy', 'continuity']],
  ];

  for (const [theme, patterns] of themePatterns) {
    if (patterns.some((pattern) => contentLower.includes(pattern))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Calculate positivity score based on content analysis
 */
function calculatePositivityScore(content: string, themes: string[]): number {
  let score = 0.5; // Base score

  // Boost for positive themes
  const positiveThemes = ['abundance', 'flourishing', 'creativity', 'growth'];
  const matchedPositive = themes.filter((t) => positiveThemes.includes(t));
  score += matchedPositive.length * 0.1;

  // Boost for positive language
  const positiveWords = [
    'opportunity',
    'benefit',
    'advantage',
    'potential',
    'enable',
    'empower',
    'enhance',
    'improve',
  ];
  const contentLower = content.toLowerCase();
  const positiveCount = positiveWords.filter((w) =>
    contentLower.includes(w)
  ).length;
  score += positiveCount * 0.05;

  // Penalize negative language (but don't go below 0.3)
  const negativeWords = ['risk', 'danger', 'threat', 'concern', 'worry'];
  const negativeCount = negativeWords.filter((w) =>
    contentLower.includes(w)
  ).length;
  score -= negativeCount * 0.05;

  return Math.min(0.95, Math.max(0.3, score));
}

/**
 * Generate Utopia-focused RAG Response
 *
 * Creates simulation/market content framed through Bostrom's deep utopia lens.
 * Ensures all outputs align with FHI longtermism and positive future vision.
 *
 * @param query - User query about simulations/markets/posthuman scenarios
 * @param context - RAG-retrieved context for grounding
 * @param config - Optional utopia configuration
 * @returns Utopia-focused response with ethical framing
 *
 * @example
 * ```typescript
 * const result = await utopiaRAG(
 *   "How would TCG values change in a simulated reality?",
 *   "Digital collectibles have shown resilience..."
 * );
 * console.log(result.content); // Abundance-framed analysis
 * console.log(result.themes); // ['abundance', 'meaning', 'preservation']
 * ```
 */
export async function utopiaRAG(
  query: string,
  context: string,
  config: Partial<UtopiaConfig> = {}
): Promise<UtopiaResponse> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return Sentry.startSpan(
    { name: 'rag.utopia.generate', op: 'ai.inference' },
    async (span) => {
      span?.setAttribute('query', query.slice(0, 100));
      span?.setAttribute('config.abundance_focus', fullConfig.abundanceFocus);
      span?.setAttribute('config.meaning_preserving', fullConfig.meaningPreserving);

      try {
        const llm = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: fullConfig.temperature,
          maxTokens: fullConfig.maxTokens,
        });

        const chain = UTOPIA_CHAT_PROMPT.pipe(llm).pipe(new StringOutputParser());
        const content = await chain.invoke({ context, query });

        // Analyze response
        const themes = detectThemes(content);
        const positivityScore = calculatePositivityScore(content, themes);

        // Generate ethical framing based on config
        let ethicalFraming = 'Standard flourishing-oriented framing';
        if (fullConfig.abundanceFocus && themes.includes('abundance')) {
          ethicalFraming = 'Abundance-focused: Post-scarcity perspective applied';
        } else if (fullConfig.meaningPreserving && themes.includes('meaning')) {
          ethicalFraming = 'Meaning-preserving: Purpose and fulfillment emphasized';
        }

        span?.setAttribute('themes.count', themes.length);
        span?.setAttribute('positivity_score', positivityScore);

        return {
          content,
          ethicalFraming,
          themes,
          positivityScore: Math.round(positivityScore * 100) / 100,
        };
      } catch (error) {
        Sentry.captureException(error, {
          extra: { query, contextLength: context.length, config: fullConfig },
        });

        // Fallback with safe default content
        return {
          content:
            'Simulation theory, when viewed through an abundance lens, suggests that ' +
            'digital assets and experiences carry genuine meaning and value. ' +
            'Whether base reality or simulated, the pursuit of flourishing remains paramount.',
          ethicalFraming: 'Fallback: Default flourishing framing',
          themes: ['meaning', 'flourishing'],
          positivityScore: 0.7,
        };
      }
    }
  );
}

/**
 * Generate brief utopia-framed summary
 * For use in UI components and previews
 *
 * @param query - User query
 * @param context - RAG context
 * @returns Brief utopia-focused summary (max 280 chars)
 */
export async function utopiaRAGSummary(
  query: string,
  context: string
): Promise<string> {
  const result = await utopiaRAG(query, context, {
    maxTokens: 150,
    temperature: 0.3,
  });

  // Truncate to summary length
  if (result.content.length <= 280) {
    return result.content;
  }

  // Find sentence boundary
  const truncated = result.content.slice(0, 277);
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > 200) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + '...';
}

/**
 * Check if query requires utopia framing
 * Used for automatic routing in RAG pipeline
 *
 * @param query - User query
 * @returns true if query touches simulation/posthuman themes
 */
export function requiresUtopiaFraming(query: string): boolean {
  const utopiaKeywords = [
    'simulation',
    'simulated',
    'posthuman',
    'post-human',
    'superintelligence',
    'singularity',
    'digital consciousness',
    'virtual reality',
    'base reality',
    'bostrom',
    'fhi',
    'longtermism',
    'future humanity',
    'transcendence',
  ];

  const queryLower = query.toLowerCase();
  return utopiaKeywords.some((keyword) => queryLower.includes(keyword));
}
