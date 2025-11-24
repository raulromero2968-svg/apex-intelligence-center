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
    const stars = Array(80).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5,
      speed: (Math.random() * 0.2) + 0.05
    }));

    // MATRIX RAIN (Meditative)
    const cols = Math.floor(width / 25);
    const ypos = Array(cols).fill(0).map(() => Math.random() * height);

    // SHOOTING CARDS (Ballistic Arcs)
    const activeCards: ShootingCard[] = [];
    const spawnCard = () => {
        // Spawn from left or right edge
        const startLeft = Math.random() > 0.5;
        const startX = startLeft ? -50 : width + 50;
        const startY = Math.random() * (height * 0.8); // Top 80%

        // Velocity: Aim towards the other side with an upward arc
        const speed = 4 + Math.random() * 3;
        const angle = startLeft ? -Math.PI / 4 : -Math.PI * 0.75; // 45 degrees up

        activeCards.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed * (startLeft ? 1 : -1) + (Math.random() * 2),
            vy: Math.sin(angle) * speed - 2, // Initial upward pop
            gravity: 0.05, // Gentle gravity for arc
            color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7', // Cyan/Purple
            w: 40,
            h: 56, // Pokemon Card Ratio (2.5 x 3.5 roughly)
            life: 0,
            maxLife: 300,
            angle: 0,
            spin: (Math.random() - 0.5) * 0.05
        });
    };

    // Spawn loop
    setInterval(spawnCard, 2000); // New card every 2 seconds

    const render = () => {
      // 1. CLEAR (Transparent Trail)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.3)'; // Slightly clearer to see background
      ctx.fillRect(0, 0, width, height);

      // 2. GRID
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
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

      // 3. STARS
      ctx.fillStyle = '#fff';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
        }
      });

      // 4. MEDITATIVE MATRIX
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.font = '14px monospace';
      ypos.forEach((y, index) => {
        if (Math.random() > 0.98) {
             const text = String.fromCharCode(0x30A0 + Math.random() * 96);
             const x = index * 25;
             ctx.fillText(text, x, y);
        }
        ypos[index] = y + 1.5;
        if (y > height) ypos[index] = 0;
      });

      // 5. SHOOTING CARDS
      for (let i = activeCards.length - 1; i >= 0; i--) {
        const c = activeCards[i];

        // Physics
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity; // Gravity creates the arc/bell curve
        c.angle += c.spin;
        c.life++;

        // Draw
        ctx.save();
        ctx.translate(c.x + c.w/2, c.y + c.h/2);
        ctx.rotate(c.angle);

        // Card Body (Hollow, Rounded)
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.roundRect(-c.w/2, -c.h/2, c.w, c.h, 4); // 4px Radius for Pokemon look
        ctx.stroke();

        ctx.restore();

        // Remove if off screen or dead
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
