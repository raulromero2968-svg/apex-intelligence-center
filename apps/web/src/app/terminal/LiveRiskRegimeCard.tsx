// app/terminal/LiveRiskRegimeCard.tsx
"use client";

import { useEffect, useState } from "react";

type RiskRegime = {
  regime: string;
  score: number;
  volatilityIndex: number;
  updatedAt: string;
};

export function LiveRiskRegimeCard() {
  const [data, setData] = useState<RiskRegime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/risk-regime", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as RiskRegime;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load risk regime");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const chipColor =
    data?.regime === "VOLATILE"
      ? "text-amber-300 bg-amber-500/10"
      : data?.regime === "RISK_OFF"
      ? "text-red-300 bg-red-500/10"
      : "text-emerald-300 bg-emerald-500/10"; // default STABLE / RISK_ON

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold uppercase tracking-[0.2em] text-zinc-400">
          LIVE RISK REGIME
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${chipColor}`}
        >
          {loading && "LOADING..."}
          {!loading && error && "ERROR"}
          {!loading && !error && data?.regime}
        </span>
      </div>

      <p className="mt-3 text-xs text-zinc-300">
        High-level read on the current market mode across all tracked decks.
        This panel pulls from <code className="text-[10px] text-cyan-400">/api/risk-regime</code>.
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-[11px] text-zinc-300">
        {loading && <span className="animate-pulse">Fetching latest risk metrics...</span>}
        {!loading && error && (
          <span className="text-red-300">
            Failed to load: {error}. Check the API route.
          </span>
        )}
        {!loading && !error && data && (
          <>
            <div className="flex justify-between">
              <span>Regime score</span>
              <span className="font-mono text-emerald-400">{(data.score * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Volatility index</span>
              <span className="font-mono text-cyan-400">{data.volatilityIndex.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Last updated</span>
              <span>
                {new Date(data.updatedAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
