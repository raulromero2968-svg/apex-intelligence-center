"use client";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Scatter, ZAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";

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
    <div className="relative">
      {/* Cyberpunk Terminal Wrapper */}
      <div className="relative border border-cyan-500/40 bg-gradient-to-br from-slate-950/90 to-slate-900/90 backdrop-blur-sm rounded-xl overflow-hidden">
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-10" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-10" />

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-scan" />
        </div>

        {/* Terminal Header */}
        <div className="border-b border-cyan-500/30 bg-black/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-mono text-xs tracking-wider">LIVE_INTEL_FEED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-400 text-xs font-mono">STREAMING</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white font-mono">{title}</h3>
            <p className="text-sm text-cyan-400/80 font-mono">{subtitle}</p>
          </div>
          
          <div className="h-64 bg-black/40 rounded-lg border border-cyan-500/20 p-2">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                {/* SVG Definitions for gradients and effects */}
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00d9ff" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.15)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Score"
                  unit=""
                  tick={{ fill: "rgba(0, 217, 255, 0.8)", fontSize: 11, fontFamily: "monospace" }}
                  stroke="rgba(0, 217, 255, 0.3)"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Return"
                  unit="%"
                  tick={{ fill: "rgba(0, 217, 255, 0.8)", fontSize: 11, fontFamily: "monospace" }}
                  stroke="rgba(0, 217, 255, 0.3)"
                />
                <ZAxis type="number" dataKey="z" range={[30, 160]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "rgba(5, 10, 21, 0.95)",
                    border: "1px solid rgba(0, 217, 255, 0.4)",
                    color: "#00d9ff",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    borderRadius: "4px",
                  }}
                />
                {/* Multiple colored scatter layers for colorful effect */}
                <Scatter 
                  name="Cards" 
                  data={data} 
                  fill="url(#colorGradient)"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    // Vary color based on position
                    const hue = (payload.x + payload.y) % 360;
                    const colors = [
                      '#00d9ff', // cyan
                      '#a855f7', // purple
                      '#ec4899', // pink
                      '#f59e0b', // amber
                      '#10b981', // emerald
                      '#3b82f6', // blue
                    ];
                    const color = colors[Math.floor((payload.x + payload.y) / 30) % colors.length];
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={payload.z / 3} 
                        fill={color}
                        fillOpacity={0.7}
                        stroke={color}
                        strokeWidth={1}
                        filter="url(#glow)"
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Tip */}
          <div className="mt-4 border-t border-cyan-500/20 pt-3">
            <p className="text-xs text-slate-400 font-mono">
              Tip for teens: dots higher and to the right often mean stronger potential—but bigger swings. Start small, track
              results, and let data be your coach.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
