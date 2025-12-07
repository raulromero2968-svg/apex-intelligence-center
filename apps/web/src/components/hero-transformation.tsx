'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Sparkles, ArrowRight, Lock, Fingerprint, Zap } from 'lucide-react';
import { IntelCard } from '@/components/ui/IntelCard';

type TransformationStatus = 'idle' | 'analyzing' | 'complete';

/**
 * HeroTransformation - The Command Center for Reality
 *
 * This is the most critical interaction on the platform.
 * It transforms "doomscrolling" into "monetizable intel" instantly.
 *
 * Design Philosophy:
 * - NOT a form, but a "search engine for hidden value"
 * - Massive input field commands the screen
 * - Subtle pulse indicates system is "listening"
 * - Smart detection recognizes X.com/Twitter URLs
 *
 * Flow: Input -> Analyzing -> Blurred Value Preview -> Gate
 */
export function HeroTransformation() {
  const [url, setUrl] = React.useState('');
  const [status, setStatus] = React.useState<TransformationStatus>('idle');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Check if input looks like a valid X/Twitter URL
  const isValidSource = React.useMemo(() => {
    const trimmed = url.trim();
    return (
      trimmed.length > 10 &&
      (trimmed.includes('x.com') ||
        trimmed.includes('twitter.com') ||
        trimmed.includes('threads.net') ||
        trimmed.startsWith('https://'))
    );
  }, [url]);

  // Simulate the "AI Transformation" with theatrical delay
  const handleTransform = React.useCallback(() => {
    if (!url.trim() || status === 'analyzing') return;

    setStatus('analyzing');

    // 2.5s "theater" delay - enough to feel like real processing
    setTimeout(() => {
      setStatus('complete');
    }, 2500);
  }, [url, status]);

  // Handle keyboard submission
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && isValidSource) {
        handleTransform();
      }
    },
    [handleTransform, isValidSource]
  );

  // Reset flow
  const handleReset = React.useCallback(() => {
    setUrl('');
    setStatus('idle');
    inputRef.current?.focus();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 py-16 md:py-24">
      {/* 1. The Value Proposition (H1) */}
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
          Turn Noise into{' '}
          <span className="text-[#00F0FF] glow-text">Signal</span>.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-xl mx-auto">
          Paste an X thread. Get an institutional-grade intel report.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-[#00F0FF]/70">
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by Apex Engine v1.0</span>
        </div>
      </div>

      {/* 2. The Command Input / Result */}
      <AnimatePresence mode="wait">
        {status !== 'complete' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full relative group"
          >
            {/* The Glowing Border Container - pulses when valid input */}
            <div
              className={clsx(
                'absolute -inset-1 rounded-xl bg-gradient-to-r from-[#00F0FF]/50 via-purple-600/50 to-[#00F0FF]/50 blur transition-all duration-500',
                isValidSource
                  ? 'opacity-100 animate-pulse-fast'
                  : 'opacity-20 group-hover:opacity-40'
              )}
            />

            {/* Main Input Container */}
            <div className="relative flex items-center bg-slate-950/95 backdrop-blur-xl rounded-xl border border-slate-700/50 p-2 shadow-2xl">
              {/* Sparkles Icon */}
              <div className="pl-4 text-muted-foreground">
                <Sparkles
                  className={clsx(
                    'w-5 h-5 transition-colors duration-300',
                    isValidSource ? 'text-[#00F0FF]' : ''
                  )}
                />
              </div>

              {/* The Input Field - Massive, Commanding */}
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Input Source Intelligence..."
                disabled={status === 'analyzing'}
                className={clsx(
                  'flex-1 bg-transparent border-none px-4 py-4',
                  'text-lg md:text-xl text-white font-mono',
                  'focus:outline-none focus:ring-0',
                  'placeholder:text-slate-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
              />

              {/* Transform Button */}
              <button
                type="button"
                onClick={handleTransform}
                disabled={status === 'analyzing' || !isValidSource}
                className={clsx(
                  'flex items-center justify-center gap-2',
                  'min-h-[48px] px-4 md:px-6 rounded-lg',
                  'font-semibold text-sm md:text-base tracking-wide',
                  'transition-all duration-300 ease-out',
                  'disabled:cursor-not-allowed',
                  isValidSource
                    ? 'bg-[#00F0FF] text-black hover:bg-[#33F3FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] w-auto md:w-36'
                    : 'bg-slate-800 text-slate-500 w-12'
                )}
              >
                {status === 'analyzing' ? (
                  <span className="animate-spin text-lg">⟳</span>
                ) : isValidSource ? (
                  'TRANSFORM'
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Contextual Helper - Analysis Progress */}
            <AnimatePresence>
              {status === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-mono"
                >
                  <span className="text-[#00F0FF] animate-pulse">
                    Analyzing Sentiment...
                  </span>
                  <span className="text-slate-600">|</span>
                  <span
                    className="text-purple-400 animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  >
                    Checking Author Reputation...
                  </span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span
                    className="text-emerald-400 animate-pulse hidden md:inline"
                    style={{ animationDelay: '0.4s' }}
                  >
                    Extracting Value Signals...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* 3. The "Hook" Result - Blurred Preview with Gate */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md relative"
          >
            {/* The Actual Card (Blurred) */}
            <div className="filter blur-sm pointer-events-none select-none">
              <IntelCard
                title="The Economic Impact of AI on TCG Markets"
                excerpt="Analysis of recent market trends indicates a massive shift in collector behavior driven by AI-powered valuation tools and predictive analytics..."
                author="@CryptoWhale"
                rcPrice={50}
                usdPrice={5.0}
                views={1204}
                sentiment="bullish"
                grade="S"
              />
            </div>

            {/* The "Gate" Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-[2px] border border-[#00F0FF]/30 p-6 text-center">
              {/* Lock Icon with Glow */}
              <div className="h-14 w-14 rounded-full bg-[#00F0FF]/20 flex items-center justify-center mb-4 ring-1 ring-[#00F0FF]/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                <Lock className="w-7 h-7 text-[#00F0FF]" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Report Ready
              </h3>

              <p className="text-sm text-slate-300 mb-6 max-w-xs leading-relaxed">
                This intel report has been generated. Sign up free to unlock it
                and earn your first{' '}
                <span className="text-[#00F0FF] font-mono font-semibold">
                  10 RC
                </span>
                .
              </p>

              {/* Primary CTA */}
              <button
                type="button"
                className={clsx(
                  'w-full py-3 px-6 rounded-lg',
                  'bg-[#00F0FF] text-black font-bold tracking-wider',
                  'hover:bg-[#33F3FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]',
                  'transition-all duration-200'
                )}
              >
                CLAIM REPORT
              </button>

              {/* Secondary action */}
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Try another source
              </button>

              {/* Trust indicator */}
              <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                Verified Human Curator
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {status === 'idle' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-xs text-slate-500 text-center font-mono"
        >
          Supports X.com, Twitter, and Threads URLs
        </motion.p>
      )}
    </section>
  );
}

export default HeroTransformation;
