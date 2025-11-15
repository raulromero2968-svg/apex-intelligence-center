"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Star = { x:number; y:number; z:number; t:number; tw:number; c:string };

export default function StarfieldFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0, running = true;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      c.width  = Math.floor(innerWidth * DPR);
      c.height = Math.floor(innerHeight * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = Math.floor((innerWidth * innerHeight) / 18000); // density
    const mk = (): Star => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      z: 0.4 + Math.random() * 0.6,          // depth 0.4–1.0
      t: Math.random() * Math.PI * 2,
      tw: 0.3 + Math.random() * 0.7,          // twinkle speed
      c: Math.random() < 0.6 ? "#dff9ff" : "#e6d6ff"
    });
    const stars: Star[] = Array.from({ length: N }, mk);

    const step = () => {
      if (!running) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (const s of stars) {
        // slow drift + twinkle
        if (!reduced) {
          s.x += (0.02 * (1.2 - s.z)); // parallax
          if (s.x > innerWidth + 20) s.x = -20;
          s.t += 0.005 * s.tw;
        }
        const a = reduced ? 0.25 : 0.15 + 0.10 * (Math.sin(s.t) * 0.5 + 0.5);
        ctx.globalAlpha = a * (0.5 + s.z * 0.5);
        ctx.fillStyle = s.c;
        const r = 0.6 + s.z * 1.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };
    step();

    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-60 pointer-events-none"
    />
  );
}
