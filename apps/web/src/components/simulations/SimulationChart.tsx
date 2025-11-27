'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
  timestamp: string;
  pnl?: number;
  risk?: number;
  spread?: number;
}

interface SimulationChartProps {
  data: DataPoint[];
  metric: 'pnl' | 'risk' | 'spread';
  title: string;
}

export default function SimulationChart({ data, metric, title }: SimulationChartProps) {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    value: (() => {
      switch (metric) {
        case 'pnl':
          return d.pnl ?? 0;
        case 'risk':
          return d.risk ?? 0;
        case 'spread':
          return d.spread ?? 0;
        default:
          return 0;
      }
    })(),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgb(34, 211, 238)',
              borderRadius: '4px',
              color: 'rgb(255, 255, 255)',
            }}
          />
          <Legend wrapperStyle={{ color: 'rgb(255, 255, 255)' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgb(34, 211, 238)"
            strokeWidth={2}
            dot={{ fill: 'rgb(34, 211, 238)', r: 2 }}
            activeDot={{ r: 4 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


