/**
 * LLMO (Large Language Model Optimization) Utilities
 *
 * JSON-LD structured data generation optimized for AI crawlers
 * like ChatGPT, Grok, Perplexity, and traditional search engines.
 *
 * Implements comprehensive Schema.org vocabulary for:
 * - Article (with citations, topic clusters, and expertise signals)
 * - Organization (publisher identity and authority)
 * - BreadcrumbList (navigation context)
 * - FAQPage (question-answer content)
 * - WebSite (site-level search and identity)
 * - ItemList (content collections)
 *
 * @see https://schema.org/Article
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import type {
  BlogPost,
  BlogCluster,
  BlogPostCitation,
  BlogPostAuthor,
  BlogPostSeoData,
} from '@apex/db/schema';

// =============================================================================
// Types
// =============================================================================

export interface BlogPostWithCluster extends BlogPost {
  cluster: BlogCluster | null;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LLMOConfig {
  baseUrl: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  organizationName: string;
  socialProfiles?: string[];
  contactEmail?: string;
  foundingDate?: string;
}

// Default configuration for Apex Intelligence
export const defaultLLMOConfig: LLMOConfig = {
  baseUrl: 'https://apexintelligence.dev',
  siteName: 'Apex Intelligence',
  siteDescription:
    'Advanced trading card market intelligence platform providing AI-powered pricing, grading predictions, and market analysis for Pokemon, MTG, and sports cards.',
  logoUrl: '/logo.png',
  organizationName: 'Apex Intelligence',
  socialProfiles: [
    'https://twitter.com/apexintelligence',
    'https://github.com/apex-intelligence',
  ],
  foundingDate: '2024',
};

// =============================================================================
// Organization Schema
// =============================================================================

/**
 * Generate Organization schema for publisher identity
 *
 * Establishes entity authority and trust signals for LLMs.
 */
export function generateOrganizationSchema(
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${config.baseUrl}/#organization`,
    name: config.organizationName,
    url: config.baseUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${config.baseUrl}/#logo`,
      url: `${config.baseUrl}${config.logoUrl}`,
      contentUrl: `${config.baseUrl}${config.logoUrl}`,
      caption: config.organizationName,
    },
    image: {
      '@id': `${config.baseUrl}/#logo`,
    },
    description: config.siteDescription,
    ...(config.socialProfiles &&
      config.socialProfiles.length > 0 && {
        sameAs: config.socialProfiles,
      }),
    ...(config.contactEmail && {
      contactPoint: {
        '@type': 'ContactPoint',
        email: config.contactEmail,
        contactType: 'customer service',
      },
    }),
    ...(config.foundingDate && {
      foundingDate: config.foundingDate,
    }),
  };
}

// =============================================================================
// WebSite Schema
// =============================================================================

/**
 * Generate WebSite schema for site-level identity
 *
 * Helps LLMs understand site structure and search capabilities.
 */
export function generateWebSiteSchema(
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.baseUrl}/#website`,
    url: config.baseUrl,
    name: config.siteName,
    description: config.siteDescription,
    publisher: {
      '@id': `${config.baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };
}

// =============================================================================
// BreadcrumbList Schema
// =============================================================================

/**
 * Generate BreadcrumbList schema for navigation context
 *
 * Provides hierarchical context that helps LLMs understand
 * content relationships and site structure.
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${config.baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generate breadcrumbs for a blog post
 */
export function generateBlogPostBreadcrumbs(
  post: BlogPostWithCluster,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ];

  // Add cluster if present
  if (post.cluster) {
    items.push({
      name: post.cluster.name,
      url: `/blog/cluster/${post.cluster.slug}`,
    });
  }

  // Add current post
  items.push({
    name: post.title,
    url: `/blog/${post.slug}`,
  });

  return generateBreadcrumbSchema(items, config);
}

// =============================================================================
// Article Schema (Enhanced)
// =============================================================================

/**
 * Generate enhanced Article schema with LLMO optimizations
 *
 * Includes:
 * - Citation attribution for transparency
 * - Topic cluster relationships for authority signals
 * - Expertise indicators (author credentials)
 * - Content quality signals (word count, reading time)
 * - Pillar/cluster differentiation for content hierarchy
 */
export function generateArticleSchema(
  post: BlogPostWithCluster,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  const author = (post.author as BlogPostAuthor) || { name: 'Apex Intelligence Team' };
  const citations = (post.citations as BlogPostCitation[]) || [];
  const seoData = post.seoData as BlogPostSeoData | null;
  const tags = (post.tags as string[]) || [];

  // Determine article type based on post type
  const articleType = post.postType === 'pillar' ? 'Article' : 'BlogPosting';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': articleType,
    '@id': `${config.baseUrl}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt || '',
    articleBody: post.content,

    // Author with expertise signals
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.role && { jobTitle: author.role }),
      ...(author.bio && { description: author.bio }),
      ...(author.avatar && { image: author.avatar }),
    },

    // Publisher reference
    publisher: {
      '@id': `${config.baseUrl}/#organization`,
    },

    // Dates
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),

    // Main entity reference
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.baseUrl}/blog/${post.slug}`,
    },

    // Image
    image: post.heroImage
      ? `${config.baseUrl}${post.heroImage}`
      : seoData?.ogImage || `${config.baseUrl}/api/og?slug=${post.slug}`,

    // Content categorization
    articleSection: post.cluster?.name || 'Market Analysis',
    keywords: tags.join(', '),

    // Content quality signals
    wordCount: post.wordCount || 0,
    timeRequired: `PT${post.readingTimeMinutes || 5}M`,

    // Language
    inLanguage: 'en-US',
  };

  // Add citation information for transparency and LLM attribution
  if (citations.length > 0) {
    schema.citation = citations.map((citation) => ({
      '@type': 'CreativeWork',
      name: citation.source,
      url: citation.url,
      ...(citation.publisher && {
        publisher: {
          '@type': 'Organization',
          name: citation.publisher,
        },
      }),
      ...(citation.accessedAt && { dateAccessed: citation.accessedAt }),
      ...(citation.quote && { text: citation.quote }),
    }));
  }

  // Add cluster/topic relationship for content hierarchy
  if (post.cluster) {
    schema.isPartOf = {
      '@type': 'CreativeWorkSeries',
      '@id': `${config.baseUrl}/blog/cluster/${post.cluster.slug}#series`,
      name: post.cluster.name,
      description: post.cluster.description,
      url: `${config.baseUrl}/blog/cluster/${post.cluster.slug}`,
    };
  }

  // Mark pillar posts as comprehensive guides
  if (post.postType === 'pillar') {
    schema.learningResourceType = 'comprehensive guide';
    schema.educationalLevel = 'intermediate';
  }

  // Add about topics based on tags
  if (tags.length > 0) {
    schema.about = tags.map((tag) => ({
      '@type': 'Thing',
      name: tag,
    }));
  }

  return schema;
}

// =============================================================================
// FAQPage Schema
// =============================================================================

/**
 * Generate FAQPage schema for question-answer content
 *
 * LLMs heavily weight FAQ structured data for direct answers.
 */
export function generateFAQSchema(
  faqs: FAQItem[],
  pageUrl: string,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${config.baseUrl}${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Extract FAQ items from content
 *
 * Parses markdown content for FAQ sections marked with
 * ## FAQ or ## Frequently Asked Questions headers.
 */
export function extractFAQsFromContent(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Look for FAQ section
  const faqSectionMatch = content.match(
    /##\s*(?:FAQ|Frequently Asked Questions)\s*\n([\s\S]*?)(?=\n##\s|$)/i
  );

  if (!faqSectionMatch) return faqs;

  const faqContent = faqSectionMatch[1];

  // Parse Q&A pairs (### Question format)
  const qaPairs = faqContent.matchAll(
    /###\s*(.+?)\s*\n([\s\S]*?)(?=\n###\s|$)/g
  );

  for (const match of qaPairs) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  // Also try bold question format (**Question?**)
  if (faqs.length === 0) {
    const boldQA = faqContent.matchAll(
      /\*\*(.+?\?)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/g
    );

    for (const match of boldQA) {
      const question = match[1].trim();
      const answer = match[2].trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  return faqs;
}

// =============================================================================
// ItemList Schema (for Blog Index)
// =============================================================================

/**
 * Generate ItemList schema for blog index pages
 *
 * Helps LLMs understand content collections and rankings.
 */
export function generateBlogIndexSchema(
  posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
  }>,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${config.baseUrl}/blog#list`,
    name: 'Blog Articles',
    description: 'Latest articles about trading card market intelligence and analysis',
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${config.baseUrl}/blog/${post.slug}`,
      name: post.title,
      description: post.excerpt || '',
    })),
  };
}

// =============================================================================
// CollectionPage Schema (for Cluster Pages)
// =============================================================================

/**
 * Generate CollectionPage schema for topic cluster pages
 *
 * Establishes topical authority through content organization.
 */
export function generateClusterPageSchema(
  cluster: BlogCluster,
  posts: Array<{
    title: string;
    slug: string;
    postType: string;
  }>,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  const pillarPost = posts.find((p) => p.postType === 'pillar');
  const clusterPosts = posts.filter((p) => p.postType !== 'pillar');

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${config.baseUrl}/blog/cluster/${cluster.slug}#collection`,
    name: cluster.name,
    description: cluster.description || `Articles about ${cluster.name}`,
    url: `${config.baseUrl}/blog/cluster/${cluster.slug}`,
    publisher: {
      '@id': `${config.baseUrl}/#organization`,
    },

    // Main pillar content
    ...(pillarPost && {
      mainEntity: {
        '@type': 'Article',
        '@id': `${config.baseUrl}/blog/${pillarPost.slug}#article`,
        name: pillarPost.title,
        url: `${config.baseUrl}/blog/${pillarPost.slug}`,
      },
    }),

    // Related cluster content
    hasPart: clusterPosts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${config.baseUrl}/blog/${post.slug}#article`,
      name: post.title,
      url: `${config.baseUrl}/blog/${post.slug}`,
    })),
  };
}

// =============================================================================
// Combined Schema Graph
// =============================================================================

/**
 * Generate complete JSON-LD graph for a blog post page
 *
 * Combines all relevant schemas into a single @graph for
 * comprehensive semantic markup.
 */
export function generateBlogPostSchemaGraph(
  post: BlogPostWithCluster,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  const schemas: Record<string, unknown>[] = [
    // Remove @context from nested schemas
    stripContext(generateOrganizationSchema(config)),
    stripContext(generateWebSiteSchema(config)),
    stripContext(generateBlogPostBreadcrumbs(post, config)),
    stripContext(generateArticleSchema(post, config)),
  ];

  // Add FAQ schema if FAQs are found in content
  const faqs = extractFAQsFromContent(post.content);
  if (faqs.length > 0) {
    schemas.push(stripContext(generateFAQSchema(faqs, `/blog/${post.slug}`, config)));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

/**
 * Generate complete JSON-LD graph for blog index page
 */
export function generateBlogIndexSchemaGraph(
  posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
  }>,
  config: LLMOConfig = defaultLLMOConfig
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      stripContext(generateOrganizationSchema(config)),
      stripContext(generateWebSiteSchema(config)),
      stripContext(
        generateBreadcrumbSchema(
          [
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
          ],
          config
        )
      ),
      stripContext(generateBlogIndexSchema(posts, config)),
    ],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Strip @context from a schema for use in @graph
 */
function stripContext(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const { '@context': _, ...rest } = schema;
  return rest;
}

/**
 * Render JSON-LD script tag content
 */
export function renderJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 0);
}
