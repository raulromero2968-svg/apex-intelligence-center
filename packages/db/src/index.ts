// Explicit exports - no barrel exports allowed
// Import directly from source files:
// - Schema: import { users, watchlist, ... } from '@apex/db/schema'
// - Types: import { User, WatchlistItem, ... } from '@apex/db/types'
// - Repositories: import { ... } from '@apex/db/repositories/cardForensicsRepo'

// Re-export base tables from schema.ts
export {
  users,
  watchlist,
  portfolio,
  notificationPreferences,
  pushTokens,
  pushTickets,
  priceHistory,
} from './schema';

// Re-export extended tables from schema/ directory
export {
  cardForensics,
  marketKnowledge,
  arbitrageOpportunities,
  blockchainFloorPrices,
  cardFingerprints,
  projectOotcOrders,
  projectOwhitelistPrices,
  projectOdiscordMessages,
  digitalTwinTokens,
  digitalTwinStatusEnum,
} from './schema/index';

// Re-export types from types.ts
export type {
  User,
  NewUser,
  WatchlistItem,
  NewWatchlistItem,
  PortfolioItem,
  NewPortfolioItem,
  NotificationPreference,
  NewNotificationPreference,
  PushToken,
  NewPushToken,
  PushTicket,
  NewPushTicket,
  PriceHistory,
  NewPriceHistory,
} from './types';

// Re-export extended types from schema/ directory
export type {
  CardForensics,
  NewCardForensics,
  MarketKnowledge,
  NewMarketKnowledge,
  ArbitrageOpportunity,
  NewArbitrageOpportunity,
  BlockchainFloorPrice,
  NewBlockchainFloorPrice,
  CardFingerprint,
  NewCardFingerprint,
  ProjectOOtcOrder,
  NewProjectOOtcOrder,
  ProjectOWhitelistPrice,
  NewProjectOWhitelistPrice,
  ProjectODiscordMessage,
  NewProjectODiscordMessage,
  DigitalTwinToken,
  NewDigitalTwinToken,
} from './schema/index';


