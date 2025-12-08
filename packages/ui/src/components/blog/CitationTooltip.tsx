/**
 * CitationTooltip - Source Credibility Display
 *
 * A transparency engine for displaying source credibility when users hover
 * over citation numbers in blog content. Implements the "Professional & Trustworthy"
 * brand voice by clearly distinguishing verified data from speculation.
 *
 * @module @apex/ui/components/blog
 */

"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

export interface CitationTooltipProps {
  /** The citation number to display */
  citationNumber: number;
  /** Name of the source */
  sourceName: string;
  /** URL to the source (optional - makes title clickable) */
  sourceUrl?: string;
  /** Whether the source has been verified */
  isVerified: boolean;
  /** Relevance score from 0-100 */
  relevanceScore: number;
  /** Additional className for the trigger */
  className?: string;
}

/**
 * Verified checkmark icon (inline SVG for zero dependencies)
 */
function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Verified source"
    >
      <path
        d="M7 0L8.545 1.455L10.5 1.5L10.545 3.455L12 5L10.545 6.545L10.5 8.5L8.545 8.545L7 10L5.455 8.545L3.5 8.5L3.455 6.545L2 5L3.455 3.455L3.5 1.5L5.455 1.455L7 0Z"
        fill="currentColor"
      />
      <path
        d="M5.5 5L6.5 6L8.5 4"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Returns color class based on relevance score
 */
function getRelevanceColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  return "text-slate-400";
}

/**
 * Returns background gradient based on relevance score
 */
function getRelevanceBarGradient(score: number): string {
  if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  if (score >= 60) return "bg-gradient-to-r from-cyan-500 to-cyan-400";
  if (score >= 40) return "bg-gradient-to-r from-amber-500 to-amber-400";
  return "bg-gradient-to-r from-slate-500 to-slate-400";
}

export function CitationTooltip({
  citationNumber,
  sourceName,
  sourceUrl,
  isVerified,
  relevanceScore,
  className,
}: CitationTooltipProps) {
  const clampedScore = Math.max(0, Math.min(100, relevanceScore));

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <sup
            className={cn(
              "inline-flex items-center justify-center",
              "min-w-[1.25rem] h-5 px-1",
              "text-xs font-medium",
              "text-cyan-400 hover:text-cyan-300",
              "bg-cyan-400/10 hover:bg-cyan-400/20",
              "border border-cyan-400/20 hover:border-cyan-400/40",
              "rounded-sm",
              "cursor-pointer",
              "transition-all duration-150",
              "select-none",
              className
            )}
            aria-label={`Citation ${citationNumber}: ${sourceName}`}
          >
            [{citationNumber}]
          </sup>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={cn(
              "z-[70]",
              "min-w-[240px] max-w-[320px]",
              "p-4",
              "bg-space-void/95 backdrop-blur-md",
              "border border-slate-700/50",
              "rounded-lg",
              "shadow-xl shadow-black/40",
              "animate-fade-in"
            )}
            sideOffset={8}
            align="center"
          >
            {/* Header with source name and verified badge */}
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1 min-w-0">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block",
                      "text-sm font-medium",
                      "text-slate-100 hover:text-cyan-400",
                      "truncate",
                      "transition-colors duration-150"
                    )}
                  >
                    {sourceName}
                  </a>
                ) : (
                  <span className="block text-sm font-medium text-slate-100 truncate">
                    {sourceName}
                  </span>
                )}
                {sourceUrl && (
                  <span className="text-xs text-slate-500 truncate block">
                    {new URL(sourceUrl).hostname}
                  </span>
                )}
              </div>
              {isVerified && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400"
                  title="Verified Source"
                >
                  <VerifiedIcon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    Verified
                  </span>
                </div>
              )}
            </div>

            {/* Relevance Score */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Relevance Score</span>
                <span className={cn("text-xs font-mono font-medium", getRelevanceColor(clampedScore))}>
                  {clampedScore}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    getRelevanceBarGradient(clampedScore)
                  )}
                  style={{ width: `${clampedScore}%` }}
                />
              </div>
            </div>

            {/* Tooltip Arrow */}
            <Tooltip.Arrow className="fill-slate-700/50" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default CitationTooltip;
