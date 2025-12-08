/**
 * Blog Index Page
 *
 * Displays all blog posts organized by Topic Clusters.
 * Implements the "Pillar + Cluster" SEO strategy:
 * - Pillar pages are prominently displayed as comprehensive guides
 * - Cluster content groups related articles under each pillar
 * - Standalone posts are shown separately
 *
 * Data is fetched from DB first with MDX file fallback.
 *
 * @see lib/api/blog.ts for data fetching
 * @see packages/db/src/schema/blogPosts.ts for schema
 */

import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Crown,
  Layers,
} from 'lucide-react';
import { getPostsGroupedByCluster, type BlogPostPreview, type ClusterWithPosts } from '@/lib/api/blog';
import { getAllBlogPosts } from '@/lib/mdx';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import { HoloCard } from '@/components/ui/HoloCard';

// LLMO (Large Language Model Optimization)
import {
  generateBlogIndexSchemaGraph,
  renderJsonLd,
  defaultLLMOConfig,
} from '@/lib/llmo';

// =============================================================================
// Metadata
// =============================================================================

export const metadata = {
  title: 'Apex Blog | Market Analysis & Insights',
  description:
    'Latest TCG market analysis, trends, and insights from the underground intelligence network. Explore pillar guides and cluster content for comprehensive market knowledge.',
};

// =============================================================================
// Page Component
// =============================================================================

export default async function BlogPage() {
  // Fetch from DB (grouped by cluster)
  const { clusters, standalonePosts } = await getPostsGroupedByCluster();

  // Also fetch MDX posts for fallback/hybrid approach
  const mdxPosts = await getAllBlogPosts();

  // Check if we have any DB posts
  const hasDbPosts = clusters.length > 0 || standalonePosts.length > 0;

  // Generate LLMO schema for the blog index
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
  const llmoConfig = { ...defaultLLMOConfig, baseUrl };

  // Collect all posts for schema generation
  const allPosts = hasDbPosts
    ? [
        ...clusters.flatMap((c) => [c.pillarPost, ...c.posts].filter(Boolean) as BlogPostPreview[]),
        ...standalonePosts,
      ]
    : mdxPosts.map((post) => ({
        title: post.frontmatter.title,
        slug: post.slug,
        excerpt: post.frontmatter.description || null,
        publishedAt: post.frontmatter.date ? new Date(post.frontmatter.date) : null,
      }));

  const schemaGraph = generateBlogIndexSchemaGraph(allPosts, llmoConfig);

  return (
    <>
      {/* JSON-LD Structured Data for LLMO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(schemaGraph) }}
      />

      <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            MARKET_INTELLIGENCE // BLOG_ARCHIVE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Market
            </span>
            <span className="block text-holographic">Intelligence</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Latest TCG market analysis, trends, and insights from the underground intelligence
            network.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Featured Note Card */}
      <section className="relative z-10 px-6 md:px-12 pb-12">
        <div className="max-w-3xl mx-auto">
          <HoloCard>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                <Sparkles
                  className="w-5 h-5"
                  strokeWidth={2.5}
                  fill="none"
                  stroke="#06b6d4"
                  style={{
                    filter: 'drop-shadow(0 0 6px #06b6d4) drop-shadow(0 0 12px #a855f7)',
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                  Underground Intelligence
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Data-driven analysis for serious collectors. No hype, just signal. Our content is
                  organized into topic clusters for comprehensive understanding.
                </p>
              </div>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* Main Content */}
      {hasDbPosts ? (
        <DatabaseBlogView clusters={clusters} standalonePosts={standalonePosts} />
      ) : (
        <MdxBlogView posts={mdxPosts} />
      )}

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <HoloCard intensity="high" className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              SUBSCRIBE_FOR_UPDATES
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Want Weekly Intel?</h2>

            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Get the latest market analysis delivered to your inbox. Join the network.
            </p>

            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-sans"
            >
              [ SUBSCRIBE_NOW ]
              <ArrowRight className="w-5 h-5" />
            </Link>
          </HoloCard>
        </div>
      </section>
      </div>
    </>
  );
}

// =============================================================================
// Database Blog View (with cluster grouping)
// =============================================================================

function DatabaseBlogView({
  clusters,
  standalonePosts,
}: {
  clusters: ClusterWithPosts[];
  standalonePosts: BlogPostPreview[];
}) {
  return (
    <section className="relative z-10 px-6 md:px-12 py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Topic Clusters */}
        {clusters.map((cluster) => (
          <ClusterSection key={cluster.id} cluster={cluster} />
        ))}

        {/* Standalone Posts */}
        {standalonePosts.length > 0 && (
          <ElectronicFolder title="STANDALONE POSTS" classification="PUBLIC ACCESS // GENERAL">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 not-prose">
              {standalonePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </ElectronicFolder>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// Cluster Section
// =============================================================================

function ClusterSection({ cluster }: { cluster: ClusterWithPosts }) {
  const accentColor = cluster.color || 'cyan';
  const colorClasses = getClusterColorClasses(accentColor);

  return (
    <ElectronicFolder
      title={cluster.name.toUpperCase()}
      classification={`TOPIC CLUSTER // ${cluster.posts.length + (cluster.pillarPost ? 1 : 0)} ARTICLES`}
    >
      <div className="space-y-6 not-prose">
        {/* Pillar Post (Featured) */}
        {cluster.pillarPost && (
          <PillarCard post={cluster.pillarPost} colorClasses={colorClasses} />
        )}

        {/* Cluster Posts Grid */}
        {cluster.posts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className={`w-4 h-4 ${colorClasses.text}`} />
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-sans">
                Cluster Articles
              </h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cluster.posts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </ElectronicFolder>
  );
}

// =============================================================================
// Pillar Card (Featured Post)
// =============================================================================

function PillarCard({
  post,
  colorClasses,
}: {
  post: BlogPostPreview;
  colorClasses: ReturnType<typeof getClusterColorClasses>;
}) {
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative overflow-hidden rounded-xl border ${colorClasses.border} bg-gradient-to-br ${colorClasses.gradient} backdrop-blur-sm transition-all duration-300 hover:border-opacity-100 hover:shadow-lg flex flex-col md:flex-row`}
    >
      {/* Crown Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colorClasses.badge}`}>
          <Crown className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Pillar Guide</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-16 md:pt-6 md:pl-6 flex-1">
        <div className="md:ml-[140px]">
          <h3 className={`text-2xl font-bold text-white group-hover:${colorClasses.textHover} transition-colors mb-3`}>
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-slate-400 line-clamp-2 mb-4">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {publishDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{publishDate}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readingTimeMinutes} min read</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 text-xs text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Read CTA */}
          <div className={`mt-4 text-sm ${colorClasses.text} group-hover:${colorClasses.textHover} transition-colors font-sans`}>
            READ_PILLAR_GUIDE{' '}
            <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Post Card (Regular)
// =============================================================================

function PostCard({ post, compact = false }: { post: BlogPostPreview; compact?: boolean }) {
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card Content */}
      <div className={`p-${compact ? 4 : 6} flex-1`}>
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            {post.postType === 'cluster' && post.cluster && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/50 text-slate-400 border border-slate-700/50 font-sans">
                <Layers className="w-2.5 h-2.5" />
                {post.cluster.name}
              </div>
            )}
            <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-sans">
              {post.postType === 'pillar' ? 'PILLAR' : 'BLOG'}
            </div>
          </div>
          <h3
            className={`${compact ? 'text-base' : 'text-xl'} font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2`}
          >
            {post.title}
          </h3>
          {!compact && post.excerpt && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-2">{post.excerpt}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {publishDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{publishDate}</span>
            </div>
          )}
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{post.readingTimeMinutes} min</span>
          </div>
        </div>

        {/* Tags */}
        {!compact && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Read more */}
        <div className="mt-3 text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors font-sans">
          READ_MORE{' '}
          <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// MDX Blog View (Fallback)
// =============================================================================

function MdxBlogView({ posts }: { posts: Awaited<ReturnType<typeof getAllBlogPosts>> }) {
  return (
    <section className="relative z-10 px-6 md:px-12 py-12">
      <div className="max-w-7xl mx-auto">
        <ElectronicFolder title="BLOG POSTS" classification="PUBLIC ACCESS // MARKET_ANALYSIS">
          {posts.length > 0 ? (
            posts.length > 6 ? (
              <DigitalScroll height="h-[800px]" className="not-prose">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 py-4">
                  {posts.map((post) => (
                    <MdxBlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </DigitalScroll>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 not-prose">
                {posts.map((post) => (
                  <MdxBlogCard key={post.slug} post={post} />
                ))}
              </div>
            )
          ) : (
            /* Empty State */
            <div className="text-center py-16 not-prose">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
              <p className="text-slate-400 mb-6">Intelligence is being gathered. Check back soon.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-sans text-sm transition-colors"
              >
                <span>←</span> RETURN_TO_BASE
              </Link>
            </div>
          )}
        </ElectronicFolder>
      </div>
    </section>
  );
}

// =============================================================================
// MDX Blog Card
// =============================================================================

function MdxBlogCard({ post }: { post: Awaited<ReturnType<typeof getAllBlogPosts>>[0] }) {
  const publishDate = new Date(post.frontmatter.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card Content */}
      <div className="p-6 flex-1">
        {/* Header */}
        <div className="mb-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-3 font-sans">
            BLOG
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
            {post.frontmatter.title}
          </h3>
          {post.frontmatter.description && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-2">
              {post.frontmatter.description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{publishDate}</span>
          </div>
          {post.readingTime && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{post.readingTime.text}</span>
              </div>
            </>
          )}
        </div>

        {/* Tags */}
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.frontmatter.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Read more */}
        <div className="mt-4 text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors font-sans">
          READ_MORE{' '}
          <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getClusterColorClasses(color: string) {
  const colorMap: Record<
    string,
    {
      border: string;
      text: string;
      textHover: string;
      gradient: string;
      badge: string;
    }
  > = {
    cyan: {
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      textHover: 'text-cyan-300',
      gradient: 'from-cyan-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
    },
    purple: {
      border: 'border-purple-500/40',
      text: 'text-purple-400',
      textHover: 'text-purple-300',
      gradient: 'from-purple-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
    },
    emerald: {
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      textHover: 'text-emerald-300',
      gradient: 'from-emerald-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    },
    amber: {
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      textHover: 'text-amber-300',
      gradient: 'from-amber-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
    rose: {
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      textHover: 'text-rose-300',
      gradient: 'from-rose-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    },
    blue: {
      border: 'border-blue-500/40',
      text: 'text-blue-400',
      textHover: 'text-blue-300',
      gradient: 'from-blue-950/50 via-slate-900/50 to-slate-900/50',
      badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    },
  };

  return colorMap[color] || colorMap.cyan;
}
