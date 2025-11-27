import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { Clock, Calendar, TrendingUp, TrendingDown, ArrowLeft, Home } from 'lucide-react';
import { ArticleStructuredData } from '@/components/seo/ArticleStructuredData';

export const metadata: Metadata = {
  title: 'TCG Market Timing Guide: When to Buy & Sell',
  description: 'Master the art of market timing in TCG investing. Learn seasonal patterns, release cycles, and optimal entry/exit points.',
  keywords: ['TCG', 'Market Timing', 'Trading Cards', 'Investment Strategy', 'Buy Sell Signals', 'Pokemon', 'MTG'],
  openGraph: {
    title: 'TCG Market Timing Guide: When to Buy & Sell',
    description: 'Master the art of market timing in TCG investing with data-driven strategies.',
    type: 'article',
    publishedTime: '2025-02-01T00:00:00.000Z',
    authors: ['Apex Intelligence Research Team'],
  },
};

export default function MarketTimingArticle() {
  return (
    <>
      <ArticleStructuredData
        title="TCG Market Timing Guide: When to Buy & Sell"
        description="Master the art of market timing in TCG investing. Learn seasonal patterns, release cycles, and optimal entry/exit points."
        datePublished="2025-02-01T00:00:00.000Z"
        author="Apex Intelligence Research Team"
        url="https://apex-intelligence.io/intel/tcg-market-timing-guide"
      />
      <main className="min-h-screen bg-[#030712] text-gray-300 font-sans">
        <StarfieldBackground />
        <Navigation />

        <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center">
              <Home size={14} className="mr-1" />
              Home
            </Link>
            <span>/</span>
            <Link href="/intel" className="hover:text-cyan-400 transition-colors">
              Intelligence
            </Link>
            <span>/</span>
            <span className="text-cyan-400">TCG Market Timing Guide</span>
          </nav>

          <Link
            href="/intel"
            className="inline-flex items-center text-cyan-500 hover:text-cyan-300 mb-8 transition-colors font-mono text-sm"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Archive
          </Link>

          {/* Header */}
          <header className="mb-12 border-b border-gray-800 pb-8">
            <div className="flex items-center space-x-2 text-purple-500 mb-4 font-mono text-sm tracking-wider">
              <Clock size={16} />
              <span>TACTICAL GUIDE</span>
              <span>//</span>
              <span>MARKET TIMING</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-purple">
              TCG Market Timing Guide: When to Buy & Sell
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
              <span>PUBLISHED: FEBRUARY 1, 2025</span>
              <span>READ TIME: 11 MIN</span>
            </div>
          </header>

          {/* Executive Summary */}
          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <p className="lead text-xl text-gray-200">
              Timing is everything in TCG investing. Buy too early and you're stuck holding depreciating assets. Buy too late and you've missed the run. This tactical guide breaks down the seasonal patterns, release cycles, and psychological triggers that create optimal entry and exit points.
            </p>
          </div>

          {/* Seasonal Patterns */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 font-orbitron flex items-center">
              <Calendar className="mr-3 text-purple-500" size={28} />
              The TCG Calendar: Seasonal Patterns
            </h2>

            <div className="space-y-6">
              {/* Q1 */}
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white font-orbitron">Q1 (Jan-Mar): The Hangover</h3>
                  <span className="px-3 py-1 bg-red-900/30 border border-red-600/50 rounded text-red-400 text-xs font-mono">WEAK DEMAND</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Post-holiday correction. Collectors are broke from December spending. Prices soften 15-25% from December peaks.
                </p>
                <div className="flex items-start gap-2">
                  <TrendingDown className="text-green-400 mt-1" size={16} />
                  <p className="text-sm text-green-400 font-mono">
                    <strong>BUYER STRATEGY:</strong> Target modern singles. Sealed product still elevated from holiday demand.
                  </p>
                </div>
              </div>

              {/* Q2 */}
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white font-orbitron">Q2 (Apr-Jun): The Build-Up</h3>
                  <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-400 text-xs font-mono">MODERATE ACTIVITY</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Tax returns hit accounts. Spring sets release. Market stabilizes with selective strength in competitive staples.
                </p>
                <div className="flex items-start gap-2">
                  <TrendingUp className="text-yellow-400 mt-1" size={16} />
                  <p className="text-sm text-yellow-400 font-mono">
                    <strong>MIXED STRATEGY:</strong> Rotate out of Q4 purchases. Buy summer set pre-orders at discount.
                  </p>
                </div>
              </div>

              {/* Q3 */}
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white font-orbitron">Q3 (Jul-Sep): The Grind</h3>
                  <span className="px-3 py-1 bg-blue-900/30 border border-blue-600/50 rounded text-blue-400 text-xs font-mono">SIDEWAYS MARKET</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Summer lull. Lowest volume of the year. Prices consolidate. Back-to-school spending competes for wallet share.
                </p>
                <div className="flex items-start gap-2">
                  <Clock className="text-blue-400 mt-1" size={16} />
                  <p className="text-sm text-blue-400 font-mono">
                    <strong>PATIENCE STRATEGY:</strong> Accumulate undervalued vintage. Avoid chasing modern hype.
                  </p>
                </div>
              </div>

              {/* Q4 */}
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white font-orbitron">Q4 (Oct-Dec): The Frenzy</h3>
                  <span className="px-3 py-1 bg-green-900/30 border border-green-600/50 rounded text-green-400 text-xs font-mono">PEAK DEMAND</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Holiday set releases. Maximum FOMO. Sealed product premiums spike 30-50%. Singles hit yearly highs.
                </p>
                <div className="flex items-start gap-2">
                  <TrendingUp className="text-red-400 mt-1" size={16} />
                  <p className="text-sm text-red-400 font-mono">
                    <strong>SELLER STRATEGY:</strong> Liquidate Q1-Q3 accumulation. Lock in profits before January crash.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Release Cycle Strategy */}
          <div className="bg-purple-900/10 border border-purple-600/30 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">The 90-Day Release Cycle</h2>
            <div className="space-y-4 text-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
                  <h4 className="font-bold text-purple-400 mb-2 font-mono">DAYS 1-30: Launch</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Maximum hype. Prices 2-3x stable value. Singles crash 40-60% within 2 weeks as boxes open.
                  </p>
                  <p className="text-green-400 text-xs mt-2 font-mono">
                    → BUY: Singles only. Avoid sealed.
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
                  <h4 className="font-bold text-purple-400 mb-2 font-mono">DAYS 31-60: Correction</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Market finds equilibrium. Chase cards stabilize. Sealed product bottoms out at MSRP or below.
                  </p>
                  <p className="text-green-400 text-xs mt-2 font-mono">
                    → BUY: Sealed boxes. Wait on singles.
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
                  <h4 className="font-bold text-purple-400 mb-2 font-mono">DAYS 61-90: Recovery</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Print run ends. Supply dries up. Sealed starts climbing. Singles find floor.
                  </p>
                  <p className="text-yellow-400 text-xs mt-2 font-mono">
                    → HOLD: Let next cycle create exit liquidity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">Pro Timing Signals</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-4 bg-gray-900/30 rounded border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-white mb-1">Grading Service Backlog Increases</h4>
                  <p className="text-gray-400">
                    When PSA turnaround times spike above 60 days, raw card prices often dip 10-15%. Smart buyers accumulate.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-900/30 rounded border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-white mb-1">eBay Sold Listings Volume Doubles</h4>
                  <p className="text-gray-400">
                    Rapid volume increases = weak hands selling. Often marks local bottoms for patient buyers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-900/30 rounded border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-white mb-1">Pre-Order Prices Below MSRP</h4>
                  <p className="text-gray-400">
                    When sealed boxes pre-sell under retail, expect 3-6 month recovery period. Accumulate slowly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">The Golden Rule</h2>
            <p className="text-gray-300 leading-relaxed">
              Markets are cyclical, but they're not mechanical. These patterns hold 70-80% of the time—but black swan events (Netflix adaptations, viral TikToks, supply shocks) can override seasonal trends overnight.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Use this framework as your baseline strategy, but stay flexible. The best market timers blend historical patterns with real-time sentiment analysis. And remember: <strong>time in the market beats timing the market</strong>—but only if you're buying quality.
            </p>
          </div>

        </article>
      </main>
    </>
  );
}
