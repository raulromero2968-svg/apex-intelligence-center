'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Layers, Check, ArrowRight, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<'investor' | 'collector' | null>(null);
  const router = useRouter();

  const handleComplete = () => {
    // In a real app, we would save this to the User profile in the DB
    router.push('/portfolio');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div
            className="h-full bg-cyan-500"
            initial={{ width: '0%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">

            {/* STEP 1: Define Persona */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">Initialize Intelligence Profile</h2>
                  <p className="text-slate-400">Select your primary operating mode.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investor Card */}
                  <button
                    onClick={() => setPersona('investor')}
                    className={`p-6 border rounded-xl text-left transition-all ${
                      persona === 'investor'
                        ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center mb-4 text-cyan-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">The Investor</h3>
                    <p className="text-sm text-slate-400">
                      "I need data, not drama." Focused on ROI, market trends, and liquidity.
                    </p>
                  </button>

                  {/* Collector Card */}
                  <button
                    onClick={() => setPersona('collector')}
                    className={`p-6 border rounded-xl text-left transition-all ${
                      persona === 'collector'
                        ? 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-500'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center mb-4 text-purple-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">The Collector</h3>
                    <p className="text-sm text-slate-400">
                      "Thrill of the hunt." Focused on completion, grading, and provenance.
                    </p>
                  </button>
                </div>

                <button
                  disabled={!persona}
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Connect Data */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="w-16 h-16 mx-auto bg-green-900/30 rounded-full flex items-center justify-center text-green-400 mb-6">
                  <Shield className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-white">System Configured</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Your workspace has been optimized for {persona === 'investor' ? 'High-Frequency Trading' : 'Asset Preservation'}.
                  We have loaded a demo portfolio to get you started.
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-left font-mono text-sm text-slate-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" /> Initializing VARC Engine...
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" /> Connecting to TCGPlayer API...
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" /> Calibrating Predictive Models...
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
                >
                  Enter Dashboard
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
