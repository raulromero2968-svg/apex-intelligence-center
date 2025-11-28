'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

interface ElectronicFolderProps {
  title: string;
  classification?: string;
  children: ReactNode;
  className?: string;
}

/**
 * ElectronicFolder - Digital classified dossier container
 * Use for: Structured content sections, profile displays, intel briefings
 *
 * Features:
 * - Classified dossier aesthetic with tabbed header
 * - Pulsing classification badge
 * - Auto-generated DOC.REF identifier
 * - APEX watermark and footer classification
 * - Tab connector line for authentic folder look
 */
export function ElectronicFolder({
  title,
  classification = 'CONFIDENTIAL // APEX INTEL',
  children,
  className,
}: ElectronicFolderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={clsx('relative font-mono', className)}
    >
      {/* Folder Tab Row */}
      <div className="relative flex items-end">
        {/* Tab shape with connector */}
        <div className="relative">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-cyan-500/40 border-b-0 rounded-t-lg">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400 tracking-widest uppercase">
              {title}
            </span>
          </div>
          {/* Tab bottom connector - hides the border between tab and content */}
          <div className="absolute -bottom-[1px] left-[1px] right-[1px] h-[1px] bg-slate-900" />
        </div>

        {/* Decorative line extending from tab */}
        <div className="flex-1 border-b border-slate-700 h-[1px] mb-[1px]" />

        {/* Classification badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-3 py-1 mb-1 rounded bg-red-950/30 border border-red-500/30"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] text-red-400 tracking-wider">
            {classification}
          </span>
        </motion.div>
      </div>

      {/* Folder Content */}
      <div className="relative border border-cyan-500/40 border-t-0 rounded-b-lg rounded-tr-lg bg-slate-950/60 backdrop-blur-sm overflow-hidden">
        {/* Top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/60 via-cyan-400/80 to-cyan-500/60" />

        {/* Corner stamps */}
        <div className="absolute top-4 right-4 text-[10px] text-slate-600 tracking-widest opacity-50">
          DOC.REF: APX-{Math.random().toString(36).substring(2, 8).toUpperCase()}
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span className="text-[120px] font-black tracking-widest rotate-[-15deg] select-none text-prismatic opacity-10">
            APEX
          </span>
        </div>

        {/* Content area */}
        <div className="relative z-10 p-8 md:p-10">
          {children}
        </div>

        {/* Bottom classification stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-transparent via-slate-900/80 to-transparent flex items-center justify-center">
          <span className="text-[10px] text-slate-600 tracking-[0.3em]">
            HANDLE VIA APEX CHANNELS ONLY
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default ElectronicFolder;
