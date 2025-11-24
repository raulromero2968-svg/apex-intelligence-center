import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import SectionShell from '../../(sections)/SectionShell';
import { getCommonsBySlug, getAllCommonsSlugs } from '@/lib/mdx';
import { Clock, Calendar, User, BookOpen } from 'lucide-react';

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

// Header component
function CommonsHeader({ post }: { post: any }) {
  const publishDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="mb-8 space-y-6">
      {/* Hero Image */}
      {post.frontmatter.heroImage && (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-cyan-500/20">
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

      {/* Subtitle */}
      {post.frontmatter.subtitle && (
        <div className="text-center">
          <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-semibold">
            {post.frontmatter.subtitle}
          </p>
        </div>
      )}

      {/* Meta Information */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
        {post.frontmatter.author && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.frontmatter.author}</span>
            </div>
            <span className="text-white/30">•</span>
          </>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={post.frontmatter.publishedAt}>{publishDate}</time>
        </div>

        {post.readingTime && (
          <>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readingTime.text}</span>
            </div>
          </>
        )}

        <span className="text-white/30">•</span>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {post.frontmatter.category}
        </div>
      </div>

      {/* Tags */}
      {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {post.frontmatter.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-purple-400/40 bg-purple-400/10 px-3 py-1 text-xs uppercase tracking-wide text-purple-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="w-24 h-1 mx-auto bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 rounded-full" />
    </header>
  );
}

// Main page component
export default async function CommonsPostPage({ params }: CommonsPageProps) {
  const post = await getCommonsBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  return (
    <SectionShell title={post.frontmatter.title} kicker="Commons">
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <CommonsHeader post={post} />

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
            prose-headings:text-white
            prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:font-medium prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-em:text-white/90
            prose-blockquote:border-l-4 prose-blockquote:border-cyan-400/50 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-white/70
            prose-code:text-cyan-300 prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
            prose-ul:list-disc prose-ul:pl-6 prose-ul:text-white/80
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-white/80
            prose-li:mb-2
            prose-hr:border-white/20 prose-hr:my-8
          ">
            {post.content}
          </div>
        </Suspense>

        {/* Footer Navigation */}
        <Suspense fallback={null}>
          <div className="mt-16 pt-8 border-t border-cyan-500/20">
            <div className="text-center">
              <a
                href="/commons"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 hover:border-cyan-400/60 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20"
              >
                <BookOpen className="w-4 h-4" />
                More Essays
              </a>
            </div>
          </div>
        </Suspense>
      </article>
    </SectionShell>
  );
}
