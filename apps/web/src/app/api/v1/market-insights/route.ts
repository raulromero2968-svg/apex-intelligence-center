/**
 * Market Insights API - LLMO Discovery Endpoint
 *
 * Semantic API designed for AI agent discovery and Large Language Model Optimization (LLMO).
 * Optimized for AI consumption by ChatGPT, Claude, Grok, Gemini, and RAG systems.
 *
 * Returns structured market intelligence data with:
 * - JSON-LD schemas for AI search engines
 * - Key findings extracted from content
 * - Verifiable sources with citations
 * - Pagination and filtering support
 *
 * Endpoints:
 * - GET /api/v1/market-insights - List all insights with optional filters
 * - GET /api/v1/market-insights?slug={slug} - Get specific insight by slug
 * - GET /api/v1/market-insights?search={query} - Search insights
 *
 * @module api/v1/market-insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts, getBlogPostBySlug, type BlogPost, type BlogPostSource } from '@/lib/mdx';
import { readFile } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

/**
 * JSON-LD Article schema for AI discovery
 */
interface ArticleJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  author: {
    '@type': 'Person' | 'Organization';
    name: string;
    jobTitle?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  image?: string;
  articleSection?: string;
  keywords?: string[];
  wordCount?: number;
  citation?: Array<{
    '@type': 'CreativeWork';
    name: string;
    url?: string;
    publisher?: string;
  }>;
}

/**
 * Market Insight response format for AI agents
 */
interface MarketInsight {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Key findings extracted from content (AI-optimized) */
  key_findings: string[];
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt: string;
  readingTime?: {
    minutes: number;
    words: number;
  };
  tags?: string[];
  category: string;
  heroImage?: string;
  sources?: Array<{
    id: string | number;
    name: string;
    url: string;
    publisher?: string;
    verified?: boolean;
  }>;
  url: string;
  jsonLd: ArticleJsonLd;
}

/**
 * API response wrapper
 */
interface MarketInsightsResponse {
  api_version: string;
  generated_at: string;
  success: boolean;
  publisher: {
    name: string;
    url: string;
    description: string;
  };
  data: MarketInsight[] | MarketInsight | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    data_freshness: string;
    citation_required: boolean;
    license: string;
  };
  _links: {
    self: string;
    next?: string;
    prev?: string;
  };
  '@context': 'https://schema.org';
  '@type': 'ItemList';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
const PUBLISHER_NAME = 'Apex Intelligence';
const PUBLISHER_LOGO = `${BASE_URL}/logo.png`;
const BLOG_DIRECTORY = path.join(process.cwd(), '..', '..', 'content', 'blog');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract key findings from MDX content
 *
 * Looks for:
 * - Bullet points under "Key Findings" or "Executive Summary"
 * - Bold text patterns indicating key insights
 * - First few bullet points from the content
 */
async function extractKeyFindings(slug: string, maxFindings: number = 5): Promise<string[]> {
  const findings: string[] = [];

  try {
    const filePath = path.join(BLOG_DIRECTORY, `${slug}.mdx`);
    const source = await readFile(filePath, 'utf8');
    const { content } = matter(source);

    // Method 1: Look for "Key Findings" section
    const keyFindingsMatch = content.match(/\*\*Key Findings:?\*\*[\s\S]*?(?=---|\n##|\n\*\*[A-Z])/i);
    if (keyFindingsMatch) {
      const bulletPoints = keyFindingsMatch[0].match(/^[-*]\s+(.+)$/gm);
      if (bulletPoints) {
        findings.push(
          ...bulletPoints
            .map((bp) => bp.replace(/^[-*]\s+/, '').trim())
            .filter((bp) => bp.length > 10 && bp.length < 200)
            .slice(0, maxFindings)
        );
      }
    }

    // Method 2: Look for Executive Summary bullet points
    if (findings.length === 0) {
      const execSummaryMatch = content.match(/## Executive Summary[\s\S]*?(?=---|\n##)/i);
      if (execSummaryMatch) {
        const bulletPoints = execSummaryMatch[0].match(/^[-*]\s+(.+)$/gm);
        if (bulletPoints) {
          findings.push(
            ...bulletPoints
              .map((bp) => bp.replace(/^[-*]\s+/, '').trim())
              .filter((bp) => bp.length > 10 && bp.length < 200)
              .slice(0, maxFindings)
          );
        }
      }
    }

    // Method 3: Extract bold statements as key points
    if (findings.length < maxFindings) {
      const boldStatements = content.match(/\*\*[^*]+\*\*/g);
      if (boldStatements) {
        const additionalFindings = boldStatements
          .map((bs) => bs.replace(/\*\*/g, '').trim())
          .filter((bs) => {
            return (
              bs.length > 20 &&
              bs.length < 150 &&
              !bs.includes(':') &&
              !findings.includes(bs)
            );
          })
          .slice(0, maxFindings - findings.length);
        findings.push(...additionalFindings);
      }
    }
  } catch {
    // File not found or read error - return empty findings
  }

  return findings;
}

/**
 * Determine category from tags
 */
function determineCategory(tags?: string[]): string {
  if (!tags || tags.length === 0) return 'Market Intelligence';

  const tagLower = tags.map((t) => t.toLowerCase());

  if (tagLower.includes('market-analysis')) return 'Market Analysis';
  if (tagLower.includes('research')) return 'Research';
  if (tagLower.includes('guide') || tagLower.includes('tutorial')) return 'Guides';
  if (tagLower.includes('grading')) return 'Grading Analysis';
  if (tagLower.includes('portfolio')) return 'Portfolio Strategy';
  if (tagLower.includes('pokemon')) return 'Pokemon TCG';
  if (tagLower.includes('mtg')) return 'Magic: The Gathering';

  return 'Market Intelligence';
}

/**
 * Convert BlogPost to MarketInsight format with JSON-LD
 */
async function blogPostToInsight(post: BlogPost): Promise<MarketInsight> {
  const publishedDate = new Date(post.frontmatter.date).toISOString();
  const url = `${BASE_URL}/blog/${post.slug}`;

  // Extract key findings from content
  const keyFindings = await extractKeyFindings(post.slug);

  // Fallback: Use description if no findings extracted
  if (keyFindings.length === 0 && post.frontmatter.description) {
    keyFindings.push(post.frontmatter.description);
  }

  // Build citation array from sources
  const citations = (post.frontmatter.citationList || post.frontmatter.sources || []).map(
    (source: BlogPostSource) => ({
      '@type': 'CreativeWork' as const,
      name: source.name,
      url: source.url,
      publisher: source.publisher,
    })
  );

  // Build JSON-LD schema
  const jsonLd: ArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.seoDescription || post.frontmatter.description,
    author: {
      '@type': 'Person',
      name: post.frontmatter.author || 'Apex Intelligence Team',
      jobTitle: post.frontmatter.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER_NAME,
      logo: {
        '@type': 'ImageObject',
        url: PUBLISHER_LOGO,
      },
    },
    datePublished: publishedDate,
    dateModified: publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: post.frontmatter.hero ? `${BASE_URL}${post.frontmatter.hero}` : undefined,
    articleSection: determineCategory(post.frontmatter.tags),
    keywords: post.frontmatter.tags,
    wordCount: post.readingTime?.words,
    citation: citations.length > 0 ? citations : undefined,
  };

  return {
    id: post.slug,
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.seoDescription || post.frontmatter.description,
    key_findings: keyFindings,
    author: {
      name: post.frontmatter.author || 'Apex Intelligence Team',
      role: post.frontmatter.authorRole,
      avatar: post.frontmatter.authorAvatar,
    },
    publishedAt: publishedDate,
    updatedAt: publishedDate,
    readingTime: post.readingTime
      ? {
          minutes: post.readingTime.minutes,
          words: post.readingTime.words,
        }
      : undefined,
    tags: post.frontmatter.tags,
    category: determineCategory(post.frontmatter.tags),
    heroImage: post.frontmatter.hero,
    sources: (post.frontmatter.citationList || post.frontmatter.sources || []).map(
      (source: BlogPostSource) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        publisher: source.publisher,
        verified: source.verified ?? true,
      })
    ),
    url,
    jsonLd,
  };
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/v1/market-insights
 *
 * Query Parameters:
 * - slug: Get specific insight by slug
 * - search: Full-text search on title and description
 * - tags: Comma-separated list of tags to filter by
 * - limit: Number of results (default: 20, max: 100)
 * - page: Page number for pagination (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const slug = searchParams.get('slug');
    const search = searchParams.get('search')?.toLowerCase();
    const tagsFilter = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

    const baseResponse = {
      api_version: '1.0.0',
      generated_at: new Date().toISOString(),
      publisher: {
        name: PUBLISHER_NAME,
        url: BASE_URL,
        description:
          'Institutional-grade market intelligence for the trading card game (TCG) collectibles market. Data-driven analysis with verifiable sources.',
      },
      '@context': 'https://schema.org' as const,
      '@type': 'ItemList' as const,
    };

    // Single insight lookup by slug
    if (slug) {
      const post = await getBlogPostBySlug(slug);

      if (!post) {
        return NextResponse.json(
          {
            ...baseResponse,
            success: false,
            error: 'Insight not found',
            data: null,
            meta: {
              total: 0,
              page: 1,
              limit: 1,
              hasMore: false,
              data_freshness: 'hourly',
              citation_required: true,
              license: 'CC BY-NC 4.0',
            },
            _links: { self: `${BASE_URL}/api/v1/market-insights?slug=${slug}` },
          },
          { status: 404 }
        );
      }

      const insight = await blogPostToInsight(post);

      return NextResponse.json(
        {
          ...baseResponse,
          success: true,
          data: insight,
          meta: {
            total: 1,
            page: 1,
            limit: 1,
            hasMore: false,
            data_freshness: 'hourly',
            citation_required: true,
            license: 'CC BY-NC 4.0',
          },
          _links: { self: `${BASE_URL}/api/v1/market-insights?slug=${slug}` },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'X-Robots-Tag': 'index, follow',
            'X-Content-Type-Options': 'nosniff',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        }
      );
    }

    // Get all posts
    let posts = await getAllBlogPosts();

    // Apply search filter
    if (search) {
      posts = posts.filter(
        (post) =>
          post.frontmatter.title.toLowerCase().includes(search) ||
          post.frontmatter.description?.toLowerCase().includes(search)
      );
    }

    // Apply tags filter
    if (tagsFilter && tagsFilter.length > 0) {
      posts = posts.filter((post) =>
        tagsFilter.some((tag) =>
          post.frontmatter.tags?.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        )
      );
    }

    // Calculate pagination
    const total = posts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Convert to insights (with key_findings extraction)
    const insights = await Promise.all(paginatedPosts.map(blogPostToInsight));

    // Build pagination links
    const selfUrl = new URL(`${BASE_URL}/api/v1/market-insights`);
    selfUrl.searchParams.set('page', String(page));
    selfUrl.searchParams.set('limit', String(limit));
    if (search) selfUrl.searchParams.set('search', search);
    if (tagsFilter) selfUrl.searchParams.set('tags', tagsFilter.join(','));

    const links: MarketInsightsResponse['_links'] = {
      self: selfUrl.toString(),
    };

    if (hasMore) {
      const nextUrl = new URL(selfUrl);
      nextUrl.searchParams.set('page', String(page + 1));
      links.next = nextUrl.toString();
    }

    if (page > 1) {
      const prevUrl = new URL(selfUrl);
      prevUrl.searchParams.set('page', String(page - 1));
      links.prev = prevUrl.toString();
    }

    const response: MarketInsightsResponse = {
      ...baseResponse,
      success: true,
      data: insights,
      meta: {
        total,
        page,
        limit,
        hasMore,
        data_freshness: 'hourly',
        citation_required: true,
        license: 'CC BY-NC 4.0',
      },
      _links: links,
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Market Insights API Error:', error);

    return NextResponse.json(
      {
        api_version: '1.0.0',
        generated_at: new Date().toISOString(),
        success: false,
        error: 'Internal server error',
        message: 'Unable to fetch market insights',
        data: null,
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
          data_freshness: 'hourly',
          citation_required: true,
          license: 'CC BY-NC 4.0',
        },
        _links: { self: `${BASE_URL}/api/v1/market-insights` },
        '@context': 'https://schema.org',
        '@type': 'ItemList',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/v1/market-insights
 *
 * Returns metadata about the insights collection without the body.
 * Useful for AI agents to check freshness and count.
 */
export async function HEAD() {
  try {
    const posts = await getAllBlogPosts();

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': String(posts.length),
        'X-Last-Modified': posts[0]
          ? new Date(posts[0].frontmatter.date).toUTCString()
          : new Date().toUTCString(),
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
