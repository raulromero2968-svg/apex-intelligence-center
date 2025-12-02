'use client';

import { useMemo } from 'react';

interface SentimentGaugeProps {
  score: number;
  label: string;
  change?: number;
  narrative?: string;
  game: string;
}

/**
 * Fear & Greed Gauge Component
 *
 * Visual gauge displaying market sentiment from 0-100.
 * Inspired by CNN's Fear & Greed Index with TCG-specific theming.
 */
export function SentimentGauge({ score, label, change, narrative, game }: SentimentGaugeProps) {
  const { color, bgColor, glowColor, displayLabel } = useMemo(() => {
    if (score <= 20) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        glowColor: 'shadow-red-500/50',
        displayLabel: 'Extreme Fear',
      };
    }
    if (score <= 40) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-500',
        glowColor: 'shadow-orange-500/50',
        displayLabel: 'Fear',
      };
    }
    if (score <= 60) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        glowColor: 'shadow-yellow-500/50',
        displayLabel: 'Neutral',
      };
    }
    if (score <= 80) {
      return {
        color: 'text-lime-500',
        bgColor: 'bg-lime-500',
        glowColor: 'shadow-lime-500/50',
        displayLabel: 'Greed',
      };
    }
    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      glowColor: 'shadow-green-500/50',
      displayLabel: 'Extreme Greed',
    };
  }, [score]);

  // Calculate needle rotation (0 = -90deg, 100 = 90deg)
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Market Sentiment</h3>
          <p className="text-sm text-white/60 capitalize">{game} TCG</p>
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              change > 0
                ? 'bg-green-500/20 text-green-400'
                : change < 0
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}
          </div>
        )}
      </div>

      {/* Gauge Container */}
      <div className="relative flex flex-col items-center">
        {/* Semi-circle Gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background Arc */}
          <div className="absolute inset-0">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Gradient Arc Background */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="75%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              {/* Arc Path */}
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="opacity-30"
              />

              {/* Active Arc based on score */}
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 283} 283`}
              />
            </svg>
          </div>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
            <div className={`w-1 h-20 ${bgColor} rounded-full shadow-lg ${glowColor}`} />
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 ${bgColor} rounded-full shadow-lg ${glowColor}`} />
          </div>
        </div>

        {/* Score Display */}
        <div className="mt-4 text-center">
          <div className={`text-5xl font-bold ${color} tabular-nums`}>{score}</div>
          <div className={`text-lg font-semibold ${color} mt-1`}>{displayLabel}</div>
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between w-full mt-4 text-xs text-white/40">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>
      </div>

      {/* Narrative */}
      {narrative && (
        <p className="mt-4 text-sm text-white/70 text-center border-t border-white/10 pt-4">
          {narrative}
        </p>
      )}
    </div>
  );
}
