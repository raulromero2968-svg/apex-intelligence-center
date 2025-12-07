'use client';

import { motion } from 'framer-motion';
import { HeroTransformation } from '@/components/hero-transformation';

/**
 * Transform Page - The "Clean Room"
 *
 * This is the most focused page in the application.
 * No sidebars, no distractions - just the Command Center.
 *
 * Design Philosophy:
 * - Strips away everything except the input
 * - Subtle ambient background creates "void" feeling
 * - System status indicators add credibility
 * - The user's attention is funneled to ONE action
 */
export default function TransformPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience (The "Void") */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-breathing" />

        {/* Secondary accent glow */}
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] animate-breathing" style={{ animationDelay: '1s' }} />
      </div>

      {/* The Command Interface */}
      <div className="relative z-10 w-full">
        <HeroTransformation />
      </div>

      {/* Contextual Footer - System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-24 md:bottom-10 left-0 right-0 text-center text-xs text-muted-foreground font-mono space-y-1"
      >
        <p>
          SYSTEM STATUS:{' '}
          <span className="text-emerald-500 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </p>
        <p>
          DOOMSCROLLING PROTECTION:{' '}
          <span className="text-[#00F0FF]">ACTIVE</span>
        </p>
      </motion.div>
    </div>
  );
}
