'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
}

const ARTICLES: Article[] = [
  {
    slug: 'q4-2024-market-analysis',
    title: 'Q4 2024 TCG Market Analysis',
    description: 'Comprehensive market analysis covering Pokemon, MTG, and Yu-Gi-Oh performance in Q4 2024',
    category: 'Market Analysis',
    date: 'Oct 25, 2024',
    readTime: '8 min',
    tags: ['Market Analysis', 'Pokemon', 'MTG', 'Investment'],
  },
  {
    slug: 'pokemon-151-value-trajectory',
    title: 'Pokemon 151: Value Trajectory Analysis',
    description: 'Deep dive into Pokemon 151 set performance and future value predictions',
    category: 'Set Analysis',
    date: 'Oct 20, 2024',
    readTime: '6 min',
    tags: ['Pokemon', 'Set Analysis', 'Investment', '151'],
  },
  {
    slug: 'graded-vs-raw-2024',
    title: 'Graded vs Raw: 2024 Edition',
    description: 'Complete guide to card grading economics, ROI, and strategy in 2024',
    category: 'Investment Guide',
    date: 'Oct 15, 2024',
    readTime: '10 min',
    tags: ['Grading', 'Investment Guide', 'PSA', 'BGS'],
  },
  {
    slug: 'lorcana-investment-thesis-2025',
    title: 'Lorcana Investment Thesis 2025',
    description: 'Analysis of Disney Lorcana as an emerging investment opportunity',
    category: 'Investment Guide',
    date: 'Jan 10, 2025',
    readTime: '7 min',
    tags: ['Lorcana', 'Investment', 'Disney'],
  },
  {
    slug: 'japanese-vs-english-tcg-markets',
    title: 'Japanese vs English: TCG Market Comparison',
    description: 'Regional market analysis comparing Japanese and English TCG markets',
    category: 'Market Analysis',
    date: 'Dec 5, 2024',
    readTime: '9 min',
    tags: ['Market Analysis', 'Japanese Cards', 'Regional Markets'],
  },
  {
    slug: 'pokemon-151-vs-evolving-skies',
    title: 'Pokemon 151 vs Evolving Skies: Set Comparison',
    description: 'Head-to-head comparison of two major Pokemon sets',
    category: 'Set Analysis',
    date: 'Nov 20, 2024',
    readTime: '8 min',
    tags: ['Pokemon', 'Set Analysis', '151', 'Evolving Skies'],
  },
  {
    slug: 'vintage-wotc-market-report-q3-2025',
    title: 'Vintage WOTC Report Q3 2025',
    description: 'Q3 2025 analysis of the Wizards of the Coast era vintage cards',
    category: 'Market Report',
    date: 'Sep 15, 2025',
    readTime: '12 min',
    tags: ['Vintage', 'WOTC', 'Market Report', 'Pokemon'],
  },
];

export function IntelSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = ARTICLES.filter((article) => {
        const searchText = query.toLowerCase();
        return (
          article.title.toLowerCase().includes(searchText) ||
          article.description.toLowerCase().includes(searchText) ||
          article.category.toLowerCase().includes(searchText) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchText))
        );
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/40 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-colors text-sm text-gray-400 hover:text-cyan-400"
      >
        <Search size={16} />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-gray-800 rounded">⌘K</kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                  <Search size={20} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search intelligence reports..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                  />
                  <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {query.length > 0 && results.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No results found for "{query}"
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="py-2">
                      {results.map((article) => (
                        <Link
                          key={article.slug}
                          href={`/intel/${article.slug}`}
                          onClick={handleClose}
                          className="block px-4 py-3 hover:bg-gray-800/50 transition-colors border-l-2 border-transparent hover:border-cyan-500"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-cyan-400">{article.category}</span>
                              </div>
                              <h3 className="text-white font-semibold mb-1">{article.title}</h3>
                              <p className="text-sm text-gray-400 line-clamp-1">{article.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {article.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {article.readTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {query.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      <p>Start typing to search articles...</p>
                      <p className="mt-2 text-xs">Try "Pokemon", "grading", "investment", etc.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
