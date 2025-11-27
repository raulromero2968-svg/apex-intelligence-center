'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SectionShell from '../../(sections)/SectionShell';
import SimulationChart from '@/components/simulations/SimulationChart';
import SimulationSummary from '@/components/simulations/SimulationSummary';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  pnl?: number;
  risk?: number;
  spread?: number;
}

interface AgentDecision {
  timestamp: string;
  action: string;
  reasoning: string;
  confidence?: number;
}

export default function SimulationPage() {
  const params = useParams();
  const simulationId = params.simulationId as string;

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [status, setStatus] = useState<'running' | 'completed' | 'error'>('running');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        const endpoint = `/api/events/lamp/${simulationId}`;
        eventSource = new EventSource(endpoint);

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
              return;
            }

            if (data.status) {
              setStatus(data.status);

              if (data.result) {
                if (data.result.metrics) {
                  setDataPoints((prev) => [
                    ...prev,
                    {
                      timestamp: data.updatedAt || new Date().toISOString(),
                      pnl: data.result.metrics.pnl,
                      risk: data.result.metrics.risk,
                      spread: data.result.metrics.spread,
                    },
                  ]);
                }

                if (data.result.decision) {
                  setDecisions((prev) => [
                    ...prev,
                    {
                      timestamp: data.updatedAt || new Date().toISOString(),
                      action: data.result.decision.action,
                      reasoning: data.result.decision.reasoning,
                      confidence: data.result.decision.confidence,
                    },
                  ]);
                }
              }

              if (data.error) {
                setError(data.error.message || 'Simulation error');
                setStatus('error');
              }
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();

          if (status === 'running') {
            reconnectTimeout = setTimeout(() => {
              connect();
            }, 3000);
          }
        };
      } catch (err) {
        setError('Failed to connect to simulation stream');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [simulationId, status]);

  const currentPnL = dataPoints[dataPoints.length - 1]?.pnl;
  const currentRisk = dataPoints[dataPoints.length - 1]?.risk;

  if (error && status === 'error') {
    return (
      <SectionShell title="Simulation Dashboard" kicker={`Simulation: ${simulationId}`}>
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Simulation Dashboard" kicker={`Simulation: ${simulationId}`}>
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <span className="text-green-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="text-yellow-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connecting...
            </span>
          )}
        </div>

        {/* Summary */}
        <SimulationSummary
          decisions={decisions}
          currentPnL={currentPnL}
          currentRisk={currentRisk}
          status={status}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Profit & Loss</h3>
            <SimulationChart data={dataPoints} metric="pnl" title="P&L" />
          </div>

          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Score</h3>
            <SimulationChart data={dataPoints} metric="risk" title="Risk" />
          </div>
        </div>

        {dataPoints.length === 0 && (
          <div className="text-center text-white/50 py-12">
            Waiting for simulation data...
          </div>
        )}
      </div>
    </SectionShell>
  );
}

