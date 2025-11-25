/**
 * TCG Domain Expansions
 *
 * Additional game domain integrations for the TCG platform.
 * Includes finance, biology, and weather/location features.
 */

// Finance/Crypto Market
export {
  // Types
  type CryptoPrice,
  type NftMarketData,
  type TcgCardPrice,
  type MarketTrend,
  type PriceAlert,
  type CardAttributes,
  type PortfolioHolding,
  type PortfolioSummary,

  // Constants
  SUPPORTED_TOKENS,
  RARITY_MULTIPLIERS,

  // Price Functions
  fetchCryptoPrice,
  fetchMultiplePrices,
  calculateCardPrice,
  estimateCardValue,

  // Market Analysis
  analyzeMarketTrend,

  // Price Alerts
  createPriceAlert,
  checkAlerts,
  getActiveAlerts,

  // Portfolio
  calculatePortfolioSummary,
} from './finance-market';

// Biology/Chemistry Evolution
export {
  // Types
  type GeneticCode,
  type GeneticTrait,
  type Creature,
  type CreatureStats,
  type ElementType,
  type EvolutionResult,
  type MutationEvent,
  type BreedingResult,
  type PotionEffect,

  // Constants
  NUCLEOTIDES,
  CODON_TRAITS,
  ELEMENT_STRENGTHS,
  EVOLUTION_THRESHOLDS,
  POTIONS,

  // Genetic Operations
  generateDnaSequence,
  getComplementaryStrand,
  transcribeDna,
  extractTraits,
  mutateDna,

  // Creature Operations
  createCreature,
  evolveCreature,
  breedCreatures,

  // Potion Effects
  applyPotion,
} from './bio-evolution';

// Weather/Location Events
export {
  // Types
  type WeatherCondition,
  type TimeOfDay,
  type LocationType,
  type WeatherData,
  type LocationData,
  type PointOfInterest,
  type CardBoost,
  type GameEvent,
  type EventTrigger,
  type EventReward,

  // Constants
  ELEMENT_WEATHER_BOOSTS,
  LOCATION_ELEMENT_AFFINITIES,
  TIME_OF_DAY_EFFECTS,
  WEATHER_EVENTS,
  LOCATION_EVENTS,

  // Weather Functions
  getTimeOfDay,
  parseWeatherCondition,
  getWeatherBoosts,

  // Location Functions
  determineLocationType,
  getLocationAffinities,
  calculateDistance,
  findNearbyPois,

  // Event System
  checkEventTrigger,
  triggerEvent,
  getActiveEvents,
  completeEvent,

  // Combined Boosts
  getAllActiveBoosts,
  applyBoostsToCard,
} from './weather-location';

// Game Battle Simulation
export {
  // Types
  type BattlePhase,
  type TargetType,
  type EffectType,
  type BattleCard,
  type Ability,
  type AbilityEffect,
  type StatusEffect,
  type Player,
  type BattleState,
  type TurnAction,
  type ActionResult,
  type BattleResult,

  // Constants
  ELEMENT_ADVANTAGES,
  ELEMENT_DISADVANTAGES,
  ADVANTAGE_MULTIPLIER,
  DISADVANTAGE_MULTIPLIER,
  CRITICAL_HIT_CHANCE,
  CRITICAL_HIT_MULTIPLIER,
  MAX_FIELD_SIZE,
  STARTING_HAND_SIZE,
  MAX_HAND_SIZE,
  STARTING_ENERGY,
  ENERGY_PER_TURN,
  MAX_ENERGY,

  // Battle Management
  createBattle,
  playCard,
  attackWithCard,
  useAbility,
  endTurn,

  // Damage Calculation
  calculateDamage,

  // AI
  getAiAction,

  // Results
  calculateBattleResult,
} from './game-battle';
