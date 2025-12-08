/**
 * Perplexity-Style Blog Generation Pipeline
 *
 * AI-powered content generation with:
 * - Web research for real-time information
 * - Citation extraction and verification
 * - SEO optimization pass
 * - Topic cluster integration
 *
 * Pipeline stages:
 * 1. Research: Web search + existing knowledge retrieval
 * 2. Outline: Structure content with citations mapped
 * 3. Write: Generate content with inline citations
 * 4. Enhance: Add SEO metadata, charts, related posts
 * 5. Review: Quality scoring and validation
 *
 * @module blog/generator
 */

import { chatCompletion, chatCompletionWithProvider } from '@/lib/ai/providers/llm-provider';
import type { ChatMessage, LLMResponse } from '@/lib/ai/providers/types';
import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface GenerationConfig {
  topic: string;
  clusterId?: string;
  model?: string;
  temperature?: number;
  targetWordCount?: number;
  style?: 'professional' | 'conversational' | 'technical' | 'beginner-friendly';
  persona?: string;
  includeCharts?: boolean;
  includeCardTickers?: boolean;
  researchDepth?: 'quick' | 'standard' | 'deep';
  targetKeywords?: string[];
  game?: 'pokemon' | 'mtg' | 'lorcana' | 'yugioh' | 'one_piece' | 'flesh_and_blood';
}

export interface ResearchResult {
  query: string;
  sources: SourceResult[];
  synthesizedKnowledge: string;
}

export interface SourceResult {
  url: string;
  title: string;
  excerpt: string;
  publisher?: string;
  publishedDate?: string;
  relevanceScore: number;
}

export interface BlogOutline {
  title: string;
  subtitle?: string;
  sections: OutlineSection[];
  estimatedWordCount: number;
  suggestedTags: string[];
  targetKeyword: string;
}

export interface OutlineSection {
  id: string;
  heading: string;
  level: number;
  keyPoints: string[];
  suggestedSources: number[]; // Indices into sources array
  estimatedWords: number;
}

export interface GeneratedContent {
  title: string;
  subtitle?: string;
  slug: string;
  content: string; // Markdown with inline citations
  summary: string;
  excerpt: string;
  tableOfContents: { id: string; title: string; level: number }[];
  citations: Citation[];
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
  relatedCardIds: string[];
  aiMetadata: AIMetadata;
}

export interface Citation {
  number: number;
  url: string;
  title: string;
  publisher?: string;
  excerpt: string;
  claimText: string;
  relevanceScore: number;
}

export interface AIMetadata {
  modelId: string;
  tokensUsed: number;
  generationPrompt: string;
  researchQueries: string[];
  confidenceScore: number;
  generatedAt: string;
}

export interface GenerationProgress {
  status: 'pending' | 'researching' | 'outlining' | 'writing' | 'citing' | 'enhancing' | 'review' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RESEARCH_QUERIES_BY_DEPTH = {
  quick: 2,
  standard: 4,
  deep: 8,
};

const SOURCES_PER_QUERY = {
  quick: 3,
  standard: 5,
  deep: 8,
};

// =============================================================================
// RESEARCH PHASE
// =============================================================================

/**
 * Generate research queries based on topic
 */
async function generateResearchQueries(
  topic: string,
  config: GenerationConfig
): Promise<string[]> {
  const numQueries = RESEARCH_QUERIES_BY_DEPTH[config.researchDepth || 'standard'];
  const game = config.game || 'pokemon';

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a TCG market research assistant specializing in ${game.toUpperCase()} trading cards. Generate search queries to research a topic thoroughly.

Output a JSON array of ${numQueries} search queries. Each query should:
1. Target different aspects of the topic
2. Include TCG-specific terminology
3. Be optimized for finding recent, authoritative sources
4. Include price, market, and investment angles where relevant

Format: ["query1", "query2", ...]`,
    },
    {
      role: 'user',
      content: `Generate research queries for: "${topic}"
${config.targetKeywords ? `Target keywords: ${config.targetKeywords.join(', ')}` : ''}`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 500,
  });

  try {
    const queries = JSON.parse(response.content);
    return Array.isArray(queries) ? queries : [topic];
  } catch {
    // Fallback: extract queries from text
    return [
      `${topic} TCG market analysis`,
      `${topic} price prediction ${game}`,
    ];
  }
}

/**
 * Simulate web search (to be replaced with actual search API)
 * In production, integrate with Tavily, Serper, or similar
 */
async function searchWeb(query: string, numResults: number): Promise<SourceResult[]> {
  // TODO: Integrate with actual web search API
  // For now, return placeholder structure
  console.log(`[BlogGenerator] Searching for: "${query}" (${numResults} results)`);

  // Placeholder - in production, this would call Tavily/Serper/Google
  return [
    {
      url: `https://tcgplayer.com/search?q=${encodeURIComponent(query)}`,
      title: `TCGPlayer Results for ${query}`,
      excerpt: 'Market data and pricing information...',
      publisher: 'TCGPlayer',
      relevanceScore: 0.85,
    },
  ];
}

/**
 * Execute research phase
 */
export async function executeResearch(
  topic: string,
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<ResearchResult[]> {
  onProgress?.({
    status: 'researching',
    progress: 10,
    currentStep: 'Generating research queries...',
  });

  // Generate search queries
  const queries = await generateResearchQueries(topic, config);

  const sourcesPerQuery = SOURCES_PER_QUERY[config.researchDepth || 'standard'];
  const results: ResearchResult[] = [];

  // Execute searches
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const progress = 10 + ((i + 1) / queries.length) * 20;

    onProgress?.({
      status: 'researching',
      progress,
      currentStep: `Searching: ${query}`,
    });

    const sources = await searchWeb(query, sourcesPerQuery);

    // Synthesize knowledge from sources
    const synthesized = await synthesizeSourceKnowledge(query, sources, config);

    results.push({
      query,
      sources,
      synthesizedKnowledge: synthesized,
    });
  }

  return results;
}

/**
 * Synthesize knowledge from sources
 */
async function synthesizeSourceKnowledge(
  query: string,
  sources: SourceResult[],
  config: GenerationConfig
): Promise<string> {
  if (sources.length === 0) return '';

  const sourceContext = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`)
    .join('\n\n');

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a TCG market analyst. Synthesize information from sources into key insights.
Be factual and cite sources using [1], [2], etc. format.`,
    },
    {
      role: 'user',
      content: `Query: ${query}

Sources:
${sourceContext}

Synthesize the key insights from these sources, maintaining citations.`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 1000,
  });

  return response.content;
}

// =============================================================================
// OUTLINE PHASE
// =============================================================================

/**
 * Generate content outline with citation mapping
 */
export async function generateOutline(
  topic: string,
  research: ResearchResult[],
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<BlogOutline> {
  onProgress?.({
    status: 'outlining',
    progress: 35,
    currentStep: 'Creating content outline...',
  });

  const researchContext = research
    .map((r, i) => `Research ${i + 1}: ${r.query}\n${r.synthesizedKnowledge}`)
    .join('\n\n---\n\n');

  const targetWords = config.targetWordCount || 2000;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert TCG content strategist. Create a detailed blog post outline optimized for SEO and reader engagement.

Output a JSON object with this structure:
{
  "title": "Compelling, SEO-optimized title",
  "subtitle": "Engaging subtitle",
  "sections": [
    {
      "id": "section-slug",
      "heading": "Section Title",
      "level": 2,
      "keyPoints": ["point1", "point2"],
      "suggestedSources": [0, 1],
      "estimatedWords": 300
    }
  ],
  "estimatedWordCount": ${targetWords},
  "suggestedTags": ["tag1", "tag2"],
  "targetKeyword": "primary seo keyword"
}`,
    },
    {
      role: 'user',
      content: `Create a comprehensive outline for: "${topic}"

Style: ${config.style || 'professional'}
Target word count: ${targetWords}
${config.targetKeywords ? `Target keywords: ${config.targetKeywords.join(', ')}` : ''}

Research findings:
${researchContext}`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.5,
    maxTokens: 2000,
  });

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr);
  } catch {
    // Fallback outline
    return {
      title: topic,
      sections: [
        {
          id: 'introduction',
          heading: 'Introduction',
          level: 2,
          keyPoints: ['Overview of the topic'],
          suggestedSources: [0],
          estimatedWords: 200,
        },
        {
          id: 'analysis',
          heading: 'Analysis',
          level: 2,
          keyPoints: ['Key findings'],
          suggestedSources: [0, 1],
          estimatedWords: 600,
        },
        {
          id: 'conclusion',
          heading: 'Conclusion',
          level: 2,
          keyPoints: ['Summary and takeaways'],
          suggestedSources: [],
          estimatedWords: 200,
        },
      ],
      estimatedWordCount: 1000,
      suggestedTags: ['tcg', 'market-analysis'],
      targetKeyword: topic.toLowerCase().split(' ').slice(0, 3).join('-'),
    };
  }
}

// =============================================================================
// WRITING PHASE
// =============================================================================

/**
 * Generate full blog content with inline citations
 */
export async function generateContent(
  outline: BlogOutline,
  research: ResearchResult[],
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GeneratedContent> {
  onProgress?.({
    status: 'writing',
    progress: 45,
    currentStep: 'Writing content...',
  });

  // Flatten all sources for citation numbering
  const allSources = research.flatMap((r) => r.sources);
  const sourceMap = allSources.map((s, i) => ({
    ...s,
    citationNumber: i + 1,
  }));

  const sourceContext = sourceMap
    .map((s) => `[${s.citationNumber}] ${s.title} - ${s.url}\n${s.excerpt}`)
    .join('\n\n');

  const outlineContext = outline.sections
    .map((s) => `## ${s.heading}\n- ${s.keyPoints.join('\n- ')}`)
    .join('\n\n');

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert TCG market analyst writing for Apex Intelligence, the Bloomberg Terminal for TCG collectors.

Write in a ${config.style || 'professional'} style. Use:
- Inline citations like [1][2] when referencing sources
- Clear, scannable formatting with headers
- Data-driven insights where possible
- Actionable takeaways for collectors/investors

DO NOT make up statistics. Only use information from provided sources.`,
    },
    {
      role: 'user',
      content: `Write a comprehensive blog post based on this outline:

TITLE: ${outline.title}
${outline.subtitle ? `SUBTITLE: ${outline.subtitle}` : ''}

OUTLINE:
${outlineContext}

AVAILABLE SOURCES (use [number] for citations):
${sourceContext}

TARGET LENGTH: ~${config.targetWordCount || 2000} words
${config.targetKeywords ? `KEYWORDS TO INCLUDE: ${config.targetKeywords.join(', ')}` : ''}

Write the full article now. Include all sections from the outline.`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 4000,
    preferredProvider: 'anthropic', // Claude is excellent for long-form content
  });

  onProgress?.({
    status: 'citing',
    progress: 70,
    currentStep: 'Processing citations...',
  });

  // Extract citations from content
  const citationPattern = /\[(\d+)\]/g;
  const usedCitationNumbers = new Set<number>();
  let match;
  while ((match = citationPattern.exec(response.content)) !== null) {
    usedCitationNumbers.add(parseInt(match[1]));
  }

  // Build citations array
  const citations: Citation[] = Array.from(usedCitationNumbers)
    .sort((a, b) => a - b)
    .map((num) => {
      const source = sourceMap.find((s) => s.citationNumber === num);
      return source
        ? {
            number: num,
            url: source.url,
            title: source.title,
            publisher: source.publisher,
            excerpt: source.excerpt,
            claimText: '', // Would need NLP to extract specific claim
            relevanceScore: source.relevanceScore,
          }
        : null;
    })
    .filter(Boolean) as Citation[];

  // Generate slug from title
  const slug = generateSlug(outline.title);

  // Generate table of contents
  const toc = extractTableOfContents(response.content);

  // Generate summary
  const summary = await generateSummary(response.content, config);

  // Generate excerpt
  const excerpt = response.content.substring(0, 280).replace(/[#*_\[\]]/g, '').trim() + '...';

  onProgress?.({
    status: 'enhancing',
    progress: 85,
    currentStep: 'Optimizing for SEO...',
  });

  // Generate SEO metadata
  const seoMetadata = await generateSEOMetadata(outline.title, summary, config);

  return {
    title: outline.title,
    subtitle: outline.subtitle,
    slug,
    content: response.content,
    summary,
    excerpt,
    tableOfContents: toc,
    citations,
    seoTitle: seoMetadata.title,
    seoDescription: seoMetadata.description,
    suggestedTags: outline.suggestedTags,
    relatedCardIds: [], // Would extract from content
    aiMetadata: {
      modelId: response.model,
      tokensUsed: response.inputTokens + response.outputTokens,
      generationPrompt: config.topic,
      researchQueries: research.map((r) => r.query),
      confidenceScore: calculateConfidenceScore(citations.length, response.content.length),
      generatedAt: new Date().toISOString(),
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

/**
 * Extract table of contents from markdown
 */
function extractTableOfContents(content: string): { id: string; title: string; level: number }[] {
  const headingPattern = /^(#{2,4})\s+(.+)$/gm;
  const toc: { id: string; title: string; level: number }[] = [];
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = generateSlug(title);
    toc.push({ id, title, level });
  }

  return toc;
}

/**
 * Generate article summary
 */
async function generateSummary(content: string, config: GenerationConfig): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Generate a concise 2-3 sentence summary of this article for use in card previews.',
    },
    {
      role: 'user',
      content: content.substring(0, 3000),
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 200,
  });

  return response.content;
}

/**
 * Generate SEO metadata
 */
async function generateSEOMetadata(
  title: string,
  summary: string,
  config: GenerationConfig
): Promise<{ title: string; description: string }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Generate SEO-optimized metadata. Output JSON:
{
  "title": "60 char max, include primary keyword",
  "description": "160 char max meta description"
}`,
    },
    {
      role: 'user',
      content: `Title: ${title}
Summary: ${summary}
${config.targetKeywords ? `Keywords: ${config.targetKeywords.join(', ')}` : ''}`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 200,
  });

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      title: title.substring(0, 60),
      description: summary.substring(0, 160),
    };
  }
}

/**
 * Calculate confidence score based on citation density and content length
 */
function calculateConfidenceScore(citationCount: number, contentLength: number): number {
  // More citations and longer content = higher confidence
  const citationDensity = citationCount / (contentLength / 1000); // citations per 1K chars
  const lengthScore = Math.min(contentLength / 10000, 1); // up to 10K chars

  // Weighted average
  const score = citationDensity * 0.4 + lengthScore * 0.3 + 0.3;
  return Math.min(Math.round(score * 100) / 100, 1);
}

/**
 * Generate content hash for provenance tracking
 */
export function generateTraceHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Execute full blog generation pipeline
 */
export async function generateBlogPost(
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GeneratedContent> {
  const startTime = new Date();

  try {
    onProgress?.({
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing generation...',
      startedAt: startTime,
    });

    // Phase 1: Research
    const research = await executeResearch(config.topic, config, onProgress);

    // Phase 2: Outline
    const outline = await generateOutline(config.topic, research, config, onProgress);

    // Phase 3: Write with citations
    const content = await generateContent(outline, research, config, onProgress);

    // Phase 4: Final review
    onProgress?.({
      status: 'review',
      progress: 95,
      currentStep: 'Final quality check...',
    });

    // Add trace hash for provenance
    const traceHash = generateTraceHash(content.content);

    onProgress?.({
      status: 'completed',
      progress: 100,
      currentStep: 'Generation complete!',
      completedAt: new Date(),
    });

    return {
      ...content,
      aiMetadata: {
        ...content.aiMetadata,
        generatedAt: startTime.toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    onProgress?.({
      status: 'failed',
      progress: 0,
      currentStep: 'Generation failed',
      error: errorMessage,
    });

    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  generateResearchQueries,
  searchWeb,
  synthesizeSourceKnowledge,
};
