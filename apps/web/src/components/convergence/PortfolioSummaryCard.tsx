'use client';

import type { ConvergenceSnapshot } from '@apex/shared';

interface PortfolioSummaryCardProps {
  snapshot: ConvergenceSnapshot;
}

export default function PortfolioSummaryCard({ snapshot }: PortfolioSummaryCardProps) {
  const totalReturnPct =
    snapshot.totalCostBasisUsd > 0
      ? ((snapshot.totalPnlUsd / snapshot.totalCostBasisUsd) * 100)
      : 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 border border-gray-700">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Portfolio Value */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Total Portfolio Value</div>
          <div className="text-3xl font-bold text-white">
            ${snapshot.totalCurrentValueUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Total P&L */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Total P&L</div>
          <div
            className={`text-3xl font-bold ${
              snapshot.totalPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {snapshot.totalPnlUsd >= 0 ? '+' : ''}
            ${snapshot.totalPnlUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Return % */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Return</div>
          <div
            className={`text-3xl font-bold ${
              totalReturnPct >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {totalReturnPct >= 0 ? '+' : ''}
            {totalReturnPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Cost Basis */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="text-sm text-gray-400">Total Cost Basis</div>
        <div className="text-lg text-gray-300">
          ${snapshot.totalCostBasisUsd.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    </div>
  );
}


