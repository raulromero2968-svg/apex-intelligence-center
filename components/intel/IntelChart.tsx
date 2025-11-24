'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  title?: string;
  data?: { label: string; value: number }[];
  color?: string;
}

const defaultData = [
  { label: '2020', value: 100 },
  { label: '2021', value: 150 },
  { label: '2022', value: 120 },
  { label: '2023', value: 180 }
];

export default function IntelChart({ title, data = defaultData, color = "#22d3ee" }: ChartProps) {
  return (
    <div className="w-full p-6 border border-slate-800 bg-slate-900/50 rounded-xl my-8 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest font-mono">
          {title || "Market Analytics // Live Data"}
        </h3>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{fontSize: 10, fontFamily: 'monospace'}}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              tick={{fontSize: 10, fontFamily: 'monospace'}}
              tickFormatter={(value) => `${value}`}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc', fontFamily: 'monospace' }}
              itemStyle={{ color: color }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4, fill: '#020617', stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
