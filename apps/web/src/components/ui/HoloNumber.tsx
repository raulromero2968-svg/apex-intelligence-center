"use client";

import { FC, useMemo } from 'react';

export interface HoloNumberProps {
  value: number | string;
  type?: 'price' | 'percent' | 'stat';
  className?: string;
  glitchIntensity?: 'low' | 'medium' | 'high';
  colorScheme?: 'cyan' | 'emerald' | 'amber' | 'rose';
}

/**
 * HoloNumber Component
 *
 * Displays numbers with cyberpunk holographic styling and optional glitch effects.
 * Designed for market prices, percentages, and statistics in the Apex Intelligence Center.
 *
 * Features:
 * - GPU-accelerated text shadow animations
 * - Color-coded schemes for different data types
 * - Glitch intensity control
 * - Monospace font (JetBrains Mono) for consistent alignment
 *
 * @example
 * <HoloNumber value={2000} type="price" colorScheme="cyan" />
 * <HoloNumber value={18.5} type="percent" glitchIntensity="high" />
 */
export const HoloNumber: FC<HoloNumberProps> = ({
  value,
  type = 'stat',
  className = '',
  glitchIntensity = 'low',
  colorScheme = 'cyan',
}) => {
  // Format value based on type
  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return value;

    switch (type) {
      case 'price':
        return `$${value.toLocaleString('en-US')}`;
      case 'percent':
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
      case 'stat':
      default:
        return value.toLocaleString('en-US');
    }
  }, [value, type]);

  // Color scheme mapping
  const colorClasses = useMemo(() => {
    const schemes = {
      cyan: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
      emerald: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      amber: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
      rose: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    };
    return schemes[colorScheme];
  }, [colorScheme]);

  // Glitch animation classes
  const glitchClasses = useMemo(() => {
    const intensities = {
      low: 'hover:animate-pulse',
      medium: 'hover:animate-holo-glitch',
      high: 'animate-holo-glitch',
    };
    return intensities[glitchIntensity];
  }, [glitchIntensity]);

  return (
    <span
      className={`
        inline-block
        font-holo-mono
        font-bold
        tabular-nums
        transition-all
        duration-200
        ${colorClasses}
        ${glitchClasses}
        ${className}
      `}
      style={{
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
      }}
    >
      {formattedValue}
    </span>
  );
};

export default HoloNumber;
