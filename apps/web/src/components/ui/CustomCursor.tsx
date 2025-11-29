'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        const updateCursor = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', updateCursor);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', updateCursor);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed pointer-events-none z-[10001] transition-transform duration-75"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: isClicking ? 'translate(-50%, -50%) scale(0.9)' : 'translate(-50%, -50%)',
            }}
        >
            {/* Heroes of the Storm inspired cursor with layered shadows */}
            <svg 
                width="32" 
                height="32" 
                viewBox="0 0 32 32" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.9))',
                }}
            >
                {/* Outer dark outline for depth */}
                <path
                    d="M 8 4 L 8 24 L 14 18 L 18 26 L 21 25 L 17 17 L 24 17 L 8 4 Z"
                    fill="rgba(0, 0, 0, 0.4)"
                    stroke="rgba(0, 0, 0, 0.8)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                
                {/* Main cursor body - white/cyan with gradient */}
                <path
                    d="M 7 3 L 7 23 L 13 17 L 17 25 L 20 24 L 16 16 L 23 16 L 7 3 Z"
                    fill="url(#cursorGradient)"
                    stroke="rgba(0, 0, 0, 0.9)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
                
                {/* Inner highlight for 3D effect */}
                <path
                    d="M 8 5 L 8 21 L 12.5 16.5 L 16 23 L 18 22.5 L 14.5 16 L 20 16 L 8 5 Z"
                    fill="url(#highlightGradient)"
                    opacity="0.4"
                />
                
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#e0f7ff" />
                        <stop offset="100%" stopColor="#00d9ff" />
                    </linearGradient>
                    <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                </defs>
            </svg>
            
            {/* Precise click point indicator */}
            <div 
                className="absolute top-0 left-0 w-1 h-1 bg-cyan-400 rounded-full"
                style={{
                    transform: 'translate(-2px, -2px)',
                    boxShadow: '0 0 4px rgba(0, 217, 255, 0.8)',
                }}
            />
        </div>
    );
}
