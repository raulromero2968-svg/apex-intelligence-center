'use client';

import { useEffect, useState } from 'react';

// Wolf paw print component - 3 dots in triangle formation
const PawPrint = ({ opacity }: { opacity: number }) => (
  <div
    className="relative w-5 h-5"
    style={{ opacity }}
  >
    {/* Top toe */}
    <div
      className="absolute w-2 h-2 rounded-full bg-cyan-400"
      style={{
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        boxShadow: '0 0 6px rgba(34, 211, 238, 0.8)',
      }}
    />
    {/* Bottom left toe */}
    <div
      className="absolute w-2 h-2 rounded-full bg-cyan-400"
      style={{
        bottom: 0,
        left: 2,
        boxShadow: '0 0 6px rgba(34, 211, 238, 0.8)',
      }}
    />
    {/* Bottom right toe */}
    <div
      className="absolute w-2 h-2 rounded-full bg-cyan-400"
      style={{
        bottom: 0,
        right: 2,
        boxShadow: '0 0 6px rgba(34, 211, 238, 0.8)',
      }}
    />
  </div>
);

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Add to trail with unique id
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: trailId++ }];
        // Keep only last 5 trail points for paw prints
        return newTrail.slice(-5);
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
      {/* Wolf paw print trail (fading) */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9999] transition-opacity duration-500"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <PawPrint opacity={(index / trail.length) * 0.5} />
        </div>
      ))}

      {/* Main cursor - Wolf nose (triangle pointing down) */}
      <div
        className="fixed pointer-events-none z-[10000]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'none',
        }}
      >
        <div
          className="w-5 h-5 bg-cyan-400"
          style={{
            clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
            boxShadow: '0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.5)',
          }}
        />
      </div>
    </>
  );
};
