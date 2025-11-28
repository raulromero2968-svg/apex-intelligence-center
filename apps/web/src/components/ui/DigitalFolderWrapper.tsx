'use client';

import { ReactNode, useState, useEffect } from 'react';

interface DigitalFolderWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function DigitalFolderWrapper({ title, subtitle, children }: DigitalFolderWrapperProps) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    // Update line count on mount
    setLineCount(document.querySelectorAll('p').length);

    // Update scroll percent on scroll
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollPercent(Math.round((window.scrollY / scrollHeight) * 100));
      }
    };

    handleScroll(); // Initial value
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Terminal Header */}
      <div className="border-b border-cyan-500/30 bg-black/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          {/* Traffic Light Buttons */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" />
          </div>
          <span className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
            APEX_COMMONS_DOCUMENT_VIEWER
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>●</span>
          <span>SECURE_READ</span>
        </div>
      </div>

      {/* Content Container with Enforced Spacing */}
      <div className="border border-cyan-500/20 border-t-0 bg-gradient-to-br from-slate-950/90 to-slate-900/90 backdrop-blur-md rounded-b-lg overflow-hidden">
        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.02)_50%)] bg-[length:100%_4px] opacity-30" />

        {/* Content with Explicit Spacing */}
        <div className="relative px-8 md:px-12 py-12">
          {/* Title Section */}
          {title && (
            <div className="mb-12 pb-8 border-b border-cyan-500/20">
              <h1 className="text-4xl md:text-5xl font-bold text-holographic mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl text-cyan-300/80 font-mono">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Essay Content with Forced Spacing */}
          <div className="space-y-8">
            {children}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-cyan-500/30 bg-black/40 px-6 py-2 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>SCROLL: ▼ {scrollPercent}%</span>
          <span>ENCODING: UTF-8</span>
          <span>LINES: {lineCount}</span>
        </div>
      </div>
    </div>
  );
}
