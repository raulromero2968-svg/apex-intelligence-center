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
    // Cyan and purple color palette - 60% cyan, 40% purple
    const colors = [
      'rgba(0, 255, 255, ',      // Cyan
      'rgba(0, 255, 255, ',      // Cyan (duplicate for 60% chance)
      'rgba(0, 200, 255, ',      // Light cyan
      'rgba(0, 200, 255, ',      // Light cyan (duplicate)
      'rgba(138, 43, 226, ',     // Purple
      'rgba(255, 0, 255, ',      // Magenta
    ];

    let stars: Star[] = [];

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      stars = [];
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5,
          opacity: Math.random(),
          speed: Math.random() * 0.015,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) {
          star.speed = -star.speed;
        }
        
        ctx.fillStyle = `${star.color}${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-30" aria-hidden="true" />;
};

