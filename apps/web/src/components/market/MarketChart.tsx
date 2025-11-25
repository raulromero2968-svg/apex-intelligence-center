'use client';

/**
 * Market Chart - TCG market visualization
 *
 * Displays market trends with interactive charts.
 * Uses mock data with pattern for production API integration.
 */

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MarketDataPoint {
  date: string;
  price: number;
  volume: number;
  change: number;
}

interface MarketChartProps {
  title?: string;
  height?: number;
  showVolume?: boolean;
  className?: string;
}

export function MarketChart({
  title = 'TCG Market Index',
  height = 300,
  showVolume = true,
  className,
}: MarketChartProps) {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1W');
  const [hoveredPoint, setHoveredPoint] = useState<MarketDataPoint | null>(null);

  // Generate mock market data
  useEffect(() => {
    const generateData = () => {
      const points: MarketDataPoint[] = [];
      const now = new Date();
      const days = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90;

      let basePrice = 1000 + Math.random() * 500;

      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        if (timeframe === '1D') {
          date.setHours(date.getHours() - i);
        } else {
          date.setDate(date.getDate() - i);
        }

        const change = (Math.random() - 0.45) * 50;
        basePrice = Math.max(500, basePrice + change);

        points.push({
          date: date.toISOString(),
          price: Math.round(basePrice * 100) / 100,
          volume: Math.floor(Math.random() * 10000) + 1000,
          change: Math.round(change * 100) / 100,
        });
      }

      return points;
    };

    setLoading(true);
    setTimeout(() => {
      setData(generateData());
      setLoading(false);
    }, 500);
  }, [timeframe]);

  // Calculate chart bounds
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 0, priceRange: 0, maxVolume: 0 };

    const prices = data.map((d) => d.price);
    const volumes = data.map((d) => d.volume);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      minPrice: min,
      maxPrice: max,
      priceRange: max - min || 1,
      maxVolume: Math.max(...volumes),
    };
  }, [data]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (data.length < 2) return { value: 0, percent: 0 };
    const first = data[0].price;
    const last = data[data.length - 1].price;
    return {
      value: Math.round((last - first) * 100) / 100,
      percent: Math.round(((last - first) / first) * 10000) / 100,
    };
  }, [data]);

  const currentPrice = data[data.length - 1]?.price || 0;

  // Generate SVG path
  const generatePath = () => {
    if (data.length === 0) return '';

    const chartHeight = height - 60;
    const chartWidth = 100; // percentage

    return data
      .map((point, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate area path (for gradient fill)
  const generateAreaPath = () => {
    const path = generatePath();
    if (!path) return '';

    const chartHeight = height - 60;
    return `${path} L 100 ${chartHeight} L 0 ${chartHeight} Z`;
  };

  if (loading) {
    return (
      <div
        className={cn('bg-gray-800/50 rounded-xl p-6 animate-pulse', className)}
        style={{ height }}
      >
        <div className="h-6 bg-gray-700 rounded w-40 mb-4" />
        <div className="h-full bg-gray-700/50 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('bg-gray-800/50 rounded-xl p-6 border border-gray-700', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold text-white">
              ${currentPrice.toLocaleString()}
            </span>
            <span
              className={cn(
                'text-sm font-medium px-2 py-0.5 rounded',
                priceChange.percent >= 0
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-red-400 bg-red-500/20'
              )}
            >
              {priceChange.percent >= 0 ? '+' : ''}
              {priceChange.percent}%
            </span>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
          {(['1D', '1W', '1M', '3M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors',
                timeframe === tf
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        className="relative"
        style={{ height: height - 100 }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg
          viewBox={`0 0 100 ${height - 60}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor={priceChange.percent >= 0 ? '#22c55e' : '#ef4444'}
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor={priceChange.percent >= 0 ? '#22c55e' : '#ef4444'}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={((height - 60) * y) / 100}
              x2="100"
              y2={((height - 60) * y) / 100}
              stroke="#374151"
              strokeWidth="0.2"
            />
          ))}

          {/* Area fill */}
          <path d={generateAreaPath()} fill="url(#chartGradient)" />

          {/* Line */}
          <path
            d={generatePath()}
            fill="none"
            stroke={priceChange.percent >= 0 ? '#22c55e' : '#ef4444'}
            strokeWidth="0.5"
          />
        </svg>

        {/* Interactive overlay */}
        <div className="absolute inset-0 flex">
          {data.map((point, i) => (
            <div
              key={i}
              className="flex-1 cursor-crosshair"
              onMouseEnter={() => setHoveredPoint(point)}
            />
          ))}
        </div>

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-2 bg-gray-900/90 rounded-lg p-3 text-sm border border-gray-700">
            <p className="text-gray-400 text-xs">
              {new Date(hoveredPoint.date).toLocaleDateString()}
            </p>
            <p className="text-white font-bold">${hoveredPoint.price.toLocaleString()}</p>
            {showVolume && (
              <p className="text-gray-400 text-xs">
                Vol: {hoveredPoint.volume.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Volume bars */}
      {showVolume && (
        <div className="flex items-end h-12 mt-2 gap-px">
          {data.map((point, i) => (
            <div
              key={i}
              className="flex-1 bg-cyan-500/30 rounded-t"
              style={{ height: `${(point.volume / maxVolume) * 100}%` }}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>
          {new Date(data[0]?.date || '').toLocaleDateString()}
        </span>
        <span>
          {new Date(data[data.length - 1]?.date || '').toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default MarketChart;
