/**
 * Resource Allocation Optimizer Component
 *
 * Analysis drains bandwidth; overclocking leads to burnout.
 * This component manages shield mode time allocation and prevents overload.
 *
 * Features:
 * - Daily shield mode time tracking
 * - Configurable limits (20% cap for relationship analysis)
 * - HRV-triggered auto-toggle to surrender/recovery
 * - Burnout risk scoring
 * - Historical trends
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  Clock,
  Battery,
  BatteryWarning,
  Zap,
  Moon,
  Sun,
  Target,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Activity,
  Heart,
  Brain,
  Shield,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ResourceOptimizerProps {
  userId?: string;
  className?: string;
}

type ShieldMode = 'analysis' | 'balanced' | 'surrender' | 'recovery';

interface DailyAllocation {
  date: string;
  shieldModeMinutes: Record<ShieldMode, number>;
  totalActiveMinutes: number;
  burnoutRiskScore: number;
  avgHrv?: number;
  autoToggles: Array<{
    timestamp: string;
    fromMode: ShieldMode;
    toMode: ShieldMode;
    trigger: 'hrv_drop' | 'time_limit' | 'manual' | 'scheduled';
    triggerValue?: number;
  }>;
}

interface DailyLimits {
  maxAnalysisMinutes: number;
  relationshipAnalysisPercent: number;
  triggerRecoveryThreshold: number;
}

interface ActiveSession {
  mode: ShieldMode;
  startTime: Date;
  elapsedMinutes: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODE_CONFIG: Record<ShieldMode, {
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = {
  analysis: {
    label: 'Analysis',
    icon: Brain,
    color: 'cyan',
    description: 'Deep pattern analysis. High cognitive load.',
  },
  balanced: {
    label: 'Balanced',
    icon: Target,
    color: 'green',
    description: 'Optimal state. Analysis with trust.',
  },
  surrender: {
    label: 'Surrender',
    icon: Heart,
    color: 'purple',
    description: 'Trust-forward. Minimal analysis.',
  },
  recovery: {
    label: 'Recovery',
    icon: Moon,
    color: 'blue',
    description: 'Rest and restore. No analysis.',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ResourceOptimizer({ userId, className = '' }: ResourceOptimizerProps) {
  const [allocation, setAllocation] = useState<DailyAllocation | null>(null);
  const [limits, setLimits] = useState<DailyLimits>({
    maxAnalysisMinutes: 180,
    relationshipAnalysisPercent: 20,
    triggerRecoveryThreshold: 50,
  });
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [currentMode, setCurrentMode] = useState<ShieldMode>('balanced');
  const [activeTab, setActiveTab] = useState<'today' | 'settings' | 'history'>('today');
  const [isTracking, setIsTracking] = useState(false);
  const [currentHrv, setCurrentHrv] = useState<number | null>(null);

  // Timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && activeSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeSession.startTime.getTime()) / 60000);
        setActiveSession(prev => prev ? { ...prev, elapsedMinutes: elapsed } : null);

        // Check limits
        if (allocation) {
          const totalMode = allocation.shieldModeMinutes[currentMode] + elapsed;
          if (currentMode === 'analysis' && totalMode >= limits.maxAnalysisMinutes) {
            autoSwitch('time_limit', 'balanced');
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, activeSession, allocation, currentMode, limits]);

  // Simulated HRV monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTracking) {
        const hrv = 35 + Math.random() * 45;
        setCurrentHrv(hrv);

        // Auto-switch on HRV drop
        if (hrv < limits.triggerRecoveryThreshold && currentMode !== 'recovery') {
          autoSwitch('hrv_drop', 'recovery', hrv);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isTracking, currentMode, limits.triggerRecoveryThreshold]);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    setAllocation({
      date: new Date().toISOString().split('T')[0],
      shieldModeMinutes: {
        analysis: 85,
        balanced: 120,
        surrender: 45,
        recovery: 20,
      },
      totalActiveMinutes: 270,
      burnoutRiskScore: 35,
      avgHrv: 52,
      autoToggles: [
        {
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          fromMode: 'analysis',
          toMode: 'balanced',
          trigger: 'time_limit',
        },
        {
          timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
          fromMode: 'balanced',
          toMode: 'recovery',
          trigger: 'hrv_drop',
          triggerValue: 38,
        },
      ],
    });
  };

  const autoSwitch = (trigger: 'hrv_drop' | 'time_limit', toMode: ShieldMode, value?: number) => {
    if (allocation) {
      const newToggle = {
        timestamp: new Date().toISOString(),
        fromMode: currentMode,
        toMode,
        trigger,
        triggerValue: value,
      };
      setAllocation({
        ...allocation,
        autoToggles: [...allocation.autoToggles, newToggle],
      });
    }
    setCurrentMode(toMode);
  };

  const startTracking = (mode: ShieldMode) => {
    setCurrentMode(mode);
    setActiveSession({
      mode,
      startTime: new Date(),
      elapsedMinutes: 0,
    });
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (activeSession && allocation) {
      const minutes = activeSession.elapsedMinutes;
      setAllocation({
        ...allocation,
        shieldModeMinutes: {
          ...allocation.shieldModeMinutes,
          [activeSession.mode]: allocation.shieldModeMinutes[activeSession.mode] + minutes,
        },
        totalActiveMinutes: allocation.totalActiveMinutes + minutes,
      });
    }
    setActiveSession(null);
    setIsTracking(false);
  };

  const switchMode = (newMode: ShieldMode) => {
    if (isTracking) {
      // Save current session
      if (activeSession && allocation) {
        setAllocation({
          ...allocation,
          shieldModeMinutes: {
            ...allocation.shieldModeMinutes,
            [activeSession.mode]: allocation.shieldModeMinutes[activeSession.mode] + activeSession.elapsedMinutes,
          },
          autoToggles: [
            ...allocation.autoToggles,
            {
              timestamp: new Date().toISOString(),
              fromMode: currentMode,
              toMode: newMode,
              trigger: 'manual',
            },
          ],
        });
      }
      // Start new session
      setActiveSession({
        mode: newMode,
        startTime: new Date(),
        elapsedMinutes: 0,
      });
    }
    setCurrentMode(newMode);
  };

  const getBurnoutColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const analysisPercent = allocation
    ? (allocation.shieldModeMinutes.analysis / limits.maxAnalysisMinutes) * 100
    : 0;

  return (
    <div className={`resource-optimizer ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gauge className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">
            RESOURCE OPTIMIZER
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Prevent cognitive overload. Cap analysis time. Auto-toggle on stress signals.
        </p>

        {/* Current Status */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* Active Mode */}
          <div className={`p-4 rounded-lg border bg-${MODE_CONFIG[currentMode].color}-500/10 border-${MODE_CONFIG[currentMode].color}-500/30`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = MODE_CONFIG[currentMode].icon;
                  return <Icon className={`w-5 h-5 text-${MODE_CONFIG[currentMode].color}-400`} />;
                })()}
                <span className={`font-medium text-${MODE_CONFIG[currentMode].color}-400`}>
                  {MODE_CONFIG[currentMode].label}
                </span>
              </div>
              {isTracking && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Tracking
                </span>
              )}
            </div>
            {activeSession && (
              <div className="text-3xl font-bold text-white">
                {Math.floor(activeSession.elapsedMinutes / 60)}h {activeSession.elapsedMinutes % 60}m
              </div>
            )}
            <div className="text-xs text-gray-500">{MODE_CONFIG[currentMode].description}</div>
          </div>

          {/* Burnout Risk */}
          {allocation && (
            <div className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                {allocation.burnoutRiskScore >= 50 ? (
                  <BatteryWarning className="w-5 h-5 text-orange-400" />
                ) : (
                  <Battery className="w-5 h-5 text-green-400" />
                )}
                <span className="text-sm text-gray-400">Burnout Risk</span>
              </div>
              <div className={`text-3xl font-bold ${getBurnoutColor(allocation.burnoutRiskScore)}`}>
                {allocation.burnoutRiskScore}%
              </div>
              <div className="text-xs text-gray-500">
                {allocation.burnoutRiskScore < 30 ? 'Looking good' :
                 allocation.burnoutRiskScore < 50 ? 'Monitor closely' :
                 allocation.burnoutRiskScore < 70 ? 'Consider recovery' : 'Take a break!'}
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="mt-4 flex gap-3">
          {!isTracking ? (
            <button
              onClick={() => startTracking(currentMode)}
              className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Pause className="w-5 h-5" />
              Stop Tracking
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2 mb-6">
        {(['today', 'settings', 'history'] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'today' && 'Today'}
            {tab === 'settings' && 'Settings'}
            {tab === 'history' && 'History'}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Today View */}
        {activeTab === 'today' && allocation && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Mode Selector */}
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-4">Shield Mode</h4>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(MODE_CONFIG) as [ShieldMode, typeof MODE_CONFIG[ShieldMode]][]).map(([mode, config]) => {
                  const Icon = config.icon;
                  const isActive = currentMode === mode;
                  const minutes = allocation.shieldModeMinutes[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => switchMode(mode)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        isActive
                          ? `bg-${config.color}-500/20 border-${config.color}-500/50`
                          : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 text-${config.color}-400`} />
                          <span className={`font-medium text-sm ${isActive ? `text-${config.color}-400` : 'text-gray-400'}`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{minutes}m</span>
                      </div>
                      <div className="h-1 bg-gray-900/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${config.color}-500/50 rounded-full`}
                          style={{ width: `${Math.min(100, (minutes / 60) * 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Analysis Limit */}
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">Analysis Time Budget</h4>
                <span className={`text-sm ${analysisPercent > 80 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {allocation.shieldModeMinutes.analysis} / {limits.maxAnalysisMinutes} min
                </span>
              </div>
              <div className="h-4 bg-gray-900/50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    analysisPercent > 80 ? 'bg-red-500/50' :
                    analysisPercent > 60 ? 'bg-yellow-500/50' : 'bg-cyan-500/50'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, analysisPercent)}%` }}
                />
              </div>
              {analysisPercent > 80 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Approaching daily limit. Consider switching to balanced or surrender.
                </div>
              )}
            </div>

            {/* HRV Status */}
            {currentHrv !== null && (
              <div className={`p-4 rounded-lg border ${
                currentHrv >= 60 ? 'bg-green-500/10 border-green-500/30' :
                currentHrv >= 45 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <Activity className={`w-6 h-6 ${
                    currentHrv >= 60 ? 'text-green-400' :
                    currentHrv >= 45 ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                  <div>
                    <div className="font-medium text-white">HRV: {currentHrv.toFixed(0)} ms</div>
                    <div className="text-xs text-gray-500">
                      {currentHrv >= 60 ? 'Optimal - Continue current mode' :
                       currentHrv >= 45 ? 'Moderate - Monitor stress' :
                       `Low - Auto-toggle at ${limits.triggerRecoveryThreshold}ms`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Toggles Today */}
            {allocation.autoToggles.length > 0 && (
              <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                <h4 className="font-medium text-white mb-3">Auto-Toggles Today</h4>
                <div className="space-y-2">
                  {allocation.autoToggles.map((toggle, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-700/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">
                          {MODE_CONFIG[toggle.fromMode].label} → {MODE_CONFIG[toggle.toMode].label}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        toggle.trigger === 'hrv_drop' ? 'bg-red-500/20 text-red-400' :
                        toggle.trigger === 'time_limit' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {toggle.trigger.replace('_', ' ')}
                        {toggle.triggerValue !== undefined && ` (${toggle.triggerValue})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg space-y-6">
              <h4 className="font-medium text-white">Daily Limits</h4>

              {/* Max Analysis Minutes */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Max Analysis Time</span>
                  <span className="text-cyan-400">{limits.maxAnalysisMinutes} min</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="360"
                  step="30"
                  value={limits.maxAnalysisMinutes}
                  onChange={(e) => setLimits({ ...limits, maxAnalysisMinutes: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span>6 hours</span>
                </div>
              </div>

              {/* Relationship Analysis Cap */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Relationship Analysis Cap</span>
                  <span className="text-pink-400">{limits.relationshipAnalysisPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={limits.relationshipAnalysisPercent}
                  onChange={(e) => setLimits({ ...limits, relationshipAnalysisPercent: parseInt(e.target.value) })}
                  className="w-full accent-pink-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Max {limits.relationshipAnalysisPercent}% of analysis time on relationship patterns
                </div>
              </div>

              {/* HRV Threshold */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">HRV Recovery Threshold</span>
                  <span className="text-blue-400">{limits.triggerRecoveryThreshold} ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  value={limits.triggerRecoveryThreshold}
                  onChange={(e) => setLimits({ ...limits, triggerRecoveryThreshold: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Auto-switch to Recovery mode when HRV drops below this
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-2">Resource Governor</h4>
              <p className="text-sm text-gray-400">
                These limits act as external governors on your analysis system. When limits are reached,
                the system automatically suggests or triggers mode switches to prevent cognitive overload.
                Trust the governor - it&apos;s protecting your bandwidth.
              </p>
            </div>
          </motion.div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-4">Weekly Overview</h4>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(Date.now() - (6 - i) * 86400000);
                  const isToday = i === 6;
                  const mockUsage = 40 + Math.random() * 40;
                  return (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">
                        {date.toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className={`h-20 rounded flex items-end justify-center ${isToday ? 'bg-cyan-500/20' : 'bg-gray-800/50'}`}>
                        <div
                          className={`w-full rounded-t ${isToday ? 'bg-cyan-500/50' : 'bg-gray-600/50'}`}
                          style={{ height: `${mockUsage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(mockUsage * 3).toFixed(0)}m
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg text-center">
                <TrendingDown className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">-15%</div>
                <div className="text-xs text-gray-500">Analysis time vs last week</div>
              </div>
              <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg text-center">
                <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-400">+22%</div>
                <div className="text-xs text-gray-500">Surrender time vs last week</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
        active
          ? 'text-cyan-400 border-b-2 border-cyan-400'
          : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default ResourceOptimizer;
