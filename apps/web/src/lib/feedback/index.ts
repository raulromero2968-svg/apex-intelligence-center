/**
 * Feedback Module
 *
 * User feedback collection with A/B testing integration.
 * Measures AI job impact and generates reskilling recommendations.
 */

export {
  // Types
  type SurveyVariant,
  type ImpactRating,
  type SurveyQuestion,
  type SurveyResponse,
  type SurveyResult,
  type ImpactAnalysis,
  type SurveyConfig,

  // Constants
  JOB_IMPACT_QUESTIONS,
  VARIANT_CONFIGS,

  // A/B Functions
  getVariantForUser,

  // Survey Functions
  initializeSurvey,
  processSurveyResponses,

  // Analytics
  trackSurveyCompletion,
  getExperimentMetrics,
} from './user-survey';
