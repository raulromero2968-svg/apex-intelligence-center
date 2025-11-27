/**
 * Livelihood Insights Dashboard Component
 *
 * Interactive dashboard for AI livelihood analysis features.
 * Implements Phase 4 visualization requirements of AI Livelihood Analysis master plan.
 *
 * Features:
 * - Job impact assessment visualization
 * - Upskilling pathway cards
 * - Discovery opportunities grid
 * - 3D spatial market visualization integration
 * - Real-time metrics tracking
 *
 * @see master-plan-ai-livelihood-analysis Phase 4
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface LivelihoodInsightsProps {
  userId?: string;
  className?: string;
}

interface ImpactAssessment {
  displacementRisk: 'low' | 'medium' | 'high';
  augmentationPotential: 'low' | 'medium' | 'high';
  timelineYears: number;
  affectedRoles: string[];
  emergingRoles: string[];
  skillGaps: string[];
  reasoning: string;
}

interface UpskillPathway {
  pathway: string;
  skills: string[];
  estimatedTimeMonths: number;
  resources: Array<{ name: string; url?: string; type: string }>;
  relevanceScore: number;
}

interface Opportunity {
  title: string;
  description: string;
  category: string;
  tcgRelevance: number;
  aiAugmented: boolean;
}

interface AnalysisResult {
  response: string;
  analysisType: string;
  impactAssessment?: ImpactAssessment;
  discoveryResults?: {
    opportunities: Opportunity[];
    upskillPathways: UpskillPathway[];
    insights: string[];
  };
  confidenceScore: number;
}

interface Metrics {
  totalQueries: number;
  upskillStarted: number;
  discoveryClicks: number;
  avgConfidence: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LivelihoodInsights({ userId, className = '' }: LivelihoodInsightsProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeTab, setActiveTab] = useState<'impact' | 'upskill' | 'discover'>('impact');

  // Fetch user metrics on mount
  useEffect(() => {
    if (userId) {
      fetchMetrics();
    }
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/livelihood?limit=50`);
      if (res.ok) {
        const data = await res.json();
        // Calculate metrics from history
        const history = data.data || [];
        setMetrics({
          totalQueries: history.length,
          upskillStarted: history.filter((h: any) => h.analysisType === 'upskilling').length,
          discoveryClicks: history.filter((h: any) => h.analysisType === 'opportunity_discovery').length,
          avgConfidence: history.reduce((acc: number, h: any) => acc + (h.confidenceScore || 0), 0) / (history.length || 1),
        });
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/livelihood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          includeDiscovery: true,
          includeCompliance: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data.data);

      // Refresh metrics
      fetchMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Suggested queries
  const suggestedQueries = [
    "How will AI impact TCG analysts' jobs?",
    "What skills should I learn for AI-augmented trading?",
    "Discover new opportunities in AI-powered collecting",
    "Will AI replace card graders?",
  ];

  return (
    <div className={`livelihood-insights ${className}`}>
      {/* Header with metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2 tracking-wider">
          AI LIVELIHOOD INSIGHTS
        </h2>
        <p className="text-gray-400 text-sm">
          Understand AI's impact on TCG careers and discover growth opportunities
        </p>

        {/* Metrics Bar */}
        {metrics && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <MetricCard label="Analyses" value={metrics.totalQueries} />
            <MetricCard label="Upskill Started" value={metrics.upskillStarted} />
            <MetricCard label="Discoveries" value={metrics.discoveryClicks} />
            <MetricCard
              label="Avg Confidence"
              value={`${(metrics.avgConfidence * 100).toFixed(0)}%`}
            />
          </div>
        )}
      </div>

      {/* Query Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ask about AI's impact on your TCG career..."
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Analyzing...
              </span>
            ) : (
              'Analyze'
            )}
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => setQuery(sq)}
              className="px-3 py-1 text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 rounded-full text-gray-400 hover:text-gray-300 transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-700/50 pb-2">
            <TabButton
              active={activeTab === 'impact'}
              onClick={() => setActiveTab('impact')}
            >
              Impact Assessment
            </TabButton>
            <TabButton
              active={activeTab === 'upskill'}
              onClick={() => setActiveTab('upskill')}
            >
              Upskilling
            </TabButton>
            <TabButton
              active={activeTab === 'discover'}
              onClick={() => setActiveTab('discover')}
            >
              Opportunities
            </TabButton>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'impact' && result.impactAssessment && (
              <ImpactTab assessment={result.impactAssessment} />
            )}
            {activeTab === 'upskill' && result.discoveryResults?.upskillPathways && (
              <UpskillTab pathways={result.discoveryResults.upskillPathways} />
            )}
            {activeTab === 'discover' && result.discoveryResults?.opportunities && (
              <DiscoverTab opportunities={result.discoveryResults.opportunities} />
            )}
          </AnimatePresence>

          {/* Response Text */}
          <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Full Analysis</h4>
            <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {result.response}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Confidence:</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidenceScore * 100}%` }}
                className={`h-full ${
                  result.confidenceScore > 0.7
                    ? 'bg-green-500'
                    : result.confidenceScore > 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
            <span className="text-sm text-gray-400">
              {(result.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-20">🎯</div>
          <h3 className="text-xl text-gray-400 mb-2">Ready to Discover</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Ask questions about AI's impact on TCG careers, discover upskilling opportunities,
            and find new ways AI can augment your expertise.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-lg">
      <div className="text-2xl font-bold text-cyan-400">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ImpactTab({ assessment }: { assessment: ImpactAssessment }) {
  const riskColors = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Risk Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 border rounded-lg ${riskColors[assessment.displacementRisk]}`}>
          <div className="text-sm opacity-70">Displacement Risk</div>
          <div className="text-xl font-bold uppercase">{assessment.displacementRisk}</div>
        </div>
        <div className={`p-4 border rounded-lg ${riskColors[assessment.augmentationPotential === 'high' ? 'low' : assessment.augmentationPotential === 'low' ? 'high' : 'medium']}`}>
          <div className="text-sm opacity-70">Augmentation Potential</div>
          <div className="text-xl font-bold uppercase">{assessment.augmentationPotential}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
        <div className="text-sm text-gray-400 mb-1">Transition Timeline</div>
        <div className="text-2xl font-bold text-cyan-400">
          {assessment.timelineYears} {assessment.timelineYears === 1 ? 'Year' : 'Years'}
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-2 gap-4">
        {assessment.affectedRoles.length > 0 && (
          <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Affected Roles</div>
            <div className="flex flex-wrap gap-1">
              {assessment.affectedRoles.map((role, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
        {assessment.emergingRoles.length > 0 && (
          <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Emerging Roles</div>
            <div className="flex flex-wrap gap-1">
              {assessment.emergingRoles.map((role, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-green-500/10 border border-green-500/30 rounded text-green-400"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {assessment.skillGaps.length > 0 && (
        <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Key Skill Gaps</div>
          <div className="flex flex-wrap gap-2">
            {assessment.skillGaps.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 text-sm bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UpskillTab({ pathways }: { pathways: UpskillPathway[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {pathways.map((pathway, i) => (
        <div
          key={i}
          className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:border-cyan-500/30 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-lg font-medium text-white">{pathway.pathway}</h4>
              <div className="text-sm text-gray-400">
                Est. {pathway.estimatedTimeMonths} months
              </div>
            </div>
            <div className="px-2 py-1 text-xs bg-cyan-500/20 rounded text-cyan-400">
              {pathway.relevanceScore}% relevant
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Skills</div>
            <div className="flex flex-wrap gap-1">
              {pathway.skills.map((skill, j) => (
                <span
                  key={j}
                  className="px-2 py-0.5 text-xs bg-gray-700/50 rounded text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {pathway.resources.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Resources</div>
              <div className="flex flex-wrap gap-2">
                {pathway.resources.map((res, j) => (
                  <span
                    key={j}
                    className="px-2 py-1 text-xs bg-purple-500/10 border border-purple-500/30 rounded text-purple-400"
                  >
                    {res.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {pathways.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No upskilling pathways found. Try a different query.
        </div>
      )}
    </motion.div>
  );
}

function DiscoverTab({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {opportunities.map((opp, i) => (
        <div
          key={i}
          className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:border-green-500/30 transition-colors group"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-md font-medium text-white group-hover:text-green-400 transition-colors">
              {opp.title}
            </h4>
            {opp.aiAugmented && (
              <span className="px-2 py-0.5 text-xs bg-green-500/20 border border-green-500/30 rounded text-green-400">
                AI-Augmented
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-3">{opp.description}</p>
          <div className="flex justify-between items-center">
            <span className="px-2 py-0.5 text-xs bg-gray-700/50 rounded text-gray-400 capitalize">
              {opp.category}
            </span>
            <span className="text-xs text-cyan-400">
              {opp.tcgRelevance}% TCG relevance
            </span>
          </div>
        </div>
      ))}

      {opportunities.length === 0 && (
        <div className="col-span-2 text-center py-8 text-gray-500">
          No opportunities found. Try a different query.
        </div>
      )}
    </motion.div>
  );
}

export default LivelihoodInsights;
