'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface InteractiveLineChartProps {
  data?: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function InteractiveLineChart({
  data = [],
  xKey = 'name',
  yKey = 'value',
  title,
  color = '#00e5ff',
}: InteractiveLineChartProps) {
  return (
    <div className="my-6 p-4 rounded-lg border border-cyan-500/20 bg-black/40">
      {title && <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey={xKey} stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000000dd',
              border: '1px solid #00e5ff40',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


