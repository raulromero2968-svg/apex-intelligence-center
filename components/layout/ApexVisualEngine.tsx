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

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 1. CONFIGURATION
    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0).map(() => Math.random() * height); // Random start positions

    // More stars, spread everywhere
    const stars = Array(100).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5,
      speed: (Math.random() * 0.2) + 0.1 // Slower, meditative speed
    }));

    // HOLLOW NEON CARDS (More of them, border only)
    const cards = Array(15).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      w: 40,
      h: 56, // TCG Aspect Ratio
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7' // Cyan/Purple
    }));

    const render = () => {
      // CLEAR with transparency trail (creates the smooth motion blur)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Very subtle clear
      ctx.fillRect(0, 0, width, height);

      // A. DRAW GRID (Fixed visual anchor)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)'; // Very faint cyan
      ctx.lineWidth = 1;
      const gridSize = 60;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // B. DRAW STARS (Everywhere)
      ctx.fillStyle = '#fff';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width; // Reset to random X
        }
      });

      // C. DRAW MEDITATIVE MATRIX RIVER
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)'; // Increased visibility slightly
      ctx.font = '14px monospace';
      ypos.forEach((y, index) => {
        // Only draw randomly to create "droplets" not solid lines
        if (Math.random() > 0.97) {
            const text = String.fromCharCode(0x30A0 + Math.random() * 96); // Katakana
            const x = index * 20;
            ctx.fillText(text, x, y);
        }

        // Flow logic
        ypos[index] = y + 2; // Slow flow
        if (y > height) ypos[index] = 0;
      });

      // D. DRAW HOLLOW CARDS (Border Only)
      ctx.lineWidth = 1.5;
      cards.forEach(card => {
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = card.color;
        ctx.strokeStyle = card.color;

        // DRAW BORDER ONLY (strokeRect)
        ctx.strokeRect(card.x, card.y, card.w, card.h);

        // Reset Shadow
        ctx.shadowBlur = 0;

        // Move
        card.x += card.speedX;
        card.y += card.speedY;

        // Bounce gently
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
