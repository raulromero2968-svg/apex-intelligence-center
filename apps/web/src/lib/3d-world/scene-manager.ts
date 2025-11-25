/**
 * 3D World Scene Manager
 *
 * Core Three.js scene management for the Grok Hero world.
 * Handles rendering, camera, lighting, and object management.
 *
 * Features:
 * - Scene graph management
 * - LOD (Level of Detail) optimization
 * - Frustum culling
 * - Real-time lighting
 * - Post-processing effects
 */

// ============================================================================
// TYPES
// ============================================================================

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface SceneConfig {
  quality: RenderQuality;
  enableShadows: boolean;
  enablePostProcessing: boolean;
  enableVR: boolean;
  targetFPS: number;
  maxDrawCalls: number;
}

export interface WorldObject {
  id: string;
  type: 'card' | 'hero' | 'npc' | 'environment' | 'effect';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  mesh?: unknown; // THREE.Object3D
  data?: Record<string, unknown>;
  visible: boolean;
  interactable: boolean;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambient: { color: string; intensity: number };
  directional: { color: string; intensity: number; position: [number, number, number] };
  hemispheric?: { skyColor: string; groundColor: string; intensity: number };
}

export interface SceneStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  memory: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_CONFIG: SceneConfig = {
  quality: 'high',
  enableShadows: true,
  enablePostProcessing: true,
  enableVR: false,
  targetFPS: 60,
  maxDrawCalls: 1000,
};

export const QUALITY_SETTINGS: Record<RenderQuality, {
  shadowMapSize: number;
  antialias: boolean;
  pixelRatio: number;
  lodBias: number;
}> = {
  low: { shadowMapSize: 512, antialias: false, pixelRatio: 0.75, lodBias: 2.0 },
  medium: { shadowMapSize: 1024, antialias: true, pixelRatio: 1.0, lodBias: 1.0 },
  high: { shadowMapSize: 2048, antialias: true, pixelRatio: 1.0, lodBias: 0.5 },
  ultra: { shadowMapSize: 4096, antialias: true, pixelRatio: window.devicePixelRatio || 1, lodBias: 0.0 },
};

export const DEFAULT_LIGHTING: LightingConfig = {
  ambient: { color: '#404060', intensity: 0.4 },
  directional: { color: '#ffffff', intensity: 0.8, position: [50, 100, 50] },
  hemispheric: { skyColor: '#87ceeb', groundColor: '#362d26', intensity: 0.3 },
};

export const ZONE_SKYBOXES: Record<string, string> = {
  market: '/skyboxes/city-sunset',
  arena: '/skyboxes/colosseum',
  wilderness: '/skyboxes/forest',
  city: '/skyboxes/metropolis',
  quantum: '/skyboxes/nebula',
};

// ============================================================================
// SCENE MANAGER CLASS
// ============================================================================

export class SceneManager {
  private config: SceneConfig;
  private objects: Map<string, WorldObject>;
  private stats: SceneStats;
  private isInitialized: boolean;
  private animationId: number | null;
  private lastFrameTime: number;
  private frameCount: number;

  constructor(config: Partial<SceneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.objects = new Map();
    this.stats = {
      fps: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      geometries: 0,
      memory: 0,
    };
    this.isInitialized = false;
    this.animationId = null;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
  }

  /**
   * Initialize the scene (mock - actual Three.js init in component)
   */
  initialize(): { success: boolean; message: string } {
    if (this.isInitialized) {
      return { success: false, message: 'Scene already initialized' };
    }

    this.isInitialized = true;
    return { success: true, message: 'Scene initialized successfully' };
  }

  /**
   * Add object to scene
   */
  addObject(obj: WorldObject): boolean {
    if (this.objects.has(obj.id)) {
      return false;
    }
    this.objects.set(obj.id, obj);
    return true;
  }

  /**
   * Remove object from scene
   */
  removeObject(id: string): boolean {
    return this.objects.delete(id);
  }

  /**
   * Update object transform
   */
  updateObject(
    id: string,
    updates: Partial<Pick<WorldObject, 'position' | 'rotation' | 'scale' | 'visible'>>
  ): boolean {
    const obj = this.objects.get(id);
    if (!obj) return false;

    if (updates.position) obj.position = updates.position;
    if (updates.rotation) obj.rotation = updates.rotation;
    if (updates.scale !== undefined) obj.scale = updates.scale;
    if (updates.visible !== undefined) obj.visible = updates.visible;

    return true;
  }

  /**
   * Get object by ID
   */
  getObject(id: string): WorldObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get all objects of type
   */
  getObjectsByType(type: WorldObject['type']): WorldObject[] {
    return Array.from(this.objects.values()).filter((obj) => obj.type === type);
  }

  /**
   * Get objects in radius from point
   */
  getObjectsInRadius(center: [number, number, number], radius: number): WorldObject[] {
    return Array.from(this.objects.values()).filter((obj) => {
      const dx = obj.position[0] - center[0];
      const dy = obj.position[1] - center[1];
      const dz = obj.position[2] - center[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  }

  /**
   * Update scene stats
   */
  updateStats(): void {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFrameTime >= 1000) {
      this.stats.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Get current stats
   */
  getStats(): SceneStats {
    return { ...this.stats };
  }

  /**
   * Set render quality
   */
  setQuality(quality: RenderQuality): void {
    this.config.quality = quality;
  }

  /**
   * Check if point is in frustum (simplified)
   */
  isInFrustum(position: [number, number, number], camera: CameraState): boolean {
    const dx = position[0] - camera.position[0];
    const dy = position[1] - camera.position[1];
    const dz = position[2] - camera.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance >= camera.near && distance <= camera.far;
  }

  /**
   * Calculate LOD level for distance
   */
  calculateLOD(distance: number): number {
    const settings = QUALITY_SETTINGS[this.config.quality];
    const baseLOD = Math.floor(Math.log2(Math.max(1, distance / 10)));
    return Math.min(3, Math.max(0, baseLOD + settings.lodBias));
  }

  /**
   * Serialize scene state
   */
  serialize(): {
    config: SceneConfig;
    objects: WorldObject[];
    stats: SceneStats;
  } {
    return {
      config: this.config,
      objects: Array.from(this.objects.values()),
      stats: this.stats,
    };
  }

  /**
   * Deserialize scene state
   */
  deserialize(data: { objects: WorldObject[] }): void {
    this.objects.clear();
    for (const obj of data.objects) {
      this.objects.set(obj.id, obj);
    }
  }

  /**
   * Dispose scene resources
   */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.objects.clear();
    this.isInitialized = false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create world object
 */
export function createWorldObject(
  id: string,
  type: WorldObject['type'],
  position: [number, number, number],
  options: Partial<Omit<WorldObject, 'id' | 'type' | 'position'>> = {}
): WorldObject {
  return {
    id,
    type,
    position,
    rotation: options.rotation || [0, 0, 0],
    scale: options.scale ?? 1,
    visible: options.visible ?? true,
    interactable: options.interactable ?? true,
    data: options.data,
  };
}

/**
 * Calculate distance between two points
 */
export function distance3D(a: [number, number, number], b: [number, number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Linear interpolation for positions
 */
export function lerp3D(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Get zone type from position (simplified)
 */
export function getZoneTypeFromPosition(position: [number, number, number]): string {
  const [x, _, z] = position;
  const distFromCenter = Math.sqrt(x * x + z * z);

  if (distFromCenter < 20) return 'market';
  if (distFromCenter < 50) return 'city';
  if (distFromCenter < 100) return 'wilderness';
  return 'arena';
}
