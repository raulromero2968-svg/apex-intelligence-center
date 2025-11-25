"use client";

/**
 * Volumetric Dashboard Builder Component
 *
 * Visual editor for creating 3D holographic scenes.
 * Implements pack-lfd-001 §4 (Scene Composition).
 *
 * Features:
 * - Drag-and-drop object placement
 * - Layer management
 * - Data binding configuration
 * - Live preview with depth visualization
 */

import React, { useState, useCallback } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type SceneType = "card_showcase" | "market_dashboard" | "data_visualization" | "product_display" | "custom";
type ObjectType = "quilt" | "model" | "chart" | "text";

interface SceneObject {
  id: string;
  type: ObjectType;
  name: string;
  assetId?: string;
  modelUrl?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  metadata?: Record<string, unknown>;
}

interface SceneConfig {
  backgroundColor: string;
  ambientLight: { color: string; intensity: number };
  directionalLight?: { color: string; intensity: number; position: [number, number, number] };
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
  autoRotate?: boolean;
}

interface DataBinding {
  objectId: string;
  dataSource: string;
  property: string;
  transform?: string;
}

interface VolumetricScene {
  id?: string;
  name: string;
  description?: string;
  sceneType: SceneType;
  sceneConfig: SceneConfig;
  objects: SceneObject[];
  dataBindings?: DataBinding[];
}

interface VolumetricDashboardBuilderProps {
  scene?: VolumetricScene;
  onSave?: (scene: VolumetricScene) => void;
  onPreview?: () => void;
  className?: string;
}

// Default scene configuration
const DEFAULT_SCENE: VolumetricScene = {
  name: "New Scene",
  sceneType: "custom",
  sceneConfig: {
    backgroundColor: "#0a0a1a",
    ambientLight: { color: "#ffffff", intensity: 0.4 },
    directionalLight: { color: "#ffffff", intensity: 0.8, position: [5, 10, 5] },
    cameraPosition: [0, 0, 5],
    cameraTarget: [0, 0, 0],
    fov: 45,
    autoRotate: false,
  },
  objects: [],
  dataBindings: [],
};

// Object type configuration
const OBJECT_TYPES: Record<ObjectType, { icon: string; label: string; description: string }> = {
  quilt: { icon: "🎴", label: "Quilt Asset", description: "Pre-rendered holographic image" },
  model: { icon: "🧊", label: "3D Model", description: "glTF/GLB model" },
  chart: { icon: "📊", label: "Chart", description: "Data visualization" },
  text: { icon: "📝", label: "Text", description: "3D text label" },
};

// Scene type presets
const SCENE_PRESETS: Record<SceneType, { icon: string; label: string; config: Partial<SceneConfig> }> = {
  card_showcase: {
    icon: "🎴",
    label: "Card Showcase",
    config: {
      backgroundColor: "#0a0a1a",
      cameraPosition: [0, 0, 4],
      fov: 35,
      autoRotate: true,
    },
  },
  market_dashboard: {
    icon: "📈",
    label: "Market Dashboard",
    config: {
      backgroundColor: "#050510",
      cameraPosition: [0, 2, 8],
      cameraTarget: [0, 0, 0],
      fov: 50,
    },
  },
  data_visualization: {
    icon: "📊",
    label: "Data Visualization",
    config: {
      backgroundColor: "#0a0510",
      cameraPosition: [3, 3, 5],
      fov: 45,
    },
  },
  product_display: {
    icon: "🛍️",
    label: "Product Display",
    config: {
      backgroundColor: "#ffffff",
      ambientLight: { color: "#ffffff", intensity: 0.6 },
      cameraPosition: [0, 0, 5],
      fov: 40,
    },
  },
  custom: {
    icon: "⚙️",
    label: "Custom",
    config: {},
  },
};

export function VolumetricDashboardBuilder({
  scene: initialScene,
  onSave,
  onPreview,
  className = "",
}: VolumetricDashboardBuilderProps) {
  const [scene, setScene] = useState<VolumetricScene>(initialScene ?? DEFAULT_SCENE);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"objects" | "settings" | "bindings">("objects");
  const [isDirty, setIsDirty] = useState(false);

  // Get selected object
  const selectedObject = scene.objects.find((o) => o.id === selectedObjectId);

  // Update scene and mark dirty
  const updateScene = useCallback((updates: Partial<VolumetricScene>) => {
    setScene((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Add new object
  const addObject = useCallback((type: ObjectType) => {
    const newObject: SceneObject = {
      id: crypto.randomUUID(),
      type,
      name: `${OBJECT_TYPES[type].label} ${scene.objects.length + 1}`,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };

    updateScene({ objects: [...scene.objects, newObject] });
    setSelectedObjectId(newObject.id);
  }, [scene.objects, updateScene]);

  // Remove object
  const removeObject = useCallback((id: string) => {
    updateScene({
      objects: scene.objects.filter((o) => o.id !== id),
      dataBindings: scene.dataBindings?.filter((b) => b.objectId !== id),
    });
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
  }, [scene.objects, scene.dataBindings, selectedObjectId, updateScene]);

  // Update object property
  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    updateScene({
      objects: scene.objects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    });
  }, [scene.objects, updateScene]);

  // Apply scene preset
  const applyPreset = useCallback((type: SceneType) => {
    const preset = SCENE_PRESETS[type];
    updateScene({
      sceneType: type,
      sceneConfig: { ...scene.sceneConfig, ...preset.config },
    });
  }, [scene.sceneConfig, updateScene]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(scene);
    setIsDirty(false);
  }, [scene, onSave]);

  return (
    <div className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl border border-cyan-500/20 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={scene.name}
              onChange={(e) => updateScene({ name: e.target.value })}
              className="text-xl font-bold bg-transparent border-none text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1 -ml-2"
            />
            {isDirty && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded">
                Unsaved
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onPreview && (
              <button
                onClick={onPreview}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
              >
                Preview
              </button>
            )}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                Save Scene
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left panel - Objects & Settings */}
        <div className="w-72 border-r border-cyan-500/20 p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {(["objects", "settings", "bindings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Objects Tab */}
          {activeTab === "objects" && (
            <div className="space-y-4">
              {/* Add object buttons */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Add Object</div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(OBJECT_TYPES) as [ObjectType, typeof OBJECT_TYPES[ObjectType]][]).map(
                    ([type, config]) => (
                      <button
                        key={type}
                        onClick={() => addObject(type)}
                        className="p-2 bg-slate-800/50 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <div className="text-lg">{config.icon}</div>
                        <div className="text-xs text-slate-300">{config.label}</div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Object list */}
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Scene Objects ({scene.objects.length})
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {scene.objects.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4">
                      No objects yet
                    </div>
                  ) : (
                    scene.objects.map((obj) => (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedObjectId(obj.id)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between group ${
                          selectedObjectId === obj.id
                            ? "bg-cyan-500/20 border border-cyan-500/40"
                            : "bg-slate-800/30 border border-transparent hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{OBJECT_TYPES[obj.type].icon}</span>
                          <span className="text-sm text-slate-200">{obj.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeObject(obj.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              {/* Scene type */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Scene Type</div>
                <div className="space-y-1">
                  {(Object.entries(SCENE_PRESETS) as [SceneType, typeof SCENE_PRESETS[SceneType]][]).map(
                    ([type, preset]) => (
                      <button
                        key={type}
                        onClick={() => applyPreset(type)}
                        className={`w-full p-2 rounded-lg flex items-center gap-2 transition-colors ${
                          scene.sceneType === type
                            ? "bg-cyan-500/20 border border-cyan-500/40"
                            : "bg-slate-800/30 border border-transparent hover:bg-slate-800/50"
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span className="text-sm text-slate-200">{preset.label}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Lighting */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Ambient Light</div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={scene.sceneConfig.ambientLight.color}
                    onChange={(e) =>
                      updateScene({
                        sceneConfig: {
                          ...scene.sceneConfig,
                          ambientLight: { ...scene.sceneConfig.ambientLight, color: e.target.value },
                        },
                      })
                    }
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={scene.sceneConfig.ambientLight.intensity}
                    onChange={(e) =>
                      updateScene({
                        sceneConfig: {
                          ...scene.sceneConfig,
                          ambientLight: {
                            ...scene.sceneConfig.ambientLight,
                            intensity: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                    className="flex-1 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-400 w-8">
                    {scene.sceneConfig.ambientLight.intensity.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Background */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Background</div>
                <input
                  type="color"
                  value={scene.sceneConfig.backgroundColor}
                  onChange={(e) =>
                    updateScene({
                      sceneConfig: { ...scene.sceneConfig, backgroundColor: e.target.value },
                    })
                  }
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>

              {/* Auto-rotate */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Auto Rotate</span>
                <button
                  onClick={() =>
                    updateScene({
                      sceneConfig: { ...scene.sceneConfig, autoRotate: !scene.sceneConfig.autoRotate },
                    })
                  }
                  className={`w-10 h-5 rounded-full transition-colors ${
                    scene.sceneConfig.autoRotate ? "bg-cyan-500" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                      scene.sceneConfig.autoRotate ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Bindings Tab */}
          {activeTab === "bindings" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Data bindings connect scene objects to live data sources.
              </div>

              {scene.dataBindings?.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No data bindings configured
                </div>
              ) : (
                <div className="space-y-2">
                  {scene.dataBindings?.map((binding, i) => {
                    const obj = scene.objects.find((o) => o.id === binding.objectId);
                    return (
                      <div key={i} className="p-2 bg-slate-800/30 rounded-lg text-xs">
                        <div className="flex items-center gap-1 text-slate-300">
                          <span>{obj ? OBJECT_TYPES[obj.type].icon : "?"}</span>
                          <span>{obj?.name ?? "Unknown"}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-cyan-300">{binding.property}</span>
                        </div>
                        <div className="text-slate-500 mt-1 truncate">
                          {binding.dataSource}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center - Preview */}
        <div className="flex-1 p-4">
          <div
            className="h-96 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: scene.sceneConfig.backgroundColor }}
          >
            {/* Depth grid visualization */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="text-cyan-500">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Objects visualization */}
            {scene.objects.length === 0 ? (
              <div className="text-slate-500 text-center z-10">
                <div className="text-4xl mb-2">📦</div>
                <div>Add objects to build your scene</div>
              </div>
            ) : (
              <div className="relative z-10">
                {/* Simple 2D representation of objects */}
                {scene.objects.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`absolute w-16 h-16 flex items-center justify-center cursor-pointer transform transition-all ${
                      selectedObjectId === obj.id
                        ? "ring-2 ring-cyan-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{
                      left: `calc(50% + ${obj.position[0] * 40}px)`,
                      top: `calc(50% - ${obj.position[1] * 40}px)`,
                      transform: `translate(-50%, -50%) scale(${obj.scale[0]})`,
                      opacity: 0.5 + obj.position[2] * 0.1,
                    }}
                  >
                    <div className="text-3xl">{OBJECT_TYPES[obj.type].icon}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Depth indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-48 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 rounded-full opacity-50" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-400 space-y-16">
              <div>Near</div>
              <div>Focus</div>
              <div>Far</div>
            </div>
          </div>

          {/* Scene stats */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400">Objects</div>
              <div className="text-lg font-bold text-cyan-300">
                <HoloNumber value={scene.objects.length} />
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400">Bindings</div>
              <div className="text-lg font-bold text-purple-300">
                <HoloNumber value={scene.dataBindings?.length ?? 0} />
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400">FOV</div>
              <div className="text-lg font-bold text-slate-200">{scene.sceneConfig.fov}°</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400">Type</div>
              <div className="text-lg">{SCENE_PRESETS[scene.sceneType].icon}</div>
            </div>
          </div>
        </div>

        {/* Right panel - Object properties */}
        {selectedObject && (
          <div className="w-64 border-l border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Properties</h3>
              <button
                onClick={() => setSelectedObjectId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-slate-400">Name</label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                  className="w-full mt-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded text-sm text-slate-200"
                />
              </div>

              {/* Position */}
              <div>
                <label className="text-xs text-slate-400">Position (X, Y, Z)</label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {["X", "Y", "Z"].map((axis, i) => (
                    <input
                      key={axis}
                      type="number"
                      step={0.1}
                      value={selectedObject.position[i]}
                      onChange={(e) => {
                        const newPos = [...selectedObject.position] as [number, number, number];
                        newPos[i] = parseFloat(e.target.value) || 0;
                        updateObject(selectedObject.id, { position: newPos });
                      }}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded text-xs text-slate-200"
                    />
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="text-xs text-slate-400">Scale</label>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={selectedObject.scale[0]}
                  onChange={(e) => {
                    const s = parseFloat(e.target.value);
                    updateObject(selectedObject.id, { scale: [s, s, s] });
                  }}
                  className="w-full mt-1 accent-cyan-500"
                />
                <div className="text-xs text-slate-400 text-right">
                  {selectedObject.scale[0].toFixed(1)}x
                </div>
              </div>

              {/* Type-specific properties */}
              {selectedObject.type === "quilt" && (
                <div>
                  <label className="text-xs text-slate-400">Asset ID</label>
                  <input
                    type="text"
                    value={selectedObject.assetId ?? ""}
                    onChange={(e) => updateObject(selectedObject.id, { assetId: e.target.value })}
                    placeholder="Enter quilt asset ID"
                    className="w-full mt-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded text-sm text-slate-200"
                  />
                </div>
              )}

              {selectedObject.type === "model" && (
                <div>
                  <label className="text-xs text-slate-400">Model URL</label>
                  <input
                    type="text"
                    value={selectedObject.modelUrl ?? ""}
                    onChange={(e) => updateObject(selectedObject.id, { modelUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full mt-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded text-sm text-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolumetricDashboardBuilder;
