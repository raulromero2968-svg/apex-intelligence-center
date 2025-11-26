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

        {/* CRITICAL TITLE: Hollow "UNDERGROUND" + Solid "INTEL" with holographic glow */}
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
