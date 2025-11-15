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
    
    // Japanese katakana and numbers
    const characters = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const fontSize = 14;
    
    // Create columns with VARIED spacing (like reference)
    const columnSpacing: number[] = [];
    const drops: { y: number; chars: string[]; color: string }[] = [];
    
    let xPos = 0;
    while (xPos < canvas.width) {
      // Random spacing between 15-40px (creates uneven columns)
      const spacing = Math.random() * 25 + 15;
      
      // Only create columns on left 20% and right 20% of screen
      if (xPos < canvas.width * 0.2 || xPos > canvas.width * 0.8) {
        columnSpacing.push(xPos);
        
        // Random color: cyan or purple/magenta
        const color = Math.random() > 0.5 
          ? `rgba(0, 255, 255, ` // Cyan
          : `rgba(138, 43, 226, `; // Purple
        
        drops.push({
          y: Math.random() * -canvas.height, // Start above screen
          chars: [], // Characters build up one at a time
          color: color
        });
      }
      
      xPos += spacing;
    }
    
    let animationId: number;
    const draw = () => {
      // Subtle fade (creates trail effect)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = `${fontSize}px monospace`;
      
      drops.forEach((drop, index) => {
        const x = columnSpacing[index];
        
        // Add new character to string (builds one at a time)
        if (drop.y > 0 && Math.random() > 0.95) {
          const char = characters[Math.floor(Math.random() * characters.length)];
          drop.chars.push(char);
          
          // Limit string length to ~15 characters
          if (drop.chars.length > 15) {
            drop.chars.shift();
          }
        }
        
        // Draw each character in the string
        drop.chars.forEach((char, charIndex) => {
          const charY = drop.y - (charIndex * fontSize);
          
          if (charY > 0 && charY < canvas.height) {
            // Fade based on position in string (brightest at bottom)
            const opacity = (1 - (charIndex / drop.chars.length)) * 0.8;
            ctx.fillStyle = `${drop.color}${opacity})`;
            ctx.fillText(char, x, charY);
          }
        });
        
        // Move drop down slowly (meditative speed)
        drop.y += fontSize * 0.4;
        
        // Reset when off screen
        if (drop.y > canvas.height + 100) {
          drop.y = Math.random() * -200;
          drop.chars = [];
        }
      });
      
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
      style={{ mixBlendMode: 'screen' }} 
      aria-hidden="true"
    />
  );
};
