'use client';

import { useState } from 'react';
import { Book, ChevronDown, ChevronRight, Gamepad2, TrendingUp } from 'lucide-react';

/**
 * GamingGlossary - A bridge between gaming culture and economic analysis
 *
 * The Double Helix made tangible: we speak gaming fluently (Strand B)
 * while maintaining analytical precision (Strand A).
 *
 * @module mdx/GamingGlossary
 */

interface GlossaryTerm {
  term: string;
  gaming: string;
  economic: string;
  example?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Nerf',
    gaming: 'When developers reduce the power of a character, item, or strategy that has become too dominant.',
    economic: 'Regulatory action that reduces the profitability or influence of a dominant market player or practice.',
    example: 'The FTC nerfed non-compete clauses in 2024.',
  },
  {
    term: 'Buff',
    gaming: 'When developers increase the power of an underperforming element to improve game balance.',
    economic: 'Policy changes that strengthen market position, subsidies, or competitive advantages.',
    example: 'The IRA buffed domestic semiconductor manufacturing.',
  },
  {
    term: 'Whale',
    gaming: 'A player who spends vastly more than average, often funding free-to-play games for everyone else.',
    economic: 'High-net-worth individuals whose spending patterns distort market prices and create asymmetric power.',
    example: 'Pokemon TCG whales drove Charizard prices 400% above fundamental value.',
  },
  {
    term: 'NPC',
    gaming: 'Non-Player Character. Background entities controlled by the game, not by humans.',
    economic: 'Market participants who follow herd behavior without independent analysis. Also: exploited labor in supply chains treated as interchangeable.',
    example: 'The Rentism model treats workers as NPCs.',
  },
  {
    term: 'Meta',
    gaming: 'The currently dominant strategy or set of strategies that define high-level play.',
    economic: 'The prevailing paradigm, regulatory framework, or market structure that determines winning strategies.',
    example: 'Rentism is the tech elite\'s preferred meta.',
  },
  {
    term: 'Patch Notes',
    gaming: 'Developer announcements detailing changes to game rules, balance, and mechanics.',
    economic: 'Regulatory updates, policy changes, or market structure modifications that shift the playing field.',
    example: 'Fed rate decisions are patch notes for the economy.',
  },
  {
    term: 'Pay-to-Win',
    gaming: 'Game design where spending real money provides competitive advantages unavailable to free players.',
    economic: 'Systems where capital access determines outcomes more than skill, effort, or merit.',
    example: 'The U.S. healthcare system is pay-to-win.',
  },
  {
    term: 'Grind',
    gaming: 'Repetitive tasks required to progress, often designed to incentivize paying for shortcuts.',
    economic: 'Labor exploitation where workers must perform excessive work for minimal advancement.',
    example: 'Cobalt miners face a lethal grind with no level-up path.',
  },
  {
    term: 'Boss Fight',
    gaming: 'A climactic confrontation with a powerful enemy requiring strategy and coordination to overcome.',
    economic: 'Major systemic challenges requiring collective action: monopolies, climate change, regulatory capture.',
    example: 'Climate change is a raid boss requiring global coordination.',
  },
  {
    term: 'Exploit',
    gaming: 'Using unintended game mechanics to gain advantages the developers didn\'t plan for.',
    economic: 'Leveraging regulatory gaps, tax loopholes, or market inefficiencies for outsized returns.',
    example: 'Carried interest is a tax exploit for private equity.',
  },
  {
    term: 'Admin Mode',
    gaming: 'Developer-level access that bypasses normal game rules and limitations.',
    economic: 'Regulatory immunity, sovereign immunity, or systemic importance that places entities above normal accountability.',
    example: 'Thiel\'s "Antichrist" rhetoric demands Admin Mode for tech.',
  },
  {
    term: 'Walled Garden',
    gaming: 'A closed ecosystem where players can\'t transfer assets or progress to other platforms.',
    economic: 'Proprietary systems designed to lock in users and prevent competition through network effects.',
    example: 'App Store fees create a walled garden extracting 30%.',
  },
  {
    term: 'RNG',
    gaming: 'Random Number Generator. The system that determines probabilistic outcomes.',
    economic: 'Market volatility, luck, and structural factors beyond individual control that determine outcomes.',
    example: 'Being born wealthy isn\'t skill—it\'s favorable RNG.',
  },
  {
    term: 'Speedrun',
    gaming: 'Completing a game as fast as possible, often using advanced techniques and exploits.',
    economic: 'Rapid accumulation strategies, often using leverage, insider information, or regulatory arbitrage.',
    example: 'SPACs were a wealth speedrun strategy.',
  },
  {
    term: 'Ghost Node',
    gaming: 'A hidden or invisible game element that affects play without being directly observable.',
    economic: 'Obfuscated actors, shell companies, or hidden relationships in power networks.',
    example: 'Unnamed Co-Conspirators are ghost nodes in legal filings.',
  },
];

interface GlossaryItemProps {
  item: GlossaryTerm;
  isOpen: boolean;
  onToggle: () => void;
}

function GlossaryItem({ item, isOpen, onToggle }: GlossaryItemProps) {
  return (
    <div className="border-b border-slate-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-mono font-semibold text-cyan-400">{item.term}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Gamepad2 className="w-4 h-4 text-purple-400 mt-1" />
            </div>
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">Gaming</span>
              <p className="text-sm text-slate-300 mt-1">{item.gaming}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400 mt-1" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Economic</span>
              <p className="text-sm text-slate-300 mt-1">{item.economic}</p>
            </div>
          </div>

          {item.example && (
            <div className="mt-2 pl-7 border-l-2 border-cyan-500/30">
              <span className="text-xs font-mono text-slate-500">Example:</span>
              <p className="text-sm text-slate-400 italic">{item.example}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GamingGlossary() {
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  const toggleTerm = (term: string) => {
    setOpenTerms(prev => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenTerms(new Set(GLOSSARY_TERMS.map(t => t.term)));
  };

  const collapseAll = () => {
    setOpenTerms(new Set());
  };

  const filteredTerms = GLOSSARY_TERMS.filter(
    t =>
      t.term.toLowerCase().includes(filter.toLowerCase()) ||
      t.gaming.toLowerCase().includes(filter.toLowerCase()) ||
      t.economic.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="my-8 rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-sm text-white uppercase tracking-wider">
            Gaming Glossary
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search terms..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Terms */}
      <div className="max-h-96 overflow-y-auto">
        {filteredTerms.length > 0 ? (
          filteredTerms.map(item => (
            <GlossaryItem
              key={item.term}
              item={item}
              isOpen={openTerms.has(item.term)}
              onToggle={() => toggleTerm(item.term)}
            />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No terms match "{filter}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          <span className="text-purple-400">Strand B</span> meets{' '}
          <span className="text-emerald-400">Strand A</span> — The Double Helix in action
        </p>
      </div>
    </div>
  );
}
