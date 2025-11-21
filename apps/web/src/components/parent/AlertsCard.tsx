/**
 * Alerts Card - Display child's active alerts
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface Alert {
  id: string;
  type: 'price_spike' | 'pop_delta' | 'arbitrage' | 'manipulation';
  cardName: string;
  cardSet: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

interface AlertsCardProps {
  childId: string;
}

export function AlertsCard({ childId }: AlertsCardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [childId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // In production, this would fetch from /api/alerts?userId=[childId]
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock data
      setAlerts([
        {
          id: 'a1',
          type: 'manipulation',
          cardName: 'Umbreon VMAX',
          cardSet: 'Evolving Skies',
          message: 'Manipulation alert: Coordinated pump detected (+45% in 2h)',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          severity: 'critical',
        },
        {
          id: 'a2',
          type: 'price_spike',
          cardName: 'Lugia V',
          cardSet: 'Silver Tempest',
          message: 'Price spike: +28% in 24h',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          severity: 'warning',
        },
        {
          id: 'a3',
          type: 'pop_delta',
          cardName: 'Charizard',
          cardSet: 'Base Set',
          message: 'PSA 10 population increased by 12 cards',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          severity: 'info',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'manipulation':
        return <AlertTriangle className="h-5 w-5" />;
      case 'price_spike':
        return <TrendingUp className="h-5 w-5" />;
      case 'pop_delta':
        return <Zap className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-400/30';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-400/30';
      case 'info':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-400/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="bg-ink/95 border border-amber-500/20 rounded-lg p-6 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-amber-500/20 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-20 bg-amber-500/20 rounded"></div>
            <div className="h-20 bg-amber-500/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink/95 border border-amber-500/20 rounded-lg p-6 backdrop-blur-xl hover:border-amber-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Active Alerts</h2>
        <span className="ml-auto text-sm text-slate-400">{alerts.length} alerts</span>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className={getAlertColor(alert.severity).split(' ')[0]}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">
                    {alert.cardName} • {alert.cardSet}
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatTimestamp(alert.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
