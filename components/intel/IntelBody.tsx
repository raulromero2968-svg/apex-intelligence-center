'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  // 1. Fetch the real content from the archive
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);
  const hasRealContent = !!article?.content;

  // IF REAL CONTENT EXISTS (Vintage Report)
  if (hasRealContent) {
    return (
      <div className="space-y-10 font-sans text-slate-300 leading-relaxed">

        {/* 1. Executive Summary Stream (Always keep the stream for the intro) */}
        <div className="p-6 border-l-2 border-yellow-500 bg-yellow-950/10 rounded-r-lg font-mono text-sm">
          <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-[0.2em]">
            /// EXECUTIVE_BRIEFING
          </h3>
          <div className="min-h-[80px]">
             <TerminalStream content={article?.summary || "Loading data..."} speed={3} />
          </div>
        </div>

        {/* 2. The Chart Engine (Real) - Only show for vintage article */}
        {slug === "vintage-wotc-investment-guide" && (
          <IntelChart title="WOTC Holo Value Appreciation (2015-2025)" />
        )}

        {/* 3. The Main Content (HTML Injection) */}
        <div
          className="prose prose-invert prose-cyan max-w-none"
          dangerouslySetInnerHTML={{ __html: article?.content || "" }}
        />

      </div>
    );
  }

  // FALLBACK (For articles without content yet)
  const briefing = `/// ENCRYPTED PACKET: ${slug.toUpperCase()}...`;

  return (
    <div className="space-y-10 font-mono text-sm md:text-base">
        <div className="p-6 border-l-2 border-cyan-500 bg-cyan-950/10 rounded-r-lg">
            <TerminalStream content={briefing} speed={3} />
        </div>
        {/* Placeholder Chart */}
        <div className="w-full h-64 bg-slate-950 border border-slate-800 flex items-center justify-center">
            <p className="text-cyan-500 font-mono text-xs animate-pulse">[ DATA_PENDING ]</p>
        </div>
    </div>
  );
}
