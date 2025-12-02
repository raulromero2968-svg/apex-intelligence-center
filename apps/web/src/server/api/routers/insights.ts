import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { db } from '@/lib/db';
import {
  marketReports,
  sentimentSnapshots,
  marketMovers,
  getSentimentLabel,
  SENTIMENT_THRESHOLDS,
  type MarketReportCitation,
  type SentimentFactor,
} from '@apex/db';
import { eq, desc, and, gte, lte, sql, isNotNull } from 'drizzle-orm';

// =============================================================================
// INSIGHTS ROUTER - AI-Powered Market Intelligence
// =============================================================================
// Serves cached AI-generated content for Pro Subscription features:
// - Market Reports (Perplexity-style summaries with citations)
// - Sentiment Snapshots (Fear & Greed index)
// - Market Movers integration (Top Gainers/Losers ticker)
// =============================================================================

// =============================================================================
// MOCK DATA FOR DEVELOPMENT
// =============================================================================
// Until the AI ingestion pipeline is built, serve compelling mock data

const MOCK_REPORTS: Array<{
  id: string;
  title: string;
  slug: string;
  reportType: 'daily_snapshot' | 'weekly_deep_dive' | 'flash_alert';
  game: 'pokemon' | 'mtg' | 'lorcana';
  summary: string;
  content: string;
  citations: MarketReportCitation[];
  keyTakeaways: string[];
  publishedAt: Date;
  viewCount: number;
}> = [
  {
    id: 'report-001',
    title: 'Pokemon TCG December 2024: Surging Into The Holidays',
    slug: 'pokemon-december-2024-surge',
    reportType: 'weekly_deep_dive',
    game: 'pokemon',
    summary: 'Holiday demand drives Charizard prices up 15% while sealed product sees record pre-orders. Our AI analysis reveals the three cards most likely to spike before January.',
    content: `## Executive Summary

The Pokemon TCG market enters December with unprecedented momentum. Our AI analysis of 47,000 recent sales reveals a clear pattern: **vintage chase cards are decoupling from modern product performance**.

## Key Findings

### 1. Charizard Complex Continues
Base Set Charizard (PSA 9) has risen from $4,200 to $4,830 over the past 30 days—a **15% gain** that outpaces the broader market by 3x. This isn't speculative froth; it's driven by:

- Institutional collectors entering the market [^1]
- Limited PSA 10 supply (population: 3,421, up only 12 YoY)
- Cross-collateralization with sports card portfolios

### 2. Sealed Product Pre-Orders
The upcoming "Prismatic Evolutions" set has generated **$2.1M in pre-orders** across tracked retailers—the highest for any special set since Evolving Skies [^2].

### 3. Manipulation Warning
Our VARC system detected unusual activity in Umbreon VMAX (Alt Art). Volume spiked 340% without corresponding social sentiment. **Exercise caution** on this card until the pattern resolves.

## Outlook

Expect continued strength through Q1 2025, with a potential 10-15% correction in February as tax-season liquidity constraints hit retail investors.`,
    citations: [
      {
        id: 'cite-1',
        source: 'Bloomberg Alternative Assets Report',
        url: 'https://bloomberg.com/collectibles-2024',
        quote: 'Pokemon cards now represent 8% of the alternative collectibles market...',
        relevance: 0.92,
        accessedAt: '2024-12-01T10:00:00Z',
      },
      {
        id: 'cite-2',
        source: 'TCGPlayer Market Data',
        url: 'https://tcgplayer.com/market-insights',
        quote: 'Pre-order velocity for special sets has increased 47% year-over-year...',
        relevance: 0.88,
        accessedAt: '2024-12-01T09:30:00Z',
      },
    ],
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
    reportType: 'flash_alert',
    game: 'pokemon',
    summary: 'Mewtwo ex SAR from 151 crosses the $200 threshold for the first time. Our model predicted this move 3 weeks ago.',
    content: `## Breaking: Mewtwo ex SAR Hits $200

At 10:47 AM EST, Mewtwo ex (Special Art Rare) from Pokemon 151 crossed the **$200 price point** for the first time—a key psychological barrier.

### What Triggered This?

1. **Japanese reprint cancellation** announced yesterday [^1]
2. **YouTube influencer coverage** (3 videos with 500k+ combined views in 48 hours)
3. **Our AI model flagged this card** on November 10th with a 78% confidence score for a breakout

### Technical Analysis

The price chart shows a classic "cup and handle" formation with the handle completing today. Next resistance: **$250**.

### Action Items

- **Holders**: Consider trimming 20% if you're overweight
- **Buyers**: Wait for a pullback to $180-190 range
- **Traders**: Short-term momentum play with tight stops`,
    citations: [
      {
        id: 'cite-1',
        source: 'Pokemon Japan Official',
        url: 'https://pokemon-card.com/news',
        quote: 'The planned reprint of certain 151 cards has been postponed indefinitely...',
        relevance: 0.95,
        accessedAt: '2024-11-28T08:00:00Z',
      },
    ],
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
    reportType: 'daily_snapshot',
    game: 'mtg',
    summary: 'While chase cards from Commander Masters have fallen 40%, certain uncommons are quietly appreciating. Our analysis reveals the hidden gems.',
    content: `## Commander Masters: 6-Month Retrospective

Commander Masters launched to enormous hype in August 2024. Chase mythics like Jeweled Lotus (Borderless) have since fallen **40% from peak**. But the real story is in the bulk.

### The Bulk Thesis

Three uncommons from Commander Masters are now **staples in competitive Commander**:

1. **Fierce Guardianship** (Commander deck reprint) - $8 → $14
2. **Deflecting Swat** - $12 → $19
3. **Deadly Rollick** - $6 → $11

These "free spells" see play in 23% of all Commander decks according to EDHREC [^1].

### Why This Matters

When opening product, **don't bulk these cards**. The sealed-to-singles ratio now favors cracking boxes if you can acquire below $280.`,
    citations: [
      {
        id: 'cite-1',
        source: 'EDHREC',
        url: 'https://edhrec.com/top/year',
        quote: 'Free spells continue to dominate Commander staples...',
        relevance: 0.91,
        accessedAt: '2024-12-01T07:00:00Z',
      },
    ],
    keyTakeaways: [
      'Commander Masters chase cards down 40%',
      'Free spell cycle uncommons quietly appreciating',
      'Sealed boxes below $280 are EV positive',
    ],
    publishedAt: new Date('2024-12-01T08:00:00Z'),
    viewCount: 642,
  },
];

const MOCK_SENTIMENT: {
  game: 'pokemon' | 'mtg' | 'lorcana';
  score: number;
  previousScore: number;
  factors: SentimentFactor[];
  narrative: string;
}[] = [
  {
    game: 'pokemon',
    score: 72,
    previousScore: 65,
    factors: [
      { name: 'Price Momentum', weight: 0.3, value: 78, trend: 'rising', description: 'Top 50 cards up 8% this week' },
      { name: 'Social Sentiment', weight: 0.25, value: 82, trend: 'rising', description: 'Reddit/Twitter sentiment highly positive' },
      { name: 'Volume', weight: 0.25, value: 65, trend: 'stable', description: 'Trading volume at 3-month average' },
      { name: 'New Set Hype', weight: 0.2, value: 61, trend: 'rising', description: 'Prismatic Evolutions generating buzz' },
    ],
    narrative: 'The Pokemon market is in Greed territory as holiday buying accelerates. Caution warranted for new positions.',
  },
  {
    game: 'mtg',
    score: 48,
    previousScore: 52,
    factors: [
      { name: 'Price Momentum', weight: 0.3, value: 42, trend: 'falling', description: 'Commander staples cooling off' },
      { name: 'Social Sentiment', weight: 0.25, value: 55, trend: 'stable', description: 'Mixed feelings on recent sets' },
      { name: 'Volume', weight: 0.25, value: 51, trend: 'falling', description: 'Post-holiday lull beginning' },
      { name: 'Reserved List', weight: 0.2, value: 44, trend: 'stable', description: 'RL cards holding but not growing' },
    ],
    narrative: 'MTG sits in Neutral territory. The market is digesting 2024\'s aggressive release schedule.',
  },
  {
    game: 'lorcana',
    score: 31,
    previousScore: 45,
    factors: [
      { name: 'Price Momentum', weight: 0.3, value: 25, trend: 'falling', description: 'Set 4 cards dropping rapidly' },
      { name: 'Social Sentiment', weight: 0.25, value: 38, trend: 'falling', description: 'Community frustration with supply' },
      { name: 'Volume', weight: 0.25, value: 42, trend: 'falling', description: 'Sales velocity declining' },
      { name: 'Competitive Play', weight: 0.2, value: 18, trend: 'falling', description: 'Organized play attendance down 30%' },
    ],
    narrative: 'Fear dominates Lorcana. Oversupply and competitive play concerns are weighing heavily on prices.',
  },
];

const MOCK_MOVERS = [
  { rank: 1, cardId: 'poke-charizard-base', cardName: 'Charizard', setName: 'Base Set', currentPrice: 4830, changePercentage: 15.2, reason: 'Holiday buying surge + PSA 10 scarcity', sentiment: 'bullish' as const },
  { rank: 2, cardId: 'poke-mewtwo-151', cardName: 'Mewtwo ex SAR', setName: '151', currentPrice: 203, changePercentage: 12.8, reason: 'Japanese reprint cancellation', sentiment: 'bullish' as const },
  { rank: 3, cardId: 'poke-umbreon-vmax', cardName: 'Umbreon VMAX Alt', setName: 'Evolving Skies', currentPrice: 298, changePercentage: 8.4, reason: 'Volume spike (manipulation warning)', sentiment: 'neutral' as const },
  { rank: 4, cardId: 'mtg-jeweled-lotus', cardName: 'Jeweled Lotus', setName: 'Commander Legends', currentPrice: 89, changePercentage: -6.2, reason: 'Ban speculation cooling', sentiment: 'bearish' as const },
  { rank: 5, cardId: 'poke-pikachu-illustrator', cardName: 'Pikachu Illustrator', setName: 'Promo', currentPrice: 420000, changePercentage: 2.1, reason: 'Trophy card stability', sentiment: 'bullish' as const },
];

// =============================================================================
// ROUTER
// =============================================================================

export const insightsRouter = router({
  /**
   * GET LATEST MARKET REPORTS (Public)
   * Returns AI-generated reports for the content feed.
   * Supports filtering by game and report type.
   */
  getReports: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        game: z.enum(['pokemon', 'mtg', 'lorcana', 'yugioh', 'one_piece', 'flesh_and_blood']).optional(),
        reportType: z.enum(['daily_snapshot', 'weekly_deep_dive', 'flash_alert']).optional(),
      })
    )
    .query(async ({ input }) => {
      // Try database first
      try {
        const whereConditions = [eq(marketReports.isPublished, 'published')];

        if (input.game) {
          whereConditions.push(eq(marketReports.game, input.game));
        }

        if (input.reportType) {
          whereConditions.push(eq(marketReports.reportType, input.reportType));
        }

        const reports = await db
          .select()
          .from(marketReports)
          .where(and(...whereConditions))
          .orderBy(desc(marketReports.publishedAt))
          .limit(input.limit);

        if (reports.length > 0) {
          return reports;
        }
      } catch {
        // Database not ready, fall through to mock data
      }

      // Return mock data filtered by input
      let filtered = MOCK_REPORTS;
      if (input.game) {
        filtered = filtered.filter((r) => r.game === input.game);
      }
      if (input.reportType) {
        filtered = filtered.filter((r) => r.reportType === input.reportType);
      }
      return filtered.slice(0, input.limit);
    }),

  /**
   * GET SINGLE REPORT BY SLUG (Public)
   * Returns full report content for the detail page.
   */
  getReportBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // Try database first
      try {
        const [report] = await db
          .select()
          .from(marketReports)
          .where(
            and(
              eq(marketReports.slug, input.slug),
              eq(marketReports.isPublished, 'published')
            )
          )
          .limit(1);

        if (report) {
          // Increment view count (fire and forget)
          db.update(marketReports)
            .set({ viewCount: sql`${marketReports.viewCount} + 1` })
            .where(eq(marketReports.id, report.id))
            .execute()
            .catch(console.error);

          return report;
        }
      } catch {
        // Database not ready
      }

      // Return mock data
      const report = MOCK_REPORTS.find((r) => r.slug === input.slug);
      return report ?? null;
    }),

  /**
   * GET CURRENT SENTIMENT (Public)
   * Returns the latest Fear & Greed index for each game.
   */
  getSentiment: publicProcedure
    .input(
      z.object({
        game: z.enum(['pokemon', 'mtg', 'lorcana', 'yugioh', 'one_piece', 'flesh_and_blood']).optional(),
      })
    )
    .query(async ({ input }) => {
      // Try database first
      try {
        if (input.game) {
          const [snapshot] = await db
            .select()
            .from(sentimentSnapshots)
            .where(eq(sentimentSnapshots.game, input.game))
            .orderBy(desc(sentimentSnapshots.recordedAt))
            .limit(1);

          if (snapshot) {
            return [snapshot];
          }
        } else {
          // Get latest for each game using a subquery approach
          const games = ['pokemon', 'mtg', 'lorcana'] as const;
          const snapshots = await Promise.all(
            games.map(async (game) => {
              const [snapshot] = await db
                .select()
                .from(sentimentSnapshots)
                .where(eq(sentimentSnapshots.game, game))
                .orderBy(desc(sentimentSnapshots.recordedAt))
                .limit(1);
              return snapshot;
            })
          );

          const validSnapshots = snapshots.filter(Boolean);
          if (validSnapshots.length > 0) {
            return validSnapshots;
          }
        }
      } catch {
        // Database not ready
      }

      // Return mock data
      if (input.game) {
        const mock = MOCK_SENTIMENT.find((s) => s.game === input.game);
        return mock
          ? [
              {
                id: `sentiment-${mock.game}`,
                game: mock.game,
                score: mock.score,
                label: getSentimentLabel(mock.score),
                previousScore: mock.previousScore,
                scoreChange: mock.score - mock.previousScore,
                factors: mock.factors,
                narrative: mock.narrative,
                recordedAt: new Date(),
                createdAt: new Date(),
              },
            ]
          : [];
      }

      return MOCK_SENTIMENT.map((s) => ({
        id: `sentiment-${s.game}`,
        game: s.game,
        score: s.score,
        label: getSentimentLabel(s.score),
        previousScore: s.previousScore,
        scoreChange: s.score - s.previousScore,
        factors: s.factors,
        narrative: s.narrative,
        recordedAt: new Date(),
        createdAt: new Date(),
      }));
    }),

  /**
   * GET SENTIMENT HISTORY (Public)
   * Returns historical sentiment data for charting.
   */
  getSentimentHistory: publicProcedure
    .input(
      z.object({
        game: z.enum(['pokemon', 'mtg', 'lorcana', 'yugioh', 'one_piece', 'flesh_and_blood']),
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      try {
        const history = await db
          .select({
            score: sentimentSnapshots.score,
            label: sentimentSnapshots.label,
            recordedAt: sentimentSnapshots.recordedAt,
          })
          .from(sentimentSnapshots)
          .where(
            and(
              eq(sentimentSnapshots.game, input.game),
              gte(sentimentSnapshots.recordedAt, since)
            )
          )
          .orderBy(sentimentSnapshots.recordedAt);

        if (history.length > 0) {
          return history;
        }
      } catch {
        // Database not ready
      }

      // Generate mock history
      const mockHistory = [];
      const baseScore = MOCK_SENTIMENT.find((s) => s.game === input.game)?.score ?? 50;

      for (let i = input.days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variance = Math.sin(i / 5) * 15 + (Math.random() - 0.5) * 10;
        const score = Math.max(0, Math.min(100, Math.round(baseScore + variance)));
        mockHistory.push({
          score,
          label: getSentimentLabel(score),
          recordedAt: date,
        });
      }

      return mockHistory;
    }),

  /**
   * GET MARKET MOVERS (Public)
   * Returns top gainers/losers for the ticker widget.
   * Pulls from marketMovers table with TTL awareness.
   */
  getMovers: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(5),
        direction: z.enum(['up', 'down', 'all']).default('all'),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();

      try {
        // Get non-expired movers
        const whereConditions = [gte(marketMovers.expiresAt, now)];

        const movers = await db
          .select()
          .from(marketMovers)
          .where(and(...whereConditions))
          .orderBy(marketMovers.rank)
          .limit(input.limit);

        if (movers.length > 0) {
          let filtered = movers;
          if (input.direction === 'up') {
            filtered = movers.filter((m) => m.changePercentage > 0);
          } else if (input.direction === 'down') {
            filtered = movers.filter((m) => m.changePercentage < 0);
          }
          return filtered;
        }
      } catch {
        // Database not ready
      }

      // Return mock data
      let filtered = MOCK_MOVERS;
      if (input.direction === 'up') {
        filtered = MOCK_MOVERS.filter((m) => m.changePercentage > 0);
      } else if (input.direction === 'down') {
        filtered = MOCK_MOVERS.filter((m) => m.changePercentage < 0);
      }

      return filtered.slice(0, input.limit).map((m) => ({
        id: m.cardId,
        cardId: m.cardId,
        cardName: m.cardName,
        setName: m.setName,
        rank: m.rank,
        currentPrice: m.currentPrice,
        changePercentage: m.changePercentage,
        reason: m.reason,
        sentiment: m.sentiment,
        sources: ['TCGPlayer', 'eBay'],
        isManipulated: m.cardName.includes('Umbreon'),
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      }));
    }),

  /**
   * GET DASHBOARD SUMMARY (Public)
   * Aggregated data for the main market dashboard.
   * Single call to reduce waterfall requests.
   */
  getDashboardSummary: publicProcedure
    .input(
      z.object({
        game: z.enum(['pokemon', 'mtg', 'lorcana']).default('pokemon'),
      })
    )
    .query(async ({ input }) => {
      // Parallel fetch all dashboard data
      const [sentiment, reports, movers] = await Promise.all([
        // Get sentiment for selected game
        (async () => {
          const mock = MOCK_SENTIMENT.find((s) => s.game === input.game);
          return mock
            ? {
                score: mock.score,
                label: getSentimentLabel(mock.score),
                change: mock.score - mock.previousScore,
                narrative: mock.narrative,
              }
            : null;
        })(),
        // Get latest reports
        (async () => {
          const filtered = MOCK_REPORTS.filter((r) => r.game === input.game).slice(0, 3);
          return filtered.map((r) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            reportType: r.reportType,
            summary: r.summary,
            publishedAt: r.publishedAt,
          }));
        })(),
        // Get top movers
        (async () => {
          return MOCK_MOVERS.slice(0, 5).map((m) => ({
            cardName: m.cardName,
            setName: m.setName,
            currentPrice: m.currentPrice,
            changePercentage: m.changePercentage,
            sentiment: m.sentiment,
            isManipulated: m.cardName.includes('Umbreon'),
          }));
        })(),
      ]);

      return {
        game: input.game,
        sentiment,
        latestReports: reports,
        topMovers: movers,
        lastUpdated: new Date(),
      };
    }),
});
