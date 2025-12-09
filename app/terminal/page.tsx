// app/terminal/page.tsx
import Link from "next/link";

function TerminalHeader() {
  return (
    <header className="border-b border-white/5 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[10px] font-bold">
              AI
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-300">
                APEX
              </span>
              <span className="text-xs font-semibold text-white">
                INTELLIGENCE
              </span>
            </div>
          </Link>
          <div className="hidden border-l border-zinc-800 pl-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 md:block">
            TERMINAL
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="hidden md:inline">
            Status: <span className="text-emerald-400">Operational</span>
          </span>
          <button className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-medium hover:border-zinc-400 hover:text-zinc-100">
            Connect wallet
          </button>
        </div>
      </div>
    </header>
  );
}

export default function TerminalPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <TerminalHeader />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[230px,1fr] md:px-6">
        {/* Left rail: modes / navigation */}
        <aside className="space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              MODES
            </p>
            <div className="mt-3 space-y-1 text-[13px]">
              <Link
                href="/terminal"
                className="flex items-center justify-between rounded-lg bg-zinc-900/70 px-3 py-2 text-zinc-100"
              >
                <span>Intelligence Hub</span>
                <span className="text-[10px] text-cyan-300">LIVE</span>
              </Link>
              <Link
                href="/stream"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/60"
              >
                <span>Live Intelligence Stream</span>
              </Link>
              <Link
                href="/market"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/60"
              >
                <span>TCG Market</span>
              </Link>
              <Link
                href="/ecosystem"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/60"
              >
                <span>Ecosystem Map</span>
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              YOUR SURFACE
            </p>
            <div className="mt-3 space-y-1 text-[13px]">
              <Link
                href="/wallet"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/60"
              >
                Wallet &amp; Positions
              </Link>
              <Link
                href="/admin"
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/60"
              >
                Admin &amp; Governance
              </Link>
            </div>
          </div>
        </aside>

        {/* Right: main panels */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-purple-500/10 px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  INTELLIGENCE HUB
                </p>
                <h1 className="mt-1 text-lg font-semibold md:text-xl">
                  Apex Intelligence Terminal
                </h1>
              </div>
              <div className="flex gap-2 text-[11px] text-zinc-200">
                <span className="rounded-full bg-zinc-900/80 px-3 py-1">
                  Decks: <span className="text-cyan-300">12</span>
                </span>
                <span className="rounded-full bg-zinc-900/80 px-3 py-1">
                  Active models: <span className="text-fuchsia-300">48</span>
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-200 md:max-w-2xl">
              Route between model markets, live performance feeds, and
              ecosystem-level health. Use the left rail to switch modes; each
              panel is backed by the same reputation + intelligence layer that
              powers the landing TCG.
            </p>
          </div>

          {/* Top row of panels */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  LIVE RISK REGIME
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                  STABLE
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-300">
                High-level read on the current market mode across all tracked
                decks. Wire this up later to your real risk engine.
              </p>
              <div className="mt-4 h-20 rounded-lg border border-zinc-800 bg-zinc-900/80 text-[10px] text-zinc-500 flex items-center justify-center">
                {/* placeholder for chart */}
                <span>Risk regime sparkline / chart placeholder</span>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  LIVE INTELLIGENCE STREAM
                </span>
                <Link
                  href="/stream"
                  className="text-[11px] text-cyan-300 hover:text-cyan-200"
                >
                  Open full stream &rarr;
                </Link>
              </div>
              <div className="mt-3 space-y-2 text-[11px] text-zinc-200">
                <div className="flex justify-between">
                  <span className="text-zinc-400">New model signal</span>
                  <span className="text-emerald-300">+2.1&sigma;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Deck rotation alert</span>
                  <span className="text-fuchsia-300">meta shift</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Governance proposal</span>
                  <span className="text-cyan-300">#17 open</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: decks + tasks */}
          <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  ACTIVE DECKS
                </span>
                <Link
                  href="/market"
                  className="text-[11px] text-cyan-300 hover:text-cyan-200"
                >
                  View in TCG Market &rarr;
                </Link>
              </div>
              <div className="mt-3 space-y-2 text-xs text-zinc-200">
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                  <div>
                    <p>Macro Regime Deck</p>
                    <p className="text-[11px] text-zinc-400">
                      Risk-parity + macro signals
                    </p>
                  </div>
                  <span className="text-[11px] text-emerald-300">+12.4%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                  <div>
                    <p>Latency Arb Deck</p>
                    <p className="text-[11px] text-zinc-400">
                      Microstructure + HFT-style
                    </p>
                  </div>
                  <span className="text-[11px] text-amber-300">+3.1%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                  <div>
                    <p>Alt Data Deck</p>
                    <p className="text-[11px] text-zinc-400">
                      Non-traditional data feeds
                    </p>
                  </div>
                  <span className="text-[11px] text-red-300">-1.8%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  OPERATOR TASKS
                </span>
                <Link
                  href="/admin"
                  className="text-[11px] text-cyan-300 hover:text-cyan-200"
                >
                  Admin panel &rarr;
                </Link>
              </div>
              <ul className="mt-3 space-y-2 text-[11px] text-zinc-200">
                <li>&bull; Review governance proposal #17</li>
                <li>&bull; Stake rep to back Macro Regime Deck</li>
                <li>&bull; Onboard new model card: &quot;Newsflow Vectors v3&quot;</li>
                <li>&bull; Sync wallet + verify positions</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
