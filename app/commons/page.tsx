'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TitanHeader } from '@/components/ui/TitanHeader';

export default function CommonsPage() {
  return (
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

      <TitanHeader
        title="APEX COMMONS"
        subtitle="COMMUNITY PROTOCOLS // ACTIVE"
      />

      <DigitalScrollWrapper color="cyan">
        <div className="text-center max-w-2xl mx-auto mb-12">
           <h2 className="text-3xl font-black text-white mb-4">GRATITUDE, NOT IDOLATRY</h2>
           <p className="text-slate-400">We celebrate the work, not the person. We refuse to turn market analysts into gods.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-6 bg-cyan-950/20 border border-cyan-500/30 rounded">
              <h3 className="text-cyan-400 font-bold mb-2">CELEBRATE THE WORK</h3>
              <p className="text-slate-400 text-sm">We honor people who use their power to create positive change in the market.</p>
           </div>
           <div className="p-6 bg-slate-900/50 border border-slate-800 rounded">
              <h3 className="text-white font-bold mb-2">STAY CLEAR-EYED</h3>
              <p className="text-slate-400 text-sm">Even heroes are human. We acknowledge limits and complexities.</p>
           </div>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
