/**
 * ProTip Component
 *
 * A styled callout box for "Insightful & Authoritative" advice.
 * Used in blog posts to highlight key insights, tips, or warnings.
 *
 * Usage in MDX:
 * ```mdx
 * <ProTip title="Investment Insight">
 *   Always diversify your portfolio across multiple sets and conditions.
 * </ProTip>
 * ```
 *
 * @see lib/mdx.ts for component registration
 */

'use client';

import { ReactNode } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  Zap,
  TrendingUp,
  Shield,
  Star,
  Target,
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// Types
// ============================================================================

type TipVariant = 'insight' | 'warning' | 'info' | 'tip' | 'bullish' | 'bearish' | 'pro' | 'strategy';

export interface ProTipProps {
  /** Main content */
  children: ReactNode;
  /** Optional title for the callout */
  title?: string;
  /** Visual variant */
  variant?: TipVariant;
  /** Icon override */
  icon?: ReactNode;
}

// ============================================================================
// Variant Configurations
// ============================================================================

const variantConfig: Record<TipVariant, {
  icon: typeof Lightbulb;
  colors: string;
  borderColor: string;
  iconColor: string;
  defaultTitle: string;
}> = {
  insight: {
    icon: Lightbulb,
    colors: 'bg-amber-950/30 border-amber-500/40',
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
    defaultTitle: 'Key Insight',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-red-950/30 border-red-500/40',
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-400',
    defaultTitle: 'Warning',
  },
  info: {
    icon: Info,
    colors: 'bg-blue-950/30 border-blue-500/40',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-400',
    defaultTitle: 'Note',
  },
  tip: {
    icon: Zap,
    colors: 'bg-cyan-950/30 border-cyan-500/40',
    borderColor: 'border-l-cyan-500',
    iconColor: 'text-cyan-400',
    defaultTitle: 'Pro Tip',
  },
  bullish: {
    icon: TrendingUp,
    colors: 'bg-emerald-950/30 border-emerald-500/40',
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-400',
    defaultTitle: 'Bullish Signal',
  },
  bearish: {
    icon: Shield,
    colors: 'bg-orange-950/30 border-orange-500/40',
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-400',
    defaultTitle: 'Bearish Signal',
  },
  pro: {
    icon: Star,
    colors: 'bg-purple-950/30 border-purple-500/40',
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-400',
    defaultTitle: 'Pro Insight',
  },
  strategy: {
    icon: Target,
    colors: 'bg-pink-950/30 border-pink-500/40',
    borderColor: 'border-l-pink-500',
    iconColor: 'text-pink-400',
    defaultTitle: 'Strategy',
  },
};

// ============================================================================
// Component
// ============================================================================

export function ProTip({
  children,
  title,
  variant = 'tip',
  icon,
}: ProTipProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <aside
      className={clsx(
        'my-6 rounded-lg border-l-4 p-4 backdrop-blur-sm',
        config.colors,
        config.borderColor
      )}
      role="note"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx(
          'flex items-center justify-center w-6 h-6 rounded-full',
          config.colors
        )}>
          {icon || (
            <Icon
              className={clsx('w-4 h-4', config.iconColor)}
              strokeWidth={2.5}
            />
          )}
        </div>
        <span className={clsx(
          'font-bold text-sm uppercase tracking-wider font-sans',
          config.iconColor
        )}>
          {displayTitle}
        </span>
      </div>

      {/* Content */}
      <div className="text-slate-300 text-sm leading-relaxed pl-8 prose-p:my-0">
        {children}
      </div>
    </aside>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/** Insight callout */
export function Insight(props: Omit<ProTipProps, 'variant'>) {
  return <ProTip {...props} variant="insight" />;
}

/** Warning callout */
export function Warning(props: Omit<ProTipProps, 'variant'>) {
  return <ProTip {...props} variant="warning" />;
}

/** Bullish signal callout */
export function BullishSignal(props: Omit<ProTipProps, 'variant'>) {
  return <ProTip {...props} variant="bullish" />;
}

/** Bearish signal callout */
export function BearishSignal(props: Omit<ProTipProps, 'variant'>) {
  return <ProTip {...props} variant="bearish" />;
}

/** Pro-only insight */
export function ProInsight(props: Omit<ProTipProps, 'variant'>) {
  return <ProTip {...props} variant="pro" />;
}

export default ProTip;
