import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { Globe, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';

// META:
// Title: Japanese Arbitrage Playbook: The Buyee-to-TCGPlayer Loop
// Description: Step-by-step guide to profiting from US-Japan price spreads with detailed sourcing and logistics strategies.

export default function JapaneseArbitrageGuide() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-purple-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-green-500 mb-4 font-mono text-sm tracking-wider">
            <Globe size={16} />
            <span>ARBITRAGE STRATEGY</span>
            <span>//</span>
            <span>CROSS-BORDER</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-green">
            Japanese Arbitrage Playbook
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>METHOD: BUYEE-TO-TCGPLAYER LOOP</span>
          </div>
        </header>

        {/* EXECUTIVE SUMMARY */}
        <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border border-green-900/50 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="text-green-400" size={20} />
            The Opportunity
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Japanese Pokemon cards often trade at <strong className="text-white">10-20% below</strong> equivalent US prices on Yahoo! Japan Auctions and Mercari JP. Combined with superior print quality and higher PSA 10 rates, this creates a systematic arbitrage opportunity.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Avg Spread</div>
              <div className="text-xl font-bold text-green-400">12-18%</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Shipping Time</div>
              <div className="text-xl font-bold text-cyan-400">14-21d</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Target ROI</div>
              <div className="text-xl font-bold text-purple-400">25-40%</div>
            </div>
          </div>
        </div>

        {/* THE STEP-BY-STEP PROCESS */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">The 6-Step Arbitrage Loop</h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-gray-900/50 border-l-4 border-cyan-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Identify Price Spreads</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Use TCGPlayer to identify high-value English cards ($100+), then search for Japanese equivalents on Buyee (Yahoo! Japan Auctions + Mercari).
                  </p>
                  <div className="bg-black/30 rounded p-3 text-xs font-mono">
                    <div className="text-gray-400 mb-1">Example Search:</div>
                    <div className="text-white">ポケモンカード リーフィアVMAX SA (Leafeon VMAX Alt Art)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-900/50 border-l-4 border-purple-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-black font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Calculate True Cost</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Factor in Buyee fees (5-10%), shipping ($15-30), import duties (usually $0 for cards), and currency conversion.
                  </p>
                  <div className="bg-black/30 rounded p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Auction Price (¥15,000):</span>
                      <span className="text-white">$100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyee Commission (7%):</span>
                      <span className="text-white">$7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Int'l Shipping (EMS):</span>
                      <span className="text-white">$22</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                      <span className="text-gray-400 font-bold">Total Landed Cost:</span>
                      <span className="text-cyan-400 font-bold">$129</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-900/50 border-l-4 border-yellow-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Bid Strategically</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Yahoo! Japan Auctions end at specific times (often late night JST). Set max bids 10-15% below TCGPlayer to account for fees.
                  </p>
                  <div className="bg-black/30 rounded p-3 text-xs text-gray-300">
                    <strong className="text-white">Pro Tip:</strong> Use Buyee's auto-bid feature with a ceiling 12% below US market price. Most auctions have low competition at non-peak hours.
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-900/50 border-l-4 border-green-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Optimize Shipping</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Consolidate multiple purchases in Buyee warehouse to save shipping. Wait 7-10 days to batch orders.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-950/30 border border-red-900/50 rounded p-2">
                      <div className="text-red-400 mb-1">Bad: Ship Individual</div>
                      <div className="text-white">5 cards × $22 = <strong>$110</strong></div>
                    </div>
                    <div className="bg-green-950/30 border border-green-900/50 rounded p-2">
                      <div className="text-green-400 mb-1">Good: Consolidate</div>
                      <div className="text-white">5 cards × $8 = <strong>$40</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-gray-900/50 border-l-4 border-orange-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">5</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Grade (Optional but Recommended)</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Japanese cards have 8-12% higher PSA 10 rates. For cards worth $150+ raw, grading amplifies arbitrage profits.
                  </p>
                  <div className="bg-black/30 rounded p-3 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Landed Cost:</span>
                      <span className="text-white">$129</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PSA Fee + Ship:</span>
                      <span className="text-white">$60</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-1">
                      <span className="text-gray-400">PSA 10 Sale (US market):</span>
                      <span className="text-green-400 font-bold">$400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gross Profit:</span>
                      <span className="text-green-400 font-bold">+$211 (+112%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-gray-900/50 border-l-4 border-pink-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-black font-bold flex-shrink-0">6</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">List on US Marketplaces</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Sell on TCGPlayer, eBay, or Facebook groups. Japanese cards often command slight premiums due to perceived quality.
                  </p>
                  <div className="bg-black/30 rounded p-3 text-xs text-gray-300">
                    <strong className="text-white">Key Point:</strong> List as "Japanese" in title. Some collectors specifically seek Japanese printings and will pay 5-10% over English equivalents.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROFIT CALCULATOR */}
        <div className="my-12 bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center">
            <DollarSign className="mr-2 text-green-500" size={20} />
            Real Example: Umbreon VMAX Alt Art
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-3">Japanese Acquisition</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Yahoo Japan Auction Win:</span>
                  <span className="text-white">¥58,000 ($387)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buyee Fees:</span>
                  <span className="text-white">$27</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping (consolidated):</span>
                  <span className="text-white">$12</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-400 font-bold">Total Cost:</span>
                  <span className="text-white font-bold">$426</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-3">US Sale</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">TCGPlayer Sale Price:</span>
                  <span className="text-white">$550</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TCGPlayer Fees (13%):</span>
                  <span className="text-white">-$71.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping to Buyer:</span>
                  <span className="text-white">-$5</span>
                </div>
                <div className="flex justify-between border-t border-green-700 pt-2">
                  <span className="text-gray-400 font-bold">Net Profit:</span>
                  <span className="text-green-400 font-bold">+$47.50 (+11.1%)</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 text-center font-mono">
            11% return in 21 days = 191% annualized (if capital redeployed monthly)
          </p>
        </div>

        {/* TOP TARGETS */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6">High-Probability Targets</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <h4 className="font-bold text-cyan-400 mb-3 text-sm">Alt Arts (Evolving Skies Era)</h4>
              <ul className="text-xs text-gray-300 space-y-2">
                <li className="flex justify-between">
                  <span>Umbreon VMAX SA</span>
                  <span className="text-green-400">15-20% spread</span>
                </li>
                <li className="flex justify-between">
                  <span>Leafeon VMAX SA</span>
                  <span className="text-green-400">12-18% spread</span>
                </li>
                <li className="flex justify-between">
                  <span>Rayquaza VMAX SA</span>
                  <span className="text-green-400">10-15% spread</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <h4 className="font-bold text-purple-400 mb-3 text-sm">Character Rares (151 / SV Era)</h4>
              <ul className="text-xs text-gray-300 space-y-2">
                <li className="flex justify-between">
                  <span>Charizard ex SAR</span>
                  <span className="text-green-400">18-25% spread</span>
                </li>
                <li className="flex justify-between">
                  <span>Iono SAR</span>
                  <span className="text-green-400">12-16% spread</span>
                </li>
                <li className="flex justify-between">
                  <span>Rika SAR</span>
                  <span className="text-green-400">10-14% spread</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RISKS & MITIGATION */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={20} />
            Risks & Mitigation
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Currency Fluctuation:</strong>
                <span className="text-gray-300"> Yen strengthening reduces spread. Hedge by setting max bids in USD equivalent.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Shipping Damage:</strong>
                <span className="text-gray-300"> Always request Buyee "premium packing" (+$3). Cost is negligible vs. risk of bent corners.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Market Timing:</strong>
                <span className="text-gray-300"> Spreads compress during US set releases. Avoid importing 2 weeks before/after major English drops.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Liquidity:</strong>
                <span className="text-gray-300"> High-value cards ($500+) sell slower. Stick to $100-300 range for fast turnover.</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
          <span className="text-gray-500 text-sm font-mono">PREV: JAPANESE SETS ANALYSIS</span>
          <span className="text-gray-500 text-sm font-mono">NEXT: INTEL HUB</span>
        </div>
      </article>
    </main>
  );
}
