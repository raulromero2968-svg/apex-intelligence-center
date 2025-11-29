'use client';

/**
 * Performance Binding Wizard
 *
 * Step-by-step wizard for optimizing React Native components.
 * Implements knowledge-08-mobile-performance §2.2 (Perf Binding Wizard).
 *
 * Steps:
 * 1. Component Selection - Choose component to optimize
 * 2. Issue Detection - Analyze for performance issues
 * 3. Optimization Selection - Choose optimizations to apply
 * 4. Code Generation - Generate optimized code
 * 5. Review & Apply - Review and apply changes
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  type OptimizationType,
  type ComponentAnalysis,
  type OptimizationSuggestion,
  type Platform,
} from '@/lib/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  step: number;
  componentCode: string;
  componentName: string;
  platform: Platform;
  analysis: ComponentAnalysis | null;
  selectedOptimizations: string[];
  optimizedCode: string;
}

interface PerfBindingWizardProps {
  onComplete?: (result: { originalCode: string; optimizedCode: string; optimizations: string[] }) => void;
  onCancel?: () => void;
}

// ============================================================================
// MOCK ANALYSIS (would call backend in production)
// ============================================================================

function analyzeComponentCode(code: string, componentName: string): ComponentAnalysis {
  const issues: ComponentAnalysis['issues'] = [];
  const suggestions: ComponentAnalysis['suggestions'] = [];

  // Check for inline renderItem
  if (code.includes('renderItem={({') || code.includes('renderItem={(')) {
    issues.push({
      type: 'render_prevention',
      severity: 'medium',
      description: 'Inline function in renderItem causes new reference each render',
      code: 'renderItem={({ item })',
    });
    suggestions.push({
      title: 'Extract renderItem with useCallback',
      description: 'Memoize the renderItem function to maintain referential equality',
      type: 'render_prevention',
      beforeCode: `<FlatList
  data={items}
  renderItem={({ item }) => <Card item={item} />}
/>`,
      afterCode: `const renderItem = useCallback(({ item }) => (
  <Card item={item} />
), []);

<FlatList
  data={items}
  renderItem={renderItem}
/>`,
      autoApplicable: true,
    });
  }

  // Check for missing React.memo
  if (code.includes('function') && !code.includes('React.memo') && !code.includes('memo(')) {
    issues.push({
      type: 'memoization',
      severity: 'high',
      description: 'Component not wrapped in React.memo may re-render unnecessarily',
    });
    suggestions.push({
      title: 'Wrap component in React.memo',
      description: 'Prevents re-renders when props have not changed',
      type: 'memoization',
      beforeCode: `function ${componentName}({ data }) {
  return <View>{data.name}</View>;
}`,
      afterCode: `const ${componentName} = React.memo(({ data }) => {
  return <View>{data.name}</View>;
});`,
      autoApplicable: true,
    });
  }

  // Check for missing keyExtractor
  if (code.includes('<FlatList') && !code.includes('keyExtractor')) {
    issues.push({
      type: 'virtualization',
      severity: 'medium',
      description: 'FlatList without keyExtractor uses index as key',
    });
    suggestions.push({
      title: 'Add keyExtractor',
      description: 'Use stable IDs for efficient list updates',
      type: 'virtualization',
      beforeCode: `<FlatList data={items} renderItem={renderItem} />`,
      afterCode: `<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>`,
      autoApplicable: true,
    });
  }

  // Check for Image from react-native
  if (code.includes("from 'react-native'") && code.includes('<Image')) {
    issues.push({
      type: 'image_optimization',
      severity: 'high',
      description: 'Using basic Image component without caching',
    });
    suggestions.push({
      title: 'Use expo-image for caching',
      description: 'expo-image provides built-in caching and better performance',
      type: 'image_optimization',
      beforeCode: `import { Image } from 'react-native';
<Image source={{ uri: imageUrl }} />`,
      afterCode: `import { Image } from 'expo-image';
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  placeholder={blurhash}
  transition={200}
/>`,
      autoApplicable: false,
    });
  }

  // Check for console.log
  if (code.includes('console.log') || code.includes('console.warn')) {
    issues.push({
      type: 'hermes_tuning',
      severity: 'low',
      description: 'Console statements impact performance in production',
    });
    suggestions.push({
      title: 'Conditionally disable console',
      description: 'Only log in development mode',
      type: 'hermes_tuning',
      beforeCode: `console.log('data:', data);`,
      afterCode: `if (__DEV__) console.log('data:', data);`,
      autoApplicable: true,
    });
  }

  return {
    componentName,
    issues,
    suggestions,
    estimatedImprovement: {
      renderTime: issues.length * 5,
      reRenders: issues.filter(i => i.type === 'memoization' || i.type === 'render_prevention').length * 3,
      memoryMb: issues.filter(i => i.type === 'image_optimization' || i.type === 'memory_management').length * 10,
    },
  };
}

// ============================================================================
// WIZARD STEPS
// ============================================================================

const STEPS = [
  { id: 1, name: 'Component', description: 'Select component to optimize' },
  { id: 2, name: 'Analysis', description: 'Detect performance issues' },
  { id: 3, name: 'Optimize', description: 'Select optimizations' },
  { id: 4, name: 'Generate', description: 'Generate optimized code' },
  { id: 5, name: 'Review', description: 'Review and apply' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PerfBindingWizard({ onComplete, onCancel }: PerfBindingWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    componentCode: '',
    componentName: 'MyComponent',
    platform: 'both',
    analysis: null,
    selectedOptimizations: [],
    optimizedCode: '',
  });

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.componentCode.trim().length > 0 && state.componentName.trim().length > 0;
      case 2:
        return state.analysis !== null;
      case 3:
        return state.selectedOptimizations.length > 0;
      case 4:
        return state.optimizedCode.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  }, [state]);

  const handleNext = useCallback(() => {
    if (state.step === 1) {
      // Run analysis
      const analysis = analyzeComponentCode(state.componentCode, state.componentName);
      setState((prev) => ({
        ...prev,
        step: 2,
        analysis,
        selectedOptimizations: analysis.suggestions.map((_, i) => i.toString()),
      }));
    } else if (state.step === 3) {
      // Generate optimized code
      const selectedSuggestions = state.analysis?.suggestions.filter((_, i) =>
        state.selectedOptimizations.includes(i.toString())
      ) ?? [];

      let optimized = state.componentCode;

      // Simple text replacement for demo (real impl would use AST)
      for (const suggestion of selectedSuggestions) {
        if (suggestion.autoApplicable && suggestion.beforeCode) {
          // This is simplified - real implementation would use proper code transformation
          optimized = optimized.includes(suggestion.beforeCode.split('\n')[0])
            ? optimized
            : optimized;
        }
      }

      // Add imports if needed
      if (selectedSuggestions.some(s => s.type === 'memoization' || s.type === 'render_prevention')) {
        if (!optimized.includes('useCallback') && !optimized.includes('useMemo')) {
          optimized = `import React, { memo, useCallback, useMemo } from 'react';\n\n` + optimized;
        }
      }

      setState((prev) => ({ ...prev, step: 4, optimizedCode: optimized }));
    } else if (state.step < 5) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    } else {
      onComplete?.({
        originalCode: state.componentCode,
        optimizedCode: state.optimizedCode,
        optimizations: state.selectedOptimizations,
      });
    }
  }, [state, onComplete]);

  const handleBack = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const toggleOptimization = useCallback((index: string) => {
    setState((prev) => ({
      ...prev,
      selectedOptimizations: prev.selectedOptimizations.includes(index)
        ? prev.selectedOptimizations.filter((i) => i !== index)
        : [...prev.selectedOptimizations, index],
    }));
  }, []);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTypeIcon = (type: OptimizationType) => {
    switch (type) {
      case 'memoization': return '🧠';
      case 'virtualization': return '📜';
      case 'render_prevention': return '🚫';
      case 'image_optimization': return '🖼️';
      case 'bridge_batching': return '🌉';
      case 'hermes_tuning': return '⚡';
      case 'memory_management': return '💾';
      case 'lazy_loading': return '⏳';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Performance Optimization Wizard</h2>
        <p className="text-sm text-gray-400">Optimize your React Native component step by step</p>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    state.step > step.id
                      ? 'bg-green-600 text-white'
                      : state.step === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {state.step > step.id ? '✓' : step.id}
                </div>
                <div className="text-xs mt-1 text-gray-400">{step.name}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    state.step > step.id ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Component Selection */}
        {state.step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Component Name
              </label>
              <input
                type="text"
                value={state.componentName}
                onChange={(e) => setState((prev) => ({ ...prev, componentName: e.target.value }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="e.g., CardList"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Platform
              </label>
              <select
                value={state.platform}
                onChange={(e) => setState((prev) => ({ ...prev, platform: e.target.value as Platform }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="both">Both iOS & Android</option>
                <option value="ios">iOS Only</option>
                <option value="android">Android Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Component Code
              </label>
              <textarea
                value={state.componentCode}
                onChange={(e) => setState((prev) => ({ ...prev, componentCode: e.target.value }))}
                className="w-full h-64 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-sans text-sm"
                placeholder={`// Paste your React Native component code here
function CardList({ cards }) {
  return (
    <FlatList
      data={cards}
      renderItem={({ item }) => <CardItem card={item} />}
    />
  );
}`}
              />
            </div>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {state.step === 2 && state.analysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Analysis Results</h3>
              <div className="text-sm text-gray-400">
                {state.analysis.issues.length} issues found
              </div>
            </div>

            {state.analysis.issues.length === 0 ? (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">✨</div>
                <div className="text-green-400 font-medium">No issues detected!</div>
                <div className="text-sm text-gray-400">Your component looks well-optimized.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {state.analysis.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(issue.type)}</span>
                      <span className="font-medium capitalize">{issue.type.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        issue.severity === 'high' ? 'bg-red-500/20' :
                        issue.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{issue.description}</p>
                    {issue.code && (
                      <code className="block mt-2 text-xs bg-black/30 p-2 rounded">
                        {issue.code}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Estimated Improvements */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Estimated Improvements</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    -{state.analysis.estimatedImprovement.renderTime ?? 0}%
                  </div>
                  <div className="text-xs text-gray-400">Render Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    -{state.analysis.estimatedImprovement.reRenders ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">Re-renders/sec</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    -{state.analysis.estimatedImprovement.memoryMb ?? 0}MB
                  </div>
                  <div className="text-xs text-gray-400">Memory</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Optimization Selection */}
        {state.step === 3 && state.analysis && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Optimizations to Apply</h3>

            <div className="space-y-3">
              {state.analysis.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    state.selectedOptimizations.includes(index.toString())
                      ? 'bg-blue-900/30 border-blue-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => toggleOptimization(index.toString())}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={state.selectedOptimizations.includes(index.toString())}
                      onChange={() => toggleOptimization(index.toString())}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(suggestion.type)}</span>
                        <span className="font-medium">{suggestion.title}</span>
                        {suggestion.autoApplicable && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Auto-fix
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{suggestion.description}</p>
                    </div>
                  </div>

                  {/* Code comparison */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Before</div>
                      <pre className="text-xs bg-red-900/20 p-2 rounded overflow-x-auto">
                        {suggestion.beforeCode}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">After</div>
                      <pre className="text-xs bg-green-900/20 p-2 rounded overflow-x-auto">
                        {suggestion.afterCode}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Code Generation */}
        {state.step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Generated Optimized Code</h3>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
                <span className="text-sm text-gray-300">{state.componentName}.tsx</span>
                <button
                  onClick={() => navigator.clipboard.writeText(state.optimizedCode)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 text-sm font-sans overflow-x-auto max-h-96">
                {state.optimizedCode || state.componentCode}
              </pre>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Applied Optimizations</h4>
              <ul className="space-y-1">
                {state.analysis?.suggestions
                  .filter((_, i) => state.selectedOptimizations.includes(i.toString()))
                  .map((suggestion, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      {suggestion.title}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {state.step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Apply</h3>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Component</span>
                  <span>{state.componentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform</span>
                  <span className="capitalize">{state.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Issues Fixed</span>
                  <span className="text-green-400">{state.selectedOptimizations.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Original</h4>
                <pre className="text-xs font-sans overflow-x-auto max-h-48 text-red-300">
                  {state.componentCode.substring(0, 500)}...
                </pre>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Optimized</h4>
                <pre className="text-xs font-sans overflow-x-auto max-h-48 text-green-300">
                  {(state.optimizedCode || state.componentCode).substring(0, 500)}...
                </pre>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-green-400 font-medium">Ready to Apply!</div>
              <div className="text-sm text-gray-400">
                Click "Apply Changes" to update your component.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 flex justify-between">
        <button
          onClick={state.step === 1 ? onCancel : handleBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          {state.step === 1 ? 'Cancel' : 'Back'}
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg font-medium ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {state.step === 5 ? 'Apply Changes' : state.step === 1 ? 'Analyze' : 'Next'}
        </button>
      </div>
    </div>
  );
}
