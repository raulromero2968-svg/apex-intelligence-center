'use client';

import { useEffect, useState } from 'react';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    let trailId = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Update actual cursor position immediately (fast tracking)
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      
      // Add to trail with delay
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: trailId++ }];
        // Keep only last 8 trail points
        return newTrail.slice(-8);
      });
    };
    
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Ghost trail (slow fade) */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9999] transition-all duration-300"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div 
            className="w-4 h-4 rounded-full bg-cyan-400"
            style={{
              opacity: (index / trail.length) * 0.4,
              filter: 'blur(2px)',
            }}
          />
        </div>
      ))}
      
      {/* Actual cursor (instant tracking, no delay) */}
      <div
        className="fixed pointer-events-none z-[10000]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'none', // No transition = instant tracking
        }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-cyan-400/30 blur-md" />
        
        {/* Inner dot */}
        <div 
          className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)]" 
          style={{
            transform: 'translate(25%, 25%)',
          }}
        />
      </div>
    </>
  );
};

