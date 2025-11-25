/**
 * 3D World Module
 *
 * Immersive 3D TCG world for hero exploration and battles.
 * Hybrid architecture: Three.js core + Omniverse for pro sims.
 *
 * Features:
 * - Scene management with LOD and frustum culling
 * - Hero controller for player navigation
 * - World zones (market, arena, wilderness, city, quantum)
 * - Card spawning and interaction
 * - Weather and event systems
 *
 * @see WebXR module for VR/AR integration
 * @see visionOS module for spatial computing
 */

// Scene Manager
export {
  // Types
  type QualitySetting,
  type WorldObjectType,
  type WorldObject,
  type SceneConfig,
  type LightingConfig,
  type Zone,
  type ZoneType,

  // Constants
  DEFAULT_SCENE_CONFIG,
  QUALITY_SETTINGS,
  ZONE_CONFIGS,

  // Class
  SceneManager,
} from './scene-manager';

// Hero Controller
export {
  // Types
  type MovementState,
  type HeroClass,
  type HeroStats,
  type HeroConfig,
  type InventoryItem,
  type InteractionResult,

  // Constants
  DEFAULT_HERO_STATS,
  HERO_CLASSES,
  INTERACTION_RANGES,

  // Class
  HeroController,
} from './hero-controller';

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Initialize complete 3D world with scene and hero
 */
export function initializeWorld(config?: {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  heroClass?: 'warrior' | 'mage' | 'rogue' | 'engineer';
  startZone?: 'market' | 'arena' | 'wilderness' | 'city' | 'quantum';
}): {
  scene: SceneManager;
  hero: HeroController;
  zones: Zone[];
} {
  const { SceneManager } = require('./scene-manager');
  const { HeroController, HERO_CLASSES } = require('./hero-controller');

  const sceneConfig = {
    quality: config?.quality || 'medium',
    enableShadows: config?.quality !== 'low',
    enablePostProcessing: config?.quality === 'high' || config?.quality === 'ultra',
    maxDrawDistance: config?.quality === 'ultra' ? 2000 : config?.quality === 'high' ? 1000 : 500,
    targetFPS: 60,
    enablePhysics: true,
    physicsEngine: 'cannon' as const,
    omniverseEnabled: config?.quality === 'ultra',
  };

  const scene = new SceneManager(sceneConfig);

  const heroClassConfig = HERO_CLASSES[config?.heroClass || 'warrior'];
  const hero = new HeroController({
    id: `hero-${Date.now()}`,
    name: 'Player',
    class: config?.heroClass || 'warrior',
    stats: heroClassConfig,
    position: getZoneSpawnPoint(config?.startZone || 'market'),
    rotation: [0, 0, 0],
  });

  // Load initial zone
  const zones = loadZoneObjects(scene, config?.startZone || 'market');

  return { scene, hero, zones };
}

/**
 * Get spawn point for zone
 */
function getZoneSpawnPoint(zone: string): [number, number, number] {
  const spawnPoints: Record<string, [number, number, number]> = {
    market: [0, 0, 0],
    arena: [100, 0, 100],
    wilderness: [-50, 0, 200],
    city: [200, 0, 0],
    quantum: [0, 50, -100],
  };
  return spawnPoints[zone] || [0, 0, 0];
}

/**
 * Load zone objects into scene
 */
function loadZoneObjects(scene: SceneManager, zoneName: string): Zone[] {
  const { ZONE_CONFIGS } = require('./scene-manager');

  const zoneConfig = ZONE_CONFIGS[zoneName];
  if (!zoneConfig) return [];

  // Create zone boundary object
  scene.addObject({
    id: `zone-${zoneName}`,
    type: 'zone',
    position: zoneConfig.position,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    meshId: `mesh-zone-${zoneName}`,
    lodLevel: 0,
    metadata: {
      zoneName,
      ...zoneConfig,
    },
  });

  return [
    {
      id: zoneName,
      name: zoneName.charAt(0).toUpperCase() + zoneName.slice(1),
      type: zoneName as ZoneType,
      position: zoneConfig.position,
      radius: 100,
      ambientMood: zoneConfig.mood,
      weatherAllowed: ['clear', 'cloudy', 'rain'],
      maxEntities: 50,
    },
  ];
}

/**
 * Frame update for world simulation
 */
export function updateWorld(
  scene: SceneManager,
  hero: HeroController,
  deltaTime: number,
  input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    sprint?: boolean;
    jump?: boolean;
    interact?: boolean;
    interactTarget?: string;
  }
): {
  heroState: ReturnType<HeroController['getState']>;
  nearbyObjects: WorldObject[];
  currentZone: string | null;
} {
  // Update hero movement
  hero.setMovementState({
    forward: input.forward || false,
    backward: input.backward || false,
    left: input.left || false,
    right: input.right || false,
    sprint: input.sprint || false,
    jumping: input.jump || false,
  });

  hero.update(deltaTime);

  const heroState = hero.getState();

  // Get nearby objects for interaction
  const nearbyObjects = scene.getObjectsInRadius(heroState.position, 10);

  // Handle interaction
  if (input.interact && input.interactTarget) {
    const target = nearbyObjects.find((obj) => obj.id === input.interactTarget);
    if (target) {
      hero.interact(target.id, target.position);
    }
  }

  // Determine current zone
  const zones = scene.getObjectsInRadius(heroState.position, 200).filter((obj) => obj.type === 'zone');
  const currentZone = zones.length > 0 ? (zones[0].metadata?.zoneName as string) : null;

  return {
    heroState,
    nearbyObjects,
    currentZone,
  };
}

import type { Zone, ZoneType, WorldObject } from './scene-manager';
import type { HeroController } from './hero-controller';
import type { SceneManager } from './scene-manager';
