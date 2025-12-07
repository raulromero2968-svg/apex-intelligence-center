/**
 * CardHover Component
 *
 * Shows a card image when you hover over the text (Perplexity-style).
 * Creates an interactive, contextual experience in articles.
 *
 * Usage in MDX:
 * ```mdx
 * The <CardHover id="charizard-base" src="/images/cards/charizard.png">Charizard</CardHover>
 * from Base Set remains the most iconic card in Pokemon history.
 * ```
 *
 * @see lib/mdx.ts for component registration
 */

'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface CardHoverProps {
  /** Unique card identifier for linking */
  id: string;
  /** Text to display (clickable/hoverable) */
  children: ReactNode;
  /** Card image URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Card name (for tooltip) */
  name?: string;
  /** Current price */
  price?: number;
  /** Price change percentage */
  change?: number;
  /** Set name */
  set?: string;
  /** Disable link behavior */
  noLink?: boolean;
  /** Custom href */
  href?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CardHover({
  id,
  children,
  src,
  alt,
  name,
  price,
  change,
  set,
  noLink = false,
  href,
}: CardHoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine if card should show above or below
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Card is ~280px tall, show below if not enough space above
      setPosition(spaceAbove < 300 ? 'below' : 'above');
    }
  }, [isVisible]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  // Generate default image if not provided
  const imageUrl = src || `/api/card-image/${id}`;
  const displayAlt = alt || name || `Card: ${children}`;
  const linkHref = href || `/cards/${id}`;

  // Trend indicator
  const trend = change ? (change > 0 ? 'up' : 'down') : null;

  const content = (
    <span
      ref={triggerRef}
      className={clsx(
        'relative inline-block cursor-pointer transition-all duration-200',
        'text-cyan-400 hover:text-cyan-300',
        'border-b border-dashed border-cyan-500/50 hover:border-cyan-400',
        'hover:bg-cyan-500/10 px-0.5 rounded'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Hover Card */}
      {isVisible && (
        <span
          ref={cardRef}
          className={clsx(
            'absolute z-50 left-1/2 -translate-x-1/2',
            'pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200',
            position === 'above' ? 'bottom-full mb-3' : 'top-full mt-3'
          )}
        >
          <span className="block w-[220px] rounded-xl overflow-hidden border-2 border-cyan-500/50 bg-slate-900 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            {/* Card Image */}
            <span className="relative block aspect-[63/88] w-full bg-slate-800">
              {src ? (
                <Image
                  src={imageUrl}
                  alt={displayAlt}
                  fill
                  className="object-contain"
                  sizes="220px"
                />
              ) : (
                <span className="flex items-center justify-center h-full text-slate-600 text-sm">
                  No image
                </span>
              )}
            </span>

            {/* Card Info */}
            <span className="block p-3 bg-slate-900 border-t border-cyan-500/30">
              {/* Name & Set */}
              {(name || set) && (
                <span className="block mb-2">
                  {name && (
                    <span className="block text-white font-semibold text-sm truncate">
                      {name}
                    </span>
                  )}
                  {set && (
                    <span className="block text-slate-500 text-xs truncate">
                      {set}
                    </span>
                  )}
                </span>
              )}

              {/* Price Info */}
              {price !== undefined && (
                <span className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold text-lg">
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>

                  {trend && (
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-sm font-medium',
                      trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{change! > 0 ? '+' : ''}{change?.toFixed(1)}%</span>
                    </span>
                  )}
                </span>
              )}

              {/* View Card Link Hint */}
              <span className="block mt-2 text-xs text-cyan-500 font-sans">
                Click to view details <ExternalLink className="inline w-3 h-3" />
              </span>
            </span>
          </span>

          {/* Arrow pointing to text */}
          <span className={clsx(
            'absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45',
            'bg-slate-900 border-cyan-500/50',
            position === 'above'
              ? 'bottom-0 translate-y-1/2 border-r border-b'
              : 'top-0 -translate-y-1/2 border-l border-t'
          )} />
        </span>
      )}
    </span>
  );

  // Wrap in link unless disabled
  if (noLink) {
    return content;
  }

  return (
    <Link href={linkHref} className="no-underline hover:no-underline">
      {content}
    </Link>
  );
}

export default CardHover;
