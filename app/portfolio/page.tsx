'use client';

import React from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { PieChart, Activity, TrendingUp, TrendingDown, Plus, Wallet, Search } from 'lucide-react';
import IntelChart from '@/components/intel/IntelChart';
import { motion } from 'framer-motion';

export default function PortfolioPage() {
  // MOCK DATA: Simulating a user's portfolio
  const portfolioValue = "$12,845.50";
  const dayChange = "+$420.25 (3.4%)";
  const isPositive = true;

  const assets = [
    { name: "Charizard Base Set (PSA 9)", type: "Pokemon", price: "$1,850.00", change: "+2.5%", trend: "up" },
    { name: "The One Ring (Serialized)", type: "MTG", price: "$4,200.00", change: "+0.8%", trend: "up" },
    { name: "Enchanted Elsa (PSA 10)", type: "Lorcana", price: "$850.00", change: "-1.2%", trend: "down" },
    { name: "Black Lotus (Unlimited)", type: "MTG", price: "$5,100.00", change: "+0.0%", trend: "flat" },
  ];

  return (
    <main className="min-h-screen text-gray-300 font-sans relative z-10">
      <StarfieldBackground />
      <Navigation />

      <div className="relative pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">

        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-orbitron tracking-wide">
              Command Center
            </h1>
            <p className="text-cyan-500 font-mono text-xs tracking-widest mt-1">
              PORTFOLIO ANALYTICS // LIVE
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
             <button className="flex items-center px-4 py-2 bg-[#030712] border border-gray-700 hover:border-cyan-500 text-sm font-mono text-cyan-500 rounded transition-colors">
                <Search size={16} className="mr-2" />
                SCAN CARD
             </button>
             <button className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-sm font-bold rounded transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <Plus size={16} className="mr-2" />
                ADD ASSET
             </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* TOTAL VALUE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-cyan-500/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-cyan-900/20 rounded-lg text-cyan-400">
                  <Wallet size={24} />
               </div>
               <span className="text-xs font-mono text-gray-500">TOTAL VALUATION</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">{portfolioValue}</h2>
            <div className={`flex items-center text-sm font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
               {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
               {dayChange} <span className="text-gray-600 ml-2">24H</span>
            </div>
          </motion.div>

          {/* ALLOCATION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-purple-500/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400">
                  <PieChart size={24} />
               </div>
               <span className="text-xs font-mono text-gray-500">ASSET ALLOCATION</span>
            </div>
            <div className="space-y-2 mt-4">
               <div className="flex justify-between text-xs">
                  <span>Pokemon</span>
                  <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500 w-[60%]"></div>
                  </div>
                  <span className="text-cyan-400">60%</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span>Magic: TG</span>
                  <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 w-[30%]"></div>
                  </div>
                  <span className="text-purple-400">30%</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span>Lorcana</span>
                  <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-pink-500 w-[10%]"></div>
                  </div>
                  <span className="text-pink-400">10%</span>
               </div>
            </div>
          </motion.div>

          {/* MARKET HEALTH */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-green-500/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-green-900/20 rounded-lg text-green-400">
                  <Activity size={24} />
               </div>
               <span className="text-xs font-mono text-gray-500">APEX INDEX</span>
            </div>
            <div className="h-20 flex items-end space-x-1">
               {/* Decorative Bar Chart */}
               {[40, 65, 50, 80, 55, 90, 70, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-gray-800 hover:bg-green-500/50 transition-colors rounded-t" style={{ height: `${h}%` }}></div>
               ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">MARKET SENTIMENT: BULLISH</p>
          </motion.div>
        </div>

        {/* MAIN CHART AREA */}
        <div className="mb-8 p-6 bg-gray-900/40 border border-gray-800 rounded-xl backdrop-blur-md">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-orbitron">Portfolio Performance</h3>
              <div className="flex space-x-2">
                 {['1D', '1W', '1M', '1Y', 'ALL'].map((period) => (
                    <button key={period} className={`text-xs px-3 py-1 rounded border ${period === '1M' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-gray-800 text-gray-500 hover:text-white'}`}>
                       {period}
                    </button>
                 ))}
              </div>
           </div>
           <div className="h-80 w-full">
              <IntelChart type="line" data={{
                 labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                 datasets: [
                    { label: 'Your Portfolio', data: [11500, 11800, 12200, 12845], color: '#22d3ee' },
                    { label: 'S&P 500', data: [11500, 11600, 11650, 11700], color: '#64748b' }
                 ]
              }} />
           </div>
        </div>

        {/* ASSET LIST */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-md">
           <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white font-orbitron">Holdings</h3>
              <span className="text-xs text-gray-500 font-mono">4 ASSETS</span>
           </div>
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="text-xs text-gray-500 font-mono border-b border-gray-800">
                    <th className="px-6 py-3 font-medium">ASSET</th>
                    <th className="px-6 py-3 font-medium">TYPE</th>
                    <th className="px-6 py-3 font-medium text-right">PRICE</th>
                    <th className="px-6 py-3 font-medium text-right">24H</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {assets.map((asset, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 font-medium text-white">{asset.name}</td>
                       <td className="px-6 py-4 text-gray-400">{asset.type}</td>
                       <td className="px-6 py-4 text-right text-white font-mono">{asset.price}</td>
                       <td className={`px-6 py-4 text-right font-mono ${asset.trend === 'up' ? 'text-green-400' : asset.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                          {asset.change}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

      </div>
    </main>
  );
}
