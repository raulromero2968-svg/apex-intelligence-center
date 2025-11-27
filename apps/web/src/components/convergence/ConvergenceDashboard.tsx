'use client';

import type { ConvergenceSnapshot } from '@apex/shared';
import PortfolioSummaryCard from './PortfolioSummaryCard';
import AssetBreakdown from './AssetBreakdown';
import ChainExposureChart from './ChainExposureChart';

interface ConvergenceDashboardProps {
  snapshot: ConvergenceSnapshot;
}

export default function ConvergenceDashboard({ snapshot }: ConvergenceDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <PortfolioSummaryCard snapshot={snapshot} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">By Asset Type</h2>
          <div className="space-y-3">
            {Object.entries(snapshot.byType).map(([type, data]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    ${data.currentValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm ${data.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.pnlUsd >= 0 ? '+' : ''}${data.pnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ChainExposureChart snapshot={snapshot} />
      </div>

      {/* Asset Breakdown */}
      <AssetBreakdown assets={snapshot.assets} />
    </div>
  );
}


