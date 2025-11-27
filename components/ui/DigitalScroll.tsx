'use client';

import React from 'react';
import clsx from 'clsx';

interface DigitalScrollProps {
  height?: string;
  children: React.ReactNode;
  className?: string;
}

export function DigitalScroll({ height = "h-[600px]", children, className }: DigitalScrollProps) {
  return (
    <div className={clsx("relative border-l-2 border-slate-800 pl-4", className)}>
      {/* Scrollable Container - Terminal Readout Simulation */}
      <div
        className={clsx(
          "overflow-y-auto pr-4 custom-scrollbar",
          height
        )}
      >
        {children}
      </div>

      {/* Scroll Indicators - Glowing Edge Markers */}
      <div className="absolute top-0 left-[-2px] h-8 w-[2px] bg-gradient-to-b from-cyan-500 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-[-2px] h-8 w-[2px] bg-gradient-to-t from-cyan-500 to-transparent pointer-events-none" />

      {/* Optional: Fade overlays for scroll indication */}
      <div className="absolute top-0 left-4 right-4 h-6 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-4 right-4 h-6 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
    </div>
  );
}
