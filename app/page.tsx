// app/page.tsx - Manus-inspired landing page
import Link from "next/link";

function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[11px] font-bold">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-300">
              APEX
            </span>
            <span className="text-sm font-semibold text-white">
              INTELLIGENCE
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] text-zinc-400 md:flex">
          <Link href="/market" className="hover:text-white transition-colors">
            Market
          </Link>
          <Link href="/ecosystem" className="hover:text-white transition-colors">
            Ecosystem
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/governance" className="hover:text-white transition-colors">
            Governance
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/terminal"
            className="rounded-full border border-zinc-700 px-4 py-2 text-[12px] font-medium text-zinc-200 hover:border-cyan-400 hover:text-cyan-300 transition-all"
          >
            Open Terminal
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-[12px] font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Get Access
          </Link>
        </div>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-black py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[10px] font-bold">
                AI
              </div>
              <span className="text-sm font-semibold text-white">
                APEX INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              The intelligence layer for AI-native markets.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Platform
            </p>
            <div className="space-y-2 text-[13px]">
              <Link href="/terminal" className="block text-zinc-400 hover:text-white">
                Terminal
              </Link>
              <Link href="/market" className="block text-zinc-400 hover:text-white">
                TCG Market
              </Link>
              <Link href="/stream" className="block text-zinc-400 hover:text-white">
                Live Stream
              </Link>
              <Link href="/ecosystem" className="block text-zinc-400 hover:text-white">
                Ecosystem
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Resources
            </p>
            <div className="space-y-2 text-[13px]">
              <Link href="/docs" className="block text-zinc-400 hover:text-white">
                Documentation
              </Link>
              <Link href="/governance" className="block text-zinc-400 hover:text-white">
                Governance
              </Link>
              <Link href="/signup" className="block text-zinc-400 hover:text-white">
                Request Access
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Legal
            </p>
            <div className="space-y-2 text-[13px]">
              <Link href="/privacy" className="block text-zinc-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-zinc-400 hover:text-white">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; 2025 Apex Intelligence. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>Status: <span className="text-emerald-400">Operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-6 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[12px] font-medium text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Intelligence infrastructure for AI-native markets
          </div>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
            The reputation layer
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              for model intelligence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
            Route capital to the best-performing AI models. Trade intelligence
            cards. Stake reputation. Build the future of autonomous markets.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/terminal"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-8 py-3 text-[14px] font-semibold text-black transition-all hover:opacity-90"
            >
              Launch Terminal
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-3 text-[14px] font-medium text-zinc-200 transition-all hover:border-zinc-500 hover:text-white"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-zinc-950/50 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 text-center md:gap-16">
          <div>
            <p className="text-2xl font-bold text-white md:text-3xl">48</p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Active Models
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white md:text-3xl">12</p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Trading Decks
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white md:text-3xl">$2.4M</p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Total Volume
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400 md:text-3xl">
              99.9%
            </p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Uptime
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              Intelligence infrastructure, reimagined
            </h2>
            <p className="mt-3 text-zinc-400">
              Everything you need to trade, stake, and govern AI model markets.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <svg
                  className="h-6 w-6 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Live Intelligence Stream</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Real-time signals, regime changes, and model performance feeds.
                Never miss a market shift.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/10">
                <svg
                  className="h-6 w-6 text-fuchsia-400"
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
              <h3 className="text-lg font-semibold">TCG Model Market</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Trade intelligence cards backed by real model performance.
                Collect, stake, and profit.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Reputation Staking</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Back the models you believe in. Earn from accuracy, lose from
                noise. Skin in the game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/5 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-purple-500/10 p-8 text-center md:p-12">
            <h2 className="text-2xl font-bold md:text-4xl">
              Ready to enter the intelligence layer?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Join the operators, quants, and builders already trading on the
              Apex Intelligence network.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-full bg-white px-8 py-3 text-[14px] font-semibold text-black transition-all hover:bg-zinc-200"
              >
                Request Early Access
              </Link>
              <Link
                href="/terminal"
                className="rounded-full border border-zinc-700 px-8 py-3 text-[14px] font-medium text-zinc-200 transition-all hover:border-zinc-500"
              >
                Explore Terminal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
