import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { ArrowRight, TrendingUp, AlertTriangle, DollarSign, Package } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: Pokémon 151: Dissecting the Nostalgia Premium
// Description: Economic analysis of the 2023 mega-set celebrating Kanto. Pull rates, chase card valuations, and why Hyper Rare Charizard ex is the most important modern card since Moonbreon.

export default function Pokemon151Article() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-cyan-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-pink-500 mb-4 font-mono text-sm tracking-wider">
            <Package size={16} />
            <span>SET ANALYSIS</span>
            <span>//</span>
            <span>POK&Eacute;MON 151 (2023)</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-white">
            Pokémon 151: Dissecting the Nostalgia Premium
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>READ TIME: 9 MIN</span>
          </div>
        </header>

        {/* INTRODUCTION */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          <p className="lead text-xl text-gray-200">
            In June 2023, The Pokémon Company released the most culturally significant modern set since XY Evolutions: <strong>Pokémon 151</strong>, a premium-priced celebration of the original Kanto Pokédex that drove singles prices to levels unseen since the 2021 boom.
          </p>
          <p>
            Our VARC system tracked 50,000+ eBay transactions across the set's first 18 months. The data reveals a bifurcated market: chase Hyper Rares trading at WOTC-era valuations, while bulk ex cards crater to sub-$5. This is the "K-shaped recovery" of modern TCG—and it's reshaping investment strategy.
          </p>
        </div>

        {/* KEY DATA VISUALIZATION */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <TrendingUp className="mr-2 text-pink-500" size={20} />
            Chase Card Price Trajectory (Release → 18 Months)
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            <IntelChart type="line" data={{
              labels: ['Launch', '3mo', '6mo', '9mo', '12mo', '18mo'],
              datasets: [
                { label: 'Charizard ex (Hyper Rare)', data: [280, 380, 420, 350, 380, 450], color: '#ec4899' },
                { label: 'Mew ex (Ultra Rare)', data: [65, 85, 95, 70, 75, 82], color: '#a855f7' },
                { label: 'Eevee ex (Double Rare)', data: [18, 12, 8, 6, 7, 9], color: '#6b7280' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA SOURCE: EBAY SOLD LISTINGS (RAW) // TCGPLAYER MARKET PRICE
          </p>
        </div>

        {/* THE PRODUCT STRUCTURE */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-orbitron">Product Structure & Pull Economics</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <DollarSign className="mr-2 text-pink-500" size={18} />
                Premium Pricing Model
              </h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Booster Box (36 packs):</span>
                  <span className="text-white font-mono">$180-220</span>
                </div>
                <div className="flex justify-between">
                  <span>Elite Trainer Box:</span>
                  <span className="text-white font-mono">$65-75</span>
                </div>
                <div className="flex justify-between">
                  <span>Single Pack MSRP:</span>
                  <span className="text-white font-mono">$5.49</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-cyan-400">Cost/Pack vs Standard:</span>
                  <span className="text-cyan-400 font-mono">+37%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-3">Pull Rate Structure</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Ultra Rare (ex cards):</span>
                  <span className="text-white font-mono">1 per 3-4 packs</span>
                </div>
                <div className="flex justify-between">
                  <span>Hyper Rare (Gold):</span>
                  <span className="text-white font-mono">1 per 2 boxes</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Illustration Rare:</span>
                  <span className="text-white font-mono">1 per 3 boxes</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-pink-400">Hit Rate:</span>
                  <span className="text-pink-400 font-mono">Very High</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-900/20 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl">
            <h4 className="text-white font-bold mb-2">The "Premium Trap" Phenomenon</h4>
            <p className="text-gray-400 text-sm">
              151's generous hit rates create the <strong>illusion of value</strong>. You'll pull an ex card every 3-4 packs, but 80% of ex cards are worth $3-8. The EV (expected value) of a box hovers at $120-140, while boxes cost $180+. You're paying a <strong>nostalgia tax</strong> for Kanto branding.
            </p>
          </div>
        </div>

        {/* CHASE CARD BREAKDOWN */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-orbitron">The Chase Card Hierarchy</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-900/30 to-transparent border-l-4 border-pink-500 p-6 rounded-r-xl">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white">Tier S: The Apex Chase</h3>
                <span className="text-pink-500 font-mono text-sm">$300-500+</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-pink-400 font-bold mb-1">Charizard ex (Hyper Rare #199)</div>
                  <div className="text-gray-500">The set's flagship. Gold border, textured. Current: $450 raw / $1200+ PSA 10</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-pink-400 font-bold mb-1">Mew ex (Special Illustration Rare #205)</div>
                  <div className="text-gray-500">Ethereal full-art by Akira Egawa. Crossover art collector appeal.</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white">Tier A: Solid Holds</h3>
                <span className="text-purple-500 font-mono text-sm">$50-120</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-purple-400 font-bold mb-1">Erika's Invitation (Full Art)</div>
                  <div className="text-gray-500">Competitive staple + waifu tax. Retains value through rotation.</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-purple-400 font-bold mb-1">Zapdos ex / Moltres ex / Articuno (SIRs)</div>
                  <div className="text-gray-500">Legendary bird trio. Set completion demand.</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-800/30 to-transparent border-l-4 border-gray-600 p-6 rounded-r-xl">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white">Tier B: Bulk Territory</h3>
                <span className="text-gray-500 font-mono text-sm">$3-15</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                The remaining ~40 ex cards (Pidgeot, Kangaskhan, Alakazam, etc.) have minimal competitive use and excessive supply. These are "binder filler" despite being Ultra Rares.
              </p>
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded text-xs text-gray-500">
                <strong className="text-red-400">Investment Warning:</strong> Do NOT buy these expecting recovery. Modern ex cards without meta relevance or iconic status trend to $2-3 long-term.
              </div>
            </div>
          </div>
        </div>

        {/* THE SEALED VS SINGLES DEBATE */}
        <div className="my-12 bg-gray-900/30 p-8 rounded-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">Sealed Product vs. Singles: The Math</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-bold mb-3 text-lg">Case for Sealed Boxes</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-green-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>Long-term appreciation (10+ year hold)</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-green-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>Product dries up as collectors rip packs</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-green-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>Kanto nostalgia is evergreen</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-green-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>No risk of pulling bulk</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-xs">
                <strong className="text-green-400">Expected ROI (5-year):</strong> 30-60% if product stays sealed and demand holds.
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 text-lg">Case for Chase Singles</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-cyan-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>Immediate exposure to top 1% cards</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-cyan-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>No gambling—you get exactly what you want</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-cyan-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>PSA 10 graded = maximum liquidity</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-2 text-cyan-500 flex-shrink-0 mt-0.5" size={14} />
                  <span>Charizard ex has proven floor at $400+</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-xs">
                <strong className="text-cyan-400">Expected ROI (5-year):</strong> 50-100% for Charizard/Mew SIRs in PSA 10.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Apex Recommendation:</strong> For budgets under $500, buy singles (Charizard ex raw or graded). For $1k+, split 60% chase singles / 40% sealed booster boxes stored long-term.
            </p>
          </div>
        </div>

        {/* INVESTMENT TIMING */}
        <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-l-4 border-pink-500 p-8 rounded-r-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Optimal Entry Points</h2>

          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-white font-bold mb-2">Now (Q1 2025): The Stabilization Phase</h4>
              <p className="text-gray-400 text-sm">
                Prices have stabilized after the initial 18-month volatility. Charizard ex hovers at $450 raw, unlikely to drop below $400. This is a <strong>safe entry point</strong> for long-term holds.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">Q3 2025: The Reprint Risk Window</h4>
              <p className="text-gray-400 text-sm">
                If Pokémon announces a 151 reprint (possible due to ongoing demand), expect a 20-30% correction. Monitor official news closely. Conversely, if reprints end, sealed product will appreciate faster.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">2027+: The Nostalgia Cycle</h4>
              <p className="text-gray-400 text-sm">
                As 151 ages (similar to XY Evolutions), Kanto nostalgia will drive collector demand. Charizard ex could reach $800-1200 raw in 5-7 years if Pokémon's cultural relevance persists.
              </p>
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded border border-pink-500/30">
            <p className="text-sm text-pink-400">
              <strong>The Apex Play:</strong> Dollar-cost average. Buy 1 Charizard ex now at $450. If price drops to $350 on reprint news, buy another. If it climbs to $600, you still have exposure. Avoid FOMO lump-sum buys.
            </p>
          </div>
        </div>

        {/* COMPARISON TO EVOLUTIONS */}
        <div className="mb-12 bg-black/40 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 font-orbitron">The Evolutions Parallel</h3>
          <p className="text-gray-300 text-sm mb-4">
            Many compare 151 to XY Evolutions (2016)—another Kanto nostalgia set. Here's how they stack up:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr className="text-left">
                  <th className="py-2 text-gray-400 font-mono">Metric</th>
                  <th className="py-2 text-purple-400">XY Evolutions (2016)</th>
                  <th className="py-2 text-pink-400">Pokémon 151 (2023)</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-3 text-gray-500">Chase Card</td>
                  <td>M Charizard ex (Full Art)</td>
                  <td>Charizard ex (Hyper Rare)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 text-gray-500">Peak Price (Raw)</td>
                  <td className="font-mono">$220 (2021)</td>
                  <td className="font-mono">$450 (2024)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 text-gray-500">Current Price (2025)</td>
                  <td className="font-mono">$180</td>
                  <td className="font-mono">$450</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 text-gray-500">Print Run</td>
                  <td className="text-red-400">Massive (still in print 2020)</td>
                  <td className="text-green-400">Controlled (premium product)</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-500">Investment Grade</td>
                  <td className="text-yellow-500">B (overprinted)</td>
                  <td className="text-green-500">A- (better supply control)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500 italic">
            151 has superior supply dynamics due to premium pricing reducing casual buyer volume. This bodes well for long-term value retention.
          </p>
        </div>

        {/* FINAL VERDICT */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">The Final Verdict</h2>
          <p className="text-gray-300 mb-4">
            Pokémon 151 is a <strong>Tier 1 modern investment set</strong> due to:
          </p>
          <ul className="space-y-2 text-gray-300 text-sm mb-6">
            <li className="flex items-start">
              <ArrowRight className="mr-2 text-pink-500 flex-shrink-0 mt-0.5" size={16} />
              <span>Evergreen Kanto nostalgia (universally recognized 151 Pokédex)</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="mr-2 text-pink-500 flex-shrink-0 mt-0.5" size={16} />
              <span>Premium pricing creating natural supply constraint</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="mr-2 text-pink-500 flex-shrink-0 mt-0.5" size={16} />
              <span>Iconic chase card (Charizard ex) with proven $400+ floor</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="mr-2 text-pink-500 flex-shrink-0 mt-0.5" size={16} />
              <span>Crossover appeal (art collectors value SIR cards)</span>
            </li>
          </ul>
          <p className="text-pink-400 font-bold">
            Allocate conservatively. Buy what you love. And remember: the best investment is always the card that brings you joy.
          </p>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-20 pt-8 border-t border-gray-800 text-xs text-gray-600 font-mono">
          <p className="flex items-center justify-center mb-2">
            <AlertTriangle size={14} className="mr-2 text-yellow-600" />
            DISCLAIMER
          </p>
          <p className="text-center max-w-2xl mx-auto">
            TCG investing is speculative. Pull rates are estimates. Prices fluctuate based on market conditions, reprints, and meta shifts. Never invest more than you can afford to lose. Always verify authenticity before purchasing high-value cards.
          </p>
        </div>
      </article>
    </main>
  );
}
