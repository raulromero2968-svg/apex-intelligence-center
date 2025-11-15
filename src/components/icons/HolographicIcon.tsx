'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { iconMap, IconId } from '@/lib/iconMap';

interface HolographicIconProps {
  id?: IconId;
  src?: string;
  alt: string;
  size?: number;
}

export default function HolographicIcon({
  id,
  src,
  alt,
  size = 64
}: HolographicIconProps) {
  const shouldReduceMotion = useReducedMotion();

  // Use provided src or look up from iconMap
  const imageSrc = src || (id ? iconMap[id] : undefined);

  if (!imageSrc) {
    console.warn('HolographicIcon: No valid src or id provided');
    return null;
  }

  // Float animation - disabled for reduced motion
  const floatVariants = {
    idle: shouldReduceMotion
      ? { y: 0 }
      : {
          y: [0, -6, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
  };

  // Hover animation
  const hoverVariants = {
    hover: {
      scale: 1.08,
      rotate: 1.5,
      filter: 'drop-shadow(0 0 12px rgba(0, 217, 255, 0.6))',
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="relative inline-block"
      style={{ width: size, height: size }}
      variants={{ ...floatVariants, ...hoverVariants }}
      initial="idle"
      animate="idle"
      whileHover="hover"
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </motion.div>
  );
}
