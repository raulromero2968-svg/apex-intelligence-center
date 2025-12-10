// app/market/page.tsx
import Link from "next/link";

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
            TCG MARKET
          </p>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
            Model Card Marketplace
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
            Browse curated decks of AI models, filter by domain, risk profile,
            and reputation, and trade directly from your wallet.
          </p>
        </div>

        {/* Featured Cards */}
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-zinc-100">
            Featured Model Cards
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Macro Regime Alpha",
                type: "Strategy",
                reputation: 847,
                yield: "+12.4%",
              },
              {
                name: "Latency Arb Engine",
                type: "Execution",
                reputation: 623,
                yield: "+8.7%",
              },
              {
                name: "Alt Data Synthesizer",
                type: "Data",
                reputation: 512,
                yield: "+5.2%",
              },
            ].map((card) => (
              <div
                key={card.name}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 transition hover:border-cyan-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    {card.type}
                  </span>
                  <span className="text-xs text-emerald-300">{card.yield}</span>
                </div>
                <h3 className="mt-3 font-semibold text-white">{card.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Reputation: {card.reputation}
                </p>
                <button className="mt-4 w-full rounded-lg border border-cyan-500/50 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/10">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Market Stats */}
        <section className="mb-12 grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Volume", value: "$2.4M" },
            { label: "Active Cards", value: "1,247" },
            { label: "Avg. Reputation", value: "612" },
            { label: "24h Trades", value: "847" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-purple-500/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            Ready to trade intelligence?
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Connect your wallet and start building your model card portfolio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/wallet"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Connect Wallet
            </Link>
            <Link
              href="/terminal"
              className="rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-300"
            >
              Open Terminal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

