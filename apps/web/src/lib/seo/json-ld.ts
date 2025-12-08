/**
 * JSON-LD Schema Generator for AI/LLM Discoverability (LLMO)
 *
 * This module generates structured data specifically designed for:
 * - AI Agents (ChatGPT, Claude, Grok, Gemini)
 * - Search Engine Rich Results
 * - RAG (Retrieval-Augmented Generation) systems
 *
 * Key Features:
 * - Schema.org NewsArticle/TechArticle compliance
 * - Citation mapping for source verification
 * - Freshness signals via dateModified
 * - Token-efficient structure for AI consumption
 *
 * @module lib/seo/json-ld
 */

import type { BlogPost, BlogPostSource, BlogPostFrontmatter } from '@/lib/mdx';

// ============================================================================
// TYPES
// ============================================================================

export interface ArticleSchemaOptions {
  /** Base URL for the site (defaults to NEXT_PUBLIC_BASE_URL or https://apexintelligence.io) */
  baseUrl?: string;
  /** Include organization schema in author field */
  includeOrganizationAuthor?: boolean;
}

export interface ArticleSchema {
  '@context': string;
  '@type': string | string[];
  '@id': string;
  headline: string;
  description: string;
  author: AuthorSchema | AuthorSchema[];
  publisher: PublisherSchema;
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: MainEntitySchema;
  image: ImageSchema;
  articleSection: string;
  keywords: string;
  wordCount: number;
  citation?: CitationSchema[];
  isAccessibleForFree: boolean;
  inLanguage: string;
  copyrightYear: number;
  copyrightHolder: OrganizationSchema;
  about?: AboutSchema[];
}

interface AuthorSchema {
  '@type': 'Person' | 'Organization';
  name: string;
  url?: string;
  jobTitle?: string;
}

interface PublisherSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: ImageSchema;
  sameAs?: string[];
}

interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
  url: string;
}

interface MainEntitySchema {
  '@type': 'WebPage';
  '@id': string;
}

interface ImageSchema {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

interface CitationSchema {
  '@type': 'CreativeWork';
  name: string;
  url?: string;
  publisher?: string;
  dateAccessed?: string;
  isPartOf?: {
    '@type': string;
    name: string;
  };
}

interface AboutSchema {
  '@type': 'Thing';
  name: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BASE_URL = 'https://apexintelligence.io';

const APEX_PUBLISHER: PublisherSchema = {
  '@type': 'Organization',
  name: 'Apex Intelligence',
  url: DEFAULT_BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${DEFAULT_BASE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://twitter.com/apexintelai',
    'https://github.com/apex-intelligence',
  ],
};

const APEX_COPYRIGHT_HOLDER: OrganizationSchema = {
  '@type': 'Organization',
  name: 'Apex Intelligence',
  url: DEFAULT_BASE_URL,
};

// ============================================================================
// MAIN SCHEMA GENERATOR
// ============================================================================

/**
 * Generate a comprehensive JSON-LD schema for blog articles
 *
 * Designed for maximum AI discoverability:
 * - Uses NewsArticle (preferred by Google) with TechArticle for technical content
 * - Maps citations to verifiable sources
 * - Includes freshness signals (datePublished, dateModified)
 * - Structured for token-efficient AI consumption
 *
 * @param post - Blog post data from MDX
 * @param slug - URL slug for the post
 * @param options - Configuration options
 * @returns Complete JSON-LD schema object
 *
 * @example
 * ```tsx
 * const schema = generateArticleSchema(post, 'market-analysis-q1-2026');
 * // Use in Next.js page:
 * <script type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 * />
 * ```
 */
export function generateArticleSchema(
  post: BlogPost,
  slug: string,
  options: ArticleSchemaOptions = {}
): ArticleSchema {
  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
  const frontmatter = post.frontmatter;
  const publishDate = frontmatter.date || new Date().toISOString();
  const currentYear = new Date(publishDate).getFullYear();

  // Determine article type based on tags
  const articleType = determineArticleType(frontmatter.tags);

  // Build author schema
  const author = buildAuthorSchema(frontmatter, baseUrl, options.includeOrganizationAuthor);

  // Build citation schemas from sources
  const citations = buildCitationSchemas(frontmatter);

  // Build about/topic schemas from tags
  const aboutTopics = buildAboutSchemas(frontmatter.tags);

  // Build image schema
  const imageUrl = frontmatter.hero
    ? `${baseUrl}${frontmatter.hero}`
    : `${baseUrl}/api/og?slug=${slug}`;

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': articleType,
    '@id': `${baseUrl}/blog/${slug}#article`,
    headline: frontmatter.title,
    description: frontmatter.seoDescription || frontmatter.description || '',
    author,
    publisher: {
      ...APEX_PUBLISHER,
      url: baseUrl,
      logo: {
        ...APEX_PUBLISHER.logo,
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: publishDate,
    dateModified: publishDate, // Update this if you track modifications
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${slug}`,
    },
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    articleSection: determineArticleSection(frontmatter.tags),
    keywords: frontmatter.tags?.join(', ') || '',
    wordCount: post.readingTime?.words || 0,
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    copyrightYear: currentYear,
    copyrightHolder: {
      ...APEX_COPYRIGHT_HOLDER,
      url: baseUrl,
    },
  };

  // Add citations if available
  if (citations.length > 0) {
    schema.citation = citations;
  }

  // Add about topics if available
  if (aboutTopics.length > 0) {
    schema.about = aboutTopics;
  }

  return schema;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine the appropriate Schema.org article type based on tags
 */
function determineArticleType(tags?: string[]): string | string[] {
  if (!tags || tags.length === 0) {
    return 'NewsArticle';
  }

  const tagsLower = tags.map((t) => t.toLowerCase());

  // Technical content
  if (
    tagsLower.some((t) =>
      ['guide', 'tutorial', 'how-to', 'walkthrough', 'technical'].includes(t)
    )
  ) {
    return ['TechArticle', 'NewsArticle'];
  }

  // Research/Analysis
  if (
    tagsLower.some((t) =>
      ['research', 'analysis', 'study', 'institutional-research'].includes(t)
    )
  ) {
    return ['ScholarlyArticle', 'NewsArticle'];
  }

  return 'NewsArticle';
}

/**
 * Determine article section from tags
 */
function determineArticleSection(tags?: string[]): string {
  if (!tags || tags.length === 0) {
    return 'Market Intelligence';
  }

  const tagsLower = tags.map((t) => t.toLowerCase());

  if (tagsLower.includes('market-analysis')) return 'Market Analysis';
  if (tagsLower.includes('research')) return 'Research';
  if (tagsLower.includes('guide') || tagsLower.includes('tutorial'))
    return 'Guides';
  if (tagsLower.includes('tools')) return 'Tools';
  if (tagsLower.includes('pokemon')) return 'Pokemon TCG';
  if (tagsLower.includes('mtg')) return 'Magic: The Gathering';
  if (tagsLower.includes('one-piece')) return 'One Piece TCG';
  if (tagsLower.includes('lorcana')) return 'Disney Lorcana';

  return 'Market Intelligence';
}

/**
 * Build author schema with optional organization
 */
function buildAuthorSchema(
  frontmatter: BlogPostFrontmatter,
  baseUrl: string,
  includeOrg?: boolean
): AuthorSchema | AuthorSchema[] {
  const authorName = frontmatter.author || 'Apex Intelligence Research Team';
  const isTeam = authorName.toLowerCase().includes('team');

  const primaryAuthor: AuthorSchema = {
    '@type': isTeam ? 'Organization' : 'Person',
    name: authorName,
    url: `${baseUrl}/about`,
    ...(frontmatter.authorRole && !isTeam && { jobTitle: frontmatter.authorRole }),
  };

  if (includeOrg && !isTeam) {
    return [
      primaryAuthor,
      {
        '@type': 'Organization',
        name: 'Apex Intelligence',
        url: baseUrl,
      },
    ];
  }

  return primaryAuthor;
}

/**
 * Build citation schemas from blog post sources
 *
 * Maps the citations/sources from frontmatter to Schema.org CreativeWork
 * This tells AI models: "This is not hallucinated; here is the proof."
 */
function buildCitationSchemas(frontmatter: BlogPostFrontmatter): CitationSchema[] {
  const sources: BlogPostSource[] = [
    ...(frontmatter.citationList || []),
    ...(frontmatter.sources || []),
  ];

  if (sources.length === 0) {
    return [];
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const uniqueSources = sources.filter((source) => {
    if (seen.has(source.name)) return false;
    seen.add(source.name);
    return true;
  });

  return uniqueSources.map((source) => {
    const citation: CitationSchema = {
      '@type': 'CreativeWork',
      name: source.name,
    };

    if (source.url) {
      citation.url = source.url;
    }

    if (source.publisher) {
      citation.publisher = source.publisher;
    }

    if (source.accessed) {
      citation.dateAccessed = source.accessed;
    }

    return citation;
  });
}

/**
 * Build about/topic schemas from tags for semantic classification
 */
function buildAboutSchemas(tags?: string[]): AboutSchema[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  // Map tags to semantic topics
  const topicMap: Record<string, string> = {
    pokemon: 'Pokemon Trading Card Game',
    mtg: 'Magic: The Gathering',
    'one-piece': 'One Piece Card Game',
    lorcana: 'Disney Lorcana',
    'market-analysis': 'Market Analysis',
    research: 'Investment Research',
    grading: 'Card Grading',
    psa: 'Professional Sports Authenticator',
    bgc: 'Beckett Grading Services',
    cgc: 'Certified Guaranty Company',
    vintage: 'Vintage Collectibles',
    investing: 'Alternative Investments',
    portfolio: 'Portfolio Management',
  };

  return tags
    .map((tag) => {
      const normalizedTag = tag.toLowerCase();
      const displayName = topicMap[normalizedTag] || tag;
      return {
        '@type': 'Thing' as const,
        name: displayName,
      };
    })
    .slice(0, 5); // Limit to 5 most relevant topics
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render JSON-LD schema to string for script tag injection
 *
 * @param schema - JSON-LD schema object
 * @returns Minified JSON string
 */
export function renderJsonLd(schema: ArticleSchema): string {
  return JSON.stringify(schema);
}

/**
 * Generate a simplified schema for API responses
 * Token-efficient format for AI consumption
 */
export function generateMinimalArticleSchema(
  post: BlogPost,
  slug: string,
  baseUrl: string = DEFAULT_BASE_URL
): Record<string, unknown> {
  const frontmatter = post.frontmatter;
  const sources = [
    ...(frontmatter.citationList || []),
    ...(frontmatter.sources || []),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: frontmatter.title,
    description: frontmatter.seoDescription || frontmatter.description,
    author: frontmatter.author || 'Apex Intelligence Research Team',
    datePublished: frontmatter.date,
    url: `${baseUrl}/blog/${slug}`,
    keywords: frontmatter.tags?.join(', '),
    citation: sources.map((s) => s.name),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  AuthorSchema,
  PublisherSchema,
  CitationSchema,
  ImageSchema,
  MainEntitySchema,
  AboutSchema,
};
