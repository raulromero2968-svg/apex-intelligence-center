'use client';

/**
 * Schema Binding Wizard
 *
 * Step-by-step wizard for creating JSON-LD structured data.
 * Implements knowledge-07-seo-performance §2.2 (Schema Binding Wizard).
 *
 * Steps:
 * 1. Type Selection - Choose schema type
 * 2. Data Entry - Fill in schema fields
 * 3. Validation - Check for errors
 * 4. Code Generation - Generate JSON-LD and component
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  type SchemaType,
  SCHEMA_TEMPLATES,
  validateSchema,
  generateJsonLdScript,
  generateNextJsComponent,
} from '@/lib/seo-performance';

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  step: number;
  schemaType: SchemaType | null;
  schemaData: Record<string, unknown>;
  validation: {
    isValid: boolean;
    errors: Array<{ property: string; message: string; severity: 'error' | 'warning' }>;
    richResultsEligible: boolean;
  } | null;
}

interface SchemaBindingWizardProps {
  onComplete?: (result: { schemaType: SchemaType; schemaData: Record<string, unknown>; code: string }) => void;
  onCancel?: () => void;
}

// ============================================================================
// STEPS
// ============================================================================

const STEPS = [
  { id: 1, name: 'Type', description: 'Select schema type' },
  { id: 2, name: 'Data', description: 'Enter schema data' },
  { id: 3, name: 'Validate', description: 'Check for errors' },
  { id: 4, name: 'Generate', description: 'Get code' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SchemaBindingWizard({ onComplete, onCancel }: SchemaBindingWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    schemaType: null,
    schemaData: {},
    validation: null,
  });

  const template = state.schemaType ? SCHEMA_TEMPLATES[state.schemaType] : null;

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.schemaType !== null;
      case 2:
        return Object.keys(state.schemaData).length > 0;
      case 3:
        return state.validation?.isValid === true;
      case 4:
        return true;
      default:
        return false;
    }
  }, [state]);

  const handleNext = useCallback(() => {
    if (state.step === 2) {
      // Validate
      const validation = validateSchema(state.schemaType!, {
        '@context': 'https://schema.org',
        '@type': state.schemaType,
        ...state.schemaData,
      });
      setState((prev) => ({ ...prev, step: 3, validation }));
    } else if (state.step < 4) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    } else {
      const fullSchema = {
        '@context': 'https://schema.org',
        '@type': state.schemaType,
        ...state.schemaData,
      };
      onComplete?.({
        schemaType: state.schemaType!,
        schemaData: fullSchema,
        code: generateJsonLdScript(fullSchema),
      });
    }
  }, [state, onComplete]);

  const handleBack = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const selectSchemaType = useCallback((type: SchemaType) => {
    setState((prev) => ({
      ...prev,
      schemaType: type,
      schemaData: {},
      validation: null,
    }));
  }, []);

  const updateField = useCallback((field: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      schemaData: {
        ...prev.schemaData,
        [field]: value,
      },
    }));
  }, []);

  const fullSchema = useMemo(() => {
    if (!state.schemaType) return null;
    return {
      '@context': 'https://schema.org',
      '@type': state.schemaType,
      ...state.schemaData,
    };
  }, [state.schemaType, state.schemaData]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Schema Markup Wizard</h2>
        <p className="text-sm text-gray-400">Create JSON-LD structured data for rich search results</p>
      </div>

      {/* Progress */}
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
        {/* Step 1: Type Selection */}
        {state.step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Schema Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(SCHEMA_TEMPLATES) as [SchemaType, typeof SCHEMA_TEMPLATES[SchemaType]][]).map(
                ([type, template]) => (
                  <button
                    key={type}
                    onClick={() => selectSchemaType(type)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      state.schemaType === type
                        ? 'bg-blue-900/30 border-blue-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                    {template.richResultsType && (
                      <div className="text-xs text-green-400 mt-2">
                        🎯 {template.richResultsType}
                      </div>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Step 2: Data Entry */}
        {state.step === 2 && template && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{template.name} Data</h3>

            {/* Required Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400">Required Fields</h4>
              {template.requiredFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-300 mb-1">{field} *</label>
                  <input
                    type="text"
                    value={(state.schemaData[field] as string) ?? ''}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    placeholder={`Enter ${field}...`}
                  />
                </div>
              ))}
            </div>

            {/* Optional Fields */}
            {template.optionalFields.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">Optional Fields</h4>
                {template.optionalFields.map((field) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-300 mb-1">{field}</label>
                    <input
                      type="text"
                      value={(state.schemaData[field] as string) ?? ''}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Example */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <h4 className="text-xs text-gray-400 mb-2">Example</h4>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(template.example, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {state.step === 3 && state.validation && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Validation Results</h3>

            {/* Status */}
            <div
              className={`p-4 rounded-lg ${
                state.validation.isValid
                  ? 'bg-green-900/20 border border-green-700'
                  : 'bg-red-900/20 border border-red-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{state.validation.isValid ? '✅' : '❌'}</span>
                <div>
                  <div className="font-medium">
                    {state.validation.isValid ? 'Schema is valid!' : 'Validation errors found'}
                  </div>
                  {state.validation.richResultsEligible && (
                    <div className="text-sm text-green-400">Eligible for rich results</div>
                  )}
                </div>
              </div>
            </div>

            {/* Errors */}
            {state.validation.errors.length > 0 && (
              <div className="space-y-2">
                {state.validation.errors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      error.severity === 'error'
                        ? 'bg-red-900/20 border border-red-700/50'
                        : 'bg-yellow-900/20 border border-yellow-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                        {error.severity === 'error' ? '🚫' : '⚠️'}
                      </span>
                      <span className="font-mono text-sm">{error.property}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{error.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            {fullSchema && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Schema Preview</h4>
                <pre className="p-3 bg-gray-800 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(fullSchema, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Code Generation */}
        {state.step === 4 && fullSchema && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Generated Code</h3>

            {/* JSON-LD Script */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">JSON-LD Script Tag</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(generateJsonLdScript(fullSchema))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-800 rounded-lg text-xs overflow-x-auto max-h-48">
                {generateJsonLdScript(fullSchema)}
              </pre>
            </div>

            {/* Next.js Component */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Next.js Component</h4>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(generateNextJsComponent(state.schemaType!))
                  }
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-800 rounded-lg text-xs overflow-x-auto max-h-64">
                {generateNextJsComponent(state.schemaType!)}
              </pre>
            </div>

            {/* Rich Results Test */}
            {state.validation?.richResultsEligible && (
              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400">🎯</span>
                  <span className="font-medium">Eligible for Rich Results</span>
                </div>
                <p className="text-sm text-gray-400">
                  Test your schema at{' '}
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Google Rich Results Test
                  </a>
                </p>
              </div>
            )}
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
          {state.step === 4 ? 'Complete' : state.step === 2 ? 'Validate' : 'Next'}
        </button>
      </div>
    </div>
  );
}
