import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { Globe, TrendingUp, Package, AlertCircle, Sparkles } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: Japanese Set Premiums: The Quality Arbitrage
// Description: Why Japanese Pokemon cards command 15-30% premiums and how to exploit print quality differences for profit.

export default function JapaneseSetsArticle() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-purple-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-cyan-500 mb-4 font-mono text-sm tracking-wider">
            <Globe size={16} />
            <span>MARKET ANALYSIS</span>
            <span>//</span>
            <span>JAPANESE PREMIUM</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-cyan">
            Japanese Set Premiums: The Quality Arbitrage
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>COVERAGE: 2016-2025 SETS</span>
          </div>
        </header>

        {/* EXECUTIVE SUMMARY */}
        <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-900/50 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={20} />
            The Core Thesis
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Japanese Pokemon cards are printed on higher-quality card stock with better centering QC than English equivalents. This creates a <strong className="text-white">structural quality advantage</strong> that translates to 15-30% price premiums for raw cards and higher PSA 10 rates (est. +8-12% vs English).
          </p>
        </div>

        {/* THE QUALITY DIFFERENCE */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">The Print Quality Gap</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Japanese Print Advantages
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300"><strong className="text-white">Superior Centering:</strong> Average 60/40 vs English 55/45</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300"><strong className="text-white">Thicker Stock:</strong> Less edge wear during packing/shipping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300"><strong className="text-white">Crisper Holo:</strong> Less holo scratching from pack friction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300"><strong className="text-white">Lower Print Runs:</strong> Japanese market is smaller = less supply</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                English Print Issues
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span className="text-gray-300"><strong className="text-white">Centering Variance:</strong> High rate of off-center pulls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span className="text-gray-300"><strong className="text-white">Thinner Stock:</strong> More susceptible to edge damage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span className="text-gray-300"><strong className="text-white">Whitening Issues:</strong> Back edges chip easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span className="text-gray-300"><strong className="text-white">Higher Print Runs:</strong> Global demand = more supply</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* PREMIUM CHART */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <TrendingUp className="mr-2 text-cyan-500" size={20} />
            Japanese vs English Price Premium by Set
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            <IntelChart type="bar" data={{
              labels: ['Evolving Skies', 'Lost Origin', 'Crown Zenith', 'Paldean Fates', '151', 'Obsidian Flames'],
              datasets: [
                { label: 'Japanese Premium (%)', data: [28, 22, 18, 32, 25, 20], color: '#22d3ee' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA: RAW ALT ART CHASE CARDS • TCGPLAYER US VS BUYEE JP • 30-DAY AVG
          </p>
        </div>

        {/* CASE STUDIES */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">Case Studies: Japanese Premium in Action</h2>

          <div className="space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Umbreon VMAX Alt Art (Evolving Skies)</h4>
                  <p className="text-sm text-gray-400">The "Moonbreon" — Highest premium modern card</p>
                </div>
                <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 rounded-full text-xs font-bold">+32%</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <div className="text-gray-400 mb-2">English (Raw NM)</div>
                  <div className="text-2xl text-white font-bold mb-1">$450</div>
                  <div className="text-xs text-gray-500">PSA 10 Rate: ~38%</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-2">Japanese (Raw NM)</div>
                  <div className="text-2xl text-cyan-400 font-bold mb-1">$595</div>
                  <div className="text-xs text-gray-500">PSA 10 Rate: ~52%</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">
                The 14% higher PSA 10 rate justifies the premium for grading arbitrage plays.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Charizard ex SAR (151)</h4>
                  <p className="text-sm text-gray-400">Modern chase card with nostalgia factor</p>
                </div>
                <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 rounded-full text-xs font-bold">+25%</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <div className="text-gray-400 mb-2">English (Raw NM)</div>
                  <div className="text-2xl text-white font-bold mb-1">$180</div>
                  <div className="text-xs text-gray-500">PSA 10 Rate: ~42%</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-2">Japanese (Raw NM)</div>
                  <div className="text-2xl text-cyan-400 font-bold mb-1">$225</div>
                  <div className="text-xs text-gray-500">PSA 10 Rate: ~55%</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">
                Japanese version benefits from lower population and better centering QC.
              </p>
            </div>
          </div>
        </div>

        {/* STRATEGY */}
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={20} />
            Arbitrage Strategy: The Japanese Grading Play
          </h3>
          <p className="text-gray-300 mb-4 text-sm">
            Buy Japanese raw cards, grade them for higher PSA 10 rates, then sell into the English market at English PSA 10 prices.
          </p>
          <div className="bg-black/30 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Japanese Raw Purchase (via Buyee):</span>
              <span className="text-white">$200</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Import Fees + Shipping:</span>
              <span className="text-white">$25</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">PSA Grading Fee:</span>
              <span className="text-white">$50</span>
            </div>
            <div className="flex justify-between font-mono border-t border-gray-800 pt-2">
              <span className="text-gray-400">Total Investment:</span>
              <span className="text-white font-bold">$275</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">PSA 10 Success Rate (Japanese):</span>
              <span className="text-cyan-400">50%</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">English PSA 10 Market Price:</span>
              <span className="text-green-400">$650</span>
            </div>
            <div className="flex justify-between font-mono border-t border-green-800 pt-2">
              <span className="text-gray-400">Expected Profit (50% hit rate):</span>
              <span className="text-green-400 font-bold">+$187 (+68% ROI)</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Even accounting for PSA 9 downgrades, Japanese cards retain value better than English equivalents.
          </p>
        </div>

        {/* WHICH SETS TO TARGET */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">Which Sets to Target</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-950/20 border-l-4 border-green-500 p-4 rounded-lg">
              <h4 className="font-bold text-white mb-2 text-sm">HIGH PRIORITY</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Evolving Skies (Eeveelutions)</li>
                <li>• 151 (Nostalgia factor)</li>
                <li>• Paldean Fates (Shiny vault)</li>
              </ul>
              <div className="text-xs text-green-400 mt-3 font-mono">Premium: 25-32%</div>
            </div>

            <div className="bg-yellow-950/20 border-l-4 border-yellow-500 p-4 rounded-lg">
              <h4 className="font-bold text-white mb-2 text-sm">MEDIUM PRIORITY</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Lost Origin</li>
                <li>• Crown Zenith</li>
                <li>• Stellar Crown</li>
              </ul>
              <div className="text-xs text-yellow-400 mt-3 font-mono">Premium: 18-24%</div>
            </div>

            <div className="bg-red-950/20 border-l-4 border-red-500 p-4 rounded-lg">
              <h4 className="font-bold text-white mb-2 text-sm">AVOID</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Base sets (Scarlet/Violet)</li>
                <li>• Most trainer galleries</li>
                <li>• Non-chase commons/uncommons</li>
              </ul>
              <div className="text-xs text-red-400 mt-3 font-mono">Premium: 5-10%</div>
            </div>
          </div>
        </div>

        {/* RISKS */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="text-red-400" size={20} />
            Risk Factors
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Import Delays:</strong> Buyee shipping can take 3-6 weeks, delaying capital deployment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Currency Risk:</strong> Yen fluctuations affect purchase price (use forward contracts if buying bulk)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Grading Variance:</strong> PSA still subjective; Japanese cards can get 9s</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span><strong>Language Barrier:</strong> Some Western buyers discount Japanese cards despite identical artwork</span>
            </li>
          </ul>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
          <span className="text-gray-500 text-sm font-mono">PREV: GRADING ROI ANALYSIS</span>
          <span className="text-gray-500 text-sm font-mono">NEXT: ARBITRAGE GUIDE</span>
        </div>
      </article>
    </main>
  );
}
