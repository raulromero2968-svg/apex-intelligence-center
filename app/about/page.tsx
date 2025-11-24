'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TitanHeader } from '@/components/ui/TitanHeader';

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">
      {/* 1. UNIFIED HEADER */}
      <TitanHeader
        title="MISSION BRIEFING"
        subtitle="OPERATIONAL OBJECTIVES // CLASSIFIED"
      />

      {/* 2. UNIFIED SCROLL CONTAINER */}
      <DigitalScrollWrapper color="purple">
        <div className="space-y-12">
          <section>
            <h3 className="text-2xl font-black text-white mb-6 border-l-4 border-purple-500 pl-4">THE OBJECTIVE</h3>
            <p className="text-slate-300 text-lg leading-relaxed font-light">
              The TCG market is a multi-billion dollar industry, but most collectors are flying blind.
              Price data is scattered. Analysis is shallow. Intelligence is locked behind Discord paywalls.
              <br /><br />
              <strong>Apex Intelligence</strong> is the solution: A decentralized network for serious collectors to access institutional-grade data without the noise.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {['DATA-DRIVEN', 'TRANSPARENT', 'ACTIONABLE'].map((val) => (
               <div key={val} className="p-6 border border-slate-700 bg-slate-900/50 text-center">
                 <span className="text-purple-400 font-mono text-xs tracking-widest block mb-2">CORE VALUE</span>
                 <span className="text-white font-bold tracking-tight">{val}</span>
               </div>
             ))}
          </div>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
