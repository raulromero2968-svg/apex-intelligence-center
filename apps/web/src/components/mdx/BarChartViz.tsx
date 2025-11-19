'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartVizProps {
  data: any[];
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function BarChartViz({
  data,
  xKey = 'name',
  yKey = 'value',
  title,
  color = '#00e5ff'
}: BarChartVizProps) {
  return (
    <div className="my-6 p-4 rounded-lg border border-cyan-500/20 bg-black/40">
      {title && (
        <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey={xKey}
            stroke="#ffffff60"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#ffffff60"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000000dd',
              border: '1px solid #00e5ff40',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend />
          <Bar
            dataKey={yKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
