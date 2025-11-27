'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);

  // Color Logic
  const tier = article?.tier || "Free";
  const accentColor =
    tier === "Elite" ? "#22d3ee" :
    tier === "Pro" ? "#a855f7" :
    "#fbbf24";

  // If content is missing, show error (but we know it's there now)
  const content = article?.content || "<p>Error: Data packet corrupted.</p>";

  return (
    <div className="font-sans text-slate-300 leading-relaxed space-y-12">

      {/* 1. EXECUTIVE BRIEFING (Keep streaming ONLY here for effect) */}
      <div
        className="p-6 border-l-4 bg-slate-900/50 rounded-r-lg backdrop-blur-sm"
        style={{ borderColor: accentColor }}
      >
        <h3 className="font-bold mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2" style={{ color: accentColor }}>
          /// EXECUTIVE_BRIEFING
        </h3>
        <div className="min-h-[40px] text-sm font-mono">
           <TerminalStream content={article?.summary || "Loading..."} speed={5} />
        </div>
      </div>

      {/* 2. CHART (Top of report) */}
      {article?.chartData && (
        <div className="w-full border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
           <IntelChart
              title="MARKET DATA // 10-YEAR TREND"
              data={article.chartData}
              color={accentColor}
           />
        </div>
      )}

      {/* 3. FULL REPORT BODY (Static HTML - No Streaming) */}
      {/* This ensures the lists, bold text, and layout render perfectly immediately */}
      <div
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-white
          prose-p:text-slate-300 prose-p:leading-loose
          prose-li:text-slate-400 prose-li:marker:text-cyan-500
          prose-strong:text-white prose-strong:font-bold"
        dangerouslySetInnerHTML={{ __html: content }}
      />

    </div>
  );
}
