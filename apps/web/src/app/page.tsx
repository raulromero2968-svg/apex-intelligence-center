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
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
      >
        <source src="/images/titan-loop.mp4" type="video/mp4" />
      </video>

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

        {/* CRITICAL TITLE: Hollow "UNDERGROUND" + Solid "INTEL" */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
          <span
            className="block"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px white',
            }}
          >
            UNDERGROUND
          </span>
          <span className="block text-white">
            INTEL
          </span>
        </h1>

        {/* Description with block cursor */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          Premium TCG market analysis, data-driven insights, and exclusive intelligence.
          Morning Brew meets the underground—delivered to your inbox.
          <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg"
          >
            GET ALPHA ACCESS
          </Link>
          <Link
            href="/intel"
            className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-lg"
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
    </div>
  );
}
