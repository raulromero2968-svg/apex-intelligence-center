// app/portfolio/page.tsx
import { SectionShell } from "@/components/section-shell";

type Position = {
  name: string;
  type: "Card" | "Deck";
  size: number;
  entryPrice: number;
  markPrice: number;
  pnlPct: number;
  horizon: "Short" | "Medium" | "Long";
};

type DeckExposure = {
  name: string;
  weightPct: number;
  pnlPct: number;
  regime: string;
};

const positions: Position[] = [
  {
    name: "Macro Regime Deck",
    type: "Deck",
    size: 25_000,
    entryPrice: 100,
    markPrice: 112.4,
    pnlPct: 12.4,
    horizon: "Long",
  },
  {
    name: "Pokémon 151 Signal Card",
    type: "Card",
    size: 4_200,
    entryPrice: 80,
    markPrice: 87.1,
    pnlPct: 8.9,
    horizon: "Medium",
  },
  {
    name: "Vintage WOTC Thesis Deck",
    type: "Deck",
    size: 15_000,
    entryPrice: 140,
    markPrice: 133.5,
    pnlPct: -4.6,
    horizon: "Long",
  },
  {
    name: "Latency Arb Bot",
    type: "Card",
    size: 8_500,
    entryPrice: 95,
    markPrice: 98.2,
    pnlPct: 3.4,
    horizon: "Short",
  },
];

const deckExposures: DeckExposure[] = [
  {
    name: "Macro Regime Deck",
    weightPct: 32,
    pnlPct: 12.4,
    regime: "Risk-On",
  },
  {
    name: "Vintage WOTC Thesis Deck",
    weightPct: 24,
    pnlPct: -4.6,
    regime: "Long Horizon",
  },
  {
    name: "Alt Data Deck",
    weightPct: 18,
    pnlPct: 3.1,
    regime: "Experimental",
  },
  {
    name: "Latency Arb Deck",
    weightPct: 12,
    pnlPct: 2.3,
    regime: "Tactical",
  },
];

const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
const openPnL =
  positions.reduce((sum, p) => sum + p.size * (p.pnlPct / 100), 0) || 0;

export default function PortfolioPage() {
  return (
    <SectionShell
      category="Portfolio"
      badgeLabel="OPERATOR SURFACE"
      title="Portfolio"
      subtitle="Positions, decks, and reputation all in one surface. Treat this as the canonical view of your Apex intelligence footprint."
      path="/portfolio"
    >
      <div className="space-y-8">
        {/* KPI row */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              TOTAL EXPOSED VALUE
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              ${totalValue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Across decks, model cards, and bot allocations.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              OPEN P&amp;L (EST.)
            </p>
            <p
              className={`mt-2 text-xl font-semibold ${
                openPnL >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {openPnL >= 0 ? "+" : "-"}${Math.abs(openPnL).toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Back-of-envelope based on current marks.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              ACTIVE POSITIONS
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {positions.length}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Mix of decks, individual cards, and bots.
            </p>
          </div>
        </section>

        {/* Positions table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
              Current Positions
            </h2>
            <p className="text-[11px] text-zinc-500">
              Later, wire this to your real execution / holdings.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <div className="grid grid-cols-6 gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[11px] text-zinc-400">
              <span>Instrument</span>
              <span>Type</span>
              <span className="text-right">Size</span>
              <span className="text-right">Entry</span>
              <span className="text-right">Mark</span>
              <span className="text-right">P&amp;L %</span>
            </div>
            <div className="divide-y divide-zinc-800 text-[11px] text-zinc-200">
              {positions.map((pos) => (
                <div
                  key={pos.name}
                  className="grid grid-cols-6 gap-2 px-4 py-2 hover:bg-zinc-900/70"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-100">{pos.name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {pos.horizon} horizon
                    </span>
                  </div>
                  <span className="self-center text-zinc-300">{pos.type}</span>
                  <span className="self-center text-right">
                    ${pos.size.toLocaleString()}
                  </span>
                  <span className="self-center text-right">
                    ${pos.entryPrice.toFixed(1)}
                  </span>
                  <span className="self-center text-right">
                    ${pos.markPrice.toFixed(1)}
                  </span>
                  <span
                    className={`self-center text-right ${
                      pos.pnlPct >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {pos.pnlPct >= 0 ? "+" : ""}
                    {pos.pnlPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deck exposures + activity */}
        <section className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Deck Exposure
              </h2>
              <span className="text-[11px] text-zinc-500">
                High-level allocation across decks
              </span>
            </div>

            <div className="space-y-3 text-[11px]">
              {deckExposures.map((deck) => (
                <div
                  key={deck.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-zinc-100">
                        {deck.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Regime: {deck.regime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-zinc-300">
                        {deck.weightPct.toFixed(0)}% weight
                      </p>
                      <p
                        className={`text-[11px] ${
                          deck.pnlPct >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {deck.pnlPct >= 0 ? "+" : ""}
                        {deck.pnlPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${deck.weightPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Recent Activity (Mock)
              </h2>
              <span className="text-[11px] text-zinc-500">Placeholder feed</span>
            </div>
            <ul className="space-y-2">
              <li>
                • Rebalanced{" "}
                <span className="text-zinc-100">Macro Regime Deck</span> from
                28% → 32% allocation.
              </li>
              <li>
                • Opened{" "}
                <span className="text-zinc-100">Pokémon 151 Signal Card</span>{" "}
                position for $4,200 notional.
              </li>
              <li>
                • Logged intel update on{" "}
                <span className="text-zinc-100">Vintage WOTC</span> thesis.
              </li>
              <li>
                • Adjusted{" "}
                <span className="text-zinc-100">Latency Arb Bot</span> runtime
                parameters.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
