"use client";

/**
 * Threat Visualization Component
 *
 * Displays threat events and network topology for security monitoring.
 * Implements pack-ai-defense-001 §3.4 visualization.
 *
 * Features:
 * - Active threat list with severity indicators
 * - Threat summary statistics
 * - Network graph (simplified 2D view)
 * - Threat detection trigger
 */

import React, { useState, useEffect, useCallback } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type ThreatType =
  | "pump_dump"
  | "wash_trading"
  | "price_manipulation"
  | "shill_bidding"
  | "account_compromise"
  | "bot_activity"
  | "ddil_attack"
  | "unknown";

type ThreatSeverity = "info" | "low" | "medium" | "high" | "critical";
type ThreatStatus = "detected" | "investigating" | "confirmed" | "mitigated" | "false_positive";

interface ThreatEvent {
  id: string;
  threatType: ThreatType;
  techniqueId: string | null;
  severity: ThreatSeverity;
  confidence: number;
  description: string;
  status: ThreatStatus;
  affectedCardIds: string[];
  suggestedActions: string[];
  detectedAt: string;
}

interface ThreatSummary {
  totalThreats: number;
  bySeverity: Record<ThreatSeverity, number>;
  byType: Record<ThreatType, number>;
  byStatus: Record<ThreatStatus, number>;
  avgConfidence: number;
  avgTimeToMitigation: number | null;
}

interface ThreatVisualizationProps {
  className?: string;
  refreshInterval?: number;
}

// Severity styling
const SEVERITY_STYLES: Record<ThreatSeverity, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-300", icon: "ℹ️" },
  low: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300", icon: "🔵" },
  medium: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300", icon: "🟡" },
  high: { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-300", icon: "🟠" },
  critical: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-300", icon: "🔴" },
};

// Threat type labels
const THREAT_TYPE_LABELS: Record<ThreatType, string> = {
  pump_dump: "Pump & Dump",
  wash_trading: "Wash Trading",
  price_manipulation: "Price Manipulation",
  shill_bidding: "Shill Bidding",
  account_compromise: "Account Compromise",
  bot_activity: "Bot Activity",
  ddil_attack: "DDIL Attack",
  unknown: "Unknown",
};

// Status labels
const STATUS_LABELS: Record<ThreatStatus, { label: string; color: string }> = {
  detected: { label: "Detected", color: "text-amber-300" },
  investigating: { label: "Investigating", color: "text-blue-300" },
  confirmed: { label: "Confirmed", color: "text-red-300" },
  mitigated: { label: "Mitigated", color: "text-emerald-300" },
  false_positive: { label: "False Positive", color: "text-slate-400" },
};

export function ThreatVisualization({
  className = "",
  refreshInterval = 10000,
}: ThreatVisualizationProps) {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [summary, setSummary] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);
  const [severityFilter, setSeverityFilter] = useState<ThreatSeverity | "all">("all");

  // Fetch threat data
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(severityFilter !== "all" ? { severity: severityFilter } : {}),
      });

      const [threatsRes, summaryRes] = await Promise.all([
        fetch(`/api/defense/threats?action=active&${params}`),
        fetch("/api/defense/threats?action=summary&days=7"),
      ]);

      if (!threatsRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch threat data");
      }

      const threatsData = await threatsRes.json();
      const summaryData = await summaryRes.json();

      setThreats(threatsData.threats ?? []);
      setSummary(summaryData.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Filter threats by severity
  const filteredThreats = severityFilter === "all"
    ? threats
    : threats.filter((t) => t.severity === severityFilter);

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
            <h2 className="text-2xl font-bold text-cyan-300">Threat Detection</h2>
            <p className="text-sm text-slate-400 mt-1">
              Market Manipulation Monitoring • {threats.length} active threats
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as ThreatSeverity | "all")}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
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

      {/* Summary stats */}
      {summary && (
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["critical", "high", "medium", "low", "info"] as ThreatSeverity[]).map((sev) => {
            const styles = SEVERITY_STYLES[sev];
            return (
              <div
                key={sev}
                className={`p-3 rounded-lg border ${styles.border} ${styles.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase ${styles.text}`}>{sev}</span>
                  <span>{styles.icon}</span>
                </div>
                <div className={`text-2xl font-bold mt-1 ${styles.text}`}>
                  <HoloNumber value={summary.bySeverity[sev]} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Threat list */}
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-3">Active Threats</h3>

        {filteredThreats.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-600/50 rounded-lg">
            {severityFilter === "all"
              ? "No active threats detected. System is operating normally."
              : `No ${severityFilter} severity threats.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThreats.map((threat) => {
              const styles = SEVERITY_STYLES[threat.severity];
              const statusInfo = STATUS_LABELS[threat.status];
              const isSelected = selectedThreat?.id === threat.id;

              return (
                <div
                  key={threat.id}
                  className={`p-4 rounded-lg border ${styles.border} ${styles.bg} cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-cyan-500/50" : "hover:bg-opacity-30"
                  }`}
                  onClick={() => setSelectedThreat(isSelected ? null : threat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{styles.icon}</span>
                      <div>
                        <div className={`font-semibold ${styles.text}`}>
                          {THREAT_TYPE_LABELS[threat.threatType]}
                        </div>
                        <div className="text-sm text-slate-400 mt-0.5">
                          {threat.description.length > 100
                            ? `${threat.description.slice(0, 100)}...`
                            : threat.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {Math.round(threat.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3">
                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400 text-xs">Technique</div>
                          <div className="text-slate-300 font-sans">
                            {threat.techniqueId ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Detected</div>
                          <div className="text-slate-300">
                            {new Date(threat.detectedAt).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Affected Cards</div>
                          <div className="text-slate-300">
                            {threat.affectedCardIds.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Severity</div>
                          <div className={`uppercase ${styles.text}`}>
                            {threat.severity}
                          </div>
                        </div>
                      </div>

                      {/* Suggested actions */}
                      {threat.suggestedActions.length > 0 && (
                        <div>
                          <div className="text-slate-400 text-xs mb-2">Suggested Actions</div>
                          <div className="space-y-1">
                            {threat.suggestedActions.map((action, i) => (
                              <div
                                key={i}
                                className="text-sm text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-cyan-400">→</span>
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Threat type breakdown */}
      {summary && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">Threat Types (7 days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(summary.byType)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg"
                >
                  <div className="text-xs text-slate-400">
                    {THREAT_TYPE_LABELS[type as ThreatType]}
                  </div>
                  <div className="text-lg font-semibold text-slate-200 mt-1">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-6 pt-0 border-t border-slate-700/30">
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-300">●</span> Mitigated
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-300">●</span> Investigating
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-300">●</span> Detected
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-300">●</span> Confirmed
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreatVisualization;
