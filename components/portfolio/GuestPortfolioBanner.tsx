'use client';

/**
 * Guest Portfolio Banner Component
 * Displays the "Endowment Effect" CTA to encourage guest users to sign up
 *
 * Psychology: By showing users the value they've built, we create ownership
 * before commitment, making sign-up feel like "claiming" rather than "starting"
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles, Lock, ArrowRight, TrendingUp } from 'lucide-react';
import { useGuestStoreHydrated } from '@/stores/useGuestStore';

interface GuestPortfolioBannerProps {
  /** Optional class name for styling */
  className?: string;
  /** Callback when sign up CTA is clicked */
  onSignUpClick?: () => void;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function GuestPortfolioBanner({
  className = '',
  onSignUpClick,
}: GuestPortfolioBannerProps) {
  const { totalValue, cards, isHydrated } = useGuestStoreHydrated();

  // Don't render anything if no guest data or not hydrated
  if (!isHydrated || cards.length === 0) {
    return null;
  }

  const formattedValue = formatCurrency(totalValue);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 via-slate-900/80 to-purple-950/50 ${className}`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse" />

      {/* Sparkle decorations */}
      <div className="absolute top-4 right-8 text-cyan-400/20">
        <Sparkles className="w-24 h-24" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left side - Value display */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                Potential Portfolio Value
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl md:text-5xl font-bold text-white font-orbitron">
                {formattedValue}
              </span>
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                Live
              </span>
            </div>

            <p className="text-slate-400 text-sm max-w-md">
              You&apos;ve added <span className="text-white font-semibold">{cards.length} card{cards.length !== 1 ? 's' : ''}</span> to
              your portfolio. Create a free account to secure your collection and unlock
              advanced analytics, price alerts, and more.
            </p>
          </div>

          {/* Right side - CTA */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <Link
              href="/signup"
              onClick={onSignUpClick}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 font-bold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40"
            >
              <Lock className="w-4 h-4" />
              <span>Claim This Portfolio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <span className="text-xs text-slate-500">
              Free forever. No credit card required.
            </span>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Bank-level encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Your data stays private</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Import/export anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version of the banner for use in sidebars or smaller spaces
 */
export function GuestPortfolioBannerCompact({
  className = '',
}: {
  className?: string;
}) {
  const { totalValue, cards, isHydrated } = useGuestStoreHydrated();

  if (!isHydrated || cards.length === 0) {
    return null;
  }

  const formattedValue = formatCurrency(totalValue);

  return (
    <div
      className={`p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-cyan-400 font-medium">Guest Portfolio</span>
        <span className="text-xs text-slate-500">{cards.length} cards</span>
      </div>

      <div className="text-2xl font-bold text-white mb-3">{formattedValue}</div>

      <Link
        href="/signup"
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium rounded-lg transition-colors"
      >
        <Lock className="w-3 h-3" />
        <span>Claim Portfolio</span>
      </Link>
    </div>
  );
}

export default GuestPortfolioBanner;
