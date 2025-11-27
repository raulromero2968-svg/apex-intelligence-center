'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartVizProps {
  data: any[];
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function AreaChartViz({
  data,
  xKey = 'name',
  yKey = 'value',
  title,
  color = '#00e5ff'
}: AreaChartVizProps) {
  return (
    <div className="my-6 p-4 rounded-lg border border-cyan-500/20 bg-black/40">
      {title && (
        <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

