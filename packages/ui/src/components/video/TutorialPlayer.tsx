/**
 * Tutorial Player Component
 *
 * UI for viewing and interacting with generated TCG tutorials.
 * Displays frames, subtitles, and section navigation.
 *
 * Features:
 * - Frame-by-frame navigation
 * - Section jumping
 * - Subtitle display with highlighting
 * - Key points summary
 *
 * Trade-offs:
 * ✅ GOOD: Educational content for job protection messaging
 * ✅ GOOD: Clean section-based navigation
 * ❌ BAD: Not actual video playback
 * ❌ BAD: Requires generated content
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface VideoFrame {
  index: number;
  timestamp: number;
  imageUrl: string;
  description?: string;
}

interface VideoSubtitle {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

interface TutorialSection {
  id: string;
  title: string;
  timestamp: number;
  duration: number;
  frames: VideoFrame[];
  subtitles: VideoSubtitle[];
  summary: string;
  keyPoints: string[];
}

interface GeneratedTutorial {
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

interface TutorialPlayerProps {
  tutorial?: GeneratedTutorial;
  videoUrl?: string;
  topic?: string;
  onGenerate?: (tutorial: GeneratedTutorial) => void;
  compact?: boolean;
}

// ============================================================================
// MOCK GENERATE FUNCTION (Replace with actual import in production)
// ============================================================================

async function generateTutorial(
  videoUrl: string,
  config: { topic: string }
): Promise<GeneratedTutorial> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const sections: TutorialSection[] = [
    {
      id: 'intro',
      title: 'Introduction',
      timestamp: 0,
      duration: 30,
      frames: [
        { index: 0, timestamp: 0, imageUrl: '/placeholder-frame-1.jpg', description: 'Welcome slide' },
        { index: 1, timestamp: 15, imageUrl: '/placeholder-frame-2.jpg', description: 'Overview' },
      ],
      subtitles: [
        { index: 0, startTime: 0, endTime: 10, text: "Welcome to today's tutorial on how AI can help your team." },
        { index: 1, startTime: 10, endTime: 20, text: "Let's start by understanding what automation really means." },
        { index: 2, startTime: 20, endTime: 30, text: "AI doesn't replace jobs—it transforms them." },
      ],
      summary: 'Introduction to AI augmentation in the workplace.',
      keyPoints: ['AI transforms, not replaces', 'Focus on augmentation'],
    },
    {
      id: 'benefits',
      title: 'AI Benefits',
      timestamp: 30,
      duration: 45,
      frames: [
        { index: 2, timestamp: 35, imageUrl: '/placeholder-frame-3.jpg', description: 'Benefits chart' },
        { index: 3, timestamp: 55, imageUrl: '/placeholder-frame-4.jpg', description: 'Team collaboration' },
      ],
      subtitles: [
        { index: 3, startTime: 30, endTime: 45, text: 'The key is to focus on skills that complement AI.' },
        { index: 4, startTime: 45, endTime: 60, text: 'Think of AI as your co-pilot, not your replacement.' },
        { index: 5, startTime: 60, endTime: 75, text: 'Creative and strategic thinking remain uniquely human.' },
      ],
      summary: 'How AI enhances human capabilities rather than replacing them.',
      keyPoints: ['AI as co-pilot', 'Human skills remain valuable', 'Complementary capabilities'],
    },
    {
      id: 'skills',
      title: 'Reskilling',
      timestamp: 75,
      duration: 40,
      frames: [
        { index: 4, timestamp: 80, imageUrl: '/placeholder-frame-5.jpg', description: 'Skills roadmap' },
        { index: 5, timestamp: 100, imageUrl: '/placeholder-frame-6.jpg', description: 'Training programs' },
      ],
      subtitles: [
        { index: 6, startTime: 75, endTime: 90, text: 'Reskilling programs are essential for smooth transitions.' },
        { index: 7, startTime: 90, endTime: 105, text: 'Many companies report increased job satisfaction with AI tools.' },
        { index: 8, startTime: 105, endTime: 115, text: 'The goal is augmentation, not substitution.' },
      ],
      summary: 'Importance of reskilling and continuous learning.',
      keyPoints: ['Reskilling is essential', 'Job satisfaction increases', 'Augmentation over substitution'],
    },
    {
      id: 'success',
      title: 'Success Stories',
      timestamp: 115,
      duration: 35,
      frames: [
        { index: 6, timestamp: 120, imageUrl: '/placeholder-frame-7.jpg', description: 'Case study' },
        { index: 7, timestamp: 140, imageUrl: '/placeholder-frame-8.jpg', description: 'Statistics' },
      ],
      subtitles: [
        { index: 9, startTime: 115, endTime: 130, text: "Let's look at some real success stories." },
        { index: 10, startTime: 130, endTime: 145, text: 'Teams using AI report 30% more time for creative work.' },
        { index: 11, startTime: 145, endTime: 150, text: 'Communication and leadership skills become more valuable.' },
      ],
      summary: 'Real-world examples of successful AI integration.',
      keyPoints: ['30% more creative time', 'Soft skills matter more'],
    },
    {
      id: 'action',
      title: 'Action Steps',
      timestamp: 150,
      duration: 30,
      frames: [
        { index: 8, timestamp: 155, imageUrl: '/placeholder-frame-9.jpg', description: 'Action items' },
        { index: 9, timestamp: 170, imageUrl: '/placeholder-frame-10.jpg', description: 'Closing' },
      ],
      subtitles: [
        { index: 12, startTime: 150, endTime: 160, text: 'Start by identifying repetitive tasks in your workflow.' },
        { index: 13, startTime: 160, endTime: 170, text: 'AI can handle data processing while you focus on insights.' },
        { index: 14, startTime: 170, endTime: 180, text: 'The future belongs to those who adapt and learn.' },
      ],
      summary: 'Practical steps to get started with AI augmentation.',
      keyPoints: ['Identify repetitive tasks', 'Focus on insights', 'Adapt and learn'],
    },
  ];

  return {
    id: `tutorial-${Date.now()}`,
    title: `Guide: ${config.topic}`,
    topic: config.topic,
    sourceVideoUrl: videoUrl,
    sections,
    totalDuration: 180,
    thumbnailUrl: '/placeholder-thumb.jpg',
    generatedAt: new Date(),
    metadata: {
      sourceCreator: 'TCG_Expert',
      frameCount: 10,
      subtitleCount: 15,
      processingTime: 1850,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SectionNav({
  sections,
  activeSection,
  onSectionClick,
}: {
  sections: TutorialSection[];
  activeSection: number;
  onSectionClick: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sections.map((section, i) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(i)}
          className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            i === activeSection
              ? 'bg-cyan-500 text-black font-medium'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {section.title}
        </button>
      ))}
    </div>
  );
}

function FrameViewer({
  frames,
  activeFrame,
  onFrameClick,
}: {
  frames: VideoFrame[];
  activeFrame: number;
  onFrameClick: (index: number) => void;
}) {
  const frame = frames[activeFrame];

  return (
    <div className="space-y-3">
      {/* Main Frame */}
      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {frame ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 flex items-center justify-center">
              <span className="text-6xl">🎬</span>
            </div>
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded text-xs text-white">
              {formatTimestamp(frame.timestamp)}
            </div>
            {frame.description && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-cyan-400">
                {frame.description}
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-500">No frame available</span>
        )}
      </div>

      {/* Frame Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((f, i) => (
          <button
            key={f.index}
            onClick={() => onFrameClick(i)}
            className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-colors ${
              i === activeFrame ? 'border-cyan-500' : 'border-transparent hover:border-gray-600'
            }`}
          >
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {i + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubtitleDisplay({
  subtitles,
  currentTime,
}: {
  subtitles: VideoSubtitle[];
  currentTime: number;
}) {
  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 min-h-[80px]">
      {activeSubtitle ? (
        <p className="text-white text-center">{activeSubtitle.text}</p>
      ) : (
        <p className="text-gray-500 text-center italic">
          {subtitles.length > 0 ? 'Navigate frames to see subtitles' : 'No subtitles available'}
        </p>
      )}
    </div>
  );
}

function KeyPointsList({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-3">
      <h4 className="text-xs font-medium text-cyan-400 mb-2">Key Points</h4>
      <ul className="space-y-1">
        {points.map((point, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TutorialPlayer({
  tutorial: initialTutorial,
  videoUrl,
  topic = 'AI job protection',
  onGenerate,
  compact = false,
}: TutorialPlayerProps) {
  const [tutorial, setTutorial] = useState<GeneratedTutorial | null>(initialTutorial || null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [activeFrame, setActiveFrame] = useState(0);
  const [inputUrl, setInputUrl] = useState(videoUrl || '');

  const handleGenerate = useCallback(async () => {
    if (!inputUrl.trim()) return;

    setLoading(true);
    try {
      const result = await generateTutorial(inputUrl, { topic });
      setTutorial(result);
      setActiveSection(0);
      setActiveFrame(0);
      onGenerate?.(result);
    } catch (error) {
      console.error('Tutorial generation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [inputUrl, topic, onGenerate]);

  const currentSection = tutorial?.sections[activeSection];
  const currentTime = currentSection?.frames[activeFrame]?.timestamp || 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              {tutorial?.title || 'Tutorial Generator'}
            </h3>
            {tutorial && (
              <p className="text-sm text-gray-400 mt-1">
                {formatTimestamp(tutorial.totalDuration)} • {tutorial.sections.length} sections
              </p>
            )}
          </div>
          {tutorial && (
            <div className="text-right text-xs text-gray-500">
              <p>By {tutorial.metadata.sourceCreator}</p>
              <p>{tutorial.metadata.frameCount} frames</p>
            </div>
          )}
        </div>
      </div>

      {/* Generator Input */}
      {!tutorial && (
        <div className="p-4 border-b border-gray-700">
          <label className="block text-sm text-gray-400 mb-2">
            Enter X video URL to generate tutorial
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://x.com/user/status/..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !inputUrl.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-black font-medium rounded-lg transition-colors"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Topic: <span className="text-cyan-400">{topic}</span>
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-400">Generating tutorial...</p>
          <p className="text-xs text-gray-500">Extracting frames and subtitles</p>
        </div>
      )}

      {/* Tutorial Content */}
      {tutorial && !loading && (
        <div className={compact ? '' : 'grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700'}>
          {/* Main Content */}
          <div className={compact ? '' : 'md:col-span-2'}>
            {/* Section Navigation */}
            <div className="p-4 border-b border-gray-700">
              <SectionNav
                sections={tutorial.sections}
                activeSection={activeSection}
                onSectionClick={(i) => {
                  setActiveSection(i);
                  setActiveFrame(0);
                }}
              />
            </div>

            {/* Frame Viewer */}
            <div className="p-4">
              {currentSection && (
                <FrameViewer
                  frames={currentSection.frames}
                  activeFrame={activeFrame}
                  onFrameClick={setActiveFrame}
                />
              )}
            </div>

            {/* Subtitle */}
            <div className="px-4 pb-4">
              {currentSection && (
                <SubtitleDisplay
                  subtitles={currentSection.subtitles}
                  currentTime={currentTime}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          {!compact && (
            <div className="p-4 space-y-4">
              {/* Current Section Info */}
              {currentSection && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-white">{currentSection.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(currentSection.timestamp)} - {formatTimestamp(currentSection.timestamp + currentSection.duration)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-400">
                    {currentSection.summary}
                  </div>

                  <KeyPointsList points={currentSection.keyPoints} />
                </>
              )}

              {/* All Subtitles */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Transcript</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentSection?.subtitles.map((sub) => (
                    <div
                      key={sub.index}
                      className={`text-xs p-2 rounded ${
                        currentTime >= sub.startTime && currentTime < sub.endTime
                          ? 'bg-cyan-900/30 text-cyan-300'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="text-gray-600 mr-2">{formatTimestamp(sub.startTime)}</span>
                      {sub.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {tutorial && (
        <div className="p-3 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between text-xs text-gray-500">
          <span>Generated in {tutorial.metadata.processingTime}ms</span>
          <button
            onClick={() => setTutorial(null)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Generate New
          </button>
        </div>
      )}

      {/* Empty State */}
      {!tutorial && !loading && (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-400">Enter a video URL to generate a tutorial</p>
          <p className="text-sm text-gray-500 mt-2">
            Creates educational content from X videos
          </p>
        </div>
      )}
    </div>
  );
}

export default TutorialPlayer;
