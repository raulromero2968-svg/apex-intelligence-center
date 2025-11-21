'use client';

import { useEffect, useRef } from 'react';
import type { ConvergenceSnapshot } from '@apex/shared';

interface ChainExposureChartProps {
  snapshot: ConvergenceSnapshot;
}

export default function ChainExposureChart({ snapshot }: ChainExposureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const chains = Object.entries(snapshot.byChain);
    if (chains.length === 0) {
      // Draw empty state
      ctx.fillStyle = '#374151';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No chain exposure', size / 2, size / 2);
      return;
    }

    // Calculate total for percentages
    const total = chains.reduce((sum, [, data]) => sum + data.currentValueUsd, 0);

    // Colors for different chains
    const colors = [
      '#00D9FF', // cyan
      '#9333EA', // purple
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#3B82F6', // blue
    ];

    // Draw pie chart
    let currentAngle = -Math.PI / 2; // Start at top

    chains.forEach(([chain, data], index) => {
      const sliceAngle = (data.currentValueUsd / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      ctx.arc(size / 2, size / 2, size / 2 - 10, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = size / 2 - 30;
      const labelX = size / 2 + Math.cos(labelAngle) * labelRadius;
      const labelY = size / 2 + Math.sin(labelAngle) * labelRadius;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(chain, labelX, labelY);

      currentAngle += sliceAngle;
    });
  }, [snapshot.byChain]);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Chain Exposure</h2>
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="mb-4" />
        <div className="space-y-2 w-full">
          {Object.entries(snapshot.byChain).map(([chain, data], index) => {
            const colors = [
              '#00D9FF',
              '#9333EA',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#3B82F6',
            ];
            return (
              <div key={chain} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-gray-300 capitalize">{chain}</span>
                </div>
                <span className="text-white font-medium">
                  ${data.currentValueUsd.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            );
          })}
        </div>
        {Object.keys(snapshot.byChain).length === 0 && (
          <div className="text-gray-400 text-sm">No chain exposure data</div>
        )}
      </div>
    </div>
  );
}


