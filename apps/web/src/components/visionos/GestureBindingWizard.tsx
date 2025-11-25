"use client";

/**
 * Gesture Binding Wizard Component
 *
 * Step-by-step wizard for creating gesture-to-action bindings.
 * Implements pack-visionos-001 §2.2 (Gesture Binding for Vision).
 *
 * Features:
 * - Visual gesture selection
 * - Target specification
 * - Action configuration
 * - Feedback customization
 * - Live preview
 */

import React, { useState, useCallback } from "react";

// Types
type GestureType =
  | "gaze"
  | "pinch"
  | "double_pinch"
  | "drag"
  | "rotate"
  | "scale"
  | "tap"
  | "long_press"
  | "swipe"
  | "gaze_pinch"
  | "gaze_drag"
  | "two_hand_scale"
  | "two_hand_rotate";

type ActionType =
  | "select"
  | "activate"
  | "toggle"
  | "open_detail"
  | "add_to_cart"
  | "buy"
  | "sell"
  | "favorite"
  | "compare"
  | "move"
  | "rotate"
  | "scale"
  | "dismiss"
  | "navigate"
  | "play_animation"
  | "trigger_event"
  | "custom";

type TargetType = "entity" | "entity_type" | "tag" | "scene" | "any";
type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "error";
type VisualEffect = "highlight" | "pulse" | "scale" | "glow";

interface GestureBinding {
  name: string;
  description?: string;
  gestureType: GestureType;
  gestureParams: {
    minDuration?: number;
    maxDuration?: number;
    dwellTime?: number;
    minDistance?: number;
    direction?: "any" | "horizontal" | "vertical";
    hand?: "left" | "right" | "any" | "both";
    pinchThreshold?: number;
  };
  targetSpec: {
    targetType: TargetType;
    entityId?: string;
    entityTypes?: string[];
    tags?: string[];
  };
  actionType: ActionType;
  actionParams: {
    targetScene?: string;
    targetUrl?: string;
    animationName?: string;
    eventName?: string;
    customHandler?: string;
  };
  feedbackConfig: {
    haptic?: HapticType;
    sound?: string;
    visualEffect?: VisualEffect;
    visualDuration?: number;
  };
  priority: number;
  isEnabled: boolean;
}

interface GestureBindingWizardProps {
  initialBinding?: Partial<GestureBinding>;
  onSave?: (binding: GestureBinding) => void;
  onCancel?: () => void;
  className?: string;
}

// Gesture definitions
const GESTURE_TYPES: Record<
  GestureType,
  { icon: string; label: string; description: string; category: string }
> = {
  gaze: { icon: "👁️", label: "Gaze", description: "Look at target (dwell)", category: "gaze" },
  pinch: { icon: "🤏", label: "Pinch", description: "Thumb + index pinch", category: "hand" },
  double_pinch: { icon: "🤏🤏", label: "Double Pinch", description: "Quick double pinch", category: "hand" },
  tap: { icon: "👆", label: "Tap", description: "Quick pinch release", category: "hand" },
  long_press: { icon: "✊", label: "Long Press", description: "Hold pinch", category: "hand" },
  drag: { icon: "✋", label: "Drag", description: "Pinch and move", category: "hand" },
  swipe: { icon: "👋", label: "Swipe", description: "Quick drag motion", category: "hand" },
  rotate: { icon: "🔄", label: "Rotate", description: "Circular hand motion", category: "hand" },
  scale: { icon: "↔️", label: "Scale", description: "Pinch zoom", category: "hand" },
  gaze_pinch: { icon: "👁️🤏", label: "Look + Pinch", description: "Look at target, then pinch", category: "compound" },
  gaze_drag: { icon: "👁️✋", label: "Look + Drag", description: "Look at target, then drag", category: "compound" },
  two_hand_scale: { icon: "🙌↔️", label: "Two-Hand Scale", description: "Both hands scale", category: "two-hand" },
  two_hand_rotate: { icon: "🙌🔄", label: "Two-Hand Rotate", description: "Both hands rotate", category: "two-hand" },
};

// Action definitions
const ACTION_TYPES: Record<ActionType, { icon: string; label: string; category: string }> = {
  select: { icon: "✓", label: "Select", category: "basic" },
  activate: { icon: "⚡", label: "Activate", category: "basic" },
  toggle: { icon: "🔀", label: "Toggle", category: "basic" },
  open_detail: { icon: "📋", label: "Open Details", category: "navigation" },
  navigate: { icon: "🧭", label: "Navigate", category: "navigation" },
  add_to_cart: { icon: "🛒", label: "Add to Cart", category: "commerce" },
  buy: { icon: "💰", label: "Buy", category: "commerce" },
  sell: { icon: "💸", label: "Sell", category: "commerce" },
  favorite: { icon: "❤️", label: "Favorite", category: "engagement" },
  compare: { icon: "⚖️", label: "Compare", category: "engagement" },
  move: { icon: "↗️", label: "Move", category: "transform" },
  rotate: { icon: "🔄", label: "Rotate", category: "transform" },
  scale: { icon: "📐", label: "Scale", category: "transform" },
  dismiss: { icon: "✕", label: "Dismiss", category: "basic" },
  play_animation: { icon: "▶️", label: "Play Animation", category: "media" },
  trigger_event: { icon: "📡", label: "Trigger Event", category: "advanced" },
  custom: { icon: "⚙️", label: "Custom", category: "advanced" },
};

const DEFAULT_BINDING: GestureBinding = {
  name: "",
  gestureType: "gaze_pinch",
  gestureParams: {},
  targetSpec: { targetType: "any" },
  actionType: "select",
  actionParams: {},
  feedbackConfig: { haptic: "selection", visualEffect: "highlight" },
  priority: 0,
  isEnabled: true,
};

export function GestureBindingWizard({
  initialBinding,
  onSave,
  onCancel,
  className = "",
}: GestureBindingWizardProps) {
  const [step, setStep] = useState(1);
  const [binding, setBinding] = useState<GestureBinding>({
    ...DEFAULT_BINDING,
    ...initialBinding,
  });

  const totalSteps = 4;

  // Update binding field
  const updateBinding = useCallback(
    <K extends keyof GestureBinding>(field: K, value: GestureBinding[K]) => {
      setBinding((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Navigation
  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  // Save handler
  const handleSave = useCallback(() => {
    if (binding.name && binding.gestureType && binding.actionType) {
      onSave?.(binding);
    }
  }, [binding, onSave]);

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Binding Name</label>
              <input
                type="text"
                value={binding.name}
                onChange={(e) => updateBinding("name", e.target.value)}
                placeholder="e.g., Select Card"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">Select Gesture</label>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2">
                {Object.entries(GESTURE_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => updateBinding("gestureType", type as GestureType)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      binding.gestureType === type
                        ? "bg-cyan-500/30 border border-cyan-500/50"
                        : "bg-slate-800/50 border border-slate-600/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="text-xl mb-1">{info.icon}</div>
                    <div className="text-xs font-medium text-slate-200">{info.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{info.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gesture-specific parameters */}
            {(binding.gestureType === "long_press" || binding.gestureType === "gaze") && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">
                  {binding.gestureType === "gaze" ? "Dwell Time (ms)" : "Hold Duration (ms)"}
                </label>
                <input
                  type="number"
                  value={
                    binding.gestureType === "gaze"
                      ? binding.gestureParams.dwellTime ?? 800
                      : binding.gestureParams.minDuration ?? 500
                  }
                  onChange={(e) =>
                    updateBinding("gestureParams", {
                      ...binding.gestureParams,
                      [binding.gestureType === "gaze" ? "dwellTime" : "minDuration"]: parseInt(
                        e.target.value,
                        10
                      ),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}

            {(binding.gestureType === "drag" || binding.gestureType === "swipe") && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Direction</label>
                <div className="flex gap-2">
                  {(["any", "horizontal", "vertical"] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() =>
                        updateBinding("gestureParams", {
                          ...binding.gestureParams,
                          direction: dir,
                        })
                      }
                      className={`flex-1 px-3 py-2 text-xs rounded-lg capitalize ${
                        binding.gestureParams.direction === dir
                          ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                          : "bg-slate-800/50 text-slate-400 border border-slate-600/50"
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Target Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { type: "any", label: "Any Entity", icon: "🌐" },
                    { type: "scene", label: "Scene (Empty Space)", icon: "🖼️" },
                    { type: "entity_type", label: "Entity Type", icon: "📦" },
                    { type: "tag", label: "Tagged Entities", icon: "🏷️" },
                    { type: "entity", label: "Specific Entity", icon: "🎯" },
                  ] as const
                ).map((target) => (
                  <button
                    key={target.type}
                    onClick={() =>
                      updateBinding("targetSpec", {
                        ...binding.targetSpec,
                        targetType: target.type,
                      })
                    }
                    className={`p-3 rounded-lg text-left ${
                      binding.targetSpec.targetType === target.type
                        ? "bg-purple-500/30 border border-purple-500/50"
                        : "bg-slate-800/50 border border-slate-600/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="text-lg">{target.icon}</div>
                    <div className="text-xs text-slate-200 mt-1">{target.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {binding.targetSpec.targetType === "entity_type" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Entity Types</label>
                <div className="flex flex-wrap gap-2">
                  {["card", "chart", "window", "model", "text"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const current = binding.targetSpec.entityTypes ?? [];
                        const updated = current.includes(type)
                          ? current.filter((t) => t !== type)
                          : [...current, type];
                        updateBinding("targetSpec", {
                          ...binding.targetSpec,
                          entityTypes: updated,
                        });
                      }}
                      className={`px-3 py-1 text-xs rounded-full capitalize ${
                        binding.targetSpec.entityTypes?.includes(type)
                          ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                          : "bg-slate-800/50 text-slate-400 border border-slate-600/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {binding.targetSpec.targetType === "tag" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={binding.targetSpec.tags?.join(", ") ?? ""}
                  onChange={(e) =>
                    updateBinding("targetSpec", {
                      ...binding.targetSpec,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g., interactable, draggable"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}

            {binding.targetSpec.targetType === "entity" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Entity ID</label>
                <input
                  type="text"
                  value={binding.targetSpec.entityId ?? ""}
                  onChange={(e) =>
                    updateBinding("targetSpec", {
                      ...binding.targetSpec,
                      entityId: e.target.value,
                    })
                  }
                  placeholder="Entity UUID"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Action</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                {Object.entries(ACTION_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => updateBinding("actionType", type as ActionType)}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      binding.actionType === type
                        ? "bg-emerald-500/30 border border-emerald-500/50"
                        : "bg-slate-800/50 border border-slate-600/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="text-lg">{info.icon}</div>
                    <div className="text-[10px] text-slate-200 mt-0.5">{info.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action-specific parameters */}
            {binding.actionType === "navigate" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Target Scene</label>
                <input
                  type="text"
                  value={binding.actionParams.targetScene ?? ""}
                  onChange={(e) =>
                    updateBinding("actionParams", {
                      ...binding.actionParams,
                      targetScene: e.target.value,
                    })
                  }
                  placeholder="Scene ID"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}

            {binding.actionType === "play_animation" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Animation Name</label>
                <input
                  type="text"
                  value={binding.actionParams.animationName ?? ""}
                  onChange={(e) =>
                    updateBinding("actionParams", {
                      ...binding.actionParams,
                      animationName: e.target.value,
                    })
                  }
                  placeholder="e.g., flip, spin, bounce"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}

            {binding.actionType === "trigger_event" && (
              <div>
                <label className="text-xs text-slate-400 block mb-2">Event Name</label>
                <input
                  type="text"
                  value={binding.actionParams.eventName ?? ""}
                  onChange={(e) =>
                    updateBinding("actionParams", {
                      ...binding.actionParams,
                      eventName: e.target.value,
                    })
                  }
                  placeholder="e.g., card_selected"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Haptic Feedback</label>
              <div className="flex flex-wrap gap-2">
                {(["light", "medium", "heavy", "selection", "success", "error"] as HapticType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() =>
                        updateBinding("feedbackConfig", {
                          ...binding.feedbackConfig,
                          haptic: type,
                        })
                      }
                      className={`px-3 py-1 text-xs rounded-full capitalize ${
                        binding.feedbackConfig.haptic === type
                          ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                          : "bg-slate-800/50 text-slate-400 border border-slate-600/50"
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">Visual Effect</label>
              <div className="flex flex-wrap gap-2">
                {(["highlight", "pulse", "scale", "glow"] as VisualEffect[]).map((effect) => (
                  <button
                    key={effect}
                    onClick={() =>
                      updateBinding("feedbackConfig", {
                        ...binding.feedbackConfig,
                        visualEffect: effect,
                      })
                    }
                    className={`px-3 py-1 text-xs rounded-full capitalize ${
                      binding.feedbackConfig.visualEffect === effect
                        ? "bg-pink-500/30 text-pink-300 border border-pink-500/50"
                        : "bg-slate-800/50 text-slate-400 border border-slate-600/50"
                    }`}
                  >
                    {effect}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">Priority</label>
              <input
                type="number"
                value={binding.priority}
                onChange={(e) => updateBinding("priority", parseInt(e.target.value, 10))}
                className="w-24 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200"
              />
              <span className="text-xs text-slate-500 ml-2">Higher = checked first</span>
            </div>

            {/* Summary */}
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Summary</div>
              <div className="text-sm text-slate-200">
                <span className="text-cyan-300">{GESTURE_TYPES[binding.gestureType].icon}</span>{" "}
                <strong>{binding.name || "Unnamed"}</strong>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {GESTURE_TYPES[binding.gestureType].label} on{" "}
                {binding.targetSpec.targetType === "any"
                  ? "any entity"
                  : binding.targetSpec.targetType}{" "}
                → {ACTION_TYPES[binding.actionType].label}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-purple-900/50 rounded-xl border border-cyan-500/20 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-cyan-300">Gesture Binding Wizard</h3>
            <div className="text-xs text-slate-400">
              Step {step} of {totalSteps}:{" "}
              {step === 1
                ? "Select Gesture"
                : step === 2
                ? "Define Target"
                : step === 3
                ? "Choose Action"
                : "Configure Feedback"}
            </div>
          </div>
          <div className="text-2xl">
            {step === 1 ? "👆" : step === 2 ? "🎯" : step === 3 ? "⚡" : "📳"}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 min-h-[300px]">{renderStep()}</div>

      {/* Footer */}
      <div className="p-4 border-t border-cyan-500/20 flex justify-between">
        <button
          onClick={step === 1 ? onCancel : prevStep}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm hover:bg-slate-600/50 transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        <button
          onClick={step === totalSteps ? handleSave : nextStep}
          disabled={step === 1 && !binding.name}
          className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === totalSteps ? "Save Binding" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default GestureBindingWizard;
