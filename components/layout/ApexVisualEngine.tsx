'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced Apex Visual Engine with GPU Optimizations
 *
 * Implements Jensen Huang's vision for visual computing:
 * - Frame prediction for smooth 60fps animations
 * - Adaptive quality based on device capabilities
 * - Batch rendering for GPU efficiency
 * - Particle pooling to reduce garbage collection
 *
 * Visual Elements:
 * - Parallax starfield with depth layers
 * - Matrix rain effect (meditative river)
 * - Shooting card physics with glow effects
 * - Dynamic grid overlay
 *
 * @module components/ApexVisualEngine
 */

interface ShootingCard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  color: string;
  glowColor: string;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  angle: number;
  spin: number;
  // Prediction state
  predictedX: number;
  predictedY: number;
  active: boolean; // For object pooling
}

interface Star {
  x: number;
  y: number;
  z: number; // Depth layer
  size: number;
  speed: number;
  opacity: number;
  color: string;
  // Prediction
  predictedY: number;
}

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  char: string;
  opacity: number;
  nextCharTime: number;
}

interface PerformanceState {
  fps: number;
  quality: 'low' | 'medium' | 'high';
  lastFrameTime: number;
  frameCount: number;
  fpsUpdateTime: number;
}

// Object pool for cards to reduce GC pressure
const CARD_POOL_SIZE = 20;

export function ApexVisualEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const cardsRef = useRef<ShootingCard[]>([]);
  const matrixRef = useRef<MatrixDrop[]>([]);
  const perfRef = useRef<PerformanceState>({
    fps: 60,
    quality: 'high',
    lastFrameTime: 0,
    frameCount: 0,
    fpsUpdateTime: 0,
  });
  const spawnTimerRef = useRef<number>(0);

  /**
   * Predict positions for smoother rendering (Jensen's time machine)
   */
  const predictPositions = useCallback((deltaTime: number) => {
    const predictionTime = deltaTime * 2; // 2 frames ahead

    // Predict stars
    starsRef.current.forEach((star) => {
      const depthFactor = 1 / (star.z + 1);
      star.predictedY = star.y + star.speed * depthFactor * predictionTime;
    });

    // Predict cards
    cardsRef.current.forEach((card) => {
      if (!card.active) return;
      card.predictedX = card.x + card.vx * predictionTime;
      card.predictedY = card.y + (card.vy + card.gravity * predictionTime) * predictionTime;
    });
  }, []);

  /**
   * Update adaptive quality based on FPS
   */
  const updateQuality = useCallback((fps: number) => {
    if (fps < 25) {
      perfRef.current.quality = 'low';
    } else if (fps < 45) {
      perfRef.current.quality = 'medium';
    } else {
      perfRef.current.quality = 'high';
    }
  }, []);

  /**
   * Get card from pool or create new
   */
  const getCardFromPool = useCallback((
    width: number,
    height: number
  ): ShootingCard | null => {
    // Find inactive card in pool
    const inactiveCard = cardsRef.current.find((c) => !c.active);
    if (inactiveCard) {
      return inactiveCard;
    }

    // Create new if pool not full
    if (cardsRef.current.length < CARD_POOL_SIZE) {
      const newCard: ShootingCard = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0.08,
        color: '#22d3ee',
        glowColor: 'rgba(34, 211, 238, 0.5)',
        w: 40,
        h: 56,
        life: 0,
        maxLife: 400,
        angle: 0,
        spin: 0,
        predictedX: 0,
        predictedY: 0,
        active: false,
      };
      cardsRef.current.push(newCard);
      return newCard;
    }

    return null;
  }, []);

  /**
   * Spawn a new shooting card
   */
  const spawnCard = useCallback((width: number, height: number) => {
    const card = getCardFromPool(width, height);
    if (!card) return;

    const startLeft = Math.random() > 0.5;
    card.x = startLeft ? -100 : width + 100;
    card.y = height * (0.6 + Math.random() * 0.3);
    card.vx = (3 + Math.random() * 2) * (startLeft ? 1 : -1);
    card.vy = -(6 + Math.random() * 4);
    card.gravity = 0.08;
    card.color = Math.random() > 0.5 ? '#22d3ee' : '#a855f7';
    card.glowColor = card.color === '#22d3ee'
      ? 'rgba(34, 211, 238, 0.5)'
      : 'rgba(168, 85, 247, 0.5)';
    card.life = 0;
    card.maxLife = 400;
    card.angle = 0;
    card.spin = (Math.random() - 0.5) * 0.02;
    card.active = true;
  }, [getCardFromPool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Request high-performance context
    const ctx = canvas.getContext('2d', {
      alpha: false, // Opaque background for better performance
      desynchronized: true, // GPU optimization
    });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Initialize stars with depth layers
    const starColors = [
      'rgba(255, 255, 255, ',
      'rgba(34, 211, 238, ',
      'rgba(168, 85, 247, ',
    ];

    const initStars = () => {
      const quality = perfRef.current.quality;
      const count = quality === 'high' ? 180 : quality === 'medium' ? 120 : 80;

      starsRef.current = Array(count).fill(0).map(() => {
        const z = Math.random() * 3;
        const depthFactor = 1 / (z + 1);
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          size: (Math.random() * 2 + 0.5) * depthFactor,
          speed: (Math.random() * 0.3 + 0.1),
          opacity: Math.random() * 0.5 + 0.3,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          predictedY: 0,
        };
      });
    };

    // Initialize matrix rain
    const initMatrix = () => {
      const cols = Math.floor(width / 25);
      matrixRef.current = Array(cols).fill(0).map((_, i) => ({
        x: i * 25,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 0.5,
        char: String.fromCharCode(0x30A0 + Math.random() * 96),
        opacity: 0.3 + Math.random() * 0.3,
        nextCharTime: 0,
      }));
    };

    initStars();
    initMatrix();

    // Animation loop
    let animationFrameId: number;

    const render = (timestamp: number) => {
      // Calculate delta time and FPS
      const deltaTime = timestamp - perfRef.current.lastFrameTime;
      perfRef.current.lastFrameTime = timestamp;
      perfRef.current.frameCount++;

      // Update FPS every second
      if (timestamp - perfRef.current.fpsUpdateTime >= 1000) {
        perfRef.current.fps = perfRef.current.frameCount;
        updateQuality(perfRef.current.fps);
        perfRef.current.frameCount = 0;
        perfRef.current.fpsUpdateTime = timestamp;
      }

      const quality = perfRef.current.quality;

      // Predict positions for smooth rendering
      predictPositions(deltaTime);

      // CLEAR with fade effect
      ctx.fillStyle = quality === 'high' ? 'rgba(2, 6, 23, 0.2)' : 'rgba(2, 6, 23, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // A. GRID (only on high quality)
      if (quality === 'high') {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      // B. STARS with parallax and prediction
      starsRef.current.forEach((star) => {
        const depthFactor = 1 / (star.z + 1);

        // Use predicted position for smoother rendering
        const renderY = star.y * 0.3 + star.predictedY * 0.7;

        // Twinkle effect
        const twinkle = Math.sin(timestamp * 0.002 + star.x * 0.01) * 0.2 + 0.8;
        const opacity = star.opacity * twinkle;

        ctx.beginPath();

        // Glow for close stars (high quality)
        if (quality === 'high' && star.z < 1) {
          const gradient = ctx.createRadialGradient(
            star.x, renderY, 0,
            star.x, renderY, star.size * 3
          );
          gradient.addColorStop(0, `${star.color}${opacity})`);
          gradient.addColorStop(0.5, `${star.color}${opacity * 0.3})`);
          gradient.addColorStop(1, `${star.color}0)`);
          ctx.fillStyle = gradient;
          ctx.arc(star.x, renderY, star.size * 3, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = `${star.color}${opacity})`;
          ctx.arc(star.x, renderY, star.size, 0, Math.PI * 2);
        }
        ctx.fill();

        // Update position
        star.y += star.speed * depthFactor * deltaTime * 0.05;

        // Reset when off screen
        if (star.y > height + 10) {
          star.y = -10;
          star.x = Math.random() * width;
        }
      });

      // C. MATRIX RAIN (reduced on low quality)
      if (quality !== 'low') {
        ctx.font = quality === 'high' ? '16px monospace' : '14px monospace';

        matrixRef.current.forEach((drop) => {
          // Update character periodically
          if (timestamp > drop.nextCharTime && Math.random() > 0.95) {
            drop.char = String.fromCharCode(0x30A0 + Math.random() * 96);
            drop.nextCharTime = timestamp + 100;
          }

          // Draw with fade
          const fadeOpacity = drop.opacity * (quality === 'high' ? 0.6 : 0.4);
          ctx.fillStyle = `rgba(168, 85, 247, ${fadeOpacity})`;
          ctx.fillText(drop.char, drop.x, drop.y);

          // Update position
          drop.y += drop.speed * deltaTime * 0.05;

          // Reset
          if (drop.y > height + 50) {
            drop.y = -50;
            drop.opacity = 0.3 + Math.random() * 0.3;
          }
        });
      }

      // D. SHOOTING CARDS with physics and prediction
      // Spawn new cards
      spawnTimerRef.current += deltaTime;
      const spawnInterval = quality === 'high' ? 1500 : quality === 'medium' ? 2000 : 3000;
      if (spawnTimerRef.current > spawnInterval) {
        spawnCard(width, height);
        spawnTimerRef.current = 0;
      }

      // Render active cards
      cardsRef.current.forEach((card) => {
        if (!card.active) return;

        // Physics update
        card.x += card.vx * deltaTime * 0.06;
        card.y += card.vy * deltaTime * 0.06;
        card.vy += card.gravity * deltaTime * 0.1;
        card.angle += card.spin * deltaTime * 0.1;
        card.life += deltaTime;

        // Use predicted position for smoother rendering
        const renderX = card.x * 0.4 + card.predictedX * 0.6;
        const renderY = card.y * 0.4 + card.predictedY * 0.6;

        // Draw card with glow
        ctx.save();
        ctx.translate(renderX + card.w / 2, renderY + card.h / 2);
        ctx.rotate(card.angle);

        // Glow effect (high quality)
        if (quality === 'high') {
          ctx.shadowColor = card.color;
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowBlur = 10;
        }

        ctx.strokeStyle = card.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 4);
        ctx.stroke();

        // Inner glow (high quality only)
        if (quality === 'high') {
          ctx.fillStyle = card.glowColor;
          ctx.fill();
        }

        ctx.restore();

        // Deactivate when off screen or expired
        if (card.y > height + 100 || card.life > card.maxLife) {
          card.active = false;
        }
      });

      // E. Scanline effect (high quality only)
      if (quality === 'high') {
        const scanlineY = (timestamp * 0.1) % height;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.03)';
        ctx.fillRect(0, scanlineY, width, 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [predictPositions, updateQuality, spawnCard]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
      style={{ background: '#020617' }}
      aria-hidden="true"
    />
  );
}
