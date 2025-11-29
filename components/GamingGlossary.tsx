/**
 * GamingGlossary - Narrative Translation Layer
 *
 * The Nature x Kotaku Voice DNA: Translating complex power dynamics
 * into gaming terminology that makes abstract concepts visceral.
 *
 * This component provides inline definitions for gaming terms,
 * bridging the gap between geopolitical analysis and gamer culture.
 *
 * @module GamingGlossary
 */

'use client';

import { useState, useRef, useEffect } from 'react';

// Gaming terminology glossary - the "Double Helix" voice
const glossary: Record<string, { definition: string; example: string }> = {
  'The Meta': {
    definition: 'The dominant strategy that shapes all other strategies. The "metagame" is the game about the game.',
    example: 'The Tech Elite are trying to establish a new Meta where regulation is the enemy.'
  },
  'Nerfed': {
    definition: 'When game developers weaken a powerful ability or item. In politics: when authorities reduce someone\'s power.',
    example: 'Antitrust laws are how democracies "nerf" monopolies.'
  },
  'RNG': {
    definition: 'Random Number Generation - unpredictable outcomes. In systems: chaos, uncontrolled variables.',
    example: 'Democratic elections introduce RNG into technocratic planning.'
  },
  'Turtle': {
    definition: 'A defensive strategy focused on fortification and resource hoarding rather than expansion.',
    example: 'Building walled gardens of IP is a classic Turtle strategy.'
  },
  'Whale': {
    definition: 'A player who spends vastly more than others, often distorting the game economy.',
    example: 'Billionaires are the Whales of the political economy.'
  },
  'Griefing': {
    definition: 'Deliberately disrupting others\' experience for personal amusement or gain.',
    example: 'Regulatory capture is a form of institutional griefing.'
  },
  'Buff': {
    definition: 'When something gets stronger. The opposite of nerfed.',
    example: 'Tax breaks are how governments buff certain industries.'
  },
  'Aggro': {
    definition: 'Drawing hostile attention. "Pulling aggro" means becoming a target.',
    example: 'Whistleblowers pull aggro from powerful institutions.'
  },
  'Min-Max': {
    definition: 'Optimizing for maximum efficiency, often at the expense of balance.',
    example: 'Rentism is the min-max strategy of late capitalism.'
  },
  'Spawn Camp': {
    definition: 'Attacking players at their starting point before they can compete.',
    example: 'Legacy admissions are how elites spawn camp educational opportunities.'
  }
};

interface GamingTermProps {
  term: keyof typeof glossary | string;
  children?: React.ReactNode;
}

export function GamingTerm({ term, children }: GamingTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const entry = glossary[term];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!entry) {
    // Fallback for unknown terms
    return (
      <span className="text-purple-400 font-medium">
        {children || term}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-purple-400 font-medium cursor-help border-b border-dotted border-purple-400/50 hover:border-purple-400 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        {children || term}
      </span>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-slate-900 border border-purple-500/30 rounded-lg shadow-xl shadow-purple-500/10"
        >
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">
                Gaming Term
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <h4 className="text-sm font-bold text-white">{term}</h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {entry.definition}
            </p>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500 italic">
                &ldquo;{entry.example}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

export default GamingTerm;
