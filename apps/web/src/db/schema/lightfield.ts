/**
 * Light Field Display Schema for Apex Intelligence
 *
 * Implements pack-lfd-001 architecture for holographic visualization:
 * - Quilt assets for multi-view rendering
 * - Display calibration profiles
 * - Volumetric scene configurations
 * - Analytics for holographic engagement
 *
 * Enables glasses-free 3D for TCG cards, market dashboards, and collaborative viewing.
 *
 * @see pack-lfd-001 for domain mapping
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// QUILT ASSETS (Multi-View Light Field Textures)
// ============================================================================

/**
 * Quilt Assets - Multi-view texture atlases for light field rendering
 *
 * A "quilt" is a texture containing multiple perspective views (45-100)
 * arranged in a grid, used by Looking Glass displays to create
 * glasses-free 3D imagery.
 */
export const quiltAssets = pgTable('quilt_assets', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Asset identification
  name: text('name').notNull(),
  description: text('description'),

  // Owner
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(false).notNull(),

  // Source model reference
  sourceModelUrl: text('source_model_url'), // Original glTF/OBJ URL
  sourceModelType: text('source_model_type', {
    enum: ['gltf', 'glb', 'obj', 'fbx', 'usdz']
  }),

  // Quilt configuration
  quiltConfig: jsonb('quilt_config').$type<{
    viewCount: number; // Number of views (45, 60, 100)
    columns: number; // Grid columns
    rows: number; // Grid rows
    viewWidth: number; // Width per view (px)
    viewHeight: number; // Height per view (px)
    totalWidth: number; // Total texture width
    totalHeight: number; // Total texture height
    viewCone: number; // Viewing cone angle (degrees)
    depthiness: number; // Depth exaggeration factor (0.5-2.0)
  }>().notNull(),

  // Generated quilt texture
  quiltTextureUrl: text('quilt_texture_url'), // URL to generated quilt image
  quiltFormat: text('quilt_format', {
    enum: ['png', 'jpg', 'webp', 'ktx2']
  }).default('webp'),
  fileSizeBytes: integer('file_size_bytes'),

  // Fallback 2D preview
  fallbackPreviewUrl: text('fallback_preview_url'),

  // Category/tagging
  category: text('category', {
    enum: ['tcg_card', 'market_chart', 'scene', 'avatar', 'product', 'custom']
  }).default('custom').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),

  // Processing status
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed']
  }).default('pending').notNull(),
  errorMessage: text('error_message'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('idx_quilt_assets_owner').on(table.ownerId),
  categoryIdx: index('idx_quilt_assets_category').on(table.category),
  statusIdx: index('idx_quilt_assets_status').on(table.status),
  publicIdx: index('idx_quilt_assets_public').on(table.isPublic),
}));

// ============================================================================
// DISPLAY CALIBRATION
// ============================================================================

/**
 * Display Profiles - Hardware-specific calibration settings
 *
 * Different Looking Glass displays (Portrait, 16", 32", 65", 86")
 * require different rendering parameters for optimal viewing.
 */
export const displayProfiles = pgTable('display_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Profile identification
  name: text('name').notNull(),
  displayModel: text('display_model', {
    enum: ['portrait', 'lg_16', 'lg_27', 'lg_32', 'lg_65', 'lg_86', 'custom']
  }).notNull(),

  // Owner (null = system default)
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  isDefault: boolean('is_default').default(false),

  // Hardware specifications
  hardwareSpecs: jsonb('hardware_specs').$type<{
    screenWidth: number; // Physical width (mm)
    screenHeight: number; // Physical height (mm)
    resolution: { width: number; height: number };
    aspectRatio: number;
    subpixelLayout: 'rgb' | 'rbg' | 'bgr' | 'brg';
    lenticularPitch: number; // Lenticular lens pitch (mm)
    optimalViewingDistance: number; // cm
  }>().notNull(),

  // Rendering parameters
  renderParams: jsonb('render_params').$type<{
    viewCount: number; // 45-100 views
    viewCone: number; // Viewing angle (degrees)
    depthFactor: number; // Depth multiplier
    focusDistance: number; // Focus plane distance
    nearClip: number;
    farClip: number;
    tilt: number; // Display tilt angle
  }>().notNull(),

  // Quality presets
  qualityPresets: jsonb('quality_presets').$type<{
    low: { viewCount: number; resolution: number };
    medium: { viewCount: number; resolution: number };
    high: { viewCount: number; resolution: number };
    ultra: { viewCount: number; resolution: number };
  }>(),

  // Calibration data
  calibrationData: jsonb('calibration_data').$type<{
    centerView: number;
    viewOffset: number;
    pitchCorrection: number;
    slopeCorrection: number;
    calibratedAt?: string;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('idx_display_profiles_owner').on(table.ownerId),
  modelIdx: index('idx_display_profiles_model').on(table.displayModel),
  defaultIdx: index('idx_display_profiles_default').on(table.isDefault),
}));

// ============================================================================
// VOLUMETRIC SCENES
// ============================================================================

/**
 * Volumetric Scenes - 3D scene configurations for holographic viewing
 *
 * Combines multiple quilt assets with positioning, lighting,
 * and interaction settings for complete holographic experiences.
 */
export const volumetricScenes = pgTable('volumetric_scenes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Scene identification
  name: text('name').notNull(),
  description: text('description'),

  // Owner
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(false).notNull(),

  // Scene type
  sceneType: text('scene_type', {
    enum: ['card_showcase', 'market_dashboard', 'data_visualization', 'product_display', 'custom']
  }).notNull(),

  // Scene configuration
  sceneConfig: jsonb('scene_config').$type<{
    backgroundColor: string;
    ambientLight: { color: string; intensity: number };
    directionalLight?: { color: string; intensity: number; position: [number, number, number] };
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    fov: number;
    autoRotate?: boolean;
    rotationSpeed?: number;
  }>().notNull(),

  // Objects in scene (references to quilt assets or external models)
  objects: jsonb('objects').$type<Array<{
    id: string;
    type: 'quilt' | 'model' | 'chart' | 'text';
    assetId?: string; // Reference to quiltAssets.id
    modelUrl?: string; // Direct model URL
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    metadata?: Record<string, any>;
  }>>().default([]),

  // Data bindings (for live data visualization)
  dataBindings: jsonb('data_bindings').$type<Array<{
    objectId: string;
    dataSource: string; // API endpoint or data key
    property: string; // Property to bind (e.g., 'height', 'color')
    transform?: string; // Optional transform expression
  }>>(),

  // Interaction settings
  interactions: jsonb('interactions').$type<{
    enableRotation: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    enableObjectSelection: boolean;
    hoverEffect?: string;
    clickAction?: string;
  }>().default({
    enableRotation: true,
    enableZoom: true,
    enablePan: false,
    enableObjectSelection: true,
  }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('idx_volumetric_scenes_owner').on(table.ownerId),
  typeIdx: index('idx_volumetric_scenes_type').on(table.sceneType),
  publicIdx: index('idx_volumetric_scenes_public').on(table.isPublic),
}));

// ============================================================================
// HOLOGRAPHIC ANALYTICS
// ============================================================================

/**
 * Holo View Events - Track holographic viewing engagement
 */
export const holoViewEvents = pgTable('holo_view_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Context
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),

  // What was viewed
  assetType: text('asset_type', {
    enum: ['quilt', 'scene', 'chart']
  }).notNull(),
  assetId: uuid('asset_id'),

  // Display info
  displayProfile: text('display_profile'), // Profile name or 'fallback_2d'
  displayModel: text('display_model'),

  // View metrics
  viewDurationMs: integer('view_duration_ms').notNull(),
  interactionCount: integer('interaction_count').default(0),

  // Performance metrics
  performanceMetrics: jsonb('performance_metrics').$type<{
    avgFps: number;
    minFps: number;
    maxFps: number;
    frameDrops: number;
    gpuUsage?: number;
    renderTimeMs?: number;
  }>(),

  // Quality settings used
  qualityLevel: text('quality_level', {
    enum: ['low', 'medium', 'high', 'ultra', 'auto']
  }).default('auto'),
  viewCount: integer('view_count'), // Actual views rendered

  // Device info
  deviceInfo: jsonb('device_info').$type<{
    browser?: string;
    platform?: string;
    gpu?: string;
    screenResolution?: string;
    hasWebXR?: boolean;
  }>(),

  // Timestamp
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_holo_view_events_user').on(table.userId),
  assetIdx: index('idx_holo_view_events_asset').on(table.assetType, table.assetId),
  timestampIdx: index('idx_holo_view_events_timestamp').on(table.timestamp.desc()),
}));

// ============================================================================
// LIGHT FIELD KNOWLEDGE (RAG Domain Pack)
// ============================================================================

/**
 * Light Field Knowledge - RAG documents for holographic guidance
 */
export const lightFieldKnowledge = pgTable('light_field_knowledge', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Document type
  documentType: text('document_type', {
    enum: ['principle', 'technique', 'hardware', 'optimization', 'troubleshooting', 'example']
  }).notNull(),

  // Content
  title: text('title').notNull(),
  content: text('content').notNull(),

  // Categorization
  domain: text('domain', {
    enum: ['rendering', 'hardware', 'calibration', 'performance', 'design', 'general']
  }).notNull(),

  tags: jsonb('tags').$type<string[]>().default([]),

  // Source reference
  sourceRef: text('source_ref'), // e.g., 'pack-lfd-001 §3.1'

  // Metadata
  metadata: jsonb('metadata').$type<{
    author?: string;
    version?: string;
    hardwareRelevant?: string[];
    reliability?: number;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_light_field_knowledge_type').on(table.documentType),
  domainIdx: index('idx_light_field_knowledge_domain').on(table.domain),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const quiltAssetsRelations = relations(quiltAssets, ({ one }) => ({
  owner: one(users, {
    fields: [quiltAssets.ownerId],
    references: [users.id],
  }),
}));

export const displayProfilesRelations = relations(displayProfiles, ({ one }) => ({
  owner: one(users, {
    fields: [displayProfiles.ownerId],
    references: [users.id],
  }),
}));

export const volumetricScenesRelations = relations(volumetricScenes, ({ one }) => ({
  owner: one(users, {
    fields: [volumetricScenes.ownerId],
    references: [users.id],
  }),
}));

export const holoViewEventsRelations = relations(holoViewEvents, ({ one }) => ({
  user: one(users, {
    fields: [holoViewEvents.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QuiltAsset = typeof quiltAssets.$inferSelect;
export type NewQuiltAsset = typeof quiltAssets.$inferInsert;
export type DisplayProfile = typeof displayProfiles.$inferSelect;
export type NewDisplayProfile = typeof displayProfiles.$inferInsert;
export type VolumetricScene = typeof volumetricScenes.$inferSelect;
export type NewVolumetricScene = typeof volumetricScenes.$inferInsert;
export type HoloViewEvent = typeof holoViewEvents.$inferSelect;
export type NewHoloViewEvent = typeof holoViewEvents.$inferInsert;
export type LightFieldKnowledge = typeof lightFieldKnowledge.$inferSelect;
export type NewLightFieldKnowledge = typeof lightFieldKnowledge.$inferInsert;
