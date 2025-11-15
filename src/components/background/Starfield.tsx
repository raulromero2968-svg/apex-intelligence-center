'use client';

import { useEffect, useRef } from 'react';

type Star = { x:number; y:number; size:number; opacity:number; speed:number; color:string };

export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const colors = [
      'rgba(0, 255, 255, ',   // Cyan
      'rgba(255, 0, 255, ',   // Magenta
      'rgba(255, 255, 0, ',   // Yellow
      'rgba(0, 200, 255, ',   // Blue
      'rgba(255, 255, 255, ', // White
    ];

    let stars: Star[] = [];

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          opacity: Math.random(),
          speed: Math.random() * 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        ctx.fillStyle = `${star.color}${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.opacity += (Math.random() - 0.5) * 0.01;
        star.opacity = Math.max(0.2, Math.min(1, star.opacity));
        star.y += reduced ? 0 : star.speed;
        if (star.y > canvas.height) star.y = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />;
};
