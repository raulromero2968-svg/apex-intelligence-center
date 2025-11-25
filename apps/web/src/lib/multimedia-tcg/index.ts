/**
 * Multimedia TCG Module
 *
 * Procedural audio and visual generation for TCG experiences.
 * Creates dynamic soundscapes based on game state and player actions.
 *
 * Features:
 * - Battle music generation with mood-based composition
 * - Sound effects for card actions and abilities
 * - Ambient soundscapes per zone
 * - Spatial audio for 3D world integration
 *
 * @see 3d-world module for visual rendering
 * @see quantum-tcg module for game mechanics
 */

// Sound Generator
export {
  // Types
  type MoodType,
  type SoundCategory,
  type SoundConfig,
  type GeneratedSound,
  type Note,
  type SoundEffect,
  type SpatialAudioConfig,

  // Constants
  MOOD_CONFIGS,
  SCALES,
  CHORD_PROGRESSIONS,
  SOUND_EFFECTS,

  // Class
  SoundGenerator,

  // Helper Functions
  midiToFrequency,
  frequencyToMidi,
  midiToNoteName,
  generateAmbientConfig,
} from './sound-generator';

// ============================================================================
// INTEGRATION WITH GAME STATE
// ============================================================================

/**
 * Create audio manager for TCG session
 */
export function createAudioManager(): {
  soundGenerator: SoundGenerator;
  currentTheme: GeneratedSound | null;
  initialize: () => boolean;
  playBattleTheme: (mood: MoodType) => GeneratedSound;
  playCardEffect: (cardAction: string) => void;
  setZoneAmbience: (zoneType: string) => void;
  dispose: () => void;
} {
  const { SoundGenerator, generateAmbientConfig } = require('./sound-generator');

  const soundGenerator = new SoundGenerator();
  let currentTheme: GeneratedSound | null = null;

  return {
    soundGenerator,
    currentTheme,

    initialize(): boolean {
      return soundGenerator.initialize();
    },

    playBattleTheme(mood: MoodType): GeneratedSound {
      soundGenerator.setMood(mood);
      currentTheme = soundGenerator.generateBattleTheme(mood, 60);

      // Play generated notes
      for (const note of currentTheme.notes) {
        soundGenerator.playNote(note);
      }

      return currentTheme;
    },

    playCardEffect(cardAction: string): void {
      const effectMap: Record<string, string> = {
        play: 'cardPlay',
        attack: 'attack',
        heal: 'heal',
        quantum: 'quantumCollapse',
        entangle: 'entangle',
      };

      const effectId = effectMap[cardAction] || 'cardPlay';
      soundGenerator.playSoundEffect(effectId);
    },

    setZoneAmbience(zoneType: string): void {
      const config = generateAmbientConfig(zoneType);
      if (config.mood) {
        soundGenerator.setMood(config.mood);
      }
    },

    dispose(): void {
      soundGenerator.dispose();
      currentTheme = null;
    },
  };
}

/**
 * Map game events to audio triggers
 */
export function mapGameEventToAudio(
  event: {
    type: string;
    data?: Record<string, unknown>;
  },
  audioManager: ReturnType<typeof createAudioManager>
): void {
  switch (event.type) {
    case 'battle_start':
      audioManager.playBattleTheme('tense');
      break;

    case 'battle_victory':
      audioManager.playBattleTheme('victory');
      break;

    case 'battle_defeat':
      audioManager.playBattleTheme('defeat');
      break;

    case 'card_played':
      audioManager.playCardEffect('play');
      break;

    case 'card_attack':
      audioManager.playCardEffect('attack');
      break;

    case 'card_heal':
      audioManager.playCardEffect('heal');
      break;

    case 'quantum_effect':
      audioManager.playCardEffect('quantum');
      break;

    case 'entanglement':
      audioManager.playCardEffect('entangle');
      break;

    case 'zone_enter':
      if (event.data?.zone) {
        audioManager.setZoneAmbience(event.data.zone as string);
      }
      break;

    case 'boss_encounter':
      audioManager.playBattleTheme('epic');
      break;

    default:
      // Unknown event, no audio
      break;
  }
}

/**
 * Generate music based on battle intensity
 */
export function calculateBattleMood(battleState: {
  playerHealth: number;
  playerMaxHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  turnNumber: number;
  cardsRemaining: number;
}): MoodType {
  const playerHealthPercent = battleState.playerHealth / battleState.playerMaxHealth;
  const enemyHealthPercent = battleState.enemyHealth / battleState.enemyMaxHealth;

  // Player winning convincingly
  if (playerHealthPercent > 0.7 && enemyHealthPercent < 0.3) {
    return 'victory';
  }

  // Player losing badly
  if (playerHealthPercent < 0.3 && enemyHealthPercent > 0.7) {
    return 'defeat';
  }

  // Intense close battle
  if (playerHealthPercent < 0.5 && enemyHealthPercent < 0.5) {
    return 'epic';
  }

  // Low resources, high tension
  if (battleState.cardsRemaining < 5 || battleState.turnNumber > 15) {
    return 'tense';
  }

  // Default battle mood
  return 'tense';
}

import type { SoundGenerator, GeneratedSound, MoodType } from './sound-generator';
