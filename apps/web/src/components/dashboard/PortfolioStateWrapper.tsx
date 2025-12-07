'use client';

/**
 * PortfolioStateWrapper
 *
 * A state-aware component implementing the "Endowment Effect" UX pattern.
 * Seamlessly switches between guest and authenticated states to maximize conversion.
 *
 * States:
 * - Loading: Skeleton loader during hydration
 * - Authenticated: Standard portfolio summary
 * - Guest with Data: High-urgency "Unclaimed Portfolio" banner
 * - Guest Empty: Low-friction "Get Started" prompt
 */

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { useGuestStoreHydrated, useGuestStore } from '@/stores/useGuestStore';

// ============================================================================
// MOCK COMPONENT: Replace with real implementation
// ============================================================================
function RealPortfolioSummary({ user }: { user: { name?: string; email: string } }) {
  return (
    <div className="card-apex-elevated p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
            Your Portfolio
          </p>
          <p className="text-3xl font-bold text-white font-mono">
            $12,450.00
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">
            Welcome back, {user.name || user.email.split('@')[0]}
          </p>
          <p className="text-sm text-emerald-400">+$234.50 today</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
function PortfolioSkeleton() {
  return (
    <div className="card-apex p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-slate-700/50" />
          <div className="h-8 w-40 rounded bg-slate-700/50" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-32 rounded bg-slate-700/50 ml-auto" />
          <div className="h-4 w-24 rounded bg-slate-700/50 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE: Guest with no data
// ============================================================================
function EmptyGuestState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card-apex border-dashed border-slate-700 p-8 text-center"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900/50">
        <svg
          className="h-8 w-8 text-cyan-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m6-6H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Start Building Your Portfolio
      </h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
        Add cards to track their value in real-time. No account required to get started.
      </p>
      <Link
        href="/search"
        className="btn-apex-secondary inline-flex items-center gap-2"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Search Cards
      </Link>
    </motion.div>
  );
}

// ============================================================================
// ACTIVE GUEST STATE: The Endowment Effect Banner
// ============================================================================
function ActiveGuestBanner({
  totalValue,
  cardCount,
}: {
  totalValue: number;
  cardCount: number;
}) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalValue);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] md:p-8"
    >
      {/* Background Grid FX */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Animated Glow Pulse */}
      <motion.div
        className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10">
        {/* Status Badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Unclaimed Portfolio
          </span>
        </div>

        {/* Value Display */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Your collection value
          </p>
          <div className="flex items-baseline gap-3">
            <motion.span
              key={totalValue}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-emerald-400 font-mono md:text-5xl"
              style={{
                textShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
              }}
            >
              {formattedValue}
            </motion.span>
            <span className="text-sm text-slate-500">
              ({cardCount} {cardCount === 1 ? 'card' : 'cards'})
            </span>
          </div>
        </div>

        {/* Urgency Message */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div>
            <p className="text-sm text-slate-300">
              Create a free account to{' '}
              <span className="font-semibold text-white">save this portfolio</span>{' '}
              and track real-time price changes.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your data is stored locally and will be lost if you clear your browser.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/sign-up?intent=claim_guest_wallet"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Button Shine Effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="relative">Claim Portfolio</span>
          </Link>

          <Link
            href="/sign-in"
            className="text-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            Already have an account?{' '}
            <span className="underline underline-offset-2">Sign in</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function PortfolioStateWrapper() {
  const { user, loading: authLoading } = useAuth();
  const { cards, totalValue, isHydrated } = useGuestStoreHydrated();
  const cardCount = useGuestStore((state) => state.cards.length);

  // State A: Still loading/hydrating
  if (!isHydrated || authLoading) {
    return <PortfolioSkeleton />;
  }

  // State B: User is authenticated
  if (user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="authenticated"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <RealPortfolioSummary user={user} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // State C: Guest with data - Show the Endowment Effect banner
  if (cards.length > 0) {
    return (
      <AnimatePresence mode="wait">
        <ActiveGuestBanner
          key="guest-active"
          totalValue={totalValue}
          cardCount={cardCount}
        />
      </AnimatePresence>
    );
  }

  // State D: Guest with no data - Show empty state
  return (
    <AnimatePresence mode="wait">
      <EmptyGuestState key="guest-empty" />
    </AnimatePresence>
  );
}

export default PortfolioStateWrapper;
