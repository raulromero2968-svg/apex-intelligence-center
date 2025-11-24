'use client';

import { useEffect, useRef } from 'react';

export function TitanVideoEngine() {
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

    // --- SHOOTING STAR CARD PHYSICS (Overlaid on Video) ---
    const activeCards: any[] = [];

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
            color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7', // Cyan/Purple
            w: 40,
            h: 56,
            life: 0,
            maxLife: 400,
            angle: 0,
            spin: (Math.random() - 0.5) * 0.02
        });
    };

    // Spawn a new card every 1.5 seconds
    const spawner = setInterval(spawnCard, 1500);

    const render = () => {
      // 1. CLEAR (Transparent - lets video show through)
      ctx.clearRect(0, 0, width, height);

      // 2. GRID (Subtle Overlay to unify Video with UI)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)'; // Very faint cyan
      ctx.lineWidth = 1;
      const gridSize = 80;

      ctx.beginPath();
      // Perspective Grid Lines (Floor)
      for (let x = -width; x <= width * 2; x += gridSize) {
         ctx.moveTo(x, 0);
         ctx.lineTo(x, height);
      }
      // Horizontal Horizon Lines
      for (let y = 0; y <= height; y += gridSize) {
         ctx.moveTo(0, y);
         ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 3. SHOOTING CARDS
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

        // Hollow Neon Look
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 20;

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
    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(spawner);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 overflow-hidden bg-slate-950">

      {/* 1. THE VIDEO (Background Layer) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-screen"
      >
        {/* IMPORTANT: Make sure this file exists in public/images/ */}
        <source src="/images/titan-loop.mp4" type="video/mp4" />
      </video>

      {/* 2. THE CANVAS (Physics Layer) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 3. VIGNETTE (Cinematic Edge Darkening) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#020617_95%)]" />
    </div>
  );
}
