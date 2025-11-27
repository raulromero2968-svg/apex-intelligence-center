'use client';

import { api } from '@/trpc/react';

export default function OtcOrderBookTable() {
  const { data, isLoading, error } = api.projectO.getOtcOrderBook.useQuery({});

  if (isLoading) {
    return <div className="text-center py-8">Loading order book...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (!data || data.aggregated.length === 0) {
    return <div className="text-center py-8 text-gray-500">No orders available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Card ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Best Bid
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Best Ask
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Spread
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Depth
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.aggregated.map((item) => {
            const spread = item.bestBid && item.bestAsk
              ? item.bestAsk.price - item.bestBid.price
              : null;

            return (
              <tr key={item.cardId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.cardId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.bestBid ? (
                    <span>
                      {item.bestBid.price.toFixed(4)} {item.bestBid.priceCurrency}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.bestAsk ? (
                    <span>
                      {item.bestAsk.price.toFixed(4)} {item.bestAsk.priceCurrency}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {spread !== null ? (
                    <span>{spread.toFixed(4)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span>B: {item.buyDepth} / S: {item.sellDepth}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-500">
        Summary: {data.summary.totalCards} cards, {data.summary.totalOrders} total orders
      </div>
    </div>
  );
}

