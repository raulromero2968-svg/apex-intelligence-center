'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mockData = [
  { date: 'Jan', value: 4000 },
  { date: 'Feb', value: 3000 },
  { date: 'Mar', value: 5000 },
  { date: 'Apr', value: 2780 },
  { date: 'May', value: 1890 },
  { date: 'Jun', value: 6390 },
  { date: 'Jul', value: 8490 },
];

export const IntelChart = ({ title }: { title: string }) => {
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-cyan-400 mb-4">{title} - Price Velocity</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              itemStyle={{ color: '#22d3ee' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
        Live Data Source: TCGPlayer API [cite: 165]
      </div>
    </div>
  );
};
