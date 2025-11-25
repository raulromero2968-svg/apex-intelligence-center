/**
 * 3D World Scene Manager for Apex Intelligence
 *
 * Three.js-based scene management with:
 * - Scene configuration and loading
 * - Real-time WebSocket synchronization
 * - Procedural audio generation
 * - Performance optimization
 *
 * @see pack-webxr-001 for Three.js integration
 */

import { db } from '@/db';
import {
  worldScenes,
  heroControllers,
  worldSessions,
  proceduralAudioSettings,
  type WorldScene,
  type HeroController,
  type WorldSession,
} from '@/db/schema/world3d';
import { eq, and, desc, isNull } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

interface SceneConfig {
  camera: {
    position: [number, number, number];
    fov: number;
    near: number;
    far: number;
  };
  lighting: {
    ambient: { color: string; intensity: number };
    directional?: { color: string; intensity: number; position: [number, number, number] };
    points?: Array<{ color: string; intensity: number; position: [number, number, number] }>;
  };
  environment: {
    background: string;
    fog?: { color: string; near: number; far: number };
    skybox?: string;
  };
  physics?: {
    gravity: [number, number, number];
    friction: number;
  };
}

interface InteractiveElement {
  id: string;
  type: 'card_display' | 'portfolio_pedestal' | 'info_panel' | 'portal' | 'npc';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  metadata?: Record<string, any>;
}

// ============================================================================
// DEFAULT SCENES
// ============================================================================

const DEFAULT_GALLERY_CONFIG: SceneConfig = {
  camera: {
    position: [0, 2, 10],
    fov: 75,
    near: 0.1,
    far: 1000,
  },
  lighting: {
    ambient: { color: '#1a1a2e', intensity: 0.4 },
    directional: { color: '#ffffff', intensity: 1, position: [10, 20, 10] },
    points: [
      { color: '#00D4FF', intensity: 0.8, position: [-5, 3, 5] },
      { color: '#7B2FFF', intensity: 0.8, position: [5, 3, 5] },
    ],
  },
  environment: {
    background: '#0a0a1a',
    fog: { color: '#0a0a1a', near: 10, far: 50 },
  },
};

const DEFAULT_ARENA_CONFIG: SceneConfig = {
  camera: {
    position: [0, 5, 20],
    fov: 60,
    near: 0.1,
    far: 2000,
  },
  lighting: {
    ambient: { color: '#1a1a2e', intensity: 0.3 },
    directional: { color: '#ffffff', intensity: 1.2, position: [0, 30, 0] },
    points: [
      { color: '#FF6B00', intensity: 1, position: [0, 10, 0] },
      { color: '#00FF88', intensity: 0.6, position: [-15, 5, 15] },
      { color: '#FF0088', intensity: 0.6, position: [15, 5, 15] },
    ],
  },
  environment: {
    background: '#050510',
    fog: { color: '#050510', near: 20, far: 100 },
  },
};

// ============================================================================
// SCENE MANAGEMENT
// ============================================================================

/**
 * Create a new world scene
 */
export async function createScene(config: {
  name: string;
  slug: string;
  description?: string;
  sceneType: 'gallery' | 'arena' | 'collection_room' | 'trading_floor' | 'custom';
  creatorId?: string;
  customConfig?: SceneConfig;
}): Promise<WorldScene | null> {
  try {
    // Use default config based on type or custom
    let sceneConfig: SceneConfig;
    switch (config.sceneType) {
      case 'arena':
        sceneConfig = config.customConfig || DEFAULT_ARENA_CONFIG;
        break;
      default:
        sceneConfig = config.customConfig || DEFAULT_GALLERY_CONFIG;
    }

    const [scene] = await db.insert(worldScenes).values({
      name: config.name,
      slug: config.slug,
      description: config.description,
      sceneType: config.sceneType,
      config: sceneConfig,
      interactiveElements: [],
      creatorId: config.creatorId,
      isPublic: false,
    }).returning();

    return scene;
  } catch (error) {
    console.error('[SceneManager] createScene error:', error);
    return null;
  }
}

/**
 * Get scene by slug
 */
export async function getScene(slug: string): Promise<WorldScene | null> {
  try {
    const scene = await db.query.worldScenes.findFirst({
      where: eq(worldScenes.slug, slug),
    });
    return scene || null;
  } catch (error) {
    console.error('[SceneManager] getScene error:', error);
    return null;
  }
}

/**
 * Get default scene
 */
export async function getDefaultScene(): Promise<WorldScene | null> {
  try {
    const scene = await db.query.worldScenes.findFirst({
      where: eq(worldScenes.isDefault, true),
    });

    if (scene) return scene;

    // Create default scene if none exists
    return createScene({
      name: 'Apex Gallery',
      slug: 'apex-gallery',
      description: 'The main Apex Intelligence card gallery',
      sceneType: 'gallery',
    });
  } catch (error) {
    console.error('[SceneManager] getDefaultScene error:', error);
    return null;
  }
}

/**
 * Add interactive element to scene
 */
export async function addInteractiveElement(
  sceneId: string,
  element: InteractiveElement
): Promise<boolean> {
  try {
    const scene = await db.query.worldScenes.findFirst({
      where: eq(worldScenes.id, sceneId),
    });

    if (!scene) return false;

    const elements = (scene.interactiveElements as InteractiveElement[]) || [];
    elements.push(element);

    await db.update(worldScenes)
      .set({ interactiveElements: elements, updatedAt: new Date() })
      .where(eq(worldScenes.id, sceneId));

    return true;
  } catch (error) {
    console.error('[SceneManager] addInteractiveElement error:', error);
    return false;
  }
}

/**
 * Get public scenes
 */
export async function getPublicScenes(limit: number = 10): Promise<WorldScene[]> {
  try {
    const scenes = await db.query.worldScenes.findMany({
      where: eq(worldScenes.isPublic, true),
      orderBy: [desc(worldScenes.createdAt)],
      limit,
    });
    return scenes;
  } catch (error) {
    console.error('[SceneManager] getPublicScenes error:', error);
    return [];
  }
}

// ============================================================================
// HERO CONTROLLER MANAGEMENT
// ============================================================================

/**
 * Get or create hero controller for user
 */
export async function getOrCreateHero(userId: string): Promise<HeroController | null> {
  try {
    // Check for existing hero
    let hero = await db.query.heroControllers.findFirst({
      where: eq(heroControllers.userId, userId),
    });

    if (hero) return hero;

    // Create new hero
    const defaultScene = await getDefaultScene();

    [hero] = await db.insert(heroControllers).values({
      userId,
      heroName: 'Grok',
      avatarType: 'default',
      currentSceneId: defaultScene?.id,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    }).returning();

    return hero;
  } catch (error) {
    console.error('[SceneManager] getOrCreateHero error:', error);
    return null;
  }
}

/**
 * Update hero position and rotation
 */
export async function updateHeroTransform(
  heroId: string,
  transform: {
    position?: [number, number, number];
    rotation?: [number, number, number];
  }
): Promise<boolean> {
  try {
    await db.update(heroControllers)
      .set({
        ...(transform.position && { position: transform.position }),
        ...(transform.rotation && { rotation: transform.rotation }),
        updatedAt: new Date(),
      })
      .where(eq(heroControllers.id, heroId));

    return true;
  } catch (error) {
    console.error('[SceneManager] updateHeroTransform error:', error);
    return false;
  }
}

/**
 * Teleport hero to scene
 */
export async function teleportHeroToScene(
  heroId: string,
  sceneId: string,
  spawnPosition?: [number, number, number]
): Promise<boolean> {
  try {
    const scene = await db.query.worldScenes.findFirst({
      where: eq(worldScenes.id, sceneId),
    });

    if (!scene) return false;

    // Default spawn position from scene config
    const position = spawnPosition || (scene.config as SceneConfig).camera.position;

    await db.update(heroControllers)
      .set({
        currentSceneId: sceneId,
        position,
        rotation: [0, 0, 0],
        updatedAt: new Date(),
      })
      .where(eq(heroControllers.id, heroId));

    // Update stats
    const hero = await db.query.heroControllers.findFirst({
      where: eq(heroControllers.id, heroId),
    });

    if (hero) {
      const stats = hero.stats as any;
      stats.scenesVisited = (stats.scenesVisited || 0) + 1;
      await db.update(heroControllers)
        .set({ stats })
        .where(eq(heroControllers.id, heroId));
    }

    return true;
  } catch (error) {
    console.error('[SceneManager] teleportHeroToScene error:', error);
    return false;
  }
}

/**
 * Update hero appearance
 */
export async function updateHeroAppearance(
  heroId: string,
  appearance: {
    model?: string;
    texture?: string;
    colors?: { primary: string; secondary: string; accent: string };
    accessories?: string[];
  }
): Promise<boolean> {
  try {
    const hero = await db.query.heroControllers.findFirst({
      where: eq(heroControllers.id, heroId),
    });

    if (!hero) return false;

    const currentAppearance = hero.appearance as any;
    const newAppearance = { ...currentAppearance, ...appearance };

    await db.update(heroControllers)
      .set({ appearance: newAppearance, updatedAt: new Date() })
      .where(eq(heroControllers.id, heroId));

    return true;
  } catch (error) {
    console.error('[SceneManager] updateHeroAppearance error:', error);
    return false;
  }
}

// ============================================================================
// SESSION MANAGEMENT (WebSocket)
// ============================================================================

/**
 * Start a world session
 */
export async function startWorldSession(
  userId: string,
  socketId: string,
  deviceInfo?: Record<string, any>
): Promise<WorldSession | null> {
  try {
    const hero = await getOrCreateHero(userId);
    if (!hero) return null;

    // End any existing sessions for this user
    await db.update(worldSessions)
      .set({
        connectionStatus: 'disconnected',
        endedAt: new Date(),
      })
      .where(and(
        eq(worldSessions.userId, userId),
        isNull(worldSessions.endedAt)
      ));

    const [session] = await db.insert(worldSessions).values({
      userId,
      heroId: hero.id,
      sceneId: hero.currentSceneId,
      socketId,
      connectionStatus: 'connected',
      deviceInfo,
    }).returning();

    return session;
  } catch (error) {
    console.error('[SceneManager] startWorldSession error:', error);
    return null;
  }
}

/**
 * End a world session
 */
export async function endWorldSession(socketId: string): Promise<boolean> {
  try {
    const session = await db.query.worldSessions.findFirst({
      where: eq(worldSessions.socketId, socketId),
    });

    if (!session) return false;

    const duration = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );

    await db.update(worldSessions)
      .set({
        connectionStatus: 'disconnected',
        endedAt: new Date(),
        durationSeconds: duration,
      })
      .where(eq(worldSessions.id, session.id));

    // Update hero play time
    if (session.heroId) {
      const hero = await db.query.heroControllers.findFirst({
        where: eq(heroControllers.id, session.heroId),
      });

      if (hero) {
        const stats = hero.stats as any;
        stats.totalPlayTime = (stats.totalPlayTime || 0) + duration;
        await db.update(heroControllers)
          .set({ stats })
          .where(eq(heroControllers.id, session.heroId));
      }
    }

    return true;
  } catch (error) {
    console.error('[SceneManager] endWorldSession error:', error);
    return false;
  }
}

/**
 * Update session ping
 */
export async function pingSession(socketId: string): Promise<boolean> {
  try {
    await db.update(worldSessions)
      .set({ lastPingAt: new Date() })
      .where(eq(worldSessions.socketId, socketId));

    return true;
  } catch (error) {
    console.error('[SceneManager] pingSession error:', error);
    return false;
  }
}

/**
 * Get active sessions in scene
 */
export async function getActiveSessionsInScene(sceneId: string): Promise<WorldSession[]> {
  try {
    const sessions = await db.query.worldSessions.findMany({
      where: and(
        eq(worldSessions.sceneId, sceneId),
        eq(worldSessions.connectionStatus, 'connected'),
        isNull(worldSessions.endedAt)
      ),
    });

    return sessions;
  } catch (error) {
    console.error('[SceneManager] getActiveSessionsInScene error:', error);
    return [];
  }
}

// ============================================================================
// PROCEDURAL AUDIO
// ============================================================================

/**
 * Get or create audio settings for user
 */
export async function getAudioSettings(userId: string): Promise<{
  enabled: boolean;
  masterVolume: number;
  generatorConfig: any;
} | null> {
  try {
    let settings = await db.query.proceduralAudioSettings.findFirst({
      where: eq(proceduralAudioSettings.userId, userId),
    });

    if (!settings) {
      [settings] = await db.insert(proceduralAudioSettings).values({
        userId,
        enabled: true,
        masterVolume: 0.7,
      }).returning();
    }

    return {
      enabled: settings.enabled,
      masterVolume: settings.masterVolume,
      generatorConfig: settings.generatorConfig,
    };
  } catch (error) {
    console.error('[SceneManager] getAudioSettings error:', error);
    return null;
  }
}

/**
 * Update audio settings
 */
export async function updateAudioSettings(
  userId: string,
  settings: {
    enabled?: boolean;
    masterVolume?: number;
    generatorConfig?: any;
  }
): Promise<boolean> {
  try {
    await db.update(proceduralAudioSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(proceduralAudioSettings.userId, userId));

    return true;
  } catch (error) {
    console.error('[SceneManager] updateAudioSettings error:', error);
    return false;
  }
}
