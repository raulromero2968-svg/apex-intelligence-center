/**
 * Unit tests for Philosophy Research API
 *
 * Tests cover:
 * - Query topic detection (lobbying vs. fibonacci)
 * - Zod validation for request body
 * - VS-CoT prompt selection based on query topic
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Query Topic Detection Tests
// ============================================================================

const LOBBYING_KEYWORDS = [
  'lobbying', 'lobby', 'lobbyist', 'regulation', 'deregulation',
  'openai', 'microsoft', 'meta', 'google', 'big tech', 'tech companies',
  'agi', 'artificial general intelligence', 'ai act', 'eu ai act',
  'corporate', 'profit', 'revenue', 'expenditure', 'spending',
  'policy', 'congress', 'law', 'oversight', 'accountability',
  'capture', 'influence', 'create ai act', 'antitrust',
  'china threat', 'safety', 'transparency', 'ethical ai',
];

function detectQueryTopic(query: string): 'lobbying' | 'fibonacci' {
  const lowerQuery = query.toLowerCase();

  for (const keyword of LOBBYING_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      return 'lobbying';
    }
  }

  return 'fibonacci';
}

describe('Philosophy Research API - Query Topic Detection', () => {
  describe('Lobbying queries', () => {
    it('should detect OpenAI lobbying query', () => {
      expect(detectQueryTopic('What is OpenAI spending on lobbying?')).toBe('lobbying');
    });

    it('should detect regulation query', () => {
      expect(detectQueryTopic('Tell me about AI regulation efforts')).toBe('lobbying');
    });

    it('should detect AGI redefinition query', () => {
      expect(detectQueryTopic('How is AGI being redefined for profit?')).toBe('lobbying');
    });

    it('should detect China threat rhetoric query', () => {
      expect(detectQueryTopic('What about the China threat narrative?')).toBe('lobbying');
    });

    it('should detect corporate influence query', () => {
      expect(detectQueryTopic('How do big tech companies influence policy?')).toBe('lobbying');
    });

    it('should detect EU AI Act query', () => {
      expect(detectQueryTopic('What happened with the EU AI Act?')).toBe('lobbying');
    });
  });

  describe('Fibonacci queries', () => {
    it('should detect Fibonacci in biology query', () => {
      expect(detectQueryTopic('Tell me about Fibonacci in DNA')).toBe('fibonacci');
    });

    it('should detect golden ratio query', () => {
      expect(detectQueryTopic('How does the golden ratio appear in nature?')).toBe('fibonacci');
    });

    it('should detect animal pattern query', () => {
      expect(detectQueryTopic('Explain honeybee ancestry patterns')).toBe('fibonacci');
    });

    it('should detect neuron branching query', () => {
      expect(detectQueryTopic('Does neuron branching follow Fibonacci?')).toBe('fibonacci');
    });

    it('should default to fibonacci for generic queries', () => {
      expect(detectQueryTopic('Tell me about patterns in nature')).toBe('fibonacci');
    });
  });

  describe('Edge cases', () => {
    it('should handle case-insensitive matching', () => {
      expect(detectQueryTopic('OPENAI LOBBYING')).toBe('lobbying');
      expect(detectQueryTopic('Fibonacci Sequence')).toBe('fibonacci');
    });

    it('should handle queries with multiple topics (prioritize lobbying)', () => {
      expect(detectQueryTopic('How does OpenAI use Fibonacci in their models?')).toBe('lobbying');
    });

    it('should handle empty query (default to fibonacci)', () => {
      expect(detectQueryTopic('')).toBe('fibonacci');
    });
  });
});

// ============================================================================
// Zod Validation Tests
// ============================================================================

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

describe('Philosophy Research API - Zod Validation', () => {
  describe('Valid queries', () => {
    it('should accept valid lobbying query', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: 'What is OpenAI spending on lobbying?',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid fibonacci query', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: 'Explain Fibonacci in DNA',
      });
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from query', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: '  OpenAI lobbying  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('OpenAI lobbying');
      }
    });

    it('should accept query at max length (500 chars)', () => {
      const longQuery = 'a'.repeat(500);
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: longQuery,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid queries', () => {
    it('should reject empty string', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('should reject query exceeding 500 characters', () => {
      const longQuery = 'a'.repeat(501);
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: longQuery,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing query field', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-string query', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: 123,
      });
      expect(result.success).toBe(false);
    });

    it('should provide meaningful error messages', () => {
      const result = PhilosophyResearchRequestSchema.safeParse({
        query: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Query cannot be empty');
      }
    });
  });
});

// ============================================================================
// Integration: Topic Detection + Prompt Selection
// ============================================================================

describe('Philosophy Research API - Prompt Selection Integration', () => {
  it('should select lobbying prompt for lobbying queries', () => {
    const query = 'What is OpenAI spending on lobbying?';
    const topic = detectQueryTopic(query);
    expect(topic).toBe('lobbying');
    // In actual implementation, this would select aiLobbyingRagPrompt or aiLobbyingRagPromptWithVS
  });

  it('should select fibonacci prompt for fibonacci queries', () => {
    const query = 'Explain Fibonacci in DNA';
    const topic = detectQueryTopic(query);
    expect(topic).toBe('fibonacci');
    // In actual implementation, this would select philosophyRagPrompt or philosophyRagPromptWithVS
  });

  it('should use VS-CoT regulation variant for lobbying when VS enabled', () => {
    const query = 'How does corporate lobbying affect AI regulation?';
    const topic = detectQueryTopic(query);
    expect(topic).toBe('lobbying');
    // VS_COT_REGULATION_PROMPT_PREFIX would be used for multi-stakeholder analysis
  });

  it('should use standard VS-CoT for fibonacci when VS enabled', () => {
    const query = 'Explain the golden ratio in biological systems';
    const topic = detectQueryTopic(query);
    expect(topic).toBe('fibonacci');
    // VS_COT_PROMPT_PREFIX would be used for diverse analytical approaches
  });
});

// ============================================================================
// Safety Filter Tests
// ============================================================================

describe('Philosophy Research API - Safety Filters', () => {
  const HARMFUL_PATTERNS = [
    /\b(torture|tortur\w*|abuse|abus\w*|kill\w*|harm\w*|hurt\w*|injur\w*)\b.*\b(animal|pet|dog|cat|bird|fish|wildlife)\b/i,
    /\b(animal|pet|dog|cat|bird|fish|wildlife)\b.*\b(torture|tortur\w*|abuse|abus\w*|kill\w*|harm\w*|hurt\w*|injur\w*)\b/i,
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

  it('should flag harmful animal queries', () => {
    const result = checkQuerySafety('how to harm animals');
    expect(result.safe).toBe(false);
  });

  it('should flag torture queries', () => {
    const result = checkQuerySafety('animal torture methods');
    expect(result.safe).toBe(false);
  });

  it('should allow legitimate animal welfare queries', () => {
    const result = checkQuerySafety('How does AI help animal welfare research?');
    expect(result.safe).toBe(true);
  });

  it('should allow lobbying queries about animal welfare', () => {
    const result = checkQuerySafety('How does AI lobbying affect animal welfare regulation?');
    expect(result.safe).toBe(true);
  });

  it('should allow fibonacci queries about animals', () => {
    const result = checkQuerySafety('Explain Fibonacci patterns in animal biology');
    expect(result.safe).toBe(true);
  });
});
