"use client";

/**
 * Agent Preview Panel Component
 *
 * Simulates CUA agent execution in browser with live action visualization.
 * Implements pack-cua-001 §2.1 (Agent Preview Panel).
 *
 * Features:
 * - Simulated browser viewport for agent actions
 * - Action replay and step-through
 * - AI reasoning display
 * - Execution metrics
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { HoloNumber } from "@/components/ui/HoloNumber";

// Types
type ActionType = "navigate" | "click" | "type" | "scroll" | "extract" | "wait" | "screenshot";
type ExecutionState = "idle" | "running" | "paused" | "completed" | "failed";

interface AgentAction {
  id: string;
  type: ActionType;
  target?: string;
  value?: string;
  coordinates?: [number, number];
  timestamp: number;
  duration: number;
  status: "pending" | "running" | "success" | "failed";
  reasoning?: string;
  screenshot?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  type: "web_automation" | "data_extraction" | "testing" | "monitoring";
  model: string;
  capabilities: string[];
}

interface AgentPreviewPanelProps {
  agent?: AgentConfig;
  actions?: AgentAction[];
  executionState?: ExecutionState;
  currentUrl?: string;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onStepForward?: () => void;
  onStepBack?: () => void;
  className?: string;
  showReasoning?: boolean;
}

// Default demo agent
const DEFAULT_AGENT: AgentConfig = {
  id: "demo-agent",
  name: "Demo Web Agent",
  type: "web_automation",
  model: "gpt-4-vision",
  capabilities: ["screenshot", "click", "type", "scroll", "navigate"],
};

// Demo actions for preview
const DEMO_ACTIONS: AgentAction[] = [
  {
    id: "1",
    type: "navigate",
    target: "https://example.com",
    timestamp: 0,
    duration: 1200,
    status: "success",
    reasoning: "Navigate to target URL to begin data extraction workflow",
  },
  {
    id: "2",
    type: "wait",
    value: "page_load",
    timestamp: 1200,
    duration: 500,
    status: "success",
    reasoning: "Wait for page to fully load before interacting",
  },
  {
    id: "3",
    type: "click",
    target: "#search-button",
    coordinates: [320, 180],
    timestamp: 1700,
    duration: 150,
    status: "success",
    reasoning: "Click search button to reveal search input field",
  },
  {
    id: "4",
    type: "type",
    target: "#search-input",
    value: "automation tools",
    coordinates: [320, 220],
    timestamp: 1850,
    duration: 800,
    status: "success",
    reasoning: "Enter search query into the search input field",
  },
  {
    id: "5",
    type: "screenshot",
    timestamp: 2650,
    duration: 100,
    status: "success",
    reasoning: "Capture screenshot for observation before proceeding",
  },
];

// Action icons
const ACTION_ICONS: Record<ActionType, string> = {
  navigate: "🔗",
  click: "👆",
  type: "⌨️",
  scroll: "📜",
  extract: "📤",
  wait: "⏳",
  screenshot: "📸",
};

export function AgentPreviewPanel({
  agent = DEFAULT_AGENT,
  actions = DEMO_ACTIONS,
  executionState: initialState = "idle",
  currentUrl = "https://example.com",
  onStart,
  onPause,
  onResume,
  onStop,
  onStepForward,
  onStepBack,
  className = "",
  showReasoning = true,
}: AgentPreviewPanelProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>(initialState);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([200, 200]);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Get current action
  const currentAction = currentActionIndex >= 0 ? actions[currentActionIndex] : null;

  // Calculate progress
  const progress = actions.length > 0 ? ((currentActionIndex + 1) / actions.length) * 100 : 0;

  // Calculate success rate
  const successCount = actions.filter((a) => a.status === "success").length;
  const completedCount = actions.filter((a) => a.status !== "pending").length;
  const successRate = completedCount > 0 ? (successCount / completedCount) * 100 : 0;

  // Start execution
  const handleStart = useCallback(() => {
    setExecutionState("running");
    setCurrentActionIndex(0);
    setElapsedTime(0);
    onStart?.();
  }, [onStart]);

  // Pause execution
  const handlePause = useCallback(() => {
    setExecutionState("paused");
    onPause?.();
  }, [onPause]);

  // Resume execution
  const handleResume = useCallback(() => {
    setExecutionState("running");
    onResume?.();
  }, [onResume]);

  // Stop execution
  const handleStop = useCallback(() => {
    setExecutionState("idle");
    setCurrentActionIndex(-1);
    setElapsedTime(0);
    setCursorPosition([200, 200]);
    setTypedText("");
    onStop?.();
  }, [onStop]);

  // Step forward
  const handleStepForward = useCallback(() => {
    if (currentActionIndex < actions.length - 1) {
      setCurrentActionIndex((prev) => prev + 1);
      onStepForward?.();
    } else {
      setExecutionState("completed");
    }
  }, [currentActionIndex, actions.length, onStepForward]);

  // Step back
  const handleStepBack = useCallback(() => {
    if (currentActionIndex > 0) {
      setCurrentActionIndex((prev) => prev - 1);
      onStepBack?.();
    }
  }, [currentActionIndex, onStepBack]);

  // Animation loop
  useEffect(() => {
    if (executionState !== "running") return;

    const action = actions[currentActionIndex];
    if (!action) {
      setExecutionState("completed");
      return;
    }

    // Animate cursor to action coordinates
    if (action.coordinates) {
      setCursorPosition(action.coordinates);
    }

    // Handle typing animation
    if (action.type === "type" && action.value) {
      setIsTyping(true);
      setTypedText("");
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < action.value!.length) {
          setTypedText(action.value!.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 50 / speed);

      return () => clearInterval(typeInterval);
    }

    // Auto-advance to next action
    const timeout = setTimeout(() => {
      if (currentActionIndex < actions.length - 1) {
        setCurrentActionIndex((prev) => prev + 1);
      } else {
        setExecutionState("completed");
      }
    }, action.duration / speed);

    animationRef.current = timeout;

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [executionState, currentActionIndex, actions, speed]);

  // Elapsed time counter
  useEffect(() => {
    if (executionState !== "running") return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [executionState]);

  return (
    <div
      className={`bg-gradient-to-br from-gray-900/90 to-indigo-900/50 rounded-xl border border-indigo-500/20 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">🤖</div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-300">{agent.name}</h3>
            <div className="text-xs text-slate-400">
              {agent.model} • {agent.type.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* State indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              executionState === "running"
                ? "bg-green-400 animate-pulse"
                : executionState === "paused"
                ? "bg-amber-400"
                : executionState === "completed"
                ? "bg-cyan-400"
                : executionState === "failed"
                ? "bg-red-400"
                : "bg-slate-500"
            }`}
          />
          <span className="text-xs text-slate-400 capitalize">{executionState}</span>
        </div>
      </div>

      {/* URL Bar */}
      <div className="px-3 py-2 border-b border-indigo-500/10 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-300 font-sans truncate">
          {currentAction?.type === "navigate" ? currentAction.target : currentUrl}
        </div>
        <button className="p-1 text-slate-400 hover:text-slate-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="relative h-64 bg-slate-900 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      >
        {/* Simulated page content */}
        <div className="absolute inset-4 flex flex-col gap-3">
          {/* Header simulation */}
          <div className="h-8 bg-slate-800/50 rounded flex items-center px-3">
            <div className="w-20 h-3 bg-indigo-500/30 rounded" />
            <div className="flex-1" />
            <div className="flex gap-2">
              <div className="w-12 h-3 bg-slate-700/50 rounded" />
              <div className="w-12 h-3 bg-slate-700/50 rounded" />
            </div>
          </div>

          {/* Search bar simulation */}
          <div className="flex gap-2">
            <div
              id="search-input"
              className={`flex-1 h-8 bg-slate-800/70 rounded border px-3 flex items-center ${
                currentAction?.target === "#search-input"
                  ? "border-cyan-400 ring-1 ring-cyan-400/30"
                  : "border-slate-700/50"
              }`}
            >
              <span className="text-xs text-slate-400 font-sans">
                {isTyping || typedText ? typedText : "Search..."}
                {isTyping && <span className="animate-pulse">|</span>}
              </span>
            </div>
            <div
              id="search-button"
              className={`w-16 h-8 bg-indigo-500/30 rounded flex items-center justify-center cursor-pointer transition-all ${
                currentAction?.target === "#search-button"
                  ? "ring-2 ring-cyan-400 bg-indigo-500/50"
                  : "hover:bg-indigo-500/40"
              }`}
            >
              <span className="text-xs text-indigo-200">Search</span>
            </div>
          </div>

          {/* Content simulation */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/40 rounded p-2">
                <div className="w-full h-3 bg-slate-700/40 rounded mb-2" />
                <div className="w-3/4 h-2 bg-slate-700/30 rounded mb-1" />
                <div className="w-1/2 h-2 bg-slate-700/30 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Agent cursor */}
        <div
          className="absolute w-4 h-4 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: cursorPosition[0] - 8,
            top: cursorPosition[1] - 8,
            transform: currentAction?.type === "click" ? "scale(0.8)" : "scale(1)",
          }}
        >
          {/* Cursor shape */}
          <svg
            className="w-full h-full text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>

          {/* Click ripple */}
          {currentAction?.type === "click" && (
            <div className="absolute inset-0 -m-2">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
            </div>
          )}
        </div>

        {/* Screenshot overlay */}
        {currentAction?.type === "screenshot" && (
          <div className="absolute inset-0 bg-white/10 animate-pulse flex items-center justify-center">
            <div className="text-4xl">📸</div>
          </div>
        )}

        {/* Loading overlay for navigate */}
        {currentAction?.type === "navigate" && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Action timeline */}
      <div className="p-3 border-t border-indigo-500/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400">Actions</span>
          <div className="flex-1 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {Math.max(0, currentActionIndex + 1)}/{actions.length}
          </span>
        </div>

        {/* Action list */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                setCurrentActionIndex(index);
                setExecutionState("paused");
              }}
              className={`flex-shrink-0 px-2 py-1 rounded text-xs transition-all ${
                index === currentActionIndex
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : index < currentActionIndex
                  ? "bg-slate-700/50 text-slate-400"
                  : "bg-slate-800/50 text-slate-500"
              }`}
            >
              <span className="mr-1">{ACTION_ICONS[action.type]}</span>
              {action.type}
            </button>
          ))}
        </div>
      </div>

      {/* AI Reasoning */}
      {showReasoning && currentAction?.reasoning && (
        <div className="px-3 pb-3">
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amber-400">🧠 AI Reasoning</span>
            </div>
            <p className="text-xs text-slate-300">{currentAction.reasoning}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-3 border-t border-indigo-500/20 flex items-center justify-between">
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          {executionState === "idle" ? (
            <button
              onClick={handleStart}
              className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : executionState === "running" ? (
            <button
              onClick={handlePause}
              className="p-2 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={executionState === "idle"}
            className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <button
            onClick={handleStepBack}
            disabled={currentActionIndex <= 0}
            className="p-2 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentActionIndex >= actions.length - 1}
            className="p-2 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Speed</span>
          <div className="flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  speed === s
                    ? "bg-indigo-500/30 text-indigo-300"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 pb-3 grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-xs text-slate-400">Time</div>
          <div className="text-lg font-sans text-slate-200">
            <HoloNumber value={Math.round(elapsedTime / 1000)} />s
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Progress</div>
          <div className="text-lg font-sans text-indigo-300">
            <HoloNumber value={Math.round(progress)} />%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Success</div>
          <div className={`text-lg font-sans ${successRate >= 80 ? "text-emerald-300" : "text-amber-300"}`}>
            <HoloNumber value={Math.round(successRate)} />%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Actions</div>
          <div className="text-lg font-sans text-cyan-300">
            <HoloNumber value={completedCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPreviewPanel;
