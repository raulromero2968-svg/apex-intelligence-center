'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { year: '2015', value: 2000 },
  { year: '2017', value: 2400 },
  { year: '2019', value: 3800 },
  { year: '2021', value: 18000 }, // The Boom
  { year: '2023', value: 12000 }, // The Correction
  { year: '2025', value: 15500 }, // The Stabilization
];

export default function IntelChart({ title }: { title?: string }) {
  return (
    <div className="w-full p-6 border border-slate-800 bg-slate-900/50 rounded-xl my-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 bg-yellow-500 animate-pulse rounded-full" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">
          {title || "Market Performance // 10-Year Alpha"}
        </h3>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{fontSize: 10, fontFamily: 'monospace'}}
            />
            <YAxis
              stroke="#64748b"
              tick={{fontSize: 10, fontFamily: 'monospace'}}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#22d3ee' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#fbbf24" // Vintage Gold
              strokeWidth={2}
              dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: '#fbbf24', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
