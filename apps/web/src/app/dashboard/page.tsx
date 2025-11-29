'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Sparkles, Shield } from "lucide-react";
import { RiskClock } from "@/components/risk/RiskClock";
import dynamic from 'next/dynamic';

const Interactive3DWolf = dynamic(
  () => import('@/components/hero/Interactive3DWolf'),
  { ssr: false, loading: () => <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div></div> }
);
import RouteTransition from "@/layout/RouteTransition";
import SearchBar from "@/components/search/SearchBar";

import ContentCard from "@/components/ContentCard";
import { ElectronicFolder } from "@/components/ui/ElectronicFolder";
import { DigitalScroll } from "@/components/ui/DigitalScroll";
import { blogPosts, researchReports, intelNotes } from "@/content/seed";

type ContentKind = 'blog' | 'research' | 'intel';

// Get the latest 6 items across all content types for the homepage feed
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

  return allContent.slice(0, 6);
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const feedItems = getHomeFeed();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
      <div className="min-h-screen relative">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-16">
          {/* Hero Section - Terminal Style Header */}
          <section className="flex flex-col items-center justify-center min-h-[90vh] px-4 md:px-20 overflow-hidden relative">
            {/* Purple Prismatic Tint Background with Soft Fading Edges */}
            <div 
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                maskImage: `
                  radial-gradient(ellipse 100% 100% at 50% 0%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 50% 100%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 0% 50%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 100% 50%, black 60%, transparent 100%),
                  linear-gradient(black, black)
                `,
                maskComposite: 'intersect',
                WebkitMaskImage: `
                  radial-gradient(ellipse 100% 100% at 50% 0%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 50% 100%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 0% 50%, black 60%, transparent 100%),
                  radial-gradient(ellipse 100% 100% at 100% 50%, black 60%, transparent 100%),
                  linear-gradient(black, black)
                `,
                WebkitMaskComposite: 'source-in',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900/50 to-cyan-900/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-slow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-7xl items-center relative z-10">
              {/* Left Column: Terminal Header */}
              <div className="space-y-8">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  SYSTEM_ONLINE // TCG_INTELLIGENCE_NETWORK
                </div>

                {/* Terminal Header */}
                <div className="space-y-4">
                  <div className="font-sans text-sm text-cyan-400/60">
                    <span className="text-purple-400">apex@intelligence</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-cyan-400">~</span>
                    <span className="text-slate-500">$</span>
                    <span className="ml-2 text-slate-400">./initialize_terminal</span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                    <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                      TCG
                    </span>
                    <span className="block text-holographic drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                      Science
                    </span>
                  </h1>

                  <div className="flex items-center gap-2 text-lg font-sans text-slate-400">
                    <span className="text-purple-400">for</span>
                    <span className="text-white font-bold">Serious Collectors</span>
                    <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse" />
                  </div>
                </div>

                <p className="text-lg text-slate-400 max-w-xl leading-relaxed border-l-2 border-cyan-500/30 pl-4">
                  Premium TCG market analysis, data-driven insights, and exclusive intelligence.
                  <span className="block mt-2 text-cyan-400/80 font-sans text-sm">
                    Alpha signals from the underground—delivered to your inbox.
                  </span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/intel" 
                    className="group inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-sans"
                  >
                    [ GET_FREE_INTEL ]
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] font-sans"
                  >
                    <Terminal className="w-5 h-5" />
                    [ UPGRADE_TO_PRO ]
                  </Link>
                </div>

                {/* Stats - Cyberpunk Style */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-cyan-500/20">
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
                      1.2K+
                    </div>
                    <div className="text-xs text-slate-500 font-sans uppercase tracking-wider">Collectors</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                      50+
                    </div>
                    <div className="text-xs text-slate-500 font-sans uppercase tracking-wider">Intel Drops</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">
                      $2M+
                    </div>
                    <div className="text-xs text-slate-500 font-sans uppercase tracking-wider">Cards Tracked</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3D Wolf */}
              <div className="flex justify-center lg:justify-end">
                <Interactive3DWolf />
              </div>
            </div>
          </section>

          {/* Search Bar */}
          <section className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </section>

          {/* Threat Assessment Section - Strand A: The Institute */}
          <section className="relative z-10 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
              <ElectronicFolder
                title="THREAT ASSESSMENT"
                classification="STRAND_A // BULLETIN_PROTOCOL"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield
                      className="w-5 h-5"
                      strokeWidth={2.5}
                      stroke="#ef4444"
                      style={{
                        filter: 'drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px #f97316)'
                      }}
                    />
                    <p className="text-slate-400 font-sans text-sm">
                      Civilizational Risk Metrics — Inspired by the <span className="text-amber-400">Bulletin of the Atomic Scientists</span>
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <RiskClock
                      systemName="Rentism Trajectory"
                      minutesToMidnight={2}
                      description="IP consolidation accelerating. Market power concentration at critical levels."
                    />
                    <RiskClock
                      systemName="TCG Market Manipulation"
                      minutesToMidnight={4}
                      description="Whale activity detected. Artificial scarcity protocols active in premium segments."
                    />
                    <RiskClock
                      systemName="Platform Dependency"
                      minutesToMidnight={6}
                      description="Marketplace centralization increasing. Alternative liquidity routes narrowing."
                    />
                  </div>
                </div>
              </ElectronicFolder>
            </div>
          </section>

          {/* Latest Intelligence Section with Electronic Folder */}
          <section className="relative z-10 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
              <ElectronicFolder 
                title="LATEST INTELLIGENCE" 
                classification="PUBLIC ACCESS // MARKET_INTEL"
              >
                <DigitalScroll height="h-[600px]" className="not-prose">
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles 
                        className="w-5 h-5" 
                        strokeWidth={2.5} 
                        fill="none"
                        stroke="#a855f7"
                        style={{
                          filter: 'drop-shadow(0 0 6px #a855f7) drop-shadow(0 0 12px #06b6d4)'
                        }}
                      />
                      <p className="text-slate-400 font-sans text-sm">
                        Market insights, research, and analysis from industry experts
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {feedItems.map((item) => (
                        <ContentCard key={`${item.kind}-${item.slug}`} {...item} />
                      ))}
                    </div>
                  </div>
                </DigitalScroll>
              </ElectronicFolder>
            </div>
          </section>

          {/* Latest Insights Section with Electronic Folder */}
          <section className="relative z-10 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
              <ElectronicFolder 
                title="LATEST INSIGHTS" 
                classification="BLOG // ANALYSIS"
              >
                <div className="grid gap-6 md:grid-cols-3 not-prose px-6 py-6">
                  {blogPosts
                    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                    .slice(0, 3)
                    .map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm p-6 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
                      >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="text-xs text-cyan-400/60 font-sans mb-3 uppercase tracking-wider">
                          {p.date}
                        </div>
                        <div className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-3 leading-tight">
                          {p.title}
                        </div>
                        <div className="text-sm text-slate-400 leading-relaxed">
                          {p.excerpt}
                        </div>

                        {/* Read more indicator */}
                        <div className="mt-4 text-sm text-purple-400 group-hover:text-purple-300 transition-colors font-sans">
                          READ_MORE <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                        </div>
                      </Link>
                    ))}
                </div>

                {/* View All Link */}
                <div className="mt-8 text-center">
                  <Link 
                    href="/blog" 
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-sans text-sm transition-colors group"
                  >
                    <span>[ VIEW_ALL_INSIGHTS ]</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </ElectronicFolder>
            </div>
          </section>
        </main>
      </div>
    </RouteTransition>
  );
}
