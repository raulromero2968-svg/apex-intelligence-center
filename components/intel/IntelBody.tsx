'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';
import IntelChart from '@/components/intel/IntelChart';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

export function IntelBody({ slug }: { slug: string }) {
  const article = INTEL_ARCHIVE.find(a => a.slug === slug);
  const tier = article?.tier || "Free";

  // Color Logic
  const accentColor =
    tier === "Elite" ? "#22d3ee" : // Cyan
    tier === "Pro" ? "#a855f7" :   // Purple
    "#fbbf24";                     // Amber

  // Content fallback
  const summary = article?.summary || "Initializing secure connection...";
  const content = article?.content || "<p>Data packet encrypted.</p>";

  return (
    <div className="font-mono text-slate-300 leading-relaxed space-y-10">

      {/* 1. SWARM STREAMING HEADER (The "Loading" Effect) */}
      <div
        className="p-6 border-l-2 bg-opacity-5 rounded-r-lg backdrop-blur-sm"
        style={{
          borderColor: accentColor,
          backgroundColor: `${accentColor}10`,
          boxShadow: `0 0 20px ${accentColor}10`
        }}
      >
        <h3 className="font-bold mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2" style={{ color: accentColor }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}/>
          /// EXECUTIVE_BRIEFING
        </h3>

        {/* THIS IS THE SWARM EFFECT */}
        <div className="min-h-[80px] text-sm md:text-base">
           <TerminalStream content={summary} speed={15} />
        </div>
      </div>

      {/* 2. CHART ENGINE (Only shows if data exists) */}
      {article?.chartData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-forwards opacity-0" style={{ animationDelay: '1s' }}>
           <IntelChart
              title="MARKET PERFORMANCE // ALPHA DATA"
              data={article.chartData}
              color={accentColor}
           />
        </div>
      )}

      {/* 3. MAIN DOSSIER (Static HTML) */}
      <div
        className="prose prose-invert prose-p:font-sans prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight max-w-none animate-in fade-in duration-1000 delay-700 opacity-0 fill-mode-forwards"
        style={{ animationDelay: '1.5s' }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

    </div>
  );
}
