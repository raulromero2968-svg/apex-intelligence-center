/**
 * InvestigatorNotebook - The Parking Lot for Pattern-Matching Thoughts
 *
 * A secure, local-only notebook for documenting investigative observations
 * during Apex sessions. Features an "Incinerate" function for psychological
 * safety - allowing users to flush paranoid pattern-matching once recognized.
 *
 * Design Philosophy:
 * - Data never leaves the browser (localStorage only)
 * - Password-protected to prevent accidental exposure
 * - Incinerate feature provides cathartic closure
 * - The Luminous Jellyfish Principle: Map the exit, not just the abyss
 *
 * @module power-network/InvestigatorNotebook
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Trash2, Flame, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'apex_investigator_notes';
const LOCK_KEY = 'apex_investigator_locked';

export interface InvestigatorNotebookProps {
  defaultLocked?: boolean;
  onIncinerateComplete?: () => void;
}

export function InvestigatorNotebook({
  defaultLocked = true,
  onIncinerateComplete
}: InvestigatorNotebookProps) {
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(defaultLocked);
  const [isBurning, setIsBurning] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      const savedLockState = localStorage.getItem(LOCK_KEY);

      if (savedNotes) {
        setNotes(savedNotes);
      }
      if (savedLockState !== null) {
        setIsLocked(savedLockState === 'true');
      }
    }
  }, []);

  // Auto-save notes when they change (debounced)
  useEffect(() => {
    if (!isLocked && notes) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, notes);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [notes, isLocked]);

  // Handle unlock attempt
  const handleUnlock = useCallback(() => {
    // Simple passphrase check - "APEX" backwards
    // This is intentionally simple - security through obscurity is not the goal
    // The goal is to prevent accidental exposure
    if (passphrase.toLowerCase() === 'xepa') {
      setIsLocked(false);
      localStorage.setItem(LOCK_KEY, 'false');
      setPassphrase('');
    } else {
      // Visual feedback for wrong passphrase
      setPassphrase('');
    }
  }, [passphrase]);

  // Handle lock
  const handleLock = useCallback(() => {
    setIsLocked(true);
    localStorage.setItem(LOCK_KEY, 'true');
  }, []);

  // Handle incinerate with dramatic effect
  const handleIncinerate = useCallback(() => {
    const confirmed = window.confirm(
      'CONFIRM INCINERATION: This will permanently destroy these notes.\n\n' +
      'Use this to clear your mind after an Apex Session.\n\n' +
      'This action cannot be undone.'
    );

    if (confirmed) {
      setIsBurning(true);

      // Visual delay for the "burn" effect
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        setNotes('');
        setIsBurning(false);
        setHasUnsavedChanges(false);
        setLastSaved(null);
        onIncinerateComplete?.();
      }, 1500);
    }
  }, [onIncinerateComplete]);

  // Handle text change
  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (notes) {
      localStorage.setItem(STORAGE_KEY, notes);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    }
  }, [notes]);

  // Locked view
  if (isLocked) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl h-[500px] flex flex-col">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amber-500" />
            <span className="text-slate-200 font-mono text-sm uppercase tracking-widest">
              The Parking Lot
            </span>
            <span className="text-xs text-amber-500/60 ml-auto">[SECURED]</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <Lock size={28} className="text-amber-500" />
          </div>

          <p className="text-sm text-slate-400 text-center mb-6 max-w-xs">
            This notebook contains investigative observations.
            Enter the passphrase to access.
          </p>

          <div className="w-full max-w-xs space-y-3">
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter passphrase..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
              >
                {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 rounded-lg px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Unlock size={14} />
              Unlock Notebook
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-6 text-center italic">
            Hint: The key is reflection.
          </p>
        </div>
      </div>
    );
  }

  // Unlocked view
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl h-[500px] flex flex-col relative overflow-hidden">

      {/* The Burn Overlay Animation */}
      {isBurning && (
        <div className="absolute inset-0 bg-orange-600/20 z-50 flex items-center justify-center animate-pulse backdrop-blur-sm">
          <div className="text-center">
            <Flame size={64} className="text-orange-500 animate-bounce mx-auto mb-2" />
            <span className="text-orange-500 font-mono font-bold text-lg">INCINERATING DATA...</span>
            <p className="text-orange-400/60 text-xs mt-2">Releasing thoughts to the void</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Unlock size={14} className="text-emerald-500" />
            <span className="text-slate-200 font-mono text-sm uppercase tracking-widest">
              The Parking Lot
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-500">*unsaved</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManualSave}
              disabled={!hasUnsavedChanges}
              className="bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Save size={12} />
              Save
            </button>

            <button
              onClick={handleIncinerate}
              disabled={!notes}
              className="bg-red-900/30 hover:bg-red-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-red-300 rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-red-900/50"
            >
              <Trash2 size={12} />
              Incinerate
            </button>

            <button
              onClick={handleLock}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Lock size={12} />
              Secure
            </button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-400/80">
          Local storage only. These notes never leave your browser.
          Use this space for raw pattern-matching during investigations.
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="[Begin investigative notes...]

Use this space to document:
- Connections you're seeing
- Questions that arise
- Patterns that might be meaningful
- Thoughts you need to 'park' before returning to baseline

Remember the Luminous Jellyfish Principle:
Map the exit, not just the abyss. Include solution pathways.

When done, use INCINERATE to clear your mind."
          className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none focus:border-slate-700 font-mono leading-relaxed"
        />
      </div>

      {/* Footer Status */}
      <div className="border-t border-slate-800 px-4 py-2 flex justify-between items-center text-xs text-slate-500">
        <span>
          {notes.length > 0
            ? `${notes.length} characters | ${notes.split(/\s+/).filter(Boolean).length} words`
            : 'Empty notebook'}
        </span>
        {lastSaved && (
          <span className="text-emerald-500/60">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default InvestigatorNotebook;
