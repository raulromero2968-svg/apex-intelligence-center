'use client';

/**
 * Quantum Network Visualization Component
 *
 * Interactive Three.js-based quantum neural network visualization for TCG market analysis.
 * Displays cards as nodes with entanglement connections, pulse animations, and spiral layouts.
 *
 * Features:
 * - Real-time WebGL rendering with custom shaders
 * - Interactive controls (Morph/Freeze/Reset)
 * - OrbitControls for camera manipulation
 * - Responsive canvas sizing
 * - Mobile fallback to SVG
 *
 * Trade-offs:
 * + GOOD: Smooth 60fps animations; highly interactive; shareable screenshots
 * - BAD: GPU-intensive; requires WebGL support; larger bundle size
 */

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  QuantumNetworkViz as VizEngine,
  QuantumNode,
  EntanglementPair,
  QUANTUM_VIZ_CONSTANTS,
  QUANTUM_SHADERS,
} from '@/lib/viz/quantum-nn';

// ============================================================================
// TYPES
// ============================================================================

interface QuantumNetworkVizProps {
  cards: Array<{
    id: string;
    name: string;
    currentPrice?: number;
    setId?: string;
    priceChange?: number;
  }>;
  width?: number;
  height?: number;
  colorScheme?: 'quantum' | 'market' | 'neon' | 'holographic';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

interface NodeMeshProps {
  node: QuantumNode;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  time: number;
  morphAmount: number;
  onClick?: () => void;
}

interface ConnectionLineProps {
  nodeA: QuantumNode;
  nodeB: QuantumNode;
  entanglement: EntanglementPair;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  time: number;
}

// ============================================================================
// NODE COMPONENT
// ============================================================================

const QuantumNodeMesh: React.FC<NodeMeshProps> = ({
  node,
  colors,
  time,
  morphAmount,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Custom shader material
  const material = useMemo(() => {
    const quantumStateValue =
      node.quantumState === 'ground' ? 0 :
      node.quantumState === 'excited' ? 1 :
      node.quantumState === 'superposition' ? 2 : 3;

    return new THREE.ShaderMaterial({
      vertexShader: QUANTUM_SHADERS.nodeVertex,
      fragmentShader: QUANTUM_SHADERS.nodeFragment,
      uniforms: {
        time: { value: time },
        coherence: { value: node.coherence },
        morphAmount: { value: morphAmount },
        baseColor: { value: new THREE.Color(colors.node) },
        glowColor: { value: new THREE.Color(colors.primary) },
        quantumState: { value: quantumStateValue },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [node.coherence, node.quantumState, colors, time, morphAmount]);

  // Update uniforms on frame
  useFrame(() => {
    if (material.uniforms) {
      material.uniforms.time.value = time;
      material.uniforms.morphAmount.value = morphAmount;
    }
  });

  // Size based on price
  const size = useMemo(() => {
    const baseSize = 0.3;
    const priceScale = Math.min(node.price / 1000, 1) * 0.3;
    return baseSize + priceScale + (hovered ? 0.1 : 0);
  }, [node.price, hovered]);

  const position = node.position || [0, 0, 0];

  return (
    <group position={position as [number, number, number]}>
      <mesh
        ref={meshRef}
        material={material}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[size, 32, 32]} />
      </mesh>

      {/* Node label */}
      <Text
        position={[0, size + 0.2, 0]}
        fontSize={0.15}
        color={colors.primary}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {node.name.slice(0, 20)}
      </Text>

      {/* Price label */}
      <Text
        position={[0, -(size + 0.15), 0]}
        fontSize={0.1}
        color={colors.accent}
        anchorX="center"
        anchorY="top"
      >
        ${node.price.toFixed(2)}
      </Text>

      {/* Glow effect for excited/entangled nodes */}
      {(node.quantumState === 'excited' || node.quantumState === 'entangled') && (
        <pointLight
          color={colors.primary}
          intensity={node.coherence * 0.5}
          distance={2}
        />
      )}
    </group>
  );
};

// ============================================================================
// CONNECTION LINE COMPONENT
// ============================================================================

const EntanglementLine: React.FC<ConnectionLineProps> = ({
  nodeA,
  nodeB,
  entanglement,
  colors,
  time,
}) => {
  const posA = nodeA.position || [0, 0, 0];
  const posB = nodeB.position || [0, 0, 0];

  // Animated line with pulse
  const points = useMemo(() => [
    new THREE.Vector3(...(posA as [number, number, number])),
    new THREE.Vector3(...(posB as [number, number, number])),
  ], [posA, posB]);

  // Color based on correlation
  const lineColor = entanglement.correlation === 'positive' ? colors.connection : colors.secondary;

  // Pulse width based on strength
  const lineWidth = entanglement.strength * 2 + Math.sin(time * 2 + entanglement.pulsePhase) * 0.5;

  return (
    <Line
      points={points}
      color={lineColor}
      lineWidth={Math.max(1, lineWidth)}
      transparent
      opacity={entanglement.strength * 0.6 + Math.sin(time * 3) * 0.2}
      dashed={entanglement.correlation === 'negative'}
      dashSize={0.1}
      gapSize={0.05}
    />
  );
};

// ============================================================================
// SCENE COMPONENT
// ============================================================================

interface SceneProps {
  vizEngine: VizEngine;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  morphAmount: number;
  onNodeClick?: (nodeId: string) => void;
}

const QuantumScene: React.FC<SceneProps> = ({
  vizEngine,
  colors,
  morphAmount,
  onNodeClick,
}) => {
  const timeRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    vizEngine.update(delta);

    // Force re-render every few frames for smooth animation
    if (Math.floor(timeRef.current * 30) % 2 === 0) {
      forceUpdate(n => n + 1);
    }
  });

  const state = vizEngine.getState();

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} color={colors.background} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={0.5} color={colors.primary} />

      {/* Nodes */}
      {state.nodes.map((node) => (
        <QuantumNodeMesh
          key={node.id}
          node={node}
          colors={colors}
          time={timeRef.current}
          morphAmount={morphAmount}
          onClick={() => onNodeClick?.(node.id)}
        />
      ))}

      {/* Entanglement connections */}
      {state.entanglements.map((ent, idx) => {
        const nodeA = state.nodes.find(n => n.id === ent.nodeA);
        const nodeB = state.nodes.find(n => n.id === ent.nodeB);
        if (!nodeA || !nodeB) return null;

        return (
          <EntanglementLine
            key={`ent-${idx}`}
            nodeA={nodeA}
            nodeB={nodeB}
            entanglement={ent}
            colors={colors}
            time={timeRef.current}
          />
        );
      })}

      {/* Background particles */}
      <BackgroundParticles colors={colors} time={timeRef.current} />
    </>
  );
};

// ============================================================================
// BACKGROUND PARTICLES
// ============================================================================

interface ParticlesProps {
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
  time: number;
}

const BackgroundParticles: React.FC<ParticlesProps> = ({ colors, time }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.02;
      particlesRef.current.rotation.x = time * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={colors.accent}
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

// ============================================================================
// CONTROLS OVERLAY
// ============================================================================

interface ControlsOverlayProps {
  onMorph: () => void;
  onFreeze: () => void;
  onReset: () => void;
  isPaused: boolean;
  isMorphed: boolean;
  colors: typeof QUANTUM_VIZ_CONSTANTS.COLORS.quantum;
}

const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onMorph,
  onFreeze,
  onReset,
  isPaused,
  isMorphed,
  colors,
}) => {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-10">
      <button
        onClick={onMorph}
        className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
        style={{
          backgroundColor: isMorphed ? colors.primary : colors.secondary,
          color: '#000',
        }}
      >
        {isMorphed ? 'Morph' : 'Static'}
      </button>
      <button
        onClick={onFreeze}
        className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
        style={{
          backgroundColor: isPaused ? colors.accent : colors.secondary,
          color: '#000',
        }}
      >
        {isPaused ? 'Play' : 'Freeze'}
      </button>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
        style={{
          backgroundColor: colors.secondary,
          color: '#000',
        }}
      >
        Reset
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const QuantumNetworkVisualization: React.FC<QuantumNetworkVizProps> = ({
  cards,
  width = 800,
  height = 600,
  colorScheme = 'quantum',
  quality = 'high',
  onNodeClick,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [morphAmount, setMorphAmount] = useState(0.5);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setIsWebGLSupported(!!gl);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  // Initialize visualization engine
  const vizEngine = useMemo(() => {
    const engine = new VizEngine({
      width,
      height,
      quality,
      colorScheme,
    });
    engine.addNodesFromCards(cards);
    return engine;
  }, [cards, width, height, quality, colorScheme]);

  const colors = QUANTUM_VIZ_CONSTANTS.COLORS[colorScheme];

  // Control handlers
  const handleMorph = useCallback(() => {
    setMorphAmount(prev => prev > 0 ? 0 : 0.5);
  }, []);

  const handleFreeze = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    vizEngine.reset();
    setIsPaused(false);
    setMorphAmount(0.5);
  }, [vizEngine]);

  // Fallback to SVG for non-WebGL browsers
  if (!isWebGLSupported) {
    const { svgFallback } = vizEngine.generateStaticViz();
    return (
      <div
        className={`relative ${className}`}
        style={{ width, height, backgroundColor: colors.background }}
        dangerouslySetInnerHTML={{ __html: svgFallback || '' }}
      />
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, backgroundColor: colors.background }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[colors.background]} />

        <QuantumScene
          vizEngine={vizEngine}
          colors={colors}
          morphAmount={morphAmount}
          onNodeClick={onNodeClick}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>

      <ControlsOverlay
        onMorph={handleMorph}
        onFreeze={handleFreeze}
        onReset={handleReset}
        isPaused={isPaused}
        isMorphed={morphAmount > 0}
        colors={colors}
      />

      {/* Info overlay */}
      <div
        className="absolute bottom-4 left-4 text-sm font-mono"
        style={{ color: colors.primary }}
      >
        Nodes: {cards.length} | Quality: {quality}
      </div>
    </div>
  );
};

export default QuantumNetworkVisualization;
