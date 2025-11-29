"use client";

import React, { useMemo } from "react";
// Ensure these paths match your monorepo structure.
// If these components don't exist yet, I can provide them next.
import { DigitalScrollWrapper } from "@/components/titan/DigitalScrollWrapper";
import { TerminalStream } from "@/components/titan/TerminalStream";
import { TitanHeader } from "@/components/titan/TitanHeader";
import { HoloNumber } from "@/components/ui/HoloNumber";

// --- DATA TYPES ---
type MarketRiskLevel = "STABLE" | "VOLATILE" | "HYPED";
type MarketSignal = "BUY" | "HOLD" | "SELL";

interface MarketPulseEntry {
  id: string;
  cardName: string;
  set: string;
  price: string; // Display string like "$2000+"
  changeWeek: number; // percentage
  rank: number;
  reason: string;
  riskLevel: MarketRiskLevel;
  signal: MarketSignal;
}

// --- INTELLIGENCE SOURCE: GROK (2025-11-24) ---
const MARKET_PULSE_DATA: MarketPulseEntry[] = [
  {
    id: "umb-ex-001",
    rank: 1,
    cardName: "Umbreon ex",
    set: "Unknown Set (2025)",
    price: "$2,000+",
    changeWeek: 18.5,
    reason: "High competitive demand + Collector buyout",
    riskLevel: "HYPED",
    signal: "HOLD",
  },
  {
    id: "luc-ex-002",
    rank: 2,
    cardName: "Mega Lucario ex",
    set: "Mega Evo Series",
    price: "$500+",
    changeWeek: 12.0,
    reason: "Meta deck contender 2025",
    riskLevel: "STABLE",
    signal: "BUY",
  },
  {
    id: "gar-ex-003",
    rank: 3,
    cardName: "Mega Gardevoir ex",
    set: "Mega Evo Series",
    price: "$450+",
    changeWeek: 12.0,
    reason: "Consistent market mover",
    riskLevel: "VOLATILE",
    signal: "BUY",
  },
  {
    id: "sha-ex-004",
    rank: 4,
    cardName: "Shaymin EX",
    set: "XY-BEST",
    price: "$300+",
    changeWeek: 18.0,
    reason: "Investment growth trend",
    riskLevel: "STABLE",
    signal: "BUY",
  },
  {
    id: "pik-ex-005",
    rank: 5,
    cardName: "Pikachu ex SAR",
    set: "SV8",
    price: "$250+",
    changeWeek: 20.0,
    reason: "Tier list rising + Collector fav",
    riskLevel: "HYPED",
    signal: "SELL",
  },
];

// --- UTILITIES ---
function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function getRiskBadgeStyles(risk: MarketRiskLevel): string {
  switch (risk) {
    case "STABLE": return "border-emerald-400/60 bg-emerald-500/10 text-emerald-200";
    case "VOLATILE": return "border-amber-400/60 bg-amber-500/10 text-amber-100";
    case "HYPED": return "border-rose-400/60 bg-rose-500/10 text-rose-100 animate-pulse";
    default: return "border-slate-500/60 text-slate-100";
  }
}

export const MarketPulse: React.FC = () => {
  // Aggregate Metrics
  const avgGrowth = useMemo(() =>
    MARKET_PULSE_DATA.reduce((sum, item) => sum + item.changeWeek, 0) / MARKET_PULSE_DATA.length,
  []);

  // Generate Terminal Output
  const terminalLines = useMemo(() => {
    return [
      `>> APEX MARKET SCAN COMPLETE [TS: ${new Date().toISOString()}]`,
      `>> TARGET: TCG_SINGLES_MARKET // REGION: GLOBAL`,
      `>> DETECTED ${MARKET_PULSE_DATA.length} HIGH-VELOCITY ASSETS`,
      `>> AVG MARKET MOVEMENT: +${avgGrowth.toFixed(1)}% (WEEKLY)`,
      `>> TOP MOVER: ${MARKET_PULSE_DATA[0].cardName} [${MARKET_PULSE_DATA[0].changeWeek}%]`,
      `>> ADVISORY: 'HYPED' assets indicate possible correction.`,
      `>> STATUS: STREAMING REAL-TIME DATA...`
    ];
  }, [avgGrowth]);

  return (
    <DigitalScrollWrapper className="relative flex flex-col gap-6 rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur xl:p-8">

      {/* Background Grid FX */}
      <div className="pointer-events-none absolute inset-0 opacity-20"
           style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative flex flex-col gap-4 z-10">
        <TitanHeader
          title="Market Pulse // TCG"
          subtitle="Real-time volatility tracking and market movers."
          className="text-cyan-100"
        />

        <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-cyan-300/80">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 uppercase tracking-widest">
            LIVE FEED
          </span>
          <span className="text-emerald-400">Market Sentiment: BULLISH</span>
        </div>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[2fr_1fr] z-10">
        {/* Left: Card Ticker */}
        <div className="grid gap-3">
            {MARKET_PULSE_DATA.map((card) => (
              <div
                key={card.id}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                {/* Holo Glitch Hover Effect Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent transition-opacity duration-500" />

                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-950 border border-slate-700 font-sans text-lg font-bold text-cyan-500 group-hover:text-white group-hover:bg-cyan-600 group-hover:border-cyan-400 transition-colors">
                    {card.rank}
                  </div>

                  {/* Card Info */}
                  <div>
                    <h3 className="font-bold text-slate-100 group-hover:text-cyan-200 transition-colors">{card.cardName}</h3>
                    <p className="text-xs font-sans text-slate-500">
                      {card.set} · <HoloNumber value={card.price} type="price" colorScheme="cyan" glitchIntensity="low" className="text-sm" />
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                    <div className="font-sans font-bold text-lg">
                        <HoloNumber
                          value={card.changeWeek}
                          type="percent"
                          colorScheme="emerald"
                          glitchIntensity="medium"
                        />
                    </div>
                    <span className={`text-[0.65rem] px-2 py-0.5 rounded border uppercase tracking-wider ${getRiskBadgeStyles(card.riskLevel)}`}>
                        {card.riskLevel}
                    </span>
                </div>
              </div>
            ))}
        </div>

        {/* Right: Terminal Analysis */}
        <div className="flex flex-col gap-4">
           <div className="h-full min-h-[200px] rounded-xl border border-slate-800 bg-black/90 p-4 font-sans text-xs text-emerald-500 shadow-inner">
              <TerminalStream
                lines={terminalLines}
                typingSpeed={15}
                className="leading-6"
              />
           </div>

           {/* Insight Box */}
           <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
              <h4 className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Apex Insight</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Umbreon ex is showing signs of artificial scarcity. Recommended action is <span className="text-white font-bold">HOLD</span> until price stabilization.
              </p>
           </div>
        </div>
      </div>
    </DigitalScrollWrapper>
  );
};

export default MarketPulse;
