'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import {
  PriceAlert,
  createPriceAlert,
  getPriceAlerts,
  deletePriceAlert,
  togglePriceAlert
} from '@/lib/portfolio-utils';

interface PriceAlertsProps {
  availableCards?: string[];
}

export const PriceAlerts: React.FC<PriceAlertsProps> = ({ availableCards = [] }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    cardName: '',
    condition: 'above' as 'above' | 'below',
    targetPrice: '',
    currentPrice: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    setAlerts(getPriceAlerts());
  };

  const handleCreateAlert = () => {
    if (!newAlert.cardName || !newAlert.targetPrice || !newAlert.currentPrice) {
      alert('Please fill in all fields');
      return;
    }

    createPriceAlert(
      newAlert.cardName,
      newAlert.condition,
      parseFloat(newAlert.targetPrice),
      parseFloat(newAlert.currentPrice)
    );

    setNewAlert({
      cardName: '',
      condition: 'above',
      targetPrice: '',
      currentPrice: ''
    });

    setShowCreateModal(false);
    loadAlerts();
  };

  const handleDeleteAlert = (alertId: string) => {
    if (confirm('Delete this price alert?')) {
      deletePriceAlert(alertId);
      loadAlerts();
    }
  };

  const handleToggleAlert = (alertId: string) => {
    togglePriceAlert(alertId);
    loadAlerts();
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-white">Price Alerts</h3>
          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs">
            {alerts.filter(a => a.enabled).length} active
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Alert
        </button>
      </div>

      {/* Alerts List */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No price alerts configured</p>
            <p className="text-xs mt-1">Create an alert to get notified when card prices hit your targets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all ${
                  alert.enabled
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-900/30 border-slate-800 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white text-sm">{alert.cardName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono ${
                          alert.condition === 'above'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {alert.condition === 'above' ? '↑' : '↓'} ${alert.targetPrice}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        Alert when price goes{' '}
                        <span className="text-white font-medium">{alert.condition}</span>{' '}
                        <span className="text-white font-mono">${alert.targetPrice}</span>
                      </div>
                      <div className="text-slate-500">
                        Current: ${alert.currentPrice} • Created{' '}
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                    >
                      {alert.enabled ? (
                        <ToggleRight className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Create Price Alert</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Card Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Card Name
                </label>
                {availableCards.length > 0 ? (
                  <select
                    value={newAlert.cardName}
                    onChange={e => setNewAlert({ ...newAlert, cardName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select a card</option>
                    {availableCards.map(card => (
                      <option key={card} value={card}>
                        {card}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newAlert.cardName}
                    onChange={e => setNewAlert({ ...newAlert, cardName: e.target.value })}
                    placeholder="e.g., Charizard Base Set PSA 9"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    value={newAlert.currentPrice}
                    onChange={e => setNewAlert({ ...newAlert, currentPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Alert Condition
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      newAlert.condition === 'above'
                        ? 'bg-green-900/30 border-green-500 text-green-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Above Target
                  </button>
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      newAlert.condition === 'below'
                        ? 'bg-red-900/30 border-red-500 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Below Target
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    value={newAlert.targetPrice}
                    onChange={e => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateAlert}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
              >
                Create Alert
              </button>

              {/* Info */}
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 text-xs text-slate-300">
                <strong className="text-blue-400">Note:</strong> In production, alerts would trigger email/SMS notifications. This demo stores alerts locally.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
