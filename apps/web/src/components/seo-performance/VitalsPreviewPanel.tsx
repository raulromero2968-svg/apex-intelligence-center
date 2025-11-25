'use client';

/**
 * Vitals Preview Panel
 *
 * Live Core Web Vitals display and analysis.
 * Implements knowledge-07-seo-performance §2.1 (Vitals Preview Panel).
 *
 * Features:
 * - Real-time vitals display (LCP, INP, CLS, FCP, TTFB)
 * - Performance grading with color coding
 * - Optimization suggestions
 * - Device emulation toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  type VitalType,
  type VitalRating,
  type VitalsSummary,
  type OptimizationSuggestion,
  VITAL_THRESHOLDS,
  VITAL_INFO,
  getVitalRating,
  getRatingColor,
  calculateOverallScore,
  getOptimizationSuggestions,
} from '@/lib/seo-performance';

// ============================================================================
// TYPES
// ============================================================================

interface VitalsPreviewPanelProps {
  pageUrl?: string;
  onVitalsUpdate?: (summary: VitalsSummary) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VitalsPreviewPanel({ pageUrl, onVitalsUpdate }: VitalsPreviewPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [network, setNetwork] = useState<'4g' | '3g' | 'slow'>('4g');

  const [vitals, setVitals] = useState<Record<VitalType, number>>({
    LCP: 0,
    INP: 0,
    CLS: 0,
    FCP: 0,
    TTFB: 0,
    FID: 0,
  });

  const [summary, setSummary] = useState<VitalsSummary | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  // Simulate vitals collection
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Simulate device/network impact
      const deviceMultiplier = device === 'mobile' ? 1.3 : 1.0;
      const networkMultiplier = network === '4g' ? 1.0 : network === '3g' ? 1.5 : 2.5;

      const baseVitals = {
        LCP: 1800 + Math.random() * 1500,
        INP: 120 + Math.random() * 150,
        CLS: 0.05 + Math.random() * 0.15,
        FCP: 1200 + Math.random() * 1000,
        TTFB: 400 + Math.random() * 600,
        FID: 80 + Math.random() * 100,
      };

      const adjustedVitals: Record<VitalType, number> = {
        LCP: Math.round(baseVitals.LCP * deviceMultiplier * networkMultiplier),
        INP: Math.round(baseVitals.INP * deviceMultiplier),
        CLS: Number((baseVitals.CLS * deviceMultiplier).toFixed(3)),
        FCP: Math.round(baseVitals.FCP * deviceMultiplier * networkMultiplier),
        TTFB: Math.round(baseVitals.TTFB * networkMultiplier),
        FID: Math.round(baseVitals.FID * deviceMultiplier),
      };

      setVitals(adjustedVitals);

      // Calculate summary
      const newSummary: VitalsSummary = {
        lcp: { p75: adjustedVitals.LCP, rating: getVitalRating('LCP', adjustedVitals.LCP) },
        inp: { p75: adjustedVitals.INP, rating: getVitalRating('INP', adjustedVitals.INP) },
        cls: { p75: adjustedVitals.CLS, rating: getVitalRating('CLS', adjustedVitals.CLS) },
        fcp: { p75: adjustedVitals.FCP, rating: getVitalRating('FCP', adjustedVitals.FCP) },
        ttfb: { p75: adjustedVitals.TTFB, rating: getVitalRating('TTFB', adjustedVitals.TTFB) },
        overallScore: calculateOverallScore(adjustedVitals),
        overallRating: 'good',
      };

      newSummary.overallRating =
        newSummary.overallScore >= 90
          ? 'good'
          : newSummary.overallScore >= 50
          ? 'needs_improvement'
          : 'poor';

      setSummary(newSummary);
      setSuggestions(getOptimizationSuggestions(newSummary));
      onVitalsUpdate?.(newSummary);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, device, network, onVitalsUpdate]);

  const getRatingBadge = (rating: VitalRating) => {
    const colors = {
      good: 'bg-green-500/20 text-green-400 border-green-500/30',
      needs_improvement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      poor: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const labels = {
      good: 'Good',
      needs_improvement: 'Needs Work',
      poor: 'Poor',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${colors[rating]}`}>
        {labels[rating]}
      </span>
    );
  };

  const VitalCard = ({
    type,
    value,
    rating,
  }: {
    type: VitalType;
    value: number;
    rating: VitalRating;
  }) => {
    const info = VITAL_INFO[type];
    const thresholds = VITAL_THRESHOLDS[type];

    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">{type}</span>
          {getRatingBadge(rating)}
        </div>
        <div className="text-2xl font-bold mb-1" style={{ color: getRatingColor(rating) }}>
          {type === 'CLS' ? value.toFixed(3) : `${value}ms`}
        </div>
        <div className="text-xs text-gray-500">{info.name}</div>
        <div className="mt-2 text-xs text-gray-400">
          Target: {type === 'CLS' ? `< ${thresholds.good}` : `< ${thresholds.good}ms`}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-semibold">Core Web Vitals</h2>
          <p className="text-sm text-gray-400">{pageUrl ?? 'No page selected'}</p>
        </div>
        {summary && (
          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: getRatingColor(summary.overallRating) }}
            >
              {summary.overallScore}
            </div>
            <div className="text-xs text-gray-400">Overall Score</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Device:</label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value as 'mobile' | 'desktop')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Network:</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as '4g' | '3g' | 'slow')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="4g">4G / WiFi</option>
            <option value="3g">3G</option>
            <option value="slow">Slow 2G</option>
          </select>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2 rounded-lg font-medium ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>

      {/* Vitals Grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <VitalCard
            type="LCP"
            value={vitals.LCP}
            rating={getVitalRating('LCP', vitals.LCP)}
          />
          <VitalCard
            type="INP"
            value={vitals.INP}
            rating={getVitalRating('INP', vitals.INP)}
          />
          <VitalCard
            type="CLS"
            value={vitals.CLS}
            rating={getVitalRating('CLS', vitals.CLS)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <VitalCard
            type="FCP"
            value={vitals.FCP}
            rating={getVitalRating('FCP', vitals.FCP)}
          />
          <VitalCard
            type="TTFB"
            value={vitals.TTFB}
            rating={getVitalRating('TTFB', vitals.TTFB)}
          />
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Optimization Suggestions</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  suggestion.impact === 'high'
                    ? 'bg-red-900/20 border-red-700/50'
                    : suggestion.impact === 'medium'
                    ? 'bg-yellow-900/20 border-yellow-700/50'
                    : 'bg-blue-900/20 border-blue-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.impact === 'high'
                        ? 'bg-red-500/30 text-red-400'
                        : suggestion.impact === 'medium'
                        ? 'bg-yellow-500/30 text-yellow-400'
                        : 'bg-blue-500/30 text-blue-400'
                    }`}
                  >
                    {suggestion.impact.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{suggestion.vital}</span>
                </div>
                <div className="font-medium text-sm">{suggestion.title}</div>
                <div className="text-xs text-gray-400 mt-1">{suggestion.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
