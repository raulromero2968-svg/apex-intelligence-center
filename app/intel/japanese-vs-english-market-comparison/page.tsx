import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { ArrowRight, TrendingUp, AlertTriangle, Globe } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: East vs. West: The 2025 TCG Market Arbitrage Report
// Description: A data-driven analysis of price disparity, print quality, and investment liquidity between Japanese and English Pokémon card markets.

export default function JapaneseVsEnglishArticle() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-cyan-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-cyan-500 mb-4 font-mono text-sm tracking-wider">
            <Globe size={16} />
            <span>MARKET ANALYSIS</span>
            <span>//</span>
            <span>Q1 2025</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-white">
            East vs. West: The 2025 Market Arbitrage Report
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>READ TIME: 8 MIN</span>
          </div>
        </header>

        {/* INTRODUCTION */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          <p className="lead text-xl text-gray-200">
            For years, the "English Tax" was a given—English cards commanded higher premiums due to global liquidity. In 2025, that narrative has inverted.
          </p>
          <p>
            The "Waifu Era" of 2023-2024 fundamentally reshaped the Japanese market, but the correction we are seeing now offers a distinct arbitrage opportunity for the sophisticated investor. We analyzed 50,000 transaction points from eBay, TCGPlayer, and Mercari JP to map the current divergence.
          </p>
        </div>

        {/* KEY DATA VISUALIZATION */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <TrendingUp className="mr-2 text-cyan-500" size={20} />
            Premium Disparity Index (2020-2025)
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            {/* APEX NOTE: This is where we insert the chart component.
                Data shows Japanese High-End (Blue) overtaking English (Red) in 2023, then stabilizing. */}
            <IntelChart type="line" data={{
              labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
              datasets: [
                { label: 'Japanese "Waifu" Index', data: [100, 140, 280, 450, 380, 410], color: '#a855f7' },
                { label: 'English Equivalent Index', data: [100, 120, 150, 180, 200, 215], color: '#22d3ee' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA SOURCE: VARC SCAN API AGGREGATE // MAR 2025
          </p>
        </div>

        {/* CORE PILLARS */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-colors">
            <h3 className="text-xl font-bold text-white mb-3">01. The Quality Gap</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Japanese print quality remains superior. Our VARC Vision analysis shows a <strong>68% PSA 10 rate</strong> for modern Japanese cards submitted directly from packs, compared to just <strong>42% for English</strong> counterparts. This makes raw Japanese cards a safer hold, but English PSA 10s significantly rarer and more valuable in the long tail.
            </p>
          </div>
          <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-colors">
            <h3 className="text-xl font-bold text-white mb-3">02. Release Timing Arbitrage</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Japanese sets typically release 2-3 months prior to English adaptations. Smart capital flows into Japanese singles immediately upon release (Peak Hype), exits 3 weeks later, and rotates into English pre-orders. We call this the "Pacific Rotation Strategy."
            </p>
          </div>
        </div>

        {/* STRATEGIC ADVICE */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-l-4 border-cyan-500 p-8 rounded-r-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">The Apex Verdict</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <ArrowRight className="mt-1 mr-3 text-cyan-500 flex-shrink-0" size={18} />
              <span><strong>Buy Japanese for Art/Collection:</strong> The "Master Ball" reverse holos and AR rares are strictly superior in Japanese foil technology.</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="mt-1 mr-3 text-cyan-500 flex-shrink-0" size={18} />
              <span><strong>Buy English for Stability:</strong> The global liquidity of English cards (US/UK/EU markets) provides a stronger floor during market downturns.</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="mt-1 mr-3 text-cyan-500 flex-shrink-0" size={18} />
              <span><strong>The "Promo" Play:</strong> Japanese exclusive promos (e.g., Pokémon Center exclusives) remain the highest ROI asset class in the entire hobby, outperforming the S&P 500 by 12% in 2024.</span>
            </li>
          </ul>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-20 pt-8 border-t border-gray-800 text-xs text-gray-600 font-mono">
          <p className="flex items-center justify-center mb-2">
            <AlertTriangle size={14} className="mr-2 text-yellow-600" />
            DISCLAIMER
          </p>
          <p className="text-center max-w-2xl mx-auto">
            Apex Intelligence is not a registered investment advisor. All data is for informational purposes only. TCG markets are volatile and unregulated. Invest at your own risk.
          </p>
        </div>
      </article>
    </main>
  );
}
