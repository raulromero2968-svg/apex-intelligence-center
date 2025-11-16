'use client';

import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import SectionShell from '../../(sections)/SectionShell';
import { researchReports } from '@/content/seed';

interface ResearchPageProps {
  params: { slug: string };
}

export default function ResearchArticlePage({ params }: ResearchPageProps) {
  const article = useMemo(() => {
    const path = `/research/${params.slug}`;
    return researchReports.find((a) => a.href === path);
  }, [params.slug]);

  if (!article) {
    return notFound();
  }

  return (
    <SectionShell title={article.title} kicker="Research">
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
          Full research write‑up coming soon. This page is a detailed teaser so you can
          link directly into key topics from dashboards and navigation.
        </p>
      </article>
    </SectionShell>
  );
}


