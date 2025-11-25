/**
 * A/B Testing Experiment Engine
 *
 * Core experiment management and user assignment logic.
 * Implements knowledge-06-data-ab-testing experiment features.
 *
 * Features:
 * - Deterministic user assignment (hash-based)
 * - Traffic allocation
 * - Targeting rules evaluation
 * - Multi-variant support
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type ExperimentType = 'ab' | 'multivariate' | 'bandit' | 'holdout';
export type AssignmentStrategy = 'random' | 'deterministic' | 'sticky' | 'geo' | 'device';
export type TargetModule = 'webxr' | 'visionos' | 'mobile' | 'defense' | 'seo' | 'cua' | 'lightfield' | 'general';

export interface Variant {
  id: string;
  name: string;
  weight: number;
  isControl: boolean;
  config: Record<string, unknown>;
  featureFlags?: Record<string, boolean>;
}

export interface Experiment {
  id: string;
  name: string;
  status: ExperimentStatus;
  type: ExperimentType;
  targetModule: TargetModule;
  assignmentStrategy: AssignmentStrategy;
  trafficAllocation: number;
  variants: Variant[];
  targetingRules?: TargetingRules;
}

export interface TargetingRules {
  includeDevices?: string[];
  excludeDevices?: string[];
  includeRegions?: string[];
  excludeRegions?: string[];
  userAttributes?: Record<string, unknown>;
  customRules?: Array<{ field: string; operator: string; value: unknown }>;
}

export interface AssignmentContext {
  userId?: string;
  anonymousId?: string;
  sessionId?: string;
  deviceType?: string;
  platform?: string;
  region?: string;
  userAgent?: string;
  attributes?: Record<string, unknown>;
}

export interface AssignmentResult {
  experimentId: string;
  variantId: string;
  variantName: string;
  bucketValue: number;
  config: Record<string, unknown>;
  featureFlags?: Record<string, boolean>;
  assigned: boolean;
  reason: string;
}

// ============================================================================
// HASH FUNCTION (MurmurHash3-like for deterministic assignment)
// ============================================================================

function hashString(str: string, seed: number = 0): number {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < str.length; i++) {
    let k1 = str.charCodeAt(i);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  h1 ^= str.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Get bucket value (0-99) for user/experiment combination
 */
export function getBucketValue(userId: string, experimentId: string): number {
  const hash = hashString(`${experimentId}:${userId}`);
  return hash % 100;
}

// ============================================================================
// TARGETING EVALUATION
// ============================================================================

/**
 * Evaluate if user matches targeting rules
 */
export function evaluateTargeting(
  rules: TargetingRules | undefined,
  context: AssignmentContext
): { matches: boolean; reason: string } {
  if (!rules) {
    return { matches: true, reason: 'No targeting rules' };
  }

  // Device inclusion/exclusion
  if (rules.includeDevices?.length && context.deviceType) {
    if (!rules.includeDevices.includes(context.deviceType)) {
      return { matches: false, reason: `Device ${context.deviceType} not in include list` };
    }
  }

  if (rules.excludeDevices?.length && context.deviceType) {
    if (rules.excludeDevices.includes(context.deviceType)) {
      return { matches: false, reason: `Device ${context.deviceType} in exclude list` };
    }
  }

  // Region inclusion/exclusion
  if (rules.includeRegions?.length && context.region) {
    if (!rules.includeRegions.includes(context.region)) {
      return { matches: false, reason: `Region ${context.region} not in include list` };
    }
  }

  if (rules.excludeRegions?.length && context.region) {
    if (rules.excludeRegions.includes(context.region)) {
      return { matches: false, reason: `Region ${context.region} in exclude list` };
    }
  }

  // User attribute matching
  if (rules.userAttributes && context.attributes) {
    for (const [key, value] of Object.entries(rules.userAttributes)) {
      if (context.attributes[key] !== value) {
        return { matches: false, reason: `Attribute ${key} mismatch` };
      }
    }
  }

  // Custom rules evaluation
  if (rules.customRules?.length) {
    for (const rule of rules.customRules) {
      const fieldValue = context.attributes?.[rule.field];
      const matches = evaluateOperator(fieldValue, rule.operator, rule.value);
      if (!matches) {
        return { matches: false, reason: `Custom rule ${rule.field} ${rule.operator} failed` };
      }
    }
  }

  return { matches: true, reason: 'All targeting rules passed' };
}

function evaluateOperator(fieldValue: unknown, operator: string, ruleValue: unknown): boolean {
  switch (operator) {
    case 'eq':
    case '=':
      return fieldValue === ruleValue;
    case 'neq':
    case '!=':
      return fieldValue !== ruleValue;
    case 'gt':
    case '>':
      return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue > ruleValue;
    case 'gte':
    case '>=':
      return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue >= ruleValue;
    case 'lt':
    case '<':
      return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue < ruleValue;
    case 'lte':
    case '<=':
      return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue <= ruleValue;
    case 'contains':
      return typeof fieldValue === 'string' && typeof ruleValue === 'string' && fieldValue.includes(ruleValue);
    case 'in':
      return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
    case 'notIn':
      return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
    default:
      return false;
  }
}

// ============================================================================
// VARIANT SELECTION
// ============================================================================

/**
 * Select variant based on bucket value and weights
 */
export function selectVariant(variants: Variant[], bucketValue: number): Variant | null {
  if (variants.length === 0) return null;

  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  // Normalize bucket to weight space
  const normalizedBucket = (bucketValue / 100) * totalWeight;

  // Find variant
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (normalizedBucket < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return variants[variants.length - 1];
}

// ============================================================================
// MAIN ASSIGNMENT FUNCTION
// ============================================================================

/**
 * Assign user to experiment variant
 */
export function assignUserToExperiment(
  experiment: Experiment,
  context: AssignmentContext
): AssignmentResult {
  const userId = context.userId || context.anonymousId || context.sessionId;

  if (!userId) {
    return {
      experimentId: experiment.id,
      variantId: '',
      variantName: '',
      bucketValue: -1,
      config: {},
      assigned: false,
      reason: 'No user identifier provided',
    };
  }

  // Check experiment status
  if (experiment.status !== 'running') {
    return {
      experimentId: experiment.id,
      variantId: '',
      variantName: '',
      bucketValue: -1,
      config: {},
      assigned: false,
      reason: `Experiment is ${experiment.status}`,
    };
  }

  // Evaluate targeting
  const targetingResult = evaluateTargeting(experiment.targetingRules, context);
  if (!targetingResult.matches) {
    return {
      experimentId: experiment.id,
      variantId: '',
      variantName: '',
      bucketValue: -1,
      config: {},
      assigned: false,
      reason: targetingResult.reason,
    };
  }

  // Get bucket value
  const bucketValue = getBucketValue(userId, experiment.id);

  // Check traffic allocation
  if (bucketValue >= experiment.trafficAllocation * 100) {
    return {
      experimentId: experiment.id,
      variantId: '',
      variantName: '',
      bucketValue,
      config: {},
      assigned: false,
      reason: `Not in traffic allocation (bucket ${bucketValue} >= ${experiment.trafficAllocation * 100})`,
    };
  }

  // Select variant
  const variant = selectVariant(experiment.variants, bucketValue);

  if (!variant) {
    return {
      experimentId: experiment.id,
      variantId: '',
      variantName: '',
      bucketValue,
      config: {},
      assigned: false,
      reason: 'No variants available',
    };
  }

  return {
    experimentId: experiment.id,
    variantId: variant.id,
    variantName: variant.name,
    bucketValue,
    config: variant.config,
    featureFlags: variant.featureFlags,
    assigned: true,
    reason: `Assigned to ${variant.name} (bucket ${bucketValue})`,
  };
}

// ============================================================================
// BATCH ASSIGNMENT
// ============================================================================

/**
 * Get all active experiment assignments for a user
 */
export function getActiveAssignments(
  experiments: Experiment[],
  context: AssignmentContext
): Map<string, AssignmentResult> {
  const assignments = new Map<string, AssignmentResult>();

  for (const experiment of experiments) {
    const result = assignUserToExperiment(experiment, context);
    if (result.assigned) {
      assignments.set(experiment.id, result);
    }
  }

  return assignments;
}

/**
 * Get feature flags from all assignments
 */
export function getMergedFeatureFlags(assignments: Map<string, AssignmentResult>): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  for (const result of assignments.values()) {
    if (result.featureFlags) {
      Object.assign(flags, result.featureFlags);
    }
  }

  return flags;
}

// ============================================================================
// EXPERIMENT VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate experiment configuration
 */
export function validateExperiment(experiment: Partial<Experiment>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!experiment.name?.trim()) {
    errors.push({ field: 'name', message: 'Experiment name is required' });
  }

  if (!experiment.variants?.length) {
    errors.push({ field: 'variants', message: 'At least one variant is required' });
  }

  if (experiment.variants) {
    const controlCount = experiment.variants.filter((v) => v.isControl).length;
    if (controlCount === 0) {
      errors.push({ field: 'variants', message: 'At least one control variant is required' });
    }
    if (controlCount > 1) {
      errors.push({ field: 'variants', message: 'Only one control variant is allowed' });
    }

    const totalWeight = experiment.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight <= 0) {
      errors.push({ field: 'variants', message: 'Total variant weight must be positive' });
    }
  }

  if (
    experiment.trafficAllocation !== undefined &&
    (experiment.trafficAllocation < 0 || experiment.trafficAllocation > 1)
  ) {
    errors.push({ field: 'trafficAllocation', message: 'Traffic allocation must be between 0 and 1' });
  }

  return errors;
}
