'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Database } from 'lucide-react';

interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  date: string;
}

interface CitationProps {
  id: string;
  source: Source;
}

export const CitationTooltip = ({ id, source }: CitationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <sup
        className="cursor-pointer text-cyan-400 font-bold hover:text-cyan-300 transition-colors ml-0.5 px-1 rounded hover:bg-cyan-900/30"
      >
        [{id}]
      </sup>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-50"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-slate-800 rounded-md">
                  <Database className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate leading-tight mb-1">
                    {source.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="truncate max-w-[80px]">{source.domain}</span>
                    <span>•</span>
                    <span>{source.date}</span>
                  </div>
                </div>
              </div>

              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 w-full py-1.5 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-900/50 rounded text-xs text-cyan-400 font-medium transition-colors"
              >
                Verify Source <ExternalLink className="w-3 h-3" />
              </a>

              {/* Decorative arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
