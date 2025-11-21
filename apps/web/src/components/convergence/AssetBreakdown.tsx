'use client';

import type { ConvergenceAsset } from '@apex/shared';

interface AssetBreakdownProps {
  assets: ConvergenceAsset[];
}

export default function AssetBreakdown({ assets }: AssetBreakdownProps) {
  // Group assets by type
  const groupedByType = assets.reduce(
    (acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = [];
      }
      acc[asset.type].push(asset);
      return acc;
    },
    {} as Record<string, ConvergenceAsset[]>
  );

  const typeLabels: Record<string, string> = {
    physical_card: 'Physical Cards',
    digital_twin: 'Digital Twins',
    onchain_token: 'On-Chain Tokens',
    otc_position: 'OTC Positions',
    arbitrage_position: 'Arbitrage Positions',
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Asset Breakdown</h2>

      {Object.entries(groupedByType).map(([type, typeAssets]) => (
        <div key={type} className="mb-6 last:mb-0">
          <h3 className="text-lg font-medium text-gray-300 mb-3">
            {typeLabels[type] || type}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-4 text-sm text-gray-400">Label</th>
                  <th className="text-right py-2 px-4 text-sm text-gray-400">Quantity</th>
                  <th className="text-right py-2 px-4 text-sm text-gray-400">Cost Basis</th>
                  <th className="text-right py-2 px-4 text-sm text-gray-400">Current Value</th>
                  <th className="text-right py-2 px-4 text-sm text-gray-400">P&L</th>
                </tr>
              </thead>
              <tbody>
                {typeAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">
                      <div>
                        <div className="font-medium">{asset.label}</div>
                        {asset.collection && (
                          <div className="text-xs text-gray-500">{asset.collection}</div>
                        )}
                        {asset.chain && (
                          <div className="text-xs text-gray-500">{asset.chain}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{asset.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      ${asset.costBasisUsd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-medium">
                      ${asset.currentValueUsd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        asset.unrealizedPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {asset.unrealizedPnlUsd >= 0 ? '+' : ''}
                      ${asset.unrealizedPnlUsd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {assets.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No assets found. Start adding cards to your portfolio to see them here.
        </div>
      )}
    </div>
  );
}


