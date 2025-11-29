'use client';

/**
 * Vector Binding Wizard
 *
 * Step-by-step wizard for configuring pgvector indexes.
 * Implements knowledge-09-database-architecture §2.2 (Vector Index Wizard).
 *
 * Steps:
 * 1. Index Type Selection - HNSW vs IVFFlat
 * 2. Configuration - Parameters and distance metric
 * 3. Preview - SQL and Drizzle code
 * 4. Apply - Generate migration
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  type IndexType,
  type DistanceMetric,
  type HnswParams,
  type IvfflatParams,
  DEFAULT_HNSW_PARAMS,
  DEFAULT_IVFFLAT_PARAMS,
  DISTANCE_OPERATORS,
  EMBEDDING_DIMENSIONS,
  generateHnswIndexSql,
  generateIvfflatIndexSql,
  generateDrizzleVectorSchema,
  generateDrizzleSimilaritySearch,
  getIndexRecommendation,
} from '@/lib/database-arch';

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  step: number;
  tableName: string;
  columnName: string;
  indexType: IndexType | null;
  distanceMetric: DistanceMetric;
  dimensions: number;
  hnswParams: HnswParams;
  ivfflatParams: IvfflatParams;
  rowCount: number;
  queryFrequency: 'low' | 'medium' | 'high';
  accuracyNeeds: 'low' | 'medium' | 'high';
}

interface VectorBindingWizardProps {
  onComplete?: (result: {
    indexType: IndexType;
    sql: string;
    drizzleSchema: string;
    drizzleSearch: string;
  }) => void;
  onCancel?: () => void;
}

// ============================================================================
// STEPS
// ============================================================================

const STEPS = [
  { id: 1, name: 'Setup', description: 'Table and column' },
  { id: 2, name: 'Index', description: 'Choose index type' },
  { id: 3, name: 'Config', description: 'Set parameters' },
  { id: 4, name: 'Generate', description: 'Get code' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function VectorBindingWizard({ onComplete, onCancel }: VectorBindingWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    tableName: '',
    columnName: 'embedding',
    indexType: null,
    distanceMetric: 'cosine',
    dimensions: 1536,
    hnswParams: { ...DEFAULT_HNSW_PARAMS },
    ivfflatParams: { ...DEFAULT_IVFFLAT_PARAMS },
    rowCount: 10000,
    queryFrequency: 'medium',
    accuracyNeeds: 'high',
  });

  const recommendation = useMemo(() => {
    return getIndexRecommendation(state.rowCount, state.queryFrequency, state.accuracyNeeds);
  }, [state.rowCount, state.queryFrequency, state.accuracyNeeds]);

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.tableName.length > 0 && state.columnName.length > 0;
      case 2:
        return state.indexType !== null;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }, [state]);

  const generatedSql = useMemo(() => {
    if (!state.indexType || !state.tableName || !state.columnName) return '';

    const indexName = `${state.tableName}_${state.columnName}_idx`;

    if (state.indexType === 'hnsw') {
      return generateHnswIndexSql(
        state.tableName,
        state.columnName,
        indexName,
        state.distanceMetric,
        state.hnswParams
      );
    } else {
      return generateIvfflatIndexSql(
        state.tableName,
        state.columnName,
        indexName,
        state.distanceMetric,
        state.ivfflatParams
      );
    }
  }, [state]);

  const generatedDrizzleSchema = useMemo(() => {
    if (!state.tableName || !state.columnName) return '';
    return generateDrizzleVectorSchema(state.tableName, state.columnName, state.dimensions);
  }, [state.tableName, state.columnName, state.dimensions]);

  const generatedDrizzleSearch = useMemo(() => {
    if (!state.tableName || !state.columnName) return '';
    return generateDrizzleSimilaritySearch(state.tableName, state.columnName, state.distanceMetric);
  }, [state.tableName, state.columnName, state.distanceMetric]);

  const handleNext = useCallback(() => {
    if (state.step < 4) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    } else {
      onComplete?.({
        indexType: state.indexType!,
        sql: generatedSql,
        drizzleSchema: generatedDrizzleSchema,
        drizzleSearch: generatedDrizzleSearch,
      });
    }
  }, [state.step, state.indexType, generatedSql, generatedDrizzleSchema, generatedDrizzleSearch, onComplete]);

  const handleBack = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Vector Index Wizard</h2>
        <p className="text-sm text-gray-400">Configure pgvector indexes for similarity search</p>
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
                      ? 'bg-purple-600 text-white'
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
        {/* Step 1: Setup */}
        {state.step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Table & Column Setup</h3>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Table Name *</label>
              <input
                type="text"
                value={state.tableName}
                onChange={(e) => updateState({ tableName: e.target.value })}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white font-sans"
                placeholder="documents"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Column Name *</label>
              <input
                type="text"
                value={state.columnName}
                onChange={(e) => updateState({ columnName: e.target.value })}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white font-sans"
                placeholder="embedding"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Embedding Dimensions</label>
              <select
                value={state.dimensions}
                onChange={(e) => updateState({ dimensions: Number(e.target.value) })}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                {Object.entries(EMBEDDING_DIMENSIONS).map(([model, dims]) => (
                  <option key={model} value={dims}>
                    {dims} ({model})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Est. Row Count</label>
                <input
                  type="number"
                  value={state.rowCount}
                  onChange={(e) => updateState({ rowCount: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Query Frequency</label>
                <select
                  value={state.queryFrequency}
                  onChange={(e) =>
                    updateState({ queryFrequency: e.target.value as 'low' | 'medium' | 'high' })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Accuracy Needs</label>
                <select
                  value={state.accuracyNeeds}
                  onChange={(e) =>
                    updateState({ accuracyNeeds: e.target.value as 'low' | 'medium' | 'high' })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="low">Low (faster)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (precise)</option>
                </select>
              </div>
            </div>

            {/* Recommendation Preview */}
            <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-400">💡</span>
                <span className="font-medium">Recommended: {recommendation.indexType.toUpperCase()}</span>
              </div>
              <p className="text-sm text-gray-400">{recommendation.reason}</p>
            </div>
          </div>
        )}

        {/* Step 2: Index Type Selection */}
        {state.step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Index Type</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* HNSW */}
              <button
                onClick={() => updateState({ indexType: 'hnsw' })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  state.indexType === 'hnsw'
                    ? 'bg-purple-900/30 border-purple-600'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-lg">HNSW</div>
                  {recommendation.indexType === 'hnsw' && (
                    <span className="text-xs bg-purple-500/30 text-purple-400 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Hierarchical Navigable Small World
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-green-400">✓ Faster queries</div>
                  <div className="text-green-400">✓ Better recall</div>
                  <div className="text-yellow-400">○ Higher memory</div>
                  <div className="text-yellow-400">○ Slower builds</div>
                </div>
              </button>

              {/* IVFFlat */}
              <button
                onClick={() => updateState({ indexType: 'ivfflat' })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  state.indexType === 'ivfflat'
                    ? 'bg-purple-900/30 border-purple-600'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-lg">IVFFlat</div>
                  {recommendation.indexType === 'ivfflat' && (
                    <span className="text-xs bg-purple-500/30 text-purple-400 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">Inverted File with Flat Compression</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-green-400">✓ Lower memory</div>
                  <div className="text-green-400">✓ Faster builds</div>
                  <div className="text-yellow-400">○ Slower queries</div>
                  <div className="text-yellow-400">○ Lower recall</div>
                </div>
              </button>
            </div>

            {/* Distance Metric */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">Distance Metric</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(DISTANCE_OPERATORS) as DistanceMetric[]).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => updateState({ distanceMetric: metric })}
                    className={`p-3 rounded-lg border text-center ${
                      state.distanceMetric === metric
                        ? 'bg-blue-900/30 border-blue-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-sans text-sm">{DISTANCE_OPERATORS[metric]}</div>
                    <div className="text-xs text-gray-400 capitalize mt-1">{metric}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {state.step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {state.indexType === 'hnsw' ? 'HNSW' : 'IVFFlat'} Parameters
            </h3>

            {state.indexType === 'hnsw' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    M (max connections per layer)
                  </label>
                  <input
                    type="number"
                    value={state.hnswParams.m}
                    onChange={(e) =>
                      updateState({
                        hnswParams: { ...state.hnswParams, m: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    min={2}
                    max={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = better recall, more memory. Default: 16
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    ef_construction (build quality)
                  </label>
                  <input
                    type="number"
                    value={state.hnswParams.efConstruction}
                    onChange={(e) =>
                      updateState({
                        hnswParams: { ...state.hnswParams, efConstruction: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    min={4}
                    max={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = better quality, slower builds. Default: 64
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Lists (cluster count)</label>
                  <input
                    type="number"
                    value={state.ivfflatParams.lists}
                    onChange={(e) =>
                      updateState({
                        ivfflatParams: { ...state.ivfflatParams, lists: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    min={1}
                    max={10000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: sqrt(rows) to rows/1000. For {state.rowCount} rows:{' '}
                    {Math.round(Math.sqrt(state.rowCount))} - {Math.round(state.rowCount / 1000)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Probes (search quality)</label>
                  <input
                    type="number"
                    value={state.ivfflatParams.probes}
                    onChange={(e) =>
                      updateState({
                        ivfflatParams: { ...state.ivfflatParams, probes: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    min={1}
                    max={state.ivfflatParams.lists}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = better recall, slower queries. Default: sqrt(lists)
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Summary */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Configuration Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Index Type:</span>{' '}
                  <span className="text-white">{state.indexType?.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Distance:</span>{' '}
                  <span className="text-white">{state.distanceMetric}</span>
                </div>
                <div>
                  <span className="text-gray-500">Table:</span>{' '}
                  <span className="text-white font-sans">{state.tableName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Column:</span>{' '}
                  <span className="text-white font-sans">{state.columnName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Code Generation */}
        {state.step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Generated Code</h3>

            {/* SQL Index */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">SQL Index Creation</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedSql)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-800 rounded-lg text-xs font-sans overflow-x-auto">
                {generatedSql}
              </pre>
            </div>

            {/* Drizzle Schema */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Drizzle Schema</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedDrizzleSchema)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-800 rounded-lg text-xs font-sans overflow-x-auto max-h-48">
                {generatedDrizzleSchema}
              </pre>
            </div>

            {/* Drizzle Search */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Similarity Search Function</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedDrizzleSearch)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-800 rounded-lg text-xs font-sans overflow-x-auto max-h-64">
                {generatedDrizzleSearch}
              </pre>
            </div>

            {/* Usage Notes */}
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400">📝</span>
                <span className="font-medium">Usage Notes</span>
              </div>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Run the SQL in a migration or directly on your database</li>
                <li>Add the schema to your Drizzle schema file</li>
                <li>Use the search function in your application code</li>
                {state.indexType === 'ivfflat' && (
                  <li>Set probes before search: SET ivfflat.probes = {state.ivfflatParams.probes}</li>
                )}
              </ul>
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
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {state.step === 4 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}
