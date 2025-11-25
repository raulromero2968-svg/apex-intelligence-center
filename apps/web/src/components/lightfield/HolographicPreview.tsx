"use client";

/**
 * Holographic Preview Component
 *
 * Displays quilt assets with simulated holographic effect.
 * Implements pack-lfd-001 §2.3 (Preview/Fallback).
 *
 * Features:
 * - Mouse-based parallax simulation
 * - Quality preset selection
 * - Fallback for non-holographic displays
 * - Performance metrics display
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
interface QuiltConfig {
  viewCount: number;
  columns: number;
  rows: number;
  viewWidth: number;
  viewHeight: number;
  totalWidth: number;
  totalHeight: number;
  viewCone: number;
  depthiness: number;
}

interface HolographicPreviewProps {
  quiltTextureUrl?: string;
  fallbackPreviewUrl?: string;
  quiltConfig?: QuiltConfig;
  className?: string;
  showControls?: boolean;
  showMetrics?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

// Default config for preview
const DEFAULT_CONFIG: QuiltConfig = {
  viewCount: 45,
  columns: 8,
  rows: 6,
  viewWidth: 420,
  viewHeight: 560,
  totalWidth: 3360,
  totalHeight: 3360,
  viewCone: 40,
  depthiness: 1.0,
};

export function HolographicPreview({
  quiltTextureUrl,
  fallbackPreviewUrl,
  quiltConfig = DEFAULT_CONFIG,
  className = "",
  showControls = true,
  showMetrics = false,
  autoRotate = false,
  rotationSpeed = 0.5,
}: HolographicPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState(Math.floor(quiltConfig.viewCount / 2));
  const [isHovering, setIsHovering] = useState(false);
  const [fps, setFps] = useState(60);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [rotation, setRotation] = useState(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  // Calculate view position from quilt grid
  const getViewPosition = useCallback((viewIndex: number) => {
    const col = viewIndex % quiltConfig.columns;
    const row = Math.floor(viewIndex / quiltConfig.columns);
    return {
      x: col * quiltConfig.viewWidth,
      y: (quiltConfig.rows - 1 - row) * quiltConfig.viewHeight, // Bottom-to-top
    };
  }, [quiltConfig]);

  // Handle mouse movement for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !isHovering) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0-1

    // Map horizontal position to view index
    const viewRange = quiltConfig.viewCount - 1;
    const targetView = Math.floor(x * viewRange);
    setCurrentView(Math.max(0, Math.min(viewRange, targetView)));
  }, [isHovering, quiltConfig.viewCount]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || isHovering) return;

    const interval = setInterval(() => {
      setRotation((prev) => {
        const newRotation = prev + rotationSpeed;
        // Map rotation to view index (cycling through views)
        const normalizedRotation = (newRotation % 360) / 360;
        const viewIndex = Math.floor(normalizedRotation * quiltConfig.viewCount);
        setCurrentView(viewIndex);
        return newRotation;
      });
    }, 1000 / 30); // 30fps for rotation

    return () => clearInterval(interval);
  }, [autoRotate, isHovering, rotationSpeed, quiltConfig.viewCount]);

  // FPS counter
  useEffect(() => {
    if (!showMetrics) return;

    const measureFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      requestAnimationFrame(measureFps);
    };

    const frameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(frameId);
  }, [showMetrics]);

  // Get quality-based view count
  const getEffectiveViewCount = () => {
    switch (quality) {
      case "low": return Math.min(32, quiltConfig.viewCount);
      case "medium": return Math.min(45, quiltConfig.viewCount);
      case "high": return quiltConfig.viewCount;
      default: return quiltConfig.viewCount;
    }
  };

  const viewPos = getViewPosition(currentView);

  // If no quilt texture, show fallback
  if (!quiltTextureUrl) {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-slate-800/50 ${className}`}>
        {fallbackPreviewUrl ? (
          <img
            src={fallbackPreviewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <div>No quilt texture available</div>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-slate-400">
          2D Fallback
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main preview area */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900/30 border border-cyan-500/20 cursor-crosshair"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        style={{
          aspectRatio: `${quiltConfig.viewWidth} / ${quiltConfig.viewHeight}`,
        }}
      >
        {/* Quilt view (clipped to single view) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundImage: `url(${quiltTextureUrl})`,
            backgroundSize: `${quiltConfig.totalWidth}px ${quiltConfig.totalHeight}px`,
            backgroundPosition: `-${viewPos.x}px -${viewPos.y}px`,
            transition: isHovering ? "none" : "background-position 0.1s ease-out",
          }}
        />

        {/* Holographic overlay effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${45 + currentView * 2}deg,
              rgba(0, 255, 255, 0.05) 0%,
              transparent 30%,
              rgba(255, 0, 255, 0.05) 70%,
              transparent 100%)`,
          }}
        />

        {/* View indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-xs font-mono">
          <span className="text-cyan-300">View</span>{" "}
          <span className="text-white">{currentView + 1}</span>
          <span className="text-slate-400">/{quiltConfig.viewCount}</span>
        </div>

        {/* Interaction hint */}
        {!isHovering && !autoRotate && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 rounded text-xs text-slate-300">
            Move mouse to explore views
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-3 flex items-center justify-between gap-4">
          {/* View slider */}
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={quiltConfig.viewCount - 1}
              value={currentView}
              onChange={(e) => setCurrentView(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          {/* Quality selector */}
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  quality === q
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
                }`}
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {showMetrics && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400">FPS</div>
              <div className={`font-mono ${fps >= 30 ? "text-emerald-300" : "text-amber-300"}`}>
                <HoloNumber value={fps} />
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Views</div>
              <div className="font-mono text-slate-200">{getEffectiveViewCount()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">View Cone</div>
              <div className="font-mono text-slate-200">{quiltConfig.viewCone}°</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Depth</div>
              <div className="font-mono text-slate-200">{quiltConfig.depthiness.toFixed(1)}x</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HolographicPreview;
