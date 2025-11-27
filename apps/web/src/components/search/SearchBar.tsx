'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = ""
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');

  // Stub function for command palette
  const openCommandPalette = () => {
    console.log('Command palette triggered');
    // This would open a command palette modal in a real implementation
    inputRef.current?.focus();
  };

  // Handle Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Don't call onSearch on every keystroke - only on form submit
  };

  // Detect platform for displaying correct keyboard shortcut
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <form
      onSubmit={handleSearch}
      className="relative w-full max-w-2xl mx-auto"
      role="search"
    >
      <label htmlFor="site-search" className="sr-only">
        Search Apex Intelligence
      </label>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          id="site-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          aria-placeholder=""
          className={`
            w-full h-14 pl-12 pr-20 rounded-lg
            bg-white/5 backdrop-blur-sm
            border-2 transition-all duration-200
            text-white placeholder-white/50
            focus:outline-none
            ${isFocused
              ? 'border-cyan-400 shadow-lg shadow-cyan-400/20'
              : 'border-white/10 hover:border-white/20'
            }
          `}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />

        {/* Keyboard Shortcut Hint */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70 border border-white/20">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Focus ring for accessibility */}
      <div
        className={`
          absolute inset-0 rounded-lg pointer-events-none
          ring-2 ring-offset-2 ring-offset-ink transition-opacity
          ${isFocused ? 'ring-cyan-400 opacity-100' : 'opacity-0'}
        `}
      />
    </form>
  );
}

