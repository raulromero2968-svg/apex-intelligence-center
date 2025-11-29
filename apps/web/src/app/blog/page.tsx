import Link from 'next/link';
import { Calendar, Clock, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { getAllBlogPosts } from "@/lib/mdx";
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import { HoloCard } from '@/components/ui/HoloCard';

export const metadata = {
  title: "Apex Blog | Market Analysis & Insights",
  description: "Latest TCG market analysis, trends, and insights from the underground intelligence network.",
};

export default async function BlogPage() {
  const allBlogPosts = await getAllBlogPosts();

  return (
    <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            MARKET_INTELLIGENCE // BLOG_ARCHIVE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Market
            </span>
            <span className="block text-holographic">
              Intelligence
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Latest TCG market analysis, trends, and insights from the underground intelligence network.
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
                    filter: 'drop-shadow(0 0 6px #06b6d4) drop-shadow(0 0 12px #a855f7)'
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                  Underground Intelligence
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Data-driven analysis for serious collectors. No hype, just signal.
                </p>
              </div>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <ElectronicFolder title="BLOG POSTS" classification="PUBLIC ACCESS // MARKET_ANALYSIS">
            {allBlogPosts.length > 0 ? (
              allBlogPosts.length > 6 ? (
                <DigitalScroll height="h-[800px]" className="not-prose">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 py-4">
                    {allBlogPosts.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </DigitalScroll>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 not-prose">
                  {allBlogPosts.map((post) => (
                    <BlogCard key={post.slug} post={post} />
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

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <HoloCard intensity="high" className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              SUBSCRIBE_FOR_UPDATES
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Want Weekly Intel?
            </h2>

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
  );
}

// Blog Card Component
function BlogCard({ post }: { post: any }) {
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
          READ_MORE <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
