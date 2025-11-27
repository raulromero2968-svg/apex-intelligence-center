'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced Starfield Background with AI-Inspired Prediction
 *
 * Implements Jensen Huang's vision of "time machines" for visual computing:
 * - Frame prediction for smoother animations (extrapolate 2 frames ahead)
 * - Adaptive quality based on device performance
 * - GPU-optimized rendering patterns
 * - Parallax depth simulation for 3D effect
 *
 * @module components/StarfieldBackground
 */

interface Star {
  x: number;
  y: number;
  z: number; // Depth for parallax
  radius: number;
  baseOpacity: number;
  opacity: number;
  speed: number;
  color: string;
  // Prediction state (Jensen-inspired pixel extrapolation)
  predictedX: number;
  predictedY: number;
  velocity: { x: number; y: number };
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  adaptiveQuality: 'low' | 'medium' | 'high';
}

export const StarfieldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    adaptiveQuality: 'high',
  });
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(0);

  /**
   * Predict star positions 2 frames ahead (Jensen's "time machine" concept)
   * Uses simple linear extrapolation; could be enhanced with ML model
   */
  const predictStarPositions = useCallback((stars: Star[], deltaTime: number) => {
    const predictionFrames = 2;
    const predictionTime = deltaTime * predictionFrames;

    stars.forEach((star) => {
      // Linear velocity prediction
      star.predictedX = star.x + star.velocity.x * predictionTime;
      star.predictedY = star.y + star.velocity.y * predictionTime;

      // Apply parallax depth factor to prediction
      const depthFactor = 1 / (star.z + 1);
      star.predictedY += star.speed * depthFactor * predictionTime;
    });
  }, []);

  /**
   * Adaptive quality adjustment based on frame rate
   */
  const updateAdaptiveQuality = useCallback((currentFps: number) => {
    if (currentFps < 30) {
      metricsRef.current.adaptiveQuality = 'low';
    } else if (currentFps < 50) {
      metricsRef.current.adaptiveQuality = 'medium';
    } else {
      metricsRef.current.adaptiveQuality = 'high';
    }
  }, []);

  /**
   * Get star count based on adaptive quality
   */
  const getStarCount = useCallback(() => {
    const quality = metricsRef.current.adaptiveQuality;
    switch (quality) {
      case 'low': return 100;
      case 'medium': return 150;
      case 'high': return 250;
      default: return 200;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // GPU optimization: reduce latency
    });
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star color palette (cyberpunk theme)
    const starColors = [
      'rgba(255, 255, 255, ', // White
      'rgba(34, 211, 238, ',  // Cyan
      'rgba(168, 85, 247, ',  // Purple
      'rgba(96, 165, 250, ',  // Blue
    ];

    // Create stars with depth and prediction state
    const createStars = (count: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const stars: Star[] = [];

      for (let i = 0; i < count; i++) {
        const z = Math.random() * 3; // 0-3 depth layers
        const depthFactor = 1 / (z + 1);

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          radius: (Math.random() * 1.5 + 0.5) * depthFactor,
          baseOpacity: Math.random() * 0.5 + 0.3,
          opacity: 0,
          speed: (Math.random() * 0.5 + 0.2) * depthFactor,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          predictedX: 0,
          predictedY: 0,
          velocity: {
            x: (Math.random() - 0.5) * 0.1 * depthFactor, // Subtle horizontal drift
            y: 0,
          },
        });
      }

      return stars;
    };

    starsRef.current = createStars(getStarCount());

    // Animation loop with prediction
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Calculate delta time and FPS
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      frameCountRef.current++;

      // Update FPS every second
      if (timestamp - fpsUpdateTimeRef.current >= 1000) {
        metricsRef.current.fps = frameCountRef.current;
        metricsRef.current.frameTime = 1000 / frameCountRef.current;
        updateAdaptiveQuality(metricsRef.current.fps);
        frameCountRef.current = 0;
        fpsUpdateTimeRef.current = timestamp;

        // Adjust star count if quality changed significantly
        const targetCount = getStarCount();
        if (Math.abs(starsRef.current.length - targetCount) > 50) {
          if (starsRef.current.length < targetCount) {
            // Add more stars
            const newStars = createStars(targetCount - starsRef.current.length);
            starsRef.current.push(...newStars);
          } else {
            // Remove excess stars
            starsRef.current = starsRef.current.slice(0, targetCount);
          }
        }
      }

      // Predict star positions (Jensen's time machine concept)
      predictStarPositions(starsRef.current, deltaTime);

      // Clear with slight fade for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw stars with predicted positions for smoother animation
      const stars = starsRef.current;
      const quality = metricsRef.current.adaptiveQuality;

      // Batch similar operations for GPU efficiency
      stars.forEach((star) => {
        // Use predicted position for smoother rendering
        const renderX = star.x * 0.3 + star.predictedX * 0.7;
        const renderY = star.y * 0.3 + star.predictedY * 0.7;

        // Twinkle effect with sine wave
        const twinkle = Math.sin(timestamp * 0.003 + star.x * 0.01 + star.z) * 0.3 + 0.7;
        star.opacity = star.baseOpacity * twinkle;

        // Draw star
        ctx.beginPath();

        if (quality === 'high' && star.z < 1) {
          // Glow effect for nearby stars (high quality only)
          const gradient = ctx.createRadialGradient(
            renderX, renderY, 0,
            renderX, renderY, star.radius * 3
          );
          gradient.addColorStop(0, `${star.color}${star.opacity})`);
          gradient.addColorStop(0.5, `${star.color}${star.opacity * 0.3})`);
          gradient.addColorStop(1, `${star.color}0)`);
          ctx.fillStyle = gradient;
          ctx.arc(renderX, renderY, star.radius * 3, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = `${star.color}${star.opacity})`;
          ctx.arc(renderX, renderY, star.radius, 0, Math.PI * 2);
        }

        ctx.fill();

        // Update actual position
        star.x += star.velocity.x * deltaTime * 0.1;
        star.y += star.speed * deltaTime * 0.1;

        // Update velocity based on simple "wind" simulation
        star.velocity.y = star.speed;

        // Wrap around screen edges
        if (star.y > height + 10) {
          star.y = -10;
          star.x = Math.random() * width;
        }
        if (star.x > width + 10) {
          star.x = -10;
        } else if (star.x < -10) {
          star.x = width + 10;
        }
      });

      // Draw shooting stars occasionally (high quality only)
      if (quality === 'high' && Math.random() < 0.002) {
        drawShootingStar(ctx, width, height, timestamp);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Shooting star effect
    const shootingStars: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }> = [];

    const drawShootingStar = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      _timestamp: number
    ) => {
      const star = {
        x: Math.random() * width,
        y: Math.random() * height * 0.3, // Start in upper portion
        vx: (Math.random() - 0.3) * 15,
        vy: Math.random() * 10 + 5,
        life: 0,
        maxLife: 60,
      };
      shootingStars.push(star);
    };

    // Update and render shooting stars
    const updateShootingStars = () => {
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life++;

        const alpha = 1 - star.life / star.maxLife;

        // Draw trail
        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - star.vx * 5, star.y - star.vy * 5
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 5, star.y - star.vy * 5);
        ctx.stroke();

        if (star.life >= star.maxLife) {
          shootingStars.splice(i, 1);
        }
      }
    };

    // Modify animate to include shooting stars
    const originalAnimate = animate;
    const enhancedAnimate = (timestamp: number) => {
      originalAnimate(timestamp);
      updateShootingStars();
    };

    animationFrameId = requestAnimationFrame(enhancedAnimate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [predictStarPositions, updateAdaptiveQuality, getStarCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        opacity: 0.5,
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  );
};
