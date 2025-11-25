/**
 * Gesture Fusion Service
 *
 * Implements pack-visionos-001 §2.2 (Gesture Binding) and §3.2 (Spatial Intent Tool).
 * Fuses gaze tracking with hand gestures for natural spatial interactions.
 *
 * Features:
 * - Gaze + pinch compound gesture detection
 * - Multi-hand gesture recognition
 * - Gesture intent interpretation
 * - Binding management and execution
 *
 * @see pack-visionos-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, or, desc, inArray } from 'drizzle-orm';
import {
  gestureBindings,
  type GestureBinding,
  type NewGestureBinding,
} from '@/db/schema/visionos';

// ============================================================================
// TYPES
// ============================================================================

export type GestureType =
  | 'gaze'
  | 'pinch'
  | 'double_pinch'
  | 'drag'
  | 'rotate'
  | 'scale'
  | 'tap'
  | 'long_press'
  | 'swipe'
  | 'gaze_pinch'
  | 'gaze_drag'
  | 'two_hand_scale'
  | 'two_hand_rotate';

export type ActionType =
  | 'select'
  | 'activate'
  | 'toggle'
  | 'open_detail'
  | 'add_to_cart'
  | 'buy'
  | 'sell'
  | 'favorite'
  | 'compare'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'dismiss'
  | 'navigate'
  | 'play_animation'
  | 'trigger_event'
  | 'custom';

export interface GestureInput {
  type: GestureType;
  timestamp: number;
  confidence: number;

  // Gaze data
  gazeTarget?: [number, number, number];
  gazeEntityId?: string;
  gazeDuration?: number;

  // Hand data
  hand?: 'left' | 'right';
  handPosition?: [number, number, number];
  fingerPositions?: Record<string, [number, number, number]>;
  pinchStrength?: number;

  // Two-hand data
  secondHand?: {
    position: [number, number, number];
    pinchStrength: number;
  };

  // Motion data
  velocity?: [number, number, number];
  direction?: [number, number, number];
  distance?: number;
}

export interface GestureIntent {
  action: ActionType;
  confidence: number;
  targetEntityId?: string;
  parameters: Record<string, unknown>;
  binding?: GestureBinding;
}

export interface GestureState {
  activeGestures: Map<GestureType, GestureInput>;
  gazeTarget: [number, number, number] | null;
  gazeEntityId: string | null;
  gazeDwellStart: number | null;
  leftHandState: HandState | null;
  rightHandState: HandState | null;
}

export interface HandState {
  position: [number, number, number];
  rotation: [number, number, number, number];
  pinchStrength: number;
  isPinching: boolean;
  pinchStartTime: number | null;
  dragStartPosition: [number, number, number] | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default gesture detection thresholds
 */
export const DEFAULT_THRESHOLDS = {
  // Pinch
  pinchActivate: 0.8, // Strength to start pinch
  pinchRelease: 0.3, // Strength to end pinch
  doublePinchWindow: 400, // ms between pinches

  // Gaze
  gazeDwellTime: 800, // ms to trigger dwell
  gazeDwellRadius: 2.0, // degrees

  // Drag
  dragMinDistance: 0.02, // meters to start drag
  dragVelocityThreshold: 0.1, // m/s

  // Long press
  longPressTime: 500, // ms

  // Swipe
  swipeMinDistance: 0.1, // meters
  swipeMinVelocity: 0.5, // m/s

  // Two-hand
  twoHandMinSeparation: 0.1, // meters
  scaleMinRatio: 0.1, // 10% change to register
  rotateMinAngle: 10, // degrees

  // General
  confidenceThreshold: 0.7,
};

/**
 * Default action mappings for common TCG interactions
 */
export const TCG_DEFAULT_BINDINGS: Partial<NewGestureBinding>[] = [
  {
    name: 'Select Card',
    gestureType: 'gaze_pinch',
    targetSpec: { targetType: 'entity_type', entityTypes: ['card'] },
    actionType: 'select',
    feedbackConfig: { haptic: 'selection', visualEffect: 'highlight' },
  },
  {
    name: 'View Card Details',
    gestureType: 'double_pinch',
    targetSpec: { targetType: 'entity_type', entityTypes: ['card'] },
    actionType: 'open_detail',
    feedbackConfig: { haptic: 'medium', visualEffect: 'scale' },
  },
  {
    name: 'Add to Favorites',
    gestureType: 'long_press',
    targetSpec: { targetType: 'entity_type', entityTypes: ['card'] },
    actionType: 'favorite',
    gestureParams: { minDuration: 600 },
    feedbackConfig: { haptic: 'success', visualEffect: 'pulse' },
  },
  {
    name: 'Move Card',
    gestureType: 'gaze_drag',
    targetSpec: { targetType: 'entity_type', entityTypes: ['card'] },
    actionType: 'move',
    feedbackConfig: { visualEffect: 'highlight' },
  },
  {
    name: 'Rotate View',
    gestureType: 'drag',
    targetSpec: { targetType: 'scene' },
    actionType: 'rotate',
    gestureParams: { direction: 'horizontal' },
  },
  {
    name: 'Scale Content',
    gestureType: 'two_hand_scale',
    targetSpec: { targetType: 'scene' },
    actionType: 'scale',
  },
  {
    name: 'Dismiss Popup',
    gestureType: 'swipe',
    targetSpec: { targetType: 'entity_type', entityTypes: ['window'] },
    actionType: 'dismiss',
    gestureParams: { direction: 'horizontal', minDistance: 0.15 },
    feedbackConfig: { haptic: 'light' },
  },
];

// ============================================================================
// GESTURE DETECTION
// ============================================================================

/**
 * Create initial gesture state
 */
export function createGestureState(): GestureState {
  return {
    activeGestures: new Map(),
    gazeTarget: null,
    gazeEntityId: null,
    gazeDwellStart: null,
    leftHandState: null,
    rightHandState: null,
  };
}

/**
 * Update gaze tracking state
 */
export function updateGazeState(
  state: GestureState,
  target: [number, number, number] | null,
  entityId: string | null,
  timestamp: number
): GestureState {
  const newState = { ...state };

  // Check if gaze moved to new target
  const targetChanged =
    entityId !== state.gazeEntityId ||
    (target && state.gazeTarget && distance3D(target, state.gazeTarget) > 0.05);

  if (targetChanged) {
    newState.gazeTarget = target;
    newState.gazeEntityId = entityId;
    newState.gazeDwellStart = target ? timestamp : null;
  }

  return newState;
}

/**
 * Update hand tracking state
 */
export function updateHandState(
  state: GestureState,
  hand: 'left' | 'right',
  position: [number, number, number],
  rotation: [number, number, number, number],
  pinchStrength: number,
  thresholds = DEFAULT_THRESHOLDS
): GestureState {
  const newState = { ...state };
  const currentHand = hand === 'left' ? state.leftHandState : state.rightHandState;

  // Determine pinch state with hysteresis
  const wasPinching = currentHand?.isPinching ?? false;
  const isPinching = wasPinching
    ? pinchStrength > thresholds.pinchRelease
    : pinchStrength > thresholds.pinchActivate;

  const handState: HandState = {
    position,
    rotation,
    pinchStrength,
    isPinching,
    pinchStartTime: isPinching && !wasPinching ? Date.now() : currentHand?.pinchStartTime ?? null,
    dragStartPosition:
      isPinching && !wasPinching ? position : currentHand?.dragStartPosition ?? null,
  };

  if (hand === 'left') {
    newState.leftHandState = handState;
  } else {
    newState.rightHandState = handState;
  }

  return newState;
}

/**
 * Detect gestures from current state
 */
export function detectGestures(
  state: GestureState,
  timestamp: number,
  thresholds = DEFAULT_THRESHOLDS
): GestureInput[] {
  const gestures: GestureInput[] = [];

  // Gaze dwell detection
  if (state.gazeTarget && state.gazeDwellStart) {
    const dwellDuration = timestamp - state.gazeDwellStart;
    if (dwellDuration >= thresholds.gazeDwellTime) {
      gestures.push({
        type: 'gaze',
        timestamp,
        confidence: Math.min(1, dwellDuration / (thresholds.gazeDwellTime * 1.5)),
        gazeTarget: state.gazeTarget,
        gazeEntityId: state.gazeEntityId ?? undefined,
        gazeDuration: dwellDuration,
      });
    }
  }

  // Single hand gestures
  for (const [hand, handState] of [
    ['left', state.leftHandState],
    ['right', state.rightHandState],
  ] as const) {
    if (!handState) continue;

    // Pinch detection
    if (handState.isPinching && handState.pinchStartTime) {
      const pinchDuration = timestamp - handState.pinchStartTime;

      // Basic pinch
      gestures.push({
        type: 'pinch',
        timestamp,
        confidence: handState.pinchStrength,
        hand,
        handPosition: handState.position,
        pinchStrength: handState.pinchStrength,
      });

      // Long press
      if (pinchDuration >= thresholds.longPressTime) {
        gestures.push({
          type: 'long_press',
          timestamp,
          confidence: Math.min(1, pinchDuration / (thresholds.longPressTime * 1.2)),
          hand,
          handPosition: handState.position,
        });
      }

      // Drag detection
      if (handState.dragStartPosition) {
        const dragDistance = distance3D(handState.position, handState.dragStartPosition);
        if (dragDistance >= thresholds.dragMinDistance) {
          gestures.push({
            type: 'drag',
            timestamp,
            confidence: Math.min(1, dragDistance / 0.1),
            hand,
            handPosition: handState.position,
            distance: dragDistance,
            direction: normalize3D(subtract3D(handState.position, handState.dragStartPosition)),
          });
        }
      }
    }
  }

  // Compound gaze + pinch
  if (
    state.gazeEntityId &&
    (state.leftHandState?.isPinching || state.rightHandState?.isPinching)
  ) {
    const pinchingHand = state.leftHandState?.isPinching
      ? state.leftHandState
      : state.rightHandState;

    gestures.push({
      type: 'gaze_pinch',
      timestamp,
      confidence: Math.min(
        pinchingHand?.pinchStrength ?? 0,
        state.gazeDwellStart ? 1 : 0.5
      ),
      gazeTarget: state.gazeTarget ?? undefined,
      gazeEntityId: state.gazeEntityId,
      handPosition: pinchingHand?.position,
      pinchStrength: pinchingHand?.pinchStrength,
    });
  }

  // Two-hand gestures
  if (state.leftHandState?.isPinching && state.rightHandState?.isPinching) {
    const separation = distance3D(state.leftHandState.position, state.rightHandState.position);

    if (separation >= thresholds.twoHandMinSeparation) {
      // Two-hand scale
      gestures.push({
        type: 'two_hand_scale',
        timestamp,
        confidence: Math.min(
          state.leftHandState.pinchStrength,
          state.rightHandState.pinchStrength
        ),
        handPosition: state.leftHandState.position,
        secondHand: {
          position: state.rightHandState.position,
          pinchStrength: state.rightHandState.pinchStrength,
        },
        distance: separation,
      });

      // Two-hand rotate
      gestures.push({
        type: 'two_hand_rotate',
        timestamp,
        confidence: Math.min(
          state.leftHandState.pinchStrength,
          state.rightHandState.pinchStrength
        ),
        handPosition: state.leftHandState.position,
        secondHand: {
          position: state.rightHandState.position,
          pinchStrength: state.rightHandState.pinchStrength,
        },
      });
    }
  }

  return gestures;
}

// ============================================================================
// INTENT INTERPRETATION
// ============================================================================

/**
 * Match gesture input against bindings to determine intent
 */
export async function interpretGestureIntent(
  gesture: GestureInput,
  sceneId?: string,
  entityContext?: { entityId: string; entityType: string; tags: string[] }
): Promise<GestureIntent | null> {
  // Fetch applicable bindings
  const conditions = [
    eq(gestureBindings.gestureType, gesture.type),
    eq(gestureBindings.isEnabled, true),
  ];

  if (sceneId) {
    conditions.push(
      or(
        eq(gestureBindings.sceneId, sceneId),
        eq(gestureBindings.isGlobal, true)
      )!
    );
  } else {
    conditions.push(eq(gestureBindings.isGlobal, true));
  }

  const bindings = await db
    .select()
    .from(gestureBindings)
    .where(and(...conditions))
    .orderBy(desc(gestureBindings.priority))
    .execute();

  // Find best matching binding
  for (const binding of bindings) {
    if (matchesTarget(binding, gesture, entityContext)) {
      if (matchesParams(binding, gesture)) {
        if (matchesConditions(binding, gesture)) {
          return {
            action: binding.actionType as ActionType,
            confidence: gesture.confidence,
            targetEntityId: gesture.gazeEntityId,
            parameters: buildActionParams(binding, gesture),
            binding,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if gesture matches binding target specification
 */
function matchesTarget(
  binding: GestureBinding,
  gesture: GestureInput,
  entityContext?: { entityId: string; entityType: string; tags: string[] }
): boolean {
  const spec = binding.targetSpec as {
    targetType: string;
    entityId?: string;
    entityTypes?: string[];
    tags?: string[];
  } | null;

  if (!spec) return true; // No target spec = matches all

  switch (spec.targetType) {
    case 'any':
      return true;

    case 'scene':
      return !gesture.gazeEntityId; // Scene-level gesture (not on entity)

    case 'entity':
      return gesture.gazeEntityId === spec.entityId;

    case 'entity_type':
      if (!entityContext) return false;
      return spec.entityTypes?.includes(entityContext.entityType) ?? false;

    case 'tag':
      if (!entityContext) return false;
      return spec.tags?.some((tag) => entityContext.tags.includes(tag)) ?? false;

    default:
      return false;
  }
}

/**
 * Check if gesture matches binding parameters
 */
function matchesParams(binding: GestureBinding, gesture: GestureInput): boolean {
  const params = binding.gestureParams as Record<string, unknown> | null;
  if (!params) return true;

  // Check duration requirements
  if (params.minDuration && gesture.type === 'long_press') {
    // Duration checked during detection
  }

  // Check direction requirements
  if (params.direction && gesture.direction) {
    const isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
    if (params.direction === 'horizontal' && !isHorizontal) return false;
    if (params.direction === 'vertical' && isHorizontal) return false;
  }

  // Check distance requirements
  if (params.minDistance && gesture.distance) {
    if (gesture.distance < (params.minDistance as number)) return false;
  }

  // Check hand requirements
  if (params.hand && gesture.hand) {
    if (params.hand !== 'any' && params.hand !== gesture.hand) return false;
  }

  return true;
}

/**
 * Check if gesture meets binding conditions
 */
function matchesConditions(binding: GestureBinding, gesture: GestureInput): boolean {
  const conditions = binding.conditions as Record<string, unknown> | null;
  if (!conditions) return true;

  // Require gaze on target
  if (conditions.requireGaze && !gesture.gazeEntityId) {
    return false;
  }

  // Confidence threshold
  const confidenceThreshold = (conditions.confidenceThreshold as number) ?? 0.7;
  if (gesture.confidence < confidenceThreshold) {
    return false;
  }

  return true;
}

/**
 * Build action parameters from binding and gesture
 */
function buildActionParams(
  binding: GestureBinding,
  gesture: GestureInput
): Record<string, unknown> {
  const baseParams = (binding.actionParams as Record<string, unknown>) ?? {};

  return {
    ...baseParams,
    gestureType: gesture.type,
    targetPosition: gesture.gazeTarget,
    handPosition: gesture.handPosition,
    confidence: gesture.confidence,
  };
}

// ============================================================================
// BINDING MANAGEMENT
// ============================================================================

/**
 * Create a gesture binding
 */
export async function createGestureBinding(
  data: NewGestureBinding
): Promise<GestureBinding> {
  const [binding] = await db
    .insert(gestureBindings)
    .values(data)
    .returning()
    .execute();

  return binding;
}

/**
 * Get gesture bindings for a scene
 */
export async function getSceneBindings(sceneId: string): Promise<GestureBinding[]> {
  return db
    .select()
    .from(gestureBindings)
    .where(
      or(eq(gestureBindings.sceneId, sceneId), eq(gestureBindings.isGlobal, true))
    )
    .orderBy(desc(gestureBindings.priority))
    .execute();
}

/**
 * Get global gesture bindings
 */
export async function getGlobalBindings(): Promise<GestureBinding[]> {
  return db
    .select()
    .from(gestureBindings)
    .where(eq(gestureBindings.isGlobal, true))
    .orderBy(desc(gestureBindings.priority))
    .execute();
}

/**
 * Update a gesture binding
 */
export async function updateGestureBinding(
  id: string,
  updates: Partial<NewGestureBinding>
): Promise<GestureBinding | null> {
  const [updated] = await db
    .update(gestureBindings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(gestureBindings.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Delete a gesture binding
 */
export async function deleteGestureBinding(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(gestureBindings)
    .where(eq(gestureBindings.id, id))
    .returning()
    .execute();

  return !!deleted;
}

/**
 * Initialize default TCG bindings for a scene
 */
export async function initializeTCGBindings(
  sceneId: string,
  ownerId?: string
): Promise<GestureBinding[]> {
  const bindings = await Promise.all(
    TCG_DEFAULT_BINDINGS.map((binding) =>
      createGestureBinding({
        ...binding,
        sceneId,
        ownerId,
        name: binding.name ?? 'Binding',
        gestureType: binding.gestureType ?? 'pinch',
        actionType: binding.actionType ?? 'select',
      })
    )
  );

  return bindings;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function distance3D(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
  );
}

function subtract3D(
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize3D(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}
