'use client';

import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelGridCard } from '@/components/intel/IntelGridCard';
import { TitanHeader } from '@/components/ui/TitanHeader';
import { HoloFolderWrapper } from '@/components/intel/HoloFolderWrapper';
import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TerminalStream } from '@/components/ui/TerminalStream';
import { HeroVideoBanner } from '@/components/hero/HeroVideoBanner';
import Link from 'next/link';

export default function Home() {
  const recentIntel = INTEL_ARCHIVE.slice(0, 3);

  return (
    <main className="min-h-screen relative z-10 overflow-x-hidden">

      {/* 1. HERO VIDEO BANNER */}
      <HeroVideoBanner />

      {/* 2. HERO CONTENT */}
      <section className="min-h-[85vh] flex flex-col justify-center items-center text-center px-6 relative z-10">
        <div className="max-w-5xl mx-auto pt-20">

          {/* Top Tag */}
          <div className="inline-block mb-8 animate-in fade-in slide-in-from-top duration-1000">
            <div className="flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/30 px-4 py-1 skew-x-[-10deg] backdrop-blur-md">
              <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full skew-x-[10deg]" />
              <span className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase skew-x-[10deg]">
                System Online // Ver 2.0
              </span>
            </div>
          </div>

          {/* MAIN TITLE */}
          <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter uppercase leading-[0.9]">
            <span className="neon-circuit-text block" data-text="UNDERGROUND">UNDERGROUND</span>
            <span className="text-white block opacity-90">INTEL</span>
          </h1>

          {/* SUBTEXT (Fixed Typos) */}
          <div className="max-w-2xl mx-auto text-slate-300 text-lg mb-12 h-20 font-mono">
            <TerminalStream
              content="Premium TCG market analysis, data-driven insights, and exclusive intelligence. Morning Brew meets the underground—delivered to your inbox."
              speed={20}
            />
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col md:flex-row gap-6 justify-center opacity-0 animate-[fadeIn_1s_ease-in_forwards] delay-1000" style={{ animationDelay: '1.5s' }}>
            <Link href="/subscribe" className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-[0.2em] skew-x-[-10deg] hover:shadow-[0_0_30px_#22d3ee] transition-all">
              <span className="block skew-x-[10deg]">Get Alpha Access</span>
            </Link>
            <Link href="/intel" className="px-10 py-4 border border-white/20 hover:border-purple-500 text-white font-bold text-sm uppercase tracking-[0.2em] skew-x-[-10deg] hover:bg-purple-500/20 transition-all">
              <span className="block skew-x-[10deg]">Browse Database</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. LATEST INTEL (Folder Wrapped) */}
      <section className="py-24 px-6 relative z-20">
        <TitanHeader title="LATEST INTELLIGENCE" subtitle="MARKET INSIGHTS // VERIFIED" />
        <div className="max-w-7xl mx-auto">
          <HoloFolderWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentIntel.map((item) => (
                <IntelGridCard key={item.id} item={item} />
              ))}
            </div>
          </HoloFolderWrapper>
        </div>
      </section>

      {/* 4. CORE SYSTEMS (Scroll Wrapped) */}
      <section className="py-24 px-6 relative z-20">
        <div className="max-w-5xl mx-auto">
          <DigitalScrollWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4 uppercase">The Mission</h3>
                <div className="text-slate-400 leading-relaxed font-mono text-sm">
                  The TCG market is a multi-billion dollar industry, but most collectors are flying blind.
                  We are building the intel network that should have existed years ago.
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['DATA-DRIVEN', 'TRANSPARENT', 'ACTIONABLE'].map((feat, i) => (
                  <div key={i} className="p-4 border border-slate-800 bg-slate-900/50 flex items-center gap-4">
                    <div className="text-cyan-500 font-bold">0{i+1}</div>
                    <div className="text-white font-bold tracking-wider">{feat}</div>
                  </div>
                ))}
              </div>
            </div>
          </DigitalScrollWrapper>
        </div>
      </section>

      {/* 5. READY FOR ALPHA (Restored & Neon) */}
      <section className="py-32 text-center relative z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 relative">

          {/* NEON HEADER */}
          <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter">
            <span className="neon-circuit-text" data-text="READY FOR ALPHA?">
              READY FOR ALPHA?
            </span>
          </h2>

          <p className="text-slate-400 mb-10 font-mono text-sm tracking-wide">
            Join 1,200+ serious collectors getting exclusive market intelligence delivered weekly.
          </p>

          <Link href="/subscribe" className="inline-block px-12 py-5 bg-white text-black font-black text-lg uppercase tracking-[0.2em] skew-x-[-10deg] hover:bg-cyan-400 hover:scale-105 transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
            <span className="block skew-x-[10deg]">Initiate Sequence</span>
          </Link>
        </div>
      </section>

    </main>
  );
}
