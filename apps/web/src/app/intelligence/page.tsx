'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import RouteTransition from '@/layout/RouteTransition';
import ContentCard from '@/components/ContentCard';
import { ContentKind } from '@/lib/routeMap';
import { blogPosts, researchReports, intelNotes } from '@/content/seed';

type TCG = 'All' | 'Pokemon' | 'MTG' | 'YuGiOh';
const tabs: TCG[] = ['All', 'Pokemon', 'MTG', 'YuGiOh'];

type ContentItem = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt: string;
  dateISO: string;
  badge: string;
  tcg?: TCG;
  imageUrl?: string;
  sources?: number;
  readTime?: number;
};

// Aggregate all content from seed data
function getAllContent(): ContentItem[] {
  const allContent: ContentItem[] = [
    ...blogPosts.map((a) => ({
      kind: 'blog' as ContentKind,
      slug: a.href.replace('/blog/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Blog',
      tcg: detectTCG(a.title + ' ' + a.excerpt),
      imageUrl: a.imageUrl,
      sources: a.sources,
      readTime: a.readTime,
    })),
    ...researchReports.map((a) => ({
      kind: 'research' as ContentKind,
      slug: a.href.replace('/research/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Research',
      tcg: detectTCG(a.title + ' ' + a.excerpt),
      imageUrl: a.imageUrl,
      sources: a.sources,
      readTime: a.readTime,
    })),
    ...intelNotes.map((a) => ({
      kind: 'intel' as ContentKind,
      slug: a.href.replace('/intel/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Intel',
      tcg: detectTCG(a.title + ' ' + a.excerpt),
      imageUrl: a.imageUrl,
      sources: a.sources,
      readTime: a.readTime,
    })),
  ];

  return allContent.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

// Simple TCG detection based on keywords
function detectTCG(text: string): TCG {
  const lower = text.toLowerCase();
  if (lower.includes('pokémon') || lower.includes('pokemon')) return 'Pokemon';
  if (lower.includes('magic') || lower.includes('mtg')) return 'MTG';
  if (lower.includes('yu-gi-oh') || lower.includes('yugioh')) return 'YuGiOh';
  return 'All';
}

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TCG>('All');
  const allContent = getAllContent();

  const filteredContent = activeTab === 'All'
    ? allContent
    : allContent.filter((item) => item.tcg === activeTab);

  return (
    <RouteTransition>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8 space-y-10">
          {/* Header */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Latest Intelligence
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Market insights, research, and analysis across all TCG markets
            </p>
          </section>

          {/* Tab Filters */}
          <section className="flex justify-center">
            <div className="relative inline-flex rounded-xl bg-white/5 p-1 backdrop-blur-sm border border-white/10">
              {tabs.map((tab) => {
                const selected = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    data-tour={tab === 'All' ? 'intelligence-tabs' : undefined}
                    className="relative z-10 px-6 py-2 text-sm rounded-xl text-white/80 hover:text-white transition-colors duration-300"
                  >
                    {tab}
                    {selected && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 shadow-lg shadow-cyan-400/20"
                        transition={{
                          duration: 0.34,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Content Grid */}
          <section>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredContent.map((item) => (
                <ContentCard key={`${item.kind}-${item.slug}`} {...item} />
              ))}
            </motion.div>

            {filteredContent.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50 text-lg">
                  No content found for {activeTab}. Check back soon!
                </p>
              </div>
            )}
          </section>

          {/* Footer Spacing */}
          <div className="h-24" />
        </main>
      </div>
    </RouteTransition>
  );
}
