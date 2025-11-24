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

    // --- PHYSICS CONFIGURATION ---
    // Note: We removed the Stars and Matrix because the VIDEO handles that now.
    // We only keep the Grid (for structure) and Cards (for 3D pop).

    const cards = Array(15).fill(0).map(() => ({
      x: Math.random() * width,
      y: height + 100, // Start below screen
      vx: (Math.random() - 0.5) * 2, // Horizontal drift
      vy: -(4 + Math.random() * 4), // Upward velocity
      gravity: 0.05,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7', // Cyan/Purple
      w: 40,
      h: 56,
      life: 0,
      maxLife: 400,
      angle: 0,
      spin: (Math.random() - 0.5) * 0.05
    }));

    const render = () => {
      // 1. CLEAR (Transparent - lets video show through)
      ctx.clearRect(0, 0, width, height);

      // 2. GRID (Subtle Overlay)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 80; // Wider grid for "Open Road" feel

      ctx.beginPath();
      // Vertical Perspective Lines (Road effect)
      for (let x = -width; x <= width * 2; x += gridSize) {
         // Simple vertical lines for now, keeping it clean over the video
         ctx.moveTo(x, 0);
         ctx.lineTo(x, height);
      }
      ctx.stroke();

      // 3. SHOOTING CARDS (Ballistic Arcs)
      for (let i = cards.length - 1; i >= 0; i--) {
        const c = cards[i];

        // Physics
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity; // Gravity makes them arc
        c.angle += c.spin;
        c.life++;

        // Reset if off screen
        if (c.y > height + 200 || c.life > c.maxLife) {
            c.y = height + 100;
            c.x = Math.random() * width;
            c.vy = -(5 + Math.random() * 5); // Relaunch up
            c.vx = (Math.random() - 0.5) * 3;
            c.life = 0;
        }

        // Draw Card
        ctx.save();
        ctx.translate(c.x + c.w/2, c.y + c.h/2);
        ctx.rotate(c.angle);

        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 15; // Neon Glow

        ctx.beginPath();
        ctx.roundRect(-c.w/2, -c.h/2, c.w, c.h, 4);
        ctx.stroke();

        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    render();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 overflow-hidden bg-slate-950">

      {/* 1. THE VIDEO LAYER (The "Canon" Environment) */}
      {/* Ensure you name your generated file 'titan-loop.mp4' and put it in public/images/ */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
      >
        <source src="/images/titan-loop.mp4" type="video/mp4" />
      </video>

      {/* 2. THE CANVAS LAYER (The Physics Overlay) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 3. VIGNETTE OVERLAY (Focuses eyes on center content) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)]" />
    </div>
  );
}
