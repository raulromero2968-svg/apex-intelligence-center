'use client';

import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Source {
  id: number;
  name: string;
  url: string;
  favicon?: string;
  publisher?: string;
  accessed?: string;
}

interface SourceRailProps {
  sources: Source[];
}

export function SourceRail({ sources }: SourceRailProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-3">
      {sources.map((source, index) => (
        <motion.a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="block group hover:bg-slate-800/50 rounded-lg p-4 transition-all duration-200 border border-transparent hover:border-cyan-500/30"
        >
          <div className="flex items-start gap-3">
            {source.favicon && (
              <img
                src={source.favicon}
                alt=""
                className="w-5 h-5 mt-0.5 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {source.name}
                </p>
                <ExternalLink
                  size={14}
                  className="text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0"
                />
              </div>
              {source.publisher && (
                <p className="text-xs text-gray-500 mt-1">
                  {source.publisher}
                </p>
              )}
              {source.accessed && (
                <p className="text-xs text-gray-600 mt-1">
                  Verified {source.accessed}
                </p>
              )}
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
