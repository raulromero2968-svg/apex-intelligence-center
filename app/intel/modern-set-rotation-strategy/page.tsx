import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { ArrowRight, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: The Clockwork Alpha: Profiting from Set Rotation
// Description: Mastering the cyclical nature of TCG formats to predict price floors and breakout ceilings.

export default function SetRotationArticle() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-purple-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-purple-500 mb-4 font-mono text-sm tracking-wider">
            <RefreshCw size={16} />
            <span>STRATEGY GUIDE</span>
            <span>//</span>
            <span>CYCLE ANALYSIS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-purple">
            The Clockwork Alpha: Profiting from Set Rotation
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>DATA POINTS: 12,000+</span>
          </div>
        </header>

        {/* INTRODUCTION */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          <p className="lead text-xl text-gray-200">
            In financial markets, "insider trading" is illegal. In TCG markets, knowing the Rotation Schedule is effectively legal insider trading.
          </p>
          <p>
            Every year, older sets rotate out of the "Standard" competitive format. This triggers a predictable, violent repricing event. The "Playability Premium" evaporates overnight, leaving only the "Collector Floor." We call this the <strong>Rotation V-Curve</strong>.
          </p>
        </div>

        {/* CHART SECTION */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <Layers className="mr-2 text-purple-500" size={20} />
            The Rotation V-Curve Analysis
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            {/* APEX CHART LOGIC:
               1. Pre-Rotation (Left): Price is high due to meta playability.
               2. Rotation Event (Center): Massive dip as players dump cards.
               3. Post-Rotation (Right): Slow climb for collector items, flatline for bulk.
            */}
            <IntelChart type="line" data={{
              labels: ['Q1 (Meta)', 'Q2 (Peak)', 'Q3 (Panic)', 'Q4 (Rotation)', 'Q1 (+1yr)', 'Q2 (+1yr)'],
              datasets: [
                { label: 'Alt Art (Collector)', data: [120, 130, 115, 110, 140, 165], color: '#a855f7' },
                { label: 'Meta Staple (Player)', data: [80, 95, 60, 15, 10, 8], color: '#22d3ee' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            ANALYSIS: STAPLES CRASH 85% // ALT ARTS REBOUND +40%
          </p>
        </div>

        {/* STRATEGY GRID */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900/30 p-5 rounded-lg border-l-2 border-red-500">
            <h4 className="font-bold text-white mb-2">Phase 1: The Dump</h4>
            <p className="text-sm text-gray-400">
              <strong>Timing:</strong> 3 months pre-rotation.
              <br/>
              <strong>Action:</strong> Liquidate all non-Alt Art "playable" cards. The market is slow to react; be the first out.
            </p>
          </div>
          <div className="bg-gray-900/30 p-5 rounded-lg border-l-2 border-yellow-500">
            <h4 className="font-bold text-white mb-2">Phase 2: The Floor</h4>
            <p className="text-sm text-gray-400">
              <strong>Timing:</strong> 2 weeks post-rotation.
              <br/>
              <strong>Action:</strong> Wait. Let the panic sellers flood TCGPlayer. Prices will undershoot fair value.
            </p>
          </div>
          <div className="bg-gray-900/30 p-5 rounded-lg border-l-2 border-green-500">
            <h4 className="font-bold text-white mb-2">Phase 3: The Scoop</h4>
            <p className="text-sm text-gray-400">
              <strong>Timing:</strong> 2 months post-rotation.
              <br/>
              <strong>Action:</strong> Buy "Chase Rares" and "Waifus" at their historical lows. They are no longer printed, and supply is capped.
            </p>
          </div>
        </div>

        {/* KEY TAKEAWAY */}
        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-6 flex items-start">
          <AlertCircle className="text-blue-400 mr-4 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">The Apex Alpha Rule</h3>
            <p className="text-gray-300 text-sm">
              "Never hold a plain-text card through rotation. Always hold an Alternate Art through rotation."
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Plain text cards rely on utility (which expires). Alternate Arts rely on aesthetics (which are eternal).
            </p>
          </div>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
            <span className="text-gray-500 text-sm font-mono">PREV: JAPANESE ARBITRAGE</span>
            <span className="text-gray-500 text-sm font-mono">NEXT: VINTAGE WOTC REPORT</span>
        </div>
      </article>
    </main>
  );
}
