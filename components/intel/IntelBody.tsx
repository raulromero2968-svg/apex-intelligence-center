'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  // 1. Fetch Data
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);
  const hasRealContent = !!article?.content;

  // 2. FALLBACK: If no content exists, run the Simulation Stream
  if (!hasRealContent) {
    const briefing = `/// ENCRYPTED PACKET: ${slug.toUpperCase()}... \n\n ACCESS DENIED: FULL REPORT PENDING DECLASSIFICATION.`;
    return (
        <div className="p-6 border-l-2 border-red-500 bg-red-950/10 rounded-r-lg font-mono text-sm min-h-[200px]">
            <TerminalStream content={briefing} speed={5} />
        </div>
    );
  }

  // 3. RENDER REAL CONTENT (Vintage Report)
  return (
    <div className="font-sans text-slate-300 leading-relaxed">

      {/* A. EXECUTIVE SUMMARY (Always Streams for the "Cool Factor") */}
      <div className="mb-10 p-6 border-l-2 border-cyan-500 bg-cyan-950/10 rounded-r-lg font-mono text-sm shadow-[0_0_20px_rgba(34,211,238,0.1)]">
        <h3 className="text-cyan-400 font-bold mb-3 uppercase text-xs tracking-[0.2em]">
          /// EXECUTIVE_BRIEFING
        </h3>
        <div className="min-h-[60px]">
           <TerminalStream content={article?.summary || "Loading intel..."} speed={10} />
        </div>
      </div>

      {/* B. THE CHART ENGINE (Top of the Fold) */}
      <div className="mb-12">
         <IntelChart title="Market Performance // 10-Year Alpha" />
      </div>

      {/* C. THE MAIN BODY (Static HTML) */}
      {/* We use 'prose' classes to ensure the injected HTML looks good */}
      <div
        className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-headings:uppercase prose-p:text-slate-400 prose-strong:text-white prose-li:text-slate-400"
        dangerouslySetInnerHTML={{ __html: article?.content || "" }}
      />

    </div>
  );
}
