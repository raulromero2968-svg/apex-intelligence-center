/**
 * Quantum Visualization Components
 *
 * Interactive AI-powered visualizations for TCG market analysis.
 * Includes Three.js-based 3D networks and lightweight SVG previews.
 */

export { QuantumNetworkVisualization } from './QuantumNetworkViz';
export { QuantumVizPreview } from './QuantumVizPreview';

// Re-export types and utilities from lib
export type {
  QuantumNode,
  VizConfig,
  VizRenderResult,
  EntanglementPair,
  SpiralConfig,
} from '@/lib/viz/quantum-nn';

export {
  QuantumNetworkViz,
  createQuantumVizFromCards,
  generateQuantumViz,
  generateSpiralViz,
  QUANTUM_VIZ_CONSTANTS,
  QUANTUM_SHADERS,
} from '@/lib/viz/quantum-nn';
