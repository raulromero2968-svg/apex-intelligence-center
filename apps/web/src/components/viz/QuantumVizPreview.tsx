'use client';

/**
 * Quantum Visualization Preview Component
 *
 * Lightweight preview component for quantum network visualizations.
 * Uses CSS animations and SVG for fast loading without Three.js overhead.
 * Suitable for dashboard cards, social media previews, and mobile devices.
 *
 * Features:
 * - Pure SVG rendering (no WebGL required)
 * - CSS-based pulse animations
 * - Click to expand to full visualization
 * - Responsive sizing
 * - Low CPU/GPU usage
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUANTUM_VIZ_CONSTANTS } from '@/lib/viz/quantum-nn';

// ============================================================================
// TYPES
// ============================================================================

interface QuantumVizPreviewProps {
  cards: Array<{
    id: string;
    name: string;
    currentPrice?: number;
    priceChange?: number;
  }>;
  title?: string;
  colorScheme?: 'quantum' | 'market' | 'neon' | 'holographic';
  width?: number;
  height?: number;
  onExpand?: () => void;
  className?: string;
  animated?: boolean;
}

interface NodeData {
  id: string;
  name: string;
  price: number;
  change: number;
  x: number;
  y: number;
  size: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateNodePositions(
  cards: QuantumVizPreviewProps['cards'],
  width: number,
  height: number
): NodeData[] {
  const PHI = QUANTUM_VIZ_CONSTANTS.PHI;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return cards.map((card, index) => {
    const theta = index * goldenAngle;
    const r = Math.sqrt(index + 1) * (Math.min(width, height) / 8);

    return {
      id: card.id,
      name: card.name,
      price: card.currentPrice || 0,
      change: card.priceChange || 0,
      x: width / 2 + Math.cos(theta) * r,
      y: height / 2 + Math.sin(theta) * r,
      size: 8 + Math.min((card.currentPrice || 0) / 500, 12),
    };
  });
}

function createConnections(nodes: NodeData[], maxConnections: number = 20) {
  const connections: Array<{ from: NodeData; to: NodeData; strength: number }> = [];

  // Connect nearby nodes
  for (let i = 0; i < nodes.length && connections.length < maxConnections; i++) {
    for (let j = i + 1; j < Math.min(i + 4, nodes.length); j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        connections.push({
          from: nodes[i],
          to: nodes[j],
          strength: 1 - dist / 150,
        });
      }
    }
  }

  return connections;
}

// ============================================================================
// ANIMATED NODE COMPONENT
// ============================================================================

interface AnimatedNodeProps {
  node: NodeData;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  animated: boolean;
  onClick?: () => void;
}

const AnimatedNode: React.FC<AnimatedNodeProps> = ({
  node,
  colors,
  animated,
  onClick,
}) => {
  const isPositive = node.change >= 0;

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: Math.random() * 0.5, duration: 0.5 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Glow effect */}
      {animated && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={node.size + 6}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
          opacity={0.3}
          animate={{
            r: [node.size + 6, node.size + 12, node.size + 6],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main node */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={node.size}
        fill={colors.node}
        stroke={isPositive ? colors.primary : colors.secondary}
        strokeWidth={2}
        whileHover={{ scale: 1.2 }}
        animate={animated ? {
          scale: [1, 1.05, 1],
        } : undefined}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Price indicator */}
      <text
        x={node.x}
        y={node.y + node.size + 14}
        textAnchor="middle"
        fontSize={9}
        fill={colors.accent}
        fontFamily="monospace"
      >
        ${node.price.toFixed(0)}
      </text>
    </motion.g>
  );
};

// ============================================================================
// ANIMATED CONNECTION COMPONENT
// ============================================================================

interface AnimatedConnectionProps {
  from: NodeData;
  to: NodeData;
  strength: number;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  animated: boolean;
}

const AnimatedConnection: React.FC<AnimatedConnectionProps> = ({
  from,
  to,
  strength,
  colors,
  animated,
}) => {
  return (
    <motion.line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={colors.connection}
      strokeWidth={strength * 2}
      opacity={strength * 0.5}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: strength * 0.5 }}
      transition={{ duration: 0.8, delay: Math.random() * 0.3 }}
      strokeDasharray={animated ? '4 2' : '0'}
    >
      {animated && (
        <animate
          attributeName="stroke-dashoffset"
          values="0;20"
          dur="1s"
          repeatCount="indefinite"
        />
      )}
    </motion.line>
  );
};

// ============================================================================
// MAIN PREVIEW COMPONENT
// ============================================================================

export const QuantumVizPreview: React.FC<QuantumVizPreviewProps> = ({
  cards,
  title = 'Quantum Network',
  colorScheme = 'quantum',
  width = 400,
  height = 300,
  onExpand,
  className = '',
  animated = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = QUANTUM_VIZ_CONSTANTS.COLORS[colorScheme];

  // Calculate node positions and connections
  const nodes = useMemo(
    () => calculateNodePositions(cards, width, height),
    [cards, width, height]
  );

  const connections = useMemo(
    () => createConnections(nodes),
    [nodes]
  );

  // Summary stats
  const totalValue = cards.reduce((sum, c) => sum + (c.currentPrice || 0), 0);
  const avgChange = cards.reduce((sum, c) => sum + (c.priceChange || 0), 0) / cards.length;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        width,
        height,
        backgroundColor: colors.background,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: onExpand ? 1.02 : 1 }}
    >
      {/* SVG Visualization */}
      <svg width={width} height={height} className="absolute inset-0">
        {/* Background gradient */}
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#bgGradient)" />

        {/* Connection lines */}
        <g filter="url(#glow)">
          {connections.map((conn, idx) => (
            <AnimatedConnection
              key={`conn-${idx}`}
              from={conn.from}
              to={conn.to}
              strength={conn.strength}
              colors={colors}
              animated={animated && isHovered}
            />
          ))}
        </g>

        {/* Nodes */}
        <g filter="url(#glow)">
          {nodes.map((node) => (
            <AnimatedNode
              key={node.id}
              node={node}
              colors={colors}
              animated={animated && isHovered}
            />
          ))}
        </g>
      </svg>

      {/* Title overlay */}
      <div
        className="absolute top-3 left-3 right-3 flex items-center justify-between"
      >
        <h3
          className="text-sm font-bold tracking-wide"
          style={{ color: colors.primary }}
        >
          {title}
        </h3>
        <span
          className="text-xs font-sans"
          style={{ color: colors.accent }}
        >
          {cards.length} nodes
        </span>
      </div>

      {/* Stats overlay */}
      <div
        className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-sans"
        style={{ color: colors.primary }}
      >
        <span>Total: ${totalValue.toFixed(0)}</span>
        <span style={{ color: avgChange >= 0 ? colors.primary : colors.secondary }}>
          {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
        </span>
      </div>

      {/* Expand button */}
      <AnimatePresence>
        {onExpand && isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       px-4 py-2 rounded-lg font-semibold text-sm
                       backdrop-blur-sm transition-colors"
            style={{
              backgroundColor: `${colors.primary}CC`,
              color: colors.background,
            }}
            onClick={onExpand}
          >
            Expand View
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scanning line effect */}
      {animated && isHovered && (
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ backgroundColor: colors.primary }}
          initial={{ top: 0, opacity: 0.5 }}
          animate={{
            top: [0, height],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </motion.div>
  );
};

export default QuantumVizPreview;
