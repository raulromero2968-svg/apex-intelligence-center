'use client';

/**
 * Tutorial Player Component
 *
 * Displays AI-generated tutorials from X videos with:
 * - Frame gallery
 * - Script display
 * - Progress tracking
 *
 * @see lib/video-tcg for tutorial generation
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TutorialPlayerProps {
  videoUrl?: string;
  topic?: string;
  className?: string;
}

interface Tutorial {
  frames: string[];
  subtitles: string;
  topic: string;
}

interface TutorialResult {
  tutorial: Tutorial;
  script: string;
}

export function TutorialPlayer({
  videoUrl: initialVideoUrl = '',
  topic: initialTopic = '',
  className,
}: TutorialPlayerProps) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [tutorial, setTutorial] = useState<TutorialResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFrame, setActiveFrame] = useState(0);

  const generate = useCallback(async () => {
    if (!videoUrl.trim() || !topic.trim()) {
      setError('Please enter both a video URL and topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, this would call the API
      // const response = await fetch('/api/video-tcg/generate', {
      //   method: 'POST',
      //   body: JSON.stringify({ videoUrl, topic }),
      // });
      // const data = await response.json();

      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTutorial: TutorialResult = {
        tutorial: {
          frames: [
            '/frames/tutorial_1.jpg',
            '/frames/tutorial_2.jpg',
            '/frames/tutorial_3.jpg',
            '/frames/tutorial_4.jpg',
            '/frames/tutorial_5.jpg',
          ],
          subtitles: `Key points about ${topic}:\n- Market analysis fundamentals\n- Price trend identification\n- Volume and sentiment correlation`,
          topic,
        },
        script: `## ${topic} Tutorial

### Introduction
Welcome to this comprehensive guide on ${topic} in the TCG market.

### Key Concepts

**1. Market Fundamentals**
Understanding market dynamics is crucial for any TCG collector or investor. Price movements are driven by supply, demand, and market sentiment.

**2. Price Analysis**
When analyzing prices, consider:
- Historical price trends
- Population reports (PSA, BGS, CGC)
- Recent sale volumes
- Cross-platform price differences

**3. Sentiment Indicators**
Community sentiment often precedes price movements. Monitor:
- Social media discussions
- Influencer opinions
- Tournament results impact

### Best Practices

1. **Research Before Buying**: Always check multiple sources
2. **Diversify Holdings**: Don't put all value in one card
3. **Set Price Alerts**: Use tools to track opportunities
4. **Verify Authenticity**: Especially for high-value cards

### Conclusion
Success in TCG investing requires patience, research, and continuous learning.`,
      };

      setTutorial(mockTutorial);
      setActiveFrame(0);
    } catch (err) {
      setError('Failed to generate tutorial');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  }, [videoUrl, topic]);

  return (
    <div className={cn('bg-gray-900 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Tutorial Generator</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="X/Twitter video URL..."
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-gray-800 text-cyan-300 placeholder-gray-500',
              'border border-gray-700 focus:border-cyan-500',
              'outline-none transition-colors'
            )}
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic to focus on..."
              className={cn(
                'flex-1 px-4 py-3 rounded-lg',
                'bg-gray-800 text-cyan-300 placeholder-gray-500',
                'border border-gray-700 focus:border-cyan-500',
                'outline-none transition-colors'
              )}
            />
            <button
              onClick={generate}
              disabled={loading}
              className={cn(
                'px-6 py-3 rounded-lg font-bold transition-all',
                'bg-gradient-to-r from-purple-600 to-cyan-600',
                'hover:from-purple-500 hover:to-cyan-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-white whitespace-nowrap'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating
                </span>
              ) : (
                'Generate Tutorial'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tutorial Content */}
      {tutorial && !error && (
        <div className="p-6 space-y-6">
          {/* Topic Header */}
          <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              {tutorial.tutorial.topic}
            </h3>
            <p className="text-gray-400 mt-1">AI-generated tutorial from video content</p>
          </div>

          {/* Frames Gallery */}
          {tutorial.tutorial.frames.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Key Frames</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {tutorial.tutorial.frames.map((frame, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFrame(index)}
                    className={cn(
                      'aspect-video rounded-lg overflow-hidden',
                      'bg-gray-800 border-2 transition-all duration-200',
                      activeFrame === index
                        ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'border-gray-700 hover:border-gray-600'
                    )}
                  >
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Frame {index + 1}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Script Content */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Tutorial Script</h4>
            <div className={cn(
              'bg-gray-800/50 rounded-lg p-6',
              'border border-gray-700',
              'prose prose-invert prose-cyan max-w-none'
            )}>
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                {tutorial.script.split('\n').map((line, index) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-bold text-white mt-6 mb-4">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-semibold text-cyan-200 mt-4 mb-2">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('**')) {
                    return (
                      <p key={index} className="font-semibold text-purple-300 mt-3">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4 text-gray-300">
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <li key={index} className="ml-4 text-gray-300 list-decimal">
                        {line.replace(/^\d+\.\s*/, '')}
                      </li>
                    );
                  }
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  return (
                    <p key={index} className="text-gray-300 my-2">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subtitles */}
          {tutorial.tutorial.subtitles && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Extracted Key Points</h4>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                  {tutorial.tutorial.subtitles}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!tutorial && !loading && !error && (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">
            Enter a video URL and topic to generate an AI tutorial
          </p>
        </div>
      )}
    </div>
  );
}

export default TutorialPlayer;
