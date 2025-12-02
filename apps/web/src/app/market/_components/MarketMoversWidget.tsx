'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Mover {
  cardName: string;
  setName: string;
  currentPrice: number;
  changePercentage: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isManipulated?: boolean;
}

interface MarketMoversWidgetProps {
  movers: Mover[];
  title?: string;
}

/**
 * Market Movers Widget
 *
 * Displays top gainers/losers with real-time price changes.
 * Includes manipulation warnings from VARC system.
 */
export function MarketMoversWidget({ movers, title = 'Top Movers' }: MarketMoversWidgetProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="flex gap-1">
          <button className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            24h
          </button>
          <button className="px-2 py-1 text-xs rounded text-white/50 hover:bg-white/10 transition-colors">
            7d
          </button>
        </div>
      </div>

      {/* Movers List */}
      <div className="divide-y divide-white/5">
        {movers.map((mover, index) => (
          <div
            key={`${mover.cardName}-${index}`}
            className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer group"
          >
            {/* Rank */}
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/60">
              {index + 1}
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">{mover.cardName}</span>
                {mover.isManipulated && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    VARC
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 truncate">{mover.setName}</div>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-medium text-white tabular-nums">
                {formatPrice(mover.currentPrice)}
              </div>
              <div
                className={`flex items-center justify-end gap-1 text-sm tabular-nums ${
                  mover.changePercentage > 0
                    ? 'text-green-400'
                    : mover.changePercentage < 0
                    ? 'text-red-400'
                    : 'text-white/50'
                }`}
              >
                {mover.changePercentage > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : mover.changePercentage < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {formatChange(mover.changePercentage)}
              </div>
            </div>

            {/* Sentiment Indicator */}
            <div
              className={`w-2 h-8 rounded-full ${
                mover.sentiment === 'bullish'
                  ? 'bg-green-500'
                  : mover.sentiment === 'bearish'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              } opacity-60 group-hover:opacity-100 transition-opacity`}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/5">
        <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          View All Movers &rarr;
        </button>
      </div>
    </div>
  );
}
