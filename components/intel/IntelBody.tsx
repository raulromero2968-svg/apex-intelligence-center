'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';

export function IntelBody({ slug }: { slug: string }) {

  // GENERATED INTEL PROTOCOL
  // This ensures every single article feels like a live hacker readout
  const briefing = `
    /// CLASSIFIED INTELLIGENCE PACKET
    /// SUBJECT: ${slug.toUpperCase().replace(/-/g, ' ')}
    /// CLEARANCE: ALPHA_TIER

    MARKET ANALYSIS:
    Our VARC systems have detected significant liquidity shifts in this sector.
    Transaction volume has spiked by 24% in the last 72 hours, indicating a potential breakout or institutional accumulation phase.

    THE DATA:
    Cross-referencing eBay sold listings with TCGPlayer low data reveals a tightening spread.
    Historical volatility index suggests this asset class is entering a stabilization period.
  `;

  const strategy = `
    STRATEGIC DIRECTIVE:
    Based on current resistance levels, we advise monitoring supply walls.
    If condition-sensitive assets (PSA 9+) appear below market moving averages, execute acquisition immediately.

    RISK ASSESSMENT:
    Volatility remains moderate. Ensure diversification across eras to mitigate reprint exposure.
  `;

  return (
    <div className="space-y-10 font-mono text-sm md:text-base">

      {/* 1. EXECUTIVE SUMMARY STREAM */}
      <div className="p-6 border-l-2 border-cyan-500 bg-cyan-950/10 rounded-r-lg">
        <h3 className="text-cyan-400 font-bold mb-3 uppercase text-xs tracking-[0.2em]">
          /// EXECUTIVE_BRIEFING
        </h3>
        <div className="text-slate-300 min-h-[150px]">
           <TerminalStream content={briefing} speed={3} />
        </div>
      </div>

      {/* 2. STATIC DATA GRID (Fades in, doesn't stream) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-[fadeIn_1s_ease-in_forwards] delay-1000" style={{ animationDelay: '1000ms' }}>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
           <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Volatility Index</div>
           <div className="text-2xl text-white font-bold group-hover:text-purple-400 transition-colors">LOW</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
           <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Liquidity Score</div>
           <div className="text-2xl text-white font-bold group-hover:text-green-400 transition-colors">HIGH</div>
        </div>
      </div>

      {/* 3. STRATEGY STREAM */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2 inline-block">
            TACTICAL OUTLOOK
        </h2>
        <div className="min-h-[100px]">
            <TerminalStream content={strategy} speed={3} />
        </div>
      </div>

      {/* 4. HOLOGRAPHIC CHART PLACEHOLDER */}
      <div className="w-full h-64 bg-slate-950 border border-slate-800 relative overflow-hidden rounded-lg flex items-center justify-center mt-8 group">
         {/* Grid Background */}
         <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}
         />
         {/* Animated Scanner Line */}
         <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_3s_linear_infinite]" />

         <p className="text-cyan-500 font-mono text-xs tracking-widest animate-pulse border border-cyan-500/30 px-4 py-2 rounded bg-cyan-950/50">
            [ CHART_RENDERING_ENGINE_ACTIVE ]
         </p>
      </div>
    </div>
  );
}
