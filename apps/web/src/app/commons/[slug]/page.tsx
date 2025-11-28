import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCommonsBySlug, getAllCommonsSlugs } from '@/lib/mdx';
import { Clock, Calendar, User, BookOpen, ArrowLeft, Terminal } from 'lucide-react';
import { ShareButtons } from '@/components/content/ShareButtons';

interface CommonsPageProps {
  params: { slug: string };
}

// Enable static generation
export const revalidate = false;

// Generate static params for all commons posts
export async function generateStaticParams() {
  const slugs = await getAllCommonsSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CommonsPageProps) {
  const post = await getCommonsBySlug(params.slug);

  if (!post) {
    return {
      title: 'Essay Not Found',
    };
  }

  const description = post.frontmatter.subtitle || post.frontmatter.tags?.join(', ') || '';

  return {
    title: `${post.frontmatter.title} | Apex Commons`,
    description,
    authors: [{ name: post.frontmatter.author || 'Apex Commons' }],
    openGraph: {
      title: post.frontmatter.title,
      description,
      type: 'article',
      publishedTime: post.frontmatter.publishedAt,
      authors: [post.frontmatter.author || 'Apex Commons'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description,
    },
  };
}

// Main page component
export default async function CommonsPostPage({ params }: CommonsPageProps) {
  const post = await getCommonsBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const publishDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-screen pt-24 pb-20 bg-black">
      {/* Scanline effect overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)',
        }} />
      </div>

      {/* Back to Commons */}
      <div className="max-w-5xl mx-auto px-6 mb-8 relative z-10">
        <Link
          href="/commons"
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono border border-cyan-500/30 px-4 py-2 rounded hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <ArrowLeft className="w-4 h-4" />
          [ RETURN_TO_COMMONS ]
        </Link>
      </div>

      {/* Digital Scroll Container */}
      <article className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Terminal Header with Prismatic Pulse Border */}
        <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 backdrop-blur-sm rounded-t-xl overflow-hidden">
          {/* Prismatic Pulse Effect - Outer Edges */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Top Edge */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse-slide" />
            {/* Right Edge */}
            <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-60 animate-pulse-slide-vertical" />
            {/* Bottom Edge */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse-slide-reverse" />
            {/* Left Edge */}
            <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-60 animate-pulse-slide-vertical-reverse" />
          </div>
          {/* Terminal Title Bar */}
          <div className="bg-black/60 border-b border-cyan-500/30 px-6 py-3 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono text-sm">APEX_COMMONS_DOCUMENT_VIEWER</span>
            <div className="ml-auto flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
          </div>

          {/* Hero Image */}
          {post.frontmatter.heroImage && (
            <div className="relative w-full h-[400px] overflow-hidden border-b border-cyan-500/20">
              <Image
                src={post.frontmatter.heroImage}
                alt={post.frontmatter.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Overlay Title on Image */}
              <div className="absolute inset-0 flex items-end p-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    {post.frontmatter.category || 'COMMONS'}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-holographic font-mono">
                    {post.frontmatter.title}
                  </h1>
                  {post.frontmatter.subtitle && (
                    <p className="text-xl text-cyan-300 font-mono">
                      {post.frontmatter.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meta Information Bar */}
          <div className="bg-black/40 border-b border-cyan-500/20 px-6 py-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
              {post.frontmatter.author && (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{post.frontmatter.author}</span>
                  </div>
                  <span className="text-slate-600">|</span>
                </>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <time dateTime={post.frontmatter.publishedAt}>{publishDate}</time>
              </div>

              {post.readingTime && (
                <>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{post.readingTime.text}</span>
                  </div>
                </>
              )}

              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <div className="flex flex-wrap gap-2">
                    {post.frontmatter.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 uppercase text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Document Content - Digital Scroll */}
          <div className="px-8 py-12 bg-black/20">
            <Suspense fallback={
              <div className="essay-content prose prose-invert prose-lg max-w-none font-mono">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-cyan-500/10 rounded w-3/4"></div>
                  <div className="h-4 bg-cyan-500/10 rounded w-full"></div>
                  <div className="h-4 bg-cyan-500/10 rounded w-5/6"></div>
                </div>
              </div>
            }>
              <div className="essay-content prose prose-invert prose-lg max-w-none font-mono
                prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:font-mono
                prose-h1:text-4xl prose-h1:mt-0 prose-h1:mb-8 prose-h1:text-holographic prose-h1:hidden
                prose-h2:text-2xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-cyan-500/30
                prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-purple-300
                prose-h4:text-lg prose-h4:mt-8 prose-h4:mb-3
                prose-p:text-slate-300 prose-p:leading-[2] prose-p:mb-12 prose-p:text-base
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:underline prose-a:transition-colors
                prose-strong:text-white prose-strong:font-bold
                prose-em:text-slate-200 prose-em:italic
                prose-blockquote:border-l-4 prose-blockquote:border-purple-400/50 prose-blockquote:pl-6 prose-blockquote:py-3 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-purple-200 prose-blockquote:bg-purple-950/20 prose-blockquote:rounded-r
                prose-code:text-cyan-300 prose-code:bg-black/60 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                prose-pre:bg-black/80 prose-pre:border prose-pre:border-cyan-500/30 prose-pre:rounded-lg prose-pre:shadow-[0_0_20px_rgba(6,182,212,0.1)]
                prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3 prose-ul:text-slate-300
                prose-ol:list-none prose-ol:pl-0 prose-ol:space-y-3 prose-ol:text-slate-300
                prose-li:text-slate-300 prose-li:leading-relaxed prose-li:pl-6 prose-li:relative
                prose-li:before:content-['▹'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-cyan-400
                prose-hr:border-0 prose-hr:my-16 prose-hr:h-[2px] prose-hr:bg-gradient-to-r prose-hr:from-transparent prose-hr:via-cyan-400/50 prose-hr:to-transparent prose-hr:relative prose-hr:before:content-[''] prose-hr:before:absolute prose-hr:before:left-1/2 prose-hr:before:-translate-x-1/2 prose-hr:before:-top-1 prose-hr:before:w-2 prose-hr:before:h-2 prose-hr:before:bg-cyan-400 prose-hr:before:rotate-45 prose-hr:before:shadow-[0_0_10px_rgba(6,182,212,0.8)] prose-hr:after:content-[''] prose-hr:after:absolute prose-hr:after:left-[20%] prose-hr:after:-top-0.5 prose-hr:after:w-1 prose-hr:after:h-1 prose-hr:after:bg-purple-400 prose-hr:after:rounded-full prose-hr:after:shadow-[0_0_6px_rgba(168,85,247,0.8)]
                prose-img:rounded-lg prose-img:border prose-img:border-cyan-500/20 prose-img:shadow-[0_0_30px_rgba(6,182,212,0.2)]
              ">
                {post.content}
              </div>
            </Suspense>
          </div>

          {/* Terminal Footer with Share Actions */}
          <div className="bg-black/60 border-t border-cyan-500/30 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
              <span className="text-slate-500">END_OF_DOCUMENT</span>
              
              {/* Share Actions */}
              <ShareButtons 
                title={post.frontmatter.title}
                subtitle={post.frontmatter.subtitle}
              />
              
              <span className="text-cyan-400 text-[10px]">[ SCROLL: 100% ]</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <Suspense fallback={null}>
          <div className="mt-12 pt-8 border-t border-cyan-500/20">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-slate-400 mb-4 font-mono text-sm">
                  [ EXPLORE_MORE_DOCUMENTS ]
                </p>
                <Link
                  href="/commons"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/40 hover:border-purple-400/70 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/20 font-mono text-sm"
                >
                  <BookOpen className="w-5 h-5" />
                  COMMONS_ARCHIVE
                </Link>
              </div>
            </div>
          </div>
        </Suspense>
      </article>
    </div>
  );
}
