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
      alert('Checkout Error');
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <TitanHeader
        title="ACCESS TERMINAL"
        subtitle="SUBSCRIPTION TIERS // AVAILABLE"
      />

      <DigitalScrollWrapper>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="p-6 border border-slate-800 rounded-lg text-center opacity-70">
            <h3 className="text-white font-bold text-lg">Scout</h3>
            <div className="text-3xl font-bold text-slate-500 my-4">$0<span className="text-sm font-normal">/mo</span></div>
            <ul className="text-xs text-slate-400 space-y-2 mb-6 text-left pl-4">
              <li>✓ Real-time Market Data</li>
              <li>✓ Weekly Reports</li>
            </ul>
            <button disabled className="w-full py-2 border border-slate-700 text-slate-500 text-xs uppercase">Current Plan</button>
          </div>

          {/* Pro Tier */}
          <div className="p-6 border border-cyan-500/50 bg-cyan-950/20 rounded-lg text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#22d3ee]" />
            <h3 className="text-white font-bold text-lg">Operator</h3>
            <div className="text-3xl font-bold text-white my-4">$29<span className="text-sm font-normal text-slate-400">/mo</span></div>
            <ul className="text-xs text-slate-300 space-y-2 mb-6 text-left pl-4">
              <li>✓ AI Predictive Analytics</li>
              <li>✓ Unlimited Portfolio Tracking</li>
              <li>✓ Market Arbitrage Tools</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1SWvfeQPUcGNMBQFiEDv4IWZ')}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs uppercase font-bold tracking-wider transition-all"
            >
              {loading === 'price_1SWvfeQPUcGNMBQFiEDv4IWZ' ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>

          {/* Whale Tier */}
          <div className="p-6 border border-purple-500/50 bg-purple-950/20 rounded-lg text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            <h3 className="text-white font-bold text-lg">Whale</h3>
            <div className="text-3xl font-bold text-white my-4">$99<span className="text-sm font-normal text-slate-400">/mo</span></div>
            <ul className="text-xs text-slate-300 space-y-2 mb-6 text-left pl-4">
              <li>✓ Institutional Access</li>
              <li>✓ Unlimited VARC Scans</li>
              <li>✓ API Access</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1SWvfpQPUcGNMBQFb5JMtpxh')}
              className="w-full py-2 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white text-xs uppercase font-bold tracking-wider transition-all"
            >
              {loading === 'price_1SWvfpQPUcGNMBQFb5JMtpxh' ? 'Processing...' : 'Get Alpha Access'}
            </button>
          </div>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
