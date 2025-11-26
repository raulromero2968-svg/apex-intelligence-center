'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const StarfieldBackground = () => {
  const pathname = usePathname() ?? '';

  // Hide on homepage - it has its own standalone background
  if (pathname === '/') {
    return null;
  }

  // We use CSS for the stars to reduce JS load (LCP optimization)
  // The subtle grid represents the "Matrix/Data" river
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#030712]">
      {/* 1. Nebula Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-black opacity-80" />

      {/* 2. The Digital Grid (Matrix River Effect) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* 3. Animated Particles (Lightweight Stars) */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-0"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
          }}
        />
      ))}
    </div>
  );
};
