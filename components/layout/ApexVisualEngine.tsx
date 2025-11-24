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
        // 1. Start far off-screen (Left or Right)
        const startLeft = Math.random() > 0.5;
        const startX = startLeft ? -100 : width + 100;

        // 2. Start lower down (60% - 90% of screen height) so they shoot UP
        const startY = height * (0.6 + (Math.random() * 0.3));

        // 3. Velocity Calculation for "Bell Curve"
        // Horizontal speed (constant)
        const speedX = (3 + Math.random() * 2) * (startLeft ? 1 : -1);

        // Vertical speed (High initial upward force)
        // This creates the "Up and Over" arc
        const speedY = -(6 + Math.random() * 4);

        activeCards.push({
            x: startX,
            y: startY,
            vx: speedX,
            vy: speedY,
            gravity: 0.08, // Low gravity for "floaty" feel
            color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7', // Cyan/Purple
            w: 40,
            h: 56, // Pokemon Card Ratio
            life: 0,
            maxLife: 400, // Live longer to complete the arc
            angle: 0,
            spin: (Math.random() - 0.5) * 0.02 // Gentle rotation
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
