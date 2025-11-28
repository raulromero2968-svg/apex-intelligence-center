export default function SectionShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 relative">
        {kicker && (
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/40 px-3 py-1 text-xs tracking-wide text-cyan-300/80">
            {kicker}
          </div>
        )}
        
        {/* Prismatic Title with Scan Effect */}
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight relative z-10">
            <span className="text-holographic drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              Underground {title}
            </span>
          </h1>
          
          {/* Animated Scan Line Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent h-[2px] animate-scan-line" />
          </div>
          
          {/* Prismatic Underline */}
          <div className="mt-2 h-[2px] bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 blur-sm animate-pulse" />
          </div>
        </div>
        
        <p className="mt-4 max-w-2xl text-white/70">
          Data-driven market analysis, real-time insights, and exclusive research for serious TCG investors.
        </p>
      </header>
      {children}
    </main>
  );
}
