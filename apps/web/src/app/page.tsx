'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Sparkles, ArrowRight, Terminal } from 'lucide-react';
import MobileNav from '@/components/nav/MobileNav';
import SearchBar from '@/components/search/SearchBar';
import ToolCarousel from '@/components/carousel/ToolCarousel';
import ContentCard from '@/components/ContentCard';
import HorizontalCarousel from '@/components/HorizontalCarousel';
import RouteTransition from '@/layout/RouteTransition';
import ResearchDialog from '@/components/research/ResearchDialog';
import { blogPosts, researchReports, intelNotes } from '@/content/seed';
import { ContentKind } from '@/lib/routeMap';
import { WolfConstellation } from '@/components/hero/WolfConstellation';

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

// Latest Intelligence on the homepage is sourced from the same seeded content
// used on the Blog / Research / Intel pages so everything stays in sync.
// Convert to ContentItem format with kind and slug
function getHomeFeed() {
  const allContent = [
    ...blogPosts.map((a) => ({
      kind: 'blog' as ContentKind,
      slug: a.href.replace('/blog/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Blog',
    })),
    ...researchReports.map((a) => ({
      kind: 'research' as ContentKind,
      slug: a.href.replace('/research/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Research',
    })),
    ...intelNotes.map((a) => ({
      kind: 'intel' as ContentKind,
      slug: a.href.replace('/intel/', ''),
      title: a.title,
      excerpt: a.excerpt,
      dateISO: a.date,
      badge: 'Intel',
    })),
  ];

  // Return exactly 6 items for the carousel
  return allContent.slice(0, 6);
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const feedItems = getHomeFeed();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // When user submits search (Enter key or form submit), open ResearchDialog
    if (query.trim()) {
      setInitialQuery(query.trim());
      setIsResearchDialogOpen(true);
    }
  };

  const handleOpenResearch = () => {
    setIsResearchDialogOpen(true);
  };

  // Handle Ctrl+K to open research panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Only if not in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleOpenResearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <RouteTransition>
      <div className="min-h-screen">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-16">
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center min-h-[90vh] px-4 md:px-20 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-7xl items-center">
              {/* Left Column: Copy */}
              <div className="space-y-8 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  TCG Intelligence Network Online
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                  Underground Intel <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                    For Serious Collectors
                  </span>
                </h1>

                <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                  Premium TCG market analysis, data-driven insights, and exclusive intelligence.
                  Morning Brew meets the underground—delivered to your inbox.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/intel" className="group inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-lg transition-all">
                    Get Free Intel
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium px-8 py-3 rounded-lg transition-all">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    Browse Archives
                  </button>
                </div>

                {/* Social Proof / Data Stats */}
                <div className="flex gap-8 pt-8 border-t border-slate-800/50">
                  <div>
                    <div className="text-2xl font-bold text-white">1.2K+</div>
                    <div className="text-sm text-slate-500">Collectors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-sm text-slate-500">Intel Drops</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">$2M+</div>
                    <div className="text-sm text-slate-500">Cards Tracked</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual */}
              <div className="flex justify-center lg:justify-end z-10">
                <WolfConstellation />
              </div>
            </div>
          </section>

          {/* Search Bar */}
          <section>
            <SearchBar onSearch={handleSearch} />
          </section>

          {/* Latest Intelligence Section with Horizontal Carousel */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Latest Intelligence</h2>
              <p className="text-white/70">
                Market insights, research, and analysis from industry experts
              </p>
            </div>
            <HorizontalCarousel>
              {feedItems.map((item) => (
                <ContentCard key={`${item.kind}-${item.slug}`} {...item} />
              ))}
            </HorizontalCarousel>
          </section>

          {/* Latest Insights Section */}
          <section className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Latest Insights</h2>
              <Link href="/blog" className="text-cyan-400 hover:underline">View all</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {blogPosts
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .slice(0, 3)
                .map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="border border-zinc-800 rounded-xl p-5 hover:border-cyan-400 transition"
                  >
                    <h3 className="text-lg font-medium">{p.title}</h3>
                    <p className="text-zinc-400 mt-1 line-clamp-3">{p.excerpt}</p>
                    <p className="text-xs text-zinc-500 mt-3">
                      {new Date(p.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </Link>
                ))}
            </div>
          </section>

          {/* Tools Carousel */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Free Collector Tools</h2>
              <p className="text-white/70">
                Professional-grade tools for TCG market analysis and portfolio management
              </p>
            </div>
            <ToolCarousel />
          </section>

          {/* Footer Spacing */}
          <div className="h-24" />
        </main>

        {/* Research Dialog */}
        <ResearchDialog
          isOpen={isResearchDialogOpen}
          onClose={() => {
            setIsResearchDialogOpen(false);
            setInitialQuery('');
          }}
          initialQuery={initialQuery}
        />

        {/* Visible fallback button for Ctrl+K (always visible) */}
        <button
          onClick={handleOpenResearch}
          className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 px-4 py-3 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded-lg text-cyan-400 font-medium transition-colors shadow-lg shadow-cyan-400/20 backdrop-blur-sm"
          aria-label="Open Research (Ctrl+K)"
          title="Open Research (Ctrl+K)"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Open Research</span>
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70 border border-white/20">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>
      </div>
    </RouteTransition>
  );
}
