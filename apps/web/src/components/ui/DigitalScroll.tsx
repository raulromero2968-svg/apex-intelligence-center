'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface DigitalScrollProps {
  height?: string;
  children: ReactNode;
  className?: string;
}

/**
 * DigitalScroll - Constrained height container with high-tech custom scrollbar
 * Use for: Article feeds, long content lists, data streams
 */
export function DigitalScroll({
  height = 'h-[600px]',
  children,
  className,
}: DigitalScrollProps) {
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
          // Custom scrollbar styling
          '[&::-webkit-scrollbar]:w-2',
          '[&::-webkit-scrollbar-track]:bg-slate-900/50',
          '[&::-webkit-scrollbar-track]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:bg-gradient-to-b',
          '[&::-webkit-scrollbar-thumb]:from-cyan-500',
          '[&::-webkit-scrollbar-thumb]:to-cyan-600',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:border-2',
          '[&::-webkit-scrollbar-thumb]:border-slate-900/50',
          'hover:[&::-webkit-scrollbar-thumb]:from-cyan-400',
          'hover:[&::-webkit-scrollbar-thumb]:to-cyan-500',
          // Firefox scrollbar
          'scrollbar-thin',
          'scrollbar-track-slate-900/50',
          'scrollbar-thumb-cyan-500'
        )}
      >
        {children}
      </div>

      {/* Decorative side indicators */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[1px] h-24 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default DigitalScroll;
