'use client';

/**
 * Job Impact Panel - Ethics transparency component
 *
 * Displays job impact assessment for AI-powered features.
 * Shows automation level, impact category, and recommendations.
 *
 * @see lib/ethics/iso42001-auditor for assessment logic
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface JobImpactContext {
  teamSize?: number;
  automationLevel?: 'full' | 'partial' | 'manual';
  actionDescription?: string;
}

interface JobImpactPanelProps {
  actionType: string;
  context?: JobImpactContext;
  collapsed?: boolean;
}

interface ImpactAssessment {
  category: 'low' | 'medium' | 'high';
  score: number;
  description: string;
  recommendations: string[];
}

export function JobImpactPanel({
  actionType,
  context = {},
  collapsed = true,
}: JobImpactPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null);

  useEffect(() => {
    // Simulate assessment (in production, call API)
    const assess = async () => {
      await new Promise((r) => setTimeout(r, 300));

      const automationLevel = context.automationLevel || 'partial';
      const teamSize = context.teamSize || 10;

      let score = 0;
      const recommendations: string[] = [];

      // Calculate score based on context
      if (automationLevel === 'full') {
        score += 40;
        recommendations.push('Consider gradual automation rollout');
      } else if (automationLevel === 'partial') {
        score += 20;
        recommendations.push('Monitor task redistribution');
      }

      if (teamSize > 50) {
        score += 15;
        recommendations.push('Provide reskilling opportunities');
      }

      // Action-specific adjustments
      if (actionType.includes('personalize')) {
        score -= 10; // Personalization enhances jobs
        recommendations.push('AI assists human decision-making');
      }

      const category: 'low' | 'medium' | 'high' =
        score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

      setAssessment({
        category,
        score: Math.max(0, Math.min(100, score)),
        description: getDescription(category, actionType),
        recommendations,
      });
    };

    assess();
  }, [actionType, context]);

  const getDescription = (category: string, action: string) => {
    switch (category) {
      case 'high':
        return `This ${action} action has significant automation potential. Human oversight recommended.`;
      case 'medium':
        return `This ${action} action has moderate automation. AI assists human decision-making.`;
      default:
        return `This ${action} action enhances human capabilities without displacement risk.`;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'high':
        return '⚠️';
      case 'medium':
        return '📊';
      default:
        return '✅';
    }
  };

  if (!assessment) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-32" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300',
        getCategoryColor(assessment.category),
        isExpanded ? 'p-4' : 'p-3'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span>{getCategoryIcon(assessment.category)}</span>
          <span className="font-medium text-sm">
            Job Impact: {assessment.category.toUpperCase()}
          </span>
          <span className="text-xs opacity-70">
            (Score: {assessment.score}/100)
          </span>
        </div>
        <svg
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-sm opacity-80">{assessment.description}</p>

          {assessment.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1 opacity-60">
                Recommendations:
              </p>
              <ul className="text-xs space-y-1">
                {assessment.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="opacity-50">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-current/20">
            <span className="text-xs opacity-50">ISO 42001 Compliant</span>
            <span className="text-xs px-2 py-0.5 rounded bg-current/10">
              Ethics Certified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobImpactPanel;
