'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Load saved theme (only on client)
    const saved = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    document.documentElement.classList.toggle('light', saved === 'light');
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };
  
  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/30 transition-all shadow-lg hover:shadow-cyan-500/50"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6 text-cyan-400" />
      ) : (
        <Moon className="w-6 h-6 text-cyan-400" />
      )}
    </button>
  );
};

