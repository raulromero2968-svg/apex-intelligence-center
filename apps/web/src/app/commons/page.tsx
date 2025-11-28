import Link from 'next/link';
import Image from 'next/image';
import { getAllCommonsPosts } from "@/lib/mdx";
import { Calendar, Clock, BookOpen, Sparkles } from 'lucide-react';
import { ElectronicFolder } from '../../../../../components/ui/ElectronicFolder';
import { DigitalScroll } from '../../../../../components/ui/DigitalScroll';
import { HoloCard } from '../../../../../components/ui/HoloCard';
import { DISSERTATION_CHAPTERS } from '@/components/phd/constants';
import { DissertationChapterBadge } from '@/components/phd/DissertationChapterBadge';

export const metadata = {
  title: "Apex Commons | Essays on Building Better Systems",
  description: "A public commons for better systems. Essays for builders who know they've been both harmed and harmful.",
};

export default async function CommonsPage() {
  const allPosts = await getAllCommonsPosts();

  return (
    <div className="relative min-h-screen pt-24">
      {/* PhD Framework - Chapter 02: Literature Review */}
      <DissertationChapterBadge
        chapter={DISSERTATION_CHAPTERS.LITERATURE_REVIEW}
        variant="floating"
      />

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            PUBLIC ARCHIVE // APEX_COMMONS
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Apex
            </span>
            <span className="block text-holographic">
              Commons
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            A public commons for better systems. Essays for builders who know they&apos;ve been both harmed and harmful.
            <span className="inline-block w-3 h-5 bg-purple-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Note on Heroes Card */}
      <section className="relative z-10 px-6 md:px-12 pb-12">
        <div className="max-w-3xl mx-auto">
          <HoloCard>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                <Sparkles 
                  className="w-5 h-5" 
                  strokeWidth={2} 
                  fill="none"
                  style={{
                    stroke: 'url(#prismatic-gradient)',
                    filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))'
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                  Note on Heroes
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Admire the work. Don&apos;t worship the person. We&apos;re building systems that assume human error, not systems that demand human perfection.
                </p>
              </div>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* Essays Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="ESSAYS" classification="PUBLIC ACCESS // APEX COMMONS">
            {/* Essays Grid with DigitalScroll when there are many posts */}
            {allPosts.length > 0 ? (
              allPosts.length > 6 ? (
                <DigitalScroll height="h-[800px]" className="not-prose">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 py-4">
                    {allPosts.map((post) => (
                      <EssayCard key={post.slug} post={post} />
                    ))}
                  </div>
                </DigitalScroll>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 not-prose">
                  {allPosts.map((post) => (
                    <EssayCard key={post.slug} post={post} />
                  ))}
                </div>
              )
            ) : (
              /* Empty State */
              <div className="text-center py-16 not-prose">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Essays Yet</h3>
                <p className="text-slate-400 mb-6">The commons is being prepared. Check back soon.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              CONTRIBUTE TO THE COMMONS
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Want to Stay Updated?
            </h2>

            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Get notified when new essays drop. Join the network.
            </p>

            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_50px_rgba(147,51,234,0.8)]"
            >
              GET ALPHA ACCESS
            </Link>
          </HoloCard>
        </div>
      </section>
    </div>
  );
}

// Extracted Essay Card Component for cleaner code
function EssayCard({ post }: { post: any }) {
  const publishDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/commons/${post.slug}`}
      className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Hero/Thumbnail Image */}
      {(post.frontmatter.thumbnail || post.frontmatter.heroImage) && (
        <div className="relative w-full h-48 overflow-hidden border-b border-cyan-900/30">
          <Image
            src={post.frontmatter.thumbnail || post.frontmatter.heroImage}
            alt={post.frontmatter.title}
            fill
            quality={80}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
          {/* Cyberpunk Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 flex-1">
        {/* Header */}
        <div className="mb-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-3 font-mono">
            {post.frontmatter.category}
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
            {post.frontmatter.title}
          </h3>
          {post.frontmatter.subtitle && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-2">
              {post.frontmatter.subtitle}
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
        <div className="mt-4 text-sm text-purple-400 group-hover:text-purple-300 transition-colors font-mono">
          READ_MORE <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
