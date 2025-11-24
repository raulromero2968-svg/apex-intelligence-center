'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';

export function IntelBody({ slug, category }: { slug: string, category?: string }) {

  // 1. SIMULATED CONTENT GENERATOR
  // If we don't have full text in the DB yet, we generate "High-Tech" filler
  // that sounds like a real report so the streaming effect looks cool.
  const reportContent = `
    INITIATING VARC SCAN PROTOCOL...
    TARGET: ${slug.toUpperCase().replace(/-/g, ' ')}

    MARKET ANALYSIS:
    Our systems have detected significant liquidity shifts in this sector.
    Transaction volume has increased by 24% in the last 72 hours, indicating a potential breakout or accumulation phase by institutional collectors.

    THE DATA:
    Cross-referencing eBay sold listings with TCGPlayer low data reveals a tightening spread.
    Historical volatility index suggests this asset class is entering a stabilization period.

    STRATEGIC DIRECTIVE:
    Based on current resistance levels, we advise monitoring supply walls.
    If condition-sensitive assets (PSA 9+) appear below market moving averages, execute acquisition.
  `;

  return (
    <div className="space-y-8 font-mono text-sm md:text-base">

      {/* 1. EXECUTIVE SUMMARY STREAM */}
      <div className="p-6 border-l-2 border-cyan-500 bg-cyan-950/10">
        <h3 className="text-cyan-400 font-bold mb-2 uppercase text-xs tracking-widest">/// EXECUTIVE_SUMMARY</h3>
        <div className="text-slate-300">
           <TerminalStream content={reportContent} speed={5} />
        </div>
      </div>

      {/* 2. STATIC DATA GRID (Visuals don't stream, they fade in) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-1000 delay-500 fill-mode-forwards opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
        <div className="bg-slate-900/50 border border-slate-800 p-4">
           <div className="text-slate-500 text-[10px] uppercase">Volatility Index</div>
           <div className="text-2xl text-white font-bold">LOW</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4">
           <div className="text-slate-500 text-[10px] uppercase">Liquidity Score</div>
           <div className="text-2xl text-green-400 font-bold">HIGH</div>
        </div>
      </div>

      {/* 3. CHART PLACEHOLDER */}
      <div className="w-full h-64 bg-slate-900 border border-slate-800 relative overflow-hidden flex items-center justify-center mt-8">
         <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}
         />
         <p className="text-cyan-500 font-mono text-xs animate-pulse">[ CHART_RENDERING_ENGINE_ACTIVE ]</p>
      </div>
    </div>
  );
}
