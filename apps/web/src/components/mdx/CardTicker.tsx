/**
 * CardTicker Component
 *
 * Displays a live card price ticker inline with text.
 * Shows: Card name, current price, and percent change (green/red).
 *
 * Usage in MDX:
 * ```mdx
 * The <CardTicker id="charizard-base-set" name="Charizard" price={350} change={12.5} /> is up this week.
 * ```
 *
 * @see lib/mdx.ts for component registration
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

// ============================================================================
// Types
// ============================================================================

export interface CardTickerProps {
  /** TCGPlayer or internal card ID for linking */
  id: string;
  /** Display name of the card */
  name?: string;
  /** Current price in USD (can be fetched dynamically) */
  price?: number;
  /** Percent change (positive = up, negative = down) */
  change?: number;
  /** Link to card detail page */
  href?: string;
  /** Whether to show as inline or block */
  inline?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Component
// ============================================================================

export function CardTicker({
  id,
  name,
  price,
  change = 0,
  href,
  inline = true,
  size = 'md',
}: CardTickerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(price);
  const [displayChange, setDisplayChange] = useState(change);

  // Determine trend direction
  const trend = displayChange > 0 ? 'up' : displayChange < 0 ? 'down' : 'neutral';

  // Format price
  const formattedPrice = displayPrice
    ? `$${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '--';

  // Format change percentage
  const formattedChange = displayChange
    ? `${displayChange > 0 ? '+' : ''}${displayChange.toFixed(1)}%`
    : '0.0%';

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  // Trend color classes
  const trendColors = {
    up: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
    down: 'text-red-400 border-red-500/40 bg-red-950/30',
    neutral: 'text-slate-400 border-slate-500/40 bg-slate-900/30',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const content = (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-mono font-medium transition-all duration-200',
        'border backdrop-blur-sm',
        sizeClasses[size],
        trendColors[trend],
        isHovered && 'shadow-lg scale-105',
        inline ? 'inline-flex' : 'flex'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Name */}
      {name && (
        <span className="text-white font-semibold truncate max-w-[120px]">
          {name}
        </span>
      )}

      {/* Price */}
      <span className="text-cyan-300 font-bold">
        {formattedPrice}
      </span>

      {/* Change Indicator */}
      <span className={clsx(
        'inline-flex items-center gap-0.5',
        trend === 'up' && 'text-emerald-400',
        trend === 'down' && 'text-red-400',
        trend === 'neutral' && 'text-slate-500'
      )}>
        <TrendIcon className={clsx(
          size === 'sm' && 'w-3 h-3',
          size === 'md' && 'w-3.5 h-3.5',
          size === 'lg' && 'w-4 h-4'
        )} />
        <span className="font-medium">
          {formattedChange}
        </span>
      </span>

      {/* Live indicator dot */}
      <span className="relative flex h-2 w-2">
        <span className={clsx(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          trend === 'up' && 'bg-emerald-400',
          trend === 'down' && 'bg-red-400',
          trend === 'neutral' && 'bg-slate-400'
        )} />
        <span className={clsx(
          'relative inline-flex rounded-full h-2 w-2',
          trend === 'up' && 'bg-emerald-500',
          trend === 'down' && 'bg-red-500',
          trend === 'neutral' && 'bg-slate-500'
        )} />
      </span>
    </span>
  );

  // If href provided, wrap in link
  if (href) {
    return (
      <Link
        href={href}
        className="no-underline hover:no-underline"
        aria-label={`View ${name || id} card details`}
      >
        {content}
      </Link>
    );
  }

  // Default: link to card detail page
  const defaultHref = `/cards/${id}`;

  return (
    <Link
      href={defaultHref}
      className="no-underline hover:no-underline"
      aria-label={`View ${name || id} card details`}
    >
      {content}
    </Link>
  );
}

export default CardTicker;
