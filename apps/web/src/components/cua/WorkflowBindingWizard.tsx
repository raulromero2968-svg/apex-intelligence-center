"use client";

/**
 * Workflow Binding Wizard Component
 *
 * Step-by-step wizard for creating automation workflows.
 * Implements pack-cua-001 §2.2 (Workflow Binding Wizard).
 *
 * Features:
 * - Visual workflow builder
 * - Step-by-step configuration
 * - Conditional logic support
 * - Agent assignment
 * - Live validation
 */

import React, { useState, useCallback } from "react";

// Types
type WorkflowType = "sequential" | "parallel" | "conditional" | "loop" | "multi_agent";
type StepType =
  | "navigate"
  | "click"
  | "type"
  | "scroll"
  | "wait"
  | "extract"
  | "screenshot"
  | "condition"
  | "loop"
  | "agent_handoff";
type TriggerType = "manual" | "schedule" | "webhook" | "event";

interface StepConfig {
  type: StepType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  onFailure?: "stop" | "skip" | "retry";
}

interface WorkflowBinding {
  name: string;
  description?: string;
  workflowType: WorkflowType;
  triggerType: TriggerType;
  triggerConfig: {
    schedule?: string;
    webhookUrl?: string;
    eventName?: string;
  };
  steps: StepConfig[];
  variables: Record<string, unknown>;
  agentId?: string;
  isEnabled: boolean;
  tags?: string[];
}

interface WorkflowBindingWizardProps {
  initialWorkflow?: Partial<WorkflowBinding>;
  agents?: Array<{ id: string; name: string; type: string }>;
  onSave?: (workflow: WorkflowBinding) => void;
  onCancel?: () => void;
  className?: string;
}

// Step type definitions
const STEP_TYPES: Record<
  StepType,
  { icon: string; label: string; description: string; category: string; fields: string[] }
> = {
  navigate: {
    icon: "🔗",
    label: "Navigate",
    description: "Go to URL",
    category: "navigation",
    fields: ["url"],
  },
  click: {
    icon: "👆",
    label: "Click",
    description: "Click element",
    category: "interaction",
    fields: ["selector", "coordinates"],
  },
  type: {
    icon: "⌨️",
    label: "Type",
    description: "Enter text",
    category: "interaction",
    fields: ["selector", "text", "clearFirst"],
  },
  scroll: {
    icon: "📜",
    label: "Scroll",
    description: "Scroll page/element",
    category: "interaction",
    fields: ["direction", "amount", "selector"],
  },
  wait: {
    icon: "⏳",
    label: "Wait",
    description: "Wait for condition",
    category: "control",
    fields: ["waitType", "timeout", "selector"],
  },
  extract: {
    icon: "📤",
    label: "Extract",
    description: "Extract data",
    category: "data",
    fields: ["selector", "extractType", "variableName"],
  },
  screenshot: {
    icon: "📸",
    label: "Screenshot",
    description: "Capture screen",
    category: "observation",
    fields: ["fullPage", "selector"],
  },
  condition: {
    icon: "🔀",
    label: "Condition",
    description: "Branch logic",
    category: "control",
    fields: ["expression", "trueBranch", "falseBranch"],
  },
  loop: {
    icon: "🔁",
    label: "Loop",
    description: "Repeat steps",
    category: "control",
    fields: ["loopType", "maxIterations", "selector"],
  },
  agent_handoff: {
    icon: "🤝",
    label: "Agent Handoff",
    description: "Pass to another agent",
    category: "multi-agent",
    fields: ["targetAgentId", "dataToPass"],
  },
};

// Workflow type definitions
const WORKFLOW_TYPES: Record<
  WorkflowType,
  { icon: string; label: string; description: string }
> = {
  sequential: {
    icon: "➡️",
    label: "Sequential",
    description: "Steps execute one after another",
  },
  parallel: {
    icon: "⇉",
    label: "Parallel",
    description: "Steps execute simultaneously",
  },
  conditional: {
    icon: "🔀",
    label: "Conditional",
    description: "Branch based on conditions",
  },
  loop: {
    icon: "🔁",
    label: "Loop",
    description: "Repeat until condition met",
  },
  multi_agent: {
    icon: "👥",
    label: "Multi-Agent",
    description: "Coordinate multiple agents",
  },
};

// Trigger type definitions
const TRIGGER_TYPES: Record<TriggerType, { icon: string; label: string }> = {
  manual: { icon: "🖱️", label: "Manual" },
  schedule: { icon: "📅", label: "Schedule" },
  webhook: { icon: "🔗", label: "Webhook" },
  event: { icon: "📡", label: "Event" },
};

const DEFAULT_WORKFLOW: WorkflowBinding = {
  name: "",
  workflowType: "sequential",
  triggerType: "manual",
  triggerConfig: {},
  steps: [],
  variables: {},
  isEnabled: true,
};

const DEFAULT_STEP: StepConfig = {
  type: "navigate",
  name: "",
  config: {},
  timeout: 30000,
  retries: 3,
  onFailure: "stop",
};

// Wizard steps
type WizardStep = "basics" | "steps" | "triggers" | "review";

export function WorkflowBindingWizard({
  initialWorkflow,
  agents = [],
  onSave,
  onCancel,
  className = "",
}: WorkflowBindingWizardProps) {
  const [currentWizardStep, setCurrentWizardStep] = useState<WizardStep>("basics");
  const [workflow, setWorkflow] = useState<WorkflowBinding>({
    ...DEFAULT_WORKFLOW,
    ...initialWorkflow,
  });
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Update workflow field
  const updateField = useCallback(
    <K extends keyof WorkflowBinding>(field: K, value: WorkflowBinding[K]) => {
      setWorkflow((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Add step
  const addStep = useCallback((type: StepType) => {
    const newStep: StepConfig = {
      ...DEFAULT_STEP,
      type,
      name: `${STEP_TYPES[type].label} Step`,
    };
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setEditingStepIndex(workflow.steps.length);
  }, [workflow.steps.length]);

  // Update step
  const updateStep = useCallback((index: number, updates: Partial<StepConfig>) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  }, []);

  // Remove step
  const removeStep = useCallback((index: number) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
    setEditingStepIndex(null);
  }, []);

  // Move step
  const moveStep = useCallback((index: number, direction: "up" | "down") => {
    setWorkflow((prev) => {
      const newSteps = [...prev.steps];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newSteps.length) return prev;
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return { ...prev, steps: newSteps };
    });
    setEditingStepIndex((prev) =>
      prev === index ? (direction === "up" ? index - 1 : index + 1) : prev
    );
  }, []);

  // Validate workflow
  const validate = useCallback((): boolean => {
    const newErrors: string[] = [];

    if (!workflow.name.trim()) {
      newErrors.push("Workflow name is required");
    }

    if (workflow.steps.length === 0) {
      newErrors.push("At least one step is required");
    }

    workflow.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors.push(`Step ${index + 1} needs a name`);
      }
    });

    if (workflow.triggerType === "schedule" && !workflow.triggerConfig.schedule) {
      newErrors.push("Schedule trigger requires a cron expression");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [workflow]);

  // Handle save
  const handleSave = useCallback(() => {
    if (validate()) {
      onSave?.(workflow);
    }
  }, [validate, onSave, workflow]);

  // Navigate wizard
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentWizardStep(step);
  }, []);

  // Wizard step indicators
  const wizardSteps: { id: WizardStep; label: string; icon: string }[] = [
    { id: "basics", label: "Basics", icon: "1" },
    { id: "steps", label: "Steps", icon: "2" },
    { id: "triggers", label: "Triggers", icon: "3" },
    { id: "review", label: "Review", icon: "4" },
  ];

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-violet-900/50 rounded-xl border border-violet-500/20 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-violet-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">⚡</div>
          <div>
            <h3 className="text-sm font-semibold text-violet-300">Workflow Builder</h3>
            <div className="text-xs text-slate-400">
              {initialWorkflow?.name ? "Edit Workflow" : "Create New Workflow"}
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
      <div className="px-4 py-3 border-b border-violet-500/10 flex items-center gap-2">
        {wizardSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => goToStep(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentWizardStep === step.id
                  ? "bg-violet-500/30 text-violet-300 border border-violet-500/50"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center text-xs rounded-full bg-slate-700">
                {step.icon}
              </span>
              <span className="text-sm">{step.label}</span>
            </button>
            {index < wizardSteps.length - 1 && (
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Step 1: Basics */}
        {currentWizardStep === "basics" && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Workflow Name</label>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="My Automation Workflow"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                value={workflow.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="What does this workflow do?"
                rows={2}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Workflow Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Workflow Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(WORKFLOW_TYPES) as [WorkflowType, { icon: string; label: string; description: string }][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => updateField("workflowType", type)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        workflow.workflowType === type
                          ? "bg-violet-500/30 border border-violet-500/50"
                          : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="text-lg mb-1">{info.icon}</div>
                      <div className="text-xs font-medium text-slate-200">{info.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{info.description}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Agent Selection */}
            {agents.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Assign Agent</label>
                <select
                  value={workflow.agentId ?? ""}
                  onChange={(e) => updateField("agentId", e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="">No specific agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={workflow.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  updateField(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="scraping, data-entry, testing"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Steps */}
        {currentWizardStep === "steps" && (
          <div className="space-y-4">
            {/* Add step buttons */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Add Step</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(STEP_TYPES) as [StepType, { icon: string; label: string }][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => addStep(type)}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-1"
                    >
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Steps list */}
            {workflow.steps.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs text-slate-400">Steps ({workflow.steps.length})</label>
                {workflow.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      editingStepIndex === index
                        ? "bg-violet-500/20 border-violet-500/50"
                        : "bg-slate-800/50 border-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#{index + 1}</span>
                        <span>{STEP_TYPES[step.type].icon}</span>
                        <span className="text-sm text-slate-200">{step.name || STEP_TYPES[step.type].label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveStep(index, "down")}
                          disabled={index === workflow.steps.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setEditingStepIndex(editingStepIndex === index ? null : index)
                          }
                          className="p-1 text-slate-400 hover:text-violet-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeStep(index)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Step editor */}
                    {editingStepIndex === index && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Step Name</label>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => updateStep(index, { name: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                          />
                        </div>

                        {/* Type-specific fields */}
                        {step.type === "navigate" && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">URL</label>
                            <input
                              type="text"
                              value={(step.config.url as string) ?? ""}
                              onChange={(e) =>
                                updateStep(index, { config: { ...step.config, url: e.target.value } })
                              }
                              placeholder="https://example.com"
                              className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                            />
                          </div>
                        )}

                        {(step.type === "click" || step.type === "type") && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Selector</label>
                            <input
                              type="text"
                              value={(step.config.selector as string) ?? ""}
                              onChange={(e) =>
                                updateStep(index, { config: { ...step.config, selector: e.target.value } })
                              }
                              placeholder="#button, .class, [data-id='value']"
                              className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                            />
                          </div>
                        )}

                        {step.type === "type" && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Text to Type</label>
                            <input
                              type="text"
                              value={(step.config.text as string) ?? ""}
                              onChange={(e) =>
                                updateStep(index, { config: { ...step.config, text: e.target.value } })
                              }
                              placeholder="Enter text or {{variable}}"
                              className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                            />
                          </div>
                        )}

                        {step.type === "wait" && (
                          <>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Wait Type</label>
                              <select
                                value={(step.config.waitType as string) ?? "time"}
                                onChange={(e) =>
                                  updateStep(index, { config: { ...step.config, waitType: e.target.value } })
                                }
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                              >
                                <option value="time">Fixed Time</option>
                                <option value="element">Element Visible</option>
                                <option value="navigation">Navigation Complete</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Timeout (ms)</label>
                              <input
                                type="number"
                                value={(step.config.timeout as number) ?? 5000}
                                onChange={(e) =>
                                  updateStep(index, {
                                    config: { ...step.config, timeout: parseInt(e.target.value) },
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                              />
                            </div>
                          </>
                        )}

                        {step.type === "extract" && (
                          <>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Selector</label>
                              <input
                                type="text"
                                value={(step.config.selector as string) ?? ""}
                                onChange={(e) =>
                                  updateStep(index, { config: { ...step.config, selector: e.target.value } })
                                }
                                placeholder=".price, table tr"
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Variable Name</label>
                              <input
                                type="text"
                                value={(step.config.variableName as string) ?? ""}
                                onChange={(e) =>
                                  updateStep(index, {
                                    config: { ...step.config, variableName: e.target.value },
                                  })
                                }
                                placeholder="extractedData"
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                              />
                            </div>
                          </>
                        )}

                        {/* Error handling */}
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">On Failure</label>
                          <select
                            value={step.onFailure ?? "stop"}
                            onChange={(e) =>
                              updateStep(index, { onFailure: e.target.value as "stop" | "skip" | "retry" })
                            }
                            className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200"
                          >
                            <option value="stop">Stop Workflow</option>
                            <option value="skip">Skip Step</option>
                            <option value="retry">Retry Step</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {workflow.steps.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm">No steps added yet</div>
                <div className="text-xs mt-1">Click a step type above to add it</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Triggers */}
        {currentWizardStep === "triggers" && (
          <div className="space-y-4">
            {/* Trigger Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Trigger Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TRIGGER_TYPES) as [TriggerType, { icon: string; label: string }][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => updateField("triggerType", type)}
                      className={`p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                        workflow.triggerType === type
                          ? "bg-violet-500/30 border border-violet-500/50"
                          : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <span className="text-xl">{info.icon}</span>
                      <span className="text-sm text-slate-200">{info.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Trigger-specific config */}
            {workflow.triggerType === "schedule" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={workflow.triggerConfig.schedule ?? ""}
                  onChange={(e) =>
                    updateField("triggerConfig", { ...workflow.triggerConfig, schedule: e.target.value })
                  }
                  placeholder="0 9 * * * (every day at 9am)"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <div className="text-xs text-slate-500 mt-1">Format: minute hour day month weekday</div>
              </div>
            )}

            {workflow.triggerType === "webhook" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Webhook URL (auto-generated)</label>
                <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-400 font-sans">
                  /api/cua/webhooks/{workflow.name ? workflow.name.toLowerCase().replace(/\s+/g, "-") : "workflow"}
                </div>
              </div>
            )}

            {workflow.triggerType === "event" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Name</label>
                <input
                  type="text"
                  value={workflow.triggerConfig.eventName ?? ""}
                  onChange={(e) =>
                    updateField("triggerConfig", { ...workflow.triggerConfig, eventName: e.target.value })
                  }
                  placeholder="user.signup, order.created"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* Variables */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Variables (JSON)</label>
              <textarea
                value={JSON.stringify(workflow.variables, null, 2)}
                onChange={(e) => {
                  try {
                    updateField("variables", JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"baseUrl": "https://example.com"}'
                rows={3}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none font-sans"
              />
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Enable Workflow</label>
              <button
                onClick={() => updateField("isEnabled", !workflow.isEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  workflow.isEnabled ? "bg-green-500/50" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                    workflow.isEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentWizardStep === "review" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Name</span>
                <span className="text-slate-200">{workflow.name || "Unnamed"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Type</span>
                <span className="text-slate-200">
                  {WORKFLOW_TYPES[workflow.workflowType].icon} {WORKFLOW_TYPES[workflow.workflowType].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trigger</span>
                <span className="text-slate-200">
                  {TRIGGER_TYPES[workflow.triggerType].icon} {TRIGGER_TYPES[workflow.triggerType].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Steps</span>
                <span className="text-slate-200">{workflow.steps.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={workflow.isEnabled ? "text-green-400" : "text-slate-500"}>
                  {workflow.isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Steps preview */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Steps Flow</label>
              <div className="flex flex-wrap items-center gap-2">
                {workflow.steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="px-2 py-1 bg-slate-800/70 rounded text-xs flex items-center gap-1">
                      <span>{STEP_TYPES[step.type].icon}</span>
                      <span className="text-slate-300">{step.name || STEP_TYPES[step.type].label}</span>
                    </div>
                    {index < workflow.steps.length - 1 && (
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Errors */}
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
      <div className="p-4 border-t border-violet-500/20 flex items-center justify-between">
        <button
          onClick={() => {
            const steps: WizardStep[] = ["basics", "steps", "triggers", "review"];
            const currentIndex = steps.indexOf(currentWizardStep);
            if (currentIndex > 0) {
              setCurrentWizardStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentWizardStep === "basics"}
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

          {currentWizardStep === "review" ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-violet-500/30 text-violet-300 border border-violet-500/50 rounded hover:bg-violet-500/40 transition-colors"
            >
              Save Workflow
            </button>
          ) : (
            <button
              onClick={() => {
                const steps: WizardStep[] = ["basics", "steps", "triggers", "review"];
                const currentIndex = steps.indexOf(currentWizardStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentWizardStep(steps[currentIndex + 1]);
                }
              }}
              className="px-4 py-2 text-sm bg-violet-500/30 text-violet-300 border border-violet-500/50 rounded hover:bg-violet-500/40 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowBindingWizard;
