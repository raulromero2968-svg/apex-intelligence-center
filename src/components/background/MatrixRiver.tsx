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
    
    // Create balanced columns on both sides with meditative rhythm
    const columnSpacing: number[] = [];
    const drops: { y: number; chars: string[]; color: string; side: 'left' | 'right' }[] = [];
    
    // Left side columns (first 12% of screen)
    const leftSideWidth = canvas.width * 0.12;
    let leftXPos = 0;
    const leftSpacing = 25; // Consistent spacing for meditative rhythm
    
    while (leftXPos < leftSideWidth) {
      columnSpacing.push(leftXPos);
      
      // 60% cyan, 40% purple
      const color = Math.random() > 0.4
        ? `rgba(0, 255, 255, ` // Cyan (60%)
        : `rgba(138, 43, 226, `; // Purple (40%)
      
      drops.push({
        y: Math.random() * -canvas.height,
        chars: [],
        color: color,
        side: 'left'
      });
      
      leftXPos += leftSpacing;
    }
    
    // Right side columns (last 12% of screen, mirrored from left)
    const rightSideStart = canvas.width * 0.88;
    let rightXPos = rightSideStart;
    const rightSpacing = 25; // Match left side spacing
    
    while (rightXPos < canvas.width) {
      columnSpacing.push(rightXPos);
      
      // 60% cyan, 40% purple (mirror the left side pattern)
      const color = Math.random() > 0.4
        ? `rgba(0, 255, 255, ` // Cyan (60%)
        : `rgba(138, 43, 226, `; // Purple (40%)
      
      drops.push({
        y: Math.random() * -canvas.height,
        chars: [],
        color: color,
        side: 'right'
      });
      
      rightXPos += rightSpacing;
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
        
        // Move drop down slowly (meditative speed - consistent rhythm)
        drop.y += fontSize * 0.35; // Slightly slower for more meditative feel
        
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
