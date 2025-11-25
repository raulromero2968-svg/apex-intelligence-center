/**
 * Sound Generator for TCG
 *
 * Procedural audio generation for TCG battles and world events.
 * Creates dynamic soundscapes based on game state.
 *
 * Features:
 * - Battle music generation
 * - Ambient soundscapes
 * - UI sound effects
 * - Spatial audio for 3D world
 */

// ============================================================================
// TYPES
// ============================================================================

export type MoodType = 'epic' | 'mysterious' | 'calm' | 'tense' | 'victory' | 'defeat';
export type SoundCategory = 'music' | 'sfx' | 'ambient' | 'ui';

export interface SoundConfig {
  mood: MoodType;
  tempo: number; // BPM
  key: string; // Musical key
  intensity: number; // 0-1
  duration: number; // seconds
}

export interface GeneratedSound {
  id: string;
  category: SoundCategory;
  config: SoundConfig;
  notes: Note[];
  duration: number;
  timestamp: Date;
}

export interface Note {
  pitch: number; // MIDI note number
  startTime: number; // seconds
  duration: number; // seconds
  velocity: number; // 0-127
  channel: number;
}

export interface SoundEffect {
  id: string;
  name: string;
  type: 'attack' | 'defend' | 'heal' | 'special' | 'ui' | 'ambient';
  frequency: number;
  duration: number;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface SpatialAudioConfig {
  position: [number, number, number];
  maxDistance: number;
  rolloffFactor: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MOOD_CONFIGS: Record<MoodType, Partial<SoundConfig>> = {
  epic: { tempo: 140, key: 'D minor', intensity: 0.9 },
  mysterious: { tempo: 80, key: 'E minor', intensity: 0.5 },
  calm: { tempo: 70, key: 'C major', intensity: 0.3 },
  tense: { tempo: 120, key: 'F# minor', intensity: 0.7 },
  victory: { tempo: 130, key: 'G major', intensity: 0.8 },
  defeat: { tempo: 60, key: 'A minor', intensity: 0.4 },
};

// MIDI note numbers for scales
export const SCALES: Record<string, number[]> = {
  'C major': [60, 62, 64, 65, 67, 69, 71, 72],
  'D minor': [62, 64, 65, 67, 69, 70, 72, 74],
  'E minor': [64, 66, 67, 69, 71, 72, 74, 76],
  'F# minor': [66, 68, 69, 71, 73, 74, 76, 78],
  'G major': [67, 69, 71, 72, 74, 76, 78, 79],
  'A minor': [69, 71, 72, 74, 76, 77, 79, 81],
};

export const CHORD_PROGRESSIONS: Record<MoodType, number[][]> = {
  epic: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [0, 2, 4]], // i-iv-v-i
  mysterious: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [6, 1, 3]],
  calm: [[0, 2, 4], [3, 5, 7], [2, 4, 6], [4, 6, 1]],
  tense: [[0, 2, 4], [6, 1, 3], [5, 0, 2], [0, 2, 4]],
  victory: [[0, 2, 4], [4, 6, 1], [3, 5, 7], [0, 2, 4]],
  defeat: [[0, 2, 4], [5, 0, 2], [6, 1, 3], [0, 2, 4]],
};

export const SOUND_EFFECTS: Record<string, SoundEffect> = {
  cardPlay: {
    id: 'sfx-card-play',
    name: 'Card Play',
    type: 'ui',
    frequency: 440,
    duration: 0.2,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
  },
  attack: {
    id: 'sfx-attack',
    name: 'Attack',
    type: 'attack',
    frequency: 200,
    duration: 0.3,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2 },
  },
  heal: {
    id: 'sfx-heal',
    name: 'Heal',
    type: 'heal',
    frequency: 880,
    duration: 0.5,
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.2 },
  },
  quantumCollapse: {
    id: 'sfx-quantum',
    name: 'Quantum Collapse',
    type: 'special',
    frequency: 1760,
    duration: 0.8,
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.4 },
  },
  entangle: {
    id: 'sfx-entangle',
    name: 'Entanglement',
    type: 'special',
    frequency: 660,
    duration: 1.0,
    envelope: { attack: 0.2, decay: 0.3, sustain: 0.3, release: 0.2 },
  },
};

// ============================================================================
// SOUND GENERATOR CLASS
// ============================================================================

export class SoundGenerator {
  private currentMood: MoodType;
  private audioContext: AudioContext | null;
  private masterGain: GainNode | null;
  private activeOscillators: Map<string, OscillatorNode>;

  constructor() {
    this.currentMood = 'calm';
    this.audioContext = null;
    this.masterGain = null;
    this.activeOscillators = new Map();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  initialize(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Generate battle theme
   */
  generateBattleTheme(mood: MoodType, duration: number = 30): GeneratedSound {
    const config: SoundConfig = {
      mood,
      ...MOOD_CONFIGS[mood],
      tempo: MOOD_CONFIGS[mood].tempo || 120,
      key: MOOD_CONFIGS[mood].key || 'C major',
      intensity: MOOD_CONFIGS[mood].intensity || 0.5,
      duration,
    };

    const notes = this.generateMelody(config);

    return {
      id: `theme-${Date.now()}`,
      category: 'music',
      config,
      notes,
      duration,
      timestamp: new Date(),
    };
  }

  /**
   * Generate melody notes
   */
  private generateMelody(config: SoundConfig): Note[] {
    const notes: Note[] = [];
    const scale = SCALES[config.key] || SCALES['C major'];
    const progression = CHORD_PROGRESSIONS[config.mood] || CHORD_PROGRESSIONS.calm;

    const beatDuration = 60 / config.tempo;
    const barsCount = Math.floor(config.duration / (beatDuration * 4));

    for (let bar = 0; bar < barsCount; bar++) {
      const chordIndex = bar % progression.length;
      const chord = progression[chordIndex];
      const barStartTime = bar * beatDuration * 4;

      // Bass note
      notes.push({
        pitch: scale[chord[0]] - 12,
        startTime: barStartTime,
        duration: beatDuration * 2,
        velocity: Math.floor(80 + config.intensity * 40),
        channel: 0,
      });

      // Chord notes
      for (let beat = 0; beat < 4; beat++) {
        const noteIndex = chord[beat % chord.length];
        const velocity = Math.floor(60 + config.intensity * 40 + Math.random() * 20);

        notes.push({
          pitch: scale[noteIndex],
          startTime: barStartTime + beat * beatDuration,
          duration: beatDuration * 0.8,
          velocity,
          channel: 1,
        });
      }

      // Melody (random from scale with preference for chord tones)
      for (let beat = 0; beat < 4; beat++) {
        if (Math.random() < 0.7) {
          const isChordTone = Math.random() < 0.6;
          const noteIndex = isChordTone
            ? chord[Math.floor(Math.random() * chord.length)]
            : Math.floor(Math.random() * scale.length);

          notes.push({
            pitch: scale[noteIndex] + 12,
            startTime: barStartTime + beat * beatDuration + Math.random() * beatDuration * 0.25,
            duration: beatDuration * (0.5 + Math.random() * 0.5),
            velocity: Math.floor(70 + config.intensity * 30 + Math.random() * 20),
            channel: 2,
          });
        }
      }
    }

    return notes;
  }

  /**
   * Play sound effect
   */
  playSoundEffect(effectId: string): void {
    if (!this.audioContext || !this.masterGain) return;

    const effect = SOUND_EFFECTS[effectId];
    if (!effect) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.frequency.value = effect.frequency;
    oscillator.type = effect.type === 'attack' ? 'sawtooth' : 'sine';

    const now = this.audioContext.currentTime;
    const { attack, decay, sustain, release } = effect.envelope;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, now + effect.duration);

    oscillator.start(now);
    oscillator.stop(now + effect.duration + release);

    this.activeOscillators.set(effectId, oscillator);

    oscillator.onended = () => {
      this.activeOscillators.delete(effectId);
    };
  }

  /**
   * Play note (for testing/preview)
   */
  playNote(note: Note): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);
    oscillator.type = 'sine';

    const now = this.audioContext.currentTime + note.startTime;
    gainNode.gain.setValueAtTime(note.velocity / 127, now);
    gainNode.gain.linearRampToValueAtTime(0, now + note.duration);

    oscillator.start(now);
    oscillator.stop(now + note.duration);
  }

  /**
   * Set mood (transitions music)
   */
  setMood(mood: MoodType): void {
    this.currentMood = mood;
  }

  /**
   * Get current mood
   */
  getMood(): MoodType {
    return this.currentMood;
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    for (const [id, oscillator] of this.activeOscillators) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped
      }
    }
    this.activeOscillators.clear();
  }

  /**
   * Dispose audio context
   */
  dispose(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert MIDI note to frequency
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Convert frequency to MIDI note
 */
export function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

/**
 * Get note name from MIDI number
 */
export function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}

/**
 * Generate ambient soundscape config
 */
export function generateAmbientConfig(zoneType: string): Partial<SoundConfig> {
  const configs: Record<string, Partial<SoundConfig>> = {
    market: { mood: 'calm', tempo: 80, intensity: 0.3 },
    arena: { mood: 'tense', tempo: 110, intensity: 0.6 },
    wilderness: { mood: 'mysterious', tempo: 70, intensity: 0.4 },
    city: { mood: 'calm', tempo: 90, intensity: 0.4 },
    quantum: { mood: 'mysterious', tempo: 60, intensity: 0.5 },
  };

  return configs[zoneType] || configs.market;
}
