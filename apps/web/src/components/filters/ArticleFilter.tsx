"use client";
// @ts-nocheck - React types conflict with Suspense, disabling TypeScript for this file

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'research', label: 'Research' },
  { id: 'market', label: 'Market' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'tools', label: 'Tools' },
  { id: 'guides', label: 'Guides' },
] as const;

type Category = typeof CATEGORIES[number]['id'];

interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
}

interface ArticleFilterProps {
  articles: Article[];
}

function ArticleFilterContent({ articles }: ArticleFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [resultCount, setResultCount] = useState(articles.length);

  // Sync with URL on mount
  useEffect(() => {
    if (!searchParams) return;
    const urlCategory = searchParams.get('cat') as Category | null;
    if (urlCategory && CATEGORIES.some(c => c.id === urlCategory)) {
      setActiveCategory(urlCategory);
    }
  }, [searchParams]);

  // Filter articles when category changes
  useEffect(() => {
    const filtered = activeCategory === 'all'
      ? articles
      : articles.filter(article => article.category === activeCategory);

    setFilteredArticles(filtered);
    setResultCount(filtered.length);
  }, [activeCategory, articles]);

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);

    // Update URL with category parameter
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (category === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', category);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Article categories"
        className="flex flex-wrap justify-center gap-4 mb-8"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="article-list"
              onClick={() => handleCategoryChange(category.id)}
              className={`
                relative px-6 py-3 min-h-[44px] rounded-lg font-medium
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink
                ${isActive
                  ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/50'
                  : 'bg-transparent border-2 border-white/20 text-white hover:border-cyan-500/50 hover:text-cyan-300'
                }
              `}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {`Showing ${resultCount} ${resultCount === 1 ? 'article' : 'articles'} ${
          activeCategory !== 'all' ? `in ${activeCategory}` : ''
        }`}
      </div>

      {/* Filtered Articles List */}
      <motion.div
        id="article-list"
        role="tabpanel"
        aria-label={`${activeCategory} articles`}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-cyan-400/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 cursor-pointer"
            >
              <Link href={article.id} className="block h-full p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {article.title}
                </h3>
                <p className="text-sm text-purple-500 mb-3 capitalize">
                  {article.category}
                </p>
                <p className="text-white/70 mb-4">{article.excerpt}</p>
                <time className="text-sm text-white/50">{article.date}</time>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50 text-lg">
            No articles found in this category.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ArticleFilter({ articles }: ArticleFilterProps) {
  // @ts-ignore - React types conflict
  return (
    <Suspense fallback={<div className="w-full">Loading filters...</div>}>
      <ArticleFilterContent articles={articles} />
    </Suspense>
  );
}

