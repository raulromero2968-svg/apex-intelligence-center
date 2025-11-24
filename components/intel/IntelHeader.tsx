'use client';

import Link from 'next/link';

export function IntelHeader({ slug, title }: { slug: string; title?: string }) {
  return (
    <div className="mb-8">
      <Link
        href="/intel"
        className="text-cyan-500 text-xs font-mono uppercase tracking-wider hover:text-cyan-400 mb-4 block"
      >
        ← Back to Intelligence Archive
      </Link>

      {/* Metadata Tags */}
      <div className="flex gap-3 mb-4">
        <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/50 px-2 py-1 rounded text-[10px] font-mono uppercase">
          Research
        </span>
        <span className="text-slate-500 text-[10px] font-mono uppercase flex items-center">
          Nov 12, 2025
        </span>
        <span className="text-slate-500 text-[10px] font-mono uppercase flex items-center">
          12 min read
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
        {title || "Intelligence Report: " + slug}
      </h1>

      <div className="text-slate-500 text-xs font-mono">
        By APEX INTELLIGENCE // VARC SYSTEM
      </div>
    </div>
  );
}
