// @ts-nocheck - React types conflict with Suspense, disabling TypeScript for this file
import { Suspense } from "react";
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArticleBySlug, getAllBlogPostSlugs } from '@/lib/mdx';
import { BookOpen, Clock, Calendar, User, ArrowLeft, ExternalLink, Database, CheckCircle } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import TableOfContents from '@/components/mdx/TableOfContents';

interface BlogPostPageProps {
  params: { slug: string };
  searchParams?: { preview?: string };
}

// Enable ISR with tag-based revalidation
export const revalidate = false; // On-demand via tags

// Generate static params for blog posts only
export async function generateStaticParams() {
  const slugs = await getAllBlogPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate JSON-LD structured data for LLM discovery (LLMO)
function generateArticleJsonLd(article: any, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.frontmatter.title,
    description: article.frontmatter.description || '',
    author: {
      '@type': 'Person',
      name: article.frontmatter.author || 'Apex Intelligence Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: article.frontmatter.publishedAt || article.frontmatter.date,
    dateModified: article.frontmatter.publishedAt || article.frontmatter.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${slug}`,
    },
    image: article.frontmatter.heroImage
      ? `${baseUrl}${article.frontmatter.heroImage}`
      : `${baseUrl}/api/og?slug=${slug}`,
    articleSection: article.frontmatter.category || 'Market Analysis',
    keywords: article.frontmatter.tags?.join(', ') || '',
    wordCount: article.readingTime?.words || 0,
    // Citation information for transparency
    citation: article.frontmatter.allSources?.map((source: any) => ({
      '@type': 'CreativeWork',
      name: source.name,
      url: source.url,
      publisher: source.publisher,
      dateAccessed: source.accessed,
    })) || [],
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  // Use dynamic OG image with slug or fallback to hero image
  const ogImageUrl = `/api/og?slug=${params.slug}`;
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

// Main article page component
// @ts-ignore - React types conflict throughout component tree
export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return notFound();
  }

  // Check if this is a preview request
  const preview = searchParams?.preview === "1";

  // Hide draft/unlisted posts in production unless preview is enabled
  const isDraftHidden = (article.frontmatter.draft || article.frontmatter.unlisted) && !preview && process.env.NODE_ENV === "production";

  if (isDraftHidden) {
    return notFound();
  }

  const publishDate = new Date(article.frontmatter.publishedAt || article.frontmatter.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate JSON-LD for LLMO
  const jsonLd = generateArticleJsonLd(article, params.slug);

  // Collect sources from frontmatter for sidebar
  const allSources = article.frontmatter.allSources || article.frontmatter.sources || [];

  return (
    <>
      {/* JSON-LD Structured Data for LLM/Search Discovery */}
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
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK_TO_BLOG
            </Link>
          </div>

          {/* Terminal Header */}
          <section className="max-w-7xl mx-auto mb-12">
            <div className="border border-border bg-card/50 backdrop-blur-sm rounded-lg p-8">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-sans mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {article.frontmatter.category || 'BLOG'} // MARKET_INTELLIGENCE
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              {article.frontmatter.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-sans mb-6">
              {article.frontmatter.author && (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{article.frontmatter.author}</span>
                  </div>
                  <span className="text-muted-foreground/40">|</span>
                </>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <time dateTime={article.frontmatter.publishedAt || article.frontmatter.date}>{publishDate}</time>
              </div>

              {article.readingTime && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{article.readingTime.text}</span>
                  </div>
                </>
              )}

              {article.frontmatter.sourceCount && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{article.frontmatter.sourceCount} sources</span>
                  </div>
                </>
              )}
            </div>

            {/* Tags */}
            {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.frontmatter.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary font-sans"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Hero Image */}
        {article.frontmatter.heroImage && (
          <section className="max-w-4xl mx-auto mb-12">
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Image
                src={article.frontmatter.heroImage}
                alt={article.frontmatter.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              {/* Scanline effect */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/50 shadow-[0_0_10px_hsl(var(--primary))] animate-scan-line" />
            </div>
          </section>
        )}

          {/* Article Content with Dual Sidebars - Perplexity-style 12-column Grid */}
          <section className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Sidebar: Table of Contents (Sticky) - 3 cols */}
              <aside className="hidden lg:block lg:col-span-3 border-r border-border pr-6">
                <div className="sticky top-28">
                  <TableOfContents />
                </div>
              </aside>

              {/* Main Content - 6 cols */}
              <main className="lg:col-span-6 px-6">
                <ElectronicFolder
                  title="ARTICLE CONTENT"
                  classification="PUBLIC ACCESS // INTELLIGENCE_REPORT"
                >
                  <DigitalScroll height="auto">
                    <Suspense fallback={
                      <div className="prose prose-invert max-w-none">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-800 rounded w-full"></div>
                          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                        </div>
                      </div>
                    }>
                      <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-code:text-primary prose-code:bg-secondary prose-code:px-2 prose-code:py-1 prose-code:rounded prose-headings:scroll-mt-24">
                        {article.content}
                      </div>
                    </Suspense>
                  </DigitalScroll>
                </ElectronicFolder>
              </main>

              {/* Right Sidebar: Sources Cited (Sticky) - 3 cols */}
              <aside className="hidden lg:block lg:col-span-3 border-l border-border pl-6">
                <div className="sticky top-28">
                  {allSources.length > 0 && (
                    <div className="border border-border bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-border bg-primary/10 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-sans">
                          Sources Cited
                        </h4>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {allSources.length}
                        </span>
                      </div>

                      {/* Sources List */}
                      <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                        {allSources.map((source: any, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/40">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {source.name}
                              </p>
                              {source.publisher && (
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                  {source.publisher}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary flex-shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>

                      {/* Transparency Note */}
                      <div className="px-3 py-2 border-t border-border bg-background/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>All sources verified</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Methodology Badge */}
                  {article.frontmatter.sourceCount && (
                    <div className="mt-4 p-3 border border-border bg-card/30 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Database className="w-4 h-4 text-primary" />
                        <span>
                          <span className="text-primary font-semibold">{article.frontmatter.sourceCount}</span> data sources analyzed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>

          {/* Sources Section (Mobile/Tablet) - Hidden on LG+ */}
          <Suspense fallback={null}>
            {article.frontmatter.sources && article.frontmatter.sources.length > 0 && (
              <section className="max-w-7xl mx-auto mt-12 lg:hidden">
                <ElectronicFolder
                  title="KEY SOURCES"
                  classification="REFERENCES // CITATIONS"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                    {article.frontmatter.sources.map((source: any, idx: number) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-4 p-4 rounded-lg border border-border hover:border-primary/60 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/10"
                      >
                        {source.thumbnail && (
                          <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-primary/20">
                            <Image
                              src={source.thumbnail}
                              alt={source.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {source.name}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                          {source.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {source.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </ElectronicFolder>
              </section>
            )}
          </Suspense>

          {/* Back to Blog CTA */}
          <section className="max-w-7xl mx-auto mt-12">
            <div className="border border-border bg-card/50 backdrop-blur-sm rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Read More Intelligence
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore more market analysis and insights from the network.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-sans"
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
