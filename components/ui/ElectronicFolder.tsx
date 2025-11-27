'use client';

import React from 'react';
import clsx from 'clsx';

interface ElectronicFolderProps {
  title: string;
  classification?: string;
  children: React.ReactNode;
  className?: string;
}

export function ElectronicFolder({
  title,
  classification = "CONFIDENTIAL // APEX INTEL",
  children,
  className
}: ElectronicFolderProps) {
  return (
    <div className={clsx("flex flex-col w-full font-mono", className)}>
      {/* Folder Tab - Digital Dossier Look */}
      <div className="flex items-end">
        <div className="bg-slate-900 border-t border-l border-r border-slate-700 px-6 py-2 rounded-t-lg relative">
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">
            {title}
          </span>
          {/* Decorative connector */}
          <div className="absolute bottom-[-1px] right-[-20px] w-[20px] h-[1px] bg-slate-700" />
        </div>
        <div className="flex-1 border-b border-slate-700 h-[1px] mb-[1px]" />
      </div>

      {/* Folder Body - Classified File Container */}
      <div className="bg-slate-950/50 border-x border-b border-slate-700 rounded-b-lg rounded-tr-lg p-8 relative backdrop-blur-sm">
        {/* Classification Watermark */}
        <div className="absolute top-4 right-6 text-[10px] text-red-500/50 border border-red-500/30 px-2 py-0.5 rounded font-mono tracking-wider">
          {classification}
        </div>

        {/* Corner Security Markers */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/40" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40" />

        <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-cyan-50 prose-h3:text-lg prose-h4:text-base text-sm md:text-base max-w-none mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
