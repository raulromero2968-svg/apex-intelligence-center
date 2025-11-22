'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HelpFAB() {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="absolute bottom-16 right-0 mb-2 min-w-[200px] rounded-xl bg-black/90 backdrop-blur-md border border-cyan-400/30 shadow-lg shadow-cyan-400/20 overflow-hidden">
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

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-white font-bold text-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white/20"
        aria-label="Help menu"
      >
        ?
      </button>
    </div>
  );
}
