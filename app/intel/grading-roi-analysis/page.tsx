import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { Award, DollarSign, AlertTriangle, TrendingUp, Calculator } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: The Grading Paradox: When PSA 10 Destroys Value
// Description: Mathematical analysis of grading ROI with break-even calculations and optimal submission strategies.

export default function GradingROIArticle() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-purple-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-purple-500 mb-4 font-mono text-sm tracking-wider">
            <Award size={16} />
            <span>FINANCIAL ANALYSIS</span>
            <span>//</span>
            <span>GRADING ROI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-purple">
            The Grading Paradox: When PSA 10 Destroys Value
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>UPDATED: AUGUST 2025</span>
          </div>
        </header>

        {/* EXECUTIVE SUMMARY */}
        <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-900/50 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calculator className="text-purple-400" size={20} />
            The Core Truth
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Grading is <strong className="text-white">not free money</strong>. At current PSA pricing ($25-$150/card), you need a minimum 3.5x multiplier from raw to graded to break even. Most modern cards fail this test. Grading vintage is profitable. Grading modern bulk is financial suicide.
          </p>
        </div>

        {/* THE MATH */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">The Break-Even Formula</h2>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="font-mono text-center mb-4">
              <div className="text-sm text-gray-400 mb-2">Break-Even Multiplier</div>
              <div className="text-2xl text-cyan-400">
                (Raw Price + Grading Cost + Shipping) × 1.15 = Minimum PSA 10 Price
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              The 1.15 factor accounts for eBay/TCGPlayer fees (13%) + risk premium (2%)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-5">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="text-green-400" size={18} />
                Example: Positive ROI
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Raw Card:</span>
                  <span className="text-white">$200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PSA Fee:</span>
                  <span className="text-white">$50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping:</span>
                  <span className="text-white">$10</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-2">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-white font-bold">$260</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Break-Even:</span>
                  <span className="text-yellow-400">$299</span>
                </div>
                <div className="flex justify-between border-t border-green-800 pt-2 mt-2">
                  <span className="text-gray-400">PSA 10 Market:</span>
                  <span className="text-green-400 font-bold">$800</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Profit:</span>
                  <span className="text-green-400 font-bold">+$501 (+167%)</span>
                </div>
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={18} />
                Example: Value Destruction
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Raw Card:</span>
                  <span className="text-white">$80</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PSA Fee:</span>
                  <span className="text-white">$25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping:</span>
                  <span className="text-white">$8</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-2">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-white font-bold">$113</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Break-Even:</span>
                  <span className="text-yellow-400">$130</span>
                </div>
                <div className="flex justify-between border-t border-red-800 pt-2 mt-2">
                  <span className="text-gray-400">PSA 10 Market:</span>
                  <span className="text-red-400 font-bold">$120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Loss:</span>
                  <span className="text-red-400 font-bold">-$10 (-8.8%)</span>
                </div>
              </div>
              <p className="text-xs text-red-400 mt-3 italic">
                This assumes PSA 10. A PSA 9 result would lose $40-50.
              </p>
            </div>
          </div>
        </div>

        {/* PSA 10 RATE CHART */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <Award className="mr-2 text-purple-500" size={20} />
            PSA 10 Rate by Card Era (2024 Data)
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            <IntelChart type="bar" data={{
              labels: ['Vintage (Pre-2003)', 'HGSS Era', 'XY Era', 'Sun & Moon', 'SwSh Era', 'Scarlet & Violet'],
              datasets: [
                { label: 'PSA 10 Rate (%)', data: [12, 18, 28, 35, 42, 48], color: '#a855f7' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA: PSA POP REPORTS • N=50,000+ SUBMISSIONS
          </p>
        </div>

        {/* THE GRADING DECISION MATRIX */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">The Grading Decision Matrix</h2>

          <div className="space-y-4">
            <div className="bg-gray-900/30 border-l-4 border-green-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2">Grade This: Vintage + High Raw Value</h4>
              <p className="text-sm text-gray-300 mb-3">
                Cards worth $100+ raw with PSA 10 multipliers above 4x. Examples: Base Set Charizard, Neo Lugia, Expedition Charizard.
              </p>
              <div className="text-xs text-gray-400 font-mono">
                PSA 10 Rate: 8-15% • Average ROI: +$400-$2,000
              </div>
            </div>

            <div className="bg-gray-900/30 border-l-4 border-yellow-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2">Maybe Grade: Alt Arts with Centering</h4>
              <p className="text-sm text-gray-300 mb-3">
                Modern alternate arts where PSA 10 premium is 2.5-3x raw and you can verify centering is 55/45 or better.
              </p>
              <div className="text-xs text-gray-400 font-mono">
                PSA 10 Rate: 35-45% • Average ROI: +$50-$150
              </div>
            </div>

            <div className="bg-gray-900/30 border-l-4 border-red-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2">Never Grade: Modern Bulk Holos</h4>
              <p className="text-sm text-gray-300 mb-3">
                Cards worth under $50 raw with PSA 10 multipliers under 2.5x. The grading fee eats all profit.
              </p>
              <div className="text-xs text-gray-400 font-mono">
                PSA 10 Rate: 40-50% • Average ROI: -$5 to +$10 (not worth time)
              </div>
            </div>
          </div>
        </div>

        {/* ADVANCED STRATEGY */}
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-blue-400" size={20} />
            Advanced Strategy: The "Bulk Crossover" Play
          </h3>
          <p className="text-gray-300 mb-4 text-sm">
            Instead of grading raw, buy CGC/BGS 9.5s and crossover to PSA. You know the grade floor, eliminating PSA 8-9 risk.
          </p>
          <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">CGC 9.5 Purchase:</span>
              <span className="text-white">$150</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">PSA Crossover Fee:</span>
              <span className="text-white">$40</span>
            </div>
            <div className="flex justify-between font-mono border-t border-gray-800 pt-2">
              <span className="text-gray-400">Total Investment:</span>
              <span className="text-white font-bold">$190</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">PSA 10 Success Rate:</span>
              <span className="text-cyan-400">~60%</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">PSA 10 Sale Price:</span>
              <span className="text-green-400">$300</span>
            </div>
            <div className="flex justify-between font-mono border-t border-green-800 pt-2">
              <span className="text-gray-400">Expected Value:</span>
              <span className="text-green-400 font-bold">+$56 (+29% ROI)</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            This assumes PSA doesn't cross at 10, you still have a CGC 9.5 worth close to your purchase price.
          </p>
        </div>

        {/* KEY TAKEAWAYS */}
        <div className="bg-purple-950/20 border border-purple-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-3">Key Takeaways</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Never grade a card worth less than $50 raw unless PSA 10 multiplier is 5x+</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Vintage has lower PSA 10 rates but higher multipliers — better risk-adjusted returns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Modern cards with PSA 10 rates above 40% need 3x+ multipliers to justify grading</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Crossover plays de-risk the process but require active deal hunting on CGC/BGS inventory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Factor in opportunity cost: $150 in grading fees could buy shares of profitable cards instead</span>
            </li>
          </ul>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
          <span className="text-gray-500 text-sm font-mono">PREV: VINTAGE WOTC REPORT</span>
          <span className="text-gray-500 text-sm font-mono">NEXT: JAPANESE SETS ANALYSIS</span>
        </div>
      </article>
    </main>
  );
}
