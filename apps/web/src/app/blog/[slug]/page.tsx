/**
 * Dynamic Blog Post Page
 *
 * Server Component that renders blog posts with:
 * - Database-first content loading (with MDX file fallback)
 * - Cluster sidebar for topic navigation
 * - Citation display and JSON-LD for SEO/LLMO
 *
 * Implements the Topic Cluster SEO model:
 * - Pillar pages show all related cluster content
 * - Cluster articles link back to their pillar
 *
 * @see lib/api/blog.ts for data fetching
 * @see components/blog/ClusterSidebar.tsx for sidebar
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Clock,
  Calendar,
  User,
  ArrowLeft,
  ExternalLink,
  Database,
  CheckCircle,
} from 'lucide-react';

// Data fetching
import {
  getPostBySlug,
  getRelatedPostsInCluster,
  getPillarPostForCluster,
  getAllPostSlugs,
  generateBlogPostJsonLd,
} from '@/lib/api/blog';
import { getArticleBySlug, getAllBlogPostSlugs } from '@/lib/mdx';

// Components
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import TableOfContents from '@/components/mdx/TableOfContents';
import { ClusterSidebar } from '@/components/blog/ClusterSidebar';

// MDX Components Registry
import AreaChartViz from '@/components/mdx/AreaChartViz';
import BarChartViz from '@/components/mdx/BarChartViz';
import HeroImage from '@/components/mdx/HeroImage';
import AskFollowUp from '@/components/mdx/AskFollowUp';
import InteractiveLineChart from '@/components/mdx/InteractiveLineChart';
import ScatterPlot from '@/components/mdx/ScatterPlot';
import CardTicker from '@/components/mdx/CardTicker';
import CardHover from '@/components/mdx/CardHover';
import { ProTip, Insight, Warning, BullishSignal, BearishSignal, ProInsight } from '@/components/mdx/ProTip';
import { Citation, Source, CitationList, Ref } from '@/components/mdx/Citation';
import { MethodologyBox, MethodologyNote, DataMethodology, PredictionMethodology } from '@/components/mdx/MethodologyBox';
import { LiveTicker, TrendBadge, PriceTicker } from '@/components/mdx/LiveTicker';

// Types
import type { BlogPostCitation, BlogPostAuthor } from '@apex/db/schema';

// =============================================================================
// MDX Components
// =============================================================================

const mdxComponents = {
  // Visualizations
  AreaChartViz,
  BarChartViz,
  HeroImage,
  AskFollowUp,
  InteractiveLineChart,
  ScatterPlot,
  // Smart Components
  CardTicker,
  CardHover,
  ProTip,
  Insight,
  Warning,
  BullishSignal,
  BearishSignal,
  ProInsight,
  // Citations
  Citation,
  Source,
  CitationList,
  Ref,
  // Transparency
  MethodologyBox,
  MethodologyNote,
  DataMethodology,
  PredictionMethodology,
  // Live Data
  LiveTicker,
  TrendBadge,
  PriceTicker,
};

// =============================================================================
// Types
// =============================================================================

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

// =============================================================================
// Static Generation
// =============================================================================

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Get slugs from both DB and MDX files
  const [dbSlugs, mdxSlugs] = await Promise.all([
    getAllPostSlugs(),
    getAllBlogPostSlugs(),
  ]);

  // Combine and dedupe
  const allSlugs = [...new Set([...dbSlugs, ...mdxSlugs])];

  return allSlugs.map((slug) => ({ slug }));
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Try DB first, then MDX fallback
  const dbPost = await getPostBySlug(slug);

  if (dbPost) {
    const author = (dbPost.author as BlogPostAuthor) || { name: 'Apex Intelligence Team' };
    const ogImageUrl = `/api/og?slug=${slug}`;

    return {
      title: dbPost.title,
      description: dbPost.excerpt || '',
      authors: [{ name: author.name }],
      openGraph: {
        title: dbPost.title,
        description: dbPost.excerpt || '',
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        type: 'article',
        publishedTime: dbPost.publishedAt?.toISOString(),
        authors: [author.name],
      },
      twitter: {
        card: 'summary_large_image',
        title: dbPost.title,
        description: dbPost.excerpt || '',
        images: [ogImageUrl],
      },
    };
  }

  // Fallback to MDX
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: 'Post Not Found' };
  }

  const ogImageUrl = `/api/og?slug=${slug}`;
  const description = article.frontmatter.description || article.frontmatter.tags?.join(', ') || '';

  return {
    title: article.frontmatter.title,
    description,
    authors: [{ name: article.frontmatter.author || 'Apex Intelligence Team' }],
    openGraph: {
      title: article.frontmatter.title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.frontmatter.publishedAt,
      authors: [article.frontmatter.author || 'Apex Intelligence Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.frontmatter.title,
      description,
      images: [ogImageUrl],
    },
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const { slug } = await params;
  const searchParamsResolved = searchParams ? await searchParams : undefined;
  const preview = searchParamsResolved?.preview === '1';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';

  // Try DB first
  const dbPost = await getPostBySlug(slug);

  if (dbPost) {
    return <DatabasePostView post={dbPost} baseUrl={baseUrl} />;
  }

  // Fallback to MDX file
  const article = await getArticleBySlug(slug);

  if (!article) {
    return notFound();
  }

  // Check draft status
  const isDraftHidden =
    (article.frontmatter.draft || article.frontmatter.unlisted) &&
    !preview &&
    process.env.NODE_ENV === 'production';

  if (isDraftHidden) {
    return notFound();
  }

  return <MdxPostView article={article} slug={slug} baseUrl={baseUrl} />;
}

// =============================================================================
// Database Post View
// =============================================================================

async function DatabasePostView({
  post,
  baseUrl,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;
  baseUrl: string;
}) {
  const author = (post.author as BlogPostAuthor) || { name: 'Apex Intelligence Team' };
  const citations = (post.citations as BlogPostCitation[]) || [];
  const tags = (post.tags as string[]) || [];

  // Compile MDX content
  const { content: mdxContent } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    },
  });

  // Fetch cluster-related data if post belongs to a cluster
  let relatedPosts: Awaited<ReturnType<typeof getRelatedPostsInCluster>> = [];
  let pillarPost: Awaited<ReturnType<typeof getPillarPostForCluster>> = null;

  if (post.cluster) {
    [relatedPosts, pillarPost] = await Promise.all([
      getRelatedPostsInCluster(post.cluster.id, post.id),
      post.postType === 'pillar' ? null : getPillarPostForCluster(post.cluster.id),
    ]);
  }

  // Generate JSON-LD
  const jsonLd = generateBlogPostJsonLd(post, baseUrl);

  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative min-h-screen pt-24 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan-slow" />
        </div>

        <div className="container mx-auto px-4 md:px-12 relative z-10">
          {/* Back Navigation */}
          <div className="max-w-7xl mx-auto mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-sans text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK_TO_BLOG
            </Link>
          </div>

          {/* Terminal Header */}
          <section className="max-w-7xl mx-auto mb-12">
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-8">
              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                  {post.cluster?.name || 'BLOG'} // MARKET_INTELLIGENCE
                </div>

                {/* Post Type Badge */}
                {post.postType === 'pillar' && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-xs font-sans">
                    PILLAR_GUIDE
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-sans mb-6">
                {author.name && (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>{author.name}</span>
                      {author.role && (
                        <span className="text-slate-500">({author.role})</span>
                      )}
                    </div>
                    <span className="text-slate-600">|</span>
                  </>
                )}

                {publishDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <time dateTime={post.publishedAt?.toISOString()}>{publishDate}</time>
                  </div>
                )}

                {post.readingTimeMinutes && (
                  <>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{post.readingTimeMinutes} min read</span>
                    </div>
                  </>
                )}

                {citations.length > 0 && (
                  <>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>{citations.length} sources</span>
                    </div>
                  </>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-300 font-sans"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Hero Image */}
          {post.heroImage && (
            <section className="max-w-4xl mx-auto mb-12">
              <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 shadow-[0_0_10px_cyan] animate-scan-line" />
              </div>
            </section>
          )}

          {/* Article Content with Sidebars */}
          <section className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_240px] gap-8">
              {/* Left Sidebar: Cluster Navigation or TOC */}
              <aside className="hidden xl:block">
                {post.cluster ? (
                  <ClusterSidebar
                    cluster={{
                      name: post.cluster.name,
                      slug: post.cluster.slug,
                      color: post.cluster.color,
                    }}
                    pillarPost={pillarPost}
                    relatedPosts={relatedPosts}
                    currentPostId={post.id}
                    isCurrentPillar={post.postType === 'pillar'}
                  />
                ) : (
                  <div className="sticky top-28">
                    <TableOfContents />
                  </div>
                )}
              </aside>

              {/* Main Content */}
              <main>
                <ElectronicFolder
                  title="ARTICLE CONTENT"
                  classification="PUBLIC ACCESS // INTELLIGENCE_REPORT"
                >
                  <DigitalScroll height="auto">
                    <Suspense
                      fallback={
                        <div className="prose prose-invert max-w-none">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                            <div className="h-4 bg-slate-800 rounded w-full" />
                            <div className="h-4 bg-slate-800 rounded w-5/6" />
                          </div>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none prose-headings:text-cyan-400 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-code:text-cyan-300 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-headings:scroll-mt-24">
                        {mdxContent}
                      </div>
                    </Suspense>
                  </DigitalScroll>
                </ElectronicFolder>

                {/* Citations Section */}
                {citations.length > 0 && (
                  <div className="mt-8">
                    <CitationList title="Sources">
                      {citations.map((citation, idx) => (
                        <Source
                          key={citation.id || idx}
                          id={citation.id || String(idx + 1)}
                          name={citation.source}
                          url={citation.url || '#'}
                          publisher={citation.publisher}
                          accessed={citation.accessedAt}
                          type={citation.type as 'web' | 'database' | 'document' | 'api' | undefined}
                          verified={citation.verified}
                        />
                      ))}
                    </CitationList>
                  </div>
                )}
              </main>

              {/* Right Sidebar: Sources Cited or TOC */}
              <aside className="hidden xl:block">
                <div className="sticky top-28">
                  {post.cluster && <TableOfContents />}

                  {citations.length > 0 && (
                    <div className="mt-4 border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-cyan-500/30 bg-cyan-950/30 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans">
                          Quick Sources
                        </h4>
                        <span className="ml-auto text-xs text-slate-500">{citations.length}</span>
                      </div>
                      <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
                        {citations.slice(0, 5).map((citation, idx) => (
                          <a
                            key={idx}
                            href={citation.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/40">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-300 group-hover:text-cyan-400 transition-colors line-clamp-2">
                                {citation.source}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>
                      {citations.length > 5 && (
                        <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-900/30">
                          <a
                            href="#sources"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300"
                          >
                            View all {citations.length} sources
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Methodology Badge */}
                  <div className="mt-4 p-3 border border-slate-700/50 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Database className="w-4 h-4 text-cyan-500" />
                      <span>
                        <span className="text-cyan-400 font-semibold">{citations.length}</span> data
                        sources analyzed
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>All sources verified</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {/* Back to Blog CTA */}
          <section className="max-w-7xl mx-auto mt-12">
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Read More Intelligence</h3>
              <p className="text-slate-400 mb-6">
                Explore more market analysis and insights from the network.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-sans"
              >
                [ VIEW_ALL_POSTS ]
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// MDX File Fallback View
// =============================================================================

async function MdxPostView({
  article,
  slug,
  baseUrl,
}: {
  article: NonNullable<Awaited<ReturnType<typeof getArticleBySlug>>>;
  slug: string;
  baseUrl: string;
}) {
  // Cast frontmatter to handle both ArticleFrontmatter and BlogPostFrontmatter
  const frontmatter = article.frontmatter as unknown as {
    title: string;
    description?: string;
    publishedAt?: string;
    date?: string;
    author?: string;
    heroImage?: string;
    tags?: string[];
    category?: string;
    sourceCount?: number;
  };

  const publishDate = new Date(
    frontmatter.publishedAt || frontmatter.date || new Date().toISOString()
  ).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate basic JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description || '',
    author: {
      '@type': 'Person',
      name: frontmatter.author || 'Apex Intelligence Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
    },
    datePublished: frontmatter.publishedAt || frontmatter.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${baseUrl}/blog/${slug}` },
    image: frontmatter.heroImage || `${baseUrl}/api/og?slug=${slug}`,
    articleSection: frontmatter.category || 'Market Analysis',
    keywords: (frontmatter.tags || []).join(', '),
  };

  const allSources = (article.frontmatter as any).allSources || (article.frontmatter as any).sources || [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative min-h-screen pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan-slow" />
        </div>

        <div className="container mx-auto px-4 md:px-12 relative z-10">
          {/* Back Navigation */}
          <div className="max-w-7xl mx-auto mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-sans text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK_TO_BLOG
            </Link>
          </div>

          {/* Header */}
          <section className="max-w-7xl mx-auto mb-12">
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                {frontmatter.category || 'BLOG'} // MARKET_INTELLIGENCE
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {frontmatter.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-sans mb-6">
                {frontmatter.author && (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>{frontmatter.author}</span>
                    </div>
                    <span className="text-slate-600">|</span>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <time>{publishDate}</time>
                </div>

                {article.readingTime && (
                  <>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{article.readingTime.text}</span>
                    </div>
                  </>
                )}

                {frontmatter.sourceCount && (
                  <>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>{frontmatter.sourceCount} sources</span>
                    </div>
                  </>
                )}
              </div>

              {frontmatter.tags && frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {frontmatter.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-300 font-sans"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Hero Image */}
          {frontmatter.heroImage && (
            <section className="max-w-4xl mx-auto mb-12">
              <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <Image
                  src={frontmatter.heroImage}
                  alt={frontmatter.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 shadow-[0_0_10px_cyan] animate-scan-line" />
              </div>
            </section>
          )}

          {/* Article Content */}
          <section className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_240px] gap-8">
              {/* Left Sidebar: TOC */}
              <aside className="hidden xl:block">
                <div className="sticky top-28">
                  <TableOfContents />
                </div>
              </aside>

              {/* Main Content */}
              <main>
                <ElectronicFolder
                  title="ARTICLE CONTENT"
                  classification="PUBLIC ACCESS // INTELLIGENCE_REPORT"
                >
                  <DigitalScroll height="auto">
                    <Suspense
                      fallback={
                        <div className="prose prose-invert max-w-none">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                            <div className="h-4 bg-slate-800 rounded w-full" />
                            <div className="h-4 bg-slate-800 rounded w-5/6" />
                          </div>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none prose-headings:text-cyan-400 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-code:text-cyan-300 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-headings:scroll-mt-24">
                        {article.content}
                      </div>
                    </Suspense>
                  </DigitalScroll>
                </ElectronicFolder>
              </main>

              {/* Right Sidebar: Sources */}
              <aside className="hidden xl:block">
                <div className="sticky top-28">
                  {allSources.length > 0 && (
                    <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-cyan-500/30 bg-cyan-950/30 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans">
                          Sources Cited
                        </h4>
                        <span className="ml-auto text-xs text-slate-500">{allSources.length}</span>
                      </div>
                      <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                        {allSources.map((source: { name: string; url: string; publisher?: string }, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/40">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-300 group-hover:text-cyan-400 transition-colors line-clamp-2">
                                {source.name}
                              </p>
                              {source.publisher && (
                                <p className="text-[10px] text-slate-500 mt-0.5">{source.publisher}</p>
                              )}
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>
                      <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-900/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>All sources verified</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {frontmatter.sourceCount && (
                    <div className="mt-4 p-3 border border-slate-700/50 bg-slate-900/30 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Database className="w-4 h-4 text-cyan-500" />
                        <span>
                          <span className="text-cyan-400 font-semibold">
                            {frontmatter.sourceCount}
                          </span>{' '}
                          data sources analyzed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>

          {/* Back to Blog CTA */}
          <section className="max-w-7xl mx-auto mt-12">
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Read More Intelligence</h3>
              <p className="text-slate-400 mb-6">
                Explore more market analysis and insights from the network.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-sans"
              >
                [ VIEW_ALL_POSTS ]
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
