"use client";

import { useState, useCallback } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PaperGeneratorProps {
  onGenerate?: (paper: GeneratedPaperResult) => void;
  defaultTopic?: string;
}

interface GeneratedPaperResult {
  id: string;
  title: string;
  abstract: string;
  content: string;
  format: string;
  citationStyle: string;
  totalCitations: number;
  totalSynthesis: number;
  sourceCount: number;
}

interface GenerationConfig {
  style: 'academic' | 'technical' | 'review' | 'whitepaper';
  citationStyle: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';
  format: 'markdown' | 'latex' | 'html';
  sections: string[];
}

const DEFAULT_SECTIONS = [
  'abstract',
  'introduction',
  'literature_review',
  'results',
  'discussion',
  'conclusion',
  'references',
];

const SECTION_LABELS: Record<string, string> = {
  abstract: 'Abstract',
  introduction: 'Introduction',
  literature_review: 'Literature Review',
  methodology: 'Methodology',
  results: 'Results',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
  references: 'References',
};

export default function PaperGenerator({
  onGenerate,
  defaultTopic = '',
}: PaperGeneratorProps) {
  const [topic, setTopic] = useState(defaultTopic);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ section: '', percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    style: 'academic',
    citationStyle: 'apa',
    format: 'markdown',
    sections: DEFAULT_SECTIONS,
  });

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a research topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({ section: 'Initializing...', percentage: 0 });

    try {
      const response = await fetch('/api/papers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          searchQuery: searchQuery || undefined,
          config: {
            style: config.style,
            citationStyle: config.citationStyle,
            format: config.format,
            sections: config.sections,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Generation failed');
      }

      const data = await response.json();
      setProgress({ section: 'Complete', percentage: 100 });

      if (onGenerate) {
        onGenerate(data.paper);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, searchQuery, config, onGenerate]);

  const toggleSection = (section: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
  };

  return (
    <div className="rounded-xl border border-neon-purple/30 bg-cyber-dark/80 p-6 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-purple/20">
          <FileText className="h-5 w-5 text-neon-purple" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Paper Generator
          </h2>
          <p className="text-sm text-gray-400">
            Generate scientific papers from your research
          </p>
        </div>
      </div>

      {/* Topic Input */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Research Topic *
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., DMT and Ego Dissolution: A Neuroscience Perspective on Selfhood"
          className="w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-3 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          rows={3}
          disabled={isGenerating}
        />
      </div>

      {/* Search Query (Optional) */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Source Search Query{' '}
          <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your uploaded documents..."
          className="w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          disabled={isGenerating}
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty to use topic as search query
        </p>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mb-4 flex items-center gap-2 text-sm text-neon-cyan hover:text-neon-cyan/80"
        disabled={isGenerating}
      >
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mb-6 space-y-4 rounded-lg border border-gray-700/50 bg-cyber-darker/50 p-4">
          {/* Style */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Paper Style
            </label>
            <div className="flex flex-wrap gap-2">
              {(['academic', 'technical', 'review', 'whitepaper'] as const).map(
                (style) => (
                  <button
                    key={style}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, style }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                      config.style === style
                        ? 'bg-neon-cyan text-cyber-dark'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                    disabled={isGenerating}
                  >
                    {style}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Citation Style */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Citation Style
            </label>
            <div className="flex flex-wrap gap-2">
              {(['apa', 'mla', 'chicago', 'ieee', 'harvard'] as const).map(
                (citationStyle) => (
                  <button
                    key={citationStyle}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, citationStyle }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-sm uppercase transition-colors ${
                      config.citationStyle === citationStyle
                        ? 'bg-neon-purple text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                    disabled={isGenerating}
                  >
                    {citationStyle}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Output Format */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Output Format
            </label>
            <div className="flex flex-wrap gap-2">
              {(['markdown', 'latex', 'html'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, format }))
                  }
                  className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                    config.format === format
                      ? 'bg-neon-pink text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                  disabled={isGenerating}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Sections to Generate
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    config.sections.includes(key)
                      ? 'bg-green-600/80 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={isGenerating}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Progress Display */}
      {isGenerating && (
        <div className="mb-4 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-300">{progress.section}</span>
            <span className="text-neon-cyan">{progress.percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !topic.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-cyan px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Paper...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate Paper
          </>
        )}
      </button>

      {/* Help Text */}
      <p className="mt-4 text-center text-xs text-gray-500">
        Papers are generated using RAG-Fusion with citation enforcement.
        <br />
        Upload research documents first for best results.
      </p>
    </div>
  );
}
