import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import SectionShell from '../../(sections)/SectionShell';
import { getArticleBySlug, getAllArticleSlugs } from '@/lib/mdx';
import { BookOpen, Calendar } from 'lucide-react';

interface ResearchPageProps {
  params: { slug: string };
}

// Enable ISR with tag-based revalidation
export const revalidate = false; // On-demand via tags

// Generate static params for all articles
export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ResearchPageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Research Not Found',
    };
  }

  // Generate OG image URL if og: true in frontmatter
  const ogImageUrl = article.frontmatter.og
    ? `/api/og?title=${encodeURIComponent(article.frontmatter.title)}&category=${encodeURIComponent(article.frontmatter.category)}`
    : article.frontmatter.heroImage;

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.tags?.join(', ') || '',
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.tags?.join(', ') || '',
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
      type: 'article',
      publishedTime: article.frontmatter.publishedAt,
    },
  };
}

// Article header component
function ArticleHeader({ article }: { article: any }) {
  const publishDate = new Date(article.frontmatter.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="mb-8 space-y-6">
      {/* Hero Image */}
      {article.frontmatter.heroImage && (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-cyan-500/20">
          <Image
            src={article.frontmatter.heroImage}
            alt={article.frontmatter.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      )}

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={article.frontmatter.publishedAt}>{publishDate}</time>
        </div>

        {article.frontmatter.sourceCount && (
          <>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{article.frontmatter.sourceCount} sources</span>
            </div>
          </>
        )}

        <span className="text-white/30">•</span>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {article.frontmatter.category}
        </div>
      </div>

      {/* Tags */}
      {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.frontmatter.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

// Main research page component
// @ts-ignore - React types conflict throughout component tree
export default async function ResearchArticlePage({ params }: ResearchPageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return notFound();
  }

  // @ts-ignore - React types conflict with Suspense
  return (
    <SectionShell title={article.frontmatter.title} kicker="Research">
      <article className="max-w-4xl mx-auto">
        {/* Static shell - renders immediately */}
        <ArticleHeader article={article} />

        {/* MDX Content - streamed with Suspense */}
    // @ts-ignore - React types conflict
        <Suspense fallback={
          <div className="prose prose-invert max-w-none">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>
        }>
          <div className="prose prose-invert max-w-none">
            {article.content}
          </div>
        </Suspense>

        {/* Sources Section - streamed separately */}
    // @ts-ignore - React types conflict
        <Suspense fallback={null}>
          {article.frontmatter.sources && article.frontmatter.sources.length > 0 && (
            <section className="mt-12 pt-8 border-t border-cyan-500/20">
              <h2 className="text-2xl font-bold text-white mb-6">Key Sources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {article.frontmatter.sources.map((source: any, idx: number) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 p-4 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 bg-black/40 backdrop-blur-sm transition-all"
                  >
                    {source.thumbnail && (
                      <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={source.thumbnail}
                          alt={source.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {source.name}
                      </h3>
                      <p className="text-sm text-white/60 line-clamp-2 mt-1">
                        {source.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </Suspense>
      </article>
    </SectionShell>
  );
}


