import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCommonsBySlug, getAllCommonsSlugs } from '@/lib/mdx';
import { Clock, Calendar, User, BookOpen, ArrowLeft } from 'lucide-react';

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
    <div className="relative min-h-screen pt-24 pb-20">
      {/* Back to Commons */}
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <Link
          href="/commons"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK_TO_COMMONS
        </Link>
      </div>

      <article className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className="mb-12 space-y-6">
          {/* Category Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              {post.frontmatter.category || 'COMMONS'}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-center">
            <span className="text-holographic">
              {post.frontmatter.title}
            </span>
          </h1>

          {/* Subtitle */}
          {post.frontmatter.subtitle && (
            <p className="text-xl md:text-2xl text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">
              {post.frontmatter.subtitle}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400 font-mono">
            {post.frontmatter.author && (
              <>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.frontmatter.author}</span>
                </div>
                <span className="text-slate-600">•</span>
              </>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.frontmatter.publishedAt}>{publishDate}</time>
            </div>

            {post.readingTime && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readingTime.text}</span>
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {post.frontmatter.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-purple-400/40 bg-purple-400/10 px-3 py-1 text-xs uppercase tracking-wide text-purple-300 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="flex justify-center">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </header>

        {/* Hero Image */}
        {post.frontmatter.heroImage && (
          <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-purple-500/20 mb-12">
            <Image
              src={post.frontmatter.heroImage}
              alt={post.frontmatter.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        )}

        {/* MDX Content */}
        <Suspense fallback={
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>
        }>
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mt-16 prose-h1:mb-6 prose-h1:text-holographic
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-transparent prose-h2:bg-clip-text prose-h2:bg-gradient-to-r prose-h2:from-purple-400 prose-h2:to-cyan-400
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:underline prose-a:transition-colors
            prose-strong:text-white prose-strong:font-bold
            prose-em:text-slate-200 prose-em:italic
            prose-blockquote:border-l-4 prose-blockquote:border-purple-400/50 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-slate-400 prose-blockquote:bg-purple-950/20 prose-blockquote:rounded-r-lg
            prose-code:text-cyan-300 prose-code:bg-black/60 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-black/60 prose-pre:border prose-pre:border-cyan-500/20 prose-pre:rounded-lg
            prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300 prose-ul:space-y-2
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300 prose-ol:space-y-2
            prose-li:text-slate-300 prose-li:leading-relaxed
            prose-hr:border-purple-500/30 prose-hr:my-12
            prose-img:rounded-lg prose-img:border prose-img:border-purple-500/20
          ">
            {post.content}
          </div>
        </Suspense>

        {/* Footer Navigation */}
        <Suspense fallback={null}>
          <div className="mt-20 pt-12 border-t border-purple-500/20">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-slate-400 mb-4 font-mono">
                  Enjoyed this essay? Explore more from the Commons.
                </p>
                <Link
                  href="/commons"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/40 hover:border-purple-400/70 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/20 font-mono"
                >
                  <BookOpen className="w-5 h-5" />
                  EXPLORE_MORE_ESSAYS
                </Link>
              </div>

              {/* Share Section */}
              <div className="flex items-center gap-4 text-sm text-slate-500 font-mono">
                <span>SHARE_THIS_ESSAY</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white">
                    Twitter
                  </button>
                  <button className="px-3 py-1 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white">
                    LinkedIn
                  </button>
                  <button className="px-3 py-1 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white">
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Suspense>
      </article>
    </div>
  );
}
