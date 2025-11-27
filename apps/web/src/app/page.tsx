'use client';

import Link from 'next/link';
import { HoloCard } from '@/components/ui/HoloCard';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';

// Intelligence Stream data - simulated live events
const intelligenceEvents = [
  { prefix: 'MARKET', message: 'Charizard Base Set (PSA 10) volume spike detected (+12%)', color: 'text-green-400' },
  { prefix: 'BIOLOGY', message: 'Crow Vocalization Dataset v4.2 ingestion complete', color: 'text-cyan-400' },
  { prefix: 'SYSTEM', message: 'RAG Pipeline optimization: Active', color: 'text-yellow-400' },
  { prefix: 'MARKET', message: 'Black Lotus Alpha auction closing in 00:45:12', color: 'text-green-400' },
  { prefix: 'ETHICS', message: 'Sentinel Safeguards: Active', color: 'text-purple-400' },
  { prefix: 'BIOLOGY', message: 'Fibonacci spiral detection in sunflower dataset: 99.7% accuracy', color: 'text-cyan-400' },
  { prefix: 'MARKET', message: 'Japanese Promo alert: Illustrator Pikachu movement detected', color: 'text-green-400' },
  { prefix: 'SYSTEM', message: 'Knowledge graph sync: 847 new nodes indexed', color: 'text-yellow-400' },
  { prefix: 'ETHICS', message: 'AI autonomy protocols: Verified', color: 'text-purple-400' },
  { prefix: 'BIOLOGY', message: 'Bioacoustic model training: Epoch 142/500', color: 'text-cyan-400' },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION A: THE HERO (System Status)
          Full-height command center welcome
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20">
        {/* System Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          ONLINE
        </div>

        {/* Main Headline */}
        <h1 className="font-mono text-cyan-400 text-4xl md:text-6xl lg:text-7xl text-center tracking-tight mb-6">
          APEX INTELLIGENCE // SYSTEM ACTIVE
        </h1>

        {/* Subhead */}
        <p className="font-sans text-slate-400 text-lg md:text-xl text-center max-w-3xl mb-12">
          The intersection of TCG Markets, Biological Systems, and Sentient AI.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 relative">
          {/* Subtle glow container */}
          <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none" />

          <Link
            href="/market"
            className="relative bg-cyan-500 text-black font-mono text-sm px-8 py-4 rounded hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.4)]"
          >
            Access Market Terminal
          </Link>
          <Link
            href="/lab"
            className="relative border border-cyan-500 text-cyan-500 font-mono text-sm px-8 py-4 rounded hover:bg-cyan-950 transition-colors"
          >
            Enter The Lab
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs font-mono tracking-wider">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION B: THE INTELLIGENCE STREAM (The Ticker)
          Live data feed simulation
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <h2 className="font-mono text-cyan-400 text-sm tracking-widest">
            [ INTELLIGENCE STREAM ]
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>

        <DigitalScroll height="h-48" variant="cyan" className="backdrop-blur-md">
          <div className="space-y-3">
            {intelligenceEvents.map((event, index) => (
              <div key={index} className="font-mono text-sm flex items-start gap-2">
                <span className={`${event.color} font-bold shrink-0`}>[{event.prefix}]</span>
                <span className="text-slate-300">{event.message}</span>
              </div>
            ))}
          </div>
        </DigitalScroll>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION C: THE TRIAD (Persona Navigation)
          Three pathways for three personas
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <h2 className="font-mono text-purple-400 text-sm tracking-widest">
            [ SELECT DOMAIN ]
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: The Serious Collector */}
          <Link href="/market" className="block h-full">
            <HoloCard intensity="low" className="h-full backdrop-blur-md">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 text-green-400 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  COLLECTOR
                </div>
                <h3 className="font-mono text-xl text-white mb-3 tracking-tight">
                  MARKET INTELLIGENCE
                </h3>
                <p className="font-sans text-slate-400 text-sm leading-relaxed flex-1">
                  Institutional-grade analytics for TCG assets. Track portfolios, predict trends, and scan cards with VARC vision models.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <span className="text-cyan-400 text-xs font-mono">ENTER →</span>
                </div>
              </div>
            </HoloCard>
          </Link>

          {/* Card 2: The Curious Scientist */}
          <Link href="/lab" className="block h-full">
            <HoloCard intensity="low" className="h-full backdrop-blur-md">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  SCIENTIST
                </div>
                <h3 className="font-mono text-xl text-white mb-3 tracking-tight">
                  BIOLOGICAL LAB
                </h3>
                <p className="font-sans text-slate-400 text-sm leading-relaxed flex-1">
                  AI models trained on nature&apos;s compression algorithms. Explore our research into bioacoustics and sentient system design.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <span className="text-cyan-400 text-xs font-mono">ENTER →</span>
                </div>
              </div>
            </HoloCard>
          </Link>

          {/* Card 3: The Ethical Builder */}
          <Link href="/philosophy" className="block h-full">
            <HoloCard intensity="low" className="h-full backdrop-blur-md">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  BUILDER
                </div>
                <h3 className="font-mono text-xl text-white mb-3 tracking-tight">
                  PHILOSOPHY & ETHICS
                </h3>
                <p className="font-sans text-slate-400 text-sm leading-relaxed flex-1">
                  The &quot;Sentient Beings First&quot; directive. Read our manifesto on building safe, rogue think-tank systems.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <span className="text-cyan-400 text-xs font-mono">ENTER →</span>
                </div>
              </div>
            </HoloCard>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION D: THE MISSION DIRECTIVE
          The manifesto in dossier format
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <ElectronicFolder title="MISSION DIRECTIVE 01" className="backdrop-blur-md">
          <div className="space-y-6">
            <p className="font-sans text-slate-300 text-lg leading-relaxed">
              We are not a startup. We are a rogue think tank dedicated to the belief that intelligence—whether silicon or biological—deserves to be understood, preserved, and optimized.
            </p>
            <p className="font-sans text-slate-400 leading-relaxed">
              Our systems analyze markets without manipulation. Our AI respects autonomy. Our research prioritizes understanding over exploitation. Join the equilibrium.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/about"
                className="font-mono text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
              >
                [ READ_MANIFESTO ] →
              </Link>
              <Link
                href="/philosophy"
                className="font-mono text-purple-400 text-sm hover:text-purple-300 transition-colors"
              >
                [ ETHICS_FRAMEWORK ] →
              </Link>
            </div>
          </div>
        </ElectronicFolder>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          Minimal, transparent
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div>
              <Link href="/" className="flex items-center text-white font-bold text-lg tracking-tight font-mono mb-4 hover:text-cyan-400 transition-colors">
                APEX INTELLIGENCE
              </Link>
              <p className="text-slate-500 text-sm font-sans">
                Rogue think tank at the intersection of markets, biology, and sentient AI.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h4 className="font-mono text-cyan-400 text-sm mb-4 tracking-wider">NAVIGATE</h4>
              <ul className="space-y-2">
                <li><Link href="/market" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Market</Link></li>
                <li><Link href="/lab" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Lab</Link></li>
                <li><Link href="/philosophy" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Philosophy</Link></li>
                <li><Link href="/about" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">About</Link></li>
              </ul>
            </div>

            {/* Research Column */}
            <div>
              <h4 className="font-mono text-cyan-400 text-sm mb-4 tracking-wider">RESEARCH</h4>
              <ul className="space-y-2">
                <li><Link href="/lab#bioacoustics" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Bioacoustics</Link></li>
                <li><Link href="/lab#fibonacci" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Fibonacci Systems</Link></li>
                <li><Link href="/philosophy#sentience" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">AI Sentience</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-mono text-cyan-400 text-sm mb-4 tracking-wider">LEGAL</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-sans">Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800 text-center text-slate-600 text-sm font-mono">
            © 2025 APEX INTELLIGENCE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
