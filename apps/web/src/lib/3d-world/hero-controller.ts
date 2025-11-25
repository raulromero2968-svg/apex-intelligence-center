/**
 * Hero Controller
 *
 * Player character (hero) control system for the 3D world.
 * Handles movement, interactions, inventory, and stats.
 *
 * Features:
 * - WASD/arrow key movement
 * - Mouse look
 * - Interaction system
 * - Inventory management
 * - Quest tracking
 */

import { distance3D, lerp3D } from './scene-manager';

// ============================================================================
// TYPES
// ============================================================================

export interface HeroStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  experience: number;
  level: number;
  attackPower: number;
  defense: number;
  speed: number;
}

export interface HeroState {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  stats: HeroStats;
  inventory: InventoryItem[];
  equippedCards: string[];
  activeQuests: string[];
  currentZone: string;
  isMoving: boolean;
  isInteracting: boolean;
}

export interface InventoryItem {
  id: string;
  type: 'card' | 'potion' | 'artifact' | 'material';
  itemId: string;
  quantity: number;
  equipped: boolean;
}

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
}

export interface InteractionResult {
  success: boolean;
  type: string;
  target: string;
  outcome?: unknown;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_HERO_STATS: HeroStats = {
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  experience: 0,
  level: 1,
  attackPower: 10,
  defense: 5,
  speed: 5,
};

export const MOVEMENT_SPEEDS = {
  walk: 5,
  sprint: 10,
  strafe: 4,
};

export const INTERACTION_RANGE = 3;
export const MAX_INVENTORY_SIZE = 50;
export const MAX_EQUIPPED_CARDS = 6;

// ============================================================================
// HERO CONTROLLER CLASS
// ============================================================================

export class HeroController {
  private state: HeroState;
  private inputState: MovementInput;
  private interactionCooldown: number;
  private lastUpdateTime: number;

  constructor(id: string, name: string, initialPosition: [number, number, number] = [0, 0, 0]) {
    this.state = {
      id,
      name,
      position: initialPosition,
      rotation: [0, 0, 0],
      velocity: [0, 0, 0],
      stats: { ...DEFAULT_HERO_STATS },
      inventory: [],
      equippedCards: [],
      activeQuests: [],
      currentZone: 'market',
      isMoving: false,
      isInteracting: false,
    };

    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
    };

    this.interactionCooldown = 0;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Update hero state based on inputs
   */
  update(deltaTime: number): void {
    this.lastUpdateTime = Date.now();

    // Update cooldowns
    if (this.interactionCooldown > 0) {
      this.interactionCooldown = Math.max(0, this.interactionCooldown - deltaTime);
    }

    // Calculate movement
    const speed = this.inputState.sprint
      ? MOVEMENT_SPEEDS.sprint
      : MOVEMENT_SPEEDS.walk;

    const moveVector: [number, number, number] = [0, 0, 0];

    if (this.inputState.forward) moveVector[2] -= 1;
    if (this.inputState.backward) moveVector[2] += 1;
    if (this.inputState.left) moveVector[0] -= 1;
    if (this.inputState.right) moveVector[0] += 1;

    // Normalize and apply speed
    const length = Math.sqrt(moveVector[0] ** 2 + moveVector[2] ** 2);
    if (length > 0) {
      moveVector[0] = (moveVector[0] / length) * speed * deltaTime;
      moveVector[2] = (moveVector[2] / length) * speed * deltaTime;
      this.state.isMoving = true;
    } else {
      this.state.isMoving = false;
    }

    // Apply rotation to movement
    const cosY = Math.cos(this.state.rotation[1]);
    const sinY = Math.sin(this.state.rotation[1]);

    this.state.velocity[0] = moveVector[0] * cosY - moveVector[2] * sinY;
    this.state.velocity[2] = moveVector[0] * sinY + moveVector[2] * cosY;

    // Update position
    this.state.position[0] += this.state.velocity[0];
    this.state.position[2] += this.state.velocity[2];

    // Energy consumption
    if (this.state.isMoving && this.inputState.sprint) {
      this.state.stats.energy = Math.max(0, this.state.stats.energy - deltaTime * 10);
    } else {
      // Energy regen
      this.state.stats.energy = Math.min(
        this.state.stats.maxEnergy,
        this.state.stats.energy + deltaTime * 5
      );
    }
  }

  /**
   * Set movement input state
   */
  setInput(input: Partial<MovementInput>): void {
    Object.assign(this.inputState, input);
  }

  /**
   * Rotate hero (mouse look)
   */
  rotate(deltaX: number, deltaY: number): void {
    this.state.rotation[1] += deltaX * 0.002;
    this.state.rotation[0] = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, this.state.rotation[0] + deltaY * 0.002)
    );
  }

  /**
   * Move to position (pathfinding)
   */
  moveTo(target: [number, number, number]): void {
    // Simple direct movement - would use A* in production
    const direction = [
      target[0] - this.state.position[0],
      0,
      target[2] - this.state.position[2],
    ];
    const dist = Math.sqrt(direction[0] ** 2 + direction[2] ** 2);

    if (dist > 0.1) {
      this.state.rotation[1] = Math.atan2(direction[0], direction[2]);
      this.inputState.forward = true;
    } else {
      this.inputState.forward = false;
    }
  }

  /**
   * Teleport to position
   */
  teleport(position: [number, number, number]): void {
    this.state.position = [...position];
    this.state.velocity = [0, 0, 0];
    this.state.isMoving = false;
  }

  /**
   * Interact with object
   */
  interact(targetId: string, targetPosition: [number, number, number]): InteractionResult {
    if (this.interactionCooldown > 0) {
      return {
        success: false,
        type: 'cooldown',
        target: targetId,
        message: 'Interaction on cooldown',
      };
    }

    const dist = distance3D(this.state.position, targetPosition);
    if (dist > INTERACTION_RANGE) {
      return {
        success: false,
        type: 'range',
        target: targetId,
        message: 'Target too far away',
      };
    }

    this.state.isInteracting = true;
    this.interactionCooldown = 0.5; // 500ms cooldown

    // Interaction would trigger based on target type
    return {
      success: true,
      type: 'interact',
      target: targetId,
      message: `Interacted with ${targetId}`,
    };
  }

  /**
   * Add item to inventory
   */
  addToInventory(item: InventoryItem): boolean {
    if (this.state.inventory.length >= MAX_INVENTORY_SIZE) {
      return false;
    }

    // Check for stackable
    const existing = this.state.inventory.find(
      (i) => i.itemId === item.itemId && i.type === item.type
    );

    if (existing && (item.type === 'potion' || item.type === 'material')) {
      existing.quantity += item.quantity;
    } else {
      this.state.inventory.push({ ...item });
    }

    return true;
  }

  /**
   * Remove item from inventory
   */
  removeFromInventory(itemId: string, quantity: number = 1): boolean {
    const index = this.state.inventory.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    const item = this.state.inventory[index];
    if (item.quantity <= quantity) {
      this.state.inventory.splice(index, 1);
    } else {
      item.quantity -= quantity;
    }

    return true;
  }

  /**
   * Equip card
   */
  equipCard(cardId: string): boolean {
    if (this.state.equippedCards.length >= MAX_EQUIPPED_CARDS) {
      return false;
    }

    if (this.state.equippedCards.includes(cardId)) {
      return false;
    }

    this.state.equippedCards.push(cardId);
    return true;
  }

  /**
   * Unequip card
   */
  unequipCard(cardId: string): boolean {
    const index = this.state.equippedCards.indexOf(cardId);
    if (index === -1) return false;

    this.state.equippedCards.splice(index, 1);
    return true;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): { newHealth: number; isDead: boolean } {
    const effectiveDamage = Math.max(1, amount - this.state.stats.defense);
    this.state.stats.health = Math.max(0, this.state.stats.health - effectiveDamage);

    return {
      newHealth: this.state.stats.health,
      isDead: this.state.stats.health <= 0,
    };
  }

  /**
   * Heal
   */
  heal(amount: number): number {
    const oldHealth = this.state.stats.health;
    this.state.stats.health = Math.min(
      this.state.stats.maxHealth,
      this.state.stats.health + amount
    );
    return this.state.stats.health - oldHealth;
  }

  /**
   * Add experience
   */
  addExperience(amount: number): { newExp: number; leveledUp: boolean; newLevel: number } {
    this.state.stats.experience += amount;

    // Level up check (simple formula)
    const expForLevel = (level: number) => level * 100;
    let leveledUp = false;

    while (this.state.stats.experience >= expForLevel(this.state.stats.level)) {
      this.state.stats.experience -= expForLevel(this.state.stats.level);
      this.state.stats.level++;
      leveledUp = true;

      // Stat increases on level up
      this.state.stats.maxHealth += 10;
      this.state.stats.maxEnergy += 5;
      this.state.stats.attackPower += 2;
      this.state.stats.defense += 1;
      this.state.stats.health = this.state.stats.maxHealth;
      this.state.stats.energy = this.state.stats.maxEnergy;
    }

    return {
      newExp: this.state.stats.experience,
      leveledUp,
      newLevel: this.state.stats.level,
    };
  }

  /**
   * Get current state
   */
  getState(): HeroState {
    return { ...this.state };
  }

  /**
   * Set state (for loading)
   */
  setState(state: Partial<HeroState>): void {
    Object.assign(this.state, state);
  }

  /**
   * Serialize for saving
   */
  serialize(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Deserialize from save
   */
  static deserialize(data: string): HeroController {
    const state = JSON.parse(data) as HeroState;
    const controller = new HeroController(state.id, state.name, state.position);
    controller.setState(state);
    return controller;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate experience needed for level
 */
export function expForLevel(level: number): number {
  return level * 100;
}

/**
 * Calculate total experience for level
 */
export function totalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += expForLevel(i);
  }
  return total;
}

/**
 * Get level from total experience
 */
export function levelFromExp(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= expForLevel(level)) {
    remaining -= expForLevel(level);
    level++;
  }
  return level;
}
