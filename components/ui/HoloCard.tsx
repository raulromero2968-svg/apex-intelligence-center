'use client';

import React from 'react';
import clsx from 'clsx';

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'high';
}

export function HoloCard({ children, className, intensity = 'low' }: HoloCardProps) {
  return (
    <div className={clsx("relative group", className)}>
      {/* Animated Border Gradient - Breathing Energy Field */}
      <div
        className={clsx(
          "absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur transition duration-1000 group-hover:duration-200 animate-tilt",
          intensity === 'high' ? "opacity-50 group-hover:opacity-90" : "opacity-30 group-hover:opacity-75"
        )}
      />

      {/* Main Container - Glass-morphic */}
      <div className="relative h-full bg-slate-950 border border-slate-800 rounded-lg p-6 backdrop-blur-xl overflow-hidden">
        {/* Scanline Effect */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))',
            backgroundSize: '100% 4px, 3px 100%'
          }}
        />

        {/* Corner Accents - Classified Visual Metaphor */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 opacity-50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 opacity-50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 opacity-50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 opacity-50" />

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
