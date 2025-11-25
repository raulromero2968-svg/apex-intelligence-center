"use client";

/**
 * Spatial Preview Panel Component
 *
 * Simulates Vision Pro spatial experience in browser.
 * Implements pack-visionos-001 §2.1 (Spatial Preview Panel).
 *
 * Features:
 * - 3D viewport with gaze cursor simulation
 * - Shared/Full space mode toggle
 * - Gesture visualization
 * - Entity selection and interaction
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type SpaceMode = "shared" | "full" | "progressive";
type DeviceSimulation = "vision_pro" | "simulator" | "web";

interface Entity3D {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isInteractable?: boolean;
}

interface GazeCursor {
  position: [number, number];
  isOnTarget: boolean;
  targetEntityId?: string;
  dwellProgress: number;
}

interface SpatialPreviewPanelProps {
  entities?: Entity3D[];
  spaceMode?: SpaceMode;
  onSpaceModeChange?: (mode: SpaceMode) => void;
  onEntitySelect?: (entityId: string) => void;
  onGesturePerformed?: (gesture: string, entityId?: string) => void;
  className?: string;
  showDebugInfo?: boolean;
}

export function SpatialPreviewPanel({
  entities = [],
  spaceMode: initialSpaceMode = "shared",
  onSpaceModeChange,
  onEntitySelect,
  onGesturePerformed,
  className = "",
  showDebugInfo = false,
}: SpatialPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spaceMode, setSpaceMode] = useState<SpaceMode>(initialSpaceMode);
  const [deviceSim, setDeviceSim] = useState<DeviceSimulation>("vision_pro");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [gazeCursor, setGazeCursor] = useState<GazeCursor>({
    position: [0, 0],
    isOnTarget: false,
    dwellProgress: 0,
  });
  const [isPinching, setIsPinching] = useState(false);
  const [fps, setFps] = useState(90);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Space mode backgrounds
  const spaceModeBackgrounds: Record<SpaceMode, string> = {
    shared: "linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)",
    full: "radial-gradient(circle at center, #0f0f1f 0%, #000008 100%)",
    progressive: "linear-gradient(180deg, rgba(10,10,26,0.8) 0%, rgba(0,0,8,0.95) 100%)",
  };

  // Handle space mode change
  const handleSpaceModeChange = useCallback(
    (mode: SpaceMode) => {
      setSpaceMode(mode);
      onSpaceModeChange?.(mode);
    },
    [onSpaceModeChange]
  );

  // Handle mouse move for gaze simulation
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if hovering over any entity
      const hoveredEntity = entities.find((entity) => {
        if (!entity.isInteractable) return false;
        // Simple 2D distance check (in real implementation, this would be ray casting)
        const entityX = rect.width / 2 + entity.position[0] * 100;
        const entityY = rect.height / 2 - entity.position[1] * 100;
        const distance = Math.sqrt(Math.pow(x - entityX, 2) + Math.pow(y - entityY, 2));
        return distance < 40;
      });

      const newCursor: GazeCursor = {
        position: [x, y],
        isOnTarget: !!hoveredEntity,
        targetEntityId: hoveredEntity?.id,
        dwellProgress: hoveredEntity?.id === gazeCursor.targetEntityId ? gazeCursor.dwellProgress : 0,
      };

      setGazeCursor(newCursor);

      // Start dwell timer on new target
      if (hoveredEntity && hoveredEntity.id !== gazeCursor.targetEntityId) {
        if (dwellTimerRef.current) {
          clearInterval(dwellTimerRef.current);
        }
        dwellTimerRef.current = setInterval(() => {
          setGazeCursor((prev) => ({
            ...prev,
            dwellProgress: Math.min(prev.dwellProgress + 0.05, 1),
          }));
        }, 40);
      } else if (!hoveredEntity && dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    },
    [entities, gazeCursor.targetEntityId]
  );

  // Handle click for pinch simulation
  const handleClick = useCallback(() => {
    if (gazeCursor.isOnTarget && gazeCursor.targetEntityId) {
      setSelectedEntityId(gazeCursor.targetEntityId);
      onEntitySelect?.(gazeCursor.targetEntityId);
      onGesturePerformed?.("gaze_pinch", gazeCursor.targetEntityId);
    }
  }, [gazeCursor, onEntitySelect, onGesturePerformed]);

  // Handle mouse down/up for pinch state
  const handleMouseDown = useCallback(() => setIsPinching(true), []);
  const handleMouseUp = useCallback(() => setIsPinching(false), []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
      }
    };
  }, []);

  // FPS simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate FPS fluctuation
      setFps(Math.round(88 + Math.random() * 4));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl border border-cyan-500/20 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">👓</div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-300">Spatial Preview</h3>
            <div className="text-xs text-slate-400">Vision Pro Simulator</div>
          </div>
        </div>

        {/* Device selector */}
        <div className="flex gap-1">
          {(["vision_pro", "simulator", "web"] as DeviceSimulation[]).map((device) => (
            <button
              key={device}
              onClick={() => setDeviceSim(device)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                deviceSim === device
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
              }`}
            >
              {device === "vision_pro" ? "Vision Pro" : device === "simulator" ? "Simulator" : "Web"}
            </button>
          ))}
        </div>
      </div>

      {/* Space mode selector */}
      <div className="px-3 py-2 border-b border-cyan-500/10 flex items-center justify-between">
        <div className="text-xs text-slate-400">Space Mode</div>
        <div className="flex gap-1">
          {(["shared", "progressive", "full"] as SpaceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSpaceModeChange(mode)}
              className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                spaceMode === mode
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                  : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="relative h-80 cursor-crosshair overflow-hidden"
        style={{ background: spaceModeBackgrounds[spaceMode] }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Passthrough visualization (for shared/progressive) */}
        {spaceMode !== "full" && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: spaceMode === "progressive" ? 0.1 : 0.3,
            }}
          />
        )}

        {/* 3D Grid floor */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,255,255,0.1) 0%, transparent 100%)`,
              transform: "perspective(500px) rotateX(60deg)",
              transformOrigin: "bottom",
            }}
          />
        </div>

        {/* Entities */}
        {entities.map((entity) => {
          const isSelected = selectedEntityId === entity.id;
          const isHovered = gazeCursor.targetEntityId === entity.id;

          return (
            <div
              key={entity.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                entity.isInteractable ? "cursor-pointer" : ""
              }`}
              style={{
                left: `calc(50% + ${entity.position[0] * 100}px)`,
                top: `calc(50% - ${entity.position[1] * 100}px)`,
                transform: `translate(-50%, -50%) scale(${entity.scale[0] * (isHovered ? 1.1 : 1)})`,
                zIndex: Math.round(10 - entity.position[2]),
              }}
            >
              {/* Entity visual */}
              <div
                className={`w-16 h-20 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? "ring-2 ring-cyan-400 bg-cyan-500/30"
                    : isHovered
                    ? "ring-1 ring-cyan-400/50 bg-slate-700/50"
                    : "bg-slate-800/70"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl">
                    {entity.type === "card" ? "🎴" : entity.type === "chart" ? "📊" : "📦"}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate w-14">{entity.name}</div>
                </div>
              </div>

              {/* Hover effect (glow) */}
              {isHovered && entity.isInteractable && (
                <div className="absolute inset-0 rounded-lg bg-cyan-400/20 blur-md -z-10" />
              )}
            </div>
          );
        })}

        {/* Gaze cursor */}
        <div
          className="absolute w-6 h-6 pointer-events-none"
          style={{
            left: gazeCursor.position[0] - 12,
            top: gazeCursor.position[1] - 12,
          }}
        >
          {/* Cursor ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 transition-colors ${
              gazeCursor.isOnTarget
                ? isPinching
                  ? "border-green-400 bg-green-400/30"
                  : "border-cyan-400"
                : "border-white/50"
            }`}
          />

          {/* Dwell progress */}
          {gazeCursor.isOnTarget && gazeCursor.dwellProgress > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeDasharray={`${gazeCursor.dwellProgress * 62.8} 62.8`}
                className="opacity-70"
              />
            </svg>
          )}

          {/* Center dot */}
          <div
            className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2 ${
              isPinching ? "bg-green-400" : "bg-white"
            }`}
          />
        </div>

        {/* Pinch indicator */}
        {isPinching && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
            👌 Pinching
          </div>
        )}

        {/* Space mode indicator */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/80 rounded text-xs">
          <span className="text-slate-400">Mode:</span>{" "}
          <span className="text-purple-300 capitalize">{spaceMode}</span>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="p-3 border-t border-cyan-500/20">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-400">FPS</div>
            <div className={`text-lg font-mono ${fps >= 85 ? "text-emerald-300" : "text-amber-300"}`}>
              <HoloNumber value={fps} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Entities</div>
            <div className="text-lg font-mono text-slate-200">{entities.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Gaze</div>
            <div className={`text-lg ${gazeCursor.isOnTarget ? "text-cyan-300" : "text-slate-500"}`}>
              {gazeCursor.isOnTarget ? "●" : "○"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Selected</div>
            <div className="text-lg text-cyan-300">
              {selectedEntityId ? "✓" : "—"}
            </div>
          </div>
        </div>

        {/* Debug info */}
        {showDebugInfo && (
          <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs font-mono text-slate-400">
            <div>Cursor: [{Math.round(gazeCursor.position[0])}, {Math.round(gazeCursor.position[1])}]</div>
            <div>Target: {gazeCursor.targetEntityId ?? "none"}</div>
            <div>Dwell: {(gazeCursor.dwellProgress * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="px-3 pb-3 text-xs text-slate-500 text-center">
        Move mouse to simulate gaze • Click to pinch • Look at entities to select
      </div>
    </div>
  );
}

export default SpatialPreviewPanel;
