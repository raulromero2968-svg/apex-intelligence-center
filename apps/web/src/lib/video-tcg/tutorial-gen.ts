/**
 * Video Tutorial Generator
 *
 * Generates TCG tutorials from X video content.
 * Extracts frames, subtitles, and creates educational content.
 *
 * Features:
 * - X video frame extraction
 * - Subtitle processing for topic filtering
 * - Tutorial compilation
 * - Ethics guard for content compliance
 *
 * Use Cases:
 * - "How AI helps your role" tutorials
 * - TCG strategy guides from pro players
 * - Community content curation
 *
 * Trade-offs:
 * ✅ GOOD: Educational videos address job worries
 * ✅ GOOD: Ties to X social for source videos
 * ❌ BAD: Video limits (subtitles only)—focus on key frames
 * ❌ BAD: Processing time—async generation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VideoFrame {
  index: number;
  timestamp: number; // seconds
  imageUrl: string;
  description?: string;
}

export interface VideoSubtitle {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoData {
  id: string;
  url: string;
  title: string;
  duration: number;
  frames: VideoFrame[];
  subtitles: VideoSubtitle[];
  creator: string;
  createdAt: string;
}

export interface TutorialConfig {
  topic: string;
  maxFrames: number;
  includeSubtitles: boolean;
  filterByKeywords: string[];
  generateSummary: boolean;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
}

export interface TutorialSection {
  id: string;
  title: string;
  timestamp: number;
  duration: number;
  frames: VideoFrame[];
  subtitles: VideoSubtitle[];
  summary: string;
  keyPoints: string[];
}

export interface GeneratedTutorial {
  id: string;
  title: string;
  topic: string;
  sourceVideoUrl: string;
  sections: TutorialSection[];
  totalDuration: number;
  thumbnailUrl?: string;
  generatedAt: Date;
  metadata: {
    sourceCreator: string;
    frameCount: number;
    subtitleCount: number;
    processingTime: number;
  };
}

export interface TutorialTemplate {
  id: string;
  name: string;
  topic: string;
  description: string;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  suggestedKeywords: string[];
  sectionStructure: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_CONFIG: TutorialConfig = {
  topic: 'AI job protection',
  maxFrames: 10,
  includeSubtitles: true,
  filterByKeywords: [],
  generateSummary: true,
  targetAudience: 'beginner',
};

export const TUTORIAL_TEMPLATES: TutorialTemplate[] = [
  {
    id: 'ai-job-protection',
    name: 'AI & Your Career',
    topic: 'AI job protection',
    description: 'How AI augments rather than replaces your role',
    targetAudience: 'beginner',
    suggestedKeywords: ['ai', 'job', 'career', 'skills', 'automation', 'future'],
    sectionStructure: ['Introduction', 'AI Benefits', 'Reskilling', 'Success Stories', 'Action Steps'],
  },
  {
    id: 'tcg-strategy',
    name: 'TCG Strategy Guide',
    topic: 'TCG tactics',
    description: 'Advanced tactics and deck building',
    targetAudience: 'intermediate',
    suggestedKeywords: ['deck', 'strategy', 'meta', 'combo', 'counter', 'build'],
    sectionStructure: ['Meta Overview', 'Core Strategy', 'Key Combos', 'Counter Play', 'Deck Variations'],
  },
  {
    id: 'tcg-beginner',
    name: 'TCG for Beginners',
    topic: 'TCG basics',
    description: 'Getting started with trading card games',
    targetAudience: 'beginner',
    suggestedKeywords: ['basics', 'start', 'learn', 'beginner', 'rules', 'guide'],
    sectionStructure: ['Game Basics', 'Card Types', 'Turn Structure', 'First Deck', 'Next Steps'],
  },
  {
    id: 'ethics-ai',
    name: 'AI Ethics Explained',
    topic: 'AI ethics',
    description: 'Understanding responsible AI development',
    targetAudience: 'intermediate',
    suggestedKeywords: ['ethics', 'responsible', 'bias', 'fairness', 'transparency', 'accountability'],
    sectionStructure: ['Why Ethics Matter', 'Key Principles', 'Real Examples', 'Best Practices', 'Your Role'],
  },
];

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  'AI job protection': ['ai', 'job', 'career', 'automate', 'skill', 'reskill', 'future', 'work', 'employment', 'team'],
  'TCG tactics': ['deck', 'card', 'strategy', 'combo', 'meta', 'build', 'counter', 'play', 'turn', 'win'],
  'AI ethics': ['ethics', 'responsible', 'bias', 'fair', 'transparent', 'accountable', 'trust', 'safe', 'human'],
  default: [],
};

// ============================================================================
// MOCK X VIDEO API (Replace with actual API integration)
// ============================================================================

async function viewXVideo(params: { videoUrl: string }): Promise<VideoData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate mock video data
  const videoId = `video-${Date.now()}`;
  const duration = 180 + Math.floor(Math.random() * 120); // 3-5 minutes

  const frames: VideoFrame[] = Array.from({ length: 10 }, (_, i) => ({
    index: i,
    timestamp: (i / 9) * duration,
    imageUrl: `https://placeholder.com/frame-${i}.jpg`,
    description: `Frame ${i + 1} of tutorial`,
  }));

  const subtitles: VideoSubtitle[] = generateMockSubtitles(duration);

  return {
    id: videoId,
    url: params.videoUrl,
    title: 'Tutorial Video',
    duration,
    frames,
    subtitles,
    creator: 'TCG_Expert',
    createdAt: new Date().toISOString(),
  };
}

function generateMockSubtitles(duration: number): VideoSubtitle[] {
  const lines = [
    "Welcome to today's tutorial on how AI can help your team.",
    "Let's start by understanding what automation really means.",
    "AI doesn't replace jobs—it transforms them.",
    "The key is to focus on skills that complement AI.",
    "Think of AI as your co-pilot, not your replacement.",
    "Creative and strategic thinking remain uniquely human.",
    "Reskilling programs are essential for smooth transitions.",
    "Many companies report increased job satisfaction with AI tools.",
    "The goal is augmentation, not substitution.",
    "Let's look at some real success stories.",
    "Teams using AI report 30% more time for creative work.",
    "Communication and leadership skills become more valuable.",
    "Start by identifying repetitive tasks in your workflow.",
    "AI can handle data processing while you focus on insights.",
    "The future belongs to those who adapt and learn.",
    "Thank you for watching. Like and subscribe for more!",
  ];

  const segmentDuration = duration / lines.length;

  return lines.map((text, i) => ({
    index: i,
    startTime: i * segmentDuration,
    endTime: (i + 1) * segmentDuration,
    text,
  }));
}

// ============================================================================
// TUTORIAL GENERATION
// ============================================================================

/**
 * Generate tutorial from X video
 */
export async function generateTutorial(
  videoUrl: string,
  config: Partial<TutorialConfig> = {}
): Promise<GeneratedTutorial> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Fetch video data
  const videoData = await viewXVideo({ videoUrl });

  // Filter subtitles by topic keywords
  const keywords = [
    ...finalConfig.filterByKeywords,
    ...(TOPIC_KEYWORDS[finalConfig.topic] || TOPIC_KEYWORDS.default),
  ];

  const filteredSubtitles = filterSubtitlesByKeywords(videoData.subtitles, keywords);

  // Select relevant frames
  const selectedFrames = selectRelevantFrames(
    videoData.frames,
    filteredSubtitles,
    finalConfig.maxFrames
  );

  // Generate sections
  const sections = generateSections(
    selectedFrames,
    filteredSubtitles,
    finalConfig.topic,
    finalConfig.generateSummary
  );

  // Create tutorial
  const tutorial: GeneratedTutorial = {
    id: `tutorial-${Date.now()}`,
    title: generateTitle(finalConfig.topic, finalConfig.targetAudience),
    topic: finalConfig.topic,
    sourceVideoUrl: videoUrl,
    sections,
    totalDuration: videoData.duration,
    thumbnailUrl: selectedFrames[0]?.imageUrl,
    generatedAt: new Date(),
    metadata: {
      sourceCreator: videoData.creator,
      frameCount: selectedFrames.length,
      subtitleCount: filteredSubtitles.length,
      processingTime: Date.now() - startTime,
    },
  };

  return tutorial;
}

/**
 * Filter subtitles by keywords
 */
function filterSubtitlesByKeywords(
  subtitles: VideoSubtitle[],
  keywords: string[]
): VideoSubtitle[] {
  if (keywords.length === 0) return subtitles;

  const keywordsLower = keywords.map((k) => k.toLowerCase());

  return subtitles.filter((sub) => {
    const textLower = sub.text.toLowerCase();
    return keywordsLower.some((keyword) => textLower.includes(keyword));
  });
}

/**
 * Select relevant frames based on subtitle timing
 */
function selectRelevantFrames(
  frames: VideoFrame[],
  subtitles: VideoSubtitle[],
  maxFrames: number
): VideoFrame[] {
  if (subtitles.length === 0) {
    // Return evenly spaced frames
    const step = Math.ceil(frames.length / maxFrames);
    return frames.filter((_, i) => i % step === 0).slice(0, maxFrames);
  }

  // Get timestamps from filtered subtitles
  const timestamps = subtitles.map((s) => s.startTime);

  // Find frames closest to subtitle timestamps
  const selectedFrames: VideoFrame[] = [];

  for (const timestamp of timestamps) {
    const closestFrame = frames.reduce((closest, frame) =>
      Math.abs(frame.timestamp - timestamp) < Math.abs(closest.timestamp - timestamp)
        ? frame
        : closest
    );

    if (!selectedFrames.includes(closestFrame)) {
      selectedFrames.push(closestFrame);
    }

    if (selectedFrames.length >= maxFrames) break;
  }

  return selectedFrames.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Generate tutorial sections
 */
function generateSections(
  frames: VideoFrame[],
  subtitles: VideoSubtitle[],
  topic: string,
  generateSummary: boolean
): TutorialSection[] {
  // Group content into logical sections
  const sectionCount = Math.min(5, Math.ceil(frames.length / 2));
  const sections: TutorialSection[] = [];

  const framesPerSection = Math.ceil(frames.length / sectionCount);
  const subtitlesPerSection = Math.ceil(subtitles.length / sectionCount);

  const sectionTitles = getSectionTitles(topic, sectionCount);

  for (let i = 0; i < sectionCount; i++) {
    const sectionFrames = frames.slice(
      i * framesPerSection,
      (i + 1) * framesPerSection
    );

    const sectionSubtitles = subtitles.slice(
      i * subtitlesPerSection,
      (i + 1) * subtitlesPerSection
    );

    const startTime = sectionFrames[0]?.timestamp || i * 30;
    const endTime =
      sectionFrames[sectionFrames.length - 1]?.timestamp || (i + 1) * 30;

    sections.push({
      id: `section-${i}`,
      title: sectionTitles[i] || `Section ${i + 1}`,
      timestamp: startTime,
      duration: endTime - startTime,
      frames: sectionFrames,
      subtitles: sectionSubtitles,
      summary: generateSummary
        ? generateSectionSummary(sectionSubtitles, topic)
        : '',
      keyPoints: extractKeyPoints(sectionSubtitles),
    });
  }

  return sections;
}

/**
 * Get section titles based on topic
 */
function getSectionTitles(topic: string, count: number): string[] {
  const template = TUTORIAL_TEMPLATES.find((t) => t.topic === topic);
  if (template) {
    return template.sectionStructure.slice(0, count);
  }

  return Array.from({ length: count }, (_, i) => `Part ${i + 1}`);
}

/**
 * Generate section summary from subtitles
 */
function generateSectionSummary(subtitles: VideoSubtitle[], topic: string): string {
  if (subtitles.length === 0) {
    return `This section covers key aspects of ${topic}.`;
  }

  // Combine first and last subtitle for context
  const first = subtitles[0].text;
  const last = subtitles[subtitles.length - 1].text;

  return `${first} ${last}`.slice(0, 200);
}

/**
 * Extract key points from subtitles
 */
function extractKeyPoints(subtitles: VideoSubtitle[]): string[] {
  const keyPoints: string[] = [];

  for (const sub of subtitles) {
    // Look for sentences that seem like key points
    if (
      sub.text.includes('key') ||
      sub.text.includes('important') ||
      sub.text.includes('remember') ||
      sub.text.includes('The goal') ||
      sub.text.startsWith('The ') ||
      sub.text.length > 50
    ) {
      keyPoints.push(sub.text);
    }
  }

  return keyPoints.slice(0, 3);
}

/**
 * Generate tutorial title
 */
function generateTitle(topic: string, audience: string): string {
  const audiencePrefix: Record<string, string> = {
    beginner: "Beginner's Guide:",
    intermediate: 'Deep Dive:',
    advanced: 'Masterclass:',
  };

  return `${audiencePrefix[audience] || ''} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tutorial templates for selection
 */
export function getTutorialTemplates(): TutorialTemplate[] {
  return TUTORIAL_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TutorialTemplate | undefined {
  return TUTORIAL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Create config from template
 */
export function createConfigFromTemplate(template: TutorialTemplate): TutorialConfig {
  return {
    topic: template.topic,
    maxFrames: 10,
    includeSubtitles: true,
    filterByKeywords: template.suggestedKeywords,
    generateSummary: true,
    targetAudience: template.targetAudience,
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimate tutorial generation time
 */
export function estimateGenerationTime(videoUrl: string): number {
  // Rough estimate based on typical video lengths
  // In production, this would consider actual video metadata
  return 5; // seconds
}
