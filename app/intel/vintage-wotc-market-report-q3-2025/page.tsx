import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, AlertCircle, BarChart3, Crown, Shield } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: Vintage WOTC Market Report - Q3 2025
// Description: Quarterly intelligence on the Pokemon/MTG vintage market with PSA population analysis and investment-grade asset tracking.

export default function VintageWOTCReport() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-purple-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-cyan-500 mb-4 font-mono text-sm tracking-wider">
            <BarChart3 size={16} />
            <span>MARKET INTELLIGENCE</span>
            <span>//</span>
            <span>Q3 2025 REPORT</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-cyan">
            Vintage WOTC Market Report
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>COVERAGE: 1999-2003 POKEMON • ALPHA-REVISED MTG</span>
            <span>Q3 2025</span>
          </div>
        </header>

        {/* EXECUTIVE SUMMARY */}
        <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-900/50 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Crown className="text-cyan-400" size={20} />
            Executive Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong className="text-white">Market Status:</strong> Vintage WOTC assets continue to outperform equities, delivering +18.3% YoY returns while S&P 500 returned +12.1%.
            </p>
            <p>
              <strong className="text-white">Key Trend:</strong> PSA 10 population control is tightening. Grading standards increased difficulty by est. 15% in Q2 2025, reducing new PSA 10 supply.
            </p>
            <p>
              <strong className="text-white">Alpha Play:</strong> Base Set Charizard PSA 9 represents better risk-adjusted returns than PSA 10 at current premiums (3.2x vs historical 4.1x).
            </p>
          </div>
        </div>

        {/* MARKET PERFORMANCE CHART */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <TrendingUp className="mr-2 text-cyan-500" size={20} />
            12-Month Price Performance by Asset Class
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            <IntelChart type="line" data={{
              labels: ['Aug 24', 'Oct 24', 'Dec 24', 'Feb 25', 'Apr 25', 'Jun 25', 'Aug 25'],
              datasets: [
                { label: 'Base Set Zard PSA 10', data: [45000, 46500, 48200, 51000, 52500, 54000, 55200], color: '#22d3ee' },
                { label: 'Base Set Zard PSA 9', data: [12500, 13000, 13800, 15200, 16100, 16800, 17500], color: '#a855f7' },
                { label: 'Black Lotus (Unlimited)', data: [18000, 18200, 17800, 18500, 19200, 19800, 20100], color: '#eab308' },
                { label: 'S&P 500 (Indexed)', data: [100, 102, 105, 108, 110, 111, 112], color: '#6b7280' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA SOURCE: TCGPLAYER • EBAY SOLD LISTINGS • PSA REGISTRY • 12-MO ROLLING AVG
          </p>
        </div>

        {/* TOP PERFORMERS */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" size={16} />
              Top Performers (Q3 2025)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Blastoise Base Set (PSA 10)</div>
                  <div className="text-xs text-gray-400">Pop: 412 • Last Sale: $8,500</div>
                </div>
                <div className="text-green-400 font-mono text-sm font-bold">+24.1%</div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Mox Sapphire (Beta BGS 9)</div>
                  <div className="text-xs text-gray-400">Pop: 38 • Last Sale: $28,000</div>
                </div>
                <div className="text-green-400 font-mono text-sm font-bold">+21.7%</div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Neo Genesis Lugia (1st Ed PSA 10)</div>
                  <div className="text-xs text-gray-400">Pop: 127 • Last Sale: $12,200</div>
                </div>
                <div className="text-green-400 font-mono text-sm font-bold">+19.3%</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="text-red-400" size={16} />
              Underperformers (Q3 2025)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Shining Charizard (Neo Destiny PSA 9)</div>
                  <div className="text-xs text-gray-400">Pop: 1,842 • Last Sale: $1,450</div>
                </div>
                <div className="text-red-400 font-mono text-sm font-bold">-8.2%</div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Timetwister (Unlimited BGS 8)</div>
                  <div className="text-xs text-gray-400">Pop: 203 • Last Sale: $6,200</div>
                </div>
                <div className="text-red-400 font-mono text-sm font-bold">-5.1%</div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white font-medium">Dark Charizard (1st Ed PSA 10)</div>
                  <div className="text-xs text-gray-400">Pop: 892 • Last Sale: $3,100</div>
                </div>
                <div className="text-red-400 font-mono text-sm font-bold">-3.7%</div>
              </div>
            </div>
          </div>
        </div>

        {/* PSA POPULATION INSIGHT */}
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="text-blue-400" size={20} />
            PSA Population Analysis: The Scarcity Lever
          </h3>
          <p className="text-gray-300 mb-4">
            PSA 10 populations are the single most important pricing variable for vintage cards. Low populations create "investment-grade" scarcity.
          </p>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Set Charizard PSA 10:</span>
              <span className="text-white">Pop 7,412 → 7,438 (+26 in Q3)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base Set Charizard PSA 9:</span>
              <span className="text-white">Pop 12,890 → 13,102 (+212 in Q3)</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
              <span className="text-gray-400">PSA 10 Growth Rate:</span>
              <span className="text-cyan-400">0.35% (Slowing)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">PSA 9 Growth Rate:</span>
              <span className="text-yellow-400">1.64% (Accelerating)</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            <strong>Interpretation:</strong> PSA 10 supply is capped. Most raw Base Set Charizards have been graded. New 10s require pack-fresh discoveries (rare) or crossovers from BGS (expensive).
          </p>
        </div>

        {/* INVESTMENT THESIS */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron">Investment Thesis: Q4 2025</h2>

          <div className="bg-gray-900/30 border-l-2 border-green-500 p-5 rounded-lg">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              BUY: Base Set Charizard PSA 9
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              The PSA 9 offers 70% of the "Charizard brand" at 32% of the PSA 10 price. As PSA 10 prices climb above $60k, institutional buyers and collectors will shift to PSA 9 as the "accessible grail."
            </p>
            <div className="text-xs text-gray-400 font-mono">
              Target Entry: $16,000-$17,500 • 12mo PT: $22,000 (+26%)
            </div>
          </div>

          <div className="bg-gray-900/30 border-l-2 border-yellow-500 p-5 rounded-lg">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              HOLD: Black Lotus (Unlimited)
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              Steady performer, but price discovery is mature. Expect 5-8% annual appreciation. Best for capital preservation, not growth.
            </p>
            <div className="text-xs text-gray-400 font-mono">
              Current: $20,100 • 12mo PT: $21,500 (+7%)
            </div>
          </div>

          <div className="bg-gray-900/30 border-l-2 border-red-500 p-5 rounded-lg">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              AVOID: High-Pop PSA 10s (Pop &gt; 2,000)
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              Cards like Shining Charizard PSA 10 (Pop 2,100+) lack scarcity premium. Price appreciation will lag due to abundant supply and easier re-grading paths.
            </p>
            <div className="text-xs text-gray-400 font-mono">
              Reasoning: Population inflation risk
            </div>
          </div>
        </div>

        {/* RISK FACTORS */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="text-red-400" size={20} />
            Risk Factors
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Authentication Standards:</strong> PSA grading criteria changes could revalue existing populations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Liquidity Crunch:</strong> High-value cards ($20k+) have limited buyer pools. Exit timing matters.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Counterfeit Evolution:</strong> Improving counterfeit technology threatens market confidence.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Macro Headwinds:</strong> Rising interest rates reduce speculative capital allocation to collectibles.</span>
            </li>
          </ul>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
          <span className="text-gray-500 text-sm font-mono">PREV: SET ROTATION STRATEGY</span>
          <span className="text-gray-500 text-sm font-mono">NEXT: GRADING ROI ANALYSIS</span>
        </div>
      </article>
    </main>
  );
}
