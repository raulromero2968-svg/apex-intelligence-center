/**
 * visionOS Spatial Computing Database Schema
 *
 * Implements pack-visionos-001 architecture for Apple Vision Pro spatial apps.
 * Supports spatial scenes, gesture bindings, device calibration, and analytics.
 *
 * Tables:
 * - spatialScenes: visionOS app scene configurations
 * - spatialEntities: 3D entities within scenes (cards, charts, UI elements)
 * - gestureBindings: Gaze/gesture to action mappings
 * - deviceCalibrations: Vision Pro calibration profiles
 * - spatialAnalytics: AR interaction tracking events
 * - visionosKnowledge: RAG documents for spatial guidance
 *
 * @see pack-visionos-001 for domain mapping
 */

import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  real,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// SPATIAL SCENES
// ============================================================================

/**
 * Spatial scene configurations for visionOS apps
 *
 * Represents a complete spatial environment that can run in shared or full space mode.
 * Each scene contains entities, lighting, anchors, and interaction settings.
 */
export const spatialScenes = pgTable(
  'spatial_scenes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id'),
    isPublic: boolean('is_public').default(false).notNull(),

    // Scene type and mode
    sceneType: text('scene_type', {
      enum: ['tcg_catalog', 'market_dashboard', 'card_battle', 'portfolio_view', 'custom'],
    })
      .default('custom')
      .notNull(),
    spaceMode: text('space_mode', {
      enum: ['shared', 'full', 'progressive'], // Progressive starts shared, can go full
    })
      .default('shared')
      .notNull(),

    // Scene configuration (RealityKit scene settings)
    sceneConfig: jsonb('scene_config').$type<{
      // Environment
      backgroundColor?: string;
      environmentTexture?: string; // HDR environment map
      showFloor?: boolean;
      floorMaterial?: string;

      // Lighting
      ambientLight?: { color: string; intensity: number };
      directionalLights?: Array<{
        color: string;
        intensity: number;
        direction: [number, number, number];
        castsShadow?: boolean;
      }>;

      // Camera/viewpoint defaults
      defaultViewpoint?: {
        position: [number, number, number];
        target: [number, number, number];
      };

      // Physics
      enablePhysics?: boolean;
      gravity?: [number, number, number];
    }>(),

    // Anchor configuration for AR placement
    anchorConfig: jsonb('anchor_config').$type<{
      anchorType: 'world' | 'plane' | 'image' | 'face' | 'hand';
      planeAlignment?: 'horizontal' | 'vertical' | 'any';
      imageReference?: string; // For image anchors
      persistAnchors?: boolean;
    }>(),

    // Interaction settings
    interactionConfig: jsonb('interaction_config').$type<{
      enableGaze: boolean;
      enablePinch: boolean;
      enableDrag: boolean;
      enableRotation: boolean;
      enableScale: boolean;
      gazeDwellTime?: number; // ms before gaze triggers
      pinchThreshold?: number;
    }>(),

    // Multi-user settings (for shared experiences)
    multiUserConfig: jsonb('multi_user_config').$type<{
      enabled: boolean;
      maxParticipants?: number;
      syncMode?: 'realtime' | 'turn_based';
      shareAnchors?: boolean;
    }>(),

    // Platform compatibility
    platforms: jsonb('platforms').$type<string[]>().default(['visionos']),
    minVisionOSVersion: text('min_visionos_version').default('1.0'),

    // Metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    thumbnail: text('thumbnail'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_spatial_scenes_owner').on(table.ownerId),
    typeIdx: index('idx_spatial_scenes_type').on(table.sceneType),
    publicIdx: index('idx_spatial_scenes_public').on(table.isPublic),
  })
);

export type SpatialScene = typeof spatialScenes.$inferSelect;
export type NewSpatialScene = typeof spatialScenes.$inferInsert;

// ============================================================================
// SPATIAL ENTITIES
// ============================================================================

/**
 * 3D entities within spatial scenes
 *
 * Represents individual objects that can be placed, manipulated, and interacted with.
 * Supports USD/glTF models, primitive shapes, UI windows, and data visualizations.
 */
export const spatialEntities = pgTable(
  'spatial_entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sceneId: uuid('scene_id')
      .references(() => spatialScenes.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),

    // Entity type
    entityType: text('entity_type', {
      enum: ['model', 'primitive', 'window', 'chart', 'card', 'text', 'particle', 'volume'],
    }).notNull(),

    // Transform (position, rotation, scale in scene space)
    transform: jsonb('transform')
      .$type<{
        position: [number, number, number];
        rotation: [number, number, number, number]; // Quaternion
        scale: [number, number, number];
      }>()
      .notNull(),

    // Asset reference (for models)
    assetConfig: jsonb('asset_config').$type<{
      assetUrl?: string; // USD or glTF URL
      assetType?: 'usd' | 'usda' | 'usdz' | 'gltf' | 'glb';
      thumbnailUrl?: string;
      lodLevels?: Array<{ distance: number; assetUrl: string }>;
    }>(),

    // Primitive shape config
    primitiveConfig: jsonb('primitive_config').$type<{
      shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'capsule';
      dimensions: [number, number, number];
      segments?: number;
    }>(),

    // Material/appearance
    materialConfig: jsonb('material_config').$type<{
      type: 'pbr' | 'unlit' | 'shader';
      baseColor?: string;
      metallic?: number;
      roughness?: number;
      emissive?: string;
      opacity?: number;
      texture?: string;
      normalMap?: string;
    }>(),

    // Physics body (optional)
    physicsConfig: jsonb('physics_config').$type<{
      enabled: boolean;
      bodyType: 'static' | 'dynamic' | 'kinematic';
      mass?: number;
      collisionShape?: 'auto' | 'box' | 'sphere' | 'mesh';
      restitution?: number;
      friction?: number;
    }>(),

    // Interaction settings for this entity
    interactionConfig: jsonb('interaction_config').$type<{
      isInteractable: boolean;
      highlightOnGaze?: boolean;
      highlightColor?: string;
      hoverScale?: number;
      enableDrag?: boolean;
      enableRotate?: boolean;
      enableScale?: boolean;
      snapToSurface?: boolean;
    }>(),

    // Data binding for dynamic content (charts, cards)
    dataBinding: jsonb('data_binding').$type<{
      dataSource?: string; // API endpoint or data key
      refreshInterval?: number; // ms
      bindingType?: 'card_data' | 'price_data' | 'portfolio' | 'custom';
      mappings?: Record<string, string>; // data field → entity property
    }>(),

    // Animation configuration
    animationConfig: jsonb('animation_config').$type<{
      animations?: Array<{
        name: string;
        autoPlay?: boolean;
        loop?: boolean;
        speed?: number;
      }>;
      idleAnimation?: string;
      hoverAnimation?: string;
      selectAnimation?: string;
    }>(),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    sortOrder: integer('sort_order').default(0),
    isVisible: boolean('is_visible').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sceneIdx: index('idx_spatial_entities_scene').on(table.sceneId),
    typeIdx: index('idx_spatial_entities_type').on(table.entityType),
  })
);

export type SpatialEntity = typeof spatialEntities.$inferSelect;
export type NewSpatialEntity = typeof spatialEntities.$inferInsert;

// ============================================================================
// GESTURE BINDINGS
// ============================================================================

/**
 * Gesture binding configurations
 *
 * Maps gaze, pinch, drag, and other gestures to specific actions.
 * Supports compound gestures (gaze + pinch) and contextual bindings.
 */
export const gestureBindings = pgTable(
  'gesture_bindings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id'),
    sceneId: uuid('scene_id').references(() => spatialScenes.id, { onDelete: 'cascade' }),

    // Gesture input specification
    gestureType: text('gesture_type', {
      enum: [
        'gaze',
        'pinch',
        'double_pinch',
        'drag',
        'rotate',
        'scale',
        'tap',
        'long_press',
        'swipe',
        'gaze_pinch', // Compound: look + pinch
        'gaze_drag',
        'two_hand_scale',
        'two_hand_rotate',
      ],
    }).notNull(),

    // Gesture parameters
    gestureParams: jsonb('gesture_params').$type<{
      // Timing
      minDuration?: number; // ms for long press
      maxDuration?: number;
      dwellTime?: number; // ms for gaze dwell

      // Spatial
      minDistance?: number; // for drag/swipe
      maxDistance?: number;
      direction?: 'any' | 'horizontal' | 'vertical';

      // Hand
      hand?: 'left' | 'right' | 'any' | 'both';
      fingerMask?: number[]; // Which fingers involved

      // Thresholds
      pinchThreshold?: number; // 0-1
      confidenceThreshold?: number;
    }>(),

    // Target specification (what entities this binding applies to)
    targetSpec: jsonb('target_spec').$type<{
      targetType: 'entity' | 'entity_type' | 'tag' | 'scene' | 'any';
      entityId?: string;
      entityTypes?: string[];
      tags?: string[];
    }>(),

    // Action to trigger
    actionType: text('action_type', {
      enum: [
        'select',
        'activate',
        'toggle',
        'open_detail',
        'add_to_cart',
        'buy',
        'sell',
        'favorite',
        'compare',
        'move',
        'rotate',
        'scale',
        'dismiss',
        'navigate',
        'play_animation',
        'trigger_event',
        'custom',
      ],
    }).notNull(),

    // Action parameters
    actionParams: jsonb('action_params').$type<{
      // Navigation
      targetScene?: string;
      targetUrl?: string;

      // Animation
      animationName?: string;
      animationSpeed?: number;

      // Event
      eventName?: string;
      eventPayload?: Record<string, unknown>;

      // Custom
      customHandler?: string; // Function name to call
      customParams?: Record<string, unknown>;
    }>(),

    // Feedback configuration
    feedbackConfig: jsonb('feedback_config').$type<{
      haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error';
      sound?: string;
      visualEffect?: 'highlight' | 'pulse' | 'scale' | 'glow';
      visualDuration?: number;
    }>(),

    // Conditions for when binding is active
    conditions: jsonb('conditions').$type<{
      requireGaze?: boolean; // Must be looking at target
      requireProximity?: number; // Max distance in meters
      requireMode?: 'shared' | 'full';
      customCondition?: string;
    }>(),

    // Priority for conflict resolution
    priority: integer('priority').default(0),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    isGlobal: boolean('is_global').default(false).notNull(), // Apply across all scenes

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_gesture_bindings_owner').on(table.ownerId),
    sceneIdx: index('idx_gesture_bindings_scene').on(table.sceneId),
    gestureIdx: index('idx_gesture_bindings_gesture').on(table.gestureType),
  })
);

export type GestureBinding = typeof gestureBindings.$inferSelect;
export type NewGestureBinding = typeof gestureBindings.$inferInsert;

// ============================================================================
// DEVICE CALIBRATIONS
// ============================================================================

/**
 * Device calibration profiles for Vision Pro
 *
 * Stores user-specific and device-specific calibration data for optimal
 * gaze tracking, hand tracking, and spatial awareness.
 */
export const deviceCalibrations = pgTable(
  'device_calibrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id'),
    deviceId: text('device_id'), // Hardware identifier

    // Device info
    deviceType: text('device_type', {
      enum: ['vision_pro', 'vision_pro_dev', 'simulator'],
    })
      .default('vision_pro')
      .notNull(),
    osVersion: text('os_version'),
    firmwareVersion: text('firmware_version'),

    // Gaze tracking calibration
    gazeCalibration: jsonb('gaze_calibration').$type<{
      // Accuracy adjustments
      horizontalOffset: number; // degrees
      verticalOffset: number;
      accuracy: number; // 0-1 confidence

      // Dwell settings
      dwellRadius: number; // degrees
      dwellTime: number; // ms
      dwellFalloff: number; // ms to cancel dwell

      // Smoothing
      smoothingFactor: number; // 0-1
      predictionHorizon: number; // ms
    }>(),

    // Hand tracking calibration
    handCalibration: jsonb('hand_calibration').$type<{
      // Hand size normalization
      leftHandScale: number;
      rightHandScale: number;

      // Pinch thresholds
      pinchThreshold: number; // 0-1 distance
      pinchHysteresis: number; // release threshold

      // Tracking confidence
      minConfidence: number;
      smoothingFactor: number;

      // Workspace bounds
      workspaceBounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        minZ: number;
        maxZ: number;
      };
    }>(),

    // Spatial awareness calibration
    spatialCalibration: jsonb('spatial_calibration').$type<{
      // Room scale
      floorHeight: number; // meters relative to device
      ceilingHeight: number;

      // Comfort zone
      minViewDistance: number; // meters
      maxViewDistance: number;
      preferredContentDistance: number;

      // Motion sensitivity
      motionSensitivity: number; // 0-1, for comfort
      rotationSpeed: number;
    }>(),

    // Performance settings
    performanceProfile: jsonb('performance_profile').$type<{
      targetFrameRate: 90 | 96 | 120;
      renderScale: number; // 0.5-1.5
      foveatedRendering: boolean;
      foveationLevel: 'low' | 'medium' | 'high';
      dynamicResolution: boolean;
    }>(),

    // Accessibility settings
    accessibilityConfig: jsonb('accessibility_config').$type<{
      dwellControl: boolean; // Use dwell instead of pinch
      voiceControl: boolean;
      headPointer: boolean; // Use head movement as pointer
      reducedMotion: boolean;
      highContrast: boolean;
      textScale: number;
    }>(),

    // Calibration quality metrics
    calibrationQuality: jsonb('calibration_quality').$type<{
      gazeAccuracy: number; // 0-1
      handTrackingQuality: number;
      spatialMappingQuality: number;
      lastCalibrationDate: string;
      calibrationDuration: number; // seconds
    }>(),

    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_device_calibrations_user').on(table.userId),
    deviceIdx: index('idx_device_calibrations_device').on(table.deviceId),
  })
);

export type DeviceCalibration = typeof deviceCalibrations.$inferSelect;
export type NewDeviceCalibration = typeof deviceCalibrations.$inferInsert;

// ============================================================================
// SPATIAL ANALYTICS
// ============================================================================

/**
 * Spatial interaction analytics events
 *
 * Tracks user interactions in AR for understanding engagement patterns,
 * optimizing UX, and measuring feature effectiveness.
 */
export const spatialAnalytics = pgTable(
  'spatial_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: text('session_id').notNull(),
    userId: text('user_id'),
    sceneId: uuid('scene_id').references(() => spatialScenes.id),

    // Event classification
    eventType: text('event_type', {
      enum: [
        'session_start',
        'session_end',
        'scene_enter',
        'scene_exit',
        'mode_change',
        'entity_gaze',
        'entity_select',
        'entity_interact',
        'gesture_performed',
        'gesture_failed',
        'navigation',
        'error',
        'performance',
      ],
    }).notNull(),

    // Event details
    eventData: jsonb('event_data').$type<{
      // Entity interaction
      entityId?: string;
      entityType?: string;

      // Gaze data
      gazeTarget?: [number, number, number];
      gazeDuration?: number; // ms
      gazeConfidence?: number;

      // Gesture data
      gestureType?: string;
      gestureSuccess?: boolean;
      gestureConfidence?: number;
      gestureDuration?: number;

      // Navigation
      fromScene?: string;
      toScene?: string;
      transitionType?: string;

      // Mode
      spaceMode?: string;
      previousMode?: string;

      // Performance
      frameRate?: number;
      renderTime?: number;
      trackingQuality?: number;

      // Error
      errorCode?: string;
      errorMessage?: string;

      // Custom
      customData?: Record<string, unknown>;
    }>(),

    // Spatial context
    spatialContext: jsonb('spatial_context').$type<{
      headPosition: [number, number, number];
      headRotation: [number, number, number, number];
      leftHandPosition?: [number, number, number];
      rightHandPosition?: [number, number, number];
      roomBounds?: { width: number; depth: number; height: number };
    }>(),

    // Device context
    deviceContext: jsonb('device_context').$type<{
      deviceType: string;
      osVersion: string;
      batteryLevel?: number;
      thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
    }>(),

    // Timing
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    sessionDuration: real('session_duration'), // seconds since session start
  },
  (table) => ({
    sessionIdx: index('idx_spatial_analytics_session').on(table.sessionId),
    userIdx: index('idx_spatial_analytics_user').on(table.userId),
    sceneIdx: index('idx_spatial_analytics_scene').on(table.sceneId),
    typeIdx: index('idx_spatial_analytics_type').on(table.eventType),
    timestampIdx: index('idx_spatial_analytics_timestamp').on(table.timestamp),
  })
);

export type SpatialAnalytic = typeof spatialAnalytics.$inferSelect;
export type NewSpatialAnalytic = typeof spatialAnalytics.$inferInsert;

// ============================================================================
// VISIONOS KNOWLEDGE
// ============================================================================

/**
 * RAG knowledge base for visionOS development guidance
 *
 * Stores embeddings and content for spatial computing concepts, best practices,
 * framework documentation, and troubleshooting guides.
 */
export const visionosKnowledge = pgTable(
  'visionos_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Document classification
    documentType: text('document_type', {
      enum: [
        'framework', // SwiftUI, RealityKit, ARKit
        'concept', // Spatial computing concepts
        'pattern', // Design patterns
        'api', // API documentation
        'tutorial', // Step-by-step guides
        'troubleshooting', // Common issues
        'optimization', // Performance tips
        'porting', // iOS → visionOS migration
        'accessibility', // Accessibility guidance
      ],
    }).notNull(),

    // Content
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'),

    // Categorization
    framework: text('framework', {
      enum: ['swiftui', 'realitykit', 'arkit', 'metal', 'avfoundation', 'general'],
    }),
    topics: jsonb('topics').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),

    // Code samples
    codeExamples: jsonb('code_examples').$type<
      Array<{
        language: 'swift' | 'metal' | 'typescript';
        code: string;
        description?: string;
      }>
    >(),

    // References
    sourceRef: text('source_ref'), // pack reference
    externalLinks: jsonb('external_links').$type<
      Array<{
        title: string;
        url: string;
        type: 'documentation' | 'wwdc' | 'sample_code' | 'article';
      }>
    >(),

    // Version relevance
    minVersion: text('min_version'),
    maxVersion: text('max_version'),
    isDeprecated: boolean('is_deprecated').default(false).notNull(),

    // Metadata
    metadata: jsonb('metadata').$type<{
      reliability: number; // 0-1
      lastVerified?: string;
      contributors?: string[];
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('idx_visionos_knowledge_type').on(table.documentType),
    frameworkIdx: index('idx_visionos_knowledge_framework').on(table.framework),
  })
);

export type VisionOSKnowledge = typeof visionosKnowledge.$inferSelect;
export type NewVisionOSKnowledge = typeof visionosKnowledge.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const spatialScenesRelations = relations(spatialScenes, ({ many }) => ({
  entities: many(spatialEntities),
  gestureBindings: many(gestureBindings),
  analytics: many(spatialAnalytics),
}));

export const spatialEntitiesRelations = relations(spatialEntities, ({ one }) => ({
  scene: one(spatialScenes, {
    fields: [spatialEntities.sceneId],
    references: [spatialScenes.id],
  }),
}));

export const gestureBindingsRelations = relations(gestureBindings, ({ one }) => ({
  scene: one(spatialScenes, {
    fields: [gestureBindings.sceneId],
    references: [spatialScenes.id],
  }),
}));

export const spatialAnalyticsRelations = relations(spatialAnalytics, ({ one }) => ({
  scene: one(spatialScenes, {
    fields: [spatialAnalytics.sceneId],
    references: [spatialScenes.id],
  }),
}));
