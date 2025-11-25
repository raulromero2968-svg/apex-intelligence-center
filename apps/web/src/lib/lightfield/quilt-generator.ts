/**
 * Quilt Generator Service
 *
 * Implements light field quilt generation (pack-lfd-001 §3.2-3.3).
 * Creates multi-view texture atlases for Looking Glass displays.
 *
 * Features:
 * - Generate quilt textures from 3D models
 * - Configure view counts (45-100)
 * - Optimize for different display sizes
 * - Create fallback 2D previews
 *
 * @see pack-lfd-001 for rendering techniques
 */

import { db } from '@/lib/db';
import { eq, desc, and, or } from 'drizzle-orm';
import {
  quiltAssets,
  type QuiltAsset,
  type NewQuiltAsset,
} from '@/db/schema/lightfield';

// ============================================================================
// TYPES
// ============================================================================

export interface QuiltConfig {
  viewCount: number; // 45, 60, or 100 views
  columns: number;
  rows: number;
  viewWidth: number;
  viewHeight: number;
  totalWidth: number;
  totalHeight: number;
  viewCone: number; // degrees
  depthiness: number; // 0.5-2.0
}

export interface QuiltPreset {
  name: string;
  config: QuiltConfig;
  recommendedFor: string[];
}

export interface ViewConeConfig {
  angle: number; // degrees
  centerView: number;
  viewSpacing: number; // degrees between views
}

// ============================================================================
// PRESETS
// ============================================================================

/**
 * Standard quilt presets for different use cases
 */
export const QUILT_PRESETS: Record<string, QuiltPreset> = {
  portrait_standard: {
    name: 'Portrait Standard',
    config: {
      viewCount: 45,
      columns: 5,
      rows: 9,
      viewWidth: 420,
      viewHeight: 560,
      totalWidth: 2100,
      totalHeight: 5040,
      viewCone: 40,
      depthiness: 1.0,
    },
    recommendedFor: ['portrait', 'tcg_card'],
  },
  portrait_high: {
    name: 'Portrait High Quality',
    config: {
      viewCount: 100,
      columns: 10,
      rows: 10,
      viewWidth: 420,
      viewHeight: 560,
      totalWidth: 4200,
      totalHeight: 5600,
      viewCone: 53,
      depthiness: 1.0,
    },
    recommendedFor: ['portrait', 'detail'],
  },
  landscape_standard: {
    name: 'Landscape Standard',
    config: {
      viewCount: 45,
      columns: 9,
      rows: 5,
      viewWidth: 640,
      viewHeight: 360,
      totalWidth: 5760,
      totalHeight: 1800,
      viewCone: 40,
      depthiness: 1.0,
    },
    recommendedFor: ['lg_16', 'lg_27', 'dashboard'],
  },
  landscape_high: {
    name: 'Landscape High Quality',
    config: {
      viewCount: 100,
      columns: 10,
      rows: 10,
      viewWidth: 640,
      viewHeight: 360,
      totalWidth: 6400,
      totalHeight: 3600,
      viewCone: 53,
      depthiness: 1.0,
    },
    recommendedFor: ['lg_32', 'lg_65', 'lg_86'],
  },
  compact_fast: {
    name: 'Compact Fast',
    config: {
      viewCount: 32,
      columns: 8,
      rows: 4,
      viewWidth: 320,
      viewHeight: 240,
      totalWidth: 2560,
      totalHeight: 960,
      viewCone: 35,
      depthiness: 0.8,
    },
    recommendedFor: ['preview', 'mobile', 'low_power'],
  },
};

/**
 * Default preset for different display models
 */
export const DISPLAY_PRESETS: Record<string, string> = {
  portrait: 'portrait_standard',
  lg_16: 'landscape_standard',
  lg_27: 'landscape_standard',
  lg_32: 'landscape_high',
  lg_65: 'landscape_high',
  lg_86: 'landscape_high',
  custom: 'landscape_standard',
};

// ============================================================================
// QUILT ASSET MANAGEMENT
// ============================================================================

/**
 * Create a new quilt asset record
 */
export async function createQuiltAsset(
  data: Omit<NewQuiltAsset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<QuiltAsset> {
  const [asset] = await db
    .insert(quiltAssets)
    .values(data)
    .returning()
    .execute();

  return asset;
}

/**
 * Get quilt asset by ID
 */
export async function getQuiltAsset(id: string): Promise<QuiltAsset | null> {
  const [asset] = await db
    .select()
    .from(quiltAssets)
    .where(eq(quiltAssets.id, id))
    .limit(1)
    .execute();

  return asset ?? null;
}

/**
 * Get quilt assets for a user
 */
export async function getUserQuiltAssets(
  userId: string,
  options?: {
    category?: QuiltAsset['category'];
    status?: QuiltAsset['status'];
    limit?: number;
  }
): Promise<QuiltAsset[]> {
  const conditions = [eq(quiltAssets.ownerId, userId)];

  if (options?.category) {
    conditions.push(eq(quiltAssets.category, options.category));
  }
  if (options?.status) {
    conditions.push(eq(quiltAssets.status, options.status));
  }

  return db
    .select()
    .from(quiltAssets)
    .where(and(...conditions))
    .orderBy(desc(quiltAssets.createdAt))
    .limit(options?.limit ?? 50)
    .execute();
}

/**
 * Get public quilt assets
 */
export async function getPublicQuiltAssets(options?: {
  category?: QuiltAsset['category'];
  limit?: number;
}): Promise<QuiltAsset[]> {
  const conditions = [
    eq(quiltAssets.isPublic, true),
    eq(quiltAssets.status, 'completed'),
  ];

  if (options?.category) {
    conditions.push(eq(quiltAssets.category, options.category));
  }

  return db
    .select()
    .from(quiltAssets)
    .where(and(...conditions))
    .orderBy(desc(quiltAssets.createdAt))
    .limit(options?.limit ?? 50)
    .execute();
}

/**
 * Update quilt asset
 */
export async function updateQuiltAsset(
  id: string,
  data: Partial<Omit<QuiltAsset, 'id' | 'createdAt'>>
): Promise<QuiltAsset | null> {
  const [updated] = await db
    .update(quiltAssets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quiltAssets.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Delete quilt asset
 */
export async function deleteQuiltAsset(id: string): Promise<boolean> {
  const result = await db
    .delete(quiltAssets)
    .where(eq(quiltAssets.id, id))
    .execute();

  return result.rowCount > 0;
}

// ============================================================================
// QUILT CONFIGURATION
// ============================================================================

/**
 * Get recommended quilt config for a display model
 */
export function getRecommendedConfig(displayModel: string): QuiltConfig {
  const presetName = DISPLAY_PRESETS[displayModel] ?? 'landscape_standard';
  return QUILT_PRESETS[presetName].config;
}

/**
 * Calculate optimal quilt dimensions for given constraints
 */
export function calculateQuiltDimensions(options: {
  viewCount: number;
  aspectRatio: number; // width/height of single view
  maxTextureSize?: number; // GPU texture limit
}): QuiltConfig {
  const { viewCount, aspectRatio, maxTextureSize = 8192 } = options;

  // Find optimal grid layout
  const sqrt = Math.sqrt(viewCount);
  let columns = Math.ceil(sqrt);
  let rows = Math.ceil(viewCount / columns);

  // Adjust for aspect ratio
  if (aspectRatio > 1) {
    // Landscape - more columns
    columns = Math.ceil(sqrt * Math.sqrt(aspectRatio));
    rows = Math.ceil(viewCount / columns);
  } else {
    // Portrait - more rows
    rows = Math.ceil(sqrt / Math.sqrt(aspectRatio));
    columns = Math.ceil(viewCount / rows);
  }

  // Calculate view dimensions within texture limits
  const maxViewWidth = Math.floor(maxTextureSize / columns);
  const maxViewHeight = Math.floor(maxTextureSize / rows);

  let viewWidth = maxViewWidth;
  let viewHeight = Math.round(viewWidth / aspectRatio);

  if (viewHeight > maxViewHeight) {
    viewHeight = maxViewHeight;
    viewWidth = Math.round(viewHeight * aspectRatio);
  }

  return {
    viewCount,
    columns,
    rows,
    viewWidth,
    viewHeight,
    totalWidth: viewWidth * columns,
    totalHeight: viewHeight * rows,
    viewCone: viewCount >= 60 ? 53 : 40, // Wider cone for more views
    depthiness: 1.0,
  };
}

/**
 * Calculate view cone parameters
 */
export function calculateViewCone(config: QuiltConfig): ViewConeConfig {
  const viewSpacing = config.viewCone / config.viewCount;
  const centerView = Math.floor(config.viewCount / 2);

  return {
    angle: config.viewCone,
    centerView,
    viewSpacing,
  };
}

/**
 * Get camera positions for multi-view rendering
 */
export function getCameraPositions(options: {
  config: QuiltConfig;
  cameraDistance: number;
  focusDistance: number;
}): Array<{ index: number; position: [number, number, number]; target: [number, number, number] }> {
  const { config, cameraDistance, focusDistance } = options;
  const viewCone = calculateViewCone(config);
  const positions: Array<{ index: number; position: [number, number, number]; target: [number, number, number] }> = [];

  for (let i = 0; i < config.viewCount; i++) {
    // Calculate angle offset from center
    const angleOffset = (i - viewCone.centerView) * viewCone.viewSpacing;
    const angleRad = (angleOffset * Math.PI) / 180;

    // Calculate camera position (arc around subject)
    const x = Math.sin(angleRad) * cameraDistance;
    const z = Math.cos(angleRad) * cameraDistance;

    // Target converges at focus distance
    const targetX = Math.sin(angleRad) * (cameraDistance - focusDistance);

    positions.push({
      index: i,
      position: [x, 0, z],
      target: [targetX, 0, 0],
    });
  }

  return positions;
}

// ============================================================================
// QUILT GENERATION HELPERS
// ============================================================================

/**
 * Generate Three.js shader code for quilt rendering
 */
export function getQuiltShaderCode(): { vertex: string; fragment: string } {
  const vertex = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

  const fragment = `
uniform sampler2D quiltTexture;
uniform float viewCount;
uniform float columns;
uniform float rows;
uniform float viewCone;
uniform float pitch;
uniform float slope;
uniform float center;

varying vec2 vUv;

void main() {
  // Calculate view index based on screen position and Looking Glass parameters
  float viewIndex = mod(floor(vUv.x * viewCount), viewCount);

  // Calculate UV in quilt texture
  float col = mod(viewIndex, columns);
  float row = floor(viewIndex / columns);

  vec2 quiltUv = vec2(
    (col + vUv.x) / columns,
    (row + vUv.y) / rows
  );

  gl_FragColor = texture2D(quiltTexture, quiltUv);
}
`;

  return { vertex, fragment };
}

/**
 * Get quilt texture coordinates for a specific view
 */
export function getViewUVs(
  viewIndex: number,
  config: QuiltConfig
): { uMin: number; uMax: number; vMin: number; vMax: number } {
  const col = viewIndex % config.columns;
  const row = Math.floor(viewIndex / config.columns);

  return {
    uMin: col / config.columns,
    uMax: (col + 1) / config.columns,
    vMin: row / config.rows,
    vMax: (row + 1) / config.rows,
  };
}

/**
 * Estimate file size for quilt texture
 */
export function estimateFileSizeBytes(
  config: QuiltConfig,
  format: 'png' | 'jpg' | 'webp' | 'ktx2'
): number {
  const pixels = config.totalWidth * config.totalHeight;
  const bytesPerPixel = 4; // RGBA
  const rawSize = pixels * bytesPerPixel;

  // Compression estimates
  const compressionRatio: Record<string, number> = {
    png: 0.5, // Lossless, moderate compression
    jpg: 0.15, // Lossy, good compression
    webp: 0.12, // Better compression than jpg
    ktx2: 0.1, // GPU-optimized compression
  };

  return Math.round(rawSize * compressionRatio[format]);
}

// ============================================================================
// PSEUDO-HOLOGRAPHY FALLBACK
// ============================================================================

/**
 * Generate parameters for 2D fallback rendering
 */
export function getFallbackRenderParams(config: QuiltConfig): {
  centerViewIndex: number;
  parallaxStrength: number;
  depthLayers: number;
} {
  return {
    centerViewIndex: Math.floor(config.viewCount / 2),
    parallaxStrength: config.depthiness * 0.5,
    depthLayers: Math.min(5, Math.ceil(config.viewCount / 10)),
  };
}

/**
 * Generate anaglyph stereo pair indices
 */
export function getAnaglyphViewIndices(config: QuiltConfig): {
  leftView: number;
  rightView: number;
  separation: number;
} {
  const center = Math.floor(config.viewCount / 2);
  const separation = Math.floor(config.viewCount * 0.15); // 15% separation

  return {
    leftView: Math.max(0, center - separation),
    rightView: Math.min(config.viewCount - 1, center + separation),
    separation: separation * 2,
  };
}
