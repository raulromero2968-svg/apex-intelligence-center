"use client";

/**
 * OODA Analytics Dashboard Component
 *
 * Displays OODA loop metrics and bottleneck analysis.
 * Implements pack-ai-defense-001 §3.1 visualization.
 *
 * Features:
 * - Phase latency visualization
 * - Bottleneck identification
 * - Processing type comparison
 * - Optimization recommendations
 */

import React, { useState, useEffect, useCallback } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type OodaPhase = "observe" | "orient" | "decide" | "act";
type ProcessingType = "edge" | "central" | "hybrid";

interface OodaMetric {
  id: string;
  pipelineId: string;
  processingType: ProcessingType;
  observeLatencyMs: number;
  orientLatencyMs: number;
  decideLatencyMs: number;
  actLatencyMs: number;
  totalLatencyMs: number;
  bottleneckPhase: OodaPhase;
  timestamp: string;
}

interface OodaSummary {
  totalMeasurements: number;
  averageTotal: number;
  averageByPhase: Record<OodaPhase, number>;
  bottleneck: OodaPhase;
  byProcessingType: Record<ProcessingType, {
    count: number;
    averageTotal: number;
  }>;
}

interface BottleneckAnalysis {
  bottleneckPhase: OodaPhase;
  averageLatency: number;
  percentageOfTotal: number;
  recommendations: string[];
}

interface OODADashboardProps {
  className?: string;
  pipelineId?: string;
  refreshInterval?: number;
}

// Phase colors
const PHASE_COLORS: Record<OodaPhase, { bar: string; text: string }> = {
  observe: { bar: "bg-blue-500", text: "text-blue-300" },
  orient: { bar: "bg-purple-500", text: "text-purple-300" },
  decide: { bar: "bg-amber-500", text: "text-amber-300" },
  act: { bar: "bg-emerald-500", text: "text-emerald-300" },
};

// Phase descriptions
const PHASE_DESCRIPTIONS: Record<OodaPhase, string> = {
  observe: "Data collection from market sources",
  orient: "Analysis and context building (RAG, ML)",
  decide: "Decision generation and recommendations",
  act: "Action execution and notification",
};

export function OODADashboard({
  className = "",
  pipelineId,
  refreshInterval = 10000,
}: OODADashboardProps) {
  const [summary, setSummary] = useState<OodaSummary | null>(null);
  const [analysis, setAnalysis] = useState<BottleneckAnalysis | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<OodaMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);

  // Fetch OODA data
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        days: selectedDays.toString(),
        ...(pipelineId ? { pipelineId } : {}),
      });

      const [summaryRes, analysisRes, metricsRes] = await Promise.all([
        fetch(`/api/defense/ooda?action=summary&${params}`),
        fetch(`/api/defense/ooda?action=bottlenecks&${params}`),
        fetch(`/api/defense/ooda?action=metrics&${params}&limit=20`),
      ]);

      if (!summaryRes.ok || !analysisRes.ok || !metricsRes.ok) {
        throw new Error("Failed to fetch OODA data");
      }

      const summaryData = await summaryRes.json();
      const analysisData = await analysisRes.json();
      const metricsData = await metricsRes.json();

      setSummary(summaryData.summary);
      setAnalysis(analysisData.analysis);
      setRecentMetrics(metricsData.metrics ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [pipelineId, selectedDays]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Calculate max latency for scaling bars
  const maxLatency = summary
    ? Math.max(...Object.values(summary.averageByPhase), 100)
    : 100;

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700/50 rounded w-1/3" />
          <div className="h-48 bg-slate-700/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl border border-cyan-500/20 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyan-300">OODA Loop Analytics</h2>
            <p className="text-sm text-slate-400 mt-1">
              Decision Cycle Optimization • {summary?.totalMeasurements ?? 0} measurements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm"
            >
              <option value={1}>Last 24h</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Main stats */}
      {summary && (
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Avg Total</div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">
              <HoloNumber value={Math.round(summary.averageTotal)} />
              <span className="text-sm ml-1">ms</span>
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-amber-500/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Bottleneck</div>
            <div className={`text-2xl font-bold mt-1 capitalize ${PHASE_COLORS[summary.bottleneck].text}`}>
              {summary.bottleneck}
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Edge vs Central</div>
            <div className="text-lg font-semibold text-purple-300 mt-1">
              {summary.byProcessingType.edge.averageTotal > 0 && summary.byProcessingType.central.averageTotal > 0
                ? `${Math.round(((summary.byProcessingType.central.averageTotal - summary.byProcessingType.edge.averageTotal) / summary.byProcessingType.central.averageTotal) * 100)}% faster`
                : "—"
              }
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-emerald-500/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Measurements</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">
              <HoloNumber value={summary.totalMeasurements} />
            </div>
          </div>
        </div>
      )}

      {/* Phase breakdown */}
      {summary && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Phase Latency Breakdown</h3>
          <div className="space-y-4">
            {(["observe", "orient", "decide", "act"] as OodaPhase[]).map((phase) => {
              const latency = summary.averageByPhase[phase];
              const percentage = summary.averageTotal > 0 ? (latency / summary.averageTotal) * 100 : 0;
              const isBottleneck = phase === summary.bottleneck;

              return (
                <div key={phase} className={`${isBottleneck ? "ring-2 ring-amber-500/50 rounded-lg p-2 -mx-2" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold capitalize ${PHASE_COLORS[phase].text}`}>
                        {phase}
                      </span>
                      {isBottleneck && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-300">
                          Bottleneck
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-300">
                      {latency.toFixed(0)}ms ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${PHASE_COLORS[phase].bar} transition-all duration-500`}
                      style={{ width: `${(latency / maxLatency) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {PHASE_DESCRIPTIONS[phase]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">Optimization Recommendations</h3>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-sm text-slate-300 flex items-start gap-2"
              >
                <span className="text-cyan-400">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent measurements */}
      {recentMetrics.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">Recent Measurements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Time</th>
                  <th className="text-left pb-2">Pipeline</th>
                  <th className="text-left pb-2">Type</th>
                  <th className="text-right pb-2">Total</th>
                  <th className="text-right pb-2">Bottleneck</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {recentMetrics.slice(0, 5).map((metric) => (
                  <tr key={metric.id} className="border-t border-slate-700/30">
                    <td className="py-2 text-slate-400">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 font-sans text-xs">{metric.pipelineId}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        metric.processingType === "edge"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : metric.processingType === "central"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {metric.processingType}
                      </span>
                    </td>
                    <td className="py-2 text-right font-sans">{metric.totalLatencyMs}ms</td>
                    <td className={`py-2 text-right capitalize ${PHASE_COLORS[metric.bottleneckPhase].text}`}>
                      {metric.bottleneckPhase}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No data state */}
      {summary?.totalMeasurements === 0 && (
        <div className="p-6 text-center text-slate-400">
          No OODA measurements recorded yet. Start tracking decision cycles to see analytics.
        </div>
      )}
    </div>
  );
}

export default OODADashboard;
