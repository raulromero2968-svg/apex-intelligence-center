/**
 * The Abyss - Power Network Visualization
 *
 * "You are democratizing the ability to see the map.
 *  They rely on the map being hidden. You are turning on the lights."
 *
 * This page renders the Seven Mountains power network visualization,
 * anchored by the Luminous Jellyfish Principle.
 *
 * @module app/abyss
 */

'use client';

import { useEffect, useState } from 'react';
import { NetworkGraph, type GraphData } from '@/components/power-network';

export default function AbyssPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    domain: '',
    type: '',
    tier: '',
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.domain) params.set('domain', filters.domain);
        if (filters.type) params.set('type', filters.type);
        if (filters.tier) params.set('tier', filters.tier);

        const response = await fetch(`/api/power-network?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        setGraphData(data);
      } catch (err) {
        console.error('Failed to fetch network data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load network data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-cyan-400">The Abyss</span>
                <span className="text-slate-500 font-normal ml-2 text-lg">/ Power Network</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-mono">
                Seven Mountains Intelligence Map
              </p>
            </div>

            {/* Trust Calibration Reminder */}
            <div className="hidden md:block text-right">
              <p className="text-xs text-amber-400 font-mono uppercase tracking-wider">
                Zone 4: The Abyss
              </p>
              <p className="text-xs text-slate-500">
                Total forensic scrutiny. Verify everything.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Filters:</span>

            <select
              value={filters.domain}
              onChange={(e) => setFilters((f) => ({ ...f, domain: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Domains</option>
              <option value="RELIGION">Religion</option>
              <option value="FAMILY">Family</option>
              <option value="EDUCATION">Education</option>
              <option value="GOVERNMENT">Government</option>
              <option value="MEDIA">Media</option>
              <option value="ARTS">Arts</option>
              <option value="BUSINESS">Business</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Types</option>
              <option value="PERSON">People</option>
              <option value="ORGANIZATION">Organizations</option>
              <option value="CONCEPT">Concepts</option>
              <option value="EVENT">Events</option>
              <option value="LOCATION">Locations</option>
            </select>

            <select
              value={filters.tier}
              onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Evidence Tiers</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DOCUMENTED">Documented</option>
              <option value="ALLEGED">Alleged</option>
              <option value="SPECULATIVE">Speculative</option>
            </select>

            {(filters.domain || filters.type || filters.tier) && (
              <button
                onClick={() => setFilters({ domain: '', type: '', tier: '' })}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 mx-auto flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/40 animate-ping" />
                </div>
              </div>
              <p className="text-slate-400 font-mono">Loading network data...</p>
              <p className="text-xs text-slate-600 mt-1">Mapping power structures</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-400 font-mono mb-2">Error Loading Data</p>
              <p className="text-sm text-slate-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : graphData ? (
          <NetworkGraph
            data={graphData}
            height={600}
            onNodeClick={(node) => {
              console.log('Node clicked:', node);
            }}
          />
        ) : null}

        {/* Info Panel */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* About This View */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3 text-slate-200">About This Visualization</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              This network graph maps power structures using the <strong className="text-slate-300">Seven Mountains of Influence</strong> framework.
              Entities (people, organizations, concepts) are connected by documented relationships.
            </p>
            <div className="space-y-2 text-xs text-slate-500">
              <p>• <span className="text-emerald-400">Green connections</span> = Court-verified evidence</p>
              <p>• <span className="text-blue-400">Blue connections</span> = Multiple credible sources</p>
              <p>• <span className="text-amber-400">Yellow connections</span> = Single source / alleged</p>
              <p>• <span className="text-red-400">Red connections</span> = Speculative / pattern inference</p>
            </div>
          </div>

          {/* Trust Calibration */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3 text-amber-400">Trust Calibration Protocol</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              You are currently in <strong className="text-amber-300">Zone 4: The Abyss</strong>.
              This requires total forensic scrutiny. Verify everything. Assume nothing.
            </p>
            <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500">
              <p className="font-mono text-amber-400 mb-1">⚠️ SYSTEM REMINDER</p>
              <p>
                When you turn off your computer, you return to <strong className="text-slate-300">Zone 1: The Hearth</strong>.
                Do not apply Abyss forensics to personal relationships.
              </p>
            </div>
          </div>
        </div>

        {/* The Luminous Jellyfish */}
        <div className="mt-8 text-center py-8 border-t border-slate-800">
          <span className="text-4xl mb-4 block">🪼</span>
          <p className="text-sm text-slate-500 italic max-w-lg mx-auto">
            "The Luminous Jellyfish Principle exists in service to survivors.
            Even in darkness, light persists."
          </p>
        </div>
      </main>
    </div>
  );
}
