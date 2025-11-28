'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const DismissibleBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('equilibrium-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('equilibrium-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-40 bg-cyan-500/10 backdrop-blur border-b border-cyan-500/40 text-center text-[10px] sm:text-xs md:text-sm text-cyan-300 font-semibold tracking-wide py-2 shadow-lg">
      <div className="relative max-w-7xl mx-auto px-4 flex items-center justify-center">
        <span>PRODUCTION EQUILIBRIUM ACHIEVED – NOVEMBER 19 2025</span>
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 hover:bg-cyan-500/20 rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
