/**
 * WebXR Database Schema
 *
 * Implements pack-webxr-001 architecture for cross-platform XR development.
 * Supports VR/AR sessions, 3D scenes, assets, device profiles, and analytics.
 *
 * Tables:
 * - xrSessions: VR/AR session tracking
 * - xrScenes: 3D scene configurations
 * - xrSceneObjects: Objects within scenes
 * - xrAssets: glTF/USD assets for XR
 * - xrDeviceProfiles: Device-specific optimizations
 * - xrInteractions: Input/interaction bindings
 * - xrAnalytics: Session analytics and metrics
 * - webxrKnowledge: RAG knowledge base
 */

import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  integer,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// XR SESSIONS
// ============================================================================

/**
 * XR Sessions - Track VR/AR session lifecycle
 */
export const xrSessions = pgTable(
  'xr_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    sceneId: uuid('scene_id'),

    // Session configuration
    sessionType: text('session_type', {
      enum: ['immersive-vr', 'immersive-ar', 'inline'],
    }).notNull(),
    referenceSpace: text('reference_space', {
      enum: ['local', 'local-floor', 'bounded-floor', 'unbounded', 'viewer'],
    })
      .default('local-floor')
      .notNull(),

    // Device info
    deviceType: text('device_type'), // quest_3, vision_pro, mobile_ar, desktop
    deviceName: text('device_name'),
    userAgent: text('user_agent'),

    // Session state
    status: text('status', {
      enum: ['initializing', 'active', 'paused', 'ended', 'error'],
    })
      .default('initializing')
      .notNull(),

    // Timing
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    totalDurationMs: integer('total_duration_ms'),
    activeDurationMs: integer('active_duration_ms'),

    // Performance metrics
    metrics: jsonb('metrics').$type<{
      avgFps?: number;
      minFps?: number;
      maxFps?: number;
      frameDrops?: number;
      latencyMs?: number;
      memoryUsageMb?: number;
    }>(),

    // Features used
    featuresUsed: jsonb('features_used').$type<string[]>().default([]),

    // Error tracking
    errorMessage: text('error_message'),
    errorCode: text('error_code'),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_xr_sessions_user').on(table.userId),
    sceneIdx: index('idx_xr_sessions_scene').on(table.sceneId),
    statusIdx: index('idx_xr_sessions_status').on(table.status),
    sessionTypeIdx: index('idx_xr_sessions_type').on(table.sessionType),
    createdAtIdx: index('idx_xr_sessions_created').on(table.createdAt),
  })
);

// ============================================================================
// XR SCENES
// ============================================================================

/**
 * XR Scenes - 3D scene configurations
 */
export const xrScenes = pgTable(
  'xr_scenes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    slug: text('slug'),

    // Scene type
    sceneType: text('scene_type', {
      enum: ['environment', 'product_viewer', 'data_visualization', 'game', 'training', 'social'],
    })
      .default('environment')
      .notNull(),

    // Engine configuration
    engine: text('engine', {
      enum: ['threejs', 'babylonjs', 'aframe', 'custom'],
    })
      .default('threejs')
      .notNull(),

    // Supported modes
    supportedModes: jsonb('supported_modes')
      .$type<Array<'immersive-vr' | 'immersive-ar' | 'inline'>>()
      .default(['inline'])
      .notNull(),

    // Scene settings
    settings: jsonb('settings').$type<{
      backgroundColor?: string;
      ambientLight?: { color: string; intensity: number };
      fog?: { color: string; near: number; far: number };
      skybox?: string;
      gravity?: [number, number, number];
      physics?: boolean;
    }>(),

    // Camera defaults
    cameraConfig: jsonb('camera_config').$type<{
      type: 'perspective' | 'orthographic';
      fov?: number;
      near?: number;
      far?: number;
      position?: [number, number, number];
      target?: [number, number, number];
    }>(),

    // Lighting setup
    lightingConfig: jsonb('lighting_config').$type<
      Array<{
        type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
        color: string;
        intensity: number;
        position?: [number, number, number];
        target?: [number, number, number];
        castShadow?: boolean;
      }>
    >(),

    // Performance settings
    performanceConfig: jsonb('performance_config').$type<{
      targetFps?: number;
      maxDrawCalls?: number;
      shadowQuality?: 'off' | 'low' | 'medium' | 'high';
      antialiasing?: boolean;
      lodEnabled?: boolean;
    }>(),

    // Publishing
    isPublished: boolean('is_published').default(false).notNull(),
    isTemplate: boolean('is_template').default(false).notNull(),

    // Versioning
    version: integer('version').default(1).notNull(),

    // Statistics
    viewCount: integer('view_count').default(0).notNull(),
    sessionCount: integer('session_count').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_xr_scenes_user').on(table.userId),
    sceneTypeIdx: index('idx_xr_scenes_type').on(table.sceneType),
    publishedIdx: index('idx_xr_scenes_published').on(table.isPublished),
    templateIdx: index('idx_xr_scenes_template').on(table.isTemplate),
  })
);

// ============================================================================
// XR SCENE OBJECTS
// ============================================================================

/**
 * XR Scene Objects - Objects within scenes
 */
export const xrSceneObjects = pgTable(
  'xr_scene_objects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sceneId: uuid('scene_id')
      .references(() => xrScenes.id, { onDelete: 'cascade' })
      .notNull(),
    assetId: uuid('asset_id').references(() => xrAssets.id),

    // Object info
    name: text('name').notNull(),
    objectType: text('object_type', {
      enum: ['mesh', 'model', 'light', 'camera', 'group', 'ui_panel', 'audio', 'video', 'particle'],
    }).notNull(),

    // Transform
    position: jsonb('position').$type<[number, number, number]>().default([0, 0, 0]).notNull(),
    rotation: jsonb('rotation').$type<[number, number, number]>().default([0, 0, 0]).notNull(),
    scale: jsonb('scale').$type<[number, number, number]>().default([1, 1, 1]).notNull(),

    // Visibility
    visible: boolean('visible').default(true).notNull(),
    layer: integer('layer').default(0).notNull(),

    // Physics
    physicsEnabled: boolean('physics_enabled').default(false).notNull(),
    physicsConfig: jsonb('physics_config').$type<{
      type?: 'static' | 'dynamic' | 'kinematic';
      mass?: number;
      friction?: number;
      restitution?: number;
      collider?: 'box' | 'sphere' | 'mesh' | 'capsule';
    }>(),

    // Interactivity
    isInteractable: boolean('is_interactable').default(false).notNull(),
    interactionConfig: jsonb('interaction_config').$type<{
      hoverable?: boolean;
      selectable?: boolean;
      draggable?: boolean;
      scalable?: boolean;
      rotatable?: boolean;
      clickable?: boolean;
    }>(),

    // Animation
    animations: jsonb('animations').$type<
      Array<{
        name: string;
        type: 'position' | 'rotation' | 'scale' | 'opacity' | 'custom';
        loop?: boolean;
        autoPlay?: boolean;
      }>
    >(),

    // Material/appearance
    materialConfig: jsonb('material_config').$type<{
      type?: 'standard' | 'physical' | 'basic' | 'custom';
      color?: string;
      metalness?: number;
      roughness?: number;
      opacity?: number;
      textureUrl?: string;
    }>(),

    // Custom data
    userData: jsonb('user_data').$type<Record<string, unknown>>(),

    // Ordering
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sceneIdx: index('idx_xr_objects_scene').on(table.sceneId),
    typeIdx: index('idx_xr_objects_type').on(table.objectType),
    interactableIdx: index('idx_xr_objects_interactable').on(table.isInteractable),
  })
);

// ============================================================================
// XR ASSETS
// ============================================================================

/**
 * XR Assets - glTF/USD assets for XR
 */
export const xrAssets = pgTable(
  'xr_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),

    // Asset info
    name: text('name').notNull(),
    description: text('description'),
    category: text('category', {
      enum: ['model', 'environment', 'character', 'prop', 'ui', 'audio', 'texture', 'material'],
    }).notNull(),

    // File info
    format: text('format', {
      enum: ['gltf', 'glb', 'usdz', 'fbx', 'obj', 'png', 'jpg', 'webp', 'mp3', 'wav', 'ogg'],
    }).notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size'), // bytes
    originalFilename: text('original_filename'),

    // Preview
    thumbnailUrl: text('thumbnail_url'),
    previewUrl: text('preview_url'),

    // Dimensions (for 3D models)
    dimensions: jsonb('dimensions').$type<{
      width?: number;
      height?: number;
      depth?: number;
      boundingBox?: [[number, number, number], [number, number, number]];
    }>(),

    // Performance metrics
    metrics: jsonb('metrics').$type<{
      triangleCount?: number;
      vertexCount?: number;
      textureCount?: number;
      materialCount?: number;
      animationCount?: number;
      boneCount?: number;
    }>(),

    // Optimization
    isOptimized: boolean('is_optimized').default(false).notNull(),
    lodLevels: jsonb('lod_levels').$type<
      Array<{
        level: number;
        fileUrl: string;
        triangleCount: number;
        distance: number;
      }>
    >(),
    compressionType: text('compression_type'), // draco, meshopt, etc.

    // Licensing
    license: text('license'),
    attribution: text('attribution'),
    isPublic: boolean('is_public').default(false).notNull(),

    // Tags for search
    tags: jsonb('tags').$type<string[]>().default([]),

    // Usage stats
    usageCount: integer('usage_count').default(0).notNull(),
    downloadCount: integer('download_count').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_xr_assets_user').on(table.userId),
    categoryIdx: index('idx_xr_assets_category').on(table.category),
    formatIdx: index('idx_xr_assets_format').on(table.format),
    publicIdx: index('idx_xr_assets_public').on(table.isPublic),
  })
);

// ============================================================================
// XR DEVICE PROFILES
// ============================================================================

/**
 * XR Device Profiles - Device-specific optimizations
 */
export const xrDeviceProfiles = pgTable(
  'xr_device_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Device identification
    deviceType: text('device_type', {
      enum: [
        'quest_2',
        'quest_3',
        'quest_pro',
        'vision_pro',
        'pico_4',
        'vive_xr_elite',
        'mobile_ar_ios',
        'mobile_ar_android',
        'desktop_vr',
        'desktop_ar',
        'generic_vr',
        'generic_ar',
      ],
    }).notNull(),
    deviceName: text('device_name').notNull(),
    manufacturer: text('manufacturer'),

    // Display specs
    displayConfig: jsonb('display_config')
      .$type<{
        resolution: [number, number];
        refreshRates: number[];
        fov: number;
        ipd?: { min: number; max: number; default: number };
      }>()
      .notNull(),

    // Input capabilities
    inputCapabilities: jsonb('input_capabilities')
      .$type<{
        controllers: boolean;
        handTracking: boolean;
        eyeTracking: boolean;
        voiceInput: boolean;
        touchpad: boolean;
        gestures: string[];
      }>()
      .notNull(),

    // Performance specs
    performanceSpec: jsonb('performance_spec').$type<{
      gpuTier: 'low' | 'medium' | 'high' | 'ultra';
      maxTriangles: number;
      maxDrawCalls: number;
      maxTextureSize: number;
      maxLights: number;
      supportsInstancing: boolean;
      supportsCompute: boolean;
    }>(),

    // Recommended settings
    recommendedSettings: jsonb('recommended_settings').$type<{
      targetFps: number;
      renderScale: number;
      shadowQuality: 'off' | 'low' | 'medium' | 'high';
      antialiasing: 'none' | 'fxaa' | 'msaa2x' | 'msaa4x';
      textureQuality: 'low' | 'medium' | 'high';
      lodBias: number;
    }>(),

    // WebXR features
    webxrFeatures: jsonb('webxr_features')
      .$type<{
        supportedSessionModes: Array<'immersive-vr' | 'immersive-ar' | 'inline'>;
        supportedReferenceSpaces: string[];
        optionalFeatures: string[];
        requiredFeatures: string[];
      }>()
      .notNull(),

    // Platform info
    platform: text('platform', {
      enum: ['standalone', 'pcvr', 'mobile', 'browser'],
    }).notNull(),
    browserRequirements: jsonb('browser_requirements').$type<{
      minChromeVersion?: number;
      minFirefoxVersion?: number;
      minSafariVersion?: number;
      requiresSecureContext: boolean;
    }>(),

    // Default profile flag
    isDefault: boolean('is_default').default(false).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    deviceTypeIdx: index('idx_xr_profiles_device_type').on(table.deviceType),
    platformIdx: index('idx_xr_profiles_platform').on(table.platform),
    defaultIdx: index('idx_xr_profiles_default').on(table.isDefault),
  })
);

// ============================================================================
// XR INTERACTIONS
// ============================================================================

/**
 * XR Interactions - Input/interaction bindings
 */
export const xrInteractions = pgTable(
  'xr_interactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sceneId: uuid('scene_id').references(() => xrScenes.id, { onDelete: 'cascade' }),
    objectId: uuid('object_id').references(() => xrSceneObjects.id, { onDelete: 'cascade' }),

    // Interaction info
    name: text('name').notNull(),
    description: text('description'),

    // Input type
    inputType: text('input_type', {
      enum: [
        'controller_trigger',
        'controller_grip',
        'controller_thumbstick',
        'controller_button_a',
        'controller_button_b',
        'hand_pinch',
        'hand_grab',
        'hand_point',
        'gaze_dwell',
        'gaze_select',
        'touch',
        'keyboard',
        'voice',
      ],
    }).notNull(),

    // Input parameters
    inputConfig: jsonb('input_config').$type<{
      hand?: 'left' | 'right' | 'any';
      threshold?: number;
      dwellTime?: number;
      holdDuration?: number;
      doubleTapTime?: number;
    }>(),

    // Action to perform
    actionType: text('action_type', {
      enum: [
        'select',
        'activate',
        'grab',
        'release',
        'move',
        'rotate',
        'scale',
        'teleport',
        'navigate',
        'play_animation',
        'play_sound',
        'show_ui',
        'hide_ui',
        'trigger_event',
        'call_function',
      ],
    }).notNull(),

    // Action parameters
    actionConfig: jsonb('action_config').$type<{
      targetId?: string;
      animationName?: string;
      soundUrl?: string;
      eventName?: string;
      functionName?: string;
      parameters?: Record<string, unknown>;
    }>(),

    // Feedback
    feedbackConfig: jsonb('feedback_config').$type<{
      haptic?: {
        intensity: number;
        duration: number;
        hand?: 'left' | 'right' | 'both';
      };
      visual?: {
        type: 'highlight' | 'pulse' | 'scale' | 'outline';
        color?: string;
        duration?: number;
      };
      audio?: {
        url: string;
        volume?: number;
      };
    }>(),

    // Conditions
    conditions: jsonb('conditions').$type<
      Array<{
        type: 'state' | 'distance' | 'variable' | 'time';
        operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
        value: unknown;
      }>
    >(),

    // Priority for conflict resolution
    priority: integer('priority').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sceneIdx: index('idx_xr_interactions_scene').on(table.sceneId),
    objectIdx: index('idx_xr_interactions_object').on(table.objectId),
    inputTypeIdx: index('idx_xr_interactions_input').on(table.inputType),
    enabledIdx: index('idx_xr_interactions_enabled').on(table.isEnabled),
  })
);

// ============================================================================
// XR ANALYTICS
// ============================================================================

/**
 * XR Analytics - Session analytics and metrics
 */
export const xrAnalytics = pgTable(
  'xr_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => xrSessions.id, { onDelete: 'cascade' }),
    sceneId: uuid('scene_id').references(() => xrScenes.id, { onDelete: 'set null' }),
    userId: text('user_id'),

    // Event type
    eventType: text('event_type', {
      enum: [
        'session_start',
        'session_end',
        'scene_load',
        'scene_enter',
        'scene_exit',
        'object_interact',
        'teleport',
        'mode_switch',
        'error',
        'performance_warning',
        'custom',
      ],
    }).notNull(),

    // Event data
    eventData: jsonb('event_data').$type<{
      objectId?: string;
      interactionType?: string;
      position?: [number, number, number];
      duration?: number;
      errorMessage?: string;
      customData?: Record<string, unknown>;
    }>(),

    // Performance snapshot
    performanceSnapshot: jsonb('performance_snapshot').$type<{
      fps: number;
      frameTime: number;
      drawCalls: number;
      triangles: number;
      memoryUsage: number;
      gpuTime?: number;
    }>(),

    // Device info at event time
    deviceInfo: jsonb('device_info').$type<{
      deviceType: string;
      sessionType: string;
      batteryLevel?: number;
      thermalState?: string;
    }>(),

    // Timestamp
    timestamp: timestamp('timestamp').defaultNow().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index('idx_xr_analytics_session').on(table.sessionId),
    sceneIdx: index('idx_xr_analytics_scene').on(table.sceneId),
    userIdx: index('idx_xr_analytics_user').on(table.userId),
    eventTypeIdx: index('idx_xr_analytics_event').on(table.eventType),
    timestampIdx: index('idx_xr_analytics_timestamp').on(table.timestamp),
  })
);

// ============================================================================
// WEBXR KNOWLEDGE
// ============================================================================

/**
 * WebXR Knowledge - RAG knowledge base
 */
export const webxrKnowledge = pgTable(
  'webxr_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Document classification
    documentType: text('document_type', {
      enum: [
        'concept',
        'api',
        'tutorial',
        'pattern',
        'troubleshooting',
        'optimization',
        'compatibility',
        'best_practice',
      ],
    }).notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),

    // Categorization
    category: text('category', {
      enum: [
        'fundamentals',
        'session_management',
        'rendering',
        'input',
        'spatial',
        'performance',
        'cross_platform',
        'ar_specific',
        'vr_specific',
      ],
    }).notNull(),

    // Metadata
    topics: jsonb('topics').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    sourceRef: text('source_ref'),

    // Code examples
    codeExamples: jsonb('code_examples').$type<
      Array<{
        language: string;
        code: string;
        description?: string;
      }>
    >(),

    // Related APIs/libraries
    relatedApis: jsonb('related_apis').$type<string[]>().default([]),
    relatedLibraries: jsonb('related_libraries').$type<string[]>().default([]),

    // Device compatibility
    deviceCompatibility: jsonb('device_compatibility').$type<{
      quest?: boolean;
      visionPro?: boolean;
      mobileAR?: boolean;
      desktopVR?: boolean;
      browser?: string[];
    }>(),

    // Quality metadata
    metadata: jsonb('metadata').$type<{
      reliability?: number;
      lastVerified?: string;
      author?: string;
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    documentTypeIdx: index('idx_webxr_knowledge_type').on(table.documentType),
    categoryIdx: index('idx_webxr_knowledge_category').on(table.category),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const xrSessionsRelations = relations(xrSessions, ({ one, many }) => ({
  scene: one(xrScenes, {
    fields: [xrSessions.sceneId],
    references: [xrScenes.id],
  }),
  analytics: many(xrAnalytics),
}));

export const xrScenesRelations = relations(xrScenes, ({ many }) => ({
  sessions: many(xrSessions),
  objects: many(xrSceneObjects),
  interactions: many(xrInteractions),
  analytics: many(xrAnalytics),
}));

export const xrSceneObjectsRelations = relations(xrSceneObjects, ({ one, many }) => ({
  scene: one(xrScenes, {
    fields: [xrSceneObjects.sceneId],
    references: [xrScenes.id],
  }),
  asset: one(xrAssets, {
    fields: [xrSceneObjects.assetId],
    references: [xrAssets.id],
  }),
  interactions: many(xrInteractions),
}));

export const xrAssetsRelations = relations(xrAssets, ({ many }) => ({
  sceneObjects: many(xrSceneObjects),
}));

export const xrInteractionsRelations = relations(xrInteractions, ({ one }) => ({
  scene: one(xrScenes, {
    fields: [xrInteractions.sceneId],
    references: [xrScenes.id],
  }),
  object: one(xrSceneObjects, {
    fields: [xrInteractions.objectId],
    references: [xrSceneObjects.id],
  }),
}));

export const xrAnalyticsRelations = relations(xrAnalytics, ({ one }) => ({
  session: one(xrSessions, {
    fields: [xrAnalytics.sessionId],
    references: [xrSessions.id],
  }),
  scene: one(xrScenes, {
    fields: [xrAnalytics.sceneId],
    references: [xrScenes.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type XrSession = typeof xrSessions.$inferSelect;
export type NewXrSession = typeof xrSessions.$inferInsert;
export type XrScene = typeof xrScenes.$inferSelect;
export type NewXrScene = typeof xrScenes.$inferInsert;
export type XrSceneObject = typeof xrSceneObjects.$inferSelect;
export type NewXrSceneObject = typeof xrSceneObjects.$inferInsert;
export type XrAsset = typeof xrAssets.$inferSelect;
export type NewXrAsset = typeof xrAssets.$inferInsert;
export type XrDeviceProfile = typeof xrDeviceProfiles.$inferSelect;
export type NewXrDeviceProfile = typeof xrDeviceProfiles.$inferInsert;
export type XrInteraction = typeof xrInteractions.$inferSelect;
export type NewXrInteraction = typeof xrInteractions.$inferInsert;
export type XrAnalyticEvent = typeof xrAnalytics.$inferSelect;
export type NewXrAnalyticEvent = typeof xrAnalytics.$inferInsert;
export type WebxrKnowledge = typeof webxrKnowledge.$inferSelect;
export type NewWebxrKnowledge = typeof webxrKnowledge.$inferInsert;
