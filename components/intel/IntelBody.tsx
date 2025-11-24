'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  // 1. Find Article
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);

  // 2. Defaults (Prevents "Empty Page" error)
  const tier = article?.tier || "Free";
  const content = article?.content || `
    <p class="text-lg text-slate-300 mb-8">Report content is currently synchronizing from the archive...</p>
    <h3>Market Overview</h3>
    <p>Data for ${slug} is being processed by the VARC system.</p>
  `;

  // 3. Color Logic
  const accentColor =
    tier === "Elite" ? "#22d3ee" :
    tier === "Pro" ? "#a855f7" :
    "#fbbf24";

  return (
    <div className="font-sans text-slate-300 leading-relaxed space-y-12">

      {/* 1. EXECUTIVE BRIEFING (The Stream) */}
      <div
        className="p-6 border-l-2 bg-opacity-5 rounded-r-lg backdrop-blur-sm"
        style={{
          borderColor: accentColor,
          backgroundColor: `${accentColor}10`,
          boxShadow: `0 0 20px ${accentColor}05`
        }}
      >
        <h3 className="font-bold mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2" style={{ color: accentColor }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}/>
          /// EXECUTIVE_BRIEFING
        </h3>
        <div className="min-h-[60px] text-sm md:text-base font-mono">
           <TerminalStream content={article?.summary || "Initializing..."} speed={10} />
        </div>
      </div>

      {/* 2. CHART SECTION (Always visible) */}
      <div className="w-full">
         <IntelChart
            title="PRICE ACTION // HISTORICAL"
            data={article?.chartData} // Pass data if it exists
            color={accentColor}
         />
      </div>

      {/* 3. MAIN CONTENT (The Missing Piece) */}
      <div className="relative z-10">
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:uppercase prose-headings:font-black prose-headings:tracking-tighter
            prose-p:text-slate-300 prose-p:leading-loose
            prose-strong:text-white prose-strong:font-bold
            prose-li:text-slate-400"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

    </div>
  );
}
