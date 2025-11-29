/**
 * Bias Calibration Protocol Component
 *
 * Your literal wiring excels at fidelity but can amplify confirmation bias.
 * This implements a "Model Audit" heuristic to reduce apophenia false positives.
 *
 * Features:
 * - Weekly pattern audits with inter-rater reliability
 * - Third-party review integration (therapist, peer, coach)
 * - Confidence calibration tracking
 * - Apophenia detection and correction
 * - Domain-specific auditing (work, relationships, self)
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Brain,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  Lightbulb,
  Scale,
  Clock,
  Plus,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface BiasCalibrationProps {
  userId?: string;
  className?: string;
}

type AuditDomain = 'work' | 'relationship' | 'self' | 'general';
type AuditStatus = 'pending' | 'reviewed' | 'validated' | 'rejected';
type ReviewerType = 'therapist' | 'trusted_peer' | 'coach' | 'self';

interface ModelAudit {
  id: string;
  auditDate: string;
  auditType: 'weekly' | 'triggered' | 'quarterly';
  domain: AuditDomain;
  patternDescription: string;
  patternSource?: string;
  patternFirstNoticed?: string;
  selfConfidence: number;
  selfRationale?: string;
  potentialBiases: string[];
  reviewerType?: ReviewerType;
  reviewerRating?: number;
  reviewerNotes?: string;
  interRaterReliability?: number;
  isApophenia?: boolean;
  isValidPattern?: boolean;
  adjustmentMade?: string;
  preAuditConfidence: number;
  postAuditConfidence?: number;
  status: AuditStatus;
}

interface CalibrationMetrics {
  totalAudits: number;
  apopheniaDetected: number;
  validPatterns: number;
  avgInterRaterReliability: number;
  confidenceAccuracy: number;
  weeklyStreakCount: number;
}

// ============================================================================
// BIAS TYPES
// ============================================================================

const COMMON_BIASES = [
  { id: 'confirmation', name: 'Confirmation Bias', description: 'Seeking info that confirms existing beliefs' },
  { id: 'availability', name: 'Availability Heuristic', description: 'Overweighting recent or memorable events' },
  { id: 'anchoring', name: 'Anchoring', description: 'Over-relying on first piece of information' },
  { id: 'projection', name: 'Projection', description: 'Assuming others share your thoughts/feelings' },
  { id: 'negativity', name: 'Negativity Bias', description: 'Giving more weight to negative information' },
  { id: 'pattern_matching', name: 'Pattern Matching', description: 'Seeing patterns that may not exist' },
  { id: 'catastrophizing', name: 'Catastrophizing', description: 'Assuming worst-case scenarios' },
  { id: 'mind_reading', name: 'Mind Reading', description: 'Assuming you know what others think' },
];

const DOMAIN_COLORS: Record<AuditDomain, string> = {
  work: 'cyan',
  relationship: 'pink',
  self: 'purple',
  general: 'gray',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BiasCalibration({ userId, className = '' }: BiasCalibrationProps) {
  const [audits, setAudits] = useState<ModelAudit[]>([]);
  const [metrics, setMetrics] = useState<CalibrationMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'history' | 'insights'>('overview');
  const [currentAudit, setCurrentAudit] = useState<Partial<ModelAudit> | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<ModelAudit | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockAudits: ModelAudit[] = [
      {
        id: '1',
        auditDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        auditType: 'weekly',
        domain: 'relationship',
        patternDescription: 'I notice I interpret playful teasing as criticism',
        patternSource: 'Conversation with partner',
        selfConfidence: 0.7,
        selfRationale: 'This happens repeatedly when tired',
        potentialBiases: ['negativity', 'projection'],
        reviewerType: 'therapist',
        reviewerRating: 0.6,
        reviewerNotes: 'Pattern exists but may be exaggerated. Fatigue is a key factor.',
        interRaterReliability: 0.75,
        isApophenia: false,
        isValidPattern: true,
        adjustmentMade: 'Check fatigue level before interpreting tone',
        preAuditConfidence: 0.7,
        postAuditConfidence: 0.55,
        status: 'validated',
      },
      {
        id: '2',
        auditDate: new Date(Date.now() - 14 * 86400000).toISOString(),
        auditType: 'weekly',
        domain: 'work',
        patternDescription: 'Colleagues seem to exclude me from decisions',
        patternSource: 'Team meetings',
        selfConfidence: 0.8,
        selfRationale: 'Not invited to 3 meetings this month',
        potentialBiases: ['confirmation', 'negativity'],
        reviewerType: 'trusted_peer',
        reviewerRating: 0.3,
        reviewerNotes: 'Meetings were role-specific, not exclusionary',
        interRaterReliability: 0.45,
        isApophenia: true,
        isValidPattern: false,
        adjustmentMade: 'Query intent directly before assuming exclusion',
        preAuditConfidence: 0.8,
        postAuditConfidence: 0.35,
        status: 'rejected',
      },
      {
        id: '3',
        auditDate: new Date().toISOString(),
        auditType: 'weekly',
        domain: 'self',
        patternDescription: 'My analytical approach is causing relationship distance',
        selfConfidence: 0.6,
        potentialBiases: ['catastrophizing', 'mind_reading'],
        preAuditConfidence: 0.6,
        status: 'pending',
      },
    ];
    setAudits(mockAudits);

    setMetrics({
      totalAudits: 15,
      apopheniaDetected: 4,
      validPatterns: 9,
      avgInterRaterReliability: 0.68,
      confidenceAccuracy: 0.72,
      weeklyStreakCount: 6,
    });
  };

  const startNewAudit = () => {
    setCurrentAudit({
      auditType: 'weekly',
      domain: 'general',
      patternDescription: '',
      selfConfidence: 0.5,
      potentialBiases: [],
      preAuditConfidence: 0.5,
      status: 'pending',
    });
    setActiveTab('create');
  };

  const saveAudit = () => {
    if (!currentAudit?.patternDescription) return;

    const newAudit: ModelAudit = {
      id: Date.now().toString(),
      auditDate: new Date().toISOString(),
      auditType: currentAudit.auditType || 'weekly',
      domain: currentAudit.domain || 'general',
      patternDescription: currentAudit.patternDescription,
      patternSource: currentAudit.patternSource,
      selfConfidence: currentAudit.selfConfidence || 0.5,
      selfRationale: currentAudit.selfRationale,
      potentialBiases: currentAudit.potentialBiases || [],
      preAuditConfidence: currentAudit.selfConfidence || 0.5,
      status: 'pending',
    };

    setAudits([newAudit, ...audits]);
    setCurrentAudit(null);
    setActiveTab('history');
  };

  const submitReview = (audit: ModelAudit, reviewData: Partial<ModelAudit>) => {
    const updated = audits.map(a => {
      if (a.id === audit.id) {
        const interRater = reviewData.reviewerRating !== undefined
          ? (audit.selfConfidence + reviewData.reviewerRating) / 2
          : undefined;

        return {
          ...a,
          ...reviewData,
          interRaterReliability: interRater,
          isApophenia: interRater !== undefined && interRater < 0.5,
          isValidPattern: interRater !== undefined && interRater >= 0.5,
          status: 'validated' as AuditStatus,
        };
      }
      return a;
    });
    setAudits(updated);
    setShowReview(false);
    setSelectedAudit(null);
  };

  const getDomainColor = (domain: AuditDomain) => {
    const color = DOMAIN_COLORS[domain];
    return `text-${color}-400 bg-${color}-500/10 border-${color}-500/30`;
  };

  return (
    <div className={`bias-calibration ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">
            BIAS CALIBRATION PROTOCOL
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Reduce apophenia false positives. Compute inter-rater reliability on observed patterns.
        </p>

        {/* Metrics */}
        {metrics && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <MetricCard
              icon={<Target className="w-5 h-5" />}
              label="Audits"
              value={metrics.totalAudits.toString()}
              subValue={`${metrics.validPatterns} valid`}
            />
            <MetricCard
              icon={<Eye className="w-5 h-5" />}
              label="Apophenia Found"
              value={metrics.apopheniaDetected.toString()}
              subValue={`${((metrics.apopheniaDetected / metrics.totalAudits) * 100).toFixed(0)}% false positive`}
              highlight
            />
            <MetricCard
              icon={<Scale className="w-5 h-5" />}
              label="Reliability"
              value={`${(metrics.avgInterRaterReliability * 100).toFixed(0)}%`}
              subValue="Inter-rater avg"
            />
          </div>
        )}

        {/* Streak Display */}
        {metrics && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              {metrics.weeklyStreakCount} Week Audit Streak
            </span>
            <span className="text-xs text-gray-500">Keep it going!</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2 mb-6">
        {(['overview', 'create', 'history', 'insights'] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'create' && 'New Audit'}
            {tab === 'history' && 'History'}
            {tab === 'insights' && 'Insights'}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Pending Audits */}
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending Review
              </h4>
              {audits.filter(a => a.status === 'pending').map(audit => (
                <PendingAuditCard
                  key={audit.id}
                  audit={audit}
                  onReview={() => {
                    setSelectedAudit(audit);
                    setShowReview(true);
                  }}
                  getDomainColor={getDomainColor}
                />
              ))}
              {audits.filter(a => a.status === 'pending').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No audits pending review
                </div>
              )}
            </div>

            {/* Quick Start */}
            <button
              onClick={startNewAudit}
              className="w-full py-4 border border-dashed border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Start Weekly Model Audit
            </button>

            {/* Protocol Guide */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-3">Audit Protocol</h4>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs">1</span>
                  Identify a pattern you&apos;ve noticed (relationship, work, or self)
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs">2</span>
                  Rate your confidence and identify potential biases
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs">3</span>
                  Share with neutral third party (therapist, trusted peer)
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs">4</span>
                  Compare ratings to compute inter-rater reliability
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs">5</span>
                  Adjust confidence and document learnings
                </li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* Create New Audit */}
        {activeTab === 'create' && currentAudit && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <AuditForm
              audit={currentAudit}
              setAudit={setCurrentAudit}
              onSave={saveAudit}
              onCancel={() => {
                setCurrentAudit(null);
                setActiveTab('overview');
              }}
              getDomainColor={getDomainColor}
            />
          </motion.div>
        )}

        {activeTab === 'create' && !currentAudit && (
          <motion.div
            key="create-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">Start a New Audit</h3>
            <p className="text-gray-500 text-sm mb-4">
              Examine a pattern you&apos;ve noticed that might be influenced by bias.
            </p>
            <button
              onClick={startNewAudit}
              className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 transition-colors"
            >
              Begin Audit
            </button>
          </motion.div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {audits.filter(a => a.status !== 'pending').map(audit => (
              <AuditHistoryCard
                key={audit.id}
                audit={audit}
                getDomainColor={getDomainColor}
              />
            ))}
            {audits.filter(a => a.status !== 'pending').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No completed audits yet
              </div>
            )}
          </motion.div>
        )}

        {/* Insights */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <InsightsView audits={audits} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {showReview && selectedAudit && (
        <ReviewModal
          audit={selectedAudit}
          onSubmit={(data) => submitReview(selectedAudit, data)}
          onClose={() => {
            setShowReview(false);
            setSelectedAudit(null);
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

function MetricCard({
  icon,
  label,
  value,
  subValue,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-800/30 border-gray-700/30'}`}>
      <div className={`flex items-center gap-2 mb-2 ${highlight ? 'text-yellow-400' : 'text-cyan-400'}`}>
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
      {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

function PendingAuditCard({
  audit,
  onReview,
  getDomainColor,
}: {
  audit: ModelAudit;
  onReview: () => void;
  getDomainColor: (d: AuditDomain) => string;
}) {
  return (
    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 mb-2 last:mb-0">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded capitalize ${getDomainColor(audit.domain)}`}>
              {audit.domain}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(audit.auditDate).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-300">{audit.patternDescription}</p>
        </div>
        <button
          onClick={onReview}
          className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function AuditForm({
  audit,
  setAudit,
  onSave,
  onCancel,
  getDomainColor,
}: {
  audit: Partial<ModelAudit>;
  setAudit: (a: Partial<ModelAudit> | null) => void;
  onSave: () => void;
  onCancel: () => void;
  getDomainColor: (d: AuditDomain) => string;
}) {
  const toggleBias = (biasId: string) => {
    const current = audit.potentialBiases || [];
    setAudit({
      ...audit,
      potentialBiases: current.includes(biasId)
        ? current.filter(b => b !== biasId)
        : [...current, biasId],
    });
  };

  return (
    <div className="p-6 bg-gray-800/30 border border-cyan-500/30 rounded-lg space-y-6">
      <h4 className="text-lg font-medium text-white">New Pattern Audit</h4>

      {/* Domain Selection */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Domain</label>
        <div className="flex gap-2">
          {(['work', 'relationship', 'self', 'general'] as AuditDomain[]).map(domain => (
            <button
              key={domain}
              onClick={() => setAudit({ ...audit, domain })}
              className={`px-4 py-2 text-sm rounded border capitalize transition-colors ${
                audit.domain === domain
                  ? getDomainColor(domain)
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Description */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Pattern Observed</label>
        <textarea
          value={audit.patternDescription || ''}
          onChange={(e) => setAudit({ ...audit, patternDescription: e.target.value })}
          placeholder="Describe the pattern you've noticed..."
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
          rows={3}
        />
      </div>

      {/* Source */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Source / Context</label>
        <input
          type="text"
          value={audit.patternSource || ''}
          onChange={(e) => setAudit({ ...audit, patternSource: e.target.value })}
          placeholder="Where did you observe this?"
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Confidence Slider */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Confidence in Pattern</span>
          <span className="text-cyan-400">{((audit.selfConfidence || 0.5) * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={(audit.selfConfidence || 0.5) * 100}
          onChange={(e) => setAudit({ ...audit, selfConfidence: parseInt(e.target.value) / 100 })}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Very uncertain</span>
          <span>Very confident</span>
        </div>
      </div>

      {/* Rationale */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Why do you think this pattern exists?</label>
        <textarea
          value={audit.selfRationale || ''}
          onChange={(e) => setAudit({ ...audit, selfRationale: e.target.value })}
          placeholder="Your reasoning..."
          className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
          rows={2}
        />
      </div>

      {/* Potential Biases */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Potential Biases (select all that apply)</label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_BIASES.map(bias => (
            <button
              key={bias.id}
              onClick={() => toggleBias(bias.id)}
              className={`p-3 text-left rounded border transition-colors ${
                audit.potentialBiases?.includes(bias.id)
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-sm">{bias.name}</div>
              <div className="text-xs opacity-70">{bias.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={!audit.patternDescription}
          className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium transition-colors disabled:opacity-50"
        >
          Save & Schedule Review
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AuditHistoryCard({
  audit,
  getDomainColor,
}: {
  audit: ModelAudit;
  getDomainColor: (d: AuditDomain) => string;
}) {
  return (
    <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded capitalize ${getDomainColor(audit.domain)}`}>
              {audit.domain}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(audit.auditDate).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300">{audit.patternDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          {audit.isApophenia && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
              <XCircle className="w-3 h-3" />
              Apophenia
            </span>
          )}
          {audit.isValidPattern && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
              <CheckCircle className="w-3 h-3" />
              Valid
            </span>
          )}
        </div>
      </div>

      {/* Confidence Comparison */}
      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-900/50 rounded mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Self Rating</div>
          <div className="text-lg font-bold text-cyan-400">
            {(audit.selfConfidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Reviewer</div>
          <div className="text-lg font-bold text-purple-400">
            {audit.reviewerRating !== undefined ? `${(audit.reviewerRating * 100).toFixed(0)}%` : '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Reliability</div>
          <div className={`text-lg font-bold ${
            (audit.interRaterReliability || 0) >= 0.7 ? 'text-green-400' :
            (audit.interRaterReliability || 0) >= 0.5 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {audit.interRaterReliability !== undefined ? `${(audit.interRaterReliability * 100).toFixed(0)}%` : '-'}
          </div>
        </div>
      </div>

      {/* Confidence Delta */}
      {audit.postAuditConfidence !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Confidence adjustment:</span>
          <span className={
            audit.postAuditConfidence < audit.preAuditConfidence
              ? 'text-yellow-400'
              : 'text-green-400'
          }>
            {audit.preAuditConfidence > audit.postAuditConfidence ? '' : '+'}
            {((audit.postAuditConfidence - audit.preAuditConfidence) * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Adjustment Made */}
      {audit.adjustmentMade && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
          <Lightbulb className="w-4 h-4 inline mr-2" />
          {audit.adjustmentMade}
        </div>
      )}
    </div>
  );
}

function ReviewModal({
  audit,
  onSubmit,
  onClose,
}: {
  audit: ModelAudit;
  onSubmit: (data: Partial<ModelAudit>) => void;
  onClose: () => void;
}) {
  const [reviewerType, setReviewerType] = useState<ReviewerType>('trusted_peer');
  const [rating, setRating] = useState(0.5);
  const [notes, setNotes] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [postConfidence, setPostConfidence] = useState(audit.selfConfidence);

  const handleSubmit = () => {
    onSubmit({
      reviewerType,
      reviewerRating: rating,
      reviewerNotes: notes,
      adjustmentMade: adjustment,
      postAuditConfidence: postConfidence,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-cyan-500/30 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-white">Third-Party Review</h3>

          {/* Pattern Display */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Pattern Under Review</div>
            <p className="text-gray-300">{audit.patternDescription}</p>
            <div className="mt-2 text-sm text-gray-500">
              Self-confidence: {(audit.selfConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Reviewer Type */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Who reviewed this?</label>
            <div className="flex gap-2">
              {(['therapist', 'trusted_peer', 'coach'] as ReviewerType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setReviewerType(type)}
                  className={`px-3 py-2 text-sm rounded border capitalize transition-colors ${
                    reviewerType === type
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Reviewer Rating */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Reviewer&apos;s Pattern Confidence</span>
              <span className="text-purple-400">{(rating * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rating * 100}
              onChange={(e) => setRating(parseInt(e.target.value) / 100)}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Reviewer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did the reviewer observe?"
              className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
              rows={3}
            />
          </div>

          {/* Post-Audit Confidence */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Your Updated Confidence</span>
              <span className="text-cyan-400">{(postConfidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={postConfidence * 100}
              onChange={(e) => setPostConfidence(parseInt(e.target.value) / 100)}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Adjustment */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">What will you adjust?</label>
            <input
              type="text"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="e.g., Check fatigue before interpreting tone"
              className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium transition-colors"
            >
              Complete Review
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

function InsightsView({ audits }: { audits: ModelAudit[] }) {
  const completed = audits.filter(a => a.status !== 'pending');
  const apopheniaRate = completed.length > 0
    ? completed.filter(a => a.isApophenia).length / completed.length
    : 0;

  // Most common biases
  const biasCounts: Record<string, number> = {};
  completed.forEach(a => {
    a.potentialBiases.forEach(b => {
      biasCounts[b] = (biasCounts[b] || 0) + 1;
    });
  });
  const topBiases = Object.entries(biasCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Apophenia Rate */}
      <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <div className="text-4xl font-bold text-yellow-400 mb-1">
          {(apopheniaRate * 100).toFixed(0)}%
        </div>
        <div className="text-gray-400">Apophenia Rate</div>
        <div className="text-xs text-gray-500 mt-2">
          Patterns you thought existed but were false positives
        </div>
      </div>

      {/* Top Biases */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Your Most Common Biases</h4>
        <div className="space-y-3">
          {topBiases.map(([biasId, count]) => {
            const bias = COMMON_BIASES.find(b => b.id === biasId);
            if (!bias) return null;
            return (
              <div key={biasId} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-cyan-400 w-8">{count}</span>
                <div>
                  <div className="font-medium text-white">{bias.name}</div>
                  <div className="text-xs text-gray-500">{bias.description}</div>
                </div>
              </div>
            );
          })}
          {topBiases.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              Complete more audits to see bias patterns
            </div>
          )}
        </div>
      </div>

      {/* Calibration Over Time */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Calibration Progress</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-900/50 rounded">
            <TrendingDown className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-400">-15%</div>
            <div className="text-xs text-gray-500">Avg Confidence Delta</div>
          </div>
          <div className="text-center p-3 bg-gray-900/50 rounded">
            <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-cyan-400">+23%</div>
            <div className="text-xs text-gray-500">Pattern Accuracy</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Lower confidence delta = better initial calibration
        </p>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <Lightbulb className="w-6 h-6 text-green-400 mb-2" />
        <h4 className="font-medium text-green-400 mb-2">Recommendation</h4>
        <p className="text-sm text-gray-400">
          Based on your audit history, focus on catching <strong>negativity bias</strong> and{' '}
          <strong>pattern matching</strong>. Before concluding a pattern exists, explicitly
          search for disconfirming evidence.
        </p>
      </div>
    </div>
  );
}

export default BiasCalibration;
