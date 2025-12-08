/**
 * MethodologyBox Component
 *
 * A collapsible component where we explain HOW we calculated data in articles.
 * This directly proves we believe in "objective truth over subjective opinion"
 * and reinforces our Core Value of Transparency.
 *
 * Philosophy: Show your work, build trust
 * - Data sources are verifiable
 * - Methodology is transparent
 * - Users can understand and replicate our analysis
 *
 * Usage in MDX:
 * ```mdx
 * <MethodologyBox
 *   title="Price Prediction Methodology"
 *   confidence={85}
 *   lastUpdated="2024-01-15"
 * >
 *   ## Data Sources
 *   - eBay completed listings (last 90 days): 12,847 transactions
 *   - TCGPlayer market data: Real-time pricing feed
 *   - PSA population reports: Grade distribution analysis
 *
 *   ## Model
 *   We use a weighted moving average combined with seasonal adjustment
 *   factors derived from 3 years of historical data.
 *
 *   ## Limitations
 *   - Does not account for sudden market announcements
 *   - Population data may lag by 2-4 weeks
 * </MethodologyBox>
 * ```
 *
 * @see Core Values: Transparency, Methodology
 */

'use client';

import { ReactNode, useState } from 'react';
import clsx from 'clsx';
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface MethodologyBoxProps {
  /** Content explaining the methodology (supports MDX/markdown) */
  children: ReactNode;
  /** Title for this methodology section */
  title?: string;
  /** Model confidence level (0-100) */
  confidence?: number;
  /** When methodology/data was last updated */
  lastUpdated?: string;
  /** Start expanded? */
  defaultOpen?: boolean;
  /** Data source count for quick reference */
  dataSourceCount?: number;
  /** Variant styling */
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================================================
// Helpers
// ============================================================================

function getConfidenceConfig(confidence: number) {
  if (confidence >= 80) {
    return {
      label: 'High Confidence',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/40',
      icon: CheckCircle2,
    };
  } else if (confidence >= 60) {
    return {
      label: 'Moderate Confidence',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/40',
      icon: Info,
    };
  } else {
    return {
      label: 'Experimental',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/40',
      icon: AlertCircle,
    };
  }
}

// ============================================================================
// Component
// ============================================================================

export function MethodologyBox({
  children,
  title = 'How We Calculated This',
  confidence,
  lastUpdated,
  defaultOpen = false,
  dataSourceCount,
  variant = 'default',
}: MethodologyBoxProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const confidenceConfig = confidence !== undefined ? getConfidenceConfig(confidence) : null;
  const ConfidenceIcon = confidenceConfig?.icon || Info;

  const isCompact = variant === 'compact';

  return (
    <aside
      className={clsx(
        'my-8 rounded-xl border overflow-hidden',
        'bg-slate-900/50 backdrop-blur-sm',
        'border-cyan-500/30',
        'transition-all duration-300'
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between gap-4',
          'px-4 py-3 text-left',
          'bg-gradient-to-r from-cyan-950/50 to-transparent',
          'border-b border-cyan-500/20',
          'hover:from-cyan-950/70 transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Title and Meta */}
          <div>
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-sans">
              {title}
            </h4>
            {!isCompact && (
              <div className="flex items-center gap-3 mt-0.5">
                {/* Confidence Badge */}
                {confidenceConfig && (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 text-xs',
                      confidenceConfig.color
                    )}
                  >
                    <ConfidenceIcon className="w-3 h-3" />
                    {confidence}% {confidenceConfig.label}
                  </span>
                )}

                {/* Data Sources */}
                {dataSourceCount && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Database className="w-3 h-3" />
                    {dataSourceCount} sources
                  </span>
                )}

                {/* Last Updated */}
                {lastUpdated && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Updated {lastUpdated}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-sans hidden sm:block">
            {isOpen ? 'COLLAPSE' : 'EXPAND'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-cyan-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cyan-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-6">
          {/* Trust Signal */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/20 mb-6">
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400">
              <span className="text-cyan-400 font-semibold">Transparency note:</span>{' '}
              We publish our methodology so you can understand and verify our analysis.
              Data-driven decisions require knowing how the data was processed.
            </p>
          </div>

          {/* Methodology Content */}
          <div
            className={clsx(
              'prose prose-invert prose-sm max-w-none',
              'prose-headings:text-cyan-400 prose-headings:text-sm prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wider',
              'prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-700/50',
              'prose-h3:mt-4 prose-h3:mb-2',
              'prose-ul:my-2 prose-li:my-0.5',
              'prose-p:text-slate-400 prose-p:leading-relaxed',
              'prose-li:text-slate-400',
              'prose-strong:text-slate-300',
              'prose-code:text-cyan-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs'
            )}
          >
            {children}
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen className="w-4 h-4" />
              <span>Have questions about this methodology?</span>
            </div>
            <a
              href="/contact?topic=methodology"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-sans"
            >
              CONTACT_RESEARCH_TEAM →
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Compact version for inline methodology notes
 */
export function MethodologyNote({
  children,
  ...props
}: Omit<MethodologyBoxProps, 'variant'>) {
  return <MethodologyBox {...props} variant="compact">{children}</MethodologyBox>;
}

/**
 * Pre-configured for data analysis methodology
 */
export function DataMethodology({
  children,
  ...props
}: Omit<MethodologyBoxProps, 'title'>) {
  return (
    <MethodologyBox {...props} title="Data Analysis Methodology">
      {children}
    </MethodologyBox>
  );
}

/**
 * Pre-configured for price prediction methodology
 */
export function PredictionMethodology({
  children,
  ...props
}: Omit<MethodologyBoxProps, 'title'>) {
  return (
    <MethodologyBox {...props} title="Price Prediction Methodology">
      {children}
    </MethodologyBox>
  );
}

export default MethodologyBox;
