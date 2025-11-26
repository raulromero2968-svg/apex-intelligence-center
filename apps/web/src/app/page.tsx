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
    <div className="relative min-h-screen overflow-hidden">

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

      {/* Latest Intelligence Section - Digital Scroll Wrapper */}
      <section className="relative z-10 px-6 md:px-12 py-16 digital-scroll mx-4 md:mx-8 my-8">
        {/* Section Header - Titan Typography */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <h2 className="text-2xl md:text-3xl tracking-wider font-mono font-titan">
            [ LATEST INTELLIGENCE ]
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

      {/* Mission Section - Digital Scroll Wrapper */}
      <section className="relative z-10 px-6 md:px-12 py-20 digital-scroll mx-4 md:mx-8 my-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header - Titan Typography Purple */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-2xl md:text-3xl tracking-wider font-mono font-titan-purple">
              [ MISSION ]
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          {/* Mission Content */}
          <div className="space-y-6 text-center">
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed">
              The TCG market is a <span className="text-cyan-400 font-semibold">multi-billion dollar industry</span> hiding in plain sight.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto">
              While Wall Street sleeps on collectibles, serious collectors are building generational wealth.
              We provide the intelligence infrastructure they need—real-time market data, predictive analytics,
              and exclusive research that separates signal from noise.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto">
              No hype. No speculation. Just data-driven insights delivered with institutional-grade precision.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-800">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">$43B+</div>
                <div className="text-sm text-slate-500 font-mono">GLOBAL TCG MARKET</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">15%</div>
                <div className="text-sm text-slate-500 font-mono">YOY GROWTH RATE</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">2.4M+</div>
                <div className="text-sm text-slate-500 font-mono">ACTIVE COLLECTORS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-sm text-slate-500 font-mono">MARKET MONITORING</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready for Alpha CTA Section - Digital Scroll Wrapper */}
      <section className="relative z-10 px-6 md:px-12 py-20 digital-scroll mx-4 md:mx-8 my-8">
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

              <h2 className="text-3xl md:text-4xl font-mono font-titan mb-4">
                Ready for the Alpha?
              </h2>

              <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                Join the underground network of collectors who move before the market does.
                Weekly intel drops. Zero spam. Unsubscribe anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]"
                >
                  GET ALPHA ACCESS
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-lg hover:border-cyan-500/50"
                >
                  LEARN MORE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Standalone Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div>
              <Link href="/" className="text-white font-bold text-lg tracking-tight font-mono mb-4 block">
                APEX<span className="text-cyan-400">_</span>INTEL
              </Link>
              <p className="text-slate-500 text-sm">
                Underground intelligence for serious TCG collectors and investors.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h4 className="text-cyan-400 font-semibold text-sm mb-4 font-mono">NAVIGATE</h4>
              <ul className="space-y-2">
                <li><Link href="/intel" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Intel</Link></li>
                <li><Link href="/portfolio" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Portfolio</Link></li>
                <li><Link href="/commons" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Commons</Link></li>
                <li><Link href="/about" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">About</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-cyan-400 font-semibold text-sm mb-4 font-mono">LEGAL</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Disclaimer</Link></li>
              </ul>
            </div>

            {/* Connect Column */}
            <div>
              <h4 className="text-cyan-400 font-semibold text-sm mb-4 font-mono">CONNECT</h4>
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

      {/* Mobile Nav Toggle (optional - simplified for now) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full text-white font-mono text-sm"
        >
          [ ACCESS_TERMINAL ]
        </Link>
      </div>

    </div>
  );
}
