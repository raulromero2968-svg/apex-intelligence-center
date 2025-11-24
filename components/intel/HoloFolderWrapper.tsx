'use client';

import { ReactNode } from 'react';

export function HoloFolderWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full mt-8">
      {/* FOLDER TAB (Top Left) */}
      <div className="relative w-48 h-10 bg-slate-900/80 border-t border-l border-r border-slate-700 folder-tab ml-1 flex items-center px-4 backdrop-blur-md z-10">
        <div className="w-2 h-2 bg-cyan-500 animate-pulse rounded-full mr-2"></div>
        <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">ARCHIVE_ROOT_DIR</span>
      </div>

      {/* MAIN FOLDER BODY */}
      <div className="relative w-full bg-slate-950/40 border border-slate-800 rounded-tr-xl rounded-br-xl rounded-bl-xl backdrop-blur-sm p-6 md:p-10 overflow-hidden">

        {/* Holographic Sheen Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse" />

        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-xl"></div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
