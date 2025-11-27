'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface DigitalScrollProps {
  height?: string;
  children: ReactNode;
  className?: string;
  variant?: 'cyan' | 'purple';
}

/**
 * DigitalScroll - Constrained height container with high-tech custom scrollbar
 * Use for: Article feeds, long content lists, data streams
 *
 * Features:
 * - Custom cyan/purple gradient scrollbar
 * - Top/bottom fade gradients for terminal readout effect
 * - Configurable height
 * - Side indicator accent line
 */
export function DigitalScroll({
  height = 'h-[600px]',
  children,
  className,
  variant = 'cyan',
}: DigitalScrollProps) {
  const scrollbarClass = variant === 'purple' ? 'scrollbar-thin-purple' : 'scrollbar-thin';
  const accentColor = variant === 'purple' ? 'via-purple-500/50' : 'via-cyan-500/50';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'relative overflow-hidden rounded-lg',
        'border border-slate-800/50',
        'bg-slate-950/40 backdrop-blur-sm',
        className
      )}
    >
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-4 h-8 bg-gradient-to-b from-slate-950/90 to-transparent z-10 pointer-events-none" />

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-4 h-8 bg-gradient-to-t from-slate-950/90 to-transparent z-10 pointer-events-none" />

      {/* Scrollable content with custom scrollbar */}
      <div
        className={clsx(
          'overflow-y-auto',
          height,
          'px-4 py-6',
          scrollbarClass
        )}
      >
        {children}
      </div>

      {/* Decorative side indicator */}
      <div className={clsx(
        'absolute top-1/2 right-0 -translate-y-1/2 w-[1px] h-24',
        `bg-gradient-to-b from-transparent ${accentColor} to-transparent`,
        'pointer-events-none'
      )} />
    </motion.div>
  );
}

export default DigitalScroll;
