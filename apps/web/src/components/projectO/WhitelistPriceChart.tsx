'use client';

import { api } from '@/trpc/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WhitelistPriceChart() {
  const { data, isLoading, error } = api.projectO.getWhitelistPriceHistory.useQuery({
    limit: 100,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading price history...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No price data available</div>;
  }

  // Transform data for chart
  const chartData = data
    .reverse() // Oldest first
    .map((price) => ({
      time: new Date(price.observedAt).toLocaleTimeString(),
      price: price.priceUsd,
      block: price.blockNumber,
    }));

  const latestPrice = data[0];

  return (
    <div>
      <div className="mb-4">
        <div className="text-2xl font-bold">
          ${latestPrice.priceUsd.toFixed(4)} USD
        </div>
        <div className="text-sm text-gray-500">
          Block {latestPrice.blockNumber} • {new Date(latestPrice.observedAt).toLocaleString()}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

