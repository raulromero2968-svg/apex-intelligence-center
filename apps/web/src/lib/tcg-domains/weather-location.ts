/**
 * Weather/Location-Based TCG Events
 *
 * Location-aware game events and weather-based card boosts.
 * Integrates real-world conditions into TCG gameplay.
 *
 * Features:
 * - Weather-based card stat modifiers
 * - Location-triggered events
 * - AR event spawning
 * - Time-of-day effects
 */

// ============================================================================
// TYPES
// ============================================================================

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'wind'
  | 'extreme_heat'
  | 'extreme_cold';

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';

export type LocationType =
  | 'urban'
  | 'suburban'
  | 'rural'
  | 'coastal'
  | 'mountain'
  | 'forest'
  | 'desert'
  | 'arctic';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // Celsius
  humidity: number; // Percentage
  windSpeed: number; // km/h
  precipitation: number; // mm/h
  visibility: number; // km
  timestamp: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  locationType: LocationType;
  placeName?: string;
  nearbyPois?: PointOfInterest[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'tcg_store' | 'event_venue' | 'landmark' | 'park' | 'arena';
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface CardBoost {
  elementType: string;
  statModifiers: Record<string, number>;
  duration: number; // minutes
  source: 'weather' | 'location' | 'time' | 'event';
  description: string;
}

export interface GameEvent {
  id: string;
  name: string;
  type: 'weather_spawn' | 'location_event' | 'timed_event' | 'ar_encounter';
  triggerConditions: EventTrigger;
  rewards: EventReward[];
  duration: number; // minutes
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface EventTrigger {
  weather?: WeatherCondition[];
  location?: LocationType[];
  timeOfDay?: TimeOfDay[];
  minPlayers?: number;
  proximity?: number; // km to POI
}

export interface EventReward {
  type: 'card' | 'currency' | 'boost' | 'item';
  id: string;
  quantity: number;
  rarity?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ELEMENT_WEATHER_BOOSTS: Record<WeatherCondition, Record<string, number>> = {
  clear: { fire: 1.2, light: 1.3 },
  cloudy: { air: 1.15, dark: 1.1 },
  rain: { water: 1.3, lightning: 1.2, fire: 0.8 },
  storm: { lightning: 1.5, water: 1.2, air: 1.3, fire: 0.6 },
  snow: { water: 1.15, dark: 1.1, fire: 0.7 },
  fog: { dark: 1.3, air: 1.1, light: 0.8 },
  wind: { air: 1.4, earth: 0.9 },
  extreme_heat: { fire: 1.5, water: 0.7, nature: 0.8 },
  extreme_cold: { water: 1.2, fire: 0.6, dark: 1.1 },
};

export const LOCATION_ELEMENT_AFFINITIES: Record<LocationType, string[]> = {
  urban: ['lightning', 'dark'],
  suburban: ['nature', 'air'],
  rural: ['nature', 'earth'],
  coastal: ['water', 'air'],
  mountain: ['earth', 'air'],
  forest: ['nature', 'dark'],
  desert: ['fire', 'earth'],
  arctic: ['water', 'dark'],
};

export const TIME_OF_DAY_EFFECTS: Record<TimeOfDay, Record<string, number>> = {
  dawn: { light: 1.2, dark: 0.9 },
  morning: { light: 1.1, nature: 1.1 },
  afternoon: { fire: 1.1, light: 1.0 },
  evening: { dark: 1.1, fire: 1.15 },
  night: { dark: 1.3, light: 0.8 },
  midnight: { dark: 1.4, light: 0.7 },
};

// ============================================================================
// WEATHER FUNCTIONS
// ============================================================================

/**
 * Get current time of day
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 || hour < 0) return 'night';
  return 'midnight';
}

/**
 * Parse weather condition from data
 */
export function parseWeatherCondition(data: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
}): WeatherCondition {
  // Extreme conditions first
  if (data.temperature > 40) return 'extreme_heat';
  if (data.temperature < -15) return 'extreme_cold';

  // Precipitation-based
  if (data.precipitation > 10 && data.windSpeed > 40) return 'storm';
  if (data.precipitation > 0 && data.temperature < 0) return 'snow';
  if (data.precipitation > 0) return 'rain';

  // Visibility/atmospheric
  if (data.humidity > 95) return 'fog';
  if (data.windSpeed > 50) return 'wind';
  if (data.cloudCover > 70) return 'cloudy';

  return 'clear';
}

/**
 * Get weather-based card boosts
 */
export function getWeatherBoosts(weather: WeatherData): CardBoost[] {
  const boosts: CardBoost[] = [];
  const elementBoosts = ELEMENT_WEATHER_BOOSTS[weather.condition] || {};

  for (const [element, multiplier] of Object.entries(elementBoosts)) {
    const isBoost = multiplier > 1;
    boosts.push({
      elementType: element,
      statModifiers: {
        attack: multiplier,
        special: multiplier,
        ...(isBoost ? {} : { defense: 1.1 }), // Compensate debuffs slightly
      },
      duration: 30,
      source: 'weather',
      description: isBoost
        ? `${element} cards boosted by ${Math.round((multiplier - 1) * 100)}% in ${weather.condition} weather`
        : `${element} cards weakened by ${Math.round((1 - multiplier) * 100)}% in ${weather.condition} weather`,
    });
  }

  return boosts;
}

// ============================================================================
// LOCATION FUNCTIONS
// ============================================================================

/**
 * Determine location type from coordinates (simplified)
 */
export function determineLocationType(
  latitude: number,
  longitude: number,
  populationDensity?: number
): LocationType {
  // Simplified heuristics (in production, use reverse geocoding)
  const absLat = Math.abs(latitude);

  if (absLat > 66) return 'arctic';
  if (absLat > 30 && longitude > -20 && longitude < 50) return 'desert'; // Rough Sahara region

  if (populationDensity !== undefined) {
    if (populationDensity > 5000) return 'urban';
    if (populationDensity > 1000) return 'suburban';
    if (populationDensity < 50) return 'rural';
  }

  // Default based on lat variation
  if (absLat > 45) return 'forest';
  return 'suburban';
}

/**
 * Get location-based element affinities
 */
export function getLocationAffinities(location: LocationData): CardBoost[] {
  const affinities = LOCATION_ELEMENT_AFFINITIES[location.locationType] || [];

  return affinities.map((element) => ({
    elementType: element,
    statModifiers: { attack: 1.15, defense: 1.1 },
    duration: 60,
    source: 'location' as const,
    description: `${element} cards have affinity in ${location.locationType} areas`,
  }));
}

/**
 * Calculate distance between coordinates
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby POIs
 */
export function findNearbyPois(
  location: LocationData,
  pois: PointOfInterest[],
  maxDistance: number = 5
): PointOfInterest[] {
  return pois
    .map((poi) => ({
      ...poi,
      distanceKm: calculateDistance(
        location.latitude,
        location.longitude,
        poi.latitude,
        poi.longitude
      ),
    }))
    .filter((poi) => poi.distanceKm <= maxDistance)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

const activeEvents: GameEvent[] = [];

/**
 * Check if event should trigger
 */
export function checkEventTrigger(
  event: GameEvent,
  context: {
    weather?: WeatherData;
    location?: LocationData;
    timeOfDay?: TimeOfDay;
    playerCount?: number;
    nearbyPois?: PointOfInterest[];
  }
): boolean {
  const { triggerConditions } = event;

  // Weather condition check
  if (triggerConditions.weather?.length && context.weather) {
    if (!triggerConditions.weather.includes(context.weather.condition)) {
      return false;
    }
  }

  // Location type check
  if (triggerConditions.location?.length && context.location) {
    if (!triggerConditions.location.includes(context.location.locationType)) {
      return false;
    }
  }

  // Time of day check
  if (triggerConditions.timeOfDay?.length && context.timeOfDay) {
    if (!triggerConditions.timeOfDay.includes(context.timeOfDay)) {
      return false;
    }
  }

  // Player count check
  if (triggerConditions.minPlayers && context.playerCount) {
    if (context.playerCount < triggerConditions.minPlayers) {
      return false;
    }
  }

  // Proximity check
  if (triggerConditions.proximity && context.nearbyPois) {
    const closeEnough = context.nearbyPois.some(
      (poi) => poi.distanceKm <= triggerConditions.proximity!
    );
    if (!closeEnough) return false;
  }

  return true;
}

/**
 * Trigger a game event
 */
export function triggerEvent(
  event: GameEvent,
  context: { weather?: WeatherData; location?: LocationData }
): GameEvent | null {
  if (!checkEventTrigger(event, context)) {
    return null;
  }

  const triggeredEvent: GameEvent = {
    ...event,
    isActive: true,
    startTime: new Date(),
    endTime: new Date(Date.now() + event.duration * 60000),
  };

  activeEvents.push(triggeredEvent);
  return triggeredEvent;
}

/**
 * Get all active events
 */
export function getActiveEvents(): GameEvent[] {
  const now = new Date();
  return activeEvents.filter(
    (e) => e.isActive && (!e.endTime || e.endTime > now)
  );
}

/**
 * Complete event and get rewards
 */
export function completeEvent(eventId: string): EventReward[] | null {
  const eventIndex = activeEvents.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) return null;

  const event = activeEvents[eventIndex];
  event.isActive = false;

  return event.rewards;
}

// ============================================================================
// PREDEFINED EVENTS
// ============================================================================

export const WEATHER_EVENTS: GameEvent[] = [
  {
    id: 'storm_surge',
    name: 'Storm Surge Challenge',
    type: 'weather_spawn',
    triggerConditions: { weather: ['storm'] },
    rewards: [
      { type: 'card', id: 'lightning_dragon', quantity: 1, rarity: 'rare' },
      { type: 'currency', id: 'storm_coins', quantity: 500 },
    ],
    duration: 30,
    isActive: false,
  },
  {
    id: 'foggy_mystery',
    name: 'Foggy Mystery Encounter',
    type: 'weather_spawn',
    triggerConditions: { weather: ['fog'], timeOfDay: ['night', 'midnight'] },
    rewards: [
      { type: 'card', id: 'shadow_wraith', quantity: 1, rarity: 'epic' },
      { type: 'boost', id: 'dark_vision', quantity: 1 },
    ],
    duration: 20,
    isActive: false,
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare Event',
    type: 'weather_spawn',
    triggerConditions: { weather: ['clear', 'extreme_heat'], timeOfDay: ['afternoon'] },
    rewards: [
      { type: 'card', id: 'phoenix_hatchling', quantity: 1, rarity: 'rare' },
      { type: 'currency', id: 'fire_essence', quantity: 300 },
    ],
    duration: 45,
    isActive: false,
  },
];

export const LOCATION_EVENTS: GameEvent[] = [
  {
    id: 'coastal_treasure',
    name: 'Coastal Treasure Hunt',
    type: 'location_event',
    triggerConditions: { location: ['coastal'] },
    rewards: [
      { type: 'card', id: 'sea_serpent', quantity: 1, rarity: 'rare' },
      { type: 'item', id: 'treasure_map', quantity: 1 },
    ],
    duration: 60,
    isActive: false,
  },
  {
    id: 'mountain_ascent',
    name: 'Mountain Summit Challenge',
    type: 'location_event',
    triggerConditions: { location: ['mountain'] },
    rewards: [
      { type: 'card', id: 'rock_titan', quantity: 1, rarity: 'epic' },
      { type: 'currency', id: 'summit_points', quantity: 1000 },
    ],
    duration: 90,
    isActive: false,
  },
  {
    id: 'urban_arena',
    name: 'Urban Arena Showdown',
    type: 'location_event',
    triggerConditions: { location: ['urban'], minPlayers: 4 },
    rewards: [
      { type: 'card', id: 'cyber_knight', quantity: 1, rarity: 'legendary' },
      { type: 'currency', id: 'arena_tokens', quantity: 2000 },
    ],
    duration: 120,
    isActive: false,
  },
];

// ============================================================================
// COMBINED BOOST CALCULATOR
// ============================================================================

/**
 * Get all active boosts for current conditions
 */
export function getAllActiveBoosts(
  weather: WeatherData,
  location: LocationData,
  time: Date = new Date()
): CardBoost[] {
  const boosts: CardBoost[] = [];

  // Weather boosts
  boosts.push(...getWeatherBoosts(weather));

  // Location affinities
  boosts.push(...getLocationAffinities(location));

  // Time of day effects
  const timeOfDay = getTimeOfDay(time);
  const timeEffects = TIME_OF_DAY_EFFECTS[timeOfDay] || {};

  for (const [element, multiplier] of Object.entries(timeEffects)) {
    if (multiplier !== 1) {
      boosts.push({
        elementType: element,
        statModifiers: { attack: multiplier, special: multiplier },
        duration: 60,
        source: 'time',
        description: `${element} cards affected by ${timeOfDay} conditions`,
      });
    }
  }

  return boosts;
}

/**
 * Apply boosts to card stats
 */
export function applyBoostsToCard(
  baseStats: Record<string, number>,
  element: string,
  boosts: CardBoost[]
): Record<string, number> {
  const modifiedStats = { ...baseStats };

  for (const boost of boosts) {
    if (boost.elementType === element) {
      for (const [stat, modifier] of Object.entries(boost.statModifiers)) {
        if (modifiedStats[stat] !== undefined) {
          modifiedStats[stat] = Math.round(modifiedStats[stat] * modifier);
        }
      }
    }
  }

  return modifiedStats;
}
