'use client';

import React from 'react';
import { Sparkles, TrendingUp, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const CardViewer = () => {
  return (
    <div className="h-full w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl relative overflow-hidden">
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Featured Card</h3>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Eye className="w-3 h-3" />
          <span>3D View</span>
        </div>
      </div>

      {/* Card Display Area */}
      <motion.div
        className="relative z-10 h-[calc(100%-4rem)] flex items-center justify-center"
        animate={{
          rotateY: [0, 5, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative w-48 h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20">
          {/* Card Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-lg" />

          {/* Card Content Placeholder */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
            <div className="text-white font-bold text-sm mb-1">Charizard</div>
            <div className="text-slate-400 text-xs mb-3">Base Set 4/102</div>
            <div className="flex items-center gap-1 text-cyan-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span className="font-mono">PSA 10</span>
            </div>
          </div>

          {/* Holographic Effect Overlay */}
          <motion.div
            className="absolute inset-0 rounded-lg opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(6, 182, 212, 0.3) 50%, transparent 70%)',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        </div>
      </motion.div>

      {/* Card Info */}
      <div className="relative z-10 mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Est. Value:</span>
          <span className="text-white font-mono font-bold">$8,250</span>
        </div>
        <span className="text-green-400 font-mono">+2.4%</span>
      </div>
    </div>
  );
};
