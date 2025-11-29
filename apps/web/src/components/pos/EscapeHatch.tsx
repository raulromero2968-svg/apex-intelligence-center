/**
 * Reactivity Escape Hatch Component
 *
 * For high-impatience profiles, pre-scripted phrases prevent escalation.
 * A/B testing tracks outcomes to evolve optimal scripts.
 *
 * Features:
 * - Pre-scripted escape phrases
 * - Variant A/B testing with outcome tracking
 * - Quick-access during emotional overload
 * - Effectiveness metrics
 * - Customizable scripts
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  MessageSquare,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  Target,
  BarChart3,
  ChevronRight,
  Volume2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface EscapeHatchProps {
  userId?: string;
  className?: string;
}

interface EscapePhrase {
  id: string;
  name: string;
  phrase: string;
  context: string;
  variants: Array<{
    variant: string;
    phrase: string;
    usageCount: number;
    successRate: number;
  }>;
  activeVariant: string;
  usageCount: number;
  successCount: number;
  avgEscalationPrevention: number;
  avgTimeToCalm: number;
  isActive: boolean;
}

interface UsageLog {
  id: string;
  phraseId: string;
  phraseName: string;
  variantUsed: string;
  usedAt: string;
  situation?: string;
  triggerEmotion?: string;
  triggerIntensity?: number;
  preventedEscalation?: boolean;
  timeToCalm?: number;
  effectivenessRating?: number;
}

// ============================================================================
// DEFAULT PHRASES
// ============================================================================

const DEFAULT_PHRASES: Omit<EscapePhrase, 'id'>[] = [
  {
    name: 'Buffer Request',
    phrase: 'I need a 5-minute buffer to process this.',
    context: 'When feeling overwhelmed in conversation',
    variants: [
      { variant: 'A', phrase: 'I need a 5-minute buffer to process this.', usageCount: 12, successRate: 0.83 },
      { variant: 'B', phrase: 'Give me 5 minutes - I want to respond thoughtfully.', usageCount: 8, successRate: 0.75 },
    ],
    activeVariant: 'A',
    usageCount: 20,
    successCount: 16,
    avgEscalationPrevention: 0.8,
    avgTimeToCalm: 180,
    isActive: true,
  },
  {
    name: 'Pattern Flag',
    phrase: "I'm noticing my pattern firewall activating. Can we pause?",
    context: 'When detecting defensive patterns',
    variants: [
      { variant: 'A', phrase: "I'm noticing my pattern firewall activating. Can we pause?", usageCount: 5, successRate: 0.8 },
      { variant: 'B', phrase: 'My brain is doing the thing. I need a moment.', usageCount: 7, successRate: 0.86 },
    ],
    activeVariant: 'B',
    usageCount: 12,
    successCount: 10,
    avgEscalationPrevention: 0.83,
    avgTimeToCalm: 120,
    isActive: true,
  },
  {
    name: 'Overwhelm Signal',
    phrase: "I'm feeling flooded. Can we continue this in an hour?",
    context: 'During intense emotional moments',
    variants: [
      { variant: 'A', phrase: "I'm feeling flooded. Can we continue this in an hour?", usageCount: 3, successRate: 0.67 },
    ],
    activeVariant: 'A',
    usageCount: 3,
    successCount: 2,
    avgEscalationPrevention: 0.67,
    avgTimeToCalm: 3600,
    isActive: true,
  },
  {
    name: 'Clarification Request',
    phrase: "I want to understand correctly. Can you say that another way?",
    context: 'When unsure of intent',
    variants: [
      { variant: 'A', phrase: "I want to understand correctly. Can you say that another way?", usageCount: 15, successRate: 0.93 },
      { variant: 'B', phrase: "Help me understand - what do you mean by that?", usageCount: 10, successRate: 0.9 },
    ],
    activeVariant: 'A',
    usageCount: 25,
    successCount: 23,
    avgEscalationPrevention: 0.92,
    avgTimeToCalm: 60,
    isActive: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function EscapeHatch({ userId, className = '' }: EscapeHatchProps) {
  const [phrases, setPhrases] = useState<EscapePhrase[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'manage' | 'analytics'>('quick');
  const [selectedPhrase, setSelectedPhrase] = useState<EscapePhrase | null>(null);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Usage form state
  const [usageEmotion, setUsageEmotion] = useState('');
  const [usageIntensity, setUsageIntensity] = useState(5);
  const [usageSituation, setUsageSituation] = useState('');
  const [usagePrevented, setUsagePrevented] = useState<boolean | null>(null);
  const [usageRating, setUsageRating] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPhrases(DEFAULT_PHRASES.map((p, i) => ({ ...p, id: i.toString() })));
    setUsageLogs([
      {
        id: '1',
        phraseId: '0',
        phraseName: 'Buffer Request',
        variantUsed: 'A',
        usedAt: new Date(Date.now() - 86400000).toISOString(),
        situation: 'Heated discussion about plans',
        triggerEmotion: 'frustration',
        triggerIntensity: 7,
        preventedEscalation: true,
        timeToCalm: 300,
        effectivenessRating: 8,
      },
      {
        id: '2',
        phraseId: '3',
        phraseName: 'Clarification Request',
        variantUsed: 'A',
        usedAt: new Date(Date.now() - 172800000).toISOString(),
        situation: 'Ambiguous feedback at work',
        triggerEmotion: 'anxiety',
        triggerIntensity: 6,
        preventedEscalation: true,
        timeToCalm: 60,
        effectivenessRating: 9,
      },
    ]);
  };

  const copyPhrase = async (phrase: EscapePhrase) => {
    const text = phrase.variants.find(v => v.variant === phrase.activeVariant)?.phrase || phrase.phrase;
    await navigator.clipboard.writeText(text);
    setCopiedId(phrase.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const usePhrase = (phrase: EscapePhrase) => {
    setSelectedPhrase(phrase);
    setShowUsageForm(true);
  };

  const submitUsage = () => {
    if (!selectedPhrase) return;

    const log: UsageLog = {
      id: Date.now().toString(),
      phraseId: selectedPhrase.id,
      phraseName: selectedPhrase.name,
      variantUsed: selectedPhrase.activeVariant,
      usedAt: new Date().toISOString(),
      situation: usageSituation,
      triggerEmotion: usageEmotion,
      triggerIntensity: usageIntensity,
      preventedEscalation: usagePrevented ?? undefined,
      effectivenessRating: usageRating,
    };

    setUsageLogs([log, ...usageLogs]);

    // Update phrase stats
    setPhrases(phrases.map(p => {
      if (p.id === selectedPhrase.id) {
        const variant = p.variants.find(v => v.variant === p.activeVariant);
        if (variant) {
          variant.usageCount++;
          if (usagePrevented) variant.successRate = (variant.successRate * (variant.usageCount - 1) + 1) / variant.usageCount;
        }
        return {
          ...p,
          usageCount: p.usageCount + 1,
          successCount: usagePrevented ? p.successCount + 1 : p.successCount,
        };
      }
      return p;
    }));

    // Reset form
    setSelectedPhrase(null);
    setShowUsageForm(false);
    setUsageEmotion('');
    setUsageIntensity(5);
    setUsageSituation('');
    setUsagePrevented(null);
    setUsageRating(5);
  };

  const switchVariant = (phrase: EscapePhrase, variant: string) => {
    setPhrases(phrases.map(p =>
      p.id === phrase.id ? { ...p, activeVariant: variant } : p
    ));
  };

  return (
    <div className={`escape-hatch ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">
            REACTIVITY ESCAPE HATCH
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Pre-scripted phrases to prevent escalation. A/B tested for effectiveness.
        </p>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Total Uses"
            value={phrases.reduce((a, p) => a + p.usageCount, 0).toString()}
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Success Rate"
            value={`${((phrases.reduce((a, p) => a + p.successCount, 0) / phrases.reduce((a, p) => a + p.usageCount, 0)) * 100 || 0).toFixed(0)}%`}
            highlight
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Calm Time"
            value={`${Math.round(phrases.reduce((a, p) => a + p.avgTimeToCalm, 0) / phrases.length / 60)}m`}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2 mb-6">
        {(['quick', 'manage', 'analytics'] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'quick' && 'Quick Access'}
            {tab === 'manage' && 'Manage Scripts'}
            {tab === 'analytics' && 'Analytics'}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Quick Access */}
        {activeTab === 'quick' && (
          <motion.div
            key="quick"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" />
              <div>
                <div className="font-medium text-yellow-400">Feeling Reactive?</div>
                <div className="text-sm text-gray-400">
                  Use one of these pre-tested phrases to create space.
                </div>
              </div>
            </div>

            {phrases.filter(p => p.isActive).map(phrase => (
              <QuickPhraseCard
                key={phrase.id}
                phrase={phrase}
                onCopy={() => copyPhrase(phrase)}
                onUse={() => usePhrase(phrase)}
                copied={copiedId === phrase.id}
              />
            ))}
          </motion.div>
        )}

        {/* Manage Scripts */}
        {activeTab === 'manage' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {phrases.map(phrase => (
              <ManagePhraseCard
                key={phrase.id}
                phrase={phrase}
                onSwitchVariant={(v) => switchVariant(phrase, v)}
                onToggleActive={() => {
                  setPhrases(phrases.map(p =>
                    p.id === phrase.id ? { ...p, isActive: !p.isActive } : p
                  ));
                }}
              />
            ))}

            {showAddForm ? (
              <AddPhraseForm
                onSave={(newPhrase) => {
                  setPhrases([...phrases, { ...newPhrase, id: Date.now().toString() }]);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border border-dashed border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Custom Escape Phrase
              </button>
            )}
          </motion.div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <AnalyticsView phrases={phrases} usageLogs={usageLogs} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Form Modal */}
      {showUsageForm && selectedPhrase && (
        <UsageFormModal
          phrase={selectedPhrase}
          emotion={usageEmotion}
          setEmotion={setUsageEmotion}
          intensity={usageIntensity}
          setIntensity={setUsageIntensity}
          situation={usageSituation}
          setSituation={setUsageSituation}
          prevented={usagePrevented}
          setPrevented={setUsagePrevented}
          rating={usageRating}
          setRating={setUsageRating}
          onSubmit={submitUsage}
          onClose={() => {
            setShowUsageForm(false);
            setSelectedPhrase(null);
          }}
        />
      )}
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
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/30 border-gray-700/30'}`}>
      <div className={`flex items-center gap-2 mb-1 ${highlight ? 'text-green-400' : 'text-cyan-400'}`}>
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function QuickPhraseCard({
  phrase,
  onCopy,
  onUse,
  copied,
}: {
  phrase: EscapePhrase;
  onCopy: () => void;
  onUse: () => void;
  copied: boolean;
}) {
  const activePhrase = phrase.variants.find(v => v.variant === phrase.activeVariant)?.phrase || phrase.phrase;

  return (
    <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:border-cyan-500/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-white">{phrase.name}</h4>
          <div className="text-xs text-gray-500">{phrase.context}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded ${
            phrase.avgEscalationPrevention >= 0.8 ? 'bg-green-500/20 text-green-400' :
            phrase.avgEscalationPrevention >= 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {(phrase.avgEscalationPrevention * 100).toFixed(0)}% effective
          </span>
        </div>
      </div>

      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
          <p className="text-cyan-400 font-medium">&quot;{activePhrase}&quot;</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded text-gray-400 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={onUse}
          className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Use & Log
        </button>
      </div>
    </div>
  );
}

function ManagePhraseCard({
  phrase,
  onSwitchVariant,
  onToggleActive,
}: {
  phrase: EscapePhrase;
  onSwitchVariant: (v: string) => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`p-4 rounded-lg border ${phrase.isActive ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-900/50 border-gray-800/50 opacity-50'}`}>
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h4 className="font-medium text-white">{phrase.name}</h4>
          <div className="text-xs text-gray-500">{phrase.context}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              phrase.isActive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-700/50 text-gray-500'
            }`}
          >
            {phrase.isActive ? 'Active' : 'Inactive'}
          </button>
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-700/50"
        >
          <h5 className="text-sm text-gray-400 mb-3">A/B Variants</h5>
          <div className="space-y-2">
            {phrase.variants.map(variant => (
              <div
                key={variant.variant}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  phrase.activeVariant === variant.variant
                    ? 'bg-cyan-500/10 border-cyan-500/50'
                    : 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600'
                }`}
                onClick={() => onSwitchVariant(variant.variant)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-gray-400">Variant {variant.variant}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{variant.usageCount} uses</span>
                    <span className={variant.successRate >= 0.8 ? 'text-green-400' : 'text-yellow-400'}>
                      {(variant.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">&quot;{variant.phrase}&quot;</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <BarChart3 className="w-4 h-4" />
            Total: {phrase.usageCount} uses, {(phrase.avgEscalationPrevention * 100).toFixed(0)}% prevention rate
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AddPhraseForm({
  onSave,
  onCancel,
}: {
  onSave: (phrase: Omit<EscapePhrase, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phrase, setPhrase] = useState('');
  const [context, setContext] = useState('');

  const handleSave = () => {
    if (!name || !phrase) return;
    onSave({
      name,
      phrase,
      context,
      variants: [{ variant: 'A', phrase, usageCount: 0, successRate: 0 }],
      activeVariant: 'A',
      usageCount: 0,
      successCount: 0,
      avgEscalationPrevention: 0,
      avgTimeToCalm: 0,
      isActive: true,
    });
  };

  return (
    <div className="p-4 bg-gray-800/30 border border-cyan-500/30 rounded-lg space-y-4">
      <h4 className="font-medium text-white">New Escape Phrase</h4>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Time Out Request"
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Phrase</label>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="e.g., I need a moment to collect my thoughts."
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Context (when to use)</label>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., When feeling defensive"
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name || !phrase}
          className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm disabled:opacity-50"
        >
          Save Phrase
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

function UsageFormModal({
  phrase,
  emotion,
  setEmotion,
  intensity,
  setIntensity,
  situation,
  setSituation,
  prevented,
  setPrevented,
  rating,
  setRating,
  onSubmit,
  onClose,
}: {
  phrase: EscapePhrase;
  emotion: string;
  setEmotion: (e: string) => void;
  intensity: number;
  setIntensity: (i: number) => void;
  situation: string;
  setSituation: (s: string) => void;
  prevented: boolean | null;
  setPrevented: (p: boolean | null) => void;
  rating: number;
  setRating: (r: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-cyan-500/30 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-white">Log Usage: {phrase.name}</h3>

          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-cyan-400">&quot;{phrase.variants.find(v => v.variant === phrase.activeVariant)?.phrase}&quot;</p>
          </div>

          {/* Trigger Emotion */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">What triggered this?</label>
            <div className="flex flex-wrap gap-2">
              {['frustration', 'anxiety', 'anger', 'overwhelm', 'confusion', 'fear'].map(e => (
                <button
                  key={e}
                  onClick={() => setEmotion(e)}
                  className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${
                    emotion === e
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Trigger Intensity</span>
              <span className="text-cyan-400">{intensity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Situation */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Situation (optional)</label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Brief context..."
              className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Prevented Escalation */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Did it prevent escalation?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPrevented(true)}
                className={`flex-1 py-2 rounded border transition-colors ${
                  prevented === true
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setPrevented(false)}
                className={`flex-1 py-2 rounded border transition-colors ${
                  prevented === false
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Effectiveness Rating */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Overall Effectiveness</span>
              <span className="text-cyan-400">{rating}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSubmit}
              className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium transition-colors"
            >
              Log Usage
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AnalyticsView({
  phrases,
  usageLogs,
}: {
  phrases: EscapePhrase[];
  usageLogs: UsageLog[];
}) {
  const mostEffective = [...phrases].sort((a, b) => b.avgEscalationPrevention - a.avgEscalationPrevention)[0];
  const mostUsed = [...phrases].sort((a, b) => b.usageCount - a.usageCount)[0];

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Most Effective</div>
          <div className="font-medium text-white">{mostEffective?.name}</div>
          <div className="text-2xl font-bold text-green-400">
            {((mostEffective?.avgEscalationPrevention || 0) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Most Used</div>
          <div className="font-medium text-white">{mostUsed?.name}</div>
          <div className="text-2xl font-bold text-cyan-400">
            {mostUsed?.usageCount || 0} times
          </div>
        </div>
      </div>

      {/* Phrase Performance */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Phrase Performance</h4>
        <div className="space-y-3">
          {phrases.map(phrase => (
            <div key={phrase.id} className="flex items-center gap-3">
              <span className="w-32 text-sm text-gray-400 truncate">{phrase.name}</span>
              <div className="flex-1 h-4 bg-gray-900/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    phrase.avgEscalationPrevention >= 0.8 ? 'bg-green-500/50' :
                    phrase.avgEscalationPrevention >= 0.6 ? 'bg-yellow-500/50' : 'bg-red-500/50'
                  }`}
                  style={{ width: `${phrase.avgEscalationPrevention * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-12 text-right">
                {(phrase.avgEscalationPrevention * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Usage */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Recent Usage</h4>
        <div className="space-y-2">
          {usageLogs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
              <div>
                <div className="text-sm text-white">{log.phraseName}</div>
                <div className="text-xs text-gray-500">
                  {new Date(log.usedAt).toLocaleDateString()} - {log.triggerEmotion}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {log.preventedEscalation && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    Prevented
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  {log.effectivenessRating}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
        <h4 className="font-medium text-purple-400 mb-2">Insight</h4>
        <p className="text-sm text-gray-400">
          Your &quot;Clarification Request&quot; phrase has the highest success rate. Consider using it more
          often when you sense ambiguity before escalation begins.
        </p>
      </div>
    </div>
  );
}

export default EscapeHatch;
