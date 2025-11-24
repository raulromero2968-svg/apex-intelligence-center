'use client';

export function TitanHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative w-full max-w-4xl mx-auto mb-16 pt-8 text-center group">

      {/* TOP DECORATION */}
      <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500" />
        <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">
          SECURE_CONNECTION
        </span>
        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500" />
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
      </div>

      {/* NEW HOLLOW GLITCH HEADER */}
      <h1 className="text-5xl md:text-7xl mb-6 tracking-tighter relative inline-block">
        <span
          className="titan-hollow-glitch"
          data-text={title}
        >
          {title}
        </span>
      </h1>

      {/* SUBTITLE / DATA STREAM */}
      {subtitle && (
        <div className="flex justify-center">
          <p className="text-slate-400 font-mono text-xs tracking-wide border border-slate-800 bg-slate-900/50 px-4 py-1 rounded-full backdrop-blur-md">
            <span className="text-cyan-500 mr-2">::</span>
            {subtitle}
          </p>
        </div>
      )}

      {/* BOTTOM SCANLINE */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent mt-8" />
    </div>
  );
}
