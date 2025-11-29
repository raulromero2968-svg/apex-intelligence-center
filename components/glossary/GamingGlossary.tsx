'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

/**
 * Gaming Glossary - The Dictionary of the Simulation
 *
 * This component bridges the gap between the "System Analyst" (Nature) and
 * "Gamer" (Kotaku) audiences by translating economic/political concepts into
 * gaming terminology.
 *
 * The thesis: The same mechanics that drive game economies (nerfs, buffs, meta shifts)
 * operate at civilizational scale in markets and power structures.
 *
 * @module GamingGlossary
 * @version 1.0.0
 */

// The Dictionary of the Simulation
const terms: Record<string, { definition: string; example?: string }> = {
  "Nerfed": {
    definition: "When a powerful entity, asset, or strategy is weakened by a rule change (Regulation) or market shift.",
    example: "When the SEC regulates crypto, they are effectively nerfing the sector."
  },
  "Buffed": {
    definition: "When an entity is strengthened by external factors (e.g., Tax Cuts, Subsidies, or Deregulation).",
    example: "Defense contractors got buffed after 9/11 with unlimited Pentagon budgets."
  },
  "Whale": {
    definition: "An investor or entity with enough capital to manipulate the market single-handedly. In TCGs: The Collector. In Politics: The Donor.",
    example: "Elon Musk is a whale in the crypto market—his tweets move billions."
  },
  "NPC": {
    definition: "Non-Player Character. In economics, a passive participant with no agency (e.g., the consumer who creates data but captures no value).",
    example: "Social media users are NPCs generating content for platforms that monetize their attention."
  },
  "The Meta": {
    definition: "The dominant strategy or power structure currently ruling the system. To 'Break the Meta' is to disrupt the status quo.",
    example: "Peter Thiel is trying to establish a new Meta where tech founders are high priests."
  },
  "RNG": {
    definition: "Random Number Generator. The element of luck or chaos in a system (e.g., Market Volatility, Political Black Swans).",
    example: "COVID-19 was pure RNG that reshaped global supply chains overnight."
  },
  "Loot Box": {
    definition: "A mechanism of gambling disguised as reward. Variable ratio reinforcement exploits dopamine systems.",
    example: "TCG booster packs, NFT mints, and options trading all share loot box mechanics."
  },
  "Aggro": {
    definition: "Aggressive expansion strategy. Fast, risky plays that prioritize speed over sustainability.",
    example: "Uber's early blitzscaling was pure aggro—burn capital to capture territory."
  },
  "Turtle": {
    definition: "Defensive accumulation strategy. Slow, safe plays that prioritize preservation over growth.",
    example: "Hoarding gold, IP patent trolling, or building bunkers are turtle strategies."
  },
  "Main": {
    definition: "Your primary focus or asset class. What you specialize in and commit resources to.",
    example: "'I main Vintage Pokémon' or 'He mains Tech Stocks'."
  },
  "Rentism": {
    definition: "An economic system where the primary mode of value extraction is through ownership and access fees rather than production.",
    example: "Software subscriptions, IP licensing, and platform fees are all rentist mechanisms."
  },
  "Spawn Kill": {
    definition: "Eliminating competition before they can establish themselves. Regulatory capture that prevents new entrants.",
    example: "Large incumbents lobby for licensing requirements that spawn kill startups."
  },
  "Grind": {
    definition: "Repetitive, low-margin activity required to accumulate resources before meaningful progress.",
    example: "The gig economy is a grind—endless tasks with no path to the endgame."
  },
  "Pay to Win": {
    definition: "Systems where money can purchase advantages unavailable through skill or effort alone.",
    example: "Legacy admissions at elite universities are pay-to-win mechanics."
  },
  "Rubberbanding": {
    definition: "Mechanics that help losing players catch up or hold winning players back. Progressive taxation, antitrust.",
    example: "Estate taxes are rubberbanding—preventing dynastic wealth accumulation."
  },
  "Glitch": {
    definition: "Exploitable bugs in the system that provide unintended advantages to those who discover them.",
    example: "Carried interest tax treatment is a glitch that private equity discovered and protects."
  },
  "Patch Notes": {
    definition: "Legislative or regulatory changes that alter the rules of the game. New laws, executive orders.",
    example: "The CHIPS Act patch notes buffed domestic semiconductor production."
  },
  "Cooldown": {
    definition: "Mandatory waiting periods before actions can be repeated. Rate limiting, vesting schedules.",
    example: "Insider trading lockup periods are cooldowns preventing immediate profit-taking."
  }
};

type TermKey = keyof typeof terms;

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  isOpen: boolean;
}

const Tooltip = ({ children, content, isOpen }: TooltipProps) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [isOpen]);

  return (
    <>
      <span ref={triggerRef}>{children}</span>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 9999,
            }}
            className="pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface GamingTermProps {
  term: TermKey;
  children?: ReactNode;
}

/**
 * GamingTerm Component
 *
 * Wraps text with a tooltip that displays the gaming glossary definition.
 * Use this in blog posts and articles to bridge gaming and economic terminology.
 *
 * @example
 * ```tsx
 * <p>
 *   When the SEC regulates crypto, they are effectively <GamingTerm term="Nerfed">nerfing</GamingTerm> the sector.
 * </p>
 * ```
 */
export const GamingTerm = ({ term, children }: GamingTermProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const entry = terms[term];

  if (!entry) return <>{children || term}</>;

  return (
    <Tooltip
      isOpen={isOpen}
      content={
        <div className="bg-slate-950 border border-slate-800 text-slate-200 p-4 max-w-xs rounded-lg shadow-2xl">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              GAMING_LEXICON :: {term.toUpperCase()}
            </span>
            <p className="text-sm leading-relaxed text-slate-300">
              {entry.definition}
            </p>
            {entry.example && (
              <p className="text-xs leading-relaxed text-slate-500 italic border-t border-slate-800 pt-2 mt-1">
                {entry.example}
              </p>
            )}
          </div>
        </div>
      }
    >
      <span
        className="inline-flex items-center gap-0.5 border-b border-dotted border-emerald-500/60 text-emerald-400 font-mono cursor-help hover:bg-emerald-500/10 transition-colors rounded px-1 py-0.5"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        tabIndex={0}
        role="button"
        aria-describedby={`gaming-term-${term}`}
      >
        {children || term}
      </span>
    </Tooltip>
  );
};

/**
 * GamingGlossaryFull Component
 *
 * Displays the full gaming glossary as a reference card.
 * Useful for "About" pages or documentation.
 */
export const GamingGlossaryFull = () => {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-mono text-emerald-500 mb-4 flex items-center gap-2">
        <Info className="w-5 h-5" />
        GAMING_LEXICON // THE DICTIONARY OF THE SIMULATION
      </h3>
      <p className="text-sm text-slate-400 mb-6">
        The same mechanics that drive game economies operate at civilizational scale.
        This glossary translates economic and political concepts into gaming terminology.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.entries(terms) as [TermKey, typeof terms[TermKey]][]).map(([term, entry]) => (
          <div
            key={term}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-emerald-500/30 transition-colors"
          >
            <h4 className="font-mono text-emerald-400 font-bold mb-2">{term}</h4>
            <p className="text-sm text-slate-300 mb-2">{entry.definition}</p>
            {entry.example && (
              <p className="text-xs text-slate-500 italic">{entry.example}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the terms dictionary for external use
export { terms as gamingTerms };
export type { TermKey as GamingTermKey };
