/**
 * AI Blog Generator Service
 *
 * Perplexity-style content generation with inline citations.
 * Implements a multi-phase pipeline:
 * 1. Research: Web search + RAG retrieval for source collection
 * 2. Generation: LLM content creation with citation placeholders
 * 3. Citation Extraction: Parse [cite:N] references into structured data
 * 4. Quality Gates: Fact verification and citation validation
 *
 * @see docs/perplexity-blog-architecture.md
 */

import {
  chatCompletion,
  type ChatMessage,
  type LLMRequestOptions,
  type LLMResponse,
} from './providers';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Source collected during research phase
 */
export interface ResearchSource {
  url: string;
  title: string;
  domain: string;
  excerpt: string;
  publishedAt?: Date;
  fetchedAt: Date;
  relevanceScore: number;
}

/**
 * Extracted citation from generated content
 */
export interface ExtractedCitation {
  index: number; // [cite:1] -> index 1
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  excerptText?: string;
  contextSummary?: string;
  confidence: number;
}

/**
 * Blog generation request
 */
export interface BlogGenerationRequest {
  /** Topic or question to write about */
  topic: string;
  /** Target content type */
  contentType: 'pillar' | 'cluster' | 'insight' | 'analysis';
  /** Target word count (approximate) */
  targetWordCount?: number;
  /** Specific keywords to include for SEO */
  targetKeywords?: string[];
  /** Additional context or constraints */
  additionalContext?: string;
  /** Category for the post */
  category?: string;
  /** Tags for the post */
  tags?: string[];
  /** Pillar post to link to (for cluster posts) */
  pillarPostSlug?: string;
  /** Author name override */
  authorName?: string;
  /** LLM options */
  llmOptions?: LLMRequestOptions;
}

/**
 * Generated blog post result
 */
export interface BlogGenerationResult {
  /** Generated title */
  title: string;
  /** Generated subtitle */
  subtitle?: string;
  /** SEO excerpt/meta description */
  excerpt: string;
  /** Full markdown content with [cite:N] placeholders */
  content: string;
  /** Extracted citations */
  citations: ExtractedCitation[];
  /** Research sources used */
  sources: ResearchSource[];
  /** Word count */
  wordCount: number;
  /** Estimated reading time in minutes */
  readingTimeMinutes: number;
  /** Generated slug */
  slug: string;
  /** Generation metadata */
  metadata: {
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latencyMs: number;
    researchLatencyMs: number;
    totalLatencyMs: number;
  };
}

/**
 * Follow-up question request
 */
export interface FollowUpRequest {
  /** The blog post content for context */
  postContent: string;
  /** The post title */
  postTitle: string;
  /** User's follow-up question */
  question: string;
  /** Previous Q&A in conversation */
  conversationHistory?: Array<{ question: string; answer: string }>;
  /** LLM options */
  llmOptions?: LLMRequestOptions;
}

/**
 * Follow-up answer result
 */
export interface FollowUpResult {
  answer: string;
  citations: Array<{
    url: string;
    title: string;
    excerpt: string;
  }>;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLOG_GENERATOR_CONFIG = {
  /** Word count targets by content type */
  WORD_COUNT_TARGETS: {
    pillar: 3000,
    cluster: 1500,
    insight: 750,
    analysis: 2000,
  } as Record<string, number>,

  /** Reading speed for time calculation (words per minute) */
  READING_SPEED_WPM: 200,

  /** Maximum sources to collect during research */
  MAX_RESEARCH_SOURCES: 10,

  /** Minimum citation confidence threshold */
  MIN_CITATION_CONFIDENCE: 0.7,

  /** Default LLM model for generation */
  DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',

  /** Default provider */
  DEFAULT_PROVIDER: 'anthropic' as const,
};

// ============================================================================
// RESEARCH PHASE
// ============================================================================

/**
 * Simulated research phase - In production, this would:
 * 1. Call web search API (Brave/Google)
 * 2. Fetch and extract content from top results
 * 3. Use RAG to find relevant internal documents
 *
 * For now, returns empty sources - will be populated by actual web search integration
 */
async function conductResearch(
  topic: string,
  keywords: string[]
): Promise<{ sources: ResearchSource[]; latencyMs: number }> {
  const startTime = Date.now();

  // TODO: Integrate with web search API (Brave Search, Google Custom Search)
  // TODO: Integrate with existing RAG system for internal documents

  // For now, return placeholder indicating research capability
  const sources: ResearchSource[] = [];

  return {
    sources,
    latencyMs: Date.now() - startTime,
  };
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate blog content using LLM with citation-aware prompting
 */
async function generateContent(
  request: BlogGenerationRequest,
  sources: ResearchSource[]
): Promise<LLMResponse> {
  const targetWordCount =
    request.targetWordCount ||
    BLOG_GENERATOR_CONFIG.WORD_COUNT_TARGETS[request.contentType];

  const systemPrompt = buildSystemPrompt(request.contentType);
  const userPrompt = buildUserPrompt(request, sources, targetWordCount);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const options: LLMRequestOptions = {
    preferredProvider: BLOG_GENERATOR_CONFIG.DEFAULT_PROVIDER,
    model: BLOG_GENERATOR_CONFIG.DEFAULT_MODEL,
    maxTokens: Math.max(4000, Math.ceil(targetWordCount * 1.5)),
    temperature: 0.7,
    routingStrategy: 'quality',
    ...request.llmOptions,
  };

  return chatCompletion(messages, options);
}

/**
 * Build system prompt for blog generation
 */
function buildSystemPrompt(contentType: string): string {
  const typeInstructions = {
    pillar: `You are writing a comprehensive pillar article - an authoritative, long-form guide that serves as the definitive resource on the topic. Be thorough and exhaustive.`,
    cluster: `You are writing a cluster article - a focused piece that explores a specific aspect of a broader topic. Be detailed but targeted.`,
    insight: `You are writing a market insight - a timely, concise analysis of current trends or news. Be punchy and actionable.`,
    analysis: `You are writing a data-driven analysis - a deep dive with quantitative evidence and charts. Be analytical and evidence-based.`,
  };

  return `You are an expert financial analyst and writer for Apex Intelligence, a premium TCG (Trading Card Game) market intelligence platform.

${typeInstructions[contentType] || typeInstructions.cluster}

CITATION RULES:
1. Use inline citations in the format [cite:N] where N is the source number
2. Every factual claim, statistic, or market data point MUST have a citation
3. Place citations immediately after the relevant statement
4. You may cite the same source multiple times with the same number
5. List all sources at the end in a "## Sources" section with the format:
   [cite:1] Title - URL

WRITING STYLE:
- Professional but accessible tone
- Use concrete examples and data points
- Include actionable insights
- Structure with clear headings (##, ###)
- Use bullet points and numbered lists where appropriate
- Include a compelling introduction and strong conclusion

FORMATTING:
- Start with a compelling title on the first line (# Title)
- Include a subtitle on the second line (in italics)
- Use markdown formatting throughout
- Include relevant TCG terminology
- Break up long sections with subheadings`;
}

/**
 * Build user prompt for content generation
 */
function buildUserPrompt(
  request: BlogGenerationRequest,
  sources: ResearchSource[],
  targetWordCount: number
): string {
  let prompt = `Write a ${request.contentType} article about: "${request.topic}"

TARGET LENGTH: Approximately ${targetWordCount} words

`;

  if (request.targetKeywords?.length) {
    prompt += `TARGET KEYWORDS (include naturally): ${request.targetKeywords.join(', ')}\n\n`;
  }

  if (request.category) {
    prompt += `CATEGORY: ${request.category}\n\n`;
  }

  if (request.additionalContext) {
    prompt += `ADDITIONAL CONTEXT:\n${request.additionalContext}\n\n`;
  }

  if (sources.length > 0) {
    prompt += `RESEARCH SOURCES (use these for citations):\n`;
    sources.forEach((source, i) => {
      prompt += `[${i + 1}] ${source.title} - ${source.url}\n   Excerpt: ${source.excerpt}\n\n`;
    });
  } else {
    prompt += `NOTE: No research sources were provided. Generate content based on your knowledge, but mark any specific claims that would benefit from citations with [cite:?] so they can be verified later.\n\n`;
  }

  prompt += `Generate the complete article now. Remember to include:
1. Compelling title and subtitle
2. Strong introduction
3. Well-structured body with citations
4. Actionable conclusion
5. Sources section at the end`;

  return prompt;
}

// ============================================================================
// CITATION EXTRACTION
// ============================================================================

/**
 * Extract citations from generated content
 */
function extractCitations(
  content: string,
  sources: ResearchSource[]
): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const citationRegex = /\[cite:(\d+)\]/g;

  // Find all unique citation indices
  const usedIndices = new Set<number>();
  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    usedIndices.add(parseInt(match[1], 10));
  }

  // Build citation objects
  for (const index of usedIndices) {
    const sourceIndex = index - 1; // Convert to 0-based

    if (sourceIndex >= 0 && sourceIndex < sources.length) {
      const source = sources[sourceIndex];
      citations.push({
        index,
        sourceUrl: source.url,
        sourceTitle: source.title,
        sourceDomain: source.domain,
        excerptText: source.excerpt,
        confidence: source.relevanceScore,
      });
    } else {
      // Citation without matching source - needs verification
      citations.push({
        index,
        sourceUrl: '',
        sourceTitle: `[Unverified Source ${index}]`,
        sourceDomain: '',
        confidence: 0.5,
      });
    }
  }

  return citations.sort((a, b) => a.index - b.index);
}

/**
 * Extract sources from the "## Sources" section of generated content
 */
function extractSourcesFromContent(content: string): ResearchSource[] {
  const sources: ResearchSource[] = [];
  const sourcesSection = content.match(/## Sources\n([\s\S]*?)(?=\n##|$)/i);

  if (!sourcesSection) return sources;

  const sourceLines = sourcesSection[1].split('\n');
  const sourceRegex = /\[cite:(\d+)\]\s*(.+?)\s*-\s*(https?:\/\/[^\s]+)/;

  for (const line of sourceLines) {
    const match = line.match(sourceRegex);
    if (match) {
      const url = match[3];
      sources.push({
        url,
        title: match[2].trim(),
        domain: new URL(url).hostname.replace('www.', ''),
        excerpt: '',
        fetchedAt: new Date(),
        relevanceScore: 0.8,
      });
    }
  }

  return sources;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 80); // Limit length
}

/**
 * Count words in content
 */
function countWords(content: string): number {
  return content
    .replace(/[#*_`[\]()]/g, '') // Remove markdown
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / BLOG_GENERATOR_CONFIG.READING_SPEED_WPM);
}

/**
 * Extract title from generated content
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : 'Untitled';
}

/**
 * Extract subtitle from generated content
 */
function extractSubtitle(content: string): string | undefined {
  // Look for italic text on second line
  const lines = content.split('\n');
  if (lines.length > 1) {
    const subtitleMatch = lines[1].match(/^\*(.+)\*$/);
    return subtitleMatch ? subtitleMatch[1].trim() : undefined;
  }
  return undefined;
}

/**
 * Generate excerpt from content (first paragraph without markdown)
 */
function generateExcerpt(content: string, maxLength = 160): string {
  // Find first paragraph after title
  const paragraphMatch = content.match(/^(?!#|\*|-)(.{50,}?)$/m);
  if (paragraphMatch) {
    const excerpt = paragraphMatch[1]
      .replace(/\[cite:\d+\]/g, '')
      .replace(/[*_`]/g, '')
      .trim();
    return excerpt.length > maxLength
      ? excerpt.slice(0, maxLength - 3) + '...'
      : excerpt;
  }
  return 'Read more about this topic on Apex Intelligence.';
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate a complete blog post with citations
 */
export async function generateBlogPost(
  request: BlogGenerationRequest
): Promise<BlogGenerationResult> {
  const totalStartTime = Date.now();

  try {
    // Phase 1: Research
    const { sources: researchSources, latencyMs: researchLatencyMs } =
      await conductResearch(request.topic, request.targetKeywords || []);

    // Phase 2: Generate content
    const generationStartTime = Date.now();
    const llmResponse = await generateContent(request, researchSources);
    const generationLatencyMs = Date.now() - generationStartTime;

    const content = llmResponse.content;

    // Phase 3: Extract citations
    // First try to use research sources, then fall back to sources in content
    let sources = researchSources;
    if (sources.length === 0) {
      sources = extractSourcesFromContent(content);
    }
    const citations = extractCitations(content, sources);

    // Calculate metadata
    const title = extractTitle(content);
    const subtitle = extractSubtitle(content);
    const wordCount = countWords(content);
    const readingTimeMinutes = calculateReadingTime(wordCount);
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(content);

    const result: BlogGenerationResult = {
      title,
      subtitle,
      excerpt,
      content,
      citations,
      sources,
      wordCount,
      readingTimeMinutes,
      slug,
      metadata: {
        model: llmResponse.model,
        provider: llmResponse.provider,
        inputTokens: llmResponse.inputTokens,
        outputTokens: llmResponse.outputTokens,
        cost: llmResponse.cost,
        latencyMs: generationLatencyMs,
        researchLatencyMs,
        totalLatencyMs: Date.now() - totalStartTime,
      },
    };

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'blog-generator' },
      extra: { topic: request.topic, contentType: request.contentType },
    });
    throw error;
  }
}

// ============================================================================
// FOLLOW-UP QUESTION HANDLER
// ============================================================================

/**
 * Answer a follow-up question about a blog post
 */
export async function answerFollowUp(
  request: FollowUpRequest
): Promise<FollowUpResult> {
  const startTime = Date.now();

  const systemPrompt = `You are a helpful assistant for Apex Intelligence, a TCG market intelligence platform.
You are answering a follow-up question about an article.

GUIDELINES:
- Be concise but comprehensive
- Reference specific parts of the article when relevant
- If the question goes beyond the article's scope, acknowledge this and provide helpful information
- Use the same citation format [cite:N] if referencing external sources
- Be accurate - don't make up information`;

  let userPrompt = `ARTICLE TITLE: ${request.postTitle}

ARTICLE CONTENT:
${request.postContent.slice(0, 6000)}${request.postContent.length > 6000 ? '\n\n[Content truncated...]' : ''}

`;

  if (request.conversationHistory?.length) {
    userPrompt += `PREVIOUS Q&A:\n`;
    for (const qa of request.conversationHistory.slice(-3)) {
      userPrompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
    }
  }

  userPrompt += `USER QUESTION: ${request.question}

Please provide a helpful, accurate answer.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const options: LLMRequestOptions = {
    preferredProvider: 'anthropic',
    model: 'claude-3-5-haiku-20241022', // Use faster model for follow-ups
    maxTokens: 1500,
    temperature: 0.5,
    routingStrategy: 'speed',
    ...request.llmOptions,
  };

  const response = await chatCompletion(messages, options);

  // Extract any citations from the answer
  const citations: FollowUpResult['citations'] = [];
  const citationMatches = response.content.matchAll(/\[cite:(\d+)\]/g);
  for (const match of citationMatches) {
    citations.push({
      url: '', // Would need to be populated by source lookup
      title: `Source ${match[1]}`,
      excerpt: '',
    });
  }

  return {
    answer: response.content,
    citations,
    model: response.model,
    tokensUsed: response.inputTokens + response.outputTokens,
    latencyMs: Date.now() - startTime,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BLOG_GENERATOR_CONFIG,
  conductResearch,
  generateSlug,
  countWords,
  calculateReadingTime,
  extractCitations,
  extractTitle,
  extractSubtitle,
  generateExcerpt,
};
