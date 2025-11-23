'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const StarfieldBackground = () => {
  // Generate random colors for stars (cyan and purple)
  const starColors = ['#22d3ee', '#a855f7', '#06b6d4', '#8b5cf6', '#14b8a6'];
  
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#030712]">
      {/* 1. Nebula Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-black opacity-80" />

      {/* 2. The Digital Grid (Matrix River Effect) - More visible */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* 3. Animated Particles (Cyan and Purple Stars) */}
      {[...Array(50)].map((_, i) => {
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.4 + 0.2
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              backgroundColor: color,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};
