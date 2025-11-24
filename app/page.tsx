'use client';

import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelGridCard } from '@/components/intel/IntelGridCard';
import { TitanHeader } from '@/components/ui/TitanHeader';
import { HoloFolderWrapper } from '@/components/intel/HoloFolderWrapper';
import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TerminalStream } from '@/components/ui/TerminalStream';
import Link from 'next/link';

export default function Home() {
  // Get latest 3 articles
  const recentIntel = INTEL_ARCHIVE.slice(0, 3);

  return (
    <main className="min-h-screen relative z-10 overflow-x-hidden">

      {/* 1. HERO SECTION (Aggressive & Tech) */}
      <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-6 relative">
        <div className="max-w-5xl mx-auto">
          {/* Top Tag */}
          <div className="inline-block mb-6">
            <div className="flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/30 px-4 py-1 rounded-none skew-x-[-10deg] backdrop-blur-md">
              <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full skew-x-[10deg]" />
              <span className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase skew-x-[10deg]">
                TCG Intelligence Center // Live
              </span>
            </div>
          </div>

          {/* Main Title (Glitch & Massive) */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-[0.9]">
            Underground <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Intel</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Surface</span> Access
          </h1>

          {/* Subtext (Streaming) */}
          <div className="max-w-2xl mx-auto text-slate-400 text-lg mb-10 h-16">
            <TerminalStream
              content="Premium TCG market analysis, data-driven insights, and exclusive intelligence. Morning Brew meets the underground—delivered to your inbox."
              speed={15}
            />
          </div>

          {/* Buttons (NASCAR Style) */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/subscribe" className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-[0.2em] skew-x-[-10deg] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
              <span className="block skew-x-[10deg] group-hover:animate-pulse">Get Alpha Access →</span>
            </Link>
            <Link href="/intel" className="group px-8 py-4 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-400 font-bold text-sm uppercase tracking-[0.2em] skew-x-[-10deg] transition-all hover:bg-purple-950/30">
              <span className="block skew-x-[10deg]">Browse Archive</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. LATEST INTEL (Wrapped in FOLDER) */}
      <section className="py-24 px-6">
        <TitanHeader
          title="LATEST INTELLIGENCE"
          subtitle="MARKET INSIGHTS // VERIFIED BY DATA"
        />

        <div className="max-w-7xl mx-auto">
          {/* THE FOLDER WRAPPER */}
          <HoloFolderWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentIntel.map((item) => (
                <IntelGridCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-8 text-right">
               <Link href="/intel" className="text-xs font-mono text-cyan-500 hover:text-white tracking-widest uppercase border-b border-cyan-500/50 pb-1 hover:border-white transition-colors">
                 Access Full Database &gt;&gt;
               </Link>
            </div>
          </HoloFolderWrapper>
        </div>
      </section>

      {/* 3. CORE SYSTEMS (Wrapped in SCROLL) */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <TitanHeader
            title="CORE SYSTEMS"
            subtitle="OPERATIONAL CAPABILITIES"
          />

          {/* THE SCROLL WRAPPER */}
          <DigitalScrollWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Left: Description */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4 uppercase tracking-wider">
                  The Mission
                </h3>
                <div className="text-slate-400 leading-relaxed font-mono text-sm">
                  <TerminalStream
                    content="The TCG market is a multi-billion dollar industry, but most collectors are flying blind. We are building the intel network that should have existed years ago: a place where serious collectors can get data-driven insights without the noise."
                    speed={5}
                  />
                </div>
              </div>

              {/* Right: Grid Features */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "DATA-DRIVEN", desc: "Every insight backed by real market data." },
                  { label: "TRANSPARENT", desc: "No hidden agendas, just honest intelligence." },
                  { label: "ACTIONABLE", desc: "Intelligence you can actually use to execute." }
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 transition-all group">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-800 group-hover:bg-cyan-900/50 text-cyan-400 font-bold">
                      0{i+1}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm uppercase tracking-wider group-hover:text-cyan-400">{feat.label}</div>
                      <div className="text-slate-500 text-xs">{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </DigitalScrollWrapper>
        </div>
      </section>

      {/* 4. CTA SECTION (Aggressive) */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">
            Ready for <span className="text-purple-500">Alpha</span>?
          </h2>
          <p className="text-slate-400 mb-8">
            Join 1,200+ serious collectors getting exclusive market intelligence delivered weekly.
          </p>
          <Link href="/subscribe" className="inline-block px-12 py-5 bg-white text-black font-black text-lg uppercase tracking-[0.2em] skew-x-[-10deg] hover:bg-cyan-400 hover:scale-105 transition-all">
            <span className="block skew-x-[10deg]">Initiate Sequence</span>
          </Link>
        </div>
      </section>

    </main>
  );
}
