"use client";

/**
 * Scene Binding Wizard Component
 *
 * Step-by-step wizard for binding 3D objects to interactions.
 * Implements pack-webxr-001 §2.2 (Scene Binding Wizard).
 *
 * Features:
 * - Object selection
 * - Input type configuration
 * - Action binding
 * - Feedback customization
 */

import React, { useState, useCallback } from "react";

// Types
type InputType =
  | "controller_trigger"
  | "controller_grip"
  | "hand_pinch"
  | "hand_grab"
  | "gaze_dwell"
  | "gaze_select"
  | "touch";

type ActionType =
  | "select"
  | "activate"
  | "grab"
  | "move"
  | "rotate"
  | "scale"
  | "teleport"
  | "play_animation"
  | "play_sound"
  | "show_ui"
  | "trigger_event";

type FeedbackType = "haptic" | "visual" | "audio";

interface SceneObject {
  id: string;
  name: string;
  type: string;
  isInteractable?: boolean;
}

interface InteractionBinding {
  name: string;
  description?: string;
  objectId?: string;
  inputType: InputType;
  inputConfig: {
    hand?: "left" | "right" | "any";
    threshold?: number;
    dwellTime?: number;
  };
  actionType: ActionType;
  actionConfig: {
    animationName?: string;
    soundUrl?: string;
    eventName?: string;
    targetPosition?: [number, number, number];
  };
  feedbackConfig: {
    haptic?: { intensity: number; duration: number };
    visual?: { type: string; color: string };
    audio?: { url: string };
  };
  isEnabled: boolean;
}

interface SceneBindingWizardProps {
  objects?: SceneObject[];
  initialBinding?: Partial<InteractionBinding>;
  onSave?: (binding: InteractionBinding) => void;
  onCancel?: () => void;
  className?: string;
}

// Input type definitions
const INPUT_TYPES: Record<InputType, { icon: string; label: string; description: string; category: string }> = {
  controller_trigger: {
    icon: "🎮",
    label: "Controller Trigger",
    description: "Index finger trigger press",
    category: "controller",
  },
  controller_grip: {
    icon: "✊",
    label: "Controller Grip",
    description: "Side grip button",
    category: "controller",
  },
  hand_pinch: {
    icon: "🤏",
    label: "Hand Pinch",
    description: "Thumb + index pinch",
    category: "hand",
  },
  hand_grab: {
    icon: "✋",
    label: "Hand Grab",
    description: "Full hand grab gesture",
    category: "hand",
  },
  gaze_dwell: {
    icon: "👁️",
    label: "Gaze Dwell",
    description: "Look at target for duration",
    category: "gaze",
  },
  gaze_select: {
    icon: "👁️✓",
    label: "Gaze + Select",
    description: "Look then confirm",
    category: "gaze",
  },
  touch: {
    icon: "👆",
    label: "Touch",
    description: "Touch screen tap",
    category: "touch",
  },
};

// Action type definitions
const ACTION_TYPES: Record<ActionType, { icon: string; label: string; category: string }> = {
  select: { icon: "✓", label: "Select", category: "basic" },
  activate: { icon: "⚡", label: "Activate", category: "basic" },
  grab: { icon: "✋", label: "Grab", category: "manipulation" },
  move: { icon: "↗️", label: "Move", category: "manipulation" },
  rotate: { icon: "🔄", label: "Rotate", category: "manipulation" },
  scale: { icon: "📐", label: "Scale", category: "manipulation" },
  teleport: { icon: "🌀", label: "Teleport", category: "navigation" },
  play_animation: { icon: "▶️", label: "Play Animation", category: "media" },
  play_sound: { icon: "🔊", label: "Play Sound", category: "media" },
  show_ui: { icon: "🖼️", label: "Show UI", category: "ui" },
  trigger_event: { icon: "📡", label: "Trigger Event", category: "advanced" },
};

const DEFAULT_BINDING: InteractionBinding = {
  name: "",
  inputType: "controller_trigger",
  inputConfig: { hand: "any" },
  actionType: "select",
  actionConfig: {},
  feedbackConfig: {
    haptic: { intensity: 0.5, duration: 100 },
    visual: { type: "highlight", color: "#22d3ee" },
  },
  isEnabled: true,
};

type WizardStep = "object" | "input" | "action" | "feedback" | "review";

export function SceneBindingWizard({
  objects = [],
  initialBinding,
  onSave,
  onCancel,
  className = "",
}: SceneBindingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("object");
  const [binding, setBinding] = useState<InteractionBinding>({
    ...DEFAULT_BINDING,
    ...initialBinding,
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Update binding field
  const updateField = useCallback(
    <K extends keyof InteractionBinding>(field: K, value: InteractionBinding[K]) => {
      setBinding((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Validate binding
  const validate = useCallback((): boolean => {
    const newErrors: string[] = [];

    if (!binding.name.trim()) {
      newErrors.push("Binding name is required");
    }

    if (binding.actionType === "play_animation" && !binding.actionConfig.animationName) {
      newErrors.push("Animation name is required for Play Animation action");
    }

    if (binding.actionType === "play_sound" && !binding.actionConfig.soundUrl) {
      newErrors.push("Sound URL is required for Play Sound action");
    }

    if (binding.actionType === "trigger_event" && !binding.actionConfig.eventName) {
      newErrors.push("Event name is required for Trigger Event action");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [binding]);

  // Handle save
  const handleSave = useCallback(() => {
    if (validate()) {
      onSave?.(binding);
    }
  }, [validate, onSave, binding]);

  // Wizard step config
  const wizardSteps: { id: WizardStep; label: string; icon: string }[] = [
    { id: "object", label: "Object", icon: "1" },
    { id: "input", label: "Input", icon: "2" },
    { id: "action", label: "Action", icon: "3" },
    { id: "feedback", label: "Feedback", icon: "4" },
    { id: "review", label: "Review", icon: "5" },
  ];

  const selectedObject = objects.find((o) => o.id === binding.objectId);

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-teal-900/50 rounded-xl border border-teal-500/20 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-teal-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">🔗</div>
          <div>
            <h3 className="text-sm font-semibold text-teal-300">Interaction Binding</h3>
            <div className="text-xs text-slate-400">
              {initialBinding?.name ? "Edit Binding" : "Create New Binding"}
            </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Wizard progress */}
      <div className="px-4 py-3 border-b border-teal-500/10 flex items-center gap-2 overflow-x-auto">
        {wizardSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentStep === step.id
                  ? "bg-teal-500/30 text-teal-300 border border-teal-500/50"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center text-xs rounded-full bg-slate-700">
                {step.icon}
              </span>
              <span className="text-sm">{step.label}</span>
            </button>
            {index < wizardSteps.length - 1 && (
              <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {/* Step 1: Object Selection */}
        {currentStep === "object" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Binding Name</label>
              <input
                type="text"
                value={binding.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Card Select, Button Click"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Description (optional)</label>
              <input
                type="text"
                value={binding.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="What does this interaction do?"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Target Object (optional)</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                <button
                  onClick={() => updateField("objectId", undefined)}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    !binding.objectId
                      ? "bg-teal-500/30 border border-teal-500/50"
                      : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="text-sm text-slate-300">Any Object</div>
                  <div className="text-xs text-slate-500">Global interaction</div>
                </button>
                {objects.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => updateField("objectId", obj.id)}
                    className={`p-2 rounded-lg text-left transition-colors ${
                      binding.objectId === obj.id
                        ? "bg-teal-500/30 border border-teal-500/50"
                        : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {obj.type === "mesh" ? "📦" : obj.type === "model" ? "🎭" : "⬜"}
                      </span>
                      <span className="text-sm text-slate-300 truncate">{obj.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{obj.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Input Configuration */}
        {currentStep === "input" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Input Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(INPUT_TYPES) as [InputType, typeof INPUT_TYPES[InputType]][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => updateField("inputType", type)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        binding.inputType === type
                          ? "bg-teal-500/30 border border-teal-500/50"
                          : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{info.icon}</span>
                        <span className="text-sm text-slate-200">{info.label}</span>
                      </div>
                      <div className="text-xs text-slate-400">{info.description}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Input-specific config */}
            {(binding.inputType === "controller_trigger" ||
              binding.inputType === "controller_grip" ||
              binding.inputType === "hand_pinch" ||
              binding.inputType === "hand_grab") && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Hand</label>
                <div className="flex gap-2">
                  {(["left", "right", "any"] as const).map((hand) => (
                    <button
                      key={hand}
                      onClick={() =>
                        updateField("inputConfig", { ...binding.inputConfig, hand })
                      }
                      className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                        binding.inputConfig.hand === hand
                          ? "bg-teal-500/30 text-teal-300"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      }`}
                    >
                      {hand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {binding.inputType === "gaze_dwell" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Dwell Time: {binding.inputConfig.dwellTime ?? 1000}ms
                </label>
                <input
                  type="range"
                  min={500}
                  max={3000}
                  step={100}
                  value={binding.inputConfig.dwellTime ?? 1000}
                  onChange={(e) =>
                    updateField("inputConfig", {
                      ...binding.inputConfig,
                      dwellTime: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Action Configuration */}
        {currentStep === "action" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Action Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ACTION_TYPES) as [ActionType, typeof ACTION_TYPES[ActionType]][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => updateField("actionType", type)}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        binding.actionType === type
                          ? "bg-teal-500/30 border border-teal-500/50"
                          : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="text-lg mb-1">{info.icon}</div>
                      <div className="text-xs text-slate-300">{info.label}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Action-specific config */}
            {binding.actionType === "play_animation" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Animation Name</label>
                <input
                  type="text"
                  value={binding.actionConfig.animationName ?? ""}
                  onChange={(e) =>
                    updateField("actionConfig", {
                      ...binding.actionConfig,
                      animationName: e.target.value,
                    })
                  }
                  placeholder="e.g., spin, bounce, flip"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200"
                />
              </div>
            )}

            {binding.actionType === "play_sound" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sound URL</label>
                <input
                  type="text"
                  value={binding.actionConfig.soundUrl ?? ""}
                  onChange={(e) =>
                    updateField("actionConfig", {
                      ...binding.actionConfig,
                      soundUrl: e.target.value,
                    })
                  }
                  placeholder="/sounds/click.mp3"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200"
                />
              </div>
            )}

            {binding.actionType === "trigger_event" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Name</label>
                <input
                  type="text"
                  value={binding.actionConfig.eventName ?? ""}
                  onChange={(e) =>
                    updateField("actionConfig", {
                      ...binding.actionConfig,
                      eventName: e.target.value,
                    })
                  }
                  placeholder="e.g., card.selected, item.purchased"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Feedback Configuration */}
        {currentStep === "feedback" && (
          <div className="space-y-4">
            {/* Haptic */}
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Haptic Feedback</label>
                <button
                  onClick={() =>
                    updateField("feedbackConfig", {
                      ...binding.feedbackConfig,
                      haptic: binding.feedbackConfig.haptic ? undefined : { intensity: 0.5, duration: 100 },
                    })
                  }
                  className={`w-10 h-5 rounded-full transition-colors ${
                    binding.feedbackConfig.haptic ? "bg-teal-500/50" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                      binding.feedbackConfig.haptic ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {binding.feedbackConfig.haptic && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400">
                      Intensity: {(binding.feedbackConfig.haptic.intensity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={binding.feedbackConfig.haptic.intensity * 100}
                      onChange={(e) =>
                        updateField("feedbackConfig", {
                          ...binding.feedbackConfig,
                          haptic: {
                            ...binding.feedbackConfig.haptic!,
                            intensity: parseInt(e.target.value) / 100,
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">
                      Duration: {binding.feedbackConfig.haptic.duration}ms
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={50}
                      value={binding.feedbackConfig.haptic.duration}
                      onChange={(e) =>
                        updateField("feedbackConfig", {
                          ...binding.feedbackConfig,
                          haptic: {
                            ...binding.feedbackConfig.haptic!,
                            duration: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visual */}
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Visual Feedback</label>
                <button
                  onClick={() =>
                    updateField("feedbackConfig", {
                      ...binding.feedbackConfig,
                      visual: binding.feedbackConfig.visual
                        ? undefined
                        : { type: "highlight", color: "#22d3ee" },
                    })
                  }
                  className={`w-10 h-5 rounded-full transition-colors ${
                    binding.feedbackConfig.visual ? "bg-teal-500/50" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                      binding.feedbackConfig.visual ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {binding.feedbackConfig.visual && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400">Effect Type</label>
                    <div className="flex gap-2 mt-1">
                      {["highlight", "pulse", "scale", "outline"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            updateField("feedbackConfig", {
                              ...binding.feedbackConfig,
                              visual: { ...binding.feedbackConfig.visual!, type },
                            })
                          }
                          className={`px-2 py-1 text-xs rounded capitalize ${
                            binding.feedbackConfig.visual?.type === type
                              ? "bg-teal-500/30 text-teal-300"
                              : "bg-slate-700/50 text-slate-400"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Color</label>
                    <input
                      type="color"
                      value={binding.feedbackConfig.visual.color}
                      onChange={(e) =>
                        updateField("feedbackConfig", {
                          ...binding.feedbackConfig,
                          visual: { ...binding.feedbackConfig.visual!, color: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === "review" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Name</span>
                <span className="text-slate-200">{binding.name || "Unnamed"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Target</span>
                <span className="text-slate-200">{selectedObject?.name ?? "Any Object"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Input</span>
                <span className="text-slate-200">
                  {INPUT_TYPES[binding.inputType].icon} {INPUT_TYPES[binding.inputType].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Action</span>
                <span className="text-slate-200">
                  {ACTION_TYPES[binding.actionType].icon} {ACTION_TYPES[binding.actionType].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Haptic</span>
                <span className={binding.feedbackConfig.haptic ? "text-green-400" : "text-slate-500"}>
                  {binding.feedbackConfig.haptic ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Visual</span>
                <span className={binding.feedbackConfig.visual ? "text-green-400" : "text-slate-500"}>
                  {binding.feedbackConfig.visual ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <div className="text-xs text-red-400 font-medium mb-1">Validation Errors</div>
                <ul className="text-xs text-red-300 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-teal-500/20 flex items-center justify-between">
        <button
          onClick={() => {
            const steps: WizardStep[] = ["object", "input", "action", "feedback", "review"];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentStep === "object"}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-600/50 transition-colors"
          >
            Cancel
          </button>

          {currentStep === "review" ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-teal-500/30 text-teal-300 border border-teal-500/50 rounded hover:bg-teal-500/40 transition-colors"
            >
              Save Binding
            </button>
          ) : (
            <button
              onClick={() => {
                const steps: WizardStep[] = ["object", "input", "action", "feedback", "review"];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1]);
                }
              }}
              className="px-4 py-2 text-sm bg-teal-500/30 text-teal-300 border border-teal-500/50 rounded hover:bg-teal-500/40 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SceneBindingWizard;
