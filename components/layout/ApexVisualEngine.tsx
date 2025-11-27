'use client';

import { useEffect, useRef } from 'react';

interface ShootingCard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  color: string;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  angle: number;
  spin: number;
}

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

    // --- CONFIGURATION ---

    // 1. STARS: Increased count and brightness
    const stars = Array(150).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2, // Bigger stars
      speed: (Math.random() * 0.3) + 0.1
    }));

    // 2. MATRIX RAIN: "Meditative River"
    const cols = Math.floor(width / 25);
    const ypos = Array(cols).fill(0).map(() => Math.random() * height);

    // 3. SHOOTING CARDS
    const activeCards: ShootingCard[] = [];
    const spawnCard = () => {
        const startLeft = Math.random() > 0.5;
        const startX = startLeft ? -100 : width + 100;
        const startY = height * (0.6 + (Math.random() * 0.3));

        const speedX = (3 + Math.random() * 2) * (startLeft ? 1 : -1);
        const speedY = -(6 + Math.random() * 4);

        activeCards.push({
            x: startX,
            y: startY,
            vx: speedX,
            vy: speedY,
            gravity: 0.08,
            color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7',
            w: 40,
            h: 56,
            life: 0,
            maxLife: 400,
            angle: 0,
            spin: (Math.random() - 0.5) * 0.02
        });
    };
    setInterval(spawnCard, 1500); // Faster spawn rate

    const render = () => {
      // CLEAR: Use a lighter clear to let trails show, but keep background dark
      ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // A. GRID: High visibility cyan
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)'; // Increased opacity
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

      // B. STARS: Brighter White
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 80% Opacity (High)
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;

        // Reset logic: If it hits bottom, move to top
        if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
        }
      });

      // C. MEDITATIVE MATRIX: Much Brighter Purple
      ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; // 60% Opacity (Was 25%)
      ctx.font = '16px monospace'; // Larger Font
      ypos.forEach((y, index) => {
        // Draw characters
        if (Math.random() > 0.96) {
             const text = String.fromCharCode(0x30A0 + Math.random() * 96);
             const x = index * 25;
             ctx.fillText(text, x, y);
        }

        // Flow logic
        ypos[index] = y + 1.0; // Slow, meditative speed
        if (y > height + 50) ypos[index] = -50; // Reset slightly above screen
      });

      // D. SHOOTING CARDS
      for (let i = activeCards.length - 1; i >= 0; i--) {
        const c = activeCards[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity;
        c.angle += c.spin;
        c.life++;

        ctx.save();
        ctx.translate(c.x + c.w/2, c.y + c.h/2);
        ctx.rotate(c.angle);

        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 20; // Strong glow

        ctx.beginPath();
        ctx.roundRect(-c.w/2, -c.h/2, c.w, c.h, 4);
        ctx.stroke();

        ctx.restore();

        if (c.y > height + 100 || c.life > c.maxLife) {
            activeCards.splice(i, 1);
        }
      }

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
