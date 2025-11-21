// Explicit exports - no barrel exports allowed
// Import directly from source files:
// - Schema: import { users, watchlist, ... } from '@apex/db/schema'
// - Types: import { User, WatchlistItem, ... } from '@apex/db/types'
// - Repositories: import { ... } from '@apex/db/repositories/cardForensicsRepo'

// Re-export commonly used items for convenience (explicit, not barrel)
export {
  users,
  watchlist,
  portfolio,
  notificationPreferences,
  pushTokens,
  pushTickets,
  priceHistory,
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
} from './schema';

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
} from './schema';


