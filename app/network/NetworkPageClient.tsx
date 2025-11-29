'use client';

import React, { useState, useEffect } from 'react';
import { NetworkGraph, GraphData, GraphNode } from '@/components/network/NetworkGraph';

interface NetworkPageClientProps {
  data: GraphData;
}

export function NetworkPageClient({ data }: NetworkPageClientProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        const width = Math.min(container.clientWidth, 1200);
        const height = Math.min(Math.max(500, window.innerHeight - 400), 700);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  // Check if we have data
  if (data.nodes.length === 0) {
    return (
      <div className="p-8 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
        <div className="text-amber-400 text-lg font-semibold mb-2">
          Network Data Not Yet Seeded
        </div>
        <p className="text-slate-400 text-sm">
          Run the seed script to populate the Power Network:
        </p>
        <pre className="mt-3 p-3 bg-slate-900 rounded text-xs text-slate-300 font-mono">
          DATABASE_URL=... tsx packages/db/seeds/truth-tier/seed.ts
        </pre>
      </div>
    );
  }

  // Get connected relationships for selected node
  const getNodeConnections = (nodeId: string) => {
    return data.links.filter(
      (l) => l.source === nodeId || l.target === nodeId
    );
  };

  const getConnectedNodes = (nodeId: string) => {
    const connections = getNodeConnections(nodeId);
    const connectedIds = connections.map((c) =>
      c.source === nodeId ? c.target : c.source
    );
    return data.nodes.filter((n) => connectedIds.includes(n.id));
  };

  return (
    <div className="space-y-4">
      {/* Main Graph Container */}
      <div id="graph-container" className="w-full">
        <NetworkGraph
          data={data}
          width={dimensions.width}
          height={dimensions.height}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Selected Node Detail Panel */}
      {selectedNode && (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    selectedNode.type === 'SOLUTION'
                      ? 'bg-green-500/20 text-green-400'
                      : selectedNode.type === 'PERSON'
                      ? 'bg-red-500/20 text-red-400'
                      : selectedNode.type === 'ORGANIZATION'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {selectedNode.type}
                </span>
                <span className="text-slate-500 text-xs">
                  {selectedNode.evidenceTier}
                </span>
                {selectedNode.primaryDomain && (
                  <span className="text-slate-500 text-xs">
                    {selectedNode.primaryDomain}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedNode.scandalNotes && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-1">Notes</h4>
              <p className="text-slate-400 text-sm">{selectedNode.scandalNotes}</p>
            </div>
          )}

          {/* Connections */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">
              Connections ({getNodeConnections(selectedNode.id).length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getNodeConnections(selectedNode.id)
                .slice(0, 6)
                .map((link, idx) => {
                  const isSource = link.source === selectedNode.id;
                  const otherNodeId = isSource ? link.target : link.source;
                  const otherNode = data.nodes.find((n) => n.id === otherNodeId);

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-900/50 rounded text-xs"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          link.evidenceTier === 'CONFIRMED'
                            ? 'bg-red-500'
                            : link.evidenceTier === 'DOCUMENTED'
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-slate-400">
                        {isSource ? '→' : '←'}
                      </span>
                      <span className="text-slate-300 font-medium truncate">
                        {otherNode?.name || 'Unknown'}
                      </span>
                      <span className="text-slate-500 ml-auto">
                        {link.relationshipType}
                      </span>
                    </div>
                  );
                })}
            </div>
            {getNodeConnections(selectedNode.id).length > 6 && (
              <p className="text-slate-500 text-xs mt-2">
                +{getNodeConnections(selectedNode.id).length - 6} more connections
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
