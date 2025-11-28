'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HelpFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Connect to auth system

  // Don't show on landing page unless logged in
  if (!isLoggedIn) {
    return null;
  }

  const handleRestartTour = () => {
    if (typeof window !== 'undefined' && (window as any).restartApexTour) {
      (window as any).restartApexTour();
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" data-tour="tutorial">
      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 mb-2 min-w-[200px] rounded-xl bg-black/90 backdrop-blur-md border border-cyan-400/30 shadow-lg shadow-cyan-400/20 overflow-hidden">
          <button
            onClick={handleRestartTour}
            className="w-full px-4 py-3 text-left text-white hover:bg-cyan-400/10 transition-colors duration-200 border-b border-white/10"
          >
            🎯 Restart Tour
          </button>
          <Link
            href="/tutorial"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-left text-white hover:bg-cyan-400/10 transition-colors duration-200"
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
          
          {/* Prismatic light trapped inside - animated */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 blur-md opacity-70 rounded-full" />
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
          
          {/* Bottom highlight (glass shine) */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/20 to-transparent rounded-full" />
        </div>
      </button>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
