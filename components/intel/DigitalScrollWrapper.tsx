'use client';

import { ReactNode } from 'react';

export function DigitalScrollWrapper({ children, color = "cyan" }: { children: ReactNode, color?: "cyan" | "purple" | "amber" }) {

  // Map colors to Tailwind classes
  const colors = {
    cyan: { border: "border-cyan-500", bg: "bg-cyan-500", shadow: "shadow-cyan-500/50", text: "text-cyan-500" },
    purple: { border: "border-purple-500", bg: "bg-purple-500", shadow: "shadow-purple-500/50", text: "text-purple-500" },
    amber: { border: "border-amber-500", bg: "bg-amber-500", shadow: "shadow-amber-500/50", text: "text-amber-500" },
  };

  const theme = colors[color];

  return (
    <div className="relative w-full max-w-4xl mx-auto my-12 group">
      {/* 1. TOP WIREFRAME BAR */}
      <div className={`flex items-center justify-between mb-2 ${theme.text} opacity-80`}>
        <div className={`h-[2px] w-12 ${theme.bg}`} />
        <div className="font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
          <span className={`w-2 h-2 rotate-45 ${theme.bg}`} /> {/* Diamond Icon */}
          SECURE_DATALINK // {color.toUpperCase()}_TIER
        </div>
        <div className={`h-[2px] w-12 ${theme.bg}`} />
      </div>

      {/* 2. MAIN SCROLL CONTAINER */}
      <div className="relative bg-slate-950/80 border-x border-slate-800 backdrop-blur-xl overflow-hidden">

        {/* Animated Scanning Line (Colored) */}
        <div className={`absolute top-0 left-0 w-full h-[2px] ${theme.bg} shadow-[0_0_20px_currentColor] animate-scan-slow pointer-events-none z-0 opacity-50`} />

        {/* Corner Brackets (HUD Style) */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${theme.border}`} />
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${theme.border}`} />
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${theme.border}`} />
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${theme.border}`} />

        {/* Content Area */}
        <div className="relative z-10 p-8 md:p-12">
          {children}
        </div>
      </div>

      {/* 3. BOTTOM WIREFRAME BAR */}
      <div className="flex items-center gap-2 mt-2">
         <div className="h-[2px] flex-grow bg-slate-800" />
         <div className={`w-2 h-2 ${theme.bg} animate-pulse rotate-45`} /> {/* Diamond */}
         <div className="h-[2px] w-8 bg-slate-800" />
      </div>
    </div>
  );
}
