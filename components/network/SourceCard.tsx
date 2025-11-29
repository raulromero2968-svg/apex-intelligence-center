'use client';

import React from 'react';

/**
 * SourceCard - Displays source citation for evidence
 *
 * Used to show provenance of claims in the Power Network.
 * Critical for maintaining the "Truth Tier" evidence standards.
 */

export interface SourceCardProps {
  title: string;
  source: string;
  url?: string;
  evidenceTier: 'CONFIRMED' | 'DOCUMENTED' | 'ALLEGED' | 'SPECULATIVE';
  date?: string;
  description?: string;
}

const tierColors = {
  CONFIRMED: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    badge: 'bg-green-500/20',
  },
  DOCUMENTED: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20',
  },
  ALLEGED: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20',
  },
  SPECULATIVE: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20',
  },
};

const tierLabels = {
  CONFIRMED: 'Court Documents / Official Records',
  DOCUMENTED: 'Credible Journalism / Multiple Sources',
  ALLEGED: 'Single Source / Unverified',
  SPECULATIVE: 'Pattern-based Inference',
};

export function SourceCard({
  title,
  source,
  url,
  evidenceTier,
  date,
  description,
}: SourceCardProps) {
  const colors = tierColors[evidenceTier];

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-200 text-sm leading-tight">
          {title}
        </h4>
        <span
          className={`${colors.badge} ${colors.text} px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap`}
        >
          {evidenceTier}
        </span>
      </div>

      {/* Source */}
      <p className="text-slate-400 text-xs mb-2">{source}</p>

      {/* Description */}
      {description && (
        <p className="text-slate-500 text-xs mb-3 line-clamp-2">{description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {date && <span className="text-slate-500">{date}</span>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${colors.text} hover:underline flex items-center gap-1`}
          >
            View Source
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Evidence tier explanation */}
      <div className="mt-3 pt-2 border-t border-slate-700/50">
        <p className="text-slate-600 text-[10px]">{tierLabels[evidenceTier]}</p>
      </div>
    </div>
  );
}

export default SourceCard;
