'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter } from 'lucide-react';

const portfolioData = [
  { date: 'Mon', value: 12500 },
  { date: 'Tue', value: 12800 },
  { date: 'Wed', value: 12400 },
  { date: 'Thu', value: 13100 },
  { date: 'Fri', value: 13900 },
  { date: 'Sat', value: 14200 },
  { date: 'Sun', value: 14580 },
];

const assets = [
  { name: 'Charizard Base Set', set: '1999 Pokemon Game', grade: 'PSA 9', price: 12500, change: 12.5 },
  { name: 'Black Lotus', set: 'Unlimited', grade: 'BGS 8.5', price: 18000, change: -2.1 },
  { name: 'The One Ring', set: 'LOTR', grade: 'Raw', price: 80, change: 5.4 },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', grade: 'PSA 10', price: 950, change: 1.2 },
];

export const PortfolioDashboard = () => {
  return (
    <div className="space-y-6">

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-md">
          <div className="text-slate-400 text-sm mb-1">Total Portfolio Value</div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">$31,530.00</span>
            <span className="text-green-400 flex items-center mb-1.5 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" /> +4.2% (24h)
            </span>
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Total Items</div>
          <div className="text-2xl font-bold text-white">142</div>
          <div className="text-xs text-slate-500 mt-2">12 Graded / 130 Raw</div>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-sm mb-1">Top Performer</div>
          <div className="text-xl font-bold text-cyan-400 truncate">Charizard Base</div>
          <div className="text-xs text-green-400 mt-2">+12.5%</div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Performance Analytics</h3>
          <div className="flex gap-2">
            {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
              <button key={tf} className="px-3 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#475569" tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                itemStyle={{ color: '#22d3ee' }}
                formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white">Holdings</h3>
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/50 text-slate-400">
            <tr>
              <th className="p-4 font-medium">Asset</th>
              <th className="p-4 font-medium">Set</th>
              <th className="p-4 font-medium">Grade</th>
              <th className="p-4 font-medium text-right">Price</th>
              <th className="p-4 font-medium text-right">24h</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {assets.map((asset, i) => (
              <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4 font-medium text-white">{asset.name}</td>
                <td className="p-4 text-slate-400">{asset.set}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    asset.grade.includes('10') ? 'bg-yellow-950/30 text-yellow-500 border-yellow-900/50' :
                    asset.grade === 'Raw' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {asset.grade}
                  </span>
                </td>
                <td className="p-4 text-right text-slate-200 font-mono">${asset.price.toLocaleString()}</td>
                <td className={`p-4 text-right font-mono ${asset.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change > 0 ? '+' : ''}{asset.change}%
                </td>
                <td className="p-4 text-right">
                  <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
