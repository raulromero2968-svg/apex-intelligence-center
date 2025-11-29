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
                {/* Heroes of the Storm inspired cursor - Cyan theme */}
            <svg 
                width="28" 
                height="28" 
                viewBox="0 0 28 28" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 3px rgba(0, 217, 255, 0.5))',
                }}
            >
                {/* Outer shadow layer for depth */}
                <path
                    d="M 7 3 L 7 21 L 12 16 L 15 23 L 18 22 L 15 15 L 21 15 L 7 3 Z"
                    fill="rgba(0, 0, 0, 0.5)"
                    stroke="rgba(0, 0, 0, 0.9)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                
                {/* Main cursor body - Cyan gradient */}
                <path
                    d="M 6 2 L 6 20 L 11 15 L 14 22 L 17 21 L 14 14 L 20 14 L 6 2 Z"
                    fill="url(#cursorGradient)"
                    stroke="rgba(0, 20, 40, 0.95)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                
                {/* Inner highlight for 3D effect */}
                <path
                    d="M 7 4 L 7 18 L 10.5 14.5 L 13 20 L 15 19.5 L 12.5 14 L 17 14 L 7 4 Z"
                    fill="url(#highlightGradient)"
                    opacity="0.5"
                />
                
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00FFFF" />
                        <stop offset="50%" stopColor="#00d9ff" />
                        <stop offset="100%" stopColor="#00b4d8" />
                    </linearGradient>
                    <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
