'use client';

import { TerminalStream } from '@/components/ui/TerminalStream';

export function IntelBody({ slug }: { slug: string }) {
  // Static text for demo - in production this comes from the archive
  const introText = `This report analyzes the market dynamics surrounding ${slug}. Using our proprietary VARC scanning technology, we have tracked transaction volume across major marketplaces to identify outlier patterns.`;

  const strategyText = `Based on the current trend lines, we recommend a HOLD strategy for vintage assets in this category. Modern print runs continue to show high supply saturation, but liquidity for graded 10s remains at an all-time high.`;

  return (
    <div className="space-y-8">
      <div className="text-lg">
        <TerminalStream content={introText} speed={10} />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg my-8">
        <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs text-cyan-500">
          [ Key Findings_ ]
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400 font-mono">
          <li>Market volatility has decreased by 15% quarter-over-quarter.</li>
          <li>Liquidity remains high for graded assets (PSA 9+).</li>
          <li>Arbitrage opportunities detected between US and JP markets.</li>
        </ul>
      </div>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Strategic Outlook</h2>
      <div className="text-base">
         <TerminalStream content={strategyText} speed={10} />
      </div>

      {/* Chart Placeholder */}
      <div className="w-full h-64 bg-slate-900 border border-slate-800 relative overflow-hidden rounded flex items-center justify-center mt-8">
         <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 211, 238, .3) 25%, rgba(34, 211, 238, .3) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, .3) 75%, rgba(34, 211, 238, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}
         />
         <p className="text-cyan-500 font-mono text-xs animate-pulse">[ LOADING_DATA_VISUALIZATION... ]</p>
      </div>
    </div>
  );
}
