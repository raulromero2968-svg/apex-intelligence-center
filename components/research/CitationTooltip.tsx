'use client';

import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Citation {
  id: number;
  title: string;
  source: string;
  url?: string;
  type: 'article' | 'report' | 'data' | 'research';
  date?: string;
}

interface CitationTooltipProps {
  citationNumber: number;
  citation: Citation;
}

export const CitationTooltip: React.FC<CitationTooltipProps> = ({ citationNumber, citation }) => {
  const [isHovered, setIsHovered] = useState(false);

  const typeColors = {
    article: 'text-cyan-400 border-cyan-400/50 bg-cyan-950/50',
    report: 'text-purple-400 border-purple-400/50 bg-purple-950/50',
    data: 'text-green-400 border-green-400/50 bg-green-950/50',
    research: 'text-pink-400 border-pink-400/50 bg-pink-950/50',
  };

  const typeIcons = {
    article: FileText,
    report: FileText,
    data: ExternalLink,
    research: FileText,
  };

  const Icon = typeIcons[citation.type];

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <sup
        className={`mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${typeColors[citation.type]} border hover:scale-110`}
      >
        {citationNumber}
      </sup>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[320px]">
              {/* Citation header */}
              <div className="flex items-start gap-2 mb-2">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeColors[citation.type].split(' ')[0]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white mb-1 line-clamp-2">
                    {citation.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {citation.source}
                  </div>
                </div>
              </div>

              {/* Citation metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${typeColors[citation.type]}`}>
                    {citation.type}
                  </span>
                  {citation.date && (
                    <span className="text-[10px] text-slate-500">{citation.date}</span>
                  )}
                </div>
                {citation.url && (
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                )}
              </div>

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-slate-700" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
