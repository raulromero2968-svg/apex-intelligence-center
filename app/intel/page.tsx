<<<<<<< HEAD
'use client';

import { useState } from 'react';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelGridCard } from '@/components/intel/IntelGridCard';
import { HoloFolderWrapper } from '@/components/intel/HoloFolderWrapper';
import { TitanHeader } from '@/components/ui/TitanHeader';

const categories = ['All', 'Research', 'Blog', 'Intel', 'Vintage Analysis', 'Set Analysis', 'Strategy'];

export default function IntelPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredArchive = activeTab === 'All'
    ? INTEL_ARCHIVE
    : INTEL_ARCHIVE.filter(item => item.category === activeTab);

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">

      {/* TITAN HUD HEADER */}
      <TitanHeader
        title="LATEST INTELLIGENCE"
        subtitle="DECRYPTING MARKET DATA... // VERIFIED"
      />

      {/* 2. FILTERS */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
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

      {/* 3. HOLOGRAPHIC FOLDER GRID */}
      <div className="max-w-7xl mx-auto pb-24">
        <HoloFolderWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArchive.map((item) => (
              <IntelGridCard key={item.id} item={item} />
            ))}
          </div>
        </HoloFolderWrapper>
      </div>

    </main>
=======
import { CardViewer } from '@/components/three/CardViewer';
import { IntelChart } from '@/components/intel/IntelChart';
import { IntelChat } from '@/components/intel/IntelChat';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import { ShieldCheck, Zap } from 'lucide-react';

export default function IntelPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">
      <StarfieldBackground />

      {/* Decorative background blurs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* CENTER COLUMN: Analysis (Span 3) */}
        <div className="xl:col-span-3 space-y-6">

          {/* Header */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Apex Intelligence Center</h1>
              <p className="text-slate-400 text-sm mt-1">Live Market Data // Global TCG Index</p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Verified Sources
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <Zap className="w-3 h-3 text-yellow-400" />
                Low Latency
              </span>
            </div>
          </div>

          {/* 3D Viewer & Key Metric */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-[400px]">
              <CardViewer />
            </div>
            <div className="lg:col-span-2 h-[400px]">
              <IntelChart title="Market Alpha: Charizard G-Spec" />
            </div>
          </div>

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {['Market Cap', '24h Vol', 'Whale Mov.', 'Sentiment'].map((label, i) => (
               <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                 <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">{label}</div>
                 <div className="text-xl font-bold text-white font-mono">
                   {i === 3 ? 'BULLISH' : `$${(Math.random() * 1000).toFixed(2)}M`}
                 </div>
                 <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                   ▲ {(Math.random() * 5).toFixed(2)}%
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Feed (Span 1) */}
        <div className="xl:col-span-1 h-full">
           <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <IntelChat />
           </div>
        </div>

      </div>
    </div>
>>>>>>> origin/claude/realtime-intelligence-chat-014ot9GLRmGVQfCHcm5tagnN
  );
}
