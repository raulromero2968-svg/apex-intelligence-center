'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  // 1. Fetch Data
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);
  const hasRealContent = !!article?.content;

  // Determine color based on tier
  const tier = article?.tier || "Free";
  const chartColor =
    tier === "Elite" ? "#22d3ee" : // Cyan
    tier === "Pro" ? "#a855f7" :   // Purple
    "#fbbf24";                     // Amber/Gold

  const executiveSummaryColor = chartColor;
  const executiveSummaryBg =
    tier === "Elite" ? "bg-cyan-950/10" :
    tier === "Pro" ? "bg-purple-950/10" :
    "bg-amber-950/10";

  // 2. FALLBACK: If no content exists, run the Simulation Stream
  if (!hasRealContent) {
    const briefing = `/// ENCRYPTED PACKET: ${slug.toUpperCase()}... \n\n ACCESS DENIED: FULL REPORT PENDING DECLASSIFICATION.`;
    return (
        <div className="p-6 border-l-2 border-red-500 bg-red-950/10 rounded-r-lg font-mono text-sm min-h-[200px]">
            <TerminalStream content={briefing} speed={5} />
        </div>
    );
  }

  // 3. RENDER REAL CONTENT
  return (
    <div className="font-sans text-slate-300 leading-relaxed">

      {/* A. EXECUTIVE SUMMARY (Always Streams for the "Cool Factor") */}
      <div className={`mb-10 p-6 border-l-2 ${executiveSummaryBg} rounded-r-lg font-mono text-sm`}
           style={{ borderColor: chartColor }}>
        <h3 className="font-bold mb-3 uppercase text-xs tracking-[0.2em]"
            style={{ color: chartColor }}>
          /// EXECUTIVE_BRIEFING
        </h3>
        <div className="min-h-[60px]">
           <TerminalStream content={article?.summary || "Loading intel..."} speed={10} />
        </div>
      </div>

      {/* B. THE CHART ENGINE (Top of the Fold) */}
      <div className="mb-12">
         <IntelChart
            title="Market Performance // Trend Analysis"
            data={article.chartData}
            color={chartColor}
         />
      </div>

      {/* C. THE MAIN BODY (Static HTML) */}
      {/* We use 'prose' classes to ensure the injected HTML looks good */}
      <div
        className="prose prose-invert prose-p:text-slate-300 prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight prose-li:text-slate-400 max-w-none"
        dangerouslySetInnerHTML={{ __html: article?.content || "" }}
      />

    </div>
  );
}
