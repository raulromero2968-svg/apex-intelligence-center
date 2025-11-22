/**
 * Manipulation Warning Banner
 *
 * Non-dismissible red banner that displays when coordinated pump patterns detected.
 * Shows on card pages when LAMP + Contrarian detect >40% volume spike with no organic drivers.
 */

'use client';

import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { ManipulationAlert } from '@/db/schema';

interface ManipulationWarningBannerProps {
  alert: ManipulationAlert;
}

export function ManipulationWarningBanner({ alert }: ManipulationWarningBannerProps) {
  const isCritical = alert.severity === 'critical';

  return (
    <div
      className={`
        relative w-full px-6 py-4 mb-6
        ${isCritical ? 'bg-red-600' : 'bg-red-500'}
        text-white rounded-lg shadow-lg
        border-2 ${isCritical ? 'border-red-700' : 'border-red-600'}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <Shield className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-bold">
              Manipulation Shield: Coordinated Pump Detected
            </h3>
          </div>

          <p className="text-sm mb-3 leading-relaxed">
            <strong>Warning:</strong> This card shows unusual trading patterns consistent with coordinated manipulation.
            Historical success rate for these patterns: <strong>6%</strong>.
          </p>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-black/20 rounded p-3 mb-3">
            <div>
              <div className="text-white/80 mb-1">Volume Spike</div>
              <div className="flex items-center gap-1 font-bold">
                <TrendingUp className="h-4 w-4" />
                {alert.volumeSpikePct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-white/80 mb-1">Baseline Volume</div>
              <div className="font-bold">{alert.baselineVolume.toFixed(1)} sales/day</div>
            </div>
            <div>
              <div className="text-white/80 mb-1">Current Volume (24h)</div>
              <div className="font-bold">{alert.currentVolume} sales</div>
            </div>
          </div>

          {/* Detection Details */}
          <div className="text-xs bg-black/20 rounded p-3">
            <div className="font-semibold mb-2">Detection Analysis:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>LAMP Sentiment: <strong>{alert.lampSentiment.toUpperCase()}</strong></li>
              <li>
                Contrarian Diversity Score: <strong>{(alert.contrarianDiversity * 100).toFixed(0)}%</strong>
                {alert.contrarianDiversity < 0.3 && ' (Low - coordination suspected)'}
              </li>
              <li>Organic market drivers: <strong>Not detected</strong></li>
            </ul>
          </div>

          {/* User Action */}
          <div className="mt-3 pt-3 border-t border-white/30 text-sm">
            <p className="font-semibold mb-1">🛡️ Protection Activated:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Price alerts automatically paused for this card</li>
              <li>This banner cannot be dismissed for your safety</li>
              <li>Consider waiting for organic price discovery before trading</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Non-dismissible indicator */}
      <div className="absolute top-2 right-2">
        <div
          className="text-xs bg-black/30 px-2 py-1 rounded"
          title="This warning cannot be dismissed"
        >
          <Shield className="h-3 w-3 inline mr-1" />
          Protected
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for mobile or list views
 */
export function ManipulationWarningBannerCompact({ alert }: ManipulationWarningBannerProps) {
  return (
    <div
      className={`
        w-full px-4 py-3
        ${alert.severity === 'critical' ? 'bg-red-600' : 'bg-red-500'}
        text-white rounded shadow-md
        border ${alert.severity === 'critical' ? 'border-red-700' : 'border-red-600'}
      `}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-bold">Manipulation Warning</div>
          <div className="text-xs">
            {alert.volumeSpikePct.toFixed(0)}% volume spike, no organic drivers detected
          </div>
        </div>
        <Shield className="h-4 w-4 flex-shrink-0" />
      </div>
    </div>
  );
}
