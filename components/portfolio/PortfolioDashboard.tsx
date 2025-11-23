'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter, AlertTriangle, TrendingUp, Layers, Shield, FileText, Download, Share2 } from 'lucide-react';

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
  { name: 'Charizard Base Set', set: '1999 Pokemon Game', grade: 'PSA 9', price: 12500, change: 12.5, risk: 'low', game: 'Pokemon' },
  { name: 'Black Lotus', set: 'Unlimited', grade: 'BGS 8.5', price: 18000, change: -2.1, risk: 'low', game: 'MTG' },
  { name: 'The One Ring', set: 'LOTR', grade: 'Raw', price: 80, change: 5.4, risk: 'medium', game: 'MTG' },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', grade: 'PSA 10', price: 950, change: 1.2, risk: 'medium', game: 'Pokemon' },
];

// VARC Risk Breakdown
const riskData = [
  { zone: 'Stable Vintage', value: 30500, percent: 96.7, color: '#22c55e' },
  { zone: 'Modern Staples', value: 950, percent: 3.0, color: '#eab308' },
  { zone: 'Rotation Risk', value: 80, percent: 0.3, color: '#ef4444' },
];

// Diversification Data
const gameBreakdown = [
  { name: 'Pokemon', value: 13450, color: '#3b82f6' },
  { name: 'MTG', value: 18080, color: '#8b5cf6' },
];

const eraBreakdown = [
  { name: 'Vintage (Pre-2010)', value: 30500, color: '#22c55e' },
  { name: 'Modern (2010+)', value: 1030, color: '#eab308' },
];

// Active Alerts
const alerts = [
  { type: 'rotation', severity: 'low', message: 'Evolving Skies rotates Q3 2026 - 18mo runway', card: 'Umbreon VMAX' },
  { type: 'profit', severity: 'high', message: 'Charizard Base PSA 9 up 12.5% - Consider profit taking', card: 'Charizard Base Set' },
  { type: 'arbitrage', severity: 'medium', message: 'Japanese market premium at 8% - Review holdings', card: null },
];

// Intel Article Integration
const intelMatches = [
  { article: 'Set Rotation Strategy', matches: 1, impact: 'medium', url: '/intel/modern-set-rotation-strategy' },
  { article: 'Japanese Arbitrage', matches: 4, impact: 'high', url: '/intel/japanese-arbitrage-guide' },
  { article: 'Grading ROI Analysis', matches: 2, impact: 'low', url: '/intel/grading-roi-analysis' },
];

export const PortfolioDashboard = () => {
  return (
    <div className="space-y-6">

      {/* Quick Actions Bar */}
      <div className="flex justify-between items-center p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-300 font-medium">VARC Risk Score: <span className="text-green-400 font-bold">A-</span></span>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            <Download className="w-3 h-3" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            <Share2 className="w-3 h-3" /> Share Portfolio
          </button>
        </div>
      </div>

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

      {/* VARC Risk Panel + Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* VARC Risk Breakdown */}
        <div className="lg:col-span-1 p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            VARC Risk Analysis
          </h3>
          <div className="space-y-3">
            {riskData.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{item.zone}</span>
                  <span className="text-white font-mono">{item.percent}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-500">Overall Risk Rating</div>
            <div className="text-2xl font-bold text-green-400 font-orbitron">LOW</div>
            <div className="text-xs text-slate-400 mt-1">96.7% in stable assets</div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="lg:col-span-2 p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Active Intelligence Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border flex items-start gap-3 ${
                  alert.severity === 'high' ? 'bg-red-950/20 border-red-900/50' :
                  alert.severity === 'medium' ? 'bg-yellow-950/20 border-yellow-900/50' :
                  'bg-blue-950/20 border-blue-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  alert.severity === 'high' ? 'bg-red-400' :
                  alert.severity === 'medium' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{alert.message}</p>
                  {alert.card && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">{alert.card}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
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

      {/* Intel Integration + Diversification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intel Article Cross-Reference */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Intel Strategy Matches
          </h3>
          <div className="space-y-3">
            {intelMatches.map((match, i) => (
              <a
                key={i}
                href={match.url}
                className="block p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm text-white font-medium group-hover:text-cyan-400 transition-colors">
                    {match.article}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                    match.impact === 'high' ? 'bg-green-900/30 text-green-400' :
                    match.impact === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {match.impact.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Applies to <span className="text-cyan-400 font-bold">{match.matches}</span> card{match.matches > 1 ? 's' : ''} in portfolio
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Diversification Breakdown */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Diversification Analysis
          </h3>
          <div className="space-y-4">
            {/* By Game */}
            <div>
              <div className="text-xs text-slate-400 mb-2">By Game</div>
              <div className="space-y-2">
                {gameBreakdown.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white font-mono">${(item.value/1000).toFixed(1)}k</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(item.value / 31530 * 100).toFixed(1)}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Era */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2">By Era</div>
              <div className="space-y-2">
                {eraBreakdown.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white font-mono">${(item.value/1000).toFixed(1)}k</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(item.value / 31530 * 100).toFixed(1)}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
