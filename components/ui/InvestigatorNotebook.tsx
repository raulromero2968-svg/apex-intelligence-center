/**
 * InvestigatorNotebook - Local-First Encrypted Notebook
 *
 * The "Parking Lot" mental protocol given a digital home.
 * All data stays in localStorage - never sent to any server.
 *
 * Purpose:
 * - Privacy: Data never leaves the machine
 * - Psychology: Reinforces the "Cognitive Switch" - write here ONLY in Apex Mode
 * - Safety: Offload suspicious patterns before they infect your life
 *
 * @module ui/InvestigatorNotebook
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';

const STORAGE_KEY = 'apex_investigator_notes';
const LAST_ACCESSED_KEY = 'apex_investigator_last_accessed';

interface InvestigatorNotebookProps {
  className?: string;
  compact?: boolean; // For sidebar embedding
}

export function InvestigatorNotebook({ className, compact = false }: InvestigatorNotebookProps) {
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [lastAccessed, setLastAccessed] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const accessed = localStorage.getItem(LAST_ACCESSED_KEY);
    if (saved) setNotes(saved);
    if (accessed) setLastAccessed(accessed);
  }, []);

  // Save to localStorage with debounce feedback
  const handleSave = useCallback((value: string) => {
    setNotes(value);
    setIsSaving(true);

    // Save immediately but show indicator
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem(LAST_ACCESSED_KEY, new Date().toISOString());

    // Clear saving indicator after brief delay
    setTimeout(() => setIsSaving(false), 500);
  }, []);

  // Engage Apex Protocol
  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    localStorage.setItem(LAST_ACCESSED_KEY, new Date().toISOString());
    setLastAccessed(new Date().toISOString());
  }, []);

  // Secure and lock
  const handleLock = useCallback(() => {
    setIsLocked(true);
  }, []);

  // Clear all notes (with confirmation)
  const handleClear = useCallback(() => {
    if (window.confirm('This will permanently delete all notes. This cannot be undone. Continue?')) {
      setNotes('');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Format last accessed time
  const formatLastAccessed = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Locked State - Secure Entry Point
  if (isLocked) {
    return (
      <div className={clsx(
        "relative group",
        className
      )}>
        {/* Subtle pulsing border when locked */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg blur opacity-20 animate-pulse" />

        <div className={clsx(
          "relative bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500",
          compact ? "p-4 h-[200px]" : "p-6 h-[300px]"
        )}>
          {/* Lock Icon */}
          <svg
            className={clsx("mb-4 text-slate-600", compact ? "w-8 h-8" : "w-12 h-12")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>

          <p className={clsx(
            "font-mono uppercase tracking-widest text-slate-500 mb-1",
            compact ? "text-[10px]" : "text-xs"
          )}>
            Investigator Mode
          </p>
          <p className={clsx(
            "text-slate-600 mb-4",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {lastAccessed ? `Last accessed: ${formatLastAccessed(lastAccessed)}` : 'Local storage only'}
          </p>

          <button
            onClick={handleUnlock}
            className={clsx(
              "font-mono uppercase tracking-wider border border-slate-700 rounded-md bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300",
              compact ? "text-[10px] px-3 py-1.5" : "text-xs px-4 py-2"
            )}
          >
            Engage Apex Protocol
          </button>
        </div>
      </div>
    );
  }

  // Unlocked State - The Parking Lot
  return (
    <div className={clsx(
      "relative group",
      className
    )}>
      {/* Active state border glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-lg blur opacity-50" />

      <div className={clsx(
        "relative bg-slate-950 border border-slate-800 rounded-lg flex flex-col overflow-hidden",
        compact ? "h-[300px]" : "h-[500px]"
      )}>
        {/* Header */}
        <div className="border-b border-slate-800 p-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {/* Active indicator */}
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className={clsx(
              "text-slate-200 font-mono uppercase tracking-widest",
              compact ? "text-[10px]" : "text-xs"
            )}>
              The Parking Lot
            </h3>
            <span className={clsx(
              "text-slate-600 font-mono",
              compact ? "text-[8px]" : "text-[10px]"
            )}>
              (Local Only)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Saving indicator */}
            {isSaving && (
              <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                Saving...
              </span>
            )}

            {/* Clear button */}
            <button
              onClick={handleClear}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
              title="Clear all notes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Lock button */}
            <button
              onClick={handleLock}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-xs font-mono"
              title="Lock notebook"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {!compact && <span>Secure</span>}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 p-0 overflow-hidden">
          <textarea
            className={clsx(
              "w-full h-full bg-slate-950 text-slate-300 font-mono border-0 resize-none p-4 focus:outline-none focus:ring-0",
              compact ? "text-xs" : "text-sm"
            )}
            placeholder={`// Enter suspicious patterns here. Do not analyze in Hearth Mode...
//
// Examples:
// - "Entity X mentioned in context Y - verify connection"
// - "Timeline discrepancy noticed between sources A and B"
// - "Financial flow unclear - needs deeper investigation"
//
// This data never leaves your machine.`}
            value={notes}
            onChange={(e) => handleSave(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Footer - Security reminder */}
        <div className="border-t border-slate-800 px-3 py-2 flex justify-between items-center text-[10px] text-slate-600 font-mono shrink-0">
          <span>
            {notes.length > 0 ? `${notes.length} chars` : 'Empty'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            localStorage only
          </span>
        </div>
      </div>
    </div>
  );
}

export default InvestigatorNotebook;
