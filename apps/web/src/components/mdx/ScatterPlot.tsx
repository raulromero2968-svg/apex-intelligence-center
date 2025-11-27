'use client';

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ScatterPlotProps {
  data?: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function ScatterPlot({
  data = [],
  xKey = 'x',
  yKey = 'y',
  title,
  color = '#a855f7',
}: ScatterPlotProps) {
  return (
    <div className="my-6 p-4 rounded-lg border border-purple-500/20 bg-black/40">
      {title && <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            type="number"
            dataKey={xKey}
            stroke="#ffffff60"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            stroke="#ffffff60"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#000000dd',
              border: '1px solid #a855f740',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Scatter data={data} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}


