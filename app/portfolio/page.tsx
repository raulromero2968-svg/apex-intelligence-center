'use client';

import { useState } from 'react';
import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';

export default function PortfolioPage() {
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Mock Scan Process
    setTimeout(() => {
      alert("VARC System: Camera Access Required for Production Build.\n(Simulated Scan: Charizard Base Set Detected)");
      setScanning(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER / SCANNER */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-cyan-400 font-mono text-xs mt-1">PORTFOLIO ANALYTICS // LIVE</p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-none border border-cyan-400 font-mono uppercase tracking-widest flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            {scanning ? (
              <><span className="animate-spin">⚡</span> SCANNING...</>
            ) : (
              <><span>⊕</span> SCAN CARD</>
            )}
          </button>
        </div>

        {/* SIMPLIFIED DASHBOARD (Wrapped in Scroll Aesthetic) */}
        <DigitalScrollWrapper>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Metric 1 */}
            <div className="p-4 border border-slate-800 bg-slate-900/50">
              <h3 className="text-slate-500 text-xs uppercase">Total Valuation</h3>
              <p className="text-3xl font-bold text-white mt-1">$12,845.50</p>
              <p className="text-green-400 text-xs mt-1">▲ +$420.25 (24h)</p>
            </div>
            {/* Metric 2 */}
            <div className="p-4 border border-slate-800 bg-slate-900/50">
              <h3 className="text-slate-500 text-xs uppercase">Top Performer</h3>
              <p className="text-xl font-bold text-white mt-1">Charizard Base Set</p>
              <p className="text-green-400 text-xs mt-1">PSA 9 // +2.4%</p>
            </div>
            {/* Metric 3 */}
            <div className="p-4 border border-slate-800 bg-slate-900/50">
              <h3 className="text-slate-500 text-xs uppercase">Market Pulse</h3>
              <p className="text-xl font-bold text-cyan-400 mt-1">BULLISH</p>
              <div className="w-full bg-slate-800 h-1 mt-3">
                <div className="bg-cyan-400 h-1 w-[75%]" />
              </div>
            </div>
          </div>

          {/* CHART PLACEHOLDER */}
          <div className="h-64 w-full bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-8">
             <p className="text-slate-600 font-mono text-xs">[ INTERACTIVE CHART MODULE ]</p>
          </div>

          {/* HOLDINGS LIST */}
          <h3 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Recent Scans</h3>
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="text-xs uppercase text-slate-600">
                <th className="pb-2">Asset</th>
                <th className="pb-2">Grade</th>
                <th className="pb-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 text-white">Charizard Base Set</td>
                <td className="py-3"><span className="bg-slate-800 text-xs px-2 py-1 rounded">PSA 9</span></td>
                <td className="py-3 text-right text-green-400">$1,350.00</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 text-white">The One Ring (Serialized)</td>
                <td className="py-3"><span className="bg-slate-800 text-xs px-2 py-1 rounded">RAW</span></td>
                <td className="py-3 text-right text-green-400">$4,200.00</td>
              </tr>
            </tbody>
          </table>
        </DigitalScrollWrapper>

      </div>
    </main>
  );
}
