'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HelpFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true); // Default true to prevent flash

  // Check localStorage for login and tutorial state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if user has logged in (via terminal portal)
      const loginState = localStorage.getItem('apex_logged_in');
      setIsLoggedIn(loginState === 'true');

      // Check if user has seen the tutorial
      const tutorialSeen = localStorage.getItem('apex_tutorial_seen');
      setHasSeenTutorial(tutorialSeen === 'true');
    }
  }, []);

  // Don't show on landing page unless logged in
  if (!isLoggedIn) {
    return null;
  }

  const handleRestartTour = () => {
    if (typeof window !== 'undefined') {
      // Clear tutorial seen flag
      localStorage.removeItem('apex_tutorial_seen');
      setHasSeenTutorial(false);

      // Call global restart function if available
      if ((window as any).restartApexTour) {
        (window as any).restartApexTour();
      }
      setIsOpen(false);
    }
  };

  const handleDismissTutorial = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_tutorial_seen', 'true');
      setHasSeenTutorial(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" data-tour="tutorial">
      {/* Tutorial Prompt - Only show if logged in AND hasn't seen tutorial */}
      {!hasSeenTutorial && (
        <div className="absolute bottom-20 right-0 mb-2 min-w-[240px] rounded-xl bg-black/90 backdrop-blur-md border border-cyan-400/30 shadow-lg shadow-cyan-400/20 overflow-hidden p-4">
          <p className="text-cyan-300 text-sm font-mono mb-3">
            Welcome to APEX. Take a quick tour?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRestartTour}
              className="flex-1 px-3 py-2 text-xs font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors"
            >
              Start Tour
            </button>
            <button
              onClick={handleDismissTutorial}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-500/20 border border-slate-500/40 text-slate-300 rounded hover:bg-slate-500/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Menu */}
      {isOpen && hasSeenTutorial && (
        <div className="absolute bottom-20 right-0 mb-2 min-w-[200px] rounded-xl bg-black/90 backdrop-blur-md border border-cyan-400/30 shadow-lg shadow-cyan-400/20 overflow-hidden">
          <button
            onClick={handleRestartTour}
            className="w-full px-4 py-3 text-left text-white hover:bg-cyan-400/10 transition-colors duration-200 border-b border-white/10 font-mono text-sm"
          >
            🎯 Restart Tour
          </button>
          <Link
            href="/tutorial"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-left text-white hover:bg-cyan-400/10 transition-colors duration-200 font-mono text-sm"
          >
            📚 View Tutorial
          </Link>
        </div>
      )}

      {/* Glass Sphere with Prismatic Light */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-full group"
        aria-label="Help menu"
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 blur-xl group-hover:blur-2xl transition-all duration-300" />

        {/* Glass sphere container */}
        <div className="relative w-full h-full rounded-full overflow-hidden backdrop-blur-sm border-2 border-white/30 shadow-[0_0_30px_rgba(6,182,212,0.4),inset_0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_50px_rgba(6,182,212,0.6),inset_0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300">
          {/* Glass reflection effect */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full" />

          {/* Prismatic light trapped inside - animated (using global CSS class) */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 blur-md opacity-70 rounded-full animate-prismatic-pulse" />
          </div>

          {/* Additional prismatic rays */}
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-300 to-transparent blur-sm opacity-50 rounded-full" />
            <div className="absolute bottom-1/3 right-1/3 w-1/3 h-1/3 bg-gradient-to-bl from-purple-400 to-transparent blur-sm opacity-50 rounded-full" />
          </div>

          {/* AI symbol */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-white font-bold text-3xl drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)] tracking-wider">
              ✱
            </span>
          </div>

          {/* Glass shimmer overlay */}
          <div className="absolute inset-0 glass-orb-shimmer rounded-full pointer-events-none" />

          {/* Bottom highlight (glass shine) */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/20 to-transparent rounded-full" />
        </div>
      </button>
    </div>
  );
}
