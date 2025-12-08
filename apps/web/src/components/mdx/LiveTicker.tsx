/**
 * LiveTicker Component
 *
 * A small, inline sparkline showing price action - pure data, not opinion.
 * This component provides real-time market context without sensationalism.
 *
 * Philosophy: Data, Not Hype
 * - Shows factual price movement
 * - No "🚀" or "📈" emojis
 * - Clean, professional presentation
 *
 * Usage in MDX:
 * ```mdx
 * The Charizard Base Set 1st Edition <LiveTicker id="charizard-base-1st" /> has shown
 * consistent growth over the past quarter.
 *
 * Compared to the unlimited version <LiveTicker id="charizard-base-unlimited" trend="down" />,
 * the premium for 1st edition has increased.
 * ```
 *
 * @see Core Values: Transparency (data-driven)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface LiveTickerProps {
  /** Card/asset identifier for data fetching */
  id: string;
  /** Override trend direction (if not fetching live) */
  trend?: 'up' | 'down' | 'neutral';
  /** Override percentage change */
  change?: number;
  /** Override current price */
  price?: number;
  /** Currency symbol */
  currency?: string;
  /** Show sparkline chart */
  showSparkline?: boolean;
  /** Sparkline data points (7 values for weekly) */
  sparklineData?: number[];
  /** Compact mode (just trend indicator) */
  compact?: boolean;
}

// ============================================================================
// Mock Data (Replace with real API call)
// ============================================================================

const mockTickerData: Record<
  string,
  { price: number; change: number; trend: 'up' | 'down' | 'neutral'; sparkline: number[] }
> = {
  'charizard-base-1st': {
    price: 42500,
    change: 12.4,
    trend: 'up',
    sparkline: [38000, 39200, 40100, 38500, 41000, 42000, 42500],
  },
  'charizard-base-unlimited': {
    price: 2800,
    change: -3.2,
    trend: 'down',
    sparkline: [3100, 3050, 2950, 2900, 2850, 2820, 2800],
  },
  'pikachu-illustrator': {
    price: 5275000,
    change: 0.5,
    trend: 'neutral',
    sparkline: [5200000, 5250000, 5240000, 5260000, 5270000, 5275000, 5275000],
  },
  default: {
    price: 0,
    change: 0,
    trend: 'neutral',
    sparkline: [0, 0, 0, 0, 0, 0, 0],
  },
};

// ============================================================================
// Sparkline Mini-Chart
// ============================================================================

function Sparkline({
  data,
  trend,
  width = 60,
  height = 20,
}: {
  data: number[];
  trend: 'up' | 'down' | 'neutral';
  width?: number;
  height?: number;
}) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const strokeColor =
    trend === 'up'
      ? '#22c55e' // green-500
      : trend === 'down'
        ? '#ef4444' // red-500
        : '#64748b'; // slate-500

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export function LiveTicker({
  id,
  trend: trendOverride,
  change: changeOverride,
  price: priceOverride,
  currency = '$',
  showSparkline = true,
  sparklineData: sparklineOverride,
  compact = false,
}: LiveTickerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    price: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    sparkline: number[];
  } | null>(null);

  // Fetch/load data
  useEffect(() => {
    // Simulated API call - replace with real data fetching
    const fetchData = async () => {
      setIsLoading(true);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

      // Use mock data or defaults
      const tickerData = mockTickerData[id] || mockTickerData.default;
      setData(tickerData);
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  // Use overrides if provided
  const finalTrend = trendOverride ?? data?.trend ?? 'neutral';
  const finalChange = changeOverride ?? data?.change ?? 0;
  const finalPrice = priceOverride ?? data?.price ?? 0;
  const finalSparkline = sparklineOverride ?? data?.sparkline ?? [];

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${currency}${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      return `${currency}${(price / 1000).toFixed(1)}K`;
    }
    return `${currency}${price.toFixed(0)}`;
  };

  const formatChange = (change: number) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  // Trend icon
  const TrendIcon =
    finalTrend === 'up'
      ? TrendingUp
      : finalTrend === 'down'
        ? TrendingDown
        : Minus;

  // Loading state
  if (isLoading) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded',
          'bg-slate-800/50 border border-slate-700/50',
          'text-slate-500 text-xs'
        )}
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        {!compact && <span>Loading...</span>}
      </span>
    );
  }

  // Compact mode - just trend indicator
  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded',
          'text-xs font-medium',
          finalTrend === 'up' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          finalTrend === 'down' && 'bg-red-500/20 text-red-400 border border-red-500/30',
          finalTrend === 'neutral' && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
        )}
        title={`${formatPrice(finalPrice)} (${formatChange(finalChange)})`}
      >
        <TrendIcon className="w-3 h-3" />
        <span>{formatChange(finalChange)}</span>
      </span>
    );
  }

  // Full mode with sparkline
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-2 py-1 rounded-lg',
        'bg-slate-800/50 border border-slate-700/50',
        'hover:border-slate-600/50 transition-colors',
        'text-xs cursor-default'
      )}
      title={`${id}: ${formatPrice(finalPrice)} (${formatChange(finalChange)} 7d)`}
    >
      {/* Price */}
      <span className="font-bold text-slate-200">{formatPrice(finalPrice)}</span>

      {/* Sparkline */}
      {showSparkline && finalSparkline.length > 0 && (
        <Sparkline data={finalSparkline} trend={finalTrend} />
      )}

      {/* Change with Trend Icon */}
      <span
        className={clsx(
          'inline-flex items-center gap-0.5 font-medium',
          finalTrend === 'up' && 'text-emerald-400',
          finalTrend === 'down' && 'text-red-400',
          finalTrend === 'neutral' && 'text-slate-500'
        )}
      >
        <TrendIcon className="w-3 h-3" />
        {formatChange(finalChange)}
      </span>
    </span>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Compact trend badge (minimal space)
 */
export function TrendBadge(props: Omit<LiveTickerProps, 'compact' | 'showSparkline'>) {
  return <LiveTicker {...props} compact showSparkline={false} />;
}

/**
 * Price-only display (no sparkline)
 */
export function PriceTicker(props: Omit<LiveTickerProps, 'showSparkline'>) {
  return <LiveTicker {...props} showSparkline={false} />;
}

export default LiveTicker;
