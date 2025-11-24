'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TitanHeader } from '@/components/ui/TitanHeader';
import { useState } from 'react';

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert('System Error');
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

      <TitanHeader
        title="ACCESS TERMINAL"
        subtitle="SELECT CLEARANCE LEVEL"
      />

      <DigitalScrollWrapper color="amber">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* SCOUT */}
          <div className="p-8 border border-slate-800 bg-slate-900/30 rounded-xl text-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-slate-500 font-mono text-xs mb-4">TIER 1</div>
            <h3 className="text-2xl font-black text-white mb-2">SCOUT</h3>
            <div className="text-4xl font-bold text-slate-300 mb-6">$0</div>
            <button disabled className="w-full py-3 border border-slate-700 text-slate-500 text-xs font-bold uppercase">Current Plan</button>
          </div>

          {/* OPERATOR */}
          <div className="p-8 border border-purple-500 bg-purple-900/10 rounded-xl text-center relative transform scale-105 shadow-2xl shadow-purple-900/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 animate-pulse" />
            <div className="text-purple-400 font-mono text-xs mb-4">TIER 2 // POPULAR</div>
            <h3 className="text-2xl font-black text-white mb-2">OPERATOR</h3>
            <div className="text-4xl font-bold text-white mb-6">$29<span className="text-sm text-slate-400">/mo</span></div>
            <button onClick={() => handleCheckout('price_1SWvfeQPUcGNMBQFiEDv4IWZ')} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest transition-all">
              {loading ? 'PROCESSING...' : 'UPGRADE NOW'}
            </button>
          </div>

          {/* ELITE */}
          <div className="p-8 border border-cyan-500 bg-cyan-900/10 rounded-xl text-center">
            <div className="text-cyan-400 font-mono text-xs mb-4">TIER 3 // ALPHA</div>
            <h3 className="text-2xl font-black text-white mb-2">ELITE</h3>
            <div className="text-4xl font-bold text-white mb-6">$99<span className="text-sm text-slate-400">/mo</span></div>
            <button onClick={() => handleCheckout('price_1SWvfpQPUcGNMBQFb5JMtpxh')} className="w-full py-3 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black text-xs font-bold uppercase tracking-widest transition-all">
              {loading ? 'PROCESSING...' : 'GET ACCESS'}
            </button>
          </div>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
