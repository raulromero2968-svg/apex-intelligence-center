'use client';

import { ReactNode } from 'react';

export function DigitalScrollWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-4xl mx-auto my-12 group">
      {/* 1. TOP WIREFRAME BAR */}
      <div className="flex items-center justify-between mb-2 text-cyan-500/50">
        <div className="h-[2px] w-12 bg-cyan-500" />
        <div className="font-mono text-[10px] tracking-widest uppercase">
          SECURE_DATALINK // ENCRYPTED
        </div>
        <div className="h-[2px] w-12 bg-cyan-500" />
      </div>

      {/* 2. MAIN SCROLL CONTAINER */}
      <div className="relative bg-slate-950/80 border-x border-slate-800 backdrop-blur-xl overflow-hidden">

        {/* Animated Scanning Line (The "Racecar" feel) */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-scan-slow pointer-events-none z-0" />

        {/* Corner Brackets (HUD Style) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />

        {/* Content Area */}
        <div className="relative z-10 p-8 md:p-12">
          {children}
        </div>
      </div>

      {/* 3. BOTTOM WIREFRAME BAR */}
      <div className="flex items-center gap-2 mt-2">
         <div className="h-[2px] flex-grow bg-slate-800" />
         <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
         <div className="h-[2px] w-8 bg-slate-800" />
      </div>
    </div>
  );
}
