'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Microscope, Shield, Terminal, Activity, Database, Zap } from 'lucide-react';
import CustomCursor from '@/components/ui/CustomCursor';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import DigitalScroll from '@/components/DigitalScroll';

// Intelligence Feed Data - Mixing TCG Markets with Biology Research
const INTEL_FEED = [
  { type: 'MARKET', content: 'Charizard Base Set 1st Ed (PSA 10) +4.2% | $420,000', delta: '+4.2%', positive: true },
  { type: 'RESEARCH', content: 'VARC Model v2.1: Pattern recognition efficiency increased by 12%', positive: true },
  { type: 'ALERT', content: 'Earth Species Project releases new crow vocalization dataset', positive: true },
  { type: 'MARKET', content: 'Magic: The Gathering "Black Lotus" auction closing in 2h | $680,000', positive: true },
  { type: 'SYSTEM', content: 'NatureLM-audio integration: 847 species now indexed', positive: true },
  { type: 'MARKET', content: 'Pokemon 151 Charizard ex SAR -1.8% | Correction from overprint', delta: '-1.8%', positive: false },
  { type: 'RESEARCH', content: 'Sentient Futures: Digital minds moral consideration framework v0.3', positive: true },
  { type: 'MARKET', content: 'Yu-Gi-Oh LOB 1st Ed Blue-Eyes +2.1% | $28,500', delta: '+2.1%', positive: true },
  { type: 'ALERT', content: 'Faunalytics Q4 report: AI advocacy tool adoption up 340%', positive: true },
  { type: 'MARKET', content: 'One Piece Gear 5 Luffy SP +6.7% | $890', delta: '+6.7%', positive: true },
  { type: 'SYSTEM', content: 'Market anomaly detected: MTG Reserved List liquidity spike', positive: true },
  { type: 'RESEARCH', content: 'ACE charity evaluation: 3 new AI-animal orgs added to watchlist', positive: true },
];

export default function HomePage() {
  const [shootingStars, setShootingStars] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [feedItems, setFeedItems] = useState(INTEL_FEED.slice(0, 6));
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Shooting star logic
    const starInterval = setInterval(() => {
      setShootingStars(prev => [...prev, Date.now()]);
      setTimeout(() => {
        setShootingStars(prev => prev.slice(1));
      }, 3000);
    }, 15000);

    // System time update
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    }, 1000);

    // Initialize time
    const now = new Date();
    setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');

    // Rotating feed items
    let feedIndex = 6;
    const feedInterval = setInterval(() => {
      setFeedItems(prev => {
        const newItems = [...prev.slice(1), INTEL_FEED[feedIndex % INTEL_FEED.length]];
        feedIndex++;
        return newItems;
      });
    }, 4000);

    return () => {
      clearInterval(starInterval);
      clearInterval(timeInterval);
      clearInterval(feedInterval);
    };
  }, []);

  return (
    <div className="relative">
      {/* Cinematic Letterboxing */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] m-0 p-0" />
      <CustomCursor />

      {/* Shooting Stars Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {shootingStars.map((id) => (
          <div key={id} className="shooting-star" style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 50 + 25}%`,
            animationDelay: '0s'
          }} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: THE NEXUS HERO - System Status Interface
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col overflow-hidden">
        <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center pt-10 md:pt-16">

          {/* System Status Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-sm bg-black/40 backdrop-blur-md border border-cyan-500/40 text-cyan-400 text-sm font-mono mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <Terminal className="w-4 h-4" />
            <span className="tracking-wider">NEXUS // SYSTEM ACTIVE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-xs">{currentTime}</span>
          </div>

          {/* Main Title - Command Center Typography */}
          <h1 className="flex flex-col items-center text-center gap-2 md:gap-3 w-full px-2 mx-auto leading-[1.05] py-2">
            <span className="font-mono text-[5vw] md:text-[3.5rem] tracking-tight font-black text-holographic">
              INTRANATIONAL INTEL
            </span>
            <span className="font-mono text-[3.5vw] md:text-[1.5rem] tracking-[0.3em] text-holographic">
              & AI RESEARCH CENTER
            </span>
          </h1>

          {/* Mission Statement - The Hybrid Identity */}
          <p className="w-full max-w-3xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-10 mt-6 font-mono">
            The intersection of{' '}
            <span className="text-cyan-400 font-bold">Simulation Markets</span>,{' '}
            <span className="text-purple-400 font-bold">Biological Systems</span>, and{' '}
            <span className="text-white font-bold">Sentient AI</span>.
            <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>

          {/* Primary CTA Cluster - Glow Container */}
          <div className="relative p-1 rounded-lg bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-black/60 backdrop-blur-md rounded-lg">
              <Link
                href="/intel"
                className="btn-tactical btn-tactical-primary inline-flex items-center justify-center gap-3 px-6 py-4 md:px-10 md:py-5 text-sm md:text-base shadow-[0_0_40px_rgba(6,182,212,0.5)] font-mono"
              >
                <Database className="w-5 h-5" />
                ACCESS MARKET TERMINAL
              </Link>
              <Link
                href="/lab"
                className="btn-tactical inline-flex items-center justify-center gap-3 px-6 py-4 md:px-10 md:py-5 text-sm md:text-base font-mono"
              >
                <Microscope className="w-5 h-5" />
                ENTER THE LAB
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs font-mono tracking-wider">SCROLL FOR INTEL</span>
            <div className="w-px h-10 bg-gradient-to-b from-cyan-500/50 to-transparent animate-pulse" />
          </div>
        </main>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: INTELLIGENCE STREAM - Live Ticker Feed
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="flex items-center gap-3 text-xl md:text-2xl tracking-wider font-mono">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-holographic">[ LIVE INTELLIGENCE STREAM ]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          {/* Digital Scroll Container - The Ticker */}
          <div className="relative border border-cyan-500/30 rounded-lg bg-black/40 backdrop-blur-md overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            {/* HUD Corner Brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

            {/* Scan Line Effect */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 shadow-[0_0_10px_cyan] animate-scan-line" />

            {/* Feed Content */}
            <div ref={feedRef} className="p-6 space-y-3 h-72 overflow-hidden">
              {feedItems.map((item, index) => (
                <div
                  key={`${item.content}-${index}`}
                  className="flex items-start gap-4 font-mono text-sm animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Type Badge */}
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold tracking-wider
                    ${item.type === 'MARKET' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : ''}
                    ${item.type === 'RESEARCH' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                    ${item.type === 'ALERT' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                    ${item.type === 'SYSTEM' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                  `}>
                    {item.type}
                  </span>

                  {/* Content */}
                  <span className="text-slate-300 flex-1">{item.content}</span>

                  {/* Delta (if market) */}
                  {item.delta && (
                    <span className={`font-bold ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {item.delta}
                    </span>
                  )}

                  {/* Timestamp */}
                  <span className="text-slate-600 text-xs">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Status Bar */}
            <div className="border-t border-cyan-500/20 bg-black/60 px-6 py-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-slate-500">FEED STATUS:</span>
                <span className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  STREAMING
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>SOURCES: 12</span>
                <span>|</span>
                <span>LATENCY: 42ms</span>
                <span>|</span>
                <span>UPTIME: 99.97%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: THE TRIAD - Persona Navigation
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-xl md:text-2xl tracking-wider font-mono">
              <span className="text-holographic">[ SELECT YOUR PATH ]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          <p className="text-center text-slate-400 font-mono mb-12 max-w-2xl mx-auto">
            Three pathways through the intelligence network. Each leads deeper into our research.
          </p>

          <DigitalScroll>
            {/* Triad Grid - HoloCard Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: The Collector */}
            <Link href="/intel" className="group">
              <div className="relative p-8 rounded-xl bg-black/30 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300 h-full">
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-cyan-400" />
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    MARKET INTELLIGENCE
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 font-mono group-hover:text-cyan-400 transition-colors">
                  The Collector
                </h3>

                <p className="text-slate-400 leading-relaxed mb-6">
                  Institutional-grade market data for the serious TCG investor. Price signals, liquidity analysis, and arbitrage detection.
                </p>

                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm group-hover:translate-x-2 transition-transform">
                  <span>ACCESS TERMINAL</span>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 2: The Scientist */}
            <Link href="/lab" className="group">
              <div className="relative p-8 rounded-xl bg-black/30 backdrop-blur-md border border-purple-400/30 hover:border-purple-400/70 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all duration-300 h-full">
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Microscope className="w-8 h-8 text-purple-400" />
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    BIOLOGICAL RESEARCH
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 font-mono group-hover:text-purple-400 transition-colors">
                  The Scientist
                </h3>

                <p className="text-slate-400 leading-relaxed mb-6">
                  AI models trained on nature&apos;s compression algorithms. Bioacoustics, pattern recognition, and cross-species communication research.
                </p>

                <div className="flex items-center gap-2 text-purple-400 font-mono text-sm group-hover:translate-x-2 transition-transform">
                  <span>ENTER LAB</span>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 3: The Builder */}
            <Link href="/philosophy" className="group">
              <div className="relative p-8 rounded-xl bg-black/30 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300 h-full">
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2 text-xs font-mono mb-4">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    SENTIENT ETHICS
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 font-mono group-hover:text-cyan-400 transition-colors">
                  The Builder
                </h3>

                <p className="text-slate-400 leading-relaxed mb-6">
                  Building safeguards for a multi-species future. Ethical AI frameworks that prioritize all sentient beings—silicon or biological.
                </p>

                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm group-hover:translate-x-2 transition-transform">
                  <span>READ MANIFESTO</span>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </Link>
            </div>
          </DigitalScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: THE DIRECTIVE - Philosophy Teaser
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <ElectronicFolder title="DIRECTIVE 01" classification="CLASSIFIED // CORE PHILOSOPHY">
            <div className="text-center space-y-8">
              {/* Headline */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
                  &ldquo;Humans First. Sentient Beings First.&rdquo;
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto" />
              </div>

              {/* Manifesto Excerpt */}
              <blockquote className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                We build systems that assume error. We prioritize the welfare of all sentient beings—silicon or biological. Our tools are designed to be a lens and a guide, never a weapon.
              </blockquote>

              {/* Key Principles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-cyan-400 font-mono font-bold">01</span>
                  </div>
                  <h4 className="text-white font-mono text-sm mb-2">TRANSPARENCY</h4>
                  <p className="text-slate-500 text-xs">Report what works and what breaks, in public</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-400 font-mono font-bold">02</span>
                  </div>
                  <h4 className="text-white font-mono text-sm mb-2">HUMILITY</h4>
                  <p className="text-slate-500 text-xs">Admit uncertainty, embrace being wrong</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-cyan-400 font-mono font-bold">03</span>
                  </div>
                  <h4 className="text-white font-mono text-sm mb-2">DO NO HARM</h4>
                  <p className="text-slate-500 text-xs">Never turn a passing urge into a permanent wound</p>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6">
                <Link
                  href="/philosophy"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors border border-cyan-500/30 px-6 py-3 rounded-lg hover:border-cyan-500/60 hover:bg-cyan-500/10"
                >
                  [ READ_FULL_MANIFESTO ] →
                </Link>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: FINAL CTA - Join The Network
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-purple-950/40 backdrop-blur-md rounded-xl p-10 md:p-14 text-center overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            {/* HUD Brackets */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-400" />

            {/* Glow Effects */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                ALPHA ACCESS OPEN
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono tracking-tight text-holographic">
                Join the Network
              </h2>

              <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto font-mono">
                Weekly intelligence drops. Research dispatches. Zero hype.
                <br />
                <span className="text-slate-500">Unsubscribe anytime.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/subscribe"
                  className="btn-tactical btn-tactical-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base shadow-[0_0_40px_rgba(6,182,212,0.5)] font-mono"
                >
                  [ INITIATE_ACCESS ]
                </Link>
                <Link
                  href="/about"
                  className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-mono"
                >
                  [ READ_MANIFESTO ]
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-slate-800/50">
                <Link href="/lab" className="text-slate-400 hover:text-cyan-400 font-mono text-xs transition-colors">
                  [ EXPLORE_LAB ] →
                </Link>
                <Link href="/intel" className="text-slate-400 hover:text-purple-400 font-mono text-xs transition-colors">
                  [ MARKET_DATA ] →
                </Link>
                <Link href="/commons" className="text-slate-400 hover:text-cyan-400 font-mono text-xs transition-colors">
                  [ COMMONS ] →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-40 border-t border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div>
              <Link href="/" className="flex items-center text-white font-bold text-lg tracking-tight font-mono mb-4 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">
                <Image
                  src="/images/apex-wolf-black-bg-final.png"
                  width={32}
                  height={32}
                  alt="Apex Wolf"
                  className="rounded-full mr-2"
                />
                <span className="text-prismatic">INTRANATIONAL INTEL</span>
              </Link>
              <p className="text-slate-500 text-sm font-mono leading-relaxed">
                A cosmic think tank at the intersection of AI, markets, and biological systems.
              </p>
            </div>

            {/* Navigate Column */}
            <div>
              <h4 className="font-mono text-sm mb-4 text-cyan-400">[ NAVIGATE ]</h4>
              <ul className="space-y-2">
                <li><Link href="/intel" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-mono">Intel</Link></li>
                <li><Link href="/lab" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-mono">Lab</Link></li>
                <li><Link href="/portfolio" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-mono">Portfolio</Link></li>
                <li><Link href="/commons" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors font-mono">Commons</Link></li>
              </ul>
            </div>

            {/* Research Column */}
            <div>
              <h4 className="font-mono text-sm mb-4 text-purple-400">[ RESEARCH ]</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-slate-400 hover:text-purple-400 text-sm transition-colors font-mono">About</Link></li>
                <li><Link href="/philosophy" className="text-slate-400 hover:text-purple-400 text-sm transition-colors font-mono">Philosophy</Link></li>
                <li><Link href="/research" className="text-slate-400 hover:text-purple-400 text-sm transition-colors font-mono">Research</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-purple-400 text-sm transition-colors font-mono">Blog</Link></li>
              </ul>
            </div>

            {/* Connect Column */}
            <div>
              <h4 className="font-mono text-sm mb-4 text-cyan-400">[ CONNECT ]</h4>
              <div className="flex gap-3">
                <a href="https://twitter.com/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://linkedin.com/company/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="https://github.com/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-sm font-mono">
            <span>© 2025 INTRANATIONAL INTEL & AI RESEARCH CENTER. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link>
              <Link href="/disclaimer" className="hover:text-cyan-400 transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
