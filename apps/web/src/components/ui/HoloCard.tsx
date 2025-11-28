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
 * HoloCard - High-emphasis glassmorphism container with ethereal fading edges
 * Use for: Subscription forms, CTAs, featured content
 *
 * Features:
 * - Soft, fading ethereal edges for true holographic effect
 * - Animated breathing border with cyan/purple gradient
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
      borderOpacity: 'border-cyan-500/20',
      glowSize: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      scanlineOpacity: 'opacity-[0.02]',
      breathingOpacity: 'opacity-20',
      fadeSize: 'blur-[6px]',
    },
    medium: {
      borderOpacity: 'border-cyan-500/30',
      glowSize: 'shadow-[0_0_50px_rgba(6,182,212,0.25)]',
      scanlineOpacity: 'opacity-[0.03]',
      breathingOpacity: 'opacity-30',
      fadeSize: 'blur-[8px]',
    },
    high: {
      borderOpacity: 'border-cyan-400/40',
      glowSize: 'shadow-[0_0_70px_rgba(6,182,212,0.4)]',
      scanlineOpacity: 'opacity-[0.04]',
      breathingOpacity: 'opacity-50',
      fadeSize: 'blur-[10px]',
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
      {/* Outer ethereal glow - creates the holographic atmosphere */}
      <div
        className={clsx(
          'absolute -inset-8 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl',
          'group-hover:from-cyan-500/15 group-hover:via-purple-500/15 group-hover:to-pink-500/15',
          'transition-all duration-1000',
          'animate-breathing'
        )}
      />

      {/* Animated Breathing Border Gradient with soft fade */}
      <div
        className={clsx(
          'absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-2xl',
          config.fadeSize,
          'group-hover:opacity-75 transition duration-1000 group-hover:duration-200',
          'animate-breathing',
          config.breathingOpacity
        )}
      />

      {/* Fading edge overlay - creates the soft ethereal holographic border */}
      <div className="absolute -inset-0.5 rounded-2xl overflow-hidden pointer-events-none">
        {/* Top edge fade - softer and wider */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-cyan-400/15 via-cyan-400/5 to-transparent blur-lg" />
        {/* Bottom edge fade - softer and wider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-purple-400/15 via-purple-400/5 to-transparent blur-lg" />
        {/* Left edge fade - softer and wider */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-cyan-400/15 via-cyan-400/5 to-transparent blur-lg" />
        {/* Right edge fade - softer and wider */}
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-purple-400/15 via-purple-400/5 to-transparent blur-lg" />
        
        {/* Corner glows for extra ethereal effect - softer */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-400/15 rounded-full blur-2xl" />
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/15 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-400/15 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-pink-400/15 rounded-full blur-2xl" />
      </div>

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
              linear-gradient(90deg, rgba(6,182,212,0.06), rgba(168,85,247,0.02), rgba(236,72,153,0.06))
            `,
            backgroundSize: '100% 4px, 3px 100%',
          }}
        />

        {/* Corner Accents - Intel/HUD aesthetic with soft glow */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400/50 pointer-events-none shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400/50 pointer-events-none shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-pink-400/50 pointer-events-none shadow-[0_0_12px_rgba(236,72,153,0.5)]" />

        {/* Ambient glow spots - softer */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default HoloCard;
