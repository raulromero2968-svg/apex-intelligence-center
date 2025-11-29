'use client';

/**
 * Schema Preview Panel
 *
 * Live database schema visualization and query analysis.
 * Implements knowledge-09-database-architecture §2.1 (Schema Preview Panel).
 *
 * Features:
 * - Schema table visualization
 * - Query performance analysis
 * - Index recommendations
 * - Real-time slow query detection
 */

import React, { useState, useCallback } from 'react';
import {
  type ExplainPlan,
  type QueryAnalysis,
  type IndexRecommendation,
  analyzeQuery,
  parseExplainOutput,
  generateIndexRecommendations,
  generateOptimizedDrizzleQuery,
  SCAN_TYPE_SEVERITY,
} from '@/lib/database-arch';

// ============================================================================
// TYPES
// ============================================================================

interface SchemaPreviewPanelProps {
  tables?: Array<{
    name: string;
    columns: Array<{ name: string; type: string; nullable: boolean; isPrimary?: boolean }>;
    indexes?: string[];
  }>;
  onQueryAnalyzed?: (analysis: QueryAnalysis) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SchemaPreviewPanel({ tables = [], onQueryAnalyzed }: SchemaPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'query' | 'indexes'>('schema');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [explainInput, setExplainInput] = useState('');
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<IndexRecommendation[]>([]);

  const handleAnalyzeQuery = useCallback(() => {
    if (!queryInput || !explainInput) return;

    try {
      const explainPlan = parseExplainOutput(explainInput);
      const tableNames = tables.map((t) => t.name);
      const result = analyzeQuery(queryInput, explainPlan, tableNames);

      setAnalysis(result);
      onQueryAnalyzed?.(result);

      // Generate recommendations based on analysis
      if (result.suggestions.length > 0) {
        const mockQueries = [
          {
            id: '1',
            queryHash: 'hash',
            normalizedQuery: queryInput,
            executionCount: 100,
            avgDurationMs: result.estimatedCost,
            maxDurationMs: result.estimatedCost * 2,
            tables: tableNames,
            createdAt: new Date(),
            updatedAt: new Date(),
            projectId: 'test',
          },
        ];
        setRecommendations(generateIndexRecommendations(mockQueries));
      }
    } catch {
      setAnalysis(null);
    }
  }, [queryInput, explainInput, tables, onQueryAnalyzed]);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
    }
  };

  const getImpactBadge = (impact: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${colors[impact]}`}>
        {impact.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Database Schema & Query Analysis</h2>
        <p className="text-sm text-gray-400">Analyze queries and optimize database performance</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {(['schema', 'query', 'indexes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            {tables.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No tables defined. Add schema definitions to view them here.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTable === table.name ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans text-sm font-medium text-blue-400">{table.name}</span>
                      <span className="text-xs text-gray-500">{table.columns.length} columns</span>
                    </div>

                    {selectedTable === table.name && (
                      <div className="space-y-1 mt-3 pt-3 border-t border-gray-700">
                        {table.columns.map((col) => (
                          <div key={col.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {col.isPrimary && <span className="text-yellow-400">🔑</span>}
                              <span className="font-sans">{col.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{col.type}</span>
                              {col.nullable && (
                                <span className="text-gray-600 text-xs">NULL</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {table.indexes && table.indexes.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="text-xs text-gray-500 mb-1">Indexes:</div>
                            {table.indexes.map((idx) => (
                              <div key={idx} className="text-xs text-green-400 font-sans">
                                📊 {idx}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Query Analysis Tab */}
        {activeTab === 'query' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">SQL Query</label>
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg font-sans text-sm"
                placeholder="SELECT * FROM users WHERE email = $1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">EXPLAIN ANALYZE Output</label>
              <textarea
                value={explainInput}
                onChange={(e) => setExplainInput(e.target.value)}
                className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg font-sans text-xs"
                placeholder="Paste EXPLAIN ANALYZE output here..."
              />
            </div>

            <button
              onClick={handleAnalyzeQuery}
              disabled={!queryInput || !explainInput}
              className={`px-4 py-2 rounded-lg font-medium ${
                queryInput && explainInput
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Analyze Query
            </button>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-4 mt-6">
                {/* Summary */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-3">Analysis Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Estimated Cost</div>
                      <div className="text-lg font-bold">{analysis.estimatedCost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Estimated Rows</div>
                      <div className="text-lg font-bold">{analysis.estimatedRows}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Scan Types</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.scanTypes.map((scan, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(
                              SCAN_TYPE_SEVERITY[scan] || 'low'
                            )} bg-gray-700`}
                          >
                            {scan}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Optimization Suggestions</h4>
                    {analysis.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          suggestion.impact === 'high'
                            ? 'bg-red-900/20 border-red-700/50'
                            : suggestion.impact === 'medium'
                            ? 'bg-yellow-900/20 border-yellow-700/50'
                            : 'bg-blue-900/20 border-blue-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getImpactBadge(suggestion.impact)}
                          <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                        </div>
                        <div className="text-sm">{suggestion.message}</div>
                        {suggestion.suggestedFix && (
                          <pre className="mt-2 p-2 bg-gray-900 rounded text-xs font-sans overflow-x-auto">
                            {suggestion.suggestedFix}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Index Recommendations Tab */}
        {activeTab === 'indexes' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Index Types</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-gray-900 rounded">
                  <div className="font-medium text-blue-400">B-tree (default)</div>
                  <div className="text-gray-500">Equality/range queries, sorting</div>
                </div>
                <div className="p-2 bg-gray-900 rounded">
                  <div className="font-medium text-green-400">GIN</div>
                  <div className="text-gray-500">Full-text search, arrays, JSONB</div>
                </div>
                <div className="p-2 bg-gray-900 rounded">
                  <div className="font-medium text-purple-400">HNSW (pgvector)</div>
                  <div className="text-gray-500">Vector similarity, fast ANN</div>
                </div>
                <div className="p-2 bg-gray-900 rounded">
                  <div className="font-medium text-yellow-400">IVFFlat (pgvector)</div>
                  <div className="text-gray-500">Vector search, memory efficient</div>
                </div>
              </div>
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-sm text-blue-400">{rec.tableName}</span>
                      {getImpactBadge(rec.impact)}
                    </div>
                    <div className="text-sm text-gray-300 mb-2">{rec.reason}</div>
                    <pre className="p-2 bg-gray-900 rounded text-xs font-sans overflow-x-auto">
                      {rec.createStatement}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Analyze queries to get index recommendations.
              </div>
            )}

            {/* Drizzle Code Generation */}
            {selectedTable && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Generated Drizzle Query</h4>
                <pre className="p-3 bg-gray-800 rounded-lg text-xs font-sans overflow-x-auto">
                  {generateOptimizedDrizzleQuery(selectedTable, 'select', {
                    columns: ['*'],
                    conditions: [{ column: 'id', operator: '=', value: 'id' }],
                    orderBy: { column: 'createdAt', direction: 'desc' },
                    limit: 10,
                  })}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
