'use client';

import { useEffect, useRef } from 'react';

export function ApexVisualEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // RESIZE HANDLER (Fixes Zoom Issues)
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    // CONFIGURATION
    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0);
    const stars = Array(50).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5
    }));

    // NEON CARDS (The "Shooting" Effect)
    const cards = Array(5).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      w: 30,
      h: 42, // Aspect ratio of a TCG card
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7' // Cyan or Purple
    }));

    // RENDER LOOP
    const render = () => {
      // 1. CLEAR (with semi-transparent black for trails)
      ctx.fillStyle = '#020617'; // Slate-950 base
      ctx.fillRect(0, 0, width, height);

      // 2. DRAW GRID (Optimized for Zoom)
      // We draw this manually so it never "disappears" on browser zoom
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)'; // Cyan low opacity
      ctx.lineWidth = 1;
      const gridSize = 50;

      ctx.beginPath();
      // Vertical Lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal Lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 3. DRAW STARFIELD
      ctx.fillStyle = '#fff';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > height) star.y = 0;
      });

      // 4. DRAW MATRIX RAIN (The "River")
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)'; // Purple text
      ctx.font = '15px monospace';
      ypos.forEach((y, index) => {
        const text = String.fromCharCode(Math.random() * 128);
        const x = index * 20;
        ctx.fillText(text, x, y);
        if (y > 100 + Math.random() * 10000) ypos[index] = 0;
        else ypos[index] = y + 20;
      });

      // 5. DRAW NEON CARDS
      cards.forEach(card => {
        // Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = card.color;
        ctx.fillStyle = card.color;
        ctx.fillRect(card.x, card.y, card.w, card.h);
        ctx.shadowBlur = 0; // Reset

        // Movement
        card.x += card.speedX;
        card.y += card.speedY;

        // Bounce off walls
        if (card.x < 0 || card.x > width) card.speedX *= -1;
        if (card.y < 0 || card.y > height) card.speedY *= -1;
      });

      requestAnimationFrame(render);
    };

    render();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
      style={{ background: '#020617' }}
    />
  );
}
