'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { shadowReflexTest } from '@/content/commons/shadow-reflex-test';

/**
 * ShadowReflexTest Component
 *
 * Interactive test that provides immediate value.
 * Users can engage with one question as a teaser or explore all five.
 */
export function ShadowReflexTest() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFullTest, setShowFullTest] = useState(false);

  const currentQuestion = shadowReflexTest.questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === shadowReflexTest.questions.length - 1;

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleStartTest = () => {
    setShowFullTest(true);
    setCurrentQuestionIndex(0);
  };

  // Teaser view - shows just the first question
  if (!showFullTest) {
    return (
      <section className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 rounded-3xl blur-3xl" />

        <div className="relative border border-slate-700/50 rounded-2xl bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/30 border border-orange-500/30 text-orange-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Immediate Value
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {shadowReflexTest.title}
            </h2>

            <p className="text-lg text-slate-400">
              {shadowReflexTest.subtitle}
            </p>
          </div>

          {/* Introduction */}
          <p className="text-white/80 leading-relaxed">
            {shadowReflexTest.introduction}
          </p>

          {/* Teaser Question Card */}
          <div className="p-8 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-orange-500/30 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-sm">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {shadowReflexTest.questions[0].question}
                </h3>
              </div>

              <p className="text-slate-300 leading-relaxed pl-11">
                {shadowReflexTest.questions[0].explanation}
              </p>

              <div className="pl-11 pt-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-400 italic">
                  <span className="text-cyan-400 font-medium not-italic">Reflect:</span>{' '}
                  {shadowReflexTest.questions[0].reflection}
                </p>
              </div>
            </div>
          </div>

          {/* CTA to view full test */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <button
              onClick={handleStartTest}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="w-5 h-5" />
              Run the Full Test
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Value callout */}
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
            <p className="text-sm text-white/80">
              <span className="font-semibold text-cyan-400">No signup required.</span>{' '}
              {shadowReflexTest.callout.message}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Full test view - interactive questions
  return (
    <section className="relative max-w-4xl mx-auto px-6 py-16">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 rounded-3xl blur-3xl" />

      <div className="relative border border-slate-700/50 rounded-2xl bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/30 border border-orange-500/30 text-orange-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Question {currentQuestionIndex + 1} of {shadowReflexTest.questions.length}
            </div>

            <button
              onClick={() => setShowFullTest(false)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Exit Test
            </button>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {shadowReflexTest.title}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
            style={{
              width: `${((currentQuestionIndex + 1) / shadowReflexTest.questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Current Question */}
        <div className="p-8 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-orange-500/30 space-y-6 min-h-[300px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
                <span className="text-orange-400 font-bold">{currentQuestion.id}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">
                {currentQuestion.question}
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed pl-13">
              {currentQuestion.explanation}
            </p>

            <div className="pl-13 pt-6 border-t border-slate-700/50">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-slate-300">
                  <span className="text-cyan-400 font-semibold">Reflect:</span>{' '}
                  {currentQuestion.reflection}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              Next Question
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-medium">
              <CheckCircle className="w-5 h-5" />
              Test Complete
            </div>
          )}
        </div>

        {/* How to Use section (shown on last question) */}
        {isLastQuestion && (
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {shadowReflexTest.usage.heading}
            </h4>
            <ul className="space-y-2">
              {shadowReflexTest.usage.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mt-0.5">
                    <span className="text-cyan-400 text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
