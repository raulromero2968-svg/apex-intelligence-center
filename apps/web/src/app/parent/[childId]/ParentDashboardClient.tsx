'use client';

import { useState, useEffect } from 'react';
import { ParentalControl, SessionHistory, WatchlistItem, Portfolio } from '@/db/schema';

interface Props {
  childId: string;
  childName: string;
  activities: SessionHistory[];
  watchlist: (WatchlistItem & { card: any })[];
  portfolios: (Portfolio & { holdings: any[] })[];
  totalPortfolioValue: number;
  controls?: ParentalControl;
}

export default function ParentDashboardClient({
  childId,
  childName,
  activities: initialActivities,
  watchlist,
  portfolios,
  totalPortfolioValue,
  controls: initialControls,
}: Props) {
  const [controls, setControls] = useState(initialControls);
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(false);

  // Real-time activity monitoring (SSE)
  useEffect(() => {
    const eventSource = new EventSource(`/api/family/activity/stream?childId=${childId}`);

    eventSource.onmessage = (event) => {
      const newActivity = JSON.parse(event.data);
      setActivities((prev) => [newActivity, ...prev].slice(0, 50));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [childId]);

  const updateControls = async (updates: Partial<ParentalControl>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/family/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update controls');
      }

      const data = await response.json();
      setControls(data.controls);
    } catch (error) {
      console.error('Error updating controls:', error);
      alert('Failed to update controls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBedtime = () => {
    updateControls({ bedtimeEnabled: !controls?.bedtimeEnabled });
  };

  const toggleCoolDown = () => {
    updateControls({ coolDownEnabled: !controls?.coolDownEnabled });
  };

  const disableAllNotifications = () => {
    updateControls({
      notificationsDisabled: true,
      disabledChannels: ['email', 'push', 'discord', 'telegram'],
    });
  };

  const enableAllNotifications = () => {
    updateControls({
      notificationsDisabled: false,
      disabledChannels: [],
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          <div className="text-sm text-white/60">Portfolio Value</div>
          <div className="text-3xl font-semibold text-cyan-400 mt-2">
            {formatCurrency(totalPortfolioValue)}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          <div className="text-sm text-white/60">Watchlist Items</div>
          <div className="text-3xl font-semibold text-cyan-400 mt-2">
            {watchlist.length}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          <div className="text-sm text-white/60">Recent Activities</div>
          <div className="text-3xl font-semibold text-cyan-400 mt-2">
            {activities.length}
          </div>
        </div>
      </div>

      {/* Parental Controls */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Parental Controls</h2>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 space-y-4">
          {/* Bedtime Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Bedtime Mode</div>
              <div className="text-sm text-white/60">
                Disable trading during specified hours
                {controls?.bedtimeEnabled && controls.bedtimeStart && controls.bedtimeEnd && (
                  <span className="ml-2">
                    ({controls.bedtimeStart} - {controls.bedtimeEnd})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggleBedtime}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                controls?.bedtimeEnabled ? 'bg-cyan-500' : 'bg-white/20'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  controls?.bedtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Cool Down Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Cool Down Mode</div>
              <div className="text-sm text-white/60">
                Enforce waiting periods between trades
                {controls?.coolDownEnabled && controls.coolDownMinutes && (
                  <span className="ml-2">({controls.coolDownMinutes} minutes)</span>
                )}
              </div>
            </div>
            <button
              onClick={toggleCoolDown}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                controls?.coolDownEnabled ? 'bg-cyan-500' : 'bg-white/20'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  controls?.coolDownEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Notifications</div>
              <div className="text-sm text-white/60">
                {controls?.notificationsDisabled ? 'All disabled' : 'Enabled'}
              </div>
            </div>
            <button
              onClick={
                controls?.notificationsDisabled
                  ? enableAllNotifications
                  : disableAllNotifications
              }
              disabled={loading}
              className={`px-4 py-2 rounded-lg transition-colors ${
                controls?.notificationsDisabled
                  ? 'border border-cyan-500/20 bg-cyan-500/20 text-cyan-400'
                  : 'border border-red-500/20 bg-red-500/20 text-red-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {controls?.notificationsDisabled ? 'Enable All' : 'Disable All'}
            </button>
          </div>
        </div>
      </section>

      {/* Watchlist */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Child's Watchlist</h2>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          {watchlist.length === 0 ? (
            <div className="text-sm text-white/60 text-center py-8">
              No watchlist items yet
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <div className="text-white font-medium">{item.card.name}</div>
                    <div className="text-sm text-white/60">{item.card.setName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400">
                      {formatCurrency(item.targetPrice)}
                    </div>
                    <div className="text-xs text-white/60">
                      {item.direction === 'above' ? '↑ Above' : '↓ Below'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Session History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">Session History</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-xs text-white/60">Real-time</span>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          {activities.length === 0 ? (
            <div className="text-sm text-white/60 text-center py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 20).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.blockedByBedtime || activity.blockedByCoolDown
                          ? 'bg-red-400'
                          : 'bg-cyan-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {activity.activityType.replace(/_/g, ' ')}
                      </div>
                      {(activity.blockedByBedtime || activity.blockedByCoolDown) && (
                        <div className="text-xs text-red-400">
                          Blocked by {activity.blockedByBedtime ? 'bedtime' : 'cool down'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Portfolio Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Portfolio Overview</h2>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          {portfolios.length === 0 ? (
            <div className="text-sm text-white/60 text-center py-8">
              No portfolios yet
            </div>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="space-y-3">
                  <div className="text-white font-medium">{portfolio.name}</div>
                  {portfolio.holdings.length === 0 ? (
                    <div className="text-sm text-white/60">No holdings</div>
                  ) : (
                    <div className="space-y-2">
                      {portfolio.holdings.slice(0, 5).map((holding) => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div>
                            <div className="text-white text-sm">{holding.card.name}</div>
                            <div className="text-xs text-white/60">
                              Qty: {holding.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-cyan-400">
                              {formatCurrency(holding.costBasisUsd * holding.quantity)}
                            </div>
                            <div className="text-xs text-white/60">
                              {formatCurrency(holding.costBasisUsd)} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
