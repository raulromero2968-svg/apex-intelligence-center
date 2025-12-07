/**
 * Citation Component
 *
 * Formats data sources for the "Perplexity" look.
 * Inline citations that link to sources at the bottom of the article.
 *
 * Usage in MDX:
 * ```mdx
 * According to recent sales data <Citation source="eBay" id="1" />,
 * Charizard prices have increased by 20%.
 *
 * <CitationList>
 *   <Source id="1" name="eBay Sales Data" url="https://ebay.com/..." accessed="2024-01-15" />
 * </CitationList>
 * ```
 *
 * @see lib/mdx.ts for component registration
 */

'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ExternalLink, BookOpen, Database, Globe, FileText } from 'lucide-react';

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
// Components
// ============================================================================

/**
 * Inline citation marker - [1]
 */
export function Citation({ id, source, href }: CitationProps) {
  const displayId = String(id);

  const content = (
    <sup
      className={clsx(
        'inline-flex items-center justify-center',
        'min-w-[1.25rem] h-5 px-1 mx-0.5',
        'text-[10px] font-bold leading-none',
        'rounded-full',
        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
        'hover:bg-cyan-500/30 hover:text-cyan-300 transition-colors',
        'cursor-pointer'
      )}
      title={source ? `Source: ${source}` : `Citation ${displayId}`}
    >
      {displayId}
    </sup>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline hover:no-underline"
      >
        {content}
      </a>
    );
  }

  // Link to citation in sources section
  return (
    <a href={`#source-${displayId}`} className="no-underline hover:no-underline">
      {content}
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
      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/40">
        {displayId}
      </span>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <TypeIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Source name with link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-medium text-sm inline-flex items-center gap-1 group-hover:underline"
            >
              {name}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>

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
