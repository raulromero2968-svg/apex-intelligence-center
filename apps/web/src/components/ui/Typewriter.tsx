'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export const Typewriter = ({ text, speed = 0.03, className = '' }: TypewriterProps) => {
  // Hydration safety: only render animated content after mount
  const [isMounted, setIsMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize characters array to prevent unnecessary recalculations
  const characters = useMemo(() => text.split(''), [text]);

  // Animation variants
  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : speed,
        delayChildren: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.1,
      },
    },
    hidden: {
      opacity: 0,
    },
  };

  // Server-side render: show full text immediately for SEO
  if (!isMounted) {
    return (
      <span className={className} style={{ display: 'inline-block' }}>
        {text}
        <span
          className="inline-block ml-1 w-[2px] h-[1em] bg-cyan-400 align-middle opacity-0"
          aria-hidden="true"
        />
      </span>
    );
  }

  // Client-side render with reduced motion: show full text
  if (prefersReducedMotion) {
    return (
      <span className={className} style={{ display: 'inline-block' }}>
        {text}
        <span
          className="inline-block ml-1 w-[2px] h-[1em] bg-cyan-400 align-middle animate-pulse"
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {characters.map((char, index) => (
        <motion.span
          key={`${index}-${char}`}
          variants={child}
          style={{
            whiteSpace: 'pre',
            display: 'inline-block',
          }}
        >
          {char}
        </motion.span>
      ))}
      {/* Blinking Cursor - Uses CSS animation for stability */}
      <span
        className="inline-block ml-1 w-[2px] h-[1em] bg-cyan-400 align-middle animate-[cursor-blink_0.8s_steps(2)_infinite]"
        aria-hidden="true"
      />
    </motion.span>
  );
};

export default Typewriter;
