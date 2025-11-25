'use client';

/**
 * Purpose Mode Toggle Component
 *
 * Shows AI time-savings calculations and creative suggestions
 * for how users can use their saved time productively.
 *
 * @see lib/ethics for Purpose Mode session management
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PurposeModeToggleProps {
  currentAction?: string;
  userId?: string;
  className?: string;
  onToggle?: (enabled: boolean) => void;
}

interface Suggestion {
  suggestion: string;
  category: 'learning' | 'creative' | 'social' | 'wellness' | 'career';
  priority: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  learning: '📚',
  creative: '🎨',
  social: '👥',
  wellness: '🧘',
  career: '📈',
};

const CATEGORY_COLORS: Record<string, string> = {
  learning: 'bg-blue-500/20 text-blue-300',
  creative: 'bg-purple-500/20 text-purple-300',
  social: 'bg-green-500/20 text-green-300',
  wellness: 'bg-pink-500/20 text-pink-300',
  career: 'bg-amber-500/20 text-amber-300',
};

export function PurposeModeToggle({
  currentAction = 'AI Analysis',
  userId,
  className,
  onToggle,
}: PurposeModeToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [savings, setSavings] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch purpose mode data
  const fetchPurposeData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      // In production, this would call the API
      // const response = await fetch('/api/purpose-mode/start', {
      //   method: 'POST',
      //   body: JSON.stringify({ userId, actionType: currentAction }),
      // });
      // const data = await response.json();

      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 500));

      const timeSaved = 2 + Math.random() * 3;
      setSavings(timeSaved);

      const mockSuggestions: Suggestion[] = [
        {
          suggestion: 'Learn advanced data visualization techniques',
          category: 'learning',
          priority: 1,
        },
        {
          suggestion: 'Start a creative side project combining AI and art',
          category: 'creative',
          priority: 2,
        },
        {
          suggestion: 'Schedule coffee chats with team members',
          category: 'social',
          priority: 3,
        },
        {
          suggestion: 'Take a mindfulness break - you\'ve earned it!',
          category: 'wellness',
          priority: 4,
        },
        {
          suggestion: 'Explore AI certification opportunities',
          category: 'career',
          priority: 5,
        },
      ];

      setSuggestions(mockSuggestions);
      setSessionId(`session_${Date.now()}`);
    } catch (error) {
      console.error('Failed to fetch purpose data:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled, currentAction]);

  useEffect(() => {
    fetchPurposeData();
  }, [fetchPurposeData]);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle?.(newState);

    if (!newState) {
      setSavings(0);
      setSuggestions([]);
      setSessionId(null);
    }
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    // Track which suggestion was accepted
    console.log('Suggestion accepted:', suggestion);

    // In production, this would update the session
    // await fetch('/api/purpose-mode/feedback', {
    //   method: 'POST',
    //   body: JSON.stringify({ sessionId, suggestionAccepted: suggestion.suggestion }),
    // });
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-cyan-600',
          'p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
          'border border-cyan-500/30',
          className
        )}
        title="Expand Purpose Mode"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 w-80',
        'bg-gradient-to-br from-gray-900/95 via-purple-900/20 to-cyan-900/20',
        'backdrop-blur-xl rounded-xl shadow-2xl',
        'border border-cyan-500/30',
        'transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            enabled ? 'bg-gradient-to-r from-purple-600 to-cyan-600' : 'bg-gray-700'
          )}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-cyan-200">Purpose Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className={cn(
              'w-11 h-6 rounded-full peer transition-colors duration-300',
              'bg-gray-700 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-cyan-600',
              'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
              'after:bg-white after:rounded-full after:h-5 after:w-5',
              'after:transition-transform after:duration-300',
              'peer-checked:after:translate-x-full'
            )} />
          </label>
        </div>
      </div>

      {/* Content */}
      {enabled && (
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Time Savings */}
              <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Time Saved This Week</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  {savings.toFixed(1)}h
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  from {currentAction}
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">
                  Reclaim your time with purpose:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all duration-200',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        'bg-gray-800/50 hover:bg-gray-700/50',
                        'border border-transparent hover:border-cyan-500/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg',
                          CATEGORY_COLORS[suggestion.category]
                        )}>
                          {CATEGORY_ICONS[suggestion.category]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cyan-100 leading-snug">
                            {suggestion.suggestion}
                          </p>
                          <span className={cn(
                            'inline-block mt-1 px-2 py-0.5 rounded-full text-xs',
                            CATEGORY_COLORS[suggestion.category]
                          )}>
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 text-center">
                  AI helps you work smarter, not just faster
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PurposeModeToggle;
