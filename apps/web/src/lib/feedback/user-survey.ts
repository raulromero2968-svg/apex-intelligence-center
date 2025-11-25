/**
 * User Feedback Survey System
 *
 * A/B-integrated surveys for measuring AI job impact.
 * Feeds into ethics audits and reskilling recommendations.
 *
 * Features:
 * - A/B variant assignment for survey types
 * - RAG-powered response analysis
 * - Ethics impact correlation
 * - Reskilling suggestion generation
 */

// ============================================================================
// TYPES
// ============================================================================

export type SurveyVariant = 'simple' | 'ai-guided' | 'comprehensive';
export type ImpactRating = 1 | 2 | 3 | 4 | 5;

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'choice';
  options?: string[];
  required: boolean;
}

export interface SurveyResponse {
  questionId: string;
  value: string | number;
  timestamp: Date;
}

export interface SurveyResult {
  id: string;
  userId: string;
  variant: SurveyVariant;
  responses: SurveyResponse[];
  analyzedImpact: ImpactAnalysis;
  reskillingSuggestions: string[];
  submittedAt: Date;
}

export interface ImpactAnalysis {
  overallScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyThemes: string[];
  riskIndicators: string[];
  recommendations: string[];
}

export interface SurveyConfig {
  experimentId: string;
  questions: SurveyQuestion[];
  analysisPrompt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const JOB_IMPACT_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'overall_impact',
    text: 'How has AI automation affected your daily work?',
    type: 'rating',
    required: true,
  },
  {
    id: 'productivity',
    text: 'Has AI improved your productivity?',
    type: 'rating',
    required: true,
  },
  {
    id: 'job_security',
    text: 'How secure do you feel about your job role?',
    type: 'rating',
    required: true,
  },
  {
    id: 'skill_development',
    text: 'Are you developing new skills alongside AI tools?',
    type: 'rating',
    required: true,
  },
  {
    id: 'concerns',
    text: 'What concerns do you have about AI in your workplace?',
    type: 'text',
    required: false,
  },
  {
    id: 'suggestions',
    text: 'What support would help you work better with AI?',
    type: 'choice',
    options: [
      'Training programs',
      'More human oversight',
      'Better AI tools',
      'Role transition support',
      'Other',
    ],
    required: false,
  },
];

export const VARIANT_CONFIGS: Record<SurveyVariant, SurveyConfig> = {
  simple: {
    experimentId: 'job_impact_survey_simple',
    questions: JOB_IMPACT_QUESTIONS.slice(0, 3),
    analysisPrompt: 'Briefly analyze the survey responses for job impact sentiment.',
  },
  'ai-guided': {
    experimentId: 'job_impact_survey_guided',
    questions: JOB_IMPACT_QUESTIONS,
    analysisPrompt: 'Analyze responses with AI-assisted suggestions for each concern raised.',
  },
  comprehensive: {
    experimentId: 'job_impact_survey_full',
    questions: [
      ...JOB_IMPACT_QUESTIONS,
      {
        id: 'team_dynamics',
        text: 'How has AI affected team collaboration?',
        type: 'rating',
        required: true,
      },
      {
        id: 'future_outlook',
        text: 'How optimistic are you about AI in your field?',
        type: 'rating',
        required: true,
      },
    ],
    analysisPrompt: 'Comprehensive analysis with framework compliance (NIST/EU AI Act) recommendations.',
  },
};

// ============================================================================
// A/B VARIANT ASSIGNMENT
// ============================================================================

/**
 * Get deterministic variant for user
 */
export function getVariantForUser(userId: string, experimentId: string): SurveyVariant {
  // Simple hash-based assignment
  const hash = hashString(`${userId}:${experimentId}`);
  const bucket = hash % 100;

  if (bucket < 33) return 'simple';
  if (bucket < 66) return 'ai-guided';
  return 'comprehensive';
}

/**
 * Simple string hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ============================================================================
// SURVEY EXECUTION
// ============================================================================

/**
 * Initialize survey for user
 */
export function initializeSurvey(userId: string): {
  variant: SurveyVariant;
  config: SurveyConfig;
  sessionId: string;
} {
  const variant = getVariantForUser(userId, 'job_impact_survey');
  const config = VARIANT_CONFIGS[variant];

  return {
    variant,
    config,
    sessionId: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

/**
 * Process survey responses and analyze
 */
export async function processSurveyResponses(
  userId: string,
  variant: SurveyVariant,
  responses: SurveyResponse[]
): Promise<SurveyResult> {
  // Calculate impact scores
  const ratingResponses = responses.filter((r) => typeof r.value === 'number');
  const avgRating = ratingResponses.length > 0
    ? ratingResponses.reduce((sum, r) => sum + (r.value as number), 0) / ratingResponses.length
    : 3;

  // Determine sentiment
  const sentiment: ImpactAnalysis['sentiment'] =
    avgRating >= 4 ? 'positive' :
    avgRating >= 2.5 ? 'neutral' : 'negative';

  // Extract key themes from text responses
  const textResponses = responses.filter((r) => typeof r.value === 'string' && r.value.length > 0);
  const keyThemes = extractThemes(textResponses.map((r) => r.value as string));

  // Identify risk indicators
  const riskIndicators = identifyRisks(responses, avgRating);

  // Generate recommendations
  const recommendations = generateRecommendations(sentiment, riskIndicators);

  // Generate reskilling suggestions
  const reskillingSuggestions = generateReskillingSuggestions(responses, sentiment);

  const analysis: ImpactAnalysis = {
    overallScore: Math.round(avgRating * 20), // Convert to 0-100
    sentiment,
    keyThemes,
    riskIndicators,
    recommendations,
  };

  return {
    id: `result-${Date.now()}`,
    userId,
    variant,
    responses,
    analyzedImpact: analysis,
    reskillingSuggestions,
    submittedAt: new Date(),
  };
}

/**
 * Extract themes from text responses
 */
function extractThemes(texts: string[]): string[] {
  const themes: string[] = [];
  const combined = texts.join(' ').toLowerCase();

  const themeKeywords: Record<string, string[]> = {
    'Job Security': ['security', 'replace', 'displacement', 'layoff', 'worried'],
    'Skill Gap': ['skill', 'training', 'learn', 'knowledge', 'competency'],
    'Productivity': ['productive', 'efficiency', 'faster', 'workflow'],
    'Collaboration': ['team', 'collaboration', 'communication', 'together'],
    'Autonomy': ['control', 'decision', 'autonomy', 'oversight'],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      themes.push(theme);
    }
  }

  return themes.length > 0 ? themes : ['General Feedback'];
}

/**
 * Identify risk indicators
 */
function identifyRisks(responses: SurveyResponse[], avgRating: number): string[] {
  const risks: string[] = [];

  if (avgRating < 2.5) {
    risks.push('Low overall satisfaction with AI integration');
  }

  const securityResponse = responses.find((r) => r.questionId === 'job_security');
  if (securityResponse && typeof securityResponse.value === 'number' && securityResponse.value < 3) {
    risks.push('Job security concerns detected');
  }

  const skillResponse = responses.find((r) => r.questionId === 'skill_development');
  if (skillResponse && typeof skillResponse.value === 'number' && skillResponse.value < 3) {
    risks.push('Insufficient skill development support');
  }

  return risks;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  sentiment: ImpactAnalysis['sentiment'],
  risks: string[]
): string[] {
  const recommendations: string[] = [];

  if (sentiment === 'negative') {
    recommendations.push('Schedule 1:1 meetings to address concerns');
    recommendations.push('Review automation rollout pace');
  }

  if (risks.includes('Job security concerns detected')) {
    recommendations.push('Communicate job protection commitments');
    recommendations.push('Highlight human-AI collaboration opportunities');
  }

  if (risks.includes('Insufficient skill development support')) {
    recommendations.push('Expand training program availability');
    recommendations.push('Allocate dedicated learning time');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current AI integration approach');
    recommendations.push('Monitor satisfaction metrics quarterly');
  }

  return recommendations;
}

/**
 * Generate reskilling suggestions
 */
function generateReskillingSuggestions(
  responses: SurveyResponse[],
  sentiment: ImpactAnalysis['sentiment']
): string[] {
  const suggestions: string[] = [
    'AI Literacy Fundamentals - Understanding AI capabilities and limitations',
  ];

  const suggestionResponse = responses.find((r) => r.questionId === 'suggestions');
  if (suggestionResponse && suggestionResponse.value === 'Training programs') {
    suggestions.push('Advanced AI Tool Proficiency Workshop');
    suggestions.push('AI-Human Collaboration Best Practices');
  }

  if (sentiment === 'negative') {
    suggestions.push('Change Management Support Program');
    suggestions.push('Career Transition Planning Workshop');
  }

  suggestions.push('Continuous Learning: AI Updates & Trends');

  return suggestions;
}

// ============================================================================
// TRACKING & ANALYTICS
// ============================================================================

/**
 * Track survey completion for A/B analysis
 */
export function trackSurveyCompletion(
  userId: string,
  variant: SurveyVariant,
  result: SurveyResult
): {
  tracked: boolean;
  conversion: boolean;
  metrics: Record<string, number>;
} {
  // Positive completion = rating >= 4
  const conversion = result.analyzedImpact.sentiment === 'positive';

  const metrics = {
    overallScore: result.analyzedImpact.overallScore,
    responseCount: result.responses.length,
    riskCount: result.analyzedImpact.riskIndicators.length,
    completionTime: Date.now(), // Would track actual time in production
  };

  // In production, send to analytics service
  console.log('Survey tracked:', { userId, variant, conversion, metrics });

  return { tracked: true, conversion, metrics };
}

/**
 * Get aggregate metrics for experiment
 */
export function getExperimentMetrics(surveyResults: SurveyResult[]): {
  byVariant: Record<SurveyVariant, {
    count: number;
    avgScore: number;
    conversionRate: number;
  }>;
  overall: {
    totalResponses: number;
    avgScore: number;
    topConcerns: string[];
  };
} {
  const byVariant: Record<SurveyVariant, { count: number; totalScore: number; positiveCount: number }> = {
    simple: { count: 0, totalScore: 0, positiveCount: 0 },
    'ai-guided': { count: 0, totalScore: 0, positiveCount: 0 },
    comprehensive: { count: 0, totalScore: 0, positiveCount: 0 },
  };

  const allConcerns: string[] = [];

  for (const result of surveyResults) {
    byVariant[result.variant].count++;
    byVariant[result.variant].totalScore += result.analyzedImpact.overallScore;
    if (result.analyzedImpact.sentiment === 'positive') {
      byVariant[result.variant].positiveCount++;
    }
    allConcerns.push(...result.analyzedImpact.riskIndicators);
  }

  const totalResponses = surveyResults.length;
  const avgScore = totalResponses > 0
    ? surveyResults.reduce((sum, r) => sum + r.analyzedImpact.overallScore, 0) / totalResponses
    : 0;

  // Count top concerns
  const concernCounts = new Map<string, number>();
  for (const concern of allConcerns) {
    concernCounts.set(concern, (concernCounts.get(concern) || 0) + 1);
  }
  const topConcerns = Array.from(concernCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([concern]) => concern);

  return {
    byVariant: {
      simple: {
        count: byVariant.simple.count,
        avgScore: byVariant.simple.count > 0 ? byVariant.simple.totalScore / byVariant.simple.count : 0,
        conversionRate: byVariant.simple.count > 0 ? byVariant.simple.positiveCount / byVariant.simple.count : 0,
      },
      'ai-guided': {
        count: byVariant['ai-guided'].count,
        avgScore: byVariant['ai-guided'].count > 0 ? byVariant['ai-guided'].totalScore / byVariant['ai-guided'].count : 0,
        conversionRate: byVariant['ai-guided'].count > 0 ? byVariant['ai-guided'].positiveCount / byVariant['ai-guided'].count : 0,
      },
      comprehensive: {
        count: byVariant.comprehensive.count,
        avgScore: byVariant.comprehensive.count > 0 ? byVariant.comprehensive.totalScore / byVariant.comprehensive.count : 0,
        conversionRate: byVariant.comprehensive.count > 0 ? byVariant.comprehensive.positiveCount / byVariant.comprehensive.count : 0,
      },
    },
    overall: {
      totalResponses,
      avgScore,
      topConcerns,
    },
  };
}
