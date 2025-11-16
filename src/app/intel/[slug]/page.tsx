'use client';

import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import SectionShell from '../../(sections)/SectionShell';
import { intelNotes } from '@/content/seed';

interface IntelPageProps {
  params: { slug: string };
}

export default function IntelArticlePage({ params }: IntelPageProps) {
  const article = useMemo(() => {
    const path = `/intel/${params.slug}`;
    return intelNotes.find((a) => a.href === path);
  }, [params.slug]);

  if (!article) {
    return notFound();
  }

  return (
    <SectionShell title={article.title} kicker="Intel Note">
      <article className="max-w-3xl mx-auto space-y-6">
        <div className="text-sm text-white/60">
          <span>{new Date(article.date).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{article.read}</span>
          {article.badge && (
            <>
              <span className="mx-2">•</span>
              <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                {article.badge}
              </span>
            </>
          )}
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
          This intel note is a summary of a larger internal briefing. Full deep‑dive
          content will be attached here in a later phase of the rollout.
        </p>
      </article>
    </SectionShell>
  );
}


