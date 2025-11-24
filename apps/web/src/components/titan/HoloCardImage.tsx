"use client";

import Image from 'next/image';
import { FC } from 'react';

interface HoloCardImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const HoloCardImage: FC<HoloCardImageProps> = ({ src, alt, width = 64, height = 88, className = "" }) => {
  return (
    <div className={`relative overflow-hidden rounded-lg animate-holo-glitch transition-transform duration-300 ease-in-out hover:scale-105 hover:brightness-110 group ${className}`}>

      {/* Base border for static glow fallback */}
      <div className="absolute inset-0 border-2 border-cyan-400/50 blur-sm pointer-events-none"></div>

      {/* Glitch scanlines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)] animate-scanlines pointer-events-none z-10"></div>

      {/* Glassy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-purple-500/10 pointer-events-none z-20 mix-blend-overlay" />

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover transition-all duration-300 group-hover:brightness-110"
        priority
      />
    </div>
  );
};
