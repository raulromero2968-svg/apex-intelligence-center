/**
 * ProContext Component
 *
 * A "Trust-First" content gate that frames premium content as a professional
 * threshold rather than artificial FOMO. This component aligns with our
 * Core Values of Transparency and our brand voice of being "Professional & Trustworthy".
 *
 * Philosophy: "Value Exchange, Not FOMO"
 * - We have done deep, computational analysis
 * - It requires server resources and proprietary models
 * - If you are a serious investor ready for this level of data, this tool is available
 *
 * Usage in MDX:
 * ```mdx
 * <ProContext
 *   feature="predictive-model"
 *   title="Predictive Price Analysis"
 *   methodology="Uses 2.3M historical transactions with ML regression"
 * >
 *   <InteractiveLineChart data={predictionData} />
 *   <TableOfPredictions />
 * </ProContext>
 * ```
 *
 * @see Core Values: Transparency, Trust
 * @see Brand Guide: Professional & Trustworthy voice
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  Shield,
  Database,
  Cpu,
  TrendingUp,
  BarChart3,
  Zap,
  ChevronRight,
  Lock,
  Info,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ProContextProps {
  /** Content to show/hide based on auth state */
  children: ReactNode;
  /** Feature identifier for analytics */
  feature?: string;
  /** Title for this analysis block */
  title?: string;
  /** Brief methodology description - builds trust */
  methodology?: string;
  /** Required tier to access */
  tier?: 'intelligence' | 'apex';
  /** Data sources used count */
  dataSourceCount?: number;
  /** Computational complexity indicator */
  computeLevel?: 'standard' | 'intensive' | 'enterprise';
}

// ============================================================================
// Configuration
// ============================================================================

const tierConfig = {
  intelligence: {
    name: 'Intelligence',
    description: 'Access institutional-grade analysis tools',
    icon: Database,
    color: 'cyan',
    href: '/pricing?tier=intelligence',
  },
  apex: {
    name: 'Apex',
    description: 'Full access to predictive models and live data',
    icon: Shield,
    color: 'purple',
    href: '/pricing?tier=apex',
  },
};

const computeLabels = {
  standard: { label: 'Standard Analysis', icon: BarChart3 },
  intensive: { label: 'ML-Enhanced', icon: Cpu },
  enterprise: { label: 'Enterprise-Grade', icon: Zap },
};

// ============================================================================
// Component
// ============================================================================

export function ProContext({
  children,
  feature,
  title = 'Advanced Analysis',
  methodology,
  tier = 'intelligence',
  dataSourceCount,
  computeLevel = 'standard',
}: ProContextProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'intelligence' | 'apex'>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const hasToken =
        typeof window !== 'undefined' &&
        (localStorage.getItem('apex-auth-token') ||
          document.cookie.includes('apex-session'));

      // Check user tier from stored data (simplified - replace with real auth)
      const storedTier = localStorage.getItem('apex-user-tier') as
        | 'free'
        | 'intelligence'
        | 'apex'
        | null;

      setIsAuthenticated(hasToken);
      setUserTier(storedTier || 'free');
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const config = tierConfig[tier];
  const computeConfig = computeLabels[computeLevel];
  const ComputeIcon = computeConfig.icon;
  const TierIcon = config.icon;

  // Determine if user has access
  const tierOrder = ['free', 'intelligence', 'apex'];
  const hasAccess =
    isAuthenticated && tierOrder.indexOf(userTier) >= tierOrder.indexOf(tier);

  // Loading state
  if (isLoading) {
    return (
      <div className="my-8 rounded-xl border border-slate-700 bg-slate-900/50 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading analysis...</span>
        </div>
      </div>
    );
  }

  // Has access - render content with context badge
  if (hasAccess) {
    return (
      <div className="my-8 relative">
        {/* Access Badge */}
        <div className="absolute -top-3 left-4 z-10">
          <div
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold',
              'bg-slate-900 border',
              tier === 'apex'
                ? 'border-purple-500/50 text-purple-400'
                : 'border-cyan-500/50 text-cyan-400'
            )}
          >
            <TierIcon className="w-3 h-3" />
            {config.name.toUpperCase()} ANALYSIS
          </div>
        </div>

        {/* Content Container */}
        <div
          className={clsx(
            'rounded-xl border p-6 pt-8',
            'bg-gradient-to-br from-slate-900/80 to-slate-900/50',
            tier === 'apex'
              ? 'border-purple-500/30'
              : 'border-cyan-500/30'
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  // No access - show professional threshold message
  return (
    <div className="my-8 relative group">
      {/* Blurred Preview */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
        {/* Actual content (blurred) */}
        <div
          className="p-6 blur-md select-none pointer-events-none opacity-40"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Gradient overlay */}
        <div
          className={clsx(
            'absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900/95',
            'backdrop-blur-[2px]'
          )}
        />
      </div>

      {/* Professional Threshold Card */}
      <div
        className={clsx(
          'relative -mt-48 mx-4 rounded-xl border p-8',
          'bg-slate-900/95 backdrop-blur-md',
          'shadow-2xl shadow-black/50',
          tier === 'apex'
            ? 'border-purple-500/40'
            : 'border-cyan-500/40'
        )}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={clsx(
              'w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0',
              'bg-slate-800/50 border',
              tier === 'apex'
                ? 'border-purple-500/40'
                : 'border-cyan-500/40'
            )}
          >
            <TierIcon
              className={clsx(
                'w-7 h-7',
                tier === 'apex' ? 'text-purple-400' : 'text-cyan-400'
              )}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-slate-400 text-sm">
              Institutional-grade analysis available to {config.name} subscribers
            </p>
          </div>
        </div>

        {/* Why This Requires Access - Transparency */}
        <div className="space-y-3 mb-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Info className="w-4 h-4 text-cyan-400" />
            Why this requires {config.name} access:
          </div>

          <ul className="space-y-2 text-sm text-slate-400">
            {/* Compute Level */}
            <li className="flex items-center gap-3">
              <ComputeIcon className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <span>
                <span className="text-slate-300">{computeConfig.label}:</span>{' '}
                Requires dedicated server resources
              </span>
            </li>

            {/* Data Sources */}
            {dataSourceCount && (
              <li className="flex items-center gap-3">
                <Database className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>
                  <span className="text-slate-300">{dataSourceCount.toLocaleString()} data points:</span>{' '}
                  Aggregated from verified market sources
                </span>
              </li>
            )}

            {/* Methodology */}
            {methodology && (
              <li className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>
                  <span className="text-slate-300">Methodology:</span> {methodology}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* CTA - Professional, not pushy */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href={config.href}
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg',
              'font-semibold text-sm transition-all',
              'w-full sm:w-auto',
              tier === 'apex'
                ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
            )}
          >
            <Lock className="w-4 h-4" />
            Access {config.name} Tools
            <ChevronRight className="w-4 h-4" />
          </Link>

          <span className="text-xs text-slate-500">
            No commitment required • Cancel anytime
          </span>
        </div>

        {/* Already subscribed? */}
        {!isAuthenticated && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Already a subscriber?{' '}
            <Link
              href="/auth/signin"
              className={clsx(
                'font-medium transition-colors',
                tier === 'apex'
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-cyan-400 hover:text-cyan-300'
              )}
            >
              Sign in to access
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Intelligence-tier gated content
 */
export function IntelligenceContext(props: Omit<ProContextProps, 'tier'>) {
  return <ProContext {...props} tier="intelligence" />;
}

/**
 * Apex-tier gated content (highest tier)
 */
export function ApexContext(props: Omit<ProContextProps, 'tier'>) {
  return <ProContext {...props} tier="apex" />;
}

export default ProContext;
