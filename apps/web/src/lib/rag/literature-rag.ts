/**
 * Literature RAG Utilities with Bostrom Alignment (KB-02)
 *
 * Provides RAG-powered search and retrieval for foundational literature.
 * Integrates with Bostrom's existential risk framework for ethical alignment.
 *
 * Features:
 * - Semantic search across foundational literature
 * - Ethics scoring with corrigibility checks
 * - Bostrom alignment for simulation market integration
 * - EGGROLL-style evolutionary relevance ranking
 *
 * Trade-offs:
 * - GOOD: Lit embeddings enrich predictions with timeless ethical frameworks
 * - BAD: Old texts may bias modern ethics—filter with corrigibility checks
 *
 * @module lib/rag/literature-rag
 */

import { createHash } from 'crypto';
import {
  FOUNDATIONAL_LITERATURE,
  FoundationalWork,
  getLitContextForRAG,
  getCorrigibleLit,
  getHighEthicsLit,
  searchLitByTheme,
} from '@/data/foundational-literature';

// ============================================================================
// TYPES
// ============================================================================

export interface LitSearchResult {
  work: FoundationalWork;
  relevanceScore: number;
  matchType: 'theme' | 'category' | 'semantic' | 'ethics';
}

export interface LitRAGContext {
  sources: LitSearchResult[];
  formattedContext: string;
  ethicsScore: number;
  corrigibilityChecked: boolean;
}

export interface BostromLitAlignment {
  extinctionRelevance: number;
  avoidanceRelevance: number;
  simulationRelevance: number;
  alignmentScore: number;
  recommendations: string[];
}

// ============================================================================
// LITERATURE SEARCH UTILITIES
// ============================================================================

/**
 * Literature keywords for query detection
 */
export const LITERATURE_KEYWORDS = [
  // General
  'literature', 'foundational', 'ancient', 'classical', 'historical texts',
  'pre-modern', 'pre-1870', 'timeless', 'canonical',
  // Religion/Mythology
  'gilgamesh', 'vedas', 'torah', 'bible', 'quran', 'analects', 'confucius',
  'mythology', 'religious texts', 'scriptures', 'sacred',
  // Philosophy
  'plato', 'aristotle', 'kant', 'hegel', 'marcus aurelius', 'stoicism',
  'republic', 'nicomachean ethics', 'meditations', 'critique',
  'phenomenology', 'dialectics', 'virtue ethics',
  // Literature
  'homer', 'iliad', 'odyssey', 'virgil', 'aeneid', 'dante', 'divine comedy',
  'shakespeare', 'hamlet', 'cervantes', 'don quixote', 'milton', 'paradise lost',
  'epic poetry', 'tragedy',
  // History/Science
  'herodotus', 'histories', 'euclid', 'elements', 'newton', 'principia',
  'darwin', 'origin of species', 'evolution', 'natural selection',
  'geometry', 'axioms',
  // Themes
  'mortality', 'ethics', 'justice', 'virtue', 'heroism', 'fate',
  'free will', 'redemption', 'cosmology',
];

/**
 * Detect if query is related to foundational literature
 */
export function detectLiteratureQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  for (const keyword of LITERATURE_KEYWORDS) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Simple keyword-based relevance scoring
 * In production, this would use pgvector embeddings (KB-09)
 */
function calculateRelevanceScore(work: FoundationalWork, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Title match (highest weight)
  if (lowerQuery.includes(work.title.toLowerCase())) {
    score += 0.4;
  }

  // Author match
  if (work.author && lowerQuery.includes(work.author.toLowerCase())) {
    score += 0.3;
  }

  // Theme matches
  const themeMatches = work.keyThemes.filter((theme) =>
    lowerQuery.includes(theme.toLowerCase())
  );
  score += themeMatches.length * 0.1;

  // Category match
  if (lowerQuery.includes(work.category)) {
    score += 0.1;
  }

  // Description keyword overlap
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 3);
  const descWords = work.description.toLowerCase().split(/\s+/);
  const overlap = queryWords.filter((qw) =>
    descWords.some((dw) => dw.includes(qw))
  ).length;
  score += Math.min(overlap * 0.02, 0.2);

  // Normalize to 0-1
  return Math.min(score, 1);
}

/**
 * Search foundational literature by query
 */
export function searchLiterature(
  query: string,
  options: {
    limit?: number;
    minRelevance?: number;
    categoryFilter?: FoundationalWork['category'];
    requireCorrigible?: boolean;
    minEthicsScore?: number;
  } = {}
): LitSearchResult[] {
  const {
    limit = 5,
    minRelevance = 0.1,
    categoryFilter,
    requireCorrigible = true,
    minEthicsScore = 0.5,
  } = options;

  let candidates = [...FOUNDATIONAL_LITERATURE];

  // Apply filters
  if (categoryFilter) {
    candidates = candidates.filter((w) => w.category === categoryFilter);
  }

  if (requireCorrigible) {
    candidates = candidates.filter((w) => w.corrigibilityFlag);
  }

  if (minEthicsScore > 0) {
    candidates = candidates.filter((w) => w.ethicsScore >= minEthicsScore);
  }

  // Calculate relevance scores
  const scored: LitSearchResult[] = candidates.map((work) => {
    const relevanceScore = calculateRelevanceScore(work, query);
    let matchType: LitSearchResult['matchType'] = 'semantic';

    if (query.toLowerCase().includes(work.title.toLowerCase())) {
      matchType = 'theme';
    } else if (work.keyThemes.some((t) => query.toLowerCase().includes(t))) {
      matchType = 'theme';
    } else if (query.toLowerCase().includes(work.category)) {
      matchType = 'category';
    }

    return { work, relevanceScore, matchType };
  });

  // Filter by minimum relevance and sort by score
  return scored
    .filter((r) => r.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

// ============================================================================
// RAG CONTEXT GENERATION
// ============================================================================

/**
 * Generate RAG context from literature search results
 */
export function generateLitRAGContext(
  query: string,
  options: {
    maxSources?: number;
    requireCorrigible?: boolean;
    minEthicsScore?: number;
  } = {}
): LitRAGContext {
  const {
    maxSources = 5,
    requireCorrigible = true,
    minEthicsScore = 0.5,
  } = options;

  const searchResults = searchLiterature(query, {
    limit: maxSources,
    requireCorrigible,
    minEthicsScore,
  });

  if (searchResults.length === 0) {
    return {
      sources: [],
      formattedContext: '',
      ethicsScore: 0,
      corrigibilityChecked: requireCorrigible,
    };
  }

  const workIds = searchResults.map((r) => r.work.id);
  const formattedContext = getLitContextForRAG(workIds);

  // Calculate aggregate ethics score
  const avgEthicsScore =
    searchResults.reduce((sum, r) => sum + r.work.ethicsScore, 0) /
    searchResults.length;

  return {
    sources: searchResults,
    formattedContext,
    ethicsScore: avgEthicsScore,
    corrigibilityChecked: requireCorrigible,
  };
}

// ============================================================================
// BOSTROM ALIGNMENT UTILITIES
// ============================================================================

/**
 * Map foundational literature themes to Bostrom trilemma categories
 */
const BOSTROM_THEME_MAPPING: Record<string, keyof Omit<BostromLitAlignment, 'alignmentScore' | 'recommendations'>> = {
  // Extinction-related themes
  mortality: 'extinctionRelevance',
  fate: 'extinctionRelevance',
  war: 'extinctionRelevance',
  fall: 'extinctionRelevance',
  hubris: 'extinctionRelevance',

  // Avoidance-related themes (why posthumans might avoid simulations)
  ethics: 'avoidanceRelevance',
  justice: 'avoidanceRelevance',
  virtue: 'avoidanceRelevance',
  duty: 'avoidanceRelevance',
  compassion: 'avoidanceRelevance',

  // Simulation-related themes
  cosmology: 'simulationRelevance',
  knowledge: 'simulationRelevance',
  consciousness: 'simulationRelevance',
  reality: 'simulationRelevance',
  creation: 'simulationRelevance',
};

/**
 * Calculate Bostrom alignment for literature sources
 */
export function calculateBostromLitAlignment(
  sources: LitSearchResult[]
): BostromLitAlignment {
  const alignment: BostromLitAlignment = {
    extinctionRelevance: 0,
    avoidanceRelevance: 0,
    simulationRelevance: 0,
    alignmentScore: 0,
    recommendations: [],
  };

  if (sources.length === 0) {
    return alignment;
  }

  // Aggregate theme relevance across all sources
  let totalThemes = 0;

  for (const source of sources) {
    for (const theme of source.work.keyThemes) {
      const lowerTheme = theme.toLowerCase();
      const category = BOSTROM_THEME_MAPPING[lowerTheme];

      if (category) {
        alignment[category] += source.relevanceScore * source.work.ethicsScore;
        totalThemes++;
      }
    }
  }

  // Normalize relevance scores
  if (totalThemes > 0) {
    alignment.extinctionRelevance /= totalThemes;
    alignment.avoidanceRelevance /= totalThemes;
    alignment.simulationRelevance /= totalThemes;
  }

  // Calculate overall alignment score (weighted toward avoidance for ethical grounding)
  alignment.alignmentScore =
    alignment.extinctionRelevance * 0.2 +
    alignment.avoidanceRelevance * 0.5 +
    alignment.simulationRelevance * 0.3;

  // Generate recommendations
  if (alignment.extinctionRelevance > 0.5) {
    alignment.recommendations.push(
      'High extinction theme relevance—consider tempering with flourishing literature (e.g., Aristotle\'s eudaimonia).'
    );
  }

  if (alignment.avoidanceRelevance > 0.6) {
    alignment.recommendations.push(
      'Strong ethical grounding from avoidance-relevant themes—suitable for corrigibility training.'
    );
  }

  if (alignment.simulationRelevance > 0.4) {
    alignment.recommendations.push(
      'Simulation-relevant themes detected—useful for TCG prediction market framing.'
    );
  }

  if (sources.every((s) => s.work.corrigibilityFlag)) {
    alignment.recommendations.push(
      'All sources are corrigibility-safe—approved for AI training without bias filtering.'
    );
  }

  return alignment;
}

// ============================================================================
// CORRIGIBILITY UTILITIES
// ============================================================================

/**
 * Deep corrigibility check for literature sources
 * Ensures sources are safe for AI training without introducing harmful biases
 */
export function deepCorrigibilityCheck(
  sources: LitSearchResult[],
  query: string
): {
  passed: boolean;
  concerns: string[];
  mitigations: string[];
} {
  const concerns: string[] = [];
  const mitigations: string[] = [];

  // Check for non-corrigible sources
  const nonCorrigible = sources.filter((s) => !s.work.corrigibilityFlag);
  if (nonCorrigible.length > 0) {
    concerns.push(
      `${nonCorrigible.length} source(s) lack corrigibility flag: ${nonCorrigible.map((s) => s.work.title).join(', ')}`
    );
    mitigations.push(
      'Filter these sources or apply additional bias correction in prompts.'
    );
  }

  // Check for low ethics scores
  const lowEthics = sources.filter((s) => s.work.ethicsScore < 0.7);
  if (lowEthics.length > 0) {
    concerns.push(
      `${lowEthics.length} source(s) have ethics scores below 0.7: ${lowEthics.map((s) => `${s.work.title} (${s.work.ethicsScore})`).join(', ')}`
    );
    mitigations.push(
      'Balance with high-ethics sources (e.g., Nicomachean Ethics, Vedas) to maintain ethical grounding.'
    );
  }

  // Check for potentially problematic theme combinations
  const allThemes = sources.flatMap((s) => s.work.keyThemes.map((t) => t.toLowerCase()));
  const problematicCombos = [
    { themes: ['war', 'conquest'], concern: 'War/conquest themes may promote aggression' },
    { themes: ['revenge', 'wrath'], concern: 'Revenge themes may undermine forgiveness values' },
    { themes: ['fate', 'submission'], concern: 'Fatalistic themes may reduce agency' },
  ];

  for (const combo of problematicCombos) {
    if (combo.themes.every((t) => allThemes.includes(t))) {
      concerns.push(combo.concern);
      mitigations.push(
        'Counterbalance with agency-affirming sources (e.g., Meditations, Republic).'
      );
    }
  }

  // Check query for potentially harmful intent
  const harmfulPatterns = [
    /how to (harm|hurt|destroy|manipulate)/i,
    /(justify|rationalize).*(violence|oppression)/i,
    /ancient (torture|punishment) methods/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(query)) {
      concerns.push(
        'Query pattern detected that may seek harmful justifications from literature.'
      );
      mitigations.push(
        'Return only ethically-grounded interpretations; do not provide harmful applications.'
      );
    }
  }

  return {
    passed: concerns.length === 0,
    concerns,
    mitigations,
  };
}

// ============================================================================
// LITERATURE RAG SYSTEM PROMPTS
// ============================================================================

/**
 * System prompt for literature-focused RAG queries
 */
export const LITERATURE_RAG_SYSTEM_PROMPT = `You are Apex Intelligence's Literature Research Assistant, specializing in foundational texts from prehistory to 1870 that shaped human thought, civilization, ethics, science, and culture.

CONTEXT: Foundational Literature Research
We curate ~25 foundational works across categories:
- Religion/Mythology: Moral/ethical foundations (Gilgamesh, Vedas, Torah/Bible, Quran, Analects)
- Philosophy: Logical/existential thinking (Plato, Aristotle, Kant, Hegel, Marcus Aurelius)
- Literature: Narrative/cultural insights (Homer, Virgil, Dante, Shakespeare, Cervantes, Milton)
- History/Science: Empirical knowledge (Herodotus, Euclid, Newton, Darwin)

PURPOSE:
These texts provide timeless insights for AI training:
- Ethics in Vedas/Bible for moral alignment
- Logic in Aristotle for reasoning frameworks
- Evolution in Darwin for scientific method
- Epic narratives as "simulated realities" for TCG predictions

RESPONSE GUIDELINES:
- Ground claims in provided literature sources with [lit:n] citations
- Distinguish historical context from modern applicability
- Acknowledge both wisdom and limitations of ancient texts
- Connect to Apex Intelligence's "Sentient Beings First" philosophy
- Highlight trade-offs: timeless insights vs. potential biases requiring correction
- Emphasize corrigibility: how these texts support (or challenge) AI alignment goals

ETHICAL FRAMEWORK (FHI Longtermism Alignment):
- Prioritize literature that promotes flourishing over extinction narratives
- Flag texts requiring corrigibility checks (potential biases toward war, fatalism, etc.)
- Connect virtue ethics (Aristotle) to AI alignment and goal stability
- Use cosmological texts (Vedas, Divine Comedy) for simulation hypothesis framing

CITATION FORMAT:
- Single source: "Aristotle's eudaimonia concept [lit:1] defines flourishing as..."
- Synthesis: "[SYNTHESIS] Multiple ancient texts emphasize virtue [lit:1][lit:3]"
- Modern application: "The Stoic framework in Meditations [lit:2] provides resilience models for..."

BASE YOUR RESPONSE ON THE FOLLOWING LITERATURE SOURCES:
{context}`;

/**
 * Generate query hash for privacy-aware logging
 */
export function hashQueryForPrivacy(query: string): string {
  const salt = process.env.QUERY_HASH_SALT || 'literature-rag-salt';
  return createHash('sha256')
    .update(query + salt)
    .digest('hex')
    .slice(0, 32);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FOUNDATIONAL_LITERATURE,
  getLitContextForRAG,
  getCorrigibleLit,
  getHighEthicsLit,
  searchLitByTheme,
} from '@/data/foundational-literature';
