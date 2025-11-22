'use client';

import { useEffect, useRef } from 'react';

export const AuroraBorealis = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let animationId: number;
    let offset = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient with 60% cyan, 40% purple
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.4, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      
      // 60% cyan dominance
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)'); // Cyan
      gradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.25)'); // Light cyan
      gradient.addColorStop(0.6, 'rgba(0, 150, 255, 0.2)'); // Blue-cyan
      gradient.addColorStop(0.8, 'rgba(138, 43, 226, 0.15)'); // Purple (40%)
      gradient.addColorStop(1, 'rgba(88, 28, 135, 0.1)'); // Dark purple
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      offset += 0.5;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 opacity-40"
      style={{ filter: 'blur(60px)' }}
      aria-hidden="true"
    />
  );
};
