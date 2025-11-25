/**
 * Purpose Mode Toggle Component
 *
 * Platform-wide toggle that highlights AI time-savings for creative focus.
 * Addresses job worries by showing positive productivity impacts.
 *
 * Features:
 * - Toggle for purpose-driven insights
 * - Dynamic suggestions based on current action
 * - Time savings visualization
 * - Creative activity recommendations
 *
 * Trade-offs:
 * ✅ GOOD: Motivates purpose (addresses worries about control vs. fulfillment)
 * ✅ GOOD: RAG for dynamic suggestions
 * ❌ BAD: UI clutter—make optional/minimizable
 * ❌ BAD: Query cost—cache common actions
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PurposeSuggestion {
  id: string;
  message: string;
  timeSaved: string;
  activities: string[];
  category: 'creative' | 'learning' | 'collaboration' | 'wellness';
}

export interface PurposeModeConfig {
  enabled: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  minimized: boolean;
  showNotifications: boolean;
}

export interface PurposeModeToggleProps {
  currentAction?: string;
  teamSize?: number;
  automationLevel?: 'minimal' | 'partial' | 'significant' | 'full';
  onToggle?: (enabled: boolean) => void;
  onSuggestionClick?: (suggestion: PurposeSuggestion) => void;
  initialConfig?: Partial<PurposeModeConfig>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: PurposeModeConfig = {
  enabled: false,
  position: 'bottom-right',
  minimized: false,
  showNotifications: true,
};

const TIME_SAVINGS_MAP: Record<string, string> = {
  automate_analysis: '2h/week',
  code_review: '1.5h/week',
  data_processing: '3h/week',
  report_generation: '2.5h/week',
  document_search: '1h/week',
  meeting_summary: '45min/week',
  email_drafting: '1h/week',
  testing: '2h/week',
  debugging: '1.5h/week',
  default: '1h/week',
};

const ACTIVITY_SUGGESTIONS: Record<string, string[]> = {
  creative: [
    'Brainstorm new TCG card strategies',
    'Design custom card artwork',
    'Write lore for your deck',
    'Create battle scenarios',
    'Prototype new game modes',
  ],
  learning: [
    'Study advanced tactics',
    'Watch pro player streams',
    'Read strategy guides',
    'Practice combo chains',
    'Learn counter-strategies',
  ],
  collaboration: [
    'Organize team tournaments',
    'Mentor new players',
    'Share deck builds',
    'Co-create content',
    'Join community events',
  ],
  wellness: [
    'Take a mindful break',
    'Stretch and move',
    'Connect with friends',
    'Enjoy a hobby',
    'Reflect on achievements',
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  creative: '🎨',
  learning: '📚',
  collaboration: '🤝',
  wellness: '🌟',
};

// ============================================================================
// MOCK FUNCTIONS (Replace with actual imports in production)
// ============================================================================

async function assessJobImpact(
  action: string,
  context: { teamSize: number; automationLevel: string }
): Promise<{ reskillPlan: boolean; timeSaved: string }> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    reskillPlan: context.automationLevel !== 'minimal',
    timeSaved: TIME_SAVINGS_MAP[action] || TIME_SAVINGS_MAP.default,
  };
}

async function getPurposeSuggestion(action: string): Promise<string> {
  // Simulate RAG query
  await new Promise((resolve) => setTimeout(resolve, 300));

  const suggestions: Record<string, string> = {
    automate_analysis: 'Use for strategic planning and creative deck building!',
    code_review: 'Spend time mentoring teammates or exploring new technologies!',
    data_processing: 'Focus on insights and decision-making!',
    report_generation: 'Dedicate time to stakeholder relationships!',
    default: 'Invest in creative pursuits and team collaboration!',
  };

  return suggestions[action] || suggestions.default;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    creative: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    learning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    collaboration: 'bg-green-500/20 text-green-400 border-green-500/30',
    wellness: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs border rounded-full ${colors[category]}`}>
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}

function SuggestionCard({
  suggestion,
  onClick,
}: {
  suggestion: PurposeSuggestion;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-cyan-300">{suggestion.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            Time saved: <span className="text-green-400">{suggestion.timeSaved}</span>
          </p>
        </div>
        <CategoryBadge category={suggestion.category} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {suggestion.activities.slice(0, 3).map((activity, i) => (
          <span key={i} className="text-xs text-gray-500 bg-gray-900/50 px-2 py-0.5 rounded">
            {activity}
          </span>
        ))}
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PurposeModeToggle({
  currentAction = 'default',
  teamSize = 5,
  automationLevel = 'partial',
  onToggle,
  onSuggestionClick,
  initialConfig,
}: PurposeModeToggleProps) {
  const [config, setConfig] = useState<PurposeModeConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const [suggestion, setSuggestion] = useState<PurposeSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PurposeSuggestion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const suggestionCache = useRef<Map<string, PurposeSuggestion>>(new Map());

  // Fetch suggestion when enabled and action changes
  useEffect(() => {
    if (!config.enabled) {
      setSuggestion(null);
      return;
    }

    const fetchSuggestion = async () => {
      // Check cache first
      const cacheKey = `${currentAction}-${automationLevel}`;
      const cached = suggestionCache.current.get(cacheKey);
      if (cached) {
        setSuggestion(cached);
        return;
      }

      setLoading(true);
      try {
        const [impact, purposeMessage] = await Promise.all([
          assessJobImpact(currentAction, { teamSize, automationLevel }),
          getPurposeSuggestion(currentAction),
        ]);

        if (impact.reskillPlan) {
          // Select random category for variety
          const categories = ['creative', 'learning', 'collaboration', 'wellness'] as const;
          const category = categories[Math.floor(Math.random() * categories.length)];

          const newSuggestion: PurposeSuggestion = {
            id: `suggestion-${Date.now()}`,
            message: `Saved ~${impact.timeSaved}! ${purposeMessage}`,
            timeSaved: impact.timeSaved,
            activities: ACTIVITY_SUGGESTIONS[category],
            category,
          };

          setSuggestion(newSuggestion);
          suggestionCache.current.set(cacheKey, newSuggestion);

          // Add to history
          setHistory((prev) => [newSuggestion, ...prev.slice(0, 9)]);
        }
      } catch (error) {
        console.error('Failed to get purpose suggestion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestion();
  }, [config.enabled, currentAction, teamSize, automationLevel]);

  const handleToggle = useCallback(() => {
    const newEnabled = !config.enabled;
    setConfig((prev) => ({ ...prev, enabled: newEnabled }));
    onToggle?.(newEnabled);
  }, [config.enabled, onToggle]);

  const handleMinimize = useCallback(() => {
    setConfig((prev) => ({ ...prev, minimized: !prev.minimized }));
  }, []);

  const handleSuggestionClick = useCallback(
    (s: PurposeSuggestion) => {
      onSuggestionClick?.(s);
    },
    [onSuggestionClick]
  );

  // Position styles
  const positionStyles: Record<string, string> = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionStyles[config.position]} z-50 transition-all duration-300`}
      style={{ maxWidth: config.minimized ? '60px' : '320px' }}
    >
      {/* Minimized View */}
      {config.minimized ? (
        <button
          onClick={handleMinimize}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            config.enabled
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
          }`}
          title="Purpose Mode"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </button>
      ) : (
        /* Expanded View */
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 p-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-medium text-white">Purpose Mode</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle Switch */}
                <button
                  onClick={handleToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    config.enabled ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      config.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {/* Minimize Button */}
                <button
                  onClick={handleMinimize}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {config.enabled && (
            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-gray-400">Analyzing savings...</span>
                </div>
              ) : suggestion ? (
                <SuggestionCard
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">
                  Perform an action to see time savings
                </p>
              )}

              {/* History Toggle */}
              {history.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300"
                  >
                    <span>Recent Insights ({history.length})</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showHistory && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {history.slice(0, 5).map((h) => (
                        <div
                          key={h.id}
                          className="p-2 bg-gray-800/30 rounded text-xs text-gray-400"
                        >
                          <span className="text-green-400">{h.timeSaved}</span> saved -{' '}
                          {h.category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Disabled State */}
          {!config.enabled && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">
                Enable to see AI time savings and creative suggestions
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PurposeModeToggle;

/**
 * Hook for using Purpose Mode state
 */
export function usePurposeMode(initialEnabled = false) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [totalTimeSaved, setTotalTimeSaved] = useState('0h');

  const trackSaving = useCallback((timeSaved: string) => {
    // Parse and accumulate time
    const match = timeSaved.match(/(\d+(?:\.\d+)?)(h|min)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      const hours = unit === 'min' ? value / 60 : value;
      setTotalTimeSaved((prev) => {
        const prevHours = parseFloat(prev) || 0;
        return `${(prevHours + hours).toFixed(1)}h`;
      });
    }
  }, []);

  return {
    enabled,
    setEnabled,
    totalTimeSaved,
    trackSaving,
  };
}
