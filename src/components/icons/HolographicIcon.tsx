'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface HolographicIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export const HolographicIcon = ({
  src,
  alt,
  size = 64,
  className = ''
}: HolographicIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        animate={{
          filter: isHovered
            ? 'drop-shadow(0 0 16px rgba(0,255,255,0.8))'
            : 'drop-shadow(0 0 8px rgba(0,255,255,0.4))',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};
