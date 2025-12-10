// app/market/page.tsx
// TCG Market Dashboard - Full dashboard for browsing and trading model cards

import Link from "next/link";
import { Metadata } from "next";
import {
  SectionShell,
  SectionCard,
  StatCard,
} from "@/components/layout/SectionShell";
import { ApexCard, MarketSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  title: "TCG Market",
  description:
    "Browse and trade AI model cards on the Apex Intelligence TCG Market. Real-time pricing, performance metrics, and portfolio tracking.",
};

// Fake market data - will be replaced with real API calls
const marketSnapshot: MarketSnapshot = {
  timestamp: new Date().toISOString(),
  totalVolume24h: 2847392,
  totalMarketCap: 48293847,
  activeCards: 48,
  activeTraders: 1247,
  topGainers: [],
  topLosers: [],
  sentiment: {
    bullish: 62,
    bearish: 18,
    neutral: 20,
  },
  riskRegime: "risk-on",
};

// Fake model cards
const modelCards: Partial<ApexCard>[] = [
  {
    id: "1",
    name: "Macro Regime Alpha",
    slug: "macro-regime-alpha",
    type: "alpha",
    rarity: "legendary",
    creator: { id: "1", name: "ApexQuant", reputation: 2847 },
    performance: {
      sharpe: 2.4,
      returns7d: 8.2,
      returns30d: 24.7,
      maxDrawdown: -4.2,
      winRate: 68,
      totalTrades: 1247,
    },
    market: {
      price: 4.82,
      priceChange24h: 12.4,
      volume24h: 284739,
      marketCap: 4820000,
      holders: 847,
    },
    tags: ["macro", "risk-parity", "regime-detection"],
  },
  {
    id: "2",
    name: "Latency Arbitrage v3",
    slug: "latency-arbitrage-v3",
    type: "signal",
    rarity: "rare",
    creator: { id: "2", name: "HFT_Labs", reputation: 1923 },
    performance: {
      sharpe: 3.1,
      returns7d: 2.1,
      returns30d: 8.4,
      maxDrawdown: -1.8,
      winRate: 72,
      totalTrades: 8472,
    },
    market: {
      price: 2.47,
      priceChange24h: 3.1,
      volume24h: 127483,
      marketCap: 2470000,
      holders: 423,
    },
    tags: ["hft", "microstructure", "arbitrage"],
  },
  {
    id: "3",
    name: "Sentiment Aggregator",
    slug: "sentiment-aggregator",
    type: "factor",
    rarity: "uncommon",
    creator: { id: "3", name: "DataMiner", reputation: 1247 },
    performance: {
      sharpe: 1.8,
      returns7d: -1.2,
      returns30d: 12.3,
      maxDrawdown: -8.4,
      winRate: 58,
      totalTrades: 423,
    },
    market: {
      price: 0.84,
      priceChange24h: -4.2,
      volume24h: 42847,
      marketCap: 840000,
      holders: 247,
    },
    tags: ["sentiment", "social", "nlp"],
  },
  {
    id: "4",
    name: "Alt Data Fusion",
    slug: "alt-data-fusion",
    type: "ensemble",
    rarity: "mythic",
    creator: { id: "4", name: "DeepSignal", reputation: 3847 },
    performance: {
      sharpe: 2.9,
      returns7d: 5.7,
      returns30d: 18.2,
      maxDrawdown: -3.1,
      winRate: 65,
      totalTrades: 847,
    },
    market: {
      price: 8.47,
      priceChange24h: 7.8,
      volume24h: 487293,
      marketCap: 8470000,
      holders: 1247,
    },
    tags: ["alt-data", "satellite", "web-scraping"],
  },
  {
    id: "5",
    name: "Momentum Cross",
    slug: "momentum-cross",
    type: "signal",
    rarity: "common",
    creator: { id: "5", name: "TrendFollower", reputation: 847 },
    performance: {
      sharpe: 1.4,
      returns7d: 2.8,
      returns30d: 6.2,
      maxDrawdown: -12.4,
      winRate: 52,
      totalTrades: 2847,
    },
    market: {
      price: 0.24,
      priceChange24h: 1.2,
      volume24h: 12847,
      marketCap: 240000,
      holders: 147,
    },
    tags: ["momentum", "trend", "technical"],
  },
  {
    id: "6",
    name: "Risk Parity Core",
    slug: "risk-parity-core",
    type: "risk",
    rarity: "rare",
    creator: { id: "6", name: "RiskMaster", reputation: 2147 },
    performance: {
      sharpe: 2.1,
      returns7d: 1.4,
      returns30d: 4.8,
      maxDrawdown: -2.1,
      winRate: 64,
      totalTrades: 147,
    },
    market: {
      price: 1.84,
      priceChange24h: -0.8,
      volume24h: 84729,
      marketCap: 1840000,
      holders: 384,
    },
    tags: ["risk", "volatility", "allocation"],
  },
];

const rarityColors = {
  common: "border-zinc-600 bg-zinc-800/50",
  uncommon: "border-emerald-600/50 bg-emerald-900/20",
  rare: "border-blue-500/50 bg-blue-900/20",
  legendary: "border-amber-500/50 bg-amber-900/20",
  mythic: "border-fuchsia-500/50 bg-fuchsia-900/20",
};

const rarityGlow = {
  common: "",
  uncommon: "shadow-emerald-500/10",
  rare: "shadow-blue-500/20",
  legendary: "shadow-amber-500/20",
  mythic: "shadow-fuchsia-500/30 shadow-lg",
};

export default function MarketPage() {
  return (
    <SectionShell
      category="MARKET"
      title="TCG Model Market"
      subtitle="Browse and trade AI model cards. Each card represents a trading model with real performance history and reputation stakes."
      status={{ label: "Live", variant: "live" }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/deck-builder"
            className="rounded-full border border-zinc-700 px-4 py-2 text-[12px] font-medium text-zinc-200 hover:border-cyan-500/50 transition-colors"
          >
            Build Deck
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-[12px] font-semibold text-black hover:opacity-90 transition-opacity"
          >
            My Portfolio
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Market Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="24h Volume"
            value={`$${(marketSnapshot.totalVolume24h / 1000000).toFixed(2)}M`}
            change={{ value: "12.4%", positive: true }}
          />
          <StatCard
            label="Market Cap"
            value={`$${(marketSnapshot.totalMarketCap / 1000000).toFixed(1)}M`}
            change={{ value: "4.2%", positive: true }}
          />
          <StatCard
            label="Active Cards"
            value={marketSnapshot.activeCards}
            change={{ value: "3 new", positive: true }}
          />
          <StatCard
            label="Active Traders"
            value={marketSnapshot.activeTraders.toLocaleString()}
            change={{ value: "8.7%", positive: true }}
          />
        </div>

        {/* Market Sentiment Bar */}
        <SectionCard title="Market Sentiment">
          <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500"
                style={{ width: `${marketSnapshot.sentiment.bullish}%` }}
              />
              <div
                className="bg-zinc-600"
                style={{ width: `${marketSnapshot.sentiment.neutral}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${marketSnapshot.sentiment.bearish}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-400">
                {marketSnapshot.sentiment.bullish}% Bullish
              </span>
              <span className="text-zinc-400">
                {marketSnapshot.sentiment.neutral}% Neutral
              </span>
              <span className="text-red-400">
                {marketSnapshot.sentiment.bearish}% Bearish
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Model Cards Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Model Cards</h2>
            <div className="flex items-center gap-2">
              <select className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-300">
                <option>All Types</option>
                <option>Alpha</option>
                <option>Signal</option>
                <option>Factor</option>
                <option>Risk</option>
                <option>Ensemble</option>
              </select>
              <select className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-300">
                <option>Sort: Volume</option>
                <option>Sort: Price</option>
                <option>Sort: Sharpe</option>
                <option>Sort: Returns</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modelCards.map((card) => (
              <Link key={card.id} href={`/market/${card.slug}`}>
                <article
                  className={`group relative rounded-2xl border p-5 transition-all hover:scale-[1.02] ${
                    rarityColors[card.rarity || "common"]
                  } ${rarityGlow[card.rarity || "common"]}`}
                >
                  {/* Rarity badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        card.rarity === "mythic"
                          ? "bg-fuchsia-500/30 text-fuchsia-300"
                          : card.rarity === "legendary"
                          ? "bg-amber-500/30 text-amber-300"
                          : card.rarity === "rare"
                          ? "bg-blue-500/30 text-blue-300"
                          : card.rarity === "uncommon"
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-zinc-600/30 text-zinc-400"
                      }`}
                    >
                      {card.rarity}
                    </span>
                  </div>

                  {/* Card header */}
                  <div className="mb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      {card.type}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold group-hover:text-cyan-400 transition-colors">
                      {card.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      by {card.creator?.name} • Rep:{" "}
                      {card.creator?.reputation.toLocaleString()}
                    </p>
                  </div>

                  {/* Performance metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-zinc-500">Sharpe</p>
                      <p className="text-sm font-semibold text-cyan-400">
                        {card.performance?.sharpe.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Win Rate</p>
                      <p className="text-sm font-semibold">
                        {card.performance?.winRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">7d Return</p>
                      <p
                        className={`text-sm font-semibold ${
                          (card.performance?.returns7d || 0) >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {(card.performance?.returns7d || 0) >= 0 ? "+" : ""}
                        {card.performance?.returns7d}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Max DD</p>
                      <p className="text-sm font-semibold text-red-400">
                        {card.performance?.maxDrawdown}%
                      </p>
                    </div>
                  </div>

                  {/* Market data */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                    <div>
                      <p className="text-[10px] text-zinc-500">Price</p>
                      <p className="text-lg font-bold">
                        ${card.market?.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">24h</p>
                      <p
                        className={`text-sm font-semibold ${
                          (card.market?.priceChange24h || 0) >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {(card.market?.priceChange24h || 0) >= 0 ? "+" : ""}
                        {card.market?.priceChange24h}%
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {card.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/deck-builder">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-cyan-500/30 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 mb-3">
                <svg
                  className="h-5 w-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Build a Deck</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Combine cards into a trading strategy
              </p>
            </div>
          </Link>
          <Link href="/tournaments">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-fuchsia-500/30 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10 mb-3">
                <svg
                  className="h-5 w-5 text-fuchsia-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Tournaments</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Compete in deck battles
              </p>
            </div>
          </Link>
          <Link href="/leaderboard/achievements">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-purple-500/30 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 mb-3">
                <svg
                  className="h-5 w-5 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Leaderboard</h3>
              <p className="mt-1 text-xs text-zinc-500">
                See top performers
              </p>
            </div>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
