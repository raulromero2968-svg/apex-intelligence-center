import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { ArrowRight, TrendingUp, AlertTriangle, Shield, Gem } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: Vintage WOTC Cards: The Blue-Chip Investment Thesis
// Description: Deep analysis of 1999-2003 Wizards of the Coast era cards, print run scarcity, PSA population dynamics, and why Base Set Charizard remains the S&P 500 of TCG investing.

export default function VintageWOTCArticle() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-cyan-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-amber-500 mb-4 font-mono text-sm tracking-wider">
            <Gem size={16} />
            <span>VINTAGE INVESTMENT</span>
            <span>//</span>
            <span>WOTC ERA 1999-2003</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-white">
            Vintage WOTC Cards: The Blue-Chip Investment Thesis
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>READ TIME: 10 MIN</span>
          </div>
        </header>

        {/* INTRODUCTION */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          <p className="lead text-xl text-gray-200">
            In 1999, Wizards of the Coast printed the first English Pokémon cards in a Renton, Washington facility. Twenty-six years later, a PSA 10 Base Set 1st Edition Charizard sells for $420,000. This isn't speculation—it's asset appreciation backed by fundamental scarcity.
          </p>
          <p>
            The WOTC era (1999-2003) represents the <strong>foundation layer</strong> of TCG investing. Unlike modern sets with print runs in the tens of millions, vintage WOTC cards were produced in limited quantities, distributed regionally, and stored by children who treated them as toys. The result: structural supply constraints that only tighten with time.
          </p>
        </div>

        {/* KEY DATA VISUALIZATION */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <TrendingUp className="mr-2 text-amber-500" size={20} />
            WOTC Holo Value Appreciation (2015-2025)
          </h3>
          <div className="h-64 w-full bg-black/40 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
            <IntelChart type="line" data={{
              labels: ['2015', '2017', '2019', '2021', '2023', '2025'],
              datasets: [
                { label: 'Base Set Charizard (PSA 9)', data: [1200, 1800, 3500, 18000, 12000, 15000], color: '#f59e0b' },
                { label: 'Neo Genesis Lugia (PSA 9)', data: [400, 550, 900, 4200, 2800, 3500], color: '#a855f7' },
                { label: 'Skyridge Charizard (PSA 9)', data: [800, 1100, 2200, 8500, 6200, 7800], color: '#22d3ee' }
              ]
            }} />
          </div>
          <p className="mt-4 text-xs text-gray-500 font-mono text-center">
            DATA SOURCE: PSA AUCTIONPRICES.COM // INFLATION-ADJUSTED USD
          </p>
        </div>

        {/* THE BLUE-CHIP HIERARCHY */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-orbitron">The Blue-Chip Hierarchy</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-900/30 to-transparent border-l-4 border-amber-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Shield className="mr-3 text-amber-500" size={20} />
                Tier 1: The Foundation (Base Set, Jungle, Fossil)
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                These are the <strong>"Bitcoin of Pokémon"</strong>—universally recognized, culturally significant, and globally liquid. Base Set Charizard is the undisputed king, but Blastoise, Venusaur, and Alakazam form the core portfolio.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-amber-400 font-bold mb-1">Base Set Charizard</div>
                  <div className="text-gray-500">1st Ed PSA 10: $400k+</div>
                  <div className="text-gray-500">Unlimited PSA 10: $35k</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-amber-400 font-bold mb-1">Jungle Wigglytuff</div>
                  <div className="text-gray-500">1st Ed PSA 10: $8k</div>
                  <div className="text-gray-500">Undervalued staple</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-amber-400 font-bold mb-1">Fossil Dragonite</div>
                  <div className="text-gray-500">1st Ed PSA 10: $6k</div>
                  <div className="text-gray-500">Pop 200 (scarce)</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Shield className="mr-3 text-purple-500" size={20} />
                Tier 2: The Neo Era (Neo Genesis, Neo Discovery, Neo Destiny)
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Smaller print runs, regional distribution issues, and advanced artwork make Neo cards the <strong>"growth stocks"</strong> of WOTC. Lugia, Ho-Oh, and Shining cards are apex targets.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-purple-400 font-bold mb-1">Lugia (Neo Genesis)</div>
                  <div className="text-gray-500">1st Ed PSA 10: $25k</div>
                  <div className="text-gray-500">Pop 120 (extremely scarce)</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-purple-400 font-bold mb-1">Shining Charizard</div>
                  <div className="text-gray-500">1st Ed PSA 10: $45k</div>
                  <div className="text-gray-500">Crossover appeal</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-purple-400 font-bold mb-1">Neo Destiny Shinings</div>
                  <div className="text-gray-500">Avg PSA 10: $8-15k</div>
                  <div className="text-gray-500">Set completion demand</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-900/30 to-transparent border-l-4 border-cyan-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Shield className="mr-3 text-cyan-500" size={20} />
                Tier 3: The Final Chapter (Expedition, Aquapolis, Skyridge)
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                The e-Reader era represents WOTC's swan song. Ultra-low print runs (Skyridge is the rarest English set ever printed) and advanced holographic patterns make these <strong>"venture capital bets"</strong> with asymmetric upside.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-cyan-400 font-bold mb-1">Skyridge Charizard</div>
                  <div className="text-gray-500">Holo PSA 10: $75k+</div>
                  <div className="text-gray-500">Pop under 50</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-cyan-400 font-bold mb-1">Aquapolis Lugia</div>
                  <div className="text-gray-500">Crystal PSA 10: $28k</div>
                  <div className="text-gray-500">Crystal-type premium</div>
                </div>
                <div className="bg-black/40 p-3 rounded">
                  <div className="text-cyan-400 font-bold mb-1">Skyridge H-Holos</div>
                  <div className="text-gray-500">Avg PSA 10: $3-8k</div>
                  <div className="text-gray-500">Sleeper growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* THE SCARCITY THESIS */}
        <div className="my-12 bg-gray-900/30 p-8 rounded-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">The Scarcity Thesis: Why WOTC Holds Value</h2>

          <div className="space-y-6">
            <div>
              <h4 className="text-white font-bold mb-2 flex items-center">
                <ArrowRight className="mr-2 text-amber-500" size={16} />
                1. Fixed Supply (No Reprints)
              </h4>
              <p className="text-gray-400 text-sm pl-6">
                WOTC lost the Pokémon license in 2003. Nintendo/The Pokémon Company will <strong>never reprint</strong> WOTC-era cards with the original yellow border and WOTC logo. Supply is permanently capped.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2 flex items-center">
                <ArrowRight className="mr-2 text-amber-500" size={16} />
                2. PSA Population Dynamics
              </h4>
              <p className="text-gray-400 text-sm pl-6">
                Of ~2.4 million Base Set Charizards printed, only <strong>4,915 are PSA 10</strong> (0.2% gem rate). As raw copies dry up, PSA 10s become exponentially scarcer. Recent crackdowns on regrade farming further constrain supply.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2 flex items-center">
                <ArrowRight className="mr-2 text-amber-500" size={16} />
                3. Generational Wealth Transfer
              </h4>
              <p className="text-gray-400 text-sm pl-6">
                Millennials who grew up with Base Set are now in peak earning years (ages 30-45). This demographic controls $28 trillion in wealth and views WOTC cards as <strong>nostalgic assets</strong> worth preserving.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2 flex items-center">
                <ArrowRight className="mr-2 text-amber-500" size={16} />
                4. Institutional Validation
              </h4>
              <p className="text-gray-400 text-sm pl-6">
                Rally Rd, Otis, and Collectable allow fractional ownership of blue-chip cards. Goldin Auctions routinely sells $100k+ WOTC cards. This is no longer a "hobby"—it's an <strong>alternative asset class</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* RISK ANALYSIS */}
        <div className="my-12 bg-red-900/10 border border-red-500/30 p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6 font-orbitron flex items-center">
            <AlertTriangle className="mr-3 text-red-500" size={24} />
            Risk Factors: What Could Go Wrong
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-start">
              <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">!</div>
              <div>
                <strong className="text-white">Counterfeits:</strong> <span className="text-gray-400">Chinese fakes are improving. Always buy PSA/BGS slabbed cards from reputable dealers. Raw WOTC purchases are high-risk without expert authentication.</span>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">!</div>
              <div>
                <strong className="text-white">Illiquidity:</strong> <span className="text-gray-400">A $50k Charizard is not a liquid asset. Selling requires finding qualified buyers, which can take months. Budget 10-20% in transaction fees (auction house, eBay, PayPal).</span>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">!</div>
              <div>
                <strong className="text-white">Market Cycles:</strong> <span className="text-gray-400">WOTC cards peaked in 2021 (stimulus money, Logan Paul hype) and corrected 30-50% by 2023. Long-term trend is up, but volatility is real.</span>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">!</div>
              <div>
                <strong className="text-white">Grading Compression:</strong> <span className="text-gray-400">PSA has tightened standards. Cards that would've graded PSA 10 in 2020 now get PSA 9s. This increases scarcity but creates regrade frustration.</span>
              </div>
            </div>
          </div>
        </div>

        {/* THE APEX PORTFOLIO */}
        <div className="bg-gradient-to-r from-amber-900/20 to-purple-900/20 border-l-4 border-amber-500 p-8 rounded-r-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">The Apex WOTC Portfolio</h2>
          <p className="text-gray-300 mb-6 text-sm">
            If you're allocating $10k-50k to vintage WOTC, here's our model portfolio (2025):
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <div>
                <div className="text-white font-bold">40% - Base Set Trio (PSA 9)</div>
                <div className="text-gray-500 text-xs">Charizard, Blastoise, Venusaur Unlimited</div>
              </div>
              <div className="text-amber-400 font-mono">$12k-16k</div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <div>
                <div className="text-white font-bold">30% - Neo Chase Cards (PSA 9)</div>
                <div className="text-gray-500 text-xs">Lugia, Ho-Oh, or 1 Shining</div>
              </div>
              <div className="text-purple-400 font-mono">$3k-5k</div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <div>
                <div className="text-white font-bold">20% - e-Series Wildcards (PSA 9)</div>
                <div className="text-gray-500 text-xs">Skyridge holos, Aquapolis crystals</div>
              </div>
              <div className="text-cyan-400 font-mono">$5k-8k</div>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <div className="text-white font-bold">10% - Cash Reserve</div>
                <div className="text-gray-500 text-xs">Dry powder for market corrections</div>
              </div>
              <div className="text-green-400 font-mono">$2k-5k</div>
            </div>
          </div>

          <p className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 italic">
            Note: Prices fluctuate. Always cross-reference eBay sold listings, PWCC, and Goldin auctions for current market rates.
          </p>
        </div>

        {/* FINAL VERDICT */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">The Final Verdict</h2>
          <p className="text-gray-300 mb-4">
            WOTC cards are not "get rich quick" schemes. They are <strong>25-year-old artifacts</strong> with proven cultural significance, structural scarcity, and generational demand.
          </p>
          <p className="text-gray-300">
            If you believe Pokémon will remain culturally relevant for the next 20 years (it's the highest-grossing media franchise in history), then WOTC cards represent a reasonable allocation within a diversified alternative assets portfolio.
          </p>
          <p className="text-amber-400 mt-6 font-bold">
            Buy what you can afford to hold for 10+ years. Store properly. Insure adequately. And never sell during panic.
          </p>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-20 pt-8 border-t border-gray-800 text-xs text-gray-600 font-mono">
          <p className="flex items-center justify-center mb-2">
            <AlertTriangle size={14} className="mr-2 text-yellow-600" />
            DISCLAIMER
          </p>
          <p className="text-center max-w-2xl mx-auto">
            This is not financial advice. TCG cards are speculative, illiquid, and unregulated assets. Only invest capital you can afford to lose. Always authenticate purchases through reputable grading companies.
          </p>
        </div>
      </article>
    </main>
  );
}
