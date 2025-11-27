'use client';

import Image from 'next/image';
import { FC, useState, useEffect, useCallback } from 'react';
import { useSound as useSoundContext } from '@/contexts/SoundContext';
import dynamic from 'next/dynamic';

// Lazy load particles for performance
const Particles = dynamic(() => import('@tsparticles/react').then(m => m.default), { ssr: false });

interface HoloCardImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  enableParticles?: boolean;
  enableSound?: boolean;
}

export const HoloCardImage: FC<HoloCardImageProps> = ({
  src,
  alt,
  width = 64,
  height = 88,
  className = "",
  enableParticles = true,
  enableSound = false // Disabled by default until sound files are added
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { isMuted } = useSoundContext?.() || { isMuted: true };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Set random glitch offsets for dramatic effect
  useEffect(() => {
    if (!prefersReducedMotion) {
      const setGlitchVars = () => {
        document.documentElement.style.setProperty('--glitch-x1', `${Math.random() * 4 - 2}px`);
        document.documentElement.style.setProperty('--glitch-y1', `${Math.random() * 4 - 2}px`);
        document.documentElement.style.setProperty('--glitch-x2', `${Math.random() * 6 - 3}px`);
        document.documentElement.style.setProperty('--glitch-y2', `${Math.random() * 6 - 3}px`);
        document.documentElement.style.setProperty('--glitch-x3', `${Math.random() * 6 - 3}px`);
        document.documentElement.style.setProperty('--glitch-y3', `${Math.random() * 6 - 3}px`);
        document.documentElement.style.setProperty('--glitch-x4', `${Math.random() * 6 - 3}px`);
        document.documentElement.style.setProperty('--glitch-y4', `${Math.random() * 6 - 3}px`);
      };
      setGlitchVars();
      // Update glitch vars periodically for variation
      const interval = setInterval(setGlitchVars, 3000);
      return () => clearInterval(interval);
    }
  }, [prefersReducedMotion]);

  // Particle burst handler
  const handleInteraction = useCallback(() => {
    if (enableParticles && !prefersReducedMotion && particlesLoaded) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1000); // 1s burst duration
    }

    // Sound effects would be triggered here when sound files are available
    // if (enableSound && !isMuted && !prefersReducedMotion) {
    //   playGlitch();
    //   playBurst();
    // }
  }, [enableParticles, enableSound, isMuted, prefersReducedMotion, particlesLoaded]);

  // Lazy load particles engine
  useEffect(() => {
    if (enableParticles && !prefersReducedMotion) {
      import('@tsparticles/preset-confetti').then(() => {
        setParticlesLoaded(true);
      });
    }
  }, [enableParticles, prefersReducedMotion]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-125 focus:scale-105 focus:brightness-125 group ${!prefersReducedMotion ? 'animate-holo-glitch' : ''} ${className}`}
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
      tabIndex={0}
      role="img"
      aria-label={alt}
    >
      {/* Base border for static glow fallback */}
      <div className="absolute inset-0 border-4 border-cyan-400 opacity-60 blur-md pointer-events-none"></div>

      {/* Glitch scanlines - more visible for dramatic effect */}
      <div className={`absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_3px,rgba(255,255,255,0.1)_3px,rgba(255,255,255,0.1)_6px)] pointer-events-none z-10 ${!prefersReducedMotion ? 'animate-scanlines' : 'opacity-20'}`}></div>

      {/* Enhanced Glassy Overlay with intensified neon gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-purple-500/20 pointer-events-none z-20 mix-blend-overlay" />

      {/* Particle Burst - Only render when enabled and motion allowed */}
      {enableParticles && showParticles && particlesLoaded && !prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <Particles
            id={`particles-${src}`}
            options={{
              preset: 'confetti',
              particles: {
                number: { value: 50 }, // Limited for performance
                color: { value: ['#00eaff', '#d946ef'] },
                move: {
                  enable: true,
                  speed: 10,
                  direction: 'none',
                  random: true,
                  straight: false,
                  outModes: {
                    default: 'destroy'
                  }
                },
                size: {
                  value: { min: 2, max: 4 }
                },
                opacity: {
                  value: { min: 0.3, max: 1 },
                  animation: {
                    enable: true,
                    speed: 3,
                    sync: false
                  }
                },
                life: {
                  duration: {
                    value: 1
                  }
                }
              },
              emitters: {
                position: { x: 50, y: 50 },
                rate: {
                  quantity: 50,
                  delay: 0
                },
                life: {
                  count: 1,
                  duration: 0.1
                }
              }
            }}
          />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover transition-all duration-300 group-hover:brightness-125 relative z-5"
        priority
      />
    </div>
  );
};
