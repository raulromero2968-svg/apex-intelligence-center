/**
 * WebXR Scene Builder
 *
 * Implements pack-webxr-001 §3.2 (3D Scene Builder).
 * Manages 3D scenes, objects, and interactions for WebXR.
 *
 * Features:
 * - Scene CRUD operations
 * - Object management with transforms
 * - Interaction binding
 * - Asset integration
 *
 * @see pack-webxr-001 for architecture details
 */

import { db } from '@/lib/db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import {
  xrScenes,
  xrSceneObjects,
  xrAssets,
  xrInteractions,
  type XrScene,
  type NewXrScene,
  type XrSceneObject,
  type NewXrSceneObject,
  type XrAsset,
  type NewXrAsset,
  type XrInteraction,
  type NewXrInteraction,
} from '@/db/schema/webxr';

// ============================================================================
// TYPES
// ============================================================================

export type SceneType =
  | 'environment'
  | 'product_viewer'
  | 'data_visualization'
  | 'game'
  | 'training'
  | 'social';
export type EngineType = 'threejs' | 'babylonjs' | 'aframe' | 'custom';
export type ObjectType =
  | 'mesh'
  | 'model'
  | 'light'
  | 'camera'
  | 'group'
  | 'ui_panel'
  | 'audio'
  | 'video'
  | 'particle';

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface SceneSettings {
  backgroundColor?: string;
  ambientLight?: { color: string; intensity: number };
  fog?: { color: string; near: number; far: number };
  skybox?: string;
  gravity?: [number, number, number];
  physics?: boolean;
}

export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
  color: string;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
  castShadow?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default scene settings
 */
export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  backgroundColor: '#1a1a2e',
  ambientLight: { color: '#ffffff', intensity: 0.4 },
  gravity: [0, -9.81, 0],
  physics: false,
};

/**
 * Default lighting setup
 */
export const DEFAULT_LIGHTING: LightConfig[] = [
  { type: 'ambient', color: '#ffffff', intensity: 0.4 },
  {
    type: 'directional',
    color: '#ffffff',
    intensity: 0.8,
    position: [5, 10, 5],
    castShadow: true,
  },
];

/**
 * Scene templates
 */
export const SCENE_TEMPLATES: Record<
  string,
  {
    name: string;
    description: string;
    sceneType: SceneType;
    settings: SceneSettings;
    lighting: LightConfig[];
    defaultObjects: Array<Partial<NewXrSceneObject>>;
  }
> = {
  empty: {
    name: 'Empty Scene',
    description: 'A blank canvas for your XR experience',
    sceneType: 'environment',
    settings: DEFAULT_SCENE_SETTINGS,
    lighting: DEFAULT_LIGHTING,
    defaultObjects: [],
  },
  gallery: {
    name: 'Gallery Space',
    description: 'A museum-style gallery for showcasing 3D objects',
    sceneType: 'product_viewer',
    settings: {
      ...DEFAULT_SCENE_SETTINGS,
      backgroundColor: '#0a0a0f',
    },
    lighting: [
      { type: 'ambient', color: '#ffffff', intensity: 0.2 },
      { type: 'spot', color: '#ffffff', intensity: 1.0, position: [0, 5, 0], castShadow: true },
    ],
    defaultObjects: [
      {
        name: 'Floor',
        objectType: 'mesh',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [20, 20, 1],
        materialConfig: { type: 'standard', color: '#1a1a1a', metalness: 0.3, roughness: 0.7 },
      },
    ],
  },
  tcg_room: {
    name: 'TCG Trading Room',
    description: 'Virtual space for card trading and collection viewing',
    sceneType: 'social',
    settings: {
      ...DEFAULT_SCENE_SETTINGS,
      backgroundColor: '#0f0f1a',
      skybox: 'gradient',
    },
    lighting: [
      { type: 'ambient', color: '#6366f1', intensity: 0.3 },
      { type: 'point', color: '#06b6d4', intensity: 0.8, position: [0, 3, 0] },
      { type: 'directional', color: '#ffffff', intensity: 0.5, position: [5, 5, 5] },
    ],
    defaultObjects: [
      {
        name: 'Table',
        objectType: 'mesh',
        position: [0, 0.8, 0],
        scale: [2, 0.05, 1.5],
        isInteractable: true,
        materialConfig: { type: 'standard', color: '#2a2a3e', metalness: 0.1, roughness: 0.8 },
      },
    ],
  },
  data_viz: {
    name: 'Data Visualization Space',
    description: 'Immersive environment for exploring data',
    sceneType: 'data_visualization',
    settings: {
      ...DEFAULT_SCENE_SETTINGS,
      backgroundColor: '#000012',
    },
    lighting: [
      { type: 'ambient', color: '#ffffff', intensity: 0.2 },
      { type: 'hemisphere', color: '#4f46e5', intensity: 0.5, position: [0, 10, 0] },
    ],
    defaultObjects: [],
  },
  training_sim: {
    name: 'Training Simulation',
    description: 'Environment for XR training scenarios',
    sceneType: 'training',
    settings: {
      ...DEFAULT_SCENE_SETTINGS,
      physics: true,
    },
    lighting: DEFAULT_LIGHTING,
    defaultObjects: [
      {
        name: 'Ground Plane',
        objectType: 'mesh',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [50, 50, 1],
        physicsEnabled: true,
        physicsConfig: { type: 'static', friction: 0.8 },
      },
    ],
  },
};

// ============================================================================
// SCENE MANAGEMENT
// ============================================================================

/**
 * Create a new scene
 */
export async function createScene(data: Omit<NewXrScene, 'id' | 'createdAt' | 'updatedAt'>): Promise<XrScene> {
  const [scene] = await db.insert(xrScenes).values(data).returning();
  return scene;
}

/**
 * Create scene from template
 */
export async function createSceneFromTemplate(
  templateId: string,
  options: {
    name: string;
    userId?: string;
    description?: string;
  }
): Promise<XrScene> {
  const template = SCENE_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Create scene
  const scene = await createScene({
    name: options.name,
    description: options.description ?? template.description,
    userId: options.userId,
    sceneType: template.sceneType,
    engine: 'threejs',
    supportedModes: ['inline', 'immersive-vr'],
    settings: template.settings,
    lightingConfig: template.lighting,
    performanceConfig: {
      targetFps: 72,
      shadowQuality: 'medium',
      antialiasing: true,
      lodEnabled: true,
    },
  });

  // Create default objects
  for (const objData of template.defaultObjects) {
    await createSceneObject({
      sceneId: scene.id,
      name: objData.name ?? 'Object',
      objectType: objData.objectType ?? 'mesh',
      position: objData.position ?? [0, 0, 0],
      rotation: objData.rotation ?? [0, 0, 0],
      scale: objData.scale ?? [1, 1, 1],
      isInteractable: objData.isInteractable ?? false,
      physicsEnabled: objData.physicsEnabled ?? false,
      physicsConfig: objData.physicsConfig,
      materialConfig: objData.materialConfig,
    });
  }

  return scene;
}

/**
 * Get scene by ID
 */
export async function getScene(sceneId: string): Promise<XrScene | null> {
  const [scene] = await db.select().from(xrScenes).where(eq(xrScenes.id, sceneId)).execute();
  return scene ?? null;
}

/**
 * Get scene with all objects
 */
export async function getSceneWithObjects(
  sceneId: string
): Promise<{ scene: XrScene; objects: XrSceneObject[] } | null> {
  const scene = await getScene(sceneId);
  if (!scene) return null;

  const objects = await db
    .select()
    .from(xrSceneObjects)
    .where(eq(xrSceneObjects.sceneId, sceneId))
    .orderBy(asc(xrSceneObjects.sortOrder))
    .execute();

  return { scene, objects };
}

/**
 * Get user's scenes
 */
export async function getUserScenes(
  userId: string,
  options: { limit?: number; includeTemplates?: boolean } = {}
): Promise<XrScene[]> {
  const { limit = 50, includeTemplates = false } = options;

  const conditions = [eq(xrScenes.userId, userId)];
  if (!includeTemplates) {
    conditions.push(eq(xrScenes.isTemplate, false));
  }

  return db
    .select()
    .from(xrScenes)
    .where(and(...conditions))
    .orderBy(desc(xrScenes.updatedAt))
    .limit(limit)
    .execute();
}

/**
 * Update scene
 */
export async function updateScene(
  sceneId: string,
  updates: Partial<Omit<XrScene, 'id' | 'createdAt'>>
): Promise<XrScene | null> {
  const [updated] = await db
    .update(xrScenes)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(xrScenes.id, sceneId))
    .returning();

  return updated ?? null;
}

/**
 * Delete scene
 */
export async function deleteScene(sceneId: string): Promise<boolean> {
  const result = await db.delete(xrScenes).where(eq(xrScenes.id, sceneId)).execute();
  return (result.rowCount ?? 0) > 0;
}

/**
 * Increment scene view count
 */
export async function incrementSceneViews(sceneId: string): Promise<void> {
  await db
    .update(xrScenes)
    .set({ viewCount: sql`${xrScenes.viewCount} + 1` })
    .where(eq(xrScenes.id, sceneId))
    .execute();
}

// ============================================================================
// OBJECT MANAGEMENT
// ============================================================================

/**
 * Create scene object
 */
export async function createSceneObject(
  data: Omit<NewXrSceneObject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<XrSceneObject> {
  const [object] = await db.insert(xrSceneObjects).values(data).returning();
  return object;
}

/**
 * Get scene object
 */
export async function getSceneObject(objectId: string): Promise<XrSceneObject | null> {
  const [object] = await db
    .select()
    .from(xrSceneObjects)
    .where(eq(xrSceneObjects.id, objectId))
    .execute();

  return object ?? null;
}

/**
 * Update scene object
 */
export async function updateSceneObject(
  objectId: string,
  updates: Partial<Omit<XrSceneObject, 'id' | 'createdAt'>>
): Promise<XrSceneObject | null> {
  const [updated] = await db
    .update(xrSceneObjects)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(xrSceneObjects.id, objectId))
    .returning();

  return updated ?? null;
}

/**
 * Update object transform
 */
export async function updateObjectTransform(
  objectId: string,
  transform: Partial<Transform>
): Promise<XrSceneObject | null> {
  const updates: Partial<XrSceneObject> = { updatedAt: new Date() };

  if (transform.position) updates.position = transform.position;
  if (transform.rotation) updates.rotation = transform.rotation;
  if (transform.scale) updates.scale = transform.scale;

  const [updated] = await db
    .update(xrSceneObjects)
    .set(updates)
    .where(eq(xrSceneObjects.id, objectId))
    .returning();

  return updated ?? null;
}

/**
 * Delete scene object
 */
export async function deleteSceneObject(objectId: string): Promise<boolean> {
  const result = await db.delete(xrSceneObjects).where(eq(xrSceneObjects.id, objectId)).execute();
  return (result.rowCount ?? 0) > 0;
}

/**
 * Reorder objects in scene
 */
export async function reorderSceneObjects(
  sceneId: string,
  objectIds: string[]
): Promise<void> {
  for (let i = 0; i < objectIds.length; i++) {
    await db
      .update(xrSceneObjects)
      .set({ sortOrder: i })
      .where(and(eq(xrSceneObjects.id, objectIds[i]), eq(xrSceneObjects.sceneId, sceneId)))
      .execute();
  }
}

// ============================================================================
// ASSET MANAGEMENT
// ============================================================================

/**
 * Create asset
 */
export async function createAsset(
  data: Omit<NewXrAsset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<XrAsset> {
  const [asset] = await db.insert(xrAssets).values(data).returning();
  return asset;
}

/**
 * Get asset
 */
export async function getAsset(assetId: string): Promise<XrAsset | null> {
  const [asset] = await db.select().from(xrAssets).where(eq(xrAssets.id, assetId)).execute();
  return asset ?? null;
}

/**
 * Get user's assets
 */
export async function getUserAssets(
  userId: string,
  options: { category?: string; limit?: number } = {}
): Promise<XrAsset[]> {
  const { category, limit = 100 } = options;

  const conditions = [eq(xrAssets.userId, userId)];
  if (category) {
    conditions.push(eq(xrAssets.category, category as XrAsset['category']));
  }

  return db
    .select()
    .from(xrAssets)
    .where(and(...conditions))
    .orderBy(desc(xrAssets.createdAt))
    .limit(limit)
    .execute();
}

/**
 * Get public assets
 */
export async function getPublicAssets(
  options: { category?: string; limit?: number } = {}
): Promise<XrAsset[]> {
  const { category, limit = 100 } = options;

  const conditions = [eq(xrAssets.isPublic, true)];
  if (category) {
    conditions.push(eq(xrAssets.category, category as XrAsset['category']));
  }

  return db
    .select()
    .from(xrAssets)
    .where(and(...conditions))
    .orderBy(desc(xrAssets.usageCount))
    .limit(limit)
    .execute();
}

/**
 * Update asset
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<Omit<XrAsset, 'id' | 'createdAt'>>
): Promise<XrAsset | null> {
  const [updated] = await db
    .update(xrAssets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(xrAssets.id, assetId))
    .returning();

  return updated ?? null;
}

/**
 * Increment asset usage
 */
export async function incrementAssetUsage(assetId: string): Promise<void> {
  await db
    .update(xrAssets)
    .set({ usageCount: sql`${xrAssets.usageCount} + 1` })
    .where(eq(xrAssets.id, assetId))
    .execute();
}

// ============================================================================
// INTERACTION MANAGEMENT
// ============================================================================

/**
 * Create interaction
 */
export async function createInteraction(
  data: Omit<NewXrInteraction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<XrInteraction> {
  const [interaction] = await db.insert(xrInteractions).values(data).returning();
  return interaction;
}

/**
 * Get interactions for scene
 */
export async function getSceneInteractions(sceneId: string): Promise<XrInteraction[]> {
  return db
    .select()
    .from(xrInteractions)
    .where(eq(xrInteractions.sceneId, sceneId))
    .orderBy(desc(xrInteractions.priority))
    .execute();
}

/**
 * Get interactions for object
 */
export async function getObjectInteractions(objectId: string): Promise<XrInteraction[]> {
  return db
    .select()
    .from(xrInteractions)
    .where(eq(xrInteractions.objectId, objectId))
    .orderBy(desc(xrInteractions.priority))
    .execute();
}

/**
 * Update interaction
 */
export async function updateInteraction(
  interactionId: string,
  updates: Partial<Omit<XrInteraction, 'id' | 'createdAt'>>
): Promise<XrInteraction | null> {
  const [updated] = await db
    .update(xrInteractions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(xrInteractions.id, interactionId))
    .returning();

  return updated ?? null;
}

/**
 * Delete interaction
 */
export async function deleteInteraction(interactionId: string): Promise<boolean> {
  const result = await db
    .delete(xrInteractions)
    .where(eq(xrInteractions.id, interactionId))
    .execute();

  return (result.rowCount ?? 0) > 0;
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate Three.js scene code
 */
export function generateThreeJsSceneCode(scene: XrScene, objects: XrSceneObject[]): string {
  const settings = scene.settings as SceneSettings;
  const lighting = scene.lightingConfig as LightConfig[];

  return `
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('${settings?.backgroundColor ?? '#1a1a2e'}');

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Lighting
${(lighting ?? DEFAULT_LIGHTING)
  .map((light, i) => {
    switch (light.type) {
      case 'ambient':
        return `const ambientLight${i} = new THREE.AmbientLight('${light.color}', ${light.intensity});
scene.add(ambientLight${i});`;
      case 'directional':
        return `const directionalLight${i} = new THREE.DirectionalLight('${light.color}', ${light.intensity});
directionalLight${i}.position.set(${light.position?.join(', ') ?? '5, 10, 5'});
${light.castShadow ? `directionalLight${i}.castShadow = true;` : ''}
scene.add(directionalLight${i});`;
      case 'point':
        return `const pointLight${i} = new THREE.PointLight('${light.color}', ${light.intensity});
pointLight${i}.position.set(${light.position?.join(', ') ?? '0, 3, 0'});
scene.add(pointLight${i});`;
      default:
        return '';
    }
  })
  .join('\n')}

// Objects
${objects
  .map((obj) => {
    const material = obj.materialConfig as {
      type?: string;
      color?: string;
      metalness?: number;
      roughness?: number;
    };
    return `// ${obj.name}
const geometry_${obj.id.slice(0, 8)} = new THREE.BoxGeometry(1, 1, 1);
const material_${obj.id.slice(0, 8)} = new THREE.MeshStandardMaterial({
  color: '${material?.color ?? '#ffffff'}',
  metalness: ${material?.metalness ?? 0.5},
  roughness: ${material?.roughness ?? 0.5}
});
const mesh_${obj.id.slice(0, 8)} = new THREE.Mesh(geometry_${obj.id.slice(0, 8)}, material_${obj.id.slice(0, 8)});
mesh_${obj.id.slice(0, 8)}.position.set(${(obj.position as number[]).join(', ')});
mesh_${obj.id.slice(0, 8)}.rotation.set(${(obj.rotation as number[]).join(', ')});
mesh_${obj.id.slice(0, 8)}.scale.set(${(obj.scale as number[]).join(', ')});
scene.add(mesh_${obj.id.slice(0, 8)});`;
  })
  .join('\n\n')}

// Animation loop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
  `.trim();
}
