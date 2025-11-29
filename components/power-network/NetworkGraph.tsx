/**
 * NetworkGraph - Power Network Visualization Engine
 *
 * A force-directed graph visualization for the "Seven Mountains" power mapping.
 * Renders entities as nodes and relationships as edges, with Truth Tier color coding.
 *
 * The Luminous Jellyfish Principle sits at the center - not as a node of power,
 * but as an anchor of perspective. Light persists in the abyss.
 *
 * @module power-network/NetworkGraph
 */

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import { SourceCard, type EvidenceTier } from './SourceCard';

// Dynamically import ForceGraph to prevent SSR errors
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 mx-auto flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/40 animate-ping" />
          </div>
        </div>
        <p className="text-sm font-mono text-slate-400">Initializing Neural Link...</p>
        <p className="text-xs text-slate-600 mt-1">Mapping power structures</p>
      </div>
    </div>
  )
});

// =============================================================================
// TYPES
// =============================================================================

export type PowerEntityType = 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'EVENT' | 'LOCATION';
export type PowerDomainType = 'RELIGION' | 'FAMILY' | 'EDUCATION' | 'GOVERNMENT' | 'MEDIA' | 'ARTS' | 'BUSINESS';
export type PowerRelationshipType = 'FINANCIAL' | 'EMPLOYMENT' | 'OWNERSHIP' | 'POLITICAL' | 'LEGAL' | 'SOCIAL' | 'FAMILIAL' | 'IDEOLOGICAL';

export interface GraphNode {
  id: string;
  name: string;
  type: PowerEntityType;
  evidenceTier: EvidenceTier;
  primaryDomain: PowerDomainType;
  summary?: string;
  scandalNotes?: string;
  isObfuscated?: boolean; // Ghost Protocol: Hidden actors (e.g., "Unnamed Co-Conspirator")
  val?: number; // Node size
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relationshipType: PowerRelationshipType;
  domain: PowerDomainType;
  evidenceTier: EvidenceTier;
  description?: string;
  evidenceLink?: string;
  significance?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface NetworkGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  height?: number;
}

// =============================================================================
// COLOR CONFIGURATIONS
// =============================================================================

const evidenceTierColors: Record<EvidenceTier, string> = {
  CONFIRMED: '#22c55e',   // Green - Verified
  DOCUMENTED: '#3b82f6',  // Blue - Strong
  ALLEGED: '#eab308',     // Yellow - Caution
  SPECULATIVE: '#ef4444', // Red - Danger
};

const entityTypeColors: Record<PowerEntityType, string> = {
  PERSON: '#f8fafc',      // White - People
  ORGANIZATION: '#f97316', // Orange - Organizations
  CONCEPT: '#a855f7',     // Purple - Concepts/Ideas
  EVENT: '#06b6d4',       // Cyan - Events
  LOCATION: '#84cc16',    // Lime - Locations
};

const domainIcons: Record<PowerDomainType, string> = {
  RELIGION: '✝',
  FAMILY: '♥',
  EDUCATION: '🎓',
  GOVERNMENT: '⚖',
  MEDIA: '📺',
  ARTS: '🎭',
  BUSINESS: '💼',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function NetworkGraph({ data, onNodeClick, height = 600 }: NetworkGraphProps) {
  const fgRef = useRef<any>();
  const [activeLink, setActiveLink] = useState<GraphLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Compute node sizes based on connection count and evidence tier
  const processedData = useMemo(() => {
    const connectionCounts = new Map<string, number>();

    // Count connections per node
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    });

    // Add size (val) to nodes
    const nodes = data.nodes.map(node => ({
      ...node,
      val: calculateNodeSize(node, connectionCounts.get(node.id) || 0),
    }));

    return { nodes, links: data.links };
  }, [data]);

  // Calculate node size based on type, tier, and connections
  const calculateNodeSize = useCallback((node: GraphNode, connections: number) => {
    let baseSize = 5;

    // Increase size for Concepts (anchor points)
    if (node.type === 'CONCEPT') baseSize = 15;
    else if (node.type === 'EVENT') baseSize = 8;
    else if (node.type === 'ORGANIZATION') baseSize = 10;

    // Scale by connections (more connected = larger)
    const connectionBonus = Math.min(connections * 2, 15);

    // Higher evidence tier = larger (more verified = more prominent)
    const tierBonus = node.evidenceTier === 'CONFIRMED' ? 5 :
                      node.evidenceTier === 'DOCUMENTED' ? 3 : 0;

    return baseSize + connectionBonus + tierBonus;
  }, []);

  // Get link color based on evidence tier
  const getLinkColor = useCallback((link: GraphLink) => {
    return evidenceTierColors[link.evidenceTier] || '#94a3b8';
  }, []);

  // Get node color based on entity type
  const getNodeColor = useCallback((node: GraphNode) => {
    return entityTypeColors[node.type] || '#f8fafc';
  }, []);

  // Get link width based on significance
  const getLinkWidth = useCallback((link: GraphLink) => {
    switch (link.significance) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }, []);

  // Custom node canvas drawing
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 3);
    const nodeSize = Math.sqrt(node.val || 5) * 2;

    // =========================================================================
    // GHOST PROTOCOL: Obfuscated Node Rendering
    // Dashed, translucent circles for unknown actors (e.g., "Unnamed Co-Conspirator")
    // =========================================================================
    if (node.isObfuscated) {
      // Ghost node - dashed border, very faint fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.1)'; // Slate-400, 10% opacity - spectral fill
      ctx.fill();

      // Dashed border for ghost nodes
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'; // Slate-400, 50% opacity
      ctx.setLineDash([4 / globalScale, 2 / globalScale]); // Dashed line pattern
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash pattern

      // Ghost label - faded text
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'; // Faded label
      ctx.fillText(label, node.x, node.y + nodeSize + 3);

      // Ghost icon indicator
      ctx.font = `${fontSize * 0.8}px sans-serif`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.fillText('👻', node.x, node.y - nodeSize - fontSize);

      return; // Exit early - ghost nodes have their own complete rendering
    }

    // =========================================================================
    // STANDARD NODE RENDERING
    // =========================================================================

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();

    // Add glow for Concepts (the anchors of perspective)
    if (node.type === 'CONCEPT') {
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#a855f780';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw border based on evidence tier
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize + 1, 0, 2 * Math.PI, false);
    ctx.strokeStyle = evidenceTierColors[node.evidenceTier as EvidenceTier] || '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw label below node
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(label, node.x, node.y + nodeSize + 3);

    // Draw domain icon
    if (node.primaryDomain) {
      ctx.font = `${fontSize * 0.8}px sans-serif`;
      ctx.fillText(
        domainIcons[node.primaryDomain as PowerDomainType] || '',
        node.x,
        node.y - nodeSize - fontSize
      );
    }
  }, [getNodeColor]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    setActiveLink(null);
    onNodeClick?.(node);

    // Center on clicked node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  }, [onNodeClick]);

  // Handle link click
  const handleLinkClick = useCallback((link: GraphLink) => {
    setActiveLink(prev => prev === link ? null : link);
    setSelectedNode(null);
  }, []);

  // Get entity names for a link
  const getLinkEntities = useCallback((link: GraphLink) => {
    const sourceNode = typeof link.source === 'string'
      ? processedData.nodes.find(n => n.id === link.source)
      : link.source;
    const targetNode = typeof link.target === 'string'
      ? processedData.nodes.find(n => n.id === link.target)
      : link.target;
    return {
      sourceName: sourceNode?.name || 'Unknown',
      targetName: targetNode?.name || 'Unknown'
    };
  }, [processedData.nodes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height }}>
      {/* The Graph Canvas */}
      <div className="lg:col-span-2 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-2xl relative">
        <ForceGraph2D
          ref={fgRef}
          graphData={processedData}
          nodeLabel={(node: any) => `${node.name}\n${node.type} | ${node.primaryDomain}`}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const nodeSize = Math.sqrt(node.val || 5) * 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link: any) => link.significance === 'critical' ? 3 : 1.5}
          linkDirectionalParticleSpeed={0.005}
          backgroundColor="#020617"
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onNodeHover={setHoveredNode as any}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={50}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 font-mono space-y-1">
          <p>Interactive Mode: <span className="text-cyan-400">ACTIVE</span></p>
          <p>Nodes: <span className="text-slate-400">{processedData.nodes.length}</span> | Links: <span className="text-slate-400">{processedData.links.length}</span></p>
          {hoveredNode && (
            <p className="text-slate-400">Hovering: <span className="text-white">{hoveredNode.name}</span></p>
          )}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
          <p className="font-mono text-slate-400 uppercase tracking-wider text-[10px] mb-2">Truth Tier Legend</p>
          {Object.entries(evidenceTierColors).map(([tier, color]) => (
            <div key={tier} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The Truth Terminal (Side Panel) */}
      <div className="h-full flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto">
          <h3 className="font-bold text-slate-200 mb-4 font-mono uppercase tracking-widest text-sm border-b border-slate-700 pb-2">
            Signal Analysis
          </h3>

          {activeLink ? (
            <SourceCard
              description={activeLink.description || 'Connection established in the network.'}
              confidence={activeLink.evidenceTier}
              citation={activeLink.evidenceLink || 'Database record'}
              domain={activeLink.domain}
              evidenceLink={activeLink.evidenceLink}
              significance={activeLink.significance}
              startDate={activeLink.startDate}
              endDate={activeLink.endDate}
              relationshipType={activeLink.relationshipType}
              {...getLinkEntities(activeLink)}
            />
          ) : selectedNode ? (
            <div className="space-y-4">
              {/* Ghost Protocol Banner */}
              {selectedNode.isObfuscated && (
                <div className="bg-slate-800/80 border border-dashed border-slate-600 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-2xl">👻</span>
                  <div>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Ghost Node</p>
                    <p className="text-xs text-slate-500">Protected identity - legal obfuscation active</p>
                  </div>
                </div>
              )}

              <div className={`rounded-lg p-4 ${selectedNode.isObfuscated ? 'bg-slate-800/30 border border-dashed border-slate-700' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full ${selectedNode.isObfuscated ? 'border-2 border-dashed border-slate-500 bg-transparent' : ''}`}
                    style={selectedNode.isObfuscated ? {} : { backgroundColor: entityTypeColors[selectedNode.type] }}
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">
                    {selectedNode.type}
                  </span>
                </div>
                <h4 className={`text-lg font-semibold mb-1 ${selectedNode.isObfuscated ? 'text-slate-400 italic' : 'text-white'}`}>
                  {selectedNode.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {domainIcons[selectedNode.primaryDomain]} {selectedNode.primaryDomain}
                </p>
              </div>

              {selectedNode.summary && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-slate-300">{selectedNode.summary}</p>
                </div>
              )}

              {selectedNode.scandalNotes && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Scandal Notes</p>
                  <p className="text-sm text-red-200">{selectedNode.scandalNotes}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                  {selectedNode.evidenceTier}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-2xl">🪼</span>
              </div>
              <p className="text-sm text-slate-500 italic">
                [Waiting for input]
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Click a connection line to inspect the evidence chain.
              </p>
              <p className="text-xs text-slate-600">
                Click a node to view entity details.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Network Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">People:</span>
              <span className="text-white ml-1">
                {processedData.nodes.filter(n => n.type === 'PERSON').length}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Organizations:</span>
              <span className="text-white ml-1">
                {processedData.nodes.filter(n => n.type === 'ORGANIZATION').length}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Confirmed:</span>
              <span className="text-emerald-400 ml-1">
                {processedData.links.filter(l => l.evidenceTier === 'CONFIRMED').length}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Alleged:</span>
              <span className="text-amber-400 ml-1">
                {processedData.links.filter(l => l.evidenceTier === 'ALLEGED').length}
              </span>
            </div>
            {/* Ghost Protocol Stats */}
            <div className="col-span-2 pt-2 border-t border-slate-700 mt-2">
              <span className="text-slate-500">👻 Obfuscated:</span>
              <span className="text-slate-400 ml-1">
                {processedData.nodes.filter(n => n.isObfuscated).length}
              </span>
              <span className="text-slate-600 ml-1 text-[10px]">(hidden actors)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkGraph;
