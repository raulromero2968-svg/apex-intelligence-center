/**
 * Market Insights API - LLMO Discovery Endpoint
 *
 * Semantic API designed for AI agent discovery and Large Language Model Optimization (LLMO).
 * Returns structured market intelligence data with JSON-LD schemas for AI search engines.
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

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
  success: boolean;
  data: MarketInsight[] | MarketInsight | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  _links: {
    self: string;
    next?: string;
    prev?: string;
  };
  '@context': 'https://schema.org';
  '@type': 'ItemList';
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.ai';
const PUBLISHER_NAME = 'Apex Intelligence';
const PUBLISHER_LOGO = `${BASE_URL}/logo.png`;

/**
 * Convert BlogPost to MarketInsight format with JSON-LD
 */
function blogPostToInsight(post: BlogPost): MarketInsight {
  const publishedDate = new Date(post.frontmatter.date).toISOString();
  const url = `${BASE_URL}/blog/${post.slug}`;

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
    dateModified: publishedDate, // Use same date unless we have updatedAt
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: post.frontmatter.hero ? `${BASE_URL}${post.frontmatter.hero}` : undefined,
    articleSection: 'TCG Market Analysis',
    keywords: post.frontmatter.tags,
    wordCount: post.readingTime?.words,
    citation: citations.length > 0 ? citations : undefined,
  };

  return {
    id: post.slug,
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.seoDescription || post.frontmatter.description,
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

    // Single insight lookup by slug
    if (slug) {
      const post = await getBlogPostBySlug(slug);

      if (!post) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insight not found',
            data: null,
            meta: { total: 0, page: 1, limit: 1, hasMore: false },
            _links: { self: `${BASE_URL}/api/v1/market-insights?slug=${slug}` },
            '@context': 'https://schema.org',
            '@type': 'ItemList',
          },
          { status: 404 }
        );
      }

      const insight = blogPostToInsight(post);

      return NextResponse.json({
        success: true,
        data: insight,
        meta: { total: 1, page: 1, limit: 1, hasMore: false },
        _links: { self: `${BASE_URL}/api/v1/market-insights?slug=${slug}` },
        '@context': 'https://schema.org',
        '@type': 'ItemList',
      });
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

    // Convert to insights
    const insights = paginatedPosts.map(blogPostToInsight);

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
      success: true,
      data: insights,
      meta: {
        total,
        page,
        limit,
        hasMore,
      },
      _links: links,
      '@context': 'https://schema.org',
      '@type': 'ItemList',
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Market Insights API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: null,
        meta: { total: 0, page: 1, limit: 20, hasMore: false },
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
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
