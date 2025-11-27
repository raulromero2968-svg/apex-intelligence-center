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
    },
    medium: {
      borderOpacity: 'border-cyan-500/50',
      glowSize: 'shadow-[0_0_40px_rgba(6,182,212,0.25)]',
      scanlineOpacity: 'opacity-[0.03]',
    },
    high: {
      borderOpacity: 'border-cyan-400/70',
      glowSize: 'shadow-[0_0_60px_rgba(6,182,212,0.4)]',
      scanlineOpacity: 'opacity-[0.04]',
    },
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        'bg-slate-950/80 backdrop-blur-xl',
        config.glowSize,
        className
      )}
    >
      {/* Animated breathing border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.6), rgba(59,130,246,0.4), rgba(6,182,212,0.6))',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner container to create border effect */}
      <div className={clsx(
        'relative m-[1px] rounded-2xl',
        'bg-slate-950/95 backdrop-blur-xl',
        'border',
        config.borderOpacity
      )}>
        {/* Scanline overlay */}
        <div
          className={clsx(
            'absolute inset-0 pointer-events-none rounded-2xl overflow-hidden',
            config.scanlineOpacity
          )}
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.5) 2px, rgba(6,182,212,0.5) 4px)',
            backgroundSize: '100% 4px',
          }}
        />

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
