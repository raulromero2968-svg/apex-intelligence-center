'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Eye, User } from 'lucide-react';

export interface IntelCardProps {
  title: string;
  excerpt: string;
  author: string;
  rcPrice: number;
  usdPrice: number;
  views: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  className?: string;
}

/**
 * IntelCard - Intelligence Report Preview Card
 *
 * Used for displaying processed intel reports with:
 * - Title and excerpt
 * - Author attribution
 * - Pricing (RC + USD)
 * - View count
 * - Sentiment indicator (bullish/bearish/neutral)
 * - Quality grade (S/A/B/C/D)
 */
export function IntelCard({
  title,
  excerpt,
  author,
  rcPrice,
  usdPrice,
  views,
  sentiment,
  grade,
  className,
}: IntelCardProps) {
  const gradeColors = {
    S: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/30',
    A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    B: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    C: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    D: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  const sentimentConfig = {
    bullish: {
      icon: TrendingUp,
      color: 'text-emerald-400',
      label: 'Bullish',
    },
    bearish: {
      icon: TrendingDown,
      color: 'text-red-400',
      label: 'Bearish',
    },
    neutral: {
      icon: TrendingUp,
      color: 'text-slate-400',
      label: 'Neutral',
    },
  };

  const SentimentIcon = sentimentConfig[sentiment].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx(
        'relative overflow-hidden rounded-lg',
        'bg-slate-950/90 backdrop-blur-xl',
        'border border-cyan-500/20',
        'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
        'hover:border-cyan-500/40 hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]',
        'transition-all duration-300',
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-purple-400/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-purple-400/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-400/40 pointer-events-none" />

      {/* Header with grade badge */}
      <div className="relative p-5 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Grade Badge */}
          <div
            className={clsx(
              'flex-shrink-0 w-10 h-10 rounded flex items-center justify-center',
              'font-mono text-lg font-bold border',
              gradeColors[grade]
            )}
          >
            {grade}
          </div>
        </div>

        {/* Author */}
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span className="font-mono">{author}</span>
        </div>
      </div>

      {/* Excerpt */}
      <div className="px-5 py-3">
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {excerpt}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-slate-700/50" />

      {/* Footer metrics */}
      <div className="p-4 flex items-center justify-between text-sm">
        {/* Left: Pricing */}
        <div className="flex items-center gap-3">
          <div className="font-mono">
            <span className="text-[#00F0FF] font-semibold">{rcPrice} RC</span>
            <span className="text-muted-foreground ml-1.5">≈ ${usdPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Right: Views + Sentiment */}
        <div className="flex items-center gap-4">
          {/* Views */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="font-mono text-xs">{views.toLocaleString()}</span>
          </div>

          {/* Sentiment */}
          <div
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded',
              'bg-slate-800/50 border border-slate-700/50',
              sentimentConfig[sentiment].color
            )}
          >
            <SentimentIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{sentimentConfig[sentiment].label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default IntelCard;
