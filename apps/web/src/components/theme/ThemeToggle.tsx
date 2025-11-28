'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', newTheme);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <div className="w-24 h-8" />; // Placeholder to prevent layout shift
  }

  return (
    <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/50 rounded-lg p-1">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'light'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Light Mode (Altaria Pastel)"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'system'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title="System (Current Design)"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'dark'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Dark Mode (Cyan Serious)"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
};
