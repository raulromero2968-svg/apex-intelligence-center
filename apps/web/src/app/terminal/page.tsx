// app/terminal/page.tsx
"use client";

import Link from "next/link";
import { Activity, TrendingUp, Layers, RefreshCw, Terminal } from "lucide-react";
import { LiveRiskRegimeCard } from "./LiveRiskRegimeCard";

export default function TerminalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/images/apex-wolf-transparent.png"
                  alt="Apex Intelligence"
                  className="w-8 h-8 object-contain"
                />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400">Terminal</span>
                  <span className="text-zinc-500 font-normal text-base">/ Live Dashboard</span>
                </h1>
                <p className="text-xs text-zinc-500 font-mono">
                  Real-time intelligence streams
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>LIVE</span>
              </div>
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Row: Risk Regime + Intelligence Stream */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Live Risk Regime - Now connected to API */}
          <LiveRiskRegimeCard />

          {/* Live Intelligence Stream - Static placeholder (wire up next) */}
          <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
                LIVE INTELLIGENCE STREAM
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] text-cyan-300 bg-cyan-500/10">
                3 NEW
              </span>
            </div>

            <p className="mt-3 text-xs text-zinc-300">
              Latest signals and intelligence updates from across monitored sources.
            </p>

            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-[11px]">
              {/* Stream items */}
              <div className="flex items-start gap-3 pb-2 border-b border-zinc-800">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Model Signal Detected</span>
                    <span className="text-zinc-500 text-[10px]">2m ago</span>
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    Momentum indicator crossed threshold on TECH sector
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-2 border-b border-zinc-800">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Volatility Alert</span>
                    <span className="text-zinc-500 text-[10px]">15m ago</span>
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    VIX futures showing unusual activity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">New Intel Published</span>
                    <span className="text-zinc-500 text-[10px]">1h ago</span>
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    Q4 Macro Outlook report available
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-zinc-600 italic">
              Wire up: <code className="text-cyan-500/70">/api/stream-events</code>
            </p>
          </div>
        </div>

        {/* Bottom Section: Active Decks */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center justify-between text-[11px] mb-4">
            <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              ACTIVE DECKS
            </span>
            <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <RefreshCw className="w-3 h-3" />
              <span className="text-[10px]">Refresh</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Deck Card 1 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300">Tech Growth</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">+12.4%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">MTD Return</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-500">
                <span>Positions: 8</span>
                <span>Vol: 0.14</span>
              </div>
            </div>

            {/* Deck Card 2 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300">Value Play</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">+5.7%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">MTD Return</p>
                </div>
                <Activity className="w-8 h-8 text-cyan-500/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-500">
                <span>Positions: 12</span>
                <span>Vol: 0.08</span>
              </div>
            </div>

            {/* Deck Card 3 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300">Macro Hedge</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  HEDGED
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-400 font-mono">-1.2%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">MTD Return</p>
                </div>
                <Activity className="w-8 h-8 text-amber-500/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-500">
                <span>Positions: 5</span>
                <span>Vol: 0.22</span>
              </div>
            </div>

            {/* Deck Card 4 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300">Income Gen</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">+3.1%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">MTD Return</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-500">
                <span>Positions: 20</span>
                <span>Vol: 0.06</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-zinc-600 italic">
            Wire up: <code className="text-cyan-500/70">/api/decks</code>
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <Link
            href="/intel"
            className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            View Intel Reports
          </Link>
          <Link
            href="/portfolio"
            className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            Manage Portfolio
          </Link>
          <Link
            href="/forensics"
            className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-purple-400 hover:border-purple-500/30 transition-all"
          >
            Enter Forensics
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-600">
          <p>Apex Intelligence Terminal v0.1.0 - Real-time data streaming enabled</p>
        </div>
      </footer>
    </div>
  );
}
