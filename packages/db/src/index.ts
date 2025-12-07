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
  // Apex Commons types
  CommonsUserProfile,
  NewCommonsUserProfile,
  CommonsResource,
  NewCommonsResource,
  CommonsResourceVote,
  NewCommonsResourceVote,
  CommonsCollection,
  NewCommonsCollection,
  CommonsCollectionItem,
  NewCommonsCollectionItem,
  CommonsProposal,
  NewCommonsProposal,
  CommonsProposalVote,
  NewCommonsProposalVote,
  CommonsRcTransaction,
  NewCommonsRcTransaction,
  CommonsModerationFlag,
  NewCommonsModerationFlag,
  CommonsDownload,
  NewCommonsDownload,
  CommonsView,
  NewCommonsView,
  CommonsUserRole,
  ContributorLevel,
  ResourceStatus,
  ResourceType,
  VoteType,
  ProposalStatus,
  FlagStatus,
  RcReasonCode,
} from './schema/index';

// Re-export Apex Commons tables, enums, and constants
export {
  commonsUserProfiles,
  commonsResources,
  commonsResourceVotes,
  commonsCollections,
  commonsCollectionItems,
  commonsProposals,
  commonsProposalVotes,
  commonsRcTransactions,
  commonsModerationFlags,
  commonsDownloads,
  commonsViews,
  commonsUserRoleEnum,
  contributorLevelEnum,
  resourceStatusEnum,
  resourceTypeEnum,
  voteTypeEnum,
  proposalStatusEnum,
  flagStatusEnum,
  RC_REASON_CODES,
  RC_AMOUNTS,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
} from './schema/index';

// Re-export Audit Logs tables, enums, and constants
export {
  auditLogs,
  auditActionTypeEnum,
  auditSeverityEnum,
  auditLogsRelations,
  MULTISIG_REQUIRED_ACTIONS,
  MULTISIG_THRESHOLDS,
} from './schema/index';

// Re-export Audit Log types
export type {
  AuditLog,
  NewAuditLog,
  AuditActionType,
  AuditSeverity,
} from './schema/index';

// Re-export Intel Reports tables, enums, and types
export {
  intelReports,
  intelReportPurchases,
  reportCards,
  intelReportLikes,
  reportTierEnum,
  reportCategoryEnum,
  reportStatusEnum,
  postingDestinationEnum,
  intelReportsRelations,
  intelReportPurchasesRelations,
  reportCardsRelations,
  intelReportLikesRelations,
  EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
  VECTOR_SIMILARITY_THRESHOLD,
  RRF_K,
  SEARCH_LIMITS,
} from './schema/index';

// Re-export Intel Reports types
export type {
  IntelReport,
  NewIntelReport,
  IntelReportPurchase,
  NewIntelReportPurchase,
  ReportCard,
  NewReportCard,
  IntelReportLike,
  NewIntelReportLike,
  ReportTier,
  ReportCategory,
  ReportStatus,
  PostingDestination,
} from './schema/index';


