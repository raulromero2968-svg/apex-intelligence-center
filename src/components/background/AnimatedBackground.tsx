'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const starfieldRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    // Don't render on small screens
    if (window.innerWidth <= 767) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const starfieldCanvas = starfieldRef.current;
    const matrixCanvas = matrixRef.current;

    if (!starfieldCanvas || !matrixCanvas) return;

    const starfieldCtx = starfieldCanvas.getContext('2d');
    const matrixCtx = matrixCanvas.getContext('2d');

    if (!starfieldCtx || !matrixCtx) return;

    // Cap DPR at 2 for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Resize canvases
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      [starfieldCanvas, matrixCanvas].forEach(canvas => {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.getContext('2d')?.scale(dpr, dpr);
      });
    };

    resize();

    // Starfield setup
    interface Star {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }

    const stars: Star[] = [];
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Matrix rain setup
    interface Drop {
      x: number;
      y: number;
      speed: number;
      char: string;
    }

    const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const digits = '0123456789';
    const matrixChars = katakana + digits;
    const drops: Drop[] = [];
    const dropCount = 30;

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        speed: Math.random() * 2 + 1,
        char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
      });
    }

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      frameCount++;

      // Clear canvases
      starfieldCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      matrixCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw starfield
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        const opacity = star.opacity * twinkle;

        starfieldCtx.beginPath();
        starfieldCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        starfieldCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        starfieldCtx.fill();
      });

      // Draw matrix rain
      matrixCtx.font = '16px monospace';
      matrixCtx.fillStyle = 'rgba(0, 217, 255, 0.15)';

      drops.forEach(drop => {
        matrixCtx.fillText(drop.char, drop.x, drop.y);

        drop.y += drop.speed;

        // Reset drop when it goes off screen
        if (drop.y > window.innerHeight) {
          drop.y = -20;
          drop.x = Math.random() * window.innerWidth;
          drop.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }

        // Occasionally change character
        if (Math.random() < 0.01) {
          drop.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      resize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Don't render on mobile or with reduced motion
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 767) return null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return null;
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Starfield canvas */}
      <canvas
        ref={starfieldRef}
        className="absolute inset-0 opacity-60"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Matrix rain canvas */}
      <canvas
        ref={matrixRef}
        className="absolute inset-0 opacity-30"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Bottom gradient overlay for readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink to-transparent"
      />
    </div>
  );
}
