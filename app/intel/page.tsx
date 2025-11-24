'use client';

import { useState } from 'react';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelGridCard } from '@/components/intel/IntelGridCard';
import { TitanHeader } from '@/components/ui/TitanHeader';
import { HoloFolderWrapper } from '@/components/intel/HoloFolderWrapper';

const categories = ['All', 'Research', 'Blog', 'Intel', 'Vintage Analysis', 'Set Analysis', 'Strategy'];

export default function IntelPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredArchive = activeTab === 'All'
    ? INTEL_ARCHIVE
    : INTEL_ARCHIVE.filter(item => item.category === activeTab);

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

      {/* TITAN HEADER */}
      <TitanHeader
        title="INTELLIGENCE ARCHIVE"
        subtitle="CLASSIFIED MARKET DATA // LEVEL 5 CLEARANCE"
      />

      {/* FILTERS */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-4xl mx-auto">
        {categories.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 text-[10px] font-mono uppercase tracking-wider border transition-all skew-x-[-10deg]
              ${activeTab === tab
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}
            `}
          >
            <span className="skew-x-[10deg] block">{tab}</span>
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto">
        <HoloFolderWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArchive.map((item) => (
              <IntelGridCard key={item.id} item={item} />
            ))}
          </div>
        </HoloFolderWrapper>
      </div>

    </main>
  );
}
