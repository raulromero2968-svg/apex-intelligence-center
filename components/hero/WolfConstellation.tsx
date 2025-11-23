'use client';

import { motion } from 'framer-motion';

export const WolfConstellation = () => {
  // SVG path for a stylized wolf head (geometric/low-poly style)
  const wolfPath = "M100,50 L140,150 L180,50 L220,150 L250,250 L140,280 L30,250 L60,150 Z M140,150 L140,280 M60,150 L140,220 L220,150";

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.2, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay: i * 0.2, duration: 0.01 }
      }
    })
  };

  return (
    <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center">
      {/* Glowing Backdrop */}
      <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full" />

      <motion.svg
        viewBox="0 0 300 300"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
      >
        <motion.path
          d={wolfPath}
          stroke="#22d3ee" // Cyan accent [cite: 188]
          strokeWidth="2"
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={draw}
          initial="hidden"
          animate="visible"
        />
        {/* Constellation Nodes */}
        {[
          { cx: 100, cy: 50 }, { cx: 140, cy: 150 }, { cx: 180, cy: 50 },
          { cx: 220, cy: 150 }, { cx: 250, cy: 250 }, { cx: 140, cy: 280 },
          { cx: 30, cy: 250 }, { cx: 60, cy: 150 }, { cx: 140, cy: 220 }
        ].map((point, index) => (
          <motion.circle
            key={index}
            cx={point.cx}
            cy={point.cy}
            r="3"
            fill="#fff"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + (index * 0.1) }}
          />
        ))}
      </motion.svg>
    </div>
  );
};
