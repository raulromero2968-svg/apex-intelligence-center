import { Suspense } from 'react';
import { SentimentGauge, MarketMoversWidget, MarketReportCard, FeaturedReportCard } from './_components';
import { getSentimentLabel } from '@apex/db';

// =============================================================================
// MARKET DASHBOARD - AI-Powered Intelligence Hub
// =============================================================================
// Server Component that displays:
// - Real-time Fear & Greed sentiment gauge
// - Top market movers with manipulation warnings
// - AI-generated market reports (Perplexity-style)
// =============================================================================

// Mock data - will be replaced by tRPC calls when client components are ready
const MOCK_SENTIMENT = {
  pokemon: {
    score: 72,
    previousScore: 65,
    narrative: 'The Pokemon market is in Greed territory as holiday buying accelerates. Caution warranted for new positions.',
  },
  mtg: {
    score: 48,
    previousScore: 52,
    narrative: 'MTG sits in Neutral territory. The market is digesting 2024\'s aggressive release schedule.',
  },
  lorcana: {
    score: 31,
    previousScore: 45,
    narrative: 'Fear dominates Lorcana. Oversupply and competitive play concerns are weighing heavily on prices.',
  },
};

const MOCK_MOVERS = [
  { cardName: 'Charizard', setName: 'Base Set', currentPrice: 4830, changePercentage: 15.2, sentiment: 'bullish' as const, isManipulated: false },
  { cardName: 'Mewtwo ex SAR', setName: '151', currentPrice: 203, changePercentage: 12.8, sentiment: 'bullish' as const, isManipulated: false },
  { cardName: 'Umbreon VMAX Alt', setName: 'Evolving Skies', currentPrice: 298, changePercentage: 8.4, sentiment: 'neutral' as const, isManipulated: true },
  { cardName: 'Jeweled Lotus', setName: 'Commander Legends', currentPrice: 89, changePercentage: -6.2, sentiment: 'bearish' as const, isManipulated: false },
  { cardName: 'Pikachu Illustrator', setName: 'Promo', currentPrice: 420000, changePercentage: 2.1, sentiment: 'bullish' as const, isManipulated: false },
];

const MOCK_REPORTS = [
  {
    id: 'report-001',
    title: 'Pokemon TCG December 2024: Surging Into The Holidays',
    slug: 'pokemon-december-2024-surge',
    reportType: 'weekly_deep_dive' as const,
    summary: 'Holiday demand drives Charizard prices up 15% while sealed product sees record pre-orders. Our AI analysis reveals the three cards most likely to spike before January.',
    keyTakeaways: [
      'Charizard PSA 9+ remains the safest large-cap hold',
      'Prismatic Evolutions pre-orders signal strong Q1 demand',
      'VARC flagged Umbreon VMAX for potential manipulation',
    ],
    publishedAt: new Date('2024-12-01T12:00:00Z'),
    viewCount: 1247,
  },
  {
    id: 'report-002',
    title: 'Flash Alert: Mewtwo ex 151 Breaks $200',
    slug: 'mewtwo-ex-151-breakout',
    reportType: 'flash_alert' as const,
    summary: 'Mewtwo ex SAR from 151 crosses the $200 threshold for the first time. Our model predicted this move 3 weeks ago.',
    keyTakeaways: [
      'Mewtwo ex SAR broke $200 resistance',
      'Japanese reprint cancellation is the catalyst',
      'Next target: $250 if momentum holds',
    ],
    publishedAt: new Date('2024-11-29T15:47:00Z'),
    viewCount: 3892,
  },
  {
    id: 'report-003',
    title: 'MTG: Commander Masters Bulk Is Treasure',
    slug: 'mtg-commander-masters-bulk-value',
    reportType: 'daily_snapshot' as const,
    summary: 'While chase cards from Commander Masters have fallen 40%, certain uncommons are quietly appreciating. Our analysis reveals the hidden gems.',
    keyTakeaways: [
      'Commander Masters chase cards down 40%',
      'Free spell cycle uncommons quietly appreciating',
      'Sealed boxes below $280 are EV positive',
    ],
    publishedAt: new Date('2024-12-01T08:00:00Z'),
    viewCount: 642,
  },
];

export const metadata = {
  title: 'Market Intelligence | Apex',
  description: 'AI-powered TCG market analysis with real-time sentiment tracking, price alerts, and predictive analytics.',
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-white/5 rounded-2xl mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MarketDashboardPage() {
  const selectedGame = 'pokemon';
  const sentiment = MOCK_SENTIMENT[selectedGame];
  const featuredReport = MOCK_REPORTS[0];
  const otherReports = MOCK_REPORTS.slice(1);

  return (
    <main className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-full border border-cyan-400/40 text-xs tracking-wide text-cyan-300/80">
              Pro Feature
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-xs text-green-400">
              Live
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Market Intelligence
            </span>
          </h1>
          <p className="mt-3 text-lg text-white/60 max-w-2xl">
            AI-powered insights, real-time sentiment tracking, and predictive analytics for serious TCG investors.
          </p>
        </header>

        {/* Game Selector Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['pokemon', 'mtg', 'lorcana'] as const).map((game) => (
            <button
              key={game}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                game === selectedGame
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {game === 'mtg' ? 'Magic: The Gathering' : game.charAt(0).toUpperCase() + game.slice(1)}
            </button>
          ))}
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          {/* Main Dashboard Grid */}
          <div className="grid gap-6 lg:grid-cols-3 mb-12">
            {/* Left Column: Sentiment + Movers */}
            <div className="space-y-6">
              <SentimentGauge
                score={sentiment.score}
                label={getSentimentLabel(sentiment.score)}
                change={sentiment.score - sentiment.previousScore}
                narrative={sentiment.narrative}
                game={selectedGame}
              />
              <MarketMoversWidget movers={MOCK_MOVERS} title="Top Movers (24h)" />
            </div>

            {/* Right Column: Featured Report + Others */}
            <div className="lg:col-span-2 space-y-6">
              {/* Featured Report */}
              <FeaturedReportCard
                {...featuredReport}
              />

              {/* Report Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {otherReports.map((report) => (
                  <MarketReportCard key={report.id} {...report} />
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Sentiment Cards */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Cross-Market Sentiment</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.entries(MOCK_SENTIMENT) as [keyof typeof MOCK_SENTIMENT, typeof MOCK_SENTIMENT.pokemon][]).map(
                ([game, data]) => (
                  <div
                    key={game}
                    className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white capitalize">
                        {game === 'mtg' ? 'MTG' : game}
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          data.score <= 40
                            ? 'text-red-400'
                            : data.score <= 60
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {data.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">{getSentimentLabel(data.score).replace('_', ' ')}</span>
                      <span
                        className={`${
                          data.score - data.previousScore > 0
                            ? 'text-green-400'
                            : data.score - data.previousScore < 0
                            ? 'text-red-400'
                            : 'text-white/50'
                        }`}
                      >
                        {data.score - data.previousScore > 0 ? '+' : ''}
                        {data.score - data.previousScore}
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.score <= 40
                            ? 'bg-red-500'
                            : data.score <= 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Unlock Predictive Analytics</h2>
            <p className="text-white/60 mb-6 max-w-xl mx-auto">
              Get AI-generated price predictions, manipulation alerts, and personalized portfolio insights with Apex Pro.
            </p>
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Upgrade to Pro
            </button>
          </section>
        </Suspense>
      </div>
    </main>
  );
}
