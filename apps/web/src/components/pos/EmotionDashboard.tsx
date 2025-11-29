/**
 * Emotion Dashboard Component
 *
 * Real-time emotion tracking with HRV integration hooks.
 * Turns emotion from noise to signal for system efficiency.
 *
 * Features:
 * - Core emotion tracking (Plutchik's wheel + extended)
 * - HRV biofeedback integration (Apple Watch, Fitbit, Oura, manual)
 * - Shield mode recommendations based on state
 * - Pattern detection and firewall alerts
 * - Historical trends and insights
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Heart,
  Brain,
  Zap,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
  Watch,
  Smartphone,
  Plus,
  Shield,
  Target,
  BarChart3,
  Flame,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface EmotionDashboardProps {
  userId?: string;
  className?: string;
}

type EmotionType =
  | 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation'
  | 'anxiety' | 'frustration' | 'contentment' | 'vulnerability';

type EmotionIntensity = 'minimal' | 'low' | 'moderate' | 'elevated' | 'intense';
type ShieldMode = 'analysis' | 'balanced' | 'surrender' | 'recovery';

interface EmotionEntry {
  id: string;
  timestamp: string;
  emotions: Record<EmotionType, number>;
  overallIntensity: EmotionIntensity;
  dominantEmotion: EmotionType;
  biofeedback?: {
    heartRateVariability?: number;
    heartRate?: number;
    stressLevel?: number;
    sleepQuality?: number;
    energyLevel?: number;
    source?: string;
  };
  context?: string;
  triggers?: string[];
  recommendedMode?: ShieldMode;
  currentMode?: ShieldMode;
  patternFlags?: string[];
}

interface DailyStats {
  avgIntensity: number;
  dominantEmotion: EmotionType;
  avgHrv: number;
  modeTime: Record<ShieldMode, number>;
  entriesCount: number;
}

// ============================================================================
// EMOTION DEFINITIONS
// ============================================================================

const EMOTIONS: Record<EmotionType, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  joy: { label: 'Joy', color: 'yellow', icon: '😊', description: 'Happiness, pleasure, satisfaction' },
  sadness: { label: 'Sadness', color: 'blue', icon: '😢', description: 'Grief, sorrow, melancholy' },
  anger: { label: 'Anger', color: 'red', icon: '😠', description: 'Frustration, irritation, rage' },
  fear: { label: 'Fear', color: 'purple', icon: '😨', description: 'Anxiety, worry, dread' },
  surprise: { label: 'Surprise', color: 'orange', icon: '😲', description: 'Astonishment, amazement' },
  disgust: { label: 'Disgust', color: 'green', icon: '🤢', description: 'Revulsion, distaste' },
  trust: { label: 'Trust', color: 'cyan', icon: '🤝', description: 'Acceptance, confidence' },
  anticipation: { label: 'Anticipation', color: 'pink', icon: '🤔', description: 'Interest, expectation' },
  anxiety: { label: 'Anxiety', color: 'purple', icon: '😰', description: 'Nervousness, unease' },
  frustration: { label: 'Frustration', color: 'orange', icon: '😤', description: 'Annoyance, impatience' },
  contentment: { label: 'Contentment', color: 'green', icon: '😌', description: 'Peace, satisfaction' },
  vulnerability: { label: 'Vulnerability', color: 'pink', icon: '💗', description: 'Openness, exposure' },
};

const SHIELD_MODES: Record<ShieldMode, {
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
  hrvThreshold: { min: number; max: number };
}> = {
  analysis: {
    label: 'Analysis Mode',
    color: 'cyan',
    icon: Brain,
    description: 'Deep pattern analysis active. High cognitive load.',
    hrvThreshold: { min: 60, max: 100 },
  },
  balanced: {
    label: 'Balanced Mode',
    color: 'green',
    icon: Target,
    description: 'Moderate analysis/surrender blend. Optimal state.',
    hrvThreshold: { min: 50, max: 70 },
  },
  surrender: {
    label: 'Surrender Mode',
    color: 'purple',
    icon: Heart,
    description: 'Trust-forward mode. Minimal analysis.',
    hrvThreshold: { min: 40, max: 60 },
  },
  recovery: {
    label: 'Recovery Mode',
    color: 'blue',
    icon: Moon,
    description: 'Post-stress recovery. Rest and restore.',
    hrvThreshold: { min: 0, max: 50 },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EmotionDashboard({ userId, className = '' }: EmotionDashboardProps) {
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<EmotionEntry> | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'log' | 'trends' | 'biofeedback'>('current');
  const [currentMode, setCurrentMode] = useState<ShieldMode>('balanced');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [hrvConnected, setHrvConnected] = useState(false);
  const [liveHrv, setLiveHrv] = useState<number | null>(null);

  // Simulated HRV data stream
  useEffect(() => {
    if (hrvConnected) {
      const interval = setInterval(() => {
        // Simulate HRV readings
        setLiveHrv(40 + Math.random() * 40);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [hrvConnected]);

  // Auto-recommend mode based on HRV
  useEffect(() => {
    if (liveHrv !== null) {
      if (liveHrv < 40) {
        setCurrentMode('recovery');
      } else if (liveHrv < 50) {
        setCurrentMode('surrender');
      } else if (liveHrv < 70) {
        setCurrentMode('balanced');
      } else {
        setCurrentMode('analysis');
      }
    }
  }, [liveHrv]);

  // Load mock data
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const now = Date.now();
    const mockEntries: EmotionEntry[] = [
      {
        id: '1',
        timestamp: new Date(now - 2 * 3600000).toISOString(),
        emotions: {
          joy: 6, sadness: 2, anger: 1, fear: 3, surprise: 2, disgust: 1,
          trust: 7, anticipation: 5, anxiety: 4, frustration: 2, contentment: 6, vulnerability: 5,
        },
        overallIntensity: 'moderate',
        dominantEmotion: 'trust',
        biofeedback: { heartRateVariability: 55, heartRate: 68, stressLevel: 35, source: 'apple_watch' },
        context: 'Morning check-in',
        recommendedMode: 'balanced',
        currentMode: 'balanced',
      },
      {
        id: '2',
        timestamp: new Date(now - 6 * 3600000).toISOString(),
        emotions: {
          joy: 4, sadness: 3, anger: 5, fear: 6, surprise: 3, disgust: 2,
          trust: 4, anticipation: 4, anxiety: 7, frustration: 5, contentment: 3, vulnerability: 6,
        },
        overallIntensity: 'elevated',
        dominantEmotion: 'anxiety',
        biofeedback: { heartRateVariability: 38, heartRate: 82, stressLevel: 65, source: 'apple_watch' },
        context: 'After difficult conversation',
        triggers: ['conflict', 'ambiguity'],
        recommendedMode: 'recovery',
        currentMode: 'analysis',
        patternFlags: ['hypervigilance_detected'],
      },
    ];
    setEntries(mockEntries);

    setDailyStats({
      avgIntensity: 5.5,
      dominantEmotion: 'trust',
      avgHrv: 48,
      modeTime: { analysis: 120, balanced: 180, surrender: 60, recovery: 30 },
      entriesCount: 5,
    });
  };

  const startNewEntry = () => {
    setCurrentEntry({
      emotions: {
        joy: 5, sadness: 5, anger: 5, fear: 5, surprise: 5, disgust: 5,
        trust: 5, anticipation: 5, anxiety: 5, frustration: 5, contentment: 5, vulnerability: 5,
      },
      context: '',
      triggers: [],
      currentMode,
    });
    setShowAddEntry(true);
  };

  const saveEntry = () => {
    if (!currentEntry?.emotions) return;

    // Calculate dominant emotion and intensity
    const emotions = currentEntry.emotions as Record<EmotionType, number>;
    const maxEmotion = Object.entries(emotions).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );
    const avgIntensity = Object.values(emotions).reduce((a, b) => a + b, 0) / Object.keys(emotions).length;

    const newEntry: EmotionEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      emotions,
      overallIntensity: avgIntensity <= 3 ? 'minimal' : avgIntensity <= 5 ? 'low' : avgIntensity <= 6 ? 'moderate' : avgIntensity <= 8 ? 'elevated' : 'intense',
      dominantEmotion: maxEmotion[0] as EmotionType,
      context: currentEntry.context,
      triggers: currentEntry.triggers,
      currentMode,
      recommendedMode: getRecommendedMode(avgIntensity, liveHrv),
      biofeedback: liveHrv ? {
        heartRateVariability: liveHrv,
        source: 'connected_device',
      } : undefined,
    };

    setEntries([newEntry, ...entries]);
    setCurrentEntry(null);
    setShowAddEntry(false);
  };

  const getRecommendedMode = (intensity: number, hrv: number | null): ShieldMode => {
    if (hrv !== null && hrv < 40) return 'recovery';
    if (intensity > 7) return 'recovery';
    if (hrv !== null && hrv < 50) return 'surrender';
    if (intensity > 5) return 'balanced';
    return 'analysis';
  };

  const getIntensityColor = (intensity: EmotionIntensity) => {
    switch (intensity) {
      case 'minimal': return 'text-gray-400';
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'elevated': return 'text-orange-400';
      case 'intense': return 'text-red-400';
    }
  };

  const getModeColor = (mode: ShieldMode) => {
    return `text-${SHIELD_MODES[mode].color}-400 bg-${SHIELD_MODES[mode].color}-500/10 border-${SHIELD_MODES[mode].color}-500/30`;
  };

  return (
    <div className={`emotion-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">
            EMOTION DASHBOARD
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Turn emotion from noise to signal. Real-time tracking with HRV integration.
        </p>

        {/* Current Mode Display */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <CurrentModeCard
            mode={currentMode}
            setMode={setCurrentMode}
            modeConfig={SHIELD_MODES}
          />
          <HrvCard
            connected={hrvConnected}
            setConnected={setHrvConnected}
            liveHrv={liveHrv}
          />
        </div>

        {/* Daily Stats */}
        {dailyStats && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Avg Intensity"
              value={dailyStats.avgIntensity.toFixed(1)}
            />
            <StatCard
              icon={<Heart className="w-5 h-5" />}
              label="Dominant"
              value={EMOTIONS[dailyStats.dominantEmotion].label}
            />
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Avg HRV"
              value={`${dailyStats.avgHrv} ms`}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Entries Today"
              value={dailyStats.entriesCount.toString()}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2 mb-6">
        {(['current', 'log', 'trends', 'biofeedback'] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'current' && 'Current State'}
            {tab === 'log' && 'Emotion Log'}
            {tab === 'trends' && 'Trends'}
            {tab === 'biofeedback' && 'Biofeedback'}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Current State */}
        {activeTab === 'current' && (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {showAddEntry && currentEntry ? (
              <EmotionInputForm
                entry={currentEntry}
                setEntry={setCurrentEntry}
                onSave={saveEntry}
                onCancel={() => {
                  setShowAddEntry(false);
                  setCurrentEntry(null);
                }}
                emotions={EMOTIONS}
              />
            ) : (
              <>
                {/* Quick Entry Button */}
                <button
                  onClick={startNewEntry}
                  className="w-full py-4 border border-dashed border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Log Current Emotion State
                </button>

                {/* Recent Entry */}
                {entries[0] && (
                  <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Most Recent</div>
                        <div className="text-xs text-gray-600">
                          {new Date(entries[0].timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getIntensityColor(entries[0].overallIntensity)} bg-current/10`}>
                        {entries[0].overallIntensity}
                      </span>
                    </div>

                    <EmotionWheel emotions={entries[0].emotions} definitions={EMOTIONS} />

                    {entries[0].patternFlags && entries[0].patternFlags.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                          <AlertCircle className="w-4 h-4" />
                          Pattern Detected
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {entries[0].patternFlags.map(f => f.replace(/_/g, ' ')).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Recommendations */}
                <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Shield Mode Optimizer</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(SHIELD_MODES) as [ShieldMode, typeof SHIELD_MODES[ShieldMode]][]).map(([mode, config]) => {
                      const Icon = config.icon;
                      const isActive = currentMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setCurrentMode(mode)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            isActive
                              ? `bg-${config.color}-500/20 border-${config.color}-500/50 text-${config.color}-400`
                              : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{config.label}</span>
                          </div>
                          <div className="text-xs opacity-70">{config.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Emotion Log */}
        {activeTab === 'log' && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {entries.map(entry => (
              <EmotionLogEntry
                key={entry.id}
                entry={entry}
                emotions={EMOTIONS}
                getIntensityColor={getIntensityColor}
              />
            ))}
            {entries.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No emotion entries yet. Start logging to see your history.
              </div>
            )}
          </motion.div>
        )}

        {/* Trends */}
        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <TrendsView entries={entries} emotions={EMOTIONS} />
          </motion.div>
        )}

        {/* Biofeedback */}
        {activeTab === 'biofeedback' && (
          <motion.div
            key="biofeedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <BiofeedbackView
              connected={hrvConnected}
              setConnected={setHrvConnected}
              liveHrv={liveHrv}
              entries={entries}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-lg">
      <div className="flex items-center gap-2 text-cyan-400 mb-1">{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function CurrentModeCard({
  mode,
  setMode,
  modeConfig,
}: {
  mode: ShieldMode;
  setMode: (m: ShieldMode) => void;
  modeConfig: typeof SHIELD_MODES;
}) {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border bg-${config.color}-500/10 border-${config.color}-500/30`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full bg-${config.color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${config.color}-400`} />
        </div>
        <div>
          <div className={`font-medium text-${config.color}-400`}>{config.label}</div>
          <div className="text-xs text-gray-500">Current Mode</div>
        </div>
      </div>
      <div className="text-xs text-gray-400">{config.description}</div>
    </div>
  );
}

function HrvCard({
  connected,
  setConnected,
  liveHrv,
}: {
  connected: boolean;
  setConnected: (c: boolean) => void;
  liveHrv: number | null;
}) {
  return (
    <div className={`p-4 rounded-lg border ${connected ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/30 border-gray-700/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Watch className={`w-5 h-5 ${connected ? 'text-green-400' : 'text-gray-500'}`} />
          <span className="font-medium text-white">HRV Monitor</span>
        </div>
        <button
          onClick={() => setConnected(!connected)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            connected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-700/50 text-gray-400 hover:text-white'
          }`}
        >
          {connected ? 'Connected' : 'Connect'}
        </button>
      </div>
      {connected && liveHrv !== null && (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-400">{liveHrv.toFixed(0)}</span>
          <span className="text-sm text-gray-500">ms</span>
          <Activity className="w-4 h-4 text-green-400 animate-pulse ml-2" />
        </div>
      )}
      {!connected && (
        <div className="text-xs text-gray-500">
          Connect wearable for auto mode switching
        </div>
      )}
    </div>
  );
}

function EmotionWheel({
  emotions,
  definitions,
}: {
  emotions: Record<EmotionType, number>;
  definitions: typeof EMOTIONS;
}) {
  const primaryEmotions: EmotionType[] = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'];

  return (
    <div className="grid grid-cols-4 gap-2">
      {primaryEmotions.map(emotion => {
        const def = definitions[emotion];
        const value = emotions[emotion];
        return (
          <div
            key={emotion}
            className={`p-2 rounded-lg text-center bg-${def.color}-500/10 border border-${def.color}-500/20`}
          >
            <div className="text-xl mb-1">{def.icon}</div>
            <div className="text-xs text-gray-400">{def.label}</div>
            <div className={`text-sm font-bold text-${def.color}-400`}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmotionInputForm({
  entry,
  setEntry,
  onSave,
  onCancel,
  emotions,
}: {
  entry: Partial<EmotionEntry>;
  setEntry: (e: Partial<EmotionEntry> | null) => void;
  onSave: () => void;
  onCancel: () => void;
  emotions: typeof EMOTIONS;
}) {
  const updateEmotion = (type: EmotionType, value: number) => {
    setEntry({
      ...entry,
      emotions: { ...(entry.emotions as Record<EmotionType, number>), [type]: value },
    });
  };

  const primaryEmotions: EmotionType[] = ['joy', 'sadness', 'anger', 'fear', 'trust', 'anxiety', 'contentment', 'vulnerability'];

  return (
    <div className="p-4 bg-gray-800/30 border border-cyan-500/30 rounded-lg space-y-4">
      <h4 className="font-medium text-white">Log Emotion State</h4>

      {/* Emotion Sliders */}
      <div className="space-y-3">
        {primaryEmotions.map(type => {
          const def = emotions[type];
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="w-6 text-center">{def.icon}</span>
              <span className="w-24 text-sm text-gray-400">{def.label}</span>
              <input
                type="range"
                min="0"
                max="10"
                value={(entry.emotions as Record<EmotionType, number>)?.[type] || 5}
                onChange={(e) => updateEmotion(type, parseInt(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-8 text-sm text-gray-500 text-right">
                {(entry.emotions as Record<EmotionType, number>)?.[type] || 5}
              </span>
            </div>
          );
        })}
      </div>

      {/* Context */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Context (optional)</label>
        <input
          type="text"
          value={entry.context || ''}
          onChange={(e) => setEntry({ ...entry, context: e.target.value })}
          placeholder="What's happening right now?"
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Common Triggers */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Triggers</label>
        <div className="flex flex-wrap gap-2">
          {['conflict', 'ambiguity', 'deadline', 'social', 'physical', 'memory'].map(trigger => (
            <button
              key={trigger}
              onClick={() => {
                const current = entry.triggers || [];
                setEntry({
                  ...entry,
                  triggers: current.includes(trigger)
                    ? current.filter(t => t !== trigger)
                    : [...current, trigger],
                });
              }}
              className={`px-3 py-1 text-xs rounded border transition-colors capitalize ${
                entry.triggers?.includes(trigger)
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
              }`}
            >
              {trigger}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm"
        >
          Save Entry
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-400 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmotionLogEntry({
  entry,
  emotions,
  getIntensityColor,
}: {
  entry: EmotionEntry;
  emotions: typeof EMOTIONS;
  getIntensityColor: (i: EmotionIntensity) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg cursor-pointer hover:border-gray-600/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emotions[entry.dominantEmotion].icon}</span>
          <div>
            <div className="font-medium text-white">{emotions[entry.dominantEmotion].label}</div>
            <div className="text-xs text-gray-500">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entry.biofeedback?.heartRateVariability && (
            <span className="text-sm text-gray-400">
              HRV: {entry.biofeedback.heartRateVariability.toFixed(0)}
            </span>
          )}
          <span className={`px-2 py-0.5 text-xs rounded ${getIntensityColor(entry.overallIntensity)} bg-current/10`}>
            {entry.overallIntensity}
          </span>
        </div>
      </div>

      {entry.context && (
        <div className="text-sm text-gray-400 mb-2">{entry.context}</div>
      )}

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-700/50"
        >
          <EmotionWheel emotions={entry.emotions} definitions={emotions} />
          {entry.triggers && entry.triggers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {entry.triggers.map(t => (
                <span key={t} className="px-2 py-0.5 text-xs bg-gray-700/50 rounded text-gray-400 capitalize">
                  {t}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function TrendsView({
  entries,
  emotions,
}: {
  entries: EmotionEntry[];
  emotions: typeof EMOTIONS;
}) {
  // Calculate trends from entries
  const emotionCounts: Record<string, number> = {};
  entries.forEach(e => {
    emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
  });

  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Dominant Emotions (Last 7 Days)</h4>
        <div className="space-y-3">
          {sorted.slice(0, 5).map(([emotion, count]) => {
            const def = emotions[emotion as EmotionType];
            const percentage = (count / entries.length) * 100;
            return (
              <div key={emotion} className="flex items-center gap-3">
                <span className="text-xl">{def.icon}</span>
                <span className="w-24 text-sm text-gray-400">{def.label}</span>
                <div className="flex-1 h-4 bg-gray-900/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full bg-${def.color}-500/50 rounded-full`}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
          <h4 className="font-medium text-white mb-2">Intensity Trend</h4>
          <div className="flex items-center gap-2 text-green-400">
            <TrendingDown className="w-5 h-5" />
            <span className="text-2xl font-bold">-12%</span>
          </div>
          <div className="text-xs text-gray-500">vs. last week</div>
        </div>
        <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
          <h4 className="font-medium text-white mb-2">HRV Trend</h4>
          <div className="flex items-center gap-2 text-green-400">
            <TrendingUp className="w-5 h-5" />
            <span className="text-2xl font-bold">+8%</span>
          </div>
          <div className="text-xs text-gray-500">vs. last week</div>
        </div>
      </div>
    </div>
  );
}

function BiofeedbackView({
  connected,
  setConnected,
  liveHrv,
  entries,
}: {
  connected: boolean;
  setConnected: (c: boolean) => void;
  liveHrv: number | null;
  entries: EmotionEntry[];
}) {
  const recentHrvEntries = entries.filter(e => e.biofeedback?.heartRateVariability);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-6 rounded-lg border ${connected ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/30 border-gray-700/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Watch className={`w-8 h-8 ${connected ? 'text-green-400' : 'text-gray-500'}`} />
            <div>
              <h4 className="font-medium text-white">Wearable Connection</h4>
              <div className="text-xs text-gray-500">
                {connected ? 'Receiving live data' : 'No device connected'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              connected
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {connected ? 'Disconnect' : 'Connect Device'}
          </button>
        </div>

        {connected && liveHrv !== null && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">{liveHrv.toFixed(0)}</div>
              <div className="text-xs text-gray-500">HRV (ms)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400">{(65 + Math.random() * 10).toFixed(0)}</div>
              <div className="text-xs text-gray-500">Heart Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">{(30 + Math.random() * 30).toFixed(0)}</div>
              <div className="text-xs text-gray-500">Stress Level</div>
            </div>
          </div>
        )}

        {!connected && (
          <div className="text-center py-4">
            <div className="flex justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Watch className="w-5 h-5" />
                <span>Apple Watch</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Smartphone className="w-5 h-5" />
                <span>Oura Ring</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Activity className="w-5 h-5" />
                <span>Fitbit</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Connect a wearable device to enable automatic shield mode switching based on HRV
            </p>
          </div>
        )}
      </div>

      {/* HRV History */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">HRV History</h4>
        <div className="space-y-3">
          {recentHrvEntries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
              <div className="text-sm text-gray-400">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-lg font-bold ${
                  (entry.biofeedback?.heartRateVariability || 0) >= 60 ? 'text-green-400' :
                  (entry.biofeedback?.heartRateVariability || 0) >= 45 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {entry.biofeedback?.heartRateVariability?.toFixed(0)} ms
                </span>
                {entry.biofeedback?.source && (
                  <span className="text-xs text-gray-500 capitalize">
                    {entry.biofeedback.source.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
          {recentHrvEntries.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No HRV data recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Auto-Toggle Info */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h4 className="font-medium text-purple-400 mb-2">Auto Shield Mode Toggle</h4>
        <p className="text-sm text-gray-400 mb-3">
          When HRV drops below thresholds, the system automatically suggests mode changes:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">HRV &gt; 60ms</span>
            <span className="text-cyan-400">Analysis Mode</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">HRV 50-60ms</span>
            <span className="text-green-400">Balanced Mode</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">HRV 40-50ms</span>
            <span className="text-purple-400">Surrender Mode</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">HRV &lt; 40ms</span>
            <span className="text-blue-400">Recovery Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmotionDashboard;
