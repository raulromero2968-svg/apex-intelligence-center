'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * HoloCard - High-emphasis glassmorphism container with animated breathing border
 * Use for: Subscription forms, CTAs, featured content
 *
 * Features:
 * - Animated breathing border with cyan/blue gradient
 * - Corner accent brackets (Intel aesthetic)
 * - Scanline overlay effect
 * - Three intensity levels for visual emphasis
 */
export function HoloCard({
  children,
  className,
  intensity = 'medium'
}: HoloCardProps) {
  const intensityConfig = {
    low: {
      borderOpacity: 'border-cyan-500/30',
      glowSize: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      scanlineOpacity: 'opacity-[0.02]',
      breathingOpacity: 'opacity-20',
    },
    medium: {
      borderOpacity: 'border-cyan-500/50',
      glowSize: 'shadow-[0_0_40px_rgba(6,182,212,0.25)]',
      scanlineOpacity: 'opacity-[0.03]',
      breathingOpacity: 'opacity-30',
    },
    high: {
      borderOpacity: 'border-cyan-400/70',
      glowSize: 'shadow-[0_0_60px_rgba(6,182,212,0.4)]',
      scanlineOpacity: 'opacity-[0.04]',
      breathingOpacity: 'opacity-50',
    },
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={clsx(
        'relative group',
        className
      )}
    >
      {/* Animated Breathing Border Gradient */}
      <div
        className={clsx(
          'absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 rounded-2xl blur-sm',
          'group-hover:opacity-75 transition duration-1000 group-hover:duration-200',
          'animate-breathing',
          config.breathingOpacity
        )}
      />

      {/* Main Container */}
      <div className={clsx(
        'relative overflow-hidden rounded-2xl',
        'bg-slate-950/90 backdrop-blur-xl',
        'border',
        config.borderOpacity,
        config.glowSize
      )}>
        {/* Scanline Effect */}
        <div
          className={clsx(
            'absolute inset-0 pointer-events-none rounded-2xl overflow-hidden',
            config.scanlineOpacity
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%),
              linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))
            `,
            backgroundSize: '100% 4px, 3px 100%',
          }}
        />

        {/* Corner Accents - Intel/HUD aesthetic */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

        {/* Ambient glow spots */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default HoloCard;
