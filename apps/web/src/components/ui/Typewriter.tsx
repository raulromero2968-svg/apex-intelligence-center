'use client';
import { motion } from 'framer-motion';

export const Typewriter = ({ text, speed = 0.03 }: { text: string; speed?: number }) => {
  // Split text into characters
  const characters = text.split('');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: speed, delayChildren: 0.5 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      display: 'inline-block', // Fixes layout shifts
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      display: 'none',
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ overflow: 'hidden', display: 'inline-block' }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }} // Only type once
    >
      {characters.map((char, index) => (
        <motion.span variants={child} key={index} style={{ whiteSpace: 'pre' }}>
          {char}
        </motion.span>
      ))}
      {/* Blinking Cursor */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block ml-1 w-2 h-4 bg-cyan-400 align-middle"
      />
    </motion.div>
  );
};
