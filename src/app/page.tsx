'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import MobileNav from '@/components/nav/MobileNav';
import SearchBar from '@/components/search/SearchBar';
import ToolCarousel from '@/components/carousel/ToolCarousel';
import ArticleFilter from '@/components/filters/ArticleFilter';
import RouteTransition from '@/layout/RouteTransition';

// Sample data
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/research', label: 'Research' },
  { href: '/insights', label: 'Insights' },
  { href: '/subscribe', label: 'Subscribe' },
];

const tools = [
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track your TCG collection value in real-time',
    iconId: 'portfolio-tracker' as const,
    href: '/tool-tracker',
  },
  {
    id: 'trade-calculator',
    name: 'Trade Calculator',
    description: 'Calculate optimal trade values',
    iconId: 'trade-calculator' as const,
    href: '/tool-calculator',
  },
  {
    id: 'grading-optimizer',
    name: 'Grading Optimizer',
    description: 'Determine which cards to grade for maximum ROI',
    iconId: 'grading-optimizer' as const,
    href: '/tool-grading',
  },
  {
    id: 'bulk-analyzer',
    name: 'Bulk Deal Analyzer',
    description: 'Analyze bulk purchases and deals',
    iconId: 'bulk-analyzer' as const,
    href: '/tool-bulk-deal',
  },
  {
    id: 'reprint-predictor',
    name: 'Reprint Risk Predictor',
    description: 'Predict reprint probability and timing',
    iconId: 'reprint-predictor' as const,
    href: '/tool-reprint-risk',
  },
  {
    id: 'sealed-analyzer',
    name: 'Sealed Product Analyzer',
    description: 'Analyze sealed product investment opportunities',
    iconId: 'sealed-analyzer' as const,
    href: '/tool-sealed',
  },
  {
    id: 'tax-dashboard',
    name: 'Tax Dashboard',
    description: 'Comprehensive tax reporting and planning',
    iconId: 'tax-dashboard' as const,
    href: '/tool-tax-dashboard',
  },
];

const sampleArticles = [
  {
    id: '1',
    title: 'Market Analysis: Q1 2025 Trends',
    category: 'market',
    excerpt: 'Comprehensive analysis of TCG market trends in Q1 2025',
    date: '2025-01-15',
  },
  {
    id: '2',
    title: 'Advanced Grading Strategies',
    category: 'guides',
    excerpt: 'Expert guide to maximizing ROI through strategic grading',
    date: '2025-01-12',
  },
  {
    id: '3',
    title: 'Research: Sealed Product Performance',
    category: 'research',
    excerpt: 'In-depth research on sealed product investment returns',
    date: '2025-01-10',
  },
  {
    id: '4',
    title: 'Price Alert: Modern Horizons 3',
    category: 'alerts',
    excerpt: 'Significant price movements detected in MH3 singles',
    date: '2025-01-08',
  },
  {
    id: '5',
    title: 'Tool Spotlight: Portfolio Tracker',
    category: 'tools',
    excerpt: 'How to use the Portfolio Tracker for maximum efficiency',
    date: '2025-01-05',
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      toast.success(`Searching for: ${query}`, {
        description: 'Results will appear below',
      });
    }
  };

  return (
    <RouteTransition>
      <div className="min-h-screen">
        {/* Navigation */}
        <MobileNav links={navLinks} />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-6 py-12">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              TCG Intelligence Center
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Professional-grade market intelligence and tools for serious TCG collectors
            </p>

            {/* Demo Toast Button */}
            <button
              onClick={() => toast.success('Welcome to Apex Intelligence!', {
                description: 'PS5-style notifications are now active',
              })}
              className="px-6 py-3 bg-cyan-400 text-ink rounded-lg font-medium hover:bg-cyan-300 transition-colors"
            >
              Test Notification
            </button>
          </section>

          {/* Search Bar */}
          <section>
            <SearchBar onSearch={handleSearch} />
          </section>

          {/* Tools Carousel */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Collector Tools</h2>
              <p className="text-white/70">
                Professional-grade tools for TCG market analysis and portfolio management
              </p>
            </div>
            <ToolCarousel tools={tools} />
          </section>

          {/* Articles Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Latest Intelligence</h2>
              <p className="text-white/70">
                Market insights, research, and analysis from industry experts
              </p>
            </div>
            <ArticleFilter articles={sampleArticles} />
          </section>

          {/* Footer Spacing */}
          <div className="h-24" />
        </main>
      </div>
    </RouteTransition>
  );
}
