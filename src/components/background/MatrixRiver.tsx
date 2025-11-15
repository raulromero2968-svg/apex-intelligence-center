'use client';

import { useEffect, useRef } from 'react';

export const MatrixRiver = () => {
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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const characters = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      drops.forEach((y, index) => {
        if (index < columns * 0.15 || index > columns * 0.85) {
          const char = characters[Math.floor(Math.random() * characters.length)];
          const x = index * fontSize;
          const alpha = Math.min(y / canvas.height, 0.6);
          ctx.fillStyle = `rgba(0,255,255,${alpha})`;
          ctx.fillText(char, x, y);

          if (y > canvas.height && Math.random() > 0.99) drops[index] = 0;
          drops[index] += fontSize * (reduced ? 0.15 : 0.3);
        }
      });

      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      const step = () => { draw(); setTimeout(step, 60); };
      step();
    } else {
      draw();
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-30" style={{ mixBlendMode: 'screen' }} aria-hidden="true" />;
};
