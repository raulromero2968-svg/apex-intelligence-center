'use client';

/**
 * AskFollowUp Component
 *
 * Perplexity-style interactive Q&A for blog posts.
 * Allows users to ask follow-up questions about article content.
 *
 * Features:
 * - Real-time question answering via API
 * - Citation support in answers
 * - Conversation threading
 * - Feedback collection
 * - Suggested follow-up questions
 *
 * Usage in MDX:
 * ```mdx
 * <AskFollowUp postSlug="pokemon-grading-guide" />
 * ```
 *
 * Or static display:
 * ```mdx
 * <AskFollowUp question="What about vintage cards?" />
 * ```
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// Types
// ============================================================================

interface Citation {
  url: string;
  title: string;
  excerpt: string;
}

interface FollowUpResponse {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  threadDepth: number;
}

interface AskFollowUpProps {
  /** Post slug for API calls */
  postSlug?: string;
  /** Post ID (alternative to slug) */
  postId?: string;
  /** Static question to display (non-interactive) */
  question?: string;
  /** Children content (alternative to question) */
  children?: React.ReactNode;
  /** Session ID for anonymous tracking */
  sessionId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Initial suggested questions */
  suggestedQuestions?: string[];
}

// ============================================================================
// Component
// ============================================================================

export default function AskFollowUp({
  postSlug,
  postId,
  question,
  children,
  sessionId,
  userId,
  suggestedQuestions = [
    'Can you explain this in more detail?',
    'What are the key takeaways?',
    'How does this compare to alternatives?',
  ],
}: AskFollowUpProps) {
  // Static display mode
  if (question || children) {
    return (
      <div className="my-6 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex gap-3">
        <MessageCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-cyan-400 mb-1">Follow-up Question</p>
          <p className="text-white/80">{question || children}</p>
        </div>
      </div>
    );
  }

  // Interactive mode requires postSlug or postId
  if (!postSlug && !postId) {
    return null;
  }

  return (
    <InteractiveAskFollowUp
      postSlug={postSlug}
      postId={postId}
      sessionId={sessionId}
      userId={userId}
      suggestedQuestions={suggestedQuestions}
    />
  );
}

// ============================================================================
// Interactive Component
// ============================================================================

function InteractiveAskFollowUp({
  postSlug,
  postId,
  sessionId,
  userId,
  suggestedQuestions,
}: {
  postSlug?: string;
  postId?: string;
  sessionId?: string;
  userId?: string;
  suggestedQuestions: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<FollowUpResponse[]>([]);
  const [suggestions, setSuggestions] = useState(suggestedQuestions);

  const inputRef = useRef<HTMLInputElement>(null);
  const responsesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new responses
  useEffect(() => {
    if (responses.length > 0) {
      responsesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = useCallback(
    async (questionText: string) => {
      if (!questionText.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/blog/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postSlug,
            postId,
            question: questionText,
            userId,
            sessionId: sessionId || crypto.randomUUID(),
            // Link to previous response if exists
            parentFollowUpId: responses.length > 0 ? responses[responses.length - 1].id : undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get answer');
        }

        const data = await response.json();

        setResponses((prev) => [
          ...prev,
          {
            id: data.followUp.id,
            question: questionText,
            answer: data.followUp.answer,
            citations: data.followUp.citations || [],
            threadDepth: data.followUp.threadDepth,
          },
        ]);

        // Update suggestions from API
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }

        setInputValue('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [postSlug, postId, userId, sessionId, responses, isLoading]
  );

  const handleFeedback = async (responseId: string, wasHelpful: boolean) => {
    try {
      await fetch('/api/blog/ask', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpId: responseId,
          wasHelpful,
        }),
      });
    } catch {
      // Silent fail for feedback
    }
  };

  // Collapsed state - show prompt to expand
  if (!isExpanded) {
    return (
      <div className="my-8">
        <button
          onClick={() => setIsExpanded(true)}
          className={clsx(
            'w-full flex items-center gap-3 p-4',
            'rounded-xl border border-cyan-500/30 bg-cyan-500/5',
            'hover:bg-cyan-500/10 hover:border-cyan-500/50',
            'transition-all duration-200',
            'group'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-white">Have a question about this article?</p>
            <p className="text-sm text-slate-400">Ask a follow-up and get an AI-powered answer</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    );
  }

  // Expanded state - full Q&A interface
  return (
    <div className="my-8 rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/30 bg-cyan-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Ask Follow-Up
          </h4>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-500 hover:text-slate-400 text-xs"
        >
          Collapse
        </button>
      </div>

      {/* Responses */}
      {responses.length > 0 && (
        <div className="max-h-96 overflow-y-auto">
          {responses.map((response, index) => (
            <ResponseItem
              key={response.id}
              response={response}
              isLast={index === responses.length - 1}
              onFeedback={handleFeedback}
            />
          ))}
          <div ref={responsesEndRef} />
        </div>
      )}

      {/* Suggested Questions */}
      {responses.length === 0 && suggestions.length > 0 && (
        <div className="p-4 border-b border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(suggestion)}
                disabled={isLoading}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm',
                  'bg-slate-800 text-slate-300',
                  'border border-slate-700 hover:border-cyan-500/50',
                  'hover:bg-slate-700 hover:text-white',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this article..."
            disabled={isLoading}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-slate-800 border border-slate-700',
              'text-white placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={clsx(
              'px-4 py-2 rounded-lg',
              'bg-cyan-500 text-white font-medium',
              'hover:bg-cyan-400 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="sr-only md:not-sr-only">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Response Item Component
// ============================================================================

function ResponseItem({
  response,
  isLast,
  onFeedback,
}: {
  response: FollowUpResponse;
  isLast: boolean;
  onFeedback: (id: string, wasHelpful: boolean) => void;
}) {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const handleFeedback = (wasHelpful: boolean) => {
    setFeedbackGiven(wasHelpful ? 'up' : 'down');
    onFeedback(response.id, wasHelpful);
  };

  return (
    <div className={clsx('border-b border-slate-700/50', isLast && 'border-b-0')}>
      {/* Question */}
      <div className="px-4 py-3 bg-slate-800/30">
        <div className="flex items-start gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <p className="text-white font-medium">{response.question}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="px-4 py-3">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{response.answer}</p>
        </div>

        {/* Citations */}
        {response.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {response.citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 rounded',
                    'text-xs text-cyan-400 bg-cyan-500/10',
                    'border border-cyan-500/30 hover:border-cyan-500/50',
                    'transition-colors'
                  )}
                  title={citation.excerpt}
                >
                  <ExternalLink className="w-3 h-3" />
                  {citation.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Was this helpful?</span>
          <button
            onClick={() => handleFeedback(true)}
            disabled={feedbackGiven !== null}
            className={clsx(
              'p-1 rounded hover:bg-slate-700 transition-colors',
              feedbackGiven === 'up' && 'text-emerald-400',
              feedbackGiven === 'down' && 'opacity-50'
            )}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={feedbackGiven !== null}
            className={clsx(
              'p-1 rounded hover:bg-slate-700 transition-colors',
              feedbackGiven === 'down' && 'text-red-400',
              feedbackGiven === 'up' && 'opacity-50'
            )}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          {feedbackGiven && (
            <span className="text-xs text-slate-500 ml-2">Thanks for your feedback!</span>
          )}
        </div>
      </div>
    </div>
  );
}
