// app/page.tsx
import Link from "next/link";

const navItems = [
  { label: "TCG Market", href: "/market" },
  { label: "Intelligence Stream", href: "/stream" },
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Admin Panel", href: "/admin" },
  { label: "Wallet", href: "/wallet" },
];

function HeaderNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-xs font-bold">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-300">
              APEX
            </span>
            <span className="text-sm font-semibold text-white">
              INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-zinc-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/terminal"
            className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/10"
          >
            Open Terminal
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-[#050012] to-black">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-24 pt-16 text-center md:px-6 md:pb-28 md:pt-24">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
          COLLECT · TRADE · EVOLVE
        </p>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Trade AI Models.
          <br />
          Build Reputation.
          <br />
          Shape the Future.
        </h1>

        <p className="mt-6 max-w-2xl text-sm text-zinc-300 md:text-base">
          The intelligence marketplace where private work becomes public
          knowledge. A reputation-driven economy for AI models, data, and live
          trading signal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/terminal"
            className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            Enter Intelligence Terminal
          </Link>

          <a
            href="#learn-more"
            className="rounded-full border border-zinc-700/80 px-7 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-400 hover:text-white"
          >
            Learn more
          </a>
        </div>

        {/* Quick stats row */}
        <div className="mt-10 grid w-full max-w-3xl gap-4 text-left text-xs text-zinc-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              MODEL CARDS
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              Tokenized representations of live AI models, datasets, and
              strategies.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              REPUTATION CREDITS
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              Earn reputation by publishing signal, contributing intel, and
              verifying models.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
              LIVE INTEL STREAM
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              Real-time feed of performance, risk regimes, and TCG meta shifts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectTradeEvolveSection() {
  return (
    <section
      id="learn-more"
      className="border-t border-white/5 bg-gradient-to-b from-black via-[#050510] to-black px-4 py-20 md:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-semibold text-white md:text-3xl">
          A Reputation TCG for AI Models
        </h2>
        <p className="mt-3 text-center text-sm text-zinc-400 md:text-base">
          Collect model cards, trade on performance, and evolve strategies in a
          persistent, on-chain intelligence game.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
              COLLECT
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              Mint model cards from real agents
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              Each card encodes an AI model or signal engine with transparent
              stats, provenance, and performance history.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
              TRADE
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              Price intelligence like an asset class
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              Markets continuously mark model cards to reputation and
              performance, unlocking a new yield surface for intelligence.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-300">
              EVOLVE
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              Merge, compose, and upgrade models
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              Combine models, stack prompts, and fuse datasets into higher-tier
              cards governed by on-chain reputation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PillNavSection() {
  return (
    <section className="border-t border-white/5 bg-black px-4 py-16 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <h2 className="text-lg font-semibold text-white md:text-xl">
            One surface for models, markets, and intel.
          </h2>
          <p className="max-w-xl text-xs text-zinc-400 md:text-sm">
            Navigate the Apex Intelligence stack: trade model cards, monitor the
            live intelligence stream, and orchestrate ecosystems of agents.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              TCG MARKET
            </div>
            <p className="text-xs text-zinc-300">
              Browse curated decks of AI models, filter by domain, risk profile,
              and reputation, and trade directly from your wallet.
            </p>
            <Link
              href="/market"
              className="mt-4 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Open Market →
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              INTELLIGENCE STREAM
            </div>
            <p className="text-xs text-zinc-300">
              Watch live P&amp;L, meta shifts, and anomaly alerts across the
              entire Apex ecosystem in a single terminal view.
            </p>
            <Link
              href="/stream"
              className="mt-4 inline-flex text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
            >
              View Stream →
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
              ECOSYSTEM
            </div>
            <p className="text-xs text-zinc-300">
              Discover labs, teams, and autonomous agents building on Apex.
              Plug into shared infrastructure and cross-strategy flows.
            </p>
            <Link
              href="/ecosystem"
              className="mt-4 inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200"
            >
              Explore Ecosystem →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReputationSection() {
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-black via-[#050010] to-black px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Reputation as the fulcrum between public good and private profit.
          </h2>
          <p className="mt-4 text-sm text-zinc-300 md:text-base">
            Apex Intelligence measures not just returns, but contribution.
            Reputation Credits track how much signal, code, and insight you
            contribute to the network over time.
          </p>
          <ul className="mt-6 space-y-3 text-xs text-zinc-300 md:text-sm">
            <li>• Earn credits for validated models, benchmarks, and intel.</li>
            <li>• Stake reputation to back models and share in their upside.</li>
            <li>
              • Use reputation to unlock higher-tier cards, datasets, and
              coordination tools.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-fuchsia-500/10 to-purple-500/15 p-6 text-xs text-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              REPUTATION CREDIT SCORE
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              Your on-chain track record of intelligence.
            </p>
            <p className="mt-3 text-xs text-zinc-200">
              Every contribution updates your score: models shipped, signals
              validated, risk averted. Reputation compounds as you keep playing
              the game.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              BUILT FOR OPERATORS
            </p>
            <p className="mt-2">
              Designed for quants, founders, and researchers who treat models as
              live assets—not static papers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-t border-white/5 bg-black px-4 py-16 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border border-zinc-800 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-purple-500/10 px-6 py-10 text-center">
        <h2 className="text-xl font-semibold text-white md:text-2xl">
          Ready to plug into the intelligence economy?
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
          Spin up your deck, connect your models, and start earning reputation
          for the signals you already generate.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/terminal"
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-zinc-100"
          >
            Open Terminal
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-zinc-600 px-7 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-300 hover:text-white"
          >
            Request early access
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[11px] text-zinc-500 md:flex-row">
        <p>© {new Date().getFullYear()} Apex Intelligence. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/docs" className="hover:text-zinc-300">
            Docs
          </Link>
          <Link href="/governance" className="hover:text-zinc-300">
            Governance
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeaderNav />
      <HeroSection />
      <CollectTradeEvolveSection />
      <PillNavSection />
      <ReputationSection />
      <CTASection />
      <Footer />
    </main>
  );
}
