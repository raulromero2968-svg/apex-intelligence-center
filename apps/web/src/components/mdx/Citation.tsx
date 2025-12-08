/**
 * Citation Component
 *
 * Formats data sources for the "Perplexity" look with hoverable tooltips.
 * Inline citations that link to sources at the bottom of the article.
 * Supports our Core Value of Transparency - "data sources are verifiable".
 *
 * Usage in MDX:
 * ```mdx
 * According to recent sales data <Citation source="eBay" id="1" />,
 * Charizard prices have increased by 20%.
 *
 * For detailed breakdown, see <Citation
 *   id="2"
 *   source="PSA Population Report"
 *   href="https://psacard.com/pop"
 *   preview="PSA grading data for all Charizard variants"
 * />
 *
 * <CitationList>
 *   <Source id="1" name="eBay Sales Data" url="https://ebay.com/..." accessed="2024-01-15" />
 *   <Source id="2" name="PSA Population Report" url="https://psacard.com/pop" accessed="2024-01-15" />
 * </CitationList>
 * ```
 *
 * @see lib/mdx.ts for component registration
 * @see Core Values: Transparency
 */

'use client';

import { ReactNode, createContext, useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ExternalLink, BookOpen, Database, Globe, FileText, Info, CheckCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface CitationProps {
  /** Reference number/ID */
  id: string | number;
  /** Source name for tooltip */
  source?: string;
  /** Direct link to source */
  href?: string;
  /** Preview text for tooltip */
  preview?: string;
  /** Whether source has been verified */
  verified?: boolean;
}

export interface SourceProps {
  /** Reference number/ID (matches Citation id) */
  id: string | number;
  /** Source name */
  name: string;
  /** Source URL */
  url: string;
  /** Publisher/platform name */
  publisher?: string;
  /** Date accessed */
  accessed?: string;
  /** Source type */
  type?: 'web' | 'database' | 'document' | 'api';
  /** Brief description */
  description?: string;
  /** Whether source has been verified */
  verified?: boolean;
}

export interface CitationListProps {
  /** Source components */
  children: ReactNode;
  /** Title for the sources section */
  title?: string;
}

// ============================================================================
// Context for Citation <-> Source linking
// ============================================================================

interface CitationContextValue {
  sources: Map<string, SourceProps>;
  registerSource: (source: SourceProps) => void;
}

const CitationContext = createContext<CitationContextValue>({
  sources: new Map(),
  registerSource: () => {},
});

// ============================================================================
// Tooltip Component (for hoverable previews)
// ============================================================================

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  visible: boolean;
}

function Tooltip({ children, content, visible }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    if (visible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.top < 10) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [visible]);

  return (
    <span className="relative inline-flex">
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className={clsx(
            'absolute z-50 w-64 p-3 rounded-lg',
            'bg-slate-800/95 backdrop-blur-md border border-cyan-500/40',
            'shadow-xl shadow-black/50',
            'text-left',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
          )}
        >
          {/* Arrow */}
          <div
            className={clsx(
              'absolute w-2 h-2 bg-slate-800 border-cyan-500/40 rotate-45',
              position === 'top'
                ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b'
                : 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t'
            )}
          />
          {content}
        </div>
      )}
    </span>
  );
}

// ============================================================================
// Components
// ============================================================================

/**
 * Inline citation marker - [1] with hoverable tooltip
 */
export function Citation({ id, source, href, preview, verified }: CitationProps) {
  const displayId = String(id);
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipContent = (source || preview) && (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          Source [{displayId}]
        </span>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Source Name */}
      {source && (
        <p className="text-sm font-medium text-white">{source}</p>
      )}

      {/* Preview Text */}
      {preview && (
        <p className="text-xs text-slate-400 leading-relaxed">{preview}</p>
      )}

      {/* Link hint */}
      {href && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
          <ExternalLink className="w-3 h-3" />
          <span>Click to view source</span>
        </div>
      )}
    </div>
  );

  const content = (
    <sup
      className={clsx(
        'inline-flex items-center justify-center',
        'min-w-[1.25rem] h-5 px-1 mx-0.5',
        'text-[10px] font-bold leading-none',
        'rounded-full',
        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
        'hover:bg-cyan-500/30 hover:text-cyan-300 transition-colors',
        'cursor-pointer',
        verified && 'border-emerald-500/40'
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="button"
      aria-describedby={`citation-tooltip-${displayId}`}
    >
      {displayId}
    </sup>
  );

  const wrappedContent = tooltipContent ? (
    <Tooltip content={tooltipContent} visible={showTooltip}>
      {content}
    </Tooltip>
  ) : (
    content
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline hover:no-underline"
      >
        {wrappedContent}
      </a>
    );
  }

  // Link to citation in sources section
  return (
    <a href={`#source-${displayId}`} className="no-underline hover:no-underline">
      {wrappedContent}
    </a>
  );
}

/**
 * Source entry in the citation list
 */
export function Source({
  id,
  name,
  url,
  publisher,
  accessed,
  type = 'web',
  description,
  verified,
}: SourceProps) {
  const displayId = String(id);

  // Icon based on source type
  const TypeIcon = {
    web: Globe,
    database: Database,
    document: FileText,
    api: Database,
  }[type];

  return (
    <li
      id={`source-${displayId}`}
      className="group flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0"
    >
      {/* Citation number */}
      <span
        className={clsx(
          'flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
          verified
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
        )}
      >
        {displayId}
      </span>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <TypeIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Source name with link */}
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-medium text-sm inline-flex items-center gap-1 group-hover:underline"
              >
                {name}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              {verified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verified
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}

            {/* Publisher & accessed date */}
            {(publisher || accessed) && (
              <div className="text-xs text-slate-500 mt-0.5">
                {publisher && <span>{publisher}</span>}
                {publisher && accessed && <span> · </span>}
                {accessed && <span>Accessed {accessed}</span>}
              </div>
            )}

            {/* URL preview */}
            <div className="text-xs text-slate-600 truncate mt-0.5">
              {url}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Container for all sources
 */
export function CitationList({ children, title = 'Sources' }: CitationListProps) {
  return (
    <aside className="my-8 rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/30 bg-cyan-950/30 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-sans">
          {title}
        </h4>
      </div>

      {/* Sources List */}
      <ol className="list-none p-4 m-0 space-y-0">
        {children}
      </ol>
    </aside>
  );
}

// ============================================================================
// Convenience: Inline source reference
// ============================================================================

/**
 * Inline reference with popup preview
 */
export function Ref({
  children,
  href,
  source,
}: {
  children: ReactNode;
  href: string;
  source?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'inline-flex items-center gap-1',
        'text-cyan-400 hover:text-cyan-300',
        'border-b border-dashed border-cyan-500/50 hover:border-cyan-400',
        'transition-colors'
      )}
      title={source ? `Source: ${source}` : undefined}
    >
      {children}
      <ExternalLink className="w-3 h-3 opacity-75" />
    </a>
  );
}

export default Citation;
