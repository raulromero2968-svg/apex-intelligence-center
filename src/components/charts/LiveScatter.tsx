"use client";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Scatter, ZAxis } from "recharts";
import { useReducedMotion } from "framer-motion";

type Point = { x: number; y: number; z: number };

function makeSeeded(seed = 7) {
  return () => (seed = (seed * 48271) % 0x7fffffff) / 0x7fffffff;
}

export default function LiveScatter({
  title = "Risk vs Reward",
  subtitle = "Higher right = usually better returns (with more bumps).",
}: {
  title?: string;
  subtitle?: string;
}) {
  const rnd = useMemo(() => makeSeeded(19), []);
  const [data, setData] = useState<Point[]>(
    Array.from({ length: 24 }).map((_, i) => ({
      x: Math.round(10 + rnd() * 90), // "time" or "rarity score"
      y: Math.round(10 + rnd() * 90), // "return" proxy
      z: Math.round(5 + rnd() * 15), // "liquidity"
    }))
  );
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setData((prev) =>
        prev.map((p) => {
          // tiny random walk
          const nx = Math.min(100, Math.max(0, p.x + (rnd() - 0.5) * 2.0));
          const ny = Math.min(100, Math.max(0, p.y + (rnd() - 0.5) * 2.4));
          return { ...p, x: nx, y: ny };
        })
      );
    }, 1500);
    return () => clearInterval(id);
  }, [rnd, reduced]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/70">{subtitle}</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Score"
              unit=""
              tick={{ fill: "rgba(255,255,255,0.7)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Return"
              unit="%"
              tick={{ fill: "rgba(255,255,255,0.7)" }}
            />
            <ZAxis type="number" dataKey="z" range={[30, 160]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "rgba(17,24,39,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            />
            <Scatter name="Cards" data={data} fill="#22d3ee" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-white/60">
        Tip for teens: dots higher and to the right often mean stronger potential—but bigger swings. Start small, track
        results, and let data be your coach.
      </p>
    </div>
  );
}

