'use client';

import { useState } from 'react';

type Answer = 'people' | 'reputation' | null;

interface Insight {
  title: string;
  message: string;
  reflection: string;
}

const insights: Record<Exclude<Answer, null>, Insight> = {
  people: {
    title: "Protecting the People",
    message: "You've identified the right anchor. But here's the harder question:",
    reflection: "Are you sure? Sometimes 'protecting people' is what we tell ourselves when we're actually protecting our image of being 'the good one.' The Shadow Reflex doesn't care about your intentions—it cares about your patterns."
  },
  reputation: {
    title: "Protecting Your Reputation",
    message: "Thank you for the honesty. That's the first step toward discernment.",
    reflection: "Protecting reputation often masquerades as wisdom. We call it 'being strategic' or 'waiting for the right moment.' But fear that serves your image will always betray the people who need you to act. Be careful."
  }
};

export default function ShadowReflexTest() {
  const [answer, setAnswer] = useState<Answer>(null);
  const [showReflection, setShowReflection] = useState(false);

  const handleAnswer = (choice: Exclude<Answer, null>) => {
    setAnswer(choice);
    setShowReflection(false);
    // Auto-show reflection after 1.5s
    setTimeout(() => setShowReflection(true), 1500);
  };

  const handleReset = () => {
    setAnswer(null);
    setShowReflection(false);
  };

  return (
    <div className="not-prose my-8">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-black/40 via-purple-900/10 to-black/40 backdrop-blur-md shadow-2xl shadow-cyan-400/10">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/30 px-6 py-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            The Shadow Reflex Test
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            A tool for checking whether you're seeing clearly or firing at shadows
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!answer ? (
            // Question State
            <div className="space-y-6">
              <div className="rounded-lg bg-black/40 p-6 border border-white/5">
                <p className="text-lg text-white leading-relaxed">
                  Think of a decision you're afraid to make.
                </p>
                <p className="mt-4 text-lg text-white leading-relaxed">
                  Who does your fear protect:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleAnswer('people')}
                  className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 px-6 py-4 text-white font-semibold border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20 hover:scale-[1.02]"
                >
                  <span className="relative z-10">The People</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-cyan-600/0 group-hover:from-cyan-400/10 group-hover:to-cyan-600/10 transition-all duration-300" />
                </button>

                <button
                  onClick={() => handleAnswer('reputation')}
                  className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 px-6 py-4 text-white font-semibold border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/20 hover:scale-[1.02]"
                >
                  <span className="relative z-10">My Reputation</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/10 transition-all duration-300" />
                </button>
              </div>
            </div>
          ) : (
            // Result State
            <div className="space-y-6">
              {/* Initial Insight */}
              <div className="rounded-lg bg-black/40 p-6 border border-white/5">
                <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-3">
                  {insights[answer].title}
                </h4>
                <p className="text-white/90 leading-relaxed">
                  {insights[answer].message}
                </p>
              </div>

              {/* Deeper Reflection (appears after delay) */}
              <div
                className={`overflow-hidden transition-all duration-700 ${
                  showReflection ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6 border border-orange-400/30">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h5 className="text-sm font-semibold text-orange-400 mb-2">
                        The Deeper Question
                      </h5>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {insights[answer].reflection}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all duration-200"
                >
                  ↻ Try Another Decision
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-white/10 bg-black/30 px-6 py-3">
          <p className="text-xs text-gray-500 text-center">
            This test doesn't judge. It reveals patterns. Use it as a diagnostic, not a verdict.
          </p>
        </div>
      </div>
    </div>
  );
}
