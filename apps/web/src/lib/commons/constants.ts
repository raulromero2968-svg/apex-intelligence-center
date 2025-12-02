/**
 * Apex Commons - Shared Constants
 */

export const COMMONS_SUBJECTS = [
  { value: 'math', label: 'Mathematics', icon: 'Calculator' },
  { value: 'science', label: 'Science', icon: 'FlaskConical' },
  { value: 'english', label: 'English', icon: 'BookText' },
  { value: 'history', label: 'History', icon: 'Landmark' },
  { value: 'art', label: 'Art', icon: 'Palette' },
  { value: 'pe', label: 'Physical Education', icon: 'Dumbbell' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

export const COMMONS_GRADE_LEVELS = [
  { value: 'elementary', label: 'Elementary (K-5)', description: 'Ages 5-11' },
  { value: 'middle', label: 'Middle School (6-8)', description: 'Ages 11-14' },
  { value: 'high', label: 'High School (9-12)', description: 'Ages 14-18' },
  { value: 'college', label: 'College/University', description: 'Ages 18+' },
  { value: 'professional', label: 'Professional Development', description: 'Educators' },
] as const;

export const COMMONS_CATEGORIES = [
  { value: 'lessonPlan', label: 'Lesson Plan', description: 'Complete lesson with objectives' },
  { value: 'worksheet', label: 'Worksheet', description: 'Practice exercises and activities' },
  { value: 'assessment', label: 'Assessment', description: 'Tests, quizzes, and rubrics' },
  { value: 'activity', label: 'Activity', description: 'Hands-on or interactive activities' },
  { value: 'other', label: 'Other', description: 'Other educational resources' },
] as const;

export const COMMONS_RESOURCE_TYPES = [
  { value: 'document', label: 'Document', extensions: ['.pdf', '.doc', '.docx'] },
  { value: 'presentation', label: 'Presentation', extensions: ['.ppt', '.pptx', '.key'] },
  { value: 'video', label: 'Video', extensions: ['.mp4', '.mov', '.webm'] },
  { value: 'interactive', label: 'Interactive', extensions: ['.html', '.zip'] },
  { value: 'other', label: 'Other', extensions: [] },
] as const;

export const COMMONS_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'highestRated', label: 'Highest Rated' },
] as const;

// RC (Reputation Credits) Configuration
export const RC_CONFIG = {
  // Earning
  RESOURCE_APPROVED: 50,
  RESOURCE_VIEW: 0.1,
  RESOURCE_DOWNLOAD: 0.5,
  RESOURCE_UPVOTE: 1,
  FIRST_RESOURCE_BONUS: 100,
  PROPOSAL_PASSED_VOTER: 10,

  // Caps
  MAX_RC_PER_RESOURCE_PER_DAY: 100,

  // Requirements
  MIN_RC_TO_CREATE_PROPOSAL: 500,

  // Contributor Levels
  LEVELS: {
    bronze: { min: 0, max: 499, label: 'Bronze', color: 'amber' },
    silver: { min: 500, max: 1999, label: 'Silver', color: 'slate' },
    gold: { min: 2000, max: 9999, label: 'Gold', color: 'yellow' },
    platinum: { min: 10000, max: Infinity, label: 'Platinum', color: 'cyan' },
  },
} as const;

// Quality Guidelines for resource submission
export const QUALITY_GUIDELINES = [
  {
    title: 'Clear Learning Objectives',
    description: 'State what students will learn or be able to do after using this resource.',
  },
  {
    title: 'Age-Appropriate Content',
    description: 'Ensure content matches the selected grade level in complexity and language.',
  },
  {
    title: 'Accessible Design',
    description: 'Use clear formatting, readable fonts, and consider students with different needs.',
  },
  {
    title: 'Original or Properly Licensed',
    description: 'Only submit content you created or have rights to share. Cite sources.',
  },
  {
    title: 'Complete and Usable',
    description: 'Include all necessary materials. Another teacher should be able to use it as-is.',
  },
] as const;

// Proposal categories
export const PROPOSAL_CATEGORIES = [
  { value: 'policy', label: 'Policy Change', description: 'Changes to community guidelines or rules' },
  { value: 'feature', label: 'Feature Request', description: 'New features or improvements' },
  { value: 'content', label: 'Content Standards', description: 'Changes to resource quality standards' },
  { value: 'moderation', label: 'Moderation', description: 'Changes to moderation policies' },
  { value: 'other', label: 'Other', description: 'Other governance topics' },
] as const;

// Type exports
export type CommonsSubject = typeof COMMONS_SUBJECTS[number]['value'];
export type CommonsGradeLevel = typeof COMMONS_GRADE_LEVELS[number]['value'];
export type CommonsCategory = typeof COMMONS_CATEGORIES[number]['value'];
export type CommonsResourceType = typeof COMMONS_RESOURCE_TYPES[number]['value'];
export type CommmonsSort = typeof COMMONS_SORT_OPTIONS[number]['value'];
export type ContributorLevel = keyof typeof RC_CONFIG.LEVELS;
export type ProposalCategory = typeof PROPOSAL_CATEGORIES[number]['value'];
