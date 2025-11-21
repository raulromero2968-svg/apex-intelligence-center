'use client';

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AgentDecision {
  timestamp: string;
  action: string;
  reasoning: string;
  confidence?: number;
}

interface SimulationSummaryProps {
  decisions: AgentDecision[];
  currentPnL?: number;
  currentRisk?: number;
  status: 'running' | 'completed' | 'error';
}

export default function SimulationSummary({
  decisions,
  currentPnL,
  currentRisk,
  status,
}: SimulationSummaryProps) {
  const latestDecision = decisions[decisions.length - 1];

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm text-white/50 mb-1">Current P&L</div>
          <div
            className={`text-2xl font-bold ${
              (currentPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${(currentPnL ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm text-white/50 mb-1">Risk Score</div>
          <div className="text-2xl font-bold text-yellow-400">
            {(currentRisk ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm text-white/50 mb-1">Status</div>
          <div className="flex items-center gap-2">
            {status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : status === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-lg font-semibold text-white capitalize">{status}</span>
          </div>
        </div>
      </div>

      {/* Latest Decision */}
      {latestDecision && (
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm font-semibold text-white mb-2">Latest Agent Decision</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Action:</span>
              <span className="text-sm text-cyan-400">{latestDecision.action}</span>
            </div>
            <div className="text-sm text-white/70">{latestDecision.reasoning}</div>
            {latestDecision.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Confidence:</span>
                <span className="text-sm text-white">
                  {(latestDecision.confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
            <div className="text-xs text-white/50 mt-2">
              {new Date(latestDecision.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Decisions Table */}
      {decisions.length > 0 && (
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm font-semibold text-white mb-3">
            Agent Decisions ({decisions.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/70">Time</th>
                  <th className="text-left py-2 text-white/70">Action</th>
                  <th className="text-left py-2 text-white/70">Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {decisions.slice(-10).reverse().map((decision, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-2 text-white/50">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 text-cyan-400">{decision.action}</td>
                    <td className="py-2 text-white/70 truncate max-w-xs">
                      {decision.reasoning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


