'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import type { DissertationChapter } from './constants';

interface DissertationChapterBadgeProps {
  chapter: DissertationChapter;
  variant?: 'inline' | 'floating';
  className?: string;
}

/**
 * DissertationChapterBadge - Shows the dissertation chapter metadata on a page
 *
 * Part of the Apex Psycho-Neural PhD Framework
 * Each page in the ecosystem maps to a chapter in the living dissertation.
 *
 * Chapters:
 * 00 - Abstract: PhD Framework page
 * 01 - Introduction: Homepage
 * 02 - Literature Review: Commons
 * 03 - Methodology: Codebase (GitHub)
 * 04 - Results & Analysis: Intel & Portfolio
 * 05 - Discussion: Lab & Philosophy
 * 06 - Conclusion: Capstone Essay
 */
export function DissertationChapterBadge({
  chapter,
  variant = 'inline',
  className = ''
}: DissertationChapterBadgeProps) {
  if (variant === 'floating') {
    return (
      <Link
        href="/phd-framework"
        className={`fixed bottom-4 right-4 z-50 group ${className}`}
        title="View PhD Framework"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/60 transition-all shadow-lg">
          <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xs">
            <span className="text-purple-400 font-mono">CH.{chapter.number}</span>
            <span className="text-slate-500 mx-1">|</span>
            <span className="text-slate-400">{chapter.title}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/phd-framework"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/30 border border-purple-500/30 hover:border-purple-400/60 transition-all ${className}`}
      title={`PhD Framework - ${chapter.description}`}
    >
      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
      <span className="text-purple-400 font-mono text-xs">
        CHAPTER {chapter.number}: {chapter.title.toUpperCase()}
      </span>
    </Link>
  );
}

// Note: Import DISSERTATION_CHAPTERS directly from './constants' instead of this file
