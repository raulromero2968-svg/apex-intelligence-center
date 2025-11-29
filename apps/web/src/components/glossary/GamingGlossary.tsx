'use client';

import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

/**
 * Gaming Terminology Glossary
 *
 * Bridges the gap between "Nature" and "Kotaku" by providing
 * inline definitions for gaming terms used in economic analysis.
 *
 * Part of Strand B: The Expedition - Using gaming metaphors
 * to explain complex economics.
 */

const GAMING_TERMS = {
  Nerfed: 'When a powerful entity (or card) is weakened by a rule change or regulation.',
  Buffed: 'When an entity is strengthened by external factors (e.g., tax cuts).',
  Whale: 'An investor with enough capital to manipulate the market single-handedly.',
  NPC: 'Non-Player Character. In economics, a passive participant with no agency.',
  Meta: 'The dominant strategy or power structure currently ruling the system.',
  'The Meta': 'The dominant strategy or power structure currently ruling the system.',
  Grind: 'Repetitive, low-reward labor required to progress in a system.',
  RNG: 'Random Number Generator. The unpredictable elements that affect outcomes.',
  P2W: 'Pay-to-Win. Systems where financial capital determines success over skill.',
  Whale: 'High-spending participant who funds the ecosystem while others free-ride.',
  Alpha: 'Early-stage advantage or insider information not yet priced into the market.',
  Pump: 'Artificial price inflation through coordinated buying or hype.',
  Dump: 'Coordinated selling after a pump, leaving late entrants with losses.',
  HODL: 'Hold On for Dear Life. Long-term holding through volatility.',
  Rug: 'When creators abandon a project after extracting maximum value.',
  Bag: 'Holdings in an asset, especially after a significant price decline.',
} as const;

type GamingTermKey = keyof typeof GAMING_TERMS;

interface GamingTermProps {
  term: GamingTermKey;
  className?: string;
}

/**
 * GamingTerm Component
 *
 * Renders an inline term with a tooltip definition.
 * Use this in blog posts and research to bridge gaming/economic vocabulary.
 *
 * @example
 * ```tsx
 * <p>
 *   The regulatory agency <GamingTerm term="Nerfed" /> their enforcement powers,
 *   allowing <GamingTerm term="Whale" /> activity to go unchecked.
 * </p>
 * ```
 */
export const GamingTerm = ({ term, className = '' }: GamingTermProps) => {
  const definition = GAMING_TERMS[term];

  if (!definition) {
    console.warn(`GamingTerm: Unknown term "${term}"`);
    return <span className={className}>{term}</span>;
  }

  return (
    <Tooltip
      content={
        <div className="text-xs font-mono">
          <span className="text-cyan-400 font-bold">{term}:</span>{' '}
          <span className="text-slate-200">{definition}</span>
        </div>
      }
    >
      <span
        className={`
          border-b border-dotted border-cyan-500/60
          text-cyan-400 font-mono cursor-help
          hover:text-cyan-300 hover:border-cyan-400
          transition-colors duration-150
          ${className}
        `}
      >
        {term}
      </span>
    </Tooltip>
  );
};

/**
 * GlossaryReference Component
 *
 * A full glossary panel for reference sections.
 */
export const GlossaryReference = () => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6">
      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <span className="text-cyan-400">//</span> Gaming Economics Glossary
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(GAMING_TERMS).map(([term, definition]) => (
          <div
            key={term}
            className="text-sm border-l-2 border-cyan-500/30 pl-3 py-1"
          >
            <span className="font-mono text-cyan-400 font-bold">{term}</span>
            <p className="text-slate-400 text-xs mt-0.5">{definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamingTerm;
