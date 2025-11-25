"use client";

/**
 * Edge AI Dashboard Component
 *
 * Displays real-time status of edge AI nodes for DDIL resilience monitoring.
 * Implements pack-ai-defense-001 §3.1 visualization.
 *
 * Features:
 * - Network topology view with node status
 * - Health metrics (load, latency, error rate)
 * - Anomaly alerts
 * - DDIL simulation controls
 */

import React, { useState, useEffect, useCallback } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type NodeStatus = "online" | "degraded" | "intermittent" | "limited" | "denied" | "offline";

interface EdgeNode {
  id: string;
  name: string;
  region: string;
  nodeType: string;
  status: NodeStatus;
  load: number;
  latencyMs: number | null;
  errorRate: number | null;
  anomalyScore: number | null;
}

interface NetworkHealthSummary {
  totalNodes: number;
  byStatus: Record<NodeStatus, number>;
  averageLoad: number;
  averageLatency: number;
  anomalyCount: number;
}

interface EdgeAIDashboardProps {
  className?: string;
  refreshInterval?: number; // ms
  onSimulateStart?: () => void;
  onSimulateEnd?: () => void;
}

// Status color mapping
const STATUS_COLORS: Record<NodeStatus, { bg: string; border: string; text: string; pulse?: boolean }> = {
  online: { bg: "bg-emerald-500/20", border: "border-emerald-400/60", text: "text-emerald-300" },
  degraded: { bg: "bg-amber-500/20", border: "border-amber-400/60", text: "text-amber-300" },
  intermittent: { bg: "bg-yellow-500/20", border: "border-yellow-400/60", text: "text-yellow-300" },
  limited: { bg: "bg-orange-500/20", border: "border-orange-400/60", text: "text-orange-300" },
  denied: { bg: "bg-red-500/20", border: "border-red-400/60", text: "text-red-300", pulse: true },
  offline: { bg: "bg-slate-500/20", border: "border-slate-400/60", text: "text-slate-400" },
};

// Node type icons (simple text for now)
const NODE_TYPE_ICONS: Record<string, string> = {
  scraper: "📡",
  aggregator: "🔄",
  processor: "⚙️",
  cache: "💾",
  gateway: "🌐",
};

export function EdgeAIDashboard({
  className = "",
  refreshInterval = 5000,
}: EdgeAIDashboardProps) {
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [summary, setSummary] = useState<NetworkHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  // Fetch edge nodes
  const fetchNodes = useCallback(async () => {
    try {
      const [nodesRes, summaryRes] = await Promise.all([
        fetch("/api/defense/edge-nodes"),
        fetch("/api/defense/edge-nodes?summary=true"),
      ]);

      if (!nodesRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch edge node data");
      }

      const nodesData = await nodesRes.json();
      const summaryData = await summaryRes.json();

      setNodes(nodesData.nodes ?? []);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchNodes, refreshInterval]);

  // Start DDIL simulation
  const startSimulation = async (scenario: string) => {
    try {
      setSimulating(true);
      const res = await fetch("/api/defense/simulate-ddil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          durationMs: 60000, // 1 minute
          intensity: 0.7,
        }),
      });

      if (!res.ok) throw new Error("Failed to start simulation");

      const data = await res.json();
      setSimulationId(data.simulationId);

      // Auto-end after duration
      setTimeout(() => {
        setSimulating(false);
        setSimulationId(null);
      }, 60000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
      setSimulating(false);
    }
  };

  // End simulation early
  const endSimulation = async () => {
    if (!simulationId) return;

    try {
      await fetch(`/api/defense/simulate-ddil?simulationId=${simulationId}`, {
        method: "DELETE",
      });
      setSimulating(false);
      setSimulationId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end simulation");
    }
  };

  // Calculate health percentage
  const healthPercentage = summary
    ? Math.round((summary.byStatus.online / Math.max(summary.totalNodes, 1)) * 100)
    : 0;

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700/50 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700/50 rounded" />
            ))}
          </div>
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
            <h2 className="text-2xl font-bold text-cyan-300">Edge AI Network</h2>
            <p className="text-sm text-slate-400 mt-1">
              DDIL Resilience Monitoring • {summary?.totalNodes ?? 0} nodes
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Health indicator */}
            <div className="text-right">
              <div className="text-sm text-slate-400">Network Health</div>
              <div className={`text-2xl font-bold ${healthPercentage >= 80 ? "text-emerald-300" : healthPercentage >= 50 ? "text-amber-300" : "text-red-300"}`}>
                <HoloNumber value={healthPercentage} />%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Avg Load"
            value={`${summary.averageLoad.toFixed(1)}%`}
            color={summary.averageLoad > 80 ? "amber" : "cyan"}
          />
          <StatCard
            label="Avg Latency"
            value={`${summary.averageLatency.toFixed(0)}ms`}
            color={summary.averageLatency > 1000 ? "amber" : "cyan"}
          />
          <StatCard
            label="Anomalies"
            value={summary.anomalyCount.toString()}
            color={summary.anomalyCount > 0 ? "red" : "emerald"}
          />
          <StatCard
            label="Degraded"
            value={(summary.byStatus.degraded + summary.byStatus.intermittent + summary.byStatus.limited).toString()}
            color={summary.byStatus.degraded > 0 ? "amber" : "emerald"}
          />
        </div>
      )}

      {/* Node grid */}
      <div className="p-6 pt-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Node Status</h3>
          {/* DDIL Simulation controls */}
          <div className="flex gap-2">
            {simulating ? (
              <button
                onClick={endSimulation}
                className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm hover:bg-red-500/30 transition-colors"
              >
                End Simulation
              </button>
            ) : (
              <select
                onChange={(e) => e.target.value && startSimulation(e.target.value)}
                className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Simulate DDIL...</option>
                <option value="degraded">Degraded</option>
                <option value="intermittent">Intermittent</option>
                <option value="limited">Limited</option>
                <option value="denied">Denied</option>
              </select>
            )}
          </div>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No edge nodes configured. Add nodes via the API to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-6 pt-0">
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${colors.bg} ${colors.border} border`} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "cyan" | "amber" | "red" | "emerald";
}) {
  const colorClasses = {
    cyan: "border-cyan-500/30 text-cyan-300",
    amber: "border-amber-500/30 text-amber-300",
    red: "border-red-500/30 text-red-300",
    emerald: "border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className={`p-4 bg-slate-800/50 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

// Node card component
function NodeCard({ node }: { node: EdgeNode }) {
  const statusColors = STATUS_COLORS[node.status];
  const icon = NODE_TYPE_ICONS[node.nodeType] ?? "📦";

  return (
    <div
      className={`p-4 rounded-lg border ${statusColors.border} ${statusColors.bg} ${statusColors.pulse ? "animate-pulse" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <div className={`font-semibold ${statusColors.text}`}>{node.name}</div>
            <div className="text-xs text-slate-400">{node.region}</div>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs uppercase font-medium ${statusColors.text} ${statusColors.bg} border ${statusColors.border}`}>
          {node.status}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-slate-400">Load</div>
          <div className={node.load > 80 ? "text-amber-300" : "text-slate-200"}>
            {node.load.toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-slate-400">Latency</div>
          <div className={node.latencyMs && node.latencyMs > 1000 ? "text-amber-300" : "text-slate-200"}>
            {node.latencyMs ? `${node.latencyMs}ms` : "—"}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Errors</div>
          <div className={node.errorRate && node.errorRate > 0.1 ? "text-red-300" : "text-slate-200"}>
            {node.errorRate !== null ? `${(node.errorRate * 100).toFixed(1)}%` : "—"}
          </div>
        </div>
      </div>

      {node.anomalyScore !== null && node.anomalyScore > 0.5 && (
        <div className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
          ⚠️ Anomaly detected (score: {(node.anomalyScore * 100).toFixed(0)}%)
        </div>
      )}
    </div>
  );
}

export default EdgeAIDashboard;
