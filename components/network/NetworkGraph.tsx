'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * NetworkGraph - 2D Force-Directed Graph for Power Network Visualization
 *
 * The "Architecture of Power" visualization engine.
 * Maps entities (People, Organizations, Solutions) and their relationships.
 *
 * Color Coding:
 * - Red: Tier 1 Elites / Scandal-linked persons
 * - Purple: Systemic forces (Organizations, Concepts)
 * - Green: Solutions (The Luminous Injection)
 * - Gray: Obfuscated entities (Dark Matter)
 * - Blue: Events and Locations
 */

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  evidenceTier?: string;
  isObfuscated?: boolean;
  scandalNotes?: string;
  primaryDomain?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relationshipType?: string;
  domain?: string;
  evidenceTier?: string;
  description?: string;
  significance?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NetworkGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

// Color mapping for entity types
const getNodeColor = (node: GraphNode): string => {
  if (node.isObfuscated) return '#6b7280'; // Gray for obfuscated

  switch (node.type) {
    case 'SOLUTION':
      return '#22c55e'; // Green - The Luminous Injection
    case 'PERSON':
      // Check if scandal-linked
      if (node.scandalNotes && node.scandalNotes.length > 0) {
        return '#ef4444'; // Red for scandal-linked
      }
      return '#f97316'; // Orange for other persons
    case 'ORGANIZATION':
      // Check if it's a solution-oriented org
      if (node.scandalNotes?.includes('SOLUTION')) {
        return '#22c55e'; // Green
      }
      return '#a855f7'; // Purple for organizations
    case 'CONCEPT':
      return '#8b5cf6'; // Violet for concepts
    case 'EVENT':
      return '#3b82f6'; // Blue for events
    case 'LOCATION':
      return '#06b6d4'; // Cyan for locations
    default:
      return '#9ca3af'; // Default gray
  }
};

// Edge color based on evidence tier
const getEdgeColor = (link: GraphLink): string => {
  switch (link.evidenceTier) {
    case 'CONFIRMED':
      return 'rgba(239, 68, 68, 0.8)'; // Red - solid evidence
    case 'DOCUMENTED':
      return 'rgba(249, 115, 22, 0.6)'; // Orange
    case 'ALLEGED':
      return 'rgba(234, 179, 8, 0.5)'; // Yellow
    case 'SPECULATIVE':
      return 'rgba(156, 163, 175, 0.4)'; // Gray
    default:
      return 'rgba(156, 163, 175, 0.5)';
  }
};

// Edge width based on significance
const getEdgeWidth = (link: GraphLink): number => {
  switch (link.significance) {
    case 'critical':
      return 3;
    case 'high':
      return 2;
    case 'medium':
      return 1.5;
    case 'low':
      return 1;
    default:
      return 1;
  }
};

export function NetworkGraph({
  data,
  width = 900,
  height = 600,
  onNodeClick,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const animationRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<GraphNode | null>(null);

  // Initialize node positions
  useEffect(() => {
    const initializedNodes = data.nodes.map((node, i) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 300,
      y: height / 2 + (Math.random() - 0.5) * 300,
      vx: 0,
      vy: 0,
    }));
    setNodes(initializedNodes);
  }, [data.nodes, width, height]);

  // Force simulation
  const simulate = useCallback(() => {
    if (nodes.length === 0) return;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const newNodes = nodes.map((node) => ({ ...node }));

    // Apply forces
    for (let i = 0; i < newNodes.length; i++) {
      const node = newNodes[i];
      if (dragNodeRef.current?.id === node.id && isDraggingRef.current) continue;

      // Repulsion between nodes
      for (let j = i + 1; j < newNodes.length; j++) {
        const other = newNodes[j];
        const dx = node.x! - other.x!;
        const dy = node.y! - other.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 1000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        node.vx! += fx;
        node.vy! += fy;
        other.vx! -= fx;
        other.vy! -= fy;
      }

      // Center gravity
      const cx = width / 2 - node.x!;
      const cy = height / 2 - node.y!;
      node.vx! += cx * 0.001;
      node.vy! += cy * 0.001;
    }

    // Link forces (attraction)
    for (const link of data.links) {
      const source = newNodes.find((n) => n.id === link.source);
      const target = newNodes.find((n) => n.id === link.target);
      if (!source || !target) continue;

      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 100) * 0.01;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!(dragNodeRef.current?.id === source.id && isDraggingRef.current)) {
        source.vx! += fx;
        source.vy! += fy;
      }
      if (!(dragNodeRef.current?.id === target.id && isDraggingRef.current)) {
        target.vx! -= fx;
        target.vy! -= fy;
      }
    }

    // Update positions with damping
    for (const node of newNodes) {
      if (dragNodeRef.current?.id === node.id && isDraggingRef.current) continue;

      node.vx! *= 0.9;
      node.vy! *= 0.9;
      node.x! += node.vx!;
      node.y! += node.vy!;

      // Boundary constraints
      node.x = Math.max(30, Math.min(width - 30, node.x!));
      node.y = Math.max(30, Math.min(height - 30, node.y!));
    }

    setNodes(newNodes);
  }, [nodes, data.links, width, height]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulate();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [simulate]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 1)'; // Dark background
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw edges
    for (const link of data.links) {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.strokeStyle = getEdgeColor(link);
      ctx.lineWidth = getEdgeWidth(link);

      // Dashed line for speculative evidence
      if (link.evidenceTier === 'SPECULATIVE' || link.evidenceTier === 'ALLEGED') {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw nodes
    for (const node of nodes) {
      const radius = node.type === 'SOLUTION' ? 18 : 14;
      const color = getNodeColor(node);

      // Glow effect for selected/hovered
      if (node === hoveredNode || node === selectedNode) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius + 8, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          node.x!,
          node.y!,
          radius,
          node.x!,
          node.y!,
          radius + 12
        );
        gradient.addColorStop(0, `${color}66`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);

      // Dashed border for obfuscated nodes
      if (node.isObfuscated) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `${color}aa`; // Semi-transparent
      } else {
        ctx.fillStyle = color;
      }
      ctx.fill();

      // Node border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const displayName =
        node.name.length > 18 ? node.name.slice(0, 16) + '...' : node.name;
      ctx.fillText(displayName, node.x!, node.y! + radius + 4);
    }

    // Draw tooltip for hovered node
    if (hoveredNode) {
      const tooltipX = hoveredNode.x! + 20;
      const tooltipY = hoveredNode.y! - 20;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 1;

      const tooltipWidth = 200;
      const tooltipHeight = 80;

      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredNode.name, tooltipX + 10, tooltipY + 16);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`Type: ${hoveredNode.type}`, tooltipX + 10, tooltipY + 34);
      ctx.fillText(
        `Evidence: ${hoveredNode.evidenceTier || 'Unknown'}`,
        tooltipX + 10,
        tooltipY + 48
      );
      if (hoveredNode.primaryDomain) {
        ctx.fillText(
          `Domain: ${hoveredNode.primaryDomain}`,
          tooltipX + 10,
          tooltipY + 62
        );
      }
    }
  }, [nodes, data.links, hoveredNode, selectedNode, width, height]);

  // Mouse interaction handlers
  const getNodeAtPosition = useCallback(
    (x: number, y: number): GraphNode | null => {
      for (const node of nodes) {
        const dx = node.x! - x;
        const dy = node.y! - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 18) return node;
      }
      return null;
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDraggingRef.current && dragNodeRef.current) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragNodeRef.current?.id
              ? { ...n, x, y, vx: 0, vy: 0 }
              : n
          )
        );
        return;
      }

      const node = getNodeAtPosition(x, y);
      setHoveredNode(node);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'default';
      }
    },
    [getNodeAtPosition]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const node = getNodeAtPosition(x, y);
      if (node) {
        isDraggingRef.current = true;
        dragNodeRef.current = node;
      }
    },
    [getNodeAtPosition]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragNodeRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const node = getNodeAtPosition(x, y);
      setSelectedNode(node);
      if (node && onNodeClick) {
        onNodeClick(node);
      }
    },
    [getNodeAtPosition, onNodeClick]
  );

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="block"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700 text-xs">
        <div className="font-semibold text-slate-300 mb-2">Entity Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-green-400">Solution</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-red-400">Scandal-linked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-purple-400">Organization</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span>
            <span className="text-violet-400">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full bg-gray-500"
              style={{ border: '2px dashed #f59e0b' }}
            ></span>
            <span className="text-gray-400">Obfuscated</span>
          </div>
        </div>
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-sm p-4 rounded-lg border border-slate-700 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-200">{selectedNode.name}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="text-xs space-y-1 text-slate-400">
            <p>
              <span className="text-slate-500">Type:</span> {selectedNode.type}
            </p>
            <p>
              <span className="text-slate-500">Evidence:</span>{' '}
              {selectedNode.evidenceTier}
            </p>
            {selectedNode.primaryDomain && (
              <p>
                <span className="text-slate-500">Domain:</span>{' '}
                {selectedNode.primaryDomain}
              </p>
            )}
            {selectedNode.scandalNotes && (
              <p className="mt-2 text-slate-300 border-t border-slate-700 pt-2">
                {selectedNode.scandalNotes.slice(0, 150)}
                {selectedNode.scandalNotes.length > 150 && '...'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkGraph;
