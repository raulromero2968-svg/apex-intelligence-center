'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // FORCE STABLE DARK MODE - Lock theme to prevent broken gray mode
    // Theme is locked to 'dark' (current stable blue) until Deep Navy mode is ready
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.remove('light');
  }, []);

  // Toggle functionality DISABLED - theme locked to stable dark mode
  const toggleTheme = () => {
    // Disabled: prevents switching to broken light mode
    console.log('Theme toggle disabled - locked to Titan OS (Stable)');
  };

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/30 transition-all shadow-lg hover:shadow-cyan-500/50 cursor-not-allowed opacity-50"
      aria-label="Theme locked to dark mode"
      disabled
    >
      <Moon className="w-6 h-6 text-cyan-400" />
    </button>
  );
};

