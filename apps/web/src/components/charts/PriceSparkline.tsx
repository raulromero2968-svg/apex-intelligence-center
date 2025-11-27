'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type DataPoint = [string, number];

type IndexData = {
  symbol: string;
  currency: string;
  name: string;
  points: DataPoint[];
};

type Props = {
  src: string;
  color?: string;
};

export default function PriceSparkline({ src, color = '#00FFFF' }: Props) {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch data');
        return r.json();
      })
      .then((j: IndexData) => {
        const formatted = j.points.map(([date, value]) => ({
          date,
          value,
        }));
        setData(formatted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [src]);

  if (loading) {
    return (
      <div className="h-24 w-full flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-24 w-full flex items-center justify-center">
        <div className="text-red-400/70 text-sm">Failed to load chart</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-24 w-full flex items-center justify-center">
        <div className="text-white/50 text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className="h-24 w-full" data-tour="price-sparkline">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: `1px solid ${color}40`,
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#fff', fontSize: '12px' }}
            itemStyle={{ color: color, fontSize: '12px', fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

