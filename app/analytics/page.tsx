// app/analytics/page.tsx
import { SectionShell } from "@/components/section-shell";

type DeckMetric = {
  name: string;
  pnl30d: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
};

type RegimeMetric = {
  label: string;
  value: string;
  detail: string;
};

const deckMetrics: DeckMetric[] = [
  {
    name: "Macro Regime Deck",
    pnl30d: 6.8,
    sharpe: 1.9,
    maxDrawdown: -3.4,
    winRate: 64,
  },
  {
    name: "Latency Arb Deck",
    pnl30d: 3.2,
    sharpe: 1.4,
    maxDrawdown: -2.1,
    winRate: 58,
  },
  {
    name: "Alt Data Deck",
    pnl30d: 1.5,
    sharpe: 0.9,
    maxDrawdown: -4.7,
    winRate: 52,
  },
  {
    name: "Vintage WOTC Thesis Deck",
    pnl30d: -0.8,
    sharpe: 0.3,
    maxDrawdown: -6.2,
    winRate: 49,
  },
];

const regimeMetrics: RegimeMetric[] = [
  {
    label: "Global Regime",
    value: "Risk-On (soft)",
    detail: "Macro decks and growth-sensitive plays in mild uptrend.",
  },
  {
    label: "Volatility Regime",
    value: "Compressed",
    detail: "Spread-based strategies and latency arb favored.",
  },
  {
    label: "Liquidity",
    value: "Adequate",
    detail: "No major structural breaks or dry-ups detected.",
  },
];

export default function AnalyticsPage() {
  return (
    <SectionShell
      category="Analytics"
      badgeLabel="INTELLIGENCE ANALYTICS"
      title="Analytics"
      subtitle="Higher-level read on how your decks, signals, and regimes are behaving over time."
      path="/analytics"
    >
      <div className="space-y-8">
        {/* Timeframe + regime snapshot */}
        <section className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Performance Overview
              </h2>
              <div className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/80 p-1 text-[10px] text-zinc-300">
                <button className="rounded-full bg-zinc-800 px-2 py-0.5 font-semibold">
                  30D
                </button>
                <button className="rounded-full px-2 py-0.5 hover:bg-zinc-800">
                  90D
                </button>
                <button className="rounded-full px-2 py-0.5 hover:bg-zinc-800">
                  1Y
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              These are mock numbers; later you can replace with real P&amp;L
              and risk metrics from your execution layer.
            </p>

            <div className="grid gap-3 text-[11px]">
              {deckMetrics.map((deck) => (
                <div
                  key={deck.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-100">
                        {deck.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        30D P&amp;L / Sharpe / DD / Win%
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold ${
                          deck.pnl30d >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {deck.pnl30d >= 0 ? "+" : ""}
                        {deck.pnl30d.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        S: {deck.sharpe.toFixed(1)} · DD:{" "}
                        {deck.maxDrawdown.toFixed(1)}% · WR:{" "}
                        {deck.winRate.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-fuchsia-400"
                      style={{
                        width: `${Math.min(
                          Math.max(deck.pnl30d + 5, 0),
                          10,
                        ) * 10}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Regime Snapshot
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                STABLE MODE
              </span>
            </div>
            <p className="text-zinc-400">
              A high-level summary of the environment you&apos;re playing in.
              Later this can be computed from real market or game data.
            </p>

            <div className="space-y-2">
              {regimeMetrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    {m.label}
                  </p>
                  <p className="text-xs font-semibold text-zinc-100">
                    {m.value}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-300">
                    {m.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Placeholder analytics surfaces */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Equity Curve (Placeholder)
              </h2>
              <span className="text-[10px] text-zinc-500">
                Chart surface stub
              </span>
            </div>
            <p className="mt-2 text-zinc-400">
              Use this box later for a real equity curve chart across all decks
              or a specific strategy.
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 text-[10px] text-zinc-500">
              Chart placeholder
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Factor / Dimension Breakdown
              </h2>
              <span className="text-[10px] text-zinc-500">
                Risk / style decomposition
              </span>
            </div>
            <p className="mt-2 text-zinc-400">
              Use this surface for a factor model, regime clustering, or
              dimension reduction view (e.g., which parts of the space your
              decks actually cover).
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 text-[10px] text-zinc-500">
              Factor breakdown placeholder
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
