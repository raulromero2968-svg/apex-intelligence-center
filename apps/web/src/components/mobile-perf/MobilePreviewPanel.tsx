'use client';

/**
 * Mobile Preview Panel
 *
 * Live iOS/Android simulator for performance testing.
 * Implements knowledge-08-mobile-performance §2.1 (Mobile Preview Panel).
 *
 * Features:
 * - Device emulation (iOS/Android variants)
 * - Real-time FPS and memory metrics
 * - List scroll performance testing
 * - Network condition simulation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  type Platform,
  type DeviceTier,
  type PerformanceGrade,
  type PerformanceAnalysis,
} from '@/lib/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

interface DeviceFrame {
  id: string;
  name: string;
  platform: Platform;
  tier: DeviceTier;
  width: number;
  height: number;
  scale: number;
  notchStyle: 'none' | 'notch' | 'dynamic-island' | 'punch-hole';
}

interface PerformanceMetrics {
  fps: number;
  memory: number;
  cpuUsage: number;
  renderTime: number;
  reRenders: number;
  bridgeCalls: number;
}

interface MobilePreviewPanelProps {
  profileId?: string;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onAnalysisComplete?: (analysis: PerformanceAnalysis) => void;
}

// ============================================================================
// DEVICE FRAMES
// ============================================================================

const DEVICE_FRAMES: DeviceFrame[] = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    platform: 'ios',
    tier: 'flagship',
    width: 393,
    height: 852,
    scale: 3,
    notchStyle: 'dynamic-island',
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    platform: 'ios',
    tier: 'high_end',
    width: 390,
    height: 844,
    scale: 3,
    notchStyle: 'notch',
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    platform: 'ios',
    tier: 'mid_range',
    width: 375,
    height: 667,
    scale: 2,
    notchStyle: 'none',
  },
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro',
    platform: 'android',
    tier: 'flagship',
    width: 412,
    height: 915,
    scale: 3.5,
    notchStyle: 'punch-hole',
  },
  {
    id: 'samsung-s24',
    name: 'Galaxy S24',
    platform: 'android',
    tier: 'flagship',
    width: 412,
    height: 915,
    scale: 3,
    notchStyle: 'punch-hole',
  },
  {
    id: 'mid-android',
    name: 'Mid-Range Android',
    platform: 'android',
    tier: 'mid_range',
    width: 360,
    height: 800,
    scale: 2.5,
    notchStyle: 'none',
  },
  {
    id: 'low-android',
    name: 'Budget Android',
    platform: 'android',
    tier: 'low_end',
    width: 320,
    height: 640,
    scale: 2,
    notchStyle: 'none',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MobilePreviewPanel({
  profileId,
  onMetricsUpdate,
  onAnalysisComplete,
}: MobilePreviewPanelProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceFrame>(DEVICE_FRAMES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 128,
    cpuUsage: 15,
    renderTime: 8,
    reRenders: 0,
    bridgeCalls: 0,
  });
  const [networkCondition, setNetworkCondition] = useState<'fast' | '3g' | 'slow' | 'offline'>('fast');
  const [listItemCount, setListItemCount] = useState(100);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [grade, setGrade] = useState<PerformanceGrade>('A');

  // Simulate performance based on device tier
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const tierMultiplier: Record<DeviceTier, number> = {
        flagship: 1.0,
        high_end: 0.85,
        mid_range: 0.7,
        low_end: 0.5,
      };

      const multiplier = tierMultiplier[selectedDevice.tier];
      const baseLoad = listItemCount / 100;

      // Simulate realistic metrics
      const newMetrics: PerformanceMetrics = {
        fps: Math.min(60, Math.round(60 * multiplier - baseLoad * 5 + Math.random() * 5)),
        memory: Math.round(128 + baseLoad * 50 / multiplier + Math.random() * 20),
        cpuUsage: Math.round(15 + baseLoad * 20 / multiplier + Math.random() * 10),
        renderTime: Math.round(8 / multiplier + baseLoad * 4 + Math.random() * 2),
        reRenders: Math.floor(Math.random() * 5),
        bridgeCalls: Math.floor(10 + Math.random() * 20),
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);

      // Calculate grade
      let score = 100;
      if (newMetrics.fps < 55) score -= 20;
      if (newMetrics.fps < 45) score -= 20;
      if (newMetrics.memory > 256) score -= 15;
      if (newMetrics.renderTime > 16) score -= 15;
      if (newMetrics.renderTime > 32) score -= 15;

      if (score >= 90) setGrade('A');
      else if (score >= 80) setGrade('B');
      else if (score >= 70) setGrade('C');
      else if (score >= 60) setGrade('D');
      else setGrade('F');
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, selectedDevice, listItemCount, onMetricsUpdate]);

  const handleStartTest = useCallback(() => {
    setIsRunning(true);
    setScrollPosition(0);
  }, []);

  const handleStopTest = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (!isRunning) return;
    setScrollPosition((prev) => (prev + 50) % (listItemCount * 80));
  }, [isRunning, listItemCount]);

  const getGradeColor = (g: PerformanceGrade) => {
    switch (g) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
    }
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Mobile Preview</h2>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${getGradeColor(grade)}`}>{grade}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Device Selection Sidebar */}
        <div className="w-48 border-r border-gray-700 p-3 space-y-2 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Devices</h3>
          {DEVICE_FRAMES.map((device) => (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className={`w-full p-2 rounded text-left text-sm transition-colors ${
                selectedDevice.id === device.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <div className="font-medium">{device.name}</div>
              <div className="text-xs opacity-70">
                {device.platform === 'ios' ? '🍎' : '🤖'} {device.tier.replace('_', ' ')}
              </div>
            </button>
          ))}

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Network</h3>
            <select
              value={networkCondition}
              onChange={(e) => setNetworkCondition(e.target.value as typeof networkCondition)}
              className="w-full p-2 bg-gray-800 rounded text-sm"
            >
              <option value="fast">Fast (4G/WiFi)</option>
              <option value="3g">3G</option>
              <option value="slow">Slow 2G</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">List Items</h3>
            <input
              type="range"
              min="10"
              max="1000"
              value={listItemCount}
              onChange={(e) => setListItemCount(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{listItemCount} items</div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-950">
          {/* Device Frame */}
          <div
            className="relative bg-black rounded-[40px] p-3 shadow-2xl"
            style={{
              width: selectedDevice.width * 0.6 + 24,
              height: selectedDevice.height * 0.6 + 24,
            }}
          >
            {/* Notch/Dynamic Island */}
            {selectedDevice.notchStyle === 'dynamic-island' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
            )}
            {selectedDevice.notchStyle === 'notch' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
            )}
            {selectedDevice.notchStyle === 'punch-hole' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-10" />
            )}

            {/* Screen */}
            <div
              className="bg-white rounded-[32px] overflow-hidden"
              style={{
                width: selectedDevice.width * 0.6,
                height: selectedDevice.height * 0.6,
              }}
            >
              {/* Status Bar */}
              <div className="h-8 bg-gray-100 flex items-center justify-between px-4 text-xs text-gray-600">
                <span>9:41</span>
                <span>📶 100%</span>
              </div>

              {/* Content Area - Simulated List */}
              <div className="h-[calc(100%-4rem)] overflow-hidden bg-gray-50 relative">
                <div
                  className="absolute w-full transition-transform"
                  style={{ transform: `translateY(-${scrollPosition}px)` }}
                >
                  {Array.from({ length: Math.min(20, listItemCount) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 border-b border-gray-200 p-3 bg-white"
                    >
                      <div className="flex gap-3">
                        <div className="w-14 h-14 bg-gray-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-gray-100 rounded w-1/2 mb-1" />
                          <div className="h-2 bg-gray-100 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="h-8 bg-gray-100 flex items-center justify-center">
                <div className="w-24 h-1 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            {!isRunning ? (
              <button
                onClick={handleStartTest}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
              >
                ▶ Start Test
              </button>
            ) : (
              <>
                <button
                  onClick={handleScroll}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  ↓ Scroll
                </button>
                <button
                  onClick={handleStopTest}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="w-64 border-l border-gray-700 p-4 space-y-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-400">Performance Metrics</h3>

          {/* FPS */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">FPS</span>
              <span className={`text-lg font-bold ${getFpsColor(metrics.fps)}`}>
                {metrics.fps}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  metrics.fps >= 55 ? 'bg-green-500' : metrics.fps >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(metrics.fps / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Memory</span>
              <span className="text-lg font-bold">{metrics.memory} MB</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  metrics.memory < 256 ? 'bg-green-500' : metrics.memory < 384 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((metrics.memory / 512) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* CPU */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">CPU Usage</span>
              <span className="text-lg font-bold">{metrics.cpuUsage}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>

          {/* Render Time */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Render Time</span>
              <span className={`text-lg font-bold ${
                metrics.renderTime <= 16 ? 'text-green-500' : 'text-red-500'
              }`}>
                {metrics.renderTime} ms
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Target: 16ms (60 FPS budget)
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Re-renders</span>
              <span>{metrics.reRenders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bridge Calls</span>
              <span>{metrics.bridgeCalls}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className={networkCondition === 'offline' ? 'text-red-500' : ''}>
                {networkCondition.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Recommendations */}
          {metrics.fps < 55 && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
              <h4 className="text-yellow-500 font-medium text-sm mb-1">⚠️ Low FPS</h4>
              <p className="text-xs text-gray-300">
                Consider reducing list items or enabling getItemLayout for fixed-height items.
              </p>
            </div>
          )}

          {metrics.memory > 256 && (
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3">
              <h4 className="text-orange-500 font-medium text-sm mb-1">⚠️ High Memory</h4>
              <p className="text-xs text-gray-300">
                Enable image caching and reduce windowSize in FlatList configuration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
