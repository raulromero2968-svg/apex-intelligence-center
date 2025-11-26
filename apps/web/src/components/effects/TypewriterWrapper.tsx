'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';

interface TypewriterWrapperProps {
  children: ReactNode;
  /** Delay in milliseconds before starting the animation */
  delay?: number;
  /** Duration of the typewriter animation in milliseconds */
  duration?: number;
  /** Number of steps for the typewriter effect */
  steps?: number;
  /** Whether to show the blinking cursor */
  showCursor?: boolean;
  /** CSS class for additional styling */
  className?: string;
  /** Element type to render */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * TypewriterWrapper - Wraps text elements with a typewriter animation effect
 * Uses CSS keyframes and Web Animations API for hardware-accelerated rendering
 * Respects prefers-reduced-motion for accessibility
 */
const TypewriterWrapper: FC<TypewriterWrapperProps> = ({
  children,
  delay = 0,
  duration = 2000,
  steps = 40,
  showCursor = false,
  className = '',
  as: Element = 'span',
}) => {
  const ref = useRef<HTMLElement>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Respect reduced motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsAnimated(true);
      if (ref.current) {
        ref.current.style.width = '100%';
      }
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Initial hidden state
    element.style.width = '0%';
    element.style.opacity = '1';

    const timeoutId = setTimeout(() => {
      const animation = element.animate(
        [
          { width: '0%' },
          { width: '100%' }
        ],
        {
          duration,
          easing: `steps(${steps}, end)`,
          fill: 'forwards',
        }
      );

      animation.onfinish = () => {
        setIsAnimated(true);
      };
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, duration, steps]);

  // Type assertion for dynamic element
  const ElementTag = Element as keyof JSX.IntrinsicElements;

  return (
    <ElementTag
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={`typewriter-element inline-block overflow-hidden whitespace-nowrap ${className}`}
      style={{ width: 0 }}
    >
      {children}
      {showCursor && !isAnimated && (
        <span className="inline-block w-[2px] h-[1em] bg-cyan-400 ml-1 animate-pulse align-middle" />
      )}
    </ElementTag>
  );
};

export default TypewriterWrapper;
