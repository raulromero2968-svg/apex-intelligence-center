'use client';

import Link from 'next/link';

const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/commons', label: 'COMMONS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Matrix Grid Cyber Background */}
      <div className="absolute inset-0 z-0">
        {/* Base dark background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Cyan grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(cyan 1px, transparent 1px),
              linear-gradient(90deg, cyan 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Scan lines effect */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, cyan 2px, cyan 4px)',
            animation: 'scan 8s linear infinite',
          }}
        />
      </div>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent z-[1]" />

      {/* Header / Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        {/* Left: Logo/Brand */}
        <Link href="/" className="text-white font-bold text-xl tracking-tight font-mono">
          APEX<span className="text-cyan-400">_</span>INTEL
        </Link>

        {/* Center: Nav Links (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-400 hover:text-white text-sm font-medium tracking-wide transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Access Terminal Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-cyan-500/50 hover:bg-white/5 rounded text-white font-mono text-sm tracking-wider transition-all"
        >
          [ ACCESS_TERMINAL ]
        </Link>
      </header>

      {/* Hero Content (Centered) */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          SYSTEM ONLINE // VER 2.0
        </div>

        {/* Main Title: "Underground Intel" (white) + "& AI Research" (gradient) */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
          <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            Underground Intel
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            & AI Research
          </span>
        </h1>

        {/* Description with block cursor */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          Premium TCG market analysis, data-driven insights, and exclusive intelligence.
          Morning Brew meets the underground—delivered to your inbox.
          <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
        </p>

        {/* CTA Buttons with holographic effect */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]"
          >
            GET ALPHA ACCESS
          </Link>
          <Link
            href="/intel"
            className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-lg hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            BROWSE DATABASE
          </Link>
        </div>
      </main>

      {/* Latest Intelligence Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-white font-mono">
            <span className="text-cyan-400">[</span> LATEST INTELLIGENCE <span className="text-cyan-400">]</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>

        {/* Intelligence Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Vintage WOTC */}
          <Link
            href="/intel/vintage-wotc-analysis"
            className="group relative border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              DIGITAL SCROLL
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Vintage WOTC Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Deep dive into Base Set shadowless variants, 1st Edition premiums, and the grading lottery affecting 1999-2003 sealed product.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Nov 25, 2025</span>
              <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
            </div>
          </Link>

          {/* Card 2: Rotation Window */}
          <Link
            href="/intel/rotation-window-strategy"
            className="group relative border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono mb-3">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              ELECTRONIC FOLDER
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Rotation Window Strategy
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Standard format rotation creates predictable buy/sell windows. Learn to exploit the 6-month cycle before competition catches on.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Nov 24, 2025</span>
              <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
            </div>
          </Link>

          {/* Card 3: Pokemon 151 */}
          <Link
            href="/intel/pokemon-151-market-report"
            className="group relative border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              DIGITAL SCROLL
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Pokemon 151 Market Report
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Nostalgia plays meet modern print runs. Which chase cards hold value and which are traps? Complete breakdown inside.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Nov 23, 2025</span>
              <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">READ MORE →</span>
            </div>
          </Link>
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/intel"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm tracking-wide transition-colors"
          >
            [ VIEW_ALL_INTEL ]
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      {/* Mobile Nav Toggle (optional - simplified for now) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full text-white font-mono text-sm"
        >
          [ ACCESS_TERMINAL ]
        </Link>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}
