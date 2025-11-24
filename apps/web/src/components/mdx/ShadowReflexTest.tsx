'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Brain, Shield, Eye, Wrench, Sparkles } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  shadowAnswer: 'A' | 'B';
  warningA?: string;
  warningB?: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'How does this situation make you feel?',
    optionA: 'It threatens our actual survival/safety.',
    optionB: 'It makes us uncomfortable or awkward.',
    shadowAnswer: 'B',
    warningB: 'Be careful. Discomfort is not danger. Don\'t upgrade awkwardness to a threat.',
  },
  {
    id: 2,
    question: 'Who does your proposed solution primarily protect?',
    optionA: 'The people / The users.',
    optionB: 'The Institution / Our Reputation.',
    shadowAnswer: 'B',
    warningB: 'Protecting the institution at the expense of people is the "Shadow Reflex." Proceed with extreme caution.',
  },
  {
    id: 3,
    question: 'How would a complete outsider view this decision?',
    optionA: 'As a fair, legible standard.',
    optionB: 'As a wall of unwritten rules.',
    shadowAnswer: 'B',
  },
  {
    id: 4,
    question: 'If this goes wrong, is there a path for repair?',
    optionA: 'Yes, we can apologize and adjust.',
    optionB: 'No, the bridge will be burned.',
    shadowAnswer: 'B',
  },
];

export function ShadowReflexTest() {
  const [step, setStep] = useState<'intro' | 'question' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<('A' | 'B')[]>([]);
  const [showWarning, setShowWarning] = useState<string | null>(null);

  const handleStart = () => {
    setStep('question');
    setCurrentQuestion(0);
    setAnswers([]);
    setShowWarning(null);
  };

  const handleAnswer = (answer: 'A' | 'B') => {
    const question = questions[currentQuestion];
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Check for warning
    if (answer === 'A' && question.warningA) {
      setShowWarning(question.warningA);
    } else if (answer === 'B' && question.warningB) {
      setShowWarning(question.warningB);
    } else {
      setShowWarning(null);
    }

    // Move to next question or result
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowWarning(null);
      } else {
        setStep('result');
      }
    }, showWarning || (answer === 'A' && question.warningA) || (answer === 'B' && question.warningB) ? 3000 : 800);
  };

  const calculateResult = () => {
    let shadowCount = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].shadowAnswer) {
        shadowCount++;
      }
    });
    return shadowCount;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4,
      },
    },
  };

  const glowVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="my-8 relative">
      {/* Background Glow */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 blur-3xl -z-10"
      />

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-8 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-cyan-400" />
              <h3 className="text-2xl font-bold text-white">The Shadow Reflex Test</h3>
            </div>
            <p className="text-lg text-cyan-400 mb-4">
              Are you seeing clearly, or firing at shadows?
            </p>
            <p className="text-gray-300 mb-6">
              A quick diagnostic for risky decisions, conflict, and crisis response.
            </p>
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Begin Diagnostic
            </button>
          </motion.div>
        )}

        {step === 'question' && (
          <motion.div
            key={`question-${currentQuestion}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-8 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm text-cyan-400">
                  {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <h4 className="text-xl font-semibold text-white mb-6">
              {questions[currentQuestion].question}
            </h4>

            <div className="space-y-4">
              <button
                onClick={() => handleAnswer('A')}
                className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-cyan-400 flex items-center justify-center mt-0.5 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-cyan-400 transition-colors" />
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
                    {questions[currentQuestion].optionA}
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleAnswer('B')}
                className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-cyan-400 flex items-center justify-center mt-0.5 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-cyan-400 transition-colors" />
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
                    {questions[currentQuestion].optionB}
                  </span>
                </div>
              </button>
            </div>

            {/* Warning Display */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-200 text-sm">{showWarning}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-8 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            {calculateResult() >= 2 ? (
              // Shadow Reflex Detected
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-amber-400" />
                  <h3 className="text-2xl font-bold text-amber-400">Shadow Reflex Detected</h3>
                </div>
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-200">
                    You are likely reacting out of fear. Pause. Use your intelligence to understand, not to win.
                  </p>
                </div>
                <div className="space-y-3 text-gray-300">
                  <p className="flex items-start gap-2">
                    <Eye className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Take a step back and examine your motivations.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Brain className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Are you protecting people, or protecting your image?</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Wrench className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Build systems that can be repaired, not just defended.</span>
                  </p>
                </div>
              </>
            ) : (
              // Tuned Nervous System
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-cyan-400">Tuned Nervous System</h3>
                </div>
                <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-cyan-200">
                    You are acting with discernment. Proceed with care.
                  </p>
                </div>
                <div className="space-y-3 text-gray-300">
                  <p className="flex items-start gap-2">
                    <Eye className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>You're seeing the situation clearly.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Brain className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Your response is calibrated to the actual threat level.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Wrench className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>You've built in room for repair and adjustment.</span>
                  </p>
                </div>
              </>
            )}

            <button
              onClick={handleStart}
              className="mt-6 w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 border border-gray-700 hover:border-cyan-500/50"
            >
              Take Test Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
