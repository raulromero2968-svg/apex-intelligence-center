"use client";

/**
 * XR Preview Panel Component
 *
 * Live browser simulation for WebXR sessions.
 * Implements pack-webxr-001 §2.1 (XR Preview Panel).
 *
 * Features:
 * - 3D viewport with WebXR simulation
 * - VR/AR/Inline mode toggle
 * - Device emulation
 * - Performance metrics
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type SessionMode = "inline" | "immersive-vr" | "immersive-ar";
type DeviceEmulation = "quest_3" | "vision_pro" | "mobile_ar" | "desktop";

interface SceneObject {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  isInteractable?: boolean;
}

interface XRPreviewPanelProps {
  objects?: SceneObject[];
  sessionMode?: SessionMode;
  onSessionModeChange?: (mode: SessionMode) => void;
  onObjectSelect?: (objectId: string) => void;
  onObjectTransform?: (objectId: string, transform: { position?: [number, number, number] }) => void;
  className?: string;
  showPerformanceMetrics?: boolean;
}

// Device specs for emulation
const DEVICE_SPECS: Record<
  DeviceEmulation,
  { name: string; fov: number; resolution: string; features: string[] }
> = {
  quest_3: {
    name: "Meta Quest 3",
    fov: 110,
    resolution: "2064x2208",
    features: ["hand-tracking", "passthrough", "plane-detection"],
  },
  vision_pro: {
    name: "Apple Vision Pro",
    fov: 100,
    resolution: "3660x3200",
    features: ["hand-tracking", "eye-tracking", "spatial-audio"],
  },
  mobile_ar: {
    name: "Mobile AR",
    fov: 60,
    resolution: "1080x2400",
    features: ["hit-test", "light-estimation"],
  },
  desktop: {
    name: "Desktop Browser",
    fov: 75,
    resolution: "1920x1080",
    features: ["mouse", "keyboard"],
  },
};

// Mode backgrounds
const MODE_BACKGROUNDS: Record<SessionMode, string> = {
  inline: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
  "immersive-vr": "radial-gradient(circle at center, #0a0a1a 0%, #000008 100%)",
  "immersive-ar": "linear-gradient(180deg, rgba(20,40,60,0.3) 0%, rgba(10,20,30,0.5) 100%)",
};

export function XRPreviewPanel({
  objects = [],
  sessionMode: initialMode = "inline",
  onSessionModeChange,
  onObjectSelect,
  onObjectTransform,
  className = "",
  showPerformanceMetrics = true,
}: XRPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>(initialMode);
  const [deviceEmulation, setDeviceEmulation] = useState<DeviceEmulation>("quest_3");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 1.6, 3]);
  const [cameraRotation, setCameraRotation] = useState<[number, number]>([0, 0]);
  const [fps, setFps] = useState(90);
  const [drawCalls, setDrawCalls] = useState(45);
  const [triangles, setTriangles] = useState(125000);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Handle mode change
  const handleModeChange = useCallback(
    (mode: SessionMode) => {
      setSessionMode(mode);
      onSessionModeChange?.(mode);
    },
    [onSessionModeChange]
  );

  // Handle object click
  const handleObjectClick = useCallback(
    (objectId: string) => {
      setSelectedObjectId(objectId);
      onObjectSelect?.(objectId);
    },
    [onObjectSelect]
  );

  // Handle mouse drag for camera rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !lastMousePos.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      setCameraRotation((prev) => [
        Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev[0] - deltaY * 0.005)),
        prev[1] - deltaX * 0.005,
      ]);

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastMousePos.current = null;
  }, []);

  // Simulate FPS fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      const targetFps = deviceEmulation === "vision_pro" ? 90 : deviceEmulation === "quest_3" ? 72 : 60;
      setFps(Math.round(targetFps - 2 + Math.random() * 4));
      setDrawCalls(Math.round(40 + Math.random() * 20));
      setTriangles(Math.round(100000 + Math.random() * 50000));
    }, 1000);
    return () => clearInterval(interval);
  }, [deviceEmulation]);

  // Project 3D position to 2D screen coordinates
  const project3DTo2D = useCallback(
    (pos: [number, number, number]): [number, number] => {
      const fov = DEVICE_SPECS[deviceEmulation].fov;
      const aspectRatio = 16 / 9;

      // Simple perspective projection
      const relX = pos[0] - cameraPosition[0];
      const relY = pos[1] - cameraPosition[1];
      const relZ = pos[2] - cameraPosition[2];

      // Apply camera rotation
      const cosY = Math.cos(cameraRotation[1]);
      const sinY = Math.sin(cameraRotation[1]);
      const rotatedX = relX * cosY + relZ * sinY;
      const rotatedZ = -relX * sinY + relZ * cosY;

      if (rotatedZ >= 0) return [-1000, -1000]; // Behind camera

      const scale = (fov / 100) / -rotatedZ;
      const screenX = 50 + rotatedX * scale * 100;
      const screenY = 50 - (relY * scale * 100) / aspectRatio;

      return [screenX, screenY];
    },
    [cameraPosition, cameraRotation, deviceEmulation]
  );

  const deviceSpec = DEVICE_SPECS[deviceEmulation];

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-blue-900/50 rounded-xl border border-blue-500/20 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">🥽</div>
          <div>
            <h3 className="text-sm font-semibold text-blue-300">XR Preview</h3>
            <div className="text-xs text-slate-400">{deviceSpec.name}</div>
          </div>
        </div>

        {/* Device selector */}
        <div className="flex gap-1">
          {(Object.keys(DEVICE_SPECS) as DeviceEmulation[]).map((device) => (
            <button
              key={device}
              onClick={() => setDeviceEmulation(device)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                deviceEmulation === device
                  ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                  : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
              }`}
            >
              {device === "quest_3"
                ? "Quest 3"
                : device === "vision_pro"
                ? "Vision Pro"
                : device === "mobile_ar"
                ? "Mobile"
                : "Desktop"}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-3 py-2 border-b border-blue-500/10 flex items-center justify-between">
        <div className="text-xs text-slate-400">Session Mode</div>
        <div className="flex gap-1">
          {(["inline", "immersive-vr", "immersive-ar"] as SessionMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sessionMode === mode
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
              }`}
            >
              {mode === "inline" ? "Inline" : mode === "immersive-vr" ? "VR" : "AR"}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="relative h-72 cursor-move overflow-hidden"
        style={{ background: MODE_BACKGROUNDS[sessionMode] }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* AR passthrough simulation */}
        {sessionMode === "immersive-ar" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23334155' fill-opacity='0.3' width='100' height='100'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%23475569' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
              opacity: 0.3,
            }}
          />
        )}

        {/* VR stereo view lines */}
        {sessionMode === "immersive-vr" && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 border-r border-slate-700/30" />
            <div className="flex-1" />
          </div>
        )}

        {/* Grid floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(59,130,246,0.15) 0%, transparent 100%)`,
              transform: "perspective(400px) rotateX(60deg)",
              transformOrigin: "bottom",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px),
                linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              transform: "perspective(400px) rotateX(60deg)",
              transformOrigin: "bottom",
            }}
          />
        </div>

        {/* Scene objects */}
        {objects.map((obj) => {
          const [screenX, screenY] = project3DTo2D(obj.position);
          const isSelected = selectedObjectId === obj.id;
          const distance = Math.sqrt(
            Math.pow(obj.position[2] - cameraPosition[2], 2) +
              Math.pow(obj.position[0] - cameraPosition[0], 2)
          );
          const scale = Math.max(0.3, Math.min(1.5, 3 / distance));

          if (screenX < -50 || screenX > 150 || screenY < -50 || screenY > 150) return null;

          return (
            <div
              key={obj.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer ${
                obj.isInteractable ? "hover:scale-110" : ""
              }`}
              style={{
                left: `${screenX}%`,
                top: `${screenY}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(100 - distance * 10),
              }}
              onClick={() => handleObjectClick(obj.id)}
            >
              {/* Object visual */}
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? "ring-2 ring-cyan-400 bg-cyan-500/30"
                    : "bg-slate-800/70 hover:bg-slate-700/70"
                }`}
                style={{
                  backgroundColor: obj.color ? `${obj.color}40` : undefined,
                  borderColor: obj.color,
                  borderWidth: obj.color ? 1 : 0,
                }}
              >
                <div className="text-center">
                  <div className="text-xl">
                    {obj.type === "mesh"
                      ? "📦"
                      : obj.type === "model"
                      ? "🎭"
                      : obj.type === "light"
                      ? "💡"
                      : obj.type === "ui_panel"
                      ? "🖼️"
                      : "⬜"}
                  </div>
                  <div className="text-xs text-slate-300 truncate w-14">{obj.name}</div>
                </div>
              </div>

              {/* Selection glow */}
              {isSelected && <div className="absolute inset-0 rounded-lg bg-cyan-400/20 blur-md -z-10" />}
            </div>
          );
        })}

        {/* Controller visualization (VR mode) */}
        {sessionMode === "immersive-vr" && (
          <>
            <div className="absolute bottom-8 left-1/4 transform -translate-x-1/2">
              <div className="w-3 h-8 bg-gradient-to-t from-blue-500/50 to-transparent rounded-full" />
              <div className="text-xs text-blue-300 text-center mt-1">L</div>
            </div>
            <div className="absolute bottom-8 right-1/4 transform translate-x-1/2">
              <div className="w-3 h-8 bg-gradient-to-t from-blue-500/50 to-transparent rounded-full" />
              <div className="text-xs text-blue-300 text-center mt-1">R</div>
            </div>
          </>
        )}

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 border border-white/30 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Mode indicator */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/80 rounded text-xs flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              sessionMode === "immersive-vr"
                ? "bg-purple-400"
                : sessionMode === "immersive-ar"
                ? "bg-green-400"
                : "bg-blue-400"
            }`}
          />
          <span className="text-slate-300 capitalize">{sessionMode.replace("-", " ")}</span>
        </div>

        {/* Camera info */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-slate-400">
          FOV: {deviceSpec.fov}°
        </div>
      </div>

      {/* Device features */}
      <div className="px-3 py-2 border-t border-blue-500/10">
        <div className="flex flex-wrap gap-1">
          {deviceSpec.features.map((feature) => (
            <span
              key={feature}
              className="px-2 py-0.5 bg-slate-800/50 rounded text-xs text-slate-400"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Performance metrics */}
      {showPerformanceMetrics && (
        <div className="p-3 border-t border-blue-500/20 grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-400">FPS</div>
            <div
              className={`text-lg font-mono ${
                fps >= 70 ? "text-emerald-300" : fps >= 50 ? "text-amber-300" : "text-red-400"
              }`}
            >
              <HoloNumber value={fps} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Draw Calls</div>
            <div className="text-lg font-mono text-slate-200">
              <HoloNumber value={drawCalls} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Triangles</div>
            <div className="text-lg font-mono text-slate-200">
              {(triangles / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Objects</div>
            <div className="text-lg font-mono text-blue-300">
              <HoloNumber value={objects.length} />
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="px-3 pb-3 text-xs text-slate-500 text-center">
        Drag to rotate view • Click objects to select • Switch modes above
      </div>
    </div>
  );
}

export default XRPreviewPanel;
