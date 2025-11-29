'use client';

import React, { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delayMs?: number;
  className?: string;
}

/**
 * Tooltip Component
 *
 * A minimal tooltip implementation for displaying contextual information.
 * Used by GamingGlossary for term definitions.
 *
 * @example
 * ```tsx
 * <Tooltip content="Definition here">
 *   <span>Hover me</span>
 * </Tooltip>
 * ```
 */
export const Tooltip = ({
  children,
  content,
  delayMs = 200,
  className = '',
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
      setIsVisible(true);
    }, delayMs);
  }, [delayMs]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-block ${className}`}
      >
        {children}
      </span>

      {isVisible && (
        <div
          className="fixed z-[9999] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl max-w-xs">
            {content}
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              top: '100%',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgb(51 65 85)',
            }}
          />
        </div>
      )}
    </>
  );
};

export default Tooltip;
