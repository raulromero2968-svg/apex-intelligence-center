'use client';

import React from 'react';
import clsx from 'clsx';

/**
 * Evidence Tier Levels - The Truth Tier System
 *
 * These tiers reflect journalistic standards of verification,
 * ensuring transparency about the strength of each claim.
 *
 * | Tier       | Meaning                                     | Visual           |
 * |------------|---------------------------------------------|------------------|
 * | CONFIRMED  | Court documents, official records           | Green / Gavel    |
 * | DOCUMENTED | Credible journalism, multiple sources       | Blue / Shield    |
 * | ALLEGED    | Single source, unverified but plausible     | Yellow / File    |
 * | SPECULATIVE| Pattern-based inference, needs more evidence| Red / Warning    |
 */
export type EvidenceTier = 'SPECULATIVE' | 'ALLEGED' | 'DOCUMENTED' | 'CONFIRMED';

/**
 * Power Domain Types - Seven Mountains Framework
 */
export type PowerDomain =
  | 'RELIGION'
  | 'FAMILY'
  | 'EDUCATION'
  | 'GOVERNMENT'
  | 'MEDIA'
  | 'ARTS'
  | 'BUSINESS';

export interface SourceCardProps {
  /** The relationship or claim description */
  description: string;
  /** Evidence tier level */
  evidenceTier: EvidenceTier;
  /** Source citation (URL, document reference, or description) */
  citation: string;
  /** Power domain category */
  domain: PowerDomain;
  /** Optional financial amount if applicable */
  financialAmount?: string;
  /** Optional date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
  /** Optional callback when card is clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for each evidence tier
 * Maps tiers to visual styling and icons
 */
const TierConfig: Record<
  EvidenceTier,
  {
    label: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    glowColor: string;
    icon: React.ReactNode;
  }
> = {
  SPECULATIVE: {
    label: 'Speculative',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-950/30',
    textColor: 'text-red-400',
    glowColor: 'shadow-red-500/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  ALLEGED: {
    label: 'Alleged',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-950/30',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  DOCUMENTED: {
    label: 'Documented',
    borderColor: 'border-cyan-500/50',
    bgColor: 'bg-cyan-950/30',
    textColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  CONFIRMED: {
    label: 'Confirmed',
    borderColor: 'border-green-500/50',
    bgColor: 'bg-green-950/30',
    textColor: 'text-green-400',
    glowColor: 'shadow-green-500/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
};

/**
 * Domain badge colors
 */
const DomainColors: Record<PowerDomain, string> = {
  RELIGION: 'text-purple-400 border-purple-500/30',
  FAMILY: 'text-pink-400 border-pink-500/30',
  EDUCATION: 'text-blue-400 border-blue-500/30',
  GOVERNMENT: 'text-slate-400 border-slate-500/30',
  MEDIA: 'text-orange-400 border-orange-500/30',
  ARTS: 'text-rose-400 border-rose-500/30',
  BUSINESS: 'text-emerald-400 border-emerald-500/30',
};

/**
 * SourceCard Component
 *
 * Visualizes the "Truth Tier" evidence system for power network relationships.
 * Designed to appear when a user clicks a connection in the network graph.
 *
 * The card displays:
 * - Evidence tier badge (CONFIRMED/DOCUMENTED/ALLEGED/SPECULATIVE)
 * - Power domain classification (Seven Mountains)
 * - Relationship description
 * - Source citation
 * - Optional financial amounts and date ranges
 *
 * @example
 * ```tsx
 * <SourceCard
 *   description="Paid $158M for financial advice"
 *   evidenceTier="CONFIRMED"
 *   citation="Apollo internal review, 2021"
 *   domain="BUSINESS"
 *   financialAmount="$158M"
 *   dateRange={{ start: "2012", end: "2017" }}
 * />
 * ```
 */
export function SourceCard({
  description,
  evidenceTier,
  citation,
  domain,
  financialAmount,
  dateRange,
  onClick,
  className,
}: SourceCardProps) {
  const tier = TierConfig[evidenceTier];
  const domainColor = DomainColors[domain];

  return (
    <div
      className={clsx(
        'relative group w-full max-w-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Animated border glow based on evidence tier */}
      <div
        className={clsx(
          'absolute -inset-0.5 rounded-lg blur-sm transition-opacity duration-300',
          tier.bgColor,
          'opacity-0 group-hover:opacity-100'
        )}
      />

      {/* Main card container */}
      <div
        className={clsx(
          'relative bg-slate-950 border-l-4 rounded-lg overflow-hidden',
          'transition-all duration-300',
          'hover:shadow-lg',
          tier.borderColor,
          tier.glowColor
        )}
      >
        {/* Scanline effect overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Header section */}
        <div className="relative z-10 px-4 pt-4 pb-2">
          <div className="flex justify-between items-start gap-2">
            {/* Domain badge */}
            <span
              className={clsx(
                'text-[10px] font-mono uppercase tracking-wider px-2 py-0.5',
                'border rounded',
                domainColor
              )}
            >
              {domain}
            </span>

            {/* Evidence tier badge */}
            <div
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold',
                tier.bgColor,
                tier.textColor
              )}
            >
              {tier.icon}
              <span>{tier.label}</span>
            </div>
          </div>

          {/* Description */}
          <h3 className="text-slate-100 font-medium mt-3 text-sm leading-relaxed">
            {description}
          </h3>

          {/* Financial amount if present */}
          {financialAmount && (
            <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-mono">{financialAmount}</span>
            </div>
          )}

          {/* Date range if present */}
          {dateRange && (dateRange.start || dateRange.end) && (
            <div className="mt-1 flex items-center gap-1.5 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-mono">
                {dateRange.start || '?'} - {dateRange.end || 'ongoing'}
              </span>
            </div>
          )}
        </div>

        {/* Citation footer */}
        <div className="relative z-10 px-4 py-2.5 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-start gap-2">
            <svg
              className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="text-xs text-slate-400 leading-relaxed">
              {citation}
            </span>
          </div>
        </div>

        {/* Corner accents */}
        <div className={clsx('absolute top-0 right-0 w-2 h-2 border-t border-r', tier.borderColor)} />
        <div className={clsx('absolute bottom-0 right-0 w-2 h-2 border-b border-r', tier.borderColor)} />
      </div>
    </div>
  );
}

/**
 * SourceCardSkeleton - Loading state for SourceCard
 */
export function SourceCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative w-full max-w-md bg-slate-950 border-l-4 border-slate-700 rounded-lg overflow-hidden',
        className
      )}
    >
      <div className="px-4 pt-4 pb-2 animate-pulse">
        <div className="flex justify-between items-start gap-2">
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-24 bg-slate-800 rounded" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-3/4" />
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-800/50 bg-slate-900/50 animate-pulse">
        <div className="h-3 bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export default SourceCard;
