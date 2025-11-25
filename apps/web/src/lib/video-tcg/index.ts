/**
 * Video Tutorial Generation Module
 *
 * Creates educational TCG tutorials from X video content.
 * Extracts frames, subtitles, and generates structured learning content.
 *
 * Use Cases:
 * - "How AI helps your role" tutorials (job protection messaging)
 * - TCG strategy guides from pro players
 * - Community content curation
 * - Educational resource generation
 */

export {
  // Types
  type VideoFrame,
  type VideoSubtitle,
  type VideoData,
  type TutorialConfig,
  type TutorialSection,
  type GeneratedTutorial,
  type TutorialTemplate,

  // Constants
  DEFAULT_CONFIG,
  TUTORIAL_TEMPLATES,
  TOPIC_KEYWORDS,

  // Main Functions
  generateTutorial,

  // Helper Functions
  getTutorialTemplates,
  getTemplateById,
  createConfigFromTemplate,
  formatTimestamp,
  estimateGenerationTime,
} from './tutorial-gen';
