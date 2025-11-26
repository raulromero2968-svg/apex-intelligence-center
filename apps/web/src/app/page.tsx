'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/commons', label: 'COMMONS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
];

/**
 * Typewriter animation configuration
 * Staggered delays create a "swarm" sequential reveal effect
 */
const TYPEWRITER_CONFIG = {
  baseDuration: 2000,
  staggerDelay: 300,
  steps: 40,
};

export default function HomePage() {
  const typewriterRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Respect reduced motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      typewriterRefs.current.forEach((el) => {
        if (el) {
          el.style.width = '100%';
          el.style.opacity = '1';
        }
      });
      return;
    }

    // Stagger typewriter animations for swarm-like sequential reveal
    typewriterRefs.current.forEach((el, index) => {
      if (!el) return;

      // Initial hidden state
      el.style.width = '0%';
      el.style.opacity = '1';
      el.style.overflow = 'hidden';
      el.style.whiteSpace = 'nowrap';
      el.style.display = 'inline-block';

      // Staggered delay for swarm effect
      const delay = index * TYPEWRITER_CONFIG.staggerDelay;
      const duration = TYPEWRITER_CONFIG.baseDuration + (index * 100);

      setTimeout(() => {
        el.animate(
          [{ width: '0%' }, { width: '100%' }],
          {
            duration,
            easing: `steps(${TYPEWRITER_CONFIG.steps}, end)`,
            fill: 'forwards',
          }
        );
      }, delay);
    });
  }, []);

  // Helper to set ref at index
  const setRef = (index: number) => (el: HTMLElement | null) => {
    typewriterRefs.current[index] = el;
  };

  return (
    <div className="relative">
      {/* Cinematic Letterboxing - No Gap */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] m-0 p-0" />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO (Base Layer - z-0)
          Uses global fixed nav from layout.tsx - no duplicate header needed
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-0 min-h-screen flex flex-col overflow-hidden">
        {/* Hero Content (Centered) - Transparent to show starfield/matrix */}
        <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center pt-16">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            SYSTEM ONLINE // VER 2.0
          </div>

          {/* Main Title - Static (no typewriter) for immediate impact */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8 relative">
            {/* Line 1: Base layer - Hollow white outline for border effect */}
            <span className="block text-hollow-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Underground Intel
            </span>
            {/* Line 1: Overlap layer - Gradient fill with glow for depth */}
            <span className="block absolute top-0 left-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] mix-blend-screen translate-x-px translate-y-px">
              Underground Intel
            </span>
            {/* Line 2: Base layer - Hollow white outline */}
            <span className="block text-hollow-white drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              & AI Research
            </span>
            {/* Line 2: Overlap layer - Purple-shifted gradient for depth */}
            <span className="block absolute left-0 top-1/2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] mix-blend-screen translate-x-px translate-y-px">
              & AI Research
            </span>
          </h1>

          {/* Magnetizing Subtitle - Succinct, comprehensive; Typewriter applied for engagement */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10 text-center">
            <span ref={setRef(0)} className="typewriter-element">
              Unlock premium TCG intel: Real-time market analysis, AI-driven insights, and exclusive underground research—delivered straight to serious collectors.
            </span>
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle typewriter-cursor" />
          </p>

          {/* CTA Buttons - Tactical Military Style */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/subscribe"
              className="btn-tactical btn-tactical-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              GET ALPHA ACCESS
            </Link>
            <Link
              href="/intel"
              className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              BROWSE DATABASE
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs font-mono tracking-wider">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent animate-pulse" />
          </div>
        </main>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: MISSION (Card Layer 1 - z-10) - Ethereal Wave Transition
          Transparent to show starfield/matrix background on scroll
          ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="sticky top-0 z-10 min-h-screen bg-slate-950/60 backdrop-blur-sm border-t border-cyan-500/20 flex items-center shadow-[0_-30px_80px_-10px_rgba(6,182,212,0.15)]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
        }}
      >
        <div className="w-full px-6 md:px-12 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Section Header - Prismatic See-Through Typography */}
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="header-prismatic-purple text-2xl md:text-3xl tracking-wider font-mono cyber-street">
                [ MISSION ]
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            {/* Electronic Wrapping Card - Glassmorphic with cyan border lines for sci-fi confidential sleek */}
            <div className="relative p-8 rounded-xl bg-black/20 backdrop-blur-md border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden">
              {/* Cyan Scan Line - Horizontal scan on section view */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_20px_cyan] animate-section-scan"></div>

              {/* Electronic Wrap Lines - Animated border effect */}
              <div className="absolute inset-0 electronic-wrap pointer-events-none"></div>

              {/* Mission Content - Succinct copy for magnetism */}
              <div className="relative z-10 space-y-6 text-center">
                <p ref={setRef(1)} className="text-xl md:text-2xl text-slate-300 leading-relaxed typewriter-element">
                  The TCG market is a <span className="text-cyan-400 font-semibold">multi-billion dollar powerhouse</span>, yet most collectors operate blind.
                </p>
                <p ref={setRef(2)} className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto typewriter-element">
                  Apex Intelligence builds the elite intel network that&apos;s been missing—data-driven, transparent, actionable insights for generational wealth.
                </p>

                {/* Key Points - Succinct bullets */}
                <ul className="space-y-4 mt-8 text-left max-w-2xl mx-auto">
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 font-bold font-mono">01</span>
                    <div>
                      <h3 className="font-bold text-white">Data-Driven</h3>
                      <p ref={setRef(3)} className="text-slate-400 typewriter-element">Real-time analytics separating signal from noise.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 font-bold font-mono">02</span>
                    <div>
                      <h3 className="font-bold text-white">Transparent</h3>
                      <p ref={setRef(4)} className="text-slate-400 typewriter-element">No hype—just verified, institutional-grade precision.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 font-bold font-mono">03</span>
                    <div>
                      <h3 className="font-bold text-white">Actionable</h3>
                      <p ref={setRef(5)} className="text-slate-400 typewriter-element">Insights that drive smart decisions for serious collectors.</p>
                    </div>
                  </li>
                </ul>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-800/50">
                  <div className="text-center">
                    <div className="font-titan text-3xl md:text-4xl mb-2">$43B+</div>
                    <div className="text-sm text-slate-500 font-mono">GLOBAL TCG MARKET</div>
                  </div>
                  <div className="text-center">
                    <div className="font-titan-purple text-3xl md:text-4xl mb-2">15%</div>
                    <div className="text-sm text-slate-500 font-mono">YOY GROWTH RATE</div>
                  </div>
                  <div className="text-center">
                    <div className="font-titan text-3xl md:text-4xl mb-2">2.4M+</div>
                    <div className="text-sm text-slate-500 font-mono">ACTIVE COLLECTORS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-titan-purple text-3xl md:text-4xl mb-2">24/7</div>
                    <div className="text-sm text-slate-500 font-mono">MARKET MONITORING</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: LATEST INTELLIGENCE (Card Layer 2 - z-20) - Ethereal Wave Transition
          Transparent to show starfield/matrix background on scroll
          ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="sticky top-0 z-20 min-h-screen bg-slate-950/60 backdrop-blur-sm border-t border-cyan-500/20 flex items-center shadow-[0_-30px_80px_-10px_rgba(6,182,212,0.15)]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
        }}
      >
        <div className="w-full px-6 md:px-12 py-16">
          {/* Section Header - Prismatic See-Through Typography */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="header-prismatic text-2xl md:text-3xl tracking-wider font-mono cyber-street">
              [ LATEST INTELLIGENCE ]
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          {/* Intelligence Cards Grid - Wrapped in Cyber Folder */}
          <div className="cyber-folder rounded-lg p-8 pt-10 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Vintage WOTC - Transparent Glassmorphism */}
              <Link
                href="/intel/vintage-wotc-analysis"
                className="group relative bg-black/30 backdrop-blur-md border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/60 hover:bg-black/40 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Holo Thumbnail */}
                <div className="mb-4 flex justify-center">
                  <Image
                    src="/images/apex-wolf-black-bg-final.png"
                    alt="Vintage WOTC Analysis"
                    width={80}
                    height={80}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  DIGITAL SCROLL
                </div>
                <h3 className="header-prismatic text-xl mb-2 group-hover:brightness-125 transition-all cyber-text">
                  Vintage WOTC Analysis
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 cyber-text">
                  Deep dive into Base Set shadowless variants, 1st Edition premiums, and the grading lottery affecting 1999-2003 sealed product.
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Nov 25, 2025</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
                </div>
              </Link>

              {/* Card 2: Rotation Window - Transparent Glassmorphism */}
              <Link
                href="/intel/rotation-window-strategy"
                className="group relative bg-black/30 backdrop-blur-md border border-purple-400/30 rounded-lg p-6 hover:border-purple-400/60 hover:bg-black/40 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Holo Thumbnail */}
                <div className="mb-4 flex justify-center">
                  <Image
                    src="/images/apex-wolf-black-bg-final.png"
                    alt="Rotation Window Strategy"
                    width={80}
                    height={80}
                    
                    className="rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 text-purple-400 text-xs font-mono mb-3">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  ELECTRONIC FOLDER
                </div>
                <h3 className="header-prismatic-purple text-xl mb-2 group-hover:brightness-125 transition-all cyber-text">
                  Rotation Window Strategy
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 cyber-text">
                  Standard format rotation creates predictable buy/sell windows. Learn to exploit the 6-month cycle before competition catches on.
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Nov 24, 2025</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
                </div>
              </Link>

              {/* Card 3: Pokemon 151 - Transparent Glassmorphism */}
              <Link
                href="/intel/pokemon-151-market-report"
                className="group relative bg-black/30 backdrop-blur-md border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/60 hover:bg-black/40 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Holo Thumbnail */}
                <div className="mb-4 flex justify-center">
                  <Image
                    src="/images/apex-wolf-black-bg-final.png"
                    alt="Pokemon 151 Market Report"
                    width={80}
                    height={80}
                    
                    className="rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  DIGITAL SCROLL
                </div>
                <h3 className="header-prismatic text-xl mb-2 group-hover:brightness-125 transition-all cyber-text">
                  Pokemon 151 Market Report
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 cyber-text">
                  Nostalgia plays meet modern print runs. Which chase cards hold value and which are traps? Complete breakdown inside.
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Nov 23, 2025</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
                </div>
              </Link>
            </div>
          </div>

          {/* View All Link - Tactical Style */}
          <div className="text-center mt-10">
            <Link
              href="/intel"
              className="btn-tactical inline-flex items-center gap-2 font-mono text-sm"
            >
              [ VIEW_ALL_INTEL ] →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: CTA (Card Layer 3 - z-30) - Ethereal Wave Transition
          Transparent to show starfield/matrix background on scroll
          ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="sticky top-0 z-30 min-h-screen bg-slate-950/60 backdrop-blur-sm border-t border-cyan-500/20 flex items-center shadow-[0_-30px_80px_-10px_rgba(6,182,212,0.15)] pb-20"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
        }}
      >
        <div className="w-full px-6 md:px-12 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-purple-950/40 backdrop-blur-sm rounded-2xl p-10 md:p-14 text-center overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 rounded-2xl" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  ALPHA ACCESS OPEN
                </div>

                <h2 className="header-prismatic text-3xl md:text-4xl tracking-wider mb-4 cyber-street">
                  Ready for the Alpha?
                </h2>

                <p className="cyber-text text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                  Join the underground network of collectors who move before the market does.
                  Weekly intel drops. Zero spam. Unsubscribe anytime.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/subscribe"
                    className="btn-tactical btn-tactical-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                  >
                    GET ALPHA ACCESS
                  </Link>
                  <Link
                    href="/about"
                    className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
                  >
                    LEARN MORE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER (Final Layer - z-40)
          Transparent to show starfield/matrix background
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
                <span className="text-prismatic">APEX INTELLIGENCE</span>
              </Link>
              <p className="text-slate-500 text-sm">
                Underground intelligence for serious TCG collectors and investors.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h4 className="font-titan text-sm mb-4">NAVIGATE</h4>
              <ul className="space-y-2">
                <li><Link href="/intel" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Intel</Link></li>
                <li><Link href="/portfolio" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Portfolio</Link></li>
                <li><Link href="/commons" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Commons</Link></li>
                <li><Link href="/about" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">About</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-titan text-sm mb-4">LEGAL</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Disclaimer</Link></li>
              </ul>
            </div>

            {/* Connect Column */}
            <div>
              <h4 className="font-titan text-sm mb-4">CONNECT</h4>
              <div className="flex gap-3">
                <a href="https://twitter.com/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com/company/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://github.com/apexintel" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800 text-center text-slate-600 text-sm font-mono">
            © 2025 APEX INTELLIGENCE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

      {/* Mobile Nav Toggle - Tactical Style */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link
          href="/dashboard"
          className="btn-tactical inline-flex items-center gap-2 px-6 py-3 font-mono text-sm"
        >
          [ ACCESS_TERMINAL ]
        </Link>
      </div>

    </div>
  );
}
