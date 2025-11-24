// FILE: app/subscribe/page.tsx
'use client';

import React, { useState } from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null);

  // THE CHECKOUT LOGIC
  const handleCheckout = async (priceId: string, tierName: string) => {
    try {
      setLoading(tierName);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        console.error('Checkout failed:', data.error);
        alert('Checkout failed. Please try again.');
        setLoading(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans">
      <StarfieldBackground />
      <Navigation />

      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">

        <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-white mb-6 glow-text-purple">
          Upgrade Your Intel
        </h1>
        <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
          Stop guessing. Start knowing. Unlock institutional-grade predictive analytics.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* FREE TIER */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col hover:border-gray-600 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Scout</h3>
            <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-sm text-gray-400 mb-8">Essential market tracking.</p>
            <ul className="space-y-4 mb-8 text-left flex-1">
              <li className="flex items-start"><Check size={18} className="text-cyan-500 mr-2 shrink-0" /> <span className="text-sm">Real-time Market Data</span></li>
              <li className="flex items-start"><Check size={18} className="text-cyan-500 mr-2 shrink-0" /> <span className="text-sm">Weekly Reports</span></li>
            </ul>
            <button disabled className="w-full py-3 border border-gray-700 rounded-lg text-gray-500 font-mono text-sm cursor-not-allowed">
              CURRENT PLAN
            </button>
          </div>

          {/* PRO TIER */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-gray-900/60 border border-cyan-500 rounded-2xl p-8 flex flex-col relative shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black font-bold px-4 py-1 rounded-full text-xs tracking-wider">
              RECOMMENDED
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center">
              <Zap size={20} className="text-cyan-400 mr-2" /> Operator
            </h3>
            <div className="text-4xl font-bold text-white mb-6">$29<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-sm text-gray-400 mb-8">Advanced tools for the data-driven investor.</p>

            <ul className="space-y-4 mb-8 text-left flex-1">
              <li className="flex items-start"><Check size={18} className="text-cyan-500 mr-2 shrink-0" /> <span className="text-sm font-bold text-white">AI Predictive Analytics</span></li>
              <li className="flex items-start"><Check size={18} className="text-cyan-500 mr-2 shrink-0" /> <span className="text-sm">Unlimited Portfolio Tracking</span></li>
            </ul>

            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!, 'pro')}
              disabled={loading === 'pro'}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-black font-bold font-mono text-sm transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center"
            >
              {loading === 'pro' ? <Loader2 className="animate-spin mr-2" size={18} /> : 'UPGRADE NOW'}
            </button>
          </motion.div>

          {/* WHALE TIER */}
          <div className="bg-gray-900/20 border border-purple-500/30 rounded-2xl p-8 flex flex-col hover:border-purple-500 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center">
              <Crown size={20} className="text-purple-500 mr-2" /> Whale
            </h3>
            <div className="text-4xl font-bold text-white mb-6">$99<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <p className="text-sm text-gray-400 mb-8">Institutional access.</p>

            <ul className="space-y-4 mb-8 text-left flex-1">
              <li className="flex items-start"><Check size={18} className="text-purple-500 mr-2 shrink-0" /> <span className="text-sm">Unlimited VARC Scans</span></li>
              <li className="flex items-start"><Check size={18} className="text-purple-500 mr-2 shrink-0" /> <span className="text-sm">API Access</span></li>
            </ul>

            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WHALE!, 'whale')}
              disabled={loading === 'whale'}
              className="w-full py-3 border border-purple-500/50 text-purple-400 hover:bg-purple-900/20 rounded-lg font-mono text-sm transition-colors flex items-center justify-center"
            >
              {loading === 'whale' ? <Loader2 className="animate-spin mr-2" size={18} /> : 'GET ALPHA ACCESS'}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
