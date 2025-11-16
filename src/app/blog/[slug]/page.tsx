'use client';

import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import SectionShell from '../../(sections)/SectionShell';
import { blogPosts } from '@/content/seed';

interface BlogPostPageProps {
  params: { slug: string };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const article = useMemo(() => {
    const path = `/blog/${params.slug}`;
    return blogPosts.find((a) => a.href === path);
  }, [params.slug]);

  if (!article) {
    return notFound();
  }

  return (
    <SectionShell title={article.title} kicker="Blog">
      <article className="max-w-3xl mx-auto space-y-6">
        <div className="text-sm text-white/60">
          <span>{new Date(article.date).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{article.read}</span>
        </div>
        <p className="text-lg text-white/80">{article.excerpt}</p>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-white/50">
          Full article content for this piece is coming soon. For now, use this as
          a teaser and navigation anchor while we wire in the full CMS.
        </p>
      </article>
    </SectionShell>
  );
}


