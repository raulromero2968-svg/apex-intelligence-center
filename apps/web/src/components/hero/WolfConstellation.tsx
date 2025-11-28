'use client';

import { motion } from 'framer-motion';

export const WolfConstellation = () => {
  // Wolf constellation points - designed to form a recognizable wolf silhouette
  // Points arranged to show: head, ears, snout, neck, body, legs, and tail
  const wolfPoints = [
    // Head and ears
    { cx: 150, cy: 50, label: 'ear-left' },      // Left ear tip
    { cx: 180, cy: 70, label: 'head-top' },      // Top of head
    { cx: 210, cy: 50, label: 'ear-right' },     // Right ear tip
    
    // Face
    { cx: 180, cy: 90, label: 'forehead' },      // Forehead
    { cx: 160, cy: 110, label: 'eye-left' },     // Left eye
    { cx: 200, cy: 110, label: 'eye-right' },    // Right eye
    { cx: 180, cy: 130, label: 'snout' },        // Snout/nose
    
    // Neck and shoulders
    { cx: 180, cy: 150, label: 'neck' },         // Neck
    { cx: 140, cy: 170, label: 'shoulder-left' }, // Left shoulder
    { cx: 220, cy: 170, label: 'shoulder-right' }, // Right shoulder
    
    // Body
    { cx: 180, cy: 190, label: 'chest' },        // Chest
    { cx: 180, cy: 220, label: 'mid-body' },     // Mid body
    { cx: 180, cy: 250, label: 'rear' },         // Rear
    
    // Front legs
    { cx: 150, cy: 200, label: 'front-leg-left-top' },  // Front left leg top
    { cx: 150, cy: 250, label: 'front-leg-left-mid' },  // Front left leg mid
    { cx: 150, cy: 290, label: 'front-paw-left' },      // Front left paw
    
    { cx: 210, cy: 200, label: 'front-leg-right-top' }, // Front right leg top
    { cx: 210, cy: 250, label: 'front-leg-right-mid' }, // Front right leg mid
    { cx: 210, cy: 290, label: 'front-paw-right' },     // Front right paw
    
    // Back legs
    { cx: 160, cy: 260, label: 'back-leg-left-top' },   // Back left leg top
    { cx: 140, cy: 290, label: 'back-paw-left' },       // Back left paw
    
    { cx: 200, cy: 260, label: 'back-leg-right-top' },  // Back right leg top
    { cx: 220, cy: 290, label: 'back-paw-right' },      // Back right paw
    
    // Tail
    { cx: 190, cy: 260, label: 'tail-base' },    // Tail base
    { cx: 210, cy: 240, label: 'tail-mid' },     // Tail mid
    { cx: 240, cy: 220, label: 'tail-tip' },     // Tail tip (curved up)
  ];

  // Wolf constellation lines - connecting points to form wolf shape
  const wolfLines = [
    // Head outline
    "M150,50 L180,70 L210,50",                    // Ears
    "M150,50 L160,110",                           // Left ear to eye
    "M210,50 L200,110",                           // Right ear to eye
    "M160,110 L180,90 L200,110",                  // Eyes to forehead
    "M160,110 L180,130",                          // Left eye to snout
    "M200,110 L180,130",                          // Right eye to snout
    
    // Neck and body
    "M180,130 L180,150 L180,190",                // Snout to neck to chest
    "M180,150 L140,170",                          // Neck to left shoulder
    "M180,150 L220,170",                          // Neck to right shoulder
    "M140,170 L180,190 L220,170",                // Shoulders to chest
    "M180,190 L180,220 L180,250",                // Chest to mid-body to rear
    
    // Front legs
    "M140,170 L150,200 L150,250 L150,290",       // Left front leg
    "M220,170 L210,200 L210,250 L210,290",       // Right front leg
    
    // Back legs
    "M180,250 L160,260 L140,290",                // Left back leg
    "M180,250 L200,260 L220,290",                // Right back leg
    
    // Tail
    "M180,250 L190,260 L210,240 L240,220",       // Tail curve
  ];

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.15, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay: i * 0.15, duration: 0.01 }
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
        {/* Draw all constellation lines */}
        {wolfLines.map((pathData, index) => (
          <motion.path
            key={`line-${index}`}
            d={pathData}
            stroke="#22d3ee"
            strokeWidth="2"
            fill="transparent"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            initial="hidden"
            animate="visible"
            custom={index}
          />
        ))}

        {/* Constellation nodes/stars */}
        {wolfPoints.map((point, index) => (
          <motion.circle
            key={`point-${index}`}
            cx={point.cx}
            cy={point.cy}
            r={point.label.includes('eye') ? 4 : 3}
            fill={point.label.includes('eye') ? '#06b6d4' : '#fff'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: point.label.includes('eye') ? [1, 0.6, 1] : 1 
            }}
            transition={{ 
              delay: 1.5 + (index * 0.05),
              scale: { duration: 0.3 },
              opacity: point.label.includes('eye') ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}
            }}
          />
        ))}

        {/* Add glow to eyes */}
        {wolfPoints
          .filter(p => p.label.includes('eye'))
          .map((point, index) => (
            <motion.circle
              key={`eye-glow-${index}`}
              cx={point.cx}
              cy={point.cy}
              r="8"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              opacity="0.3"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                delay: 2,
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
      </motion.svg>
    </div>
  );
};
