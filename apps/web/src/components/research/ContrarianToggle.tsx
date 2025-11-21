'use client';

import { useState, useEffect } from 'react';
import { Brain, AlertCircle } from 'lucide-react';

interface ContrarianToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function ContrarianToggle({ enabled, onToggle }: ContrarianToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-black/40 border border-cyan-500/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-medium text-white">Contrarian Mode</span>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-cyan-500' : 'bg-white/20'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {enabled && (
        <div className="flex items-center gap-1 text-xs text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          <span>Both perspectives enabled</span>
        </div>
      )}
    </div>
  );
}

