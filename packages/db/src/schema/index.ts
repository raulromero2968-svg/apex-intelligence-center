export { cardForensics, type CardForensics, type NewCardForensics } from './cardForensics';
export { marketKnowledge, type MarketKnowledge, type NewMarketKnowledge } from './marketKnowledge';
export { arbitrageOpportunities, type ArbitrageOpportunity, type NewArbitrageOpportunity } from './arbitrageOpportunities';
export { blockchainFloorPrices, type BlockchainFloorPrice, type NewBlockchainFloorPrice } from './blockchainFloorPrices';
export { cardFingerprints, type CardFingerprint, type NewCardFingerprint } from './cardFingerprints';
export {
  projectOotcOrders,
  projectOwhitelistPrices,
  projectOdiscordMessages,
  type ProjectOOtcOrder,
  type NewProjectOOtcOrder,
  type ProjectOWhitelistPrice,
  type NewProjectOWhitelistPrice,
  type ProjectODiscordMessage,
  type NewProjectODiscordMessage,
} from './projectO';
export {
  digitalTwinTokens,
  digitalTwinStatusEnum,
  type DigitalTwinToken,
  type NewDigitalTwinToken,
} from './digitalTwinTokens';

// Simulation Theory & Prediction Markets (Bostrom-inspired)
export {
  simulationModels,
  predictionMarkets,
  simulationInsights,
  simulationStatusEnum,
  trilemmaOutcomeEnum,
  type SimulationModel,
  type NewSimulationModel,
  type PredictionMarket,
  type NewPredictionMarket,
  type SimulationInsight,
  type NewSimulationInsight,
} from './simulationModels';

// FHI Alignment & POST-Agency Data (KB-09 Migration)
export {
  alignmentData,
  postAgencyUpdates,
  alignmentAuditLog,
  alignmentStatusEnum,
  corrigibilityLevelEnum,
  postAgencyUpdateTypeEnum,
  type AlignmentData,
  type NewAlignmentData,
  type PostAgencyUpdate,
  type NewPostAgencyUpdate,
  type AlignmentAuditLogEntry,
  type NewAlignmentAuditLogEntry,
  type AlignmentStatus,
  type CorrigibilityLevel,
  type PostAgencyUpdateType,
} from './alignmentData';

// Power Network - Seven Mountains Framework (Abyss Mapping)
export {
  // Tables
  powerEntities,
  powerRelationships,
  powerNetworkSnapshots,
  powerClaims,
  // Enums
  domainTypeEnum,
  entityTypeEnum,
  evidenceTierEnum,
  relationshipTypeEnum,
  // Types
  type PowerEntity,
  type NewPowerEntity,
  type PowerRelationship,
  type NewPowerRelationship,
  type PowerNetworkSnapshot,
  type NewPowerNetworkSnapshot,
  type PowerClaim,
  type NewPowerClaim,
  type PowerDomainType,
  type PowerEntityType,
  type EvidenceTier,
  type PowerRelationshipType,
} from './powerNetwork';

// Market Movers (High Velocity Price Data)
export { marketMovers, type MarketMover, type NewMarketMover } from './marketMovers';

// Insight Engine (AI-Powered Market Intelligence)
export {
  // Tables
  marketReports,
  sentimentSnapshots,
  // Enums
  reportTypeEnum,
  sentimentLabelEnum,
  tcgGameEnum,
  // Relations
  marketReportsRelations,
  sentimentSnapshotsRelations,
  // Constants & Helpers
  SENTIMENT_THRESHOLDS,
  REPORT_TTL_HOURS,
  getSentimentLabel,
  // Types
  type MarketReport,
  type NewMarketReport,
  type SentimentSnapshot,
  type NewSentimentSnapshot,
  type MarketReportCitation,
  type MarketReportAIMetadata,
  type SentimentFactor,
  type ReportType,
  type SentimentLabel,
  type TcgGame,
} from './insights';

// Apex Commons Resource Library
export {
  // Tables
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
  // Enums
  commonsUserRoleEnum,
  contributorLevelEnum,
  resourceStatusEnum,
  resourceTypeEnum,
  voteTypeEnum,
  proposalStatusEnum,
  flagStatusEnum,
  // Relations
  commonsUserProfilesRelations,
  commonsResourcesRelations,
  commonsResourceVotesRelations,
  commonsCollectionsRelations,
  commonsCollectionItemsRelations,
  commonsProposalsRelations,
  commonsProposalVotesRelations,
  commonsRcTransactionsRelations,
  commonsModerationFlagsRelations,
  commonsDownloadsRelations,
  commonsViewsRelations,
  // Constants
  RC_REASON_CODES,
  RC_AMOUNTS,
  CONTRIBUTOR_LEVEL_THRESHOLDS,
  // Types
  type CommonsUserProfile,
  type NewCommonsUserProfile,
  type CommonsResource,
  type NewCommonsResource,
  type CommonsResourceVote,
  type NewCommonsResourceVote,
  type CommonsCollection,
  type NewCommonsCollection,
  type CommonsCollectionItem,
  type NewCommonsCollectionItem,
  type CommonsProposal,
  type NewCommonsProposal,
  type CommonsProposalVote,
  type NewCommonsProposalVote,
  type CommonsRcTransaction,
  type NewCommonsRcTransaction,
  type CommonsModerationFlag,
  type NewCommonsModerationFlag,
  type CommonsDownload,
  type NewCommonsDownload,
  type CommonsView,
  type NewCommonsView,
  type CommonsUserRole,
  type ContributorLevel,
  type ResourceStatus,
  type ResourceType,
  type VoteType,
  type ProposalStatus,
  type FlagStatus,
  type RcReasonCode,
} from './apexCommons';

// Antifragile Architecture: Audit Logs for Ethical Transparency
export {
  // Tables
  auditLogs,
  // Enums
  auditActionTypeEnum,
  auditSeverityEnum,
  // Relations
  auditLogsRelations,
  // Constants
  MULTISIG_REQUIRED_ACTIONS,
  MULTISIG_THRESHOLDS,
  // Types
  type AuditLog,
  type NewAuditLog,
  type AuditActionType,
  type AuditSeverity,
} from './auditLogs';

// Intel Reports - User-Generated Market Intelligence with RAG Search
export {
  // Tables
  intelReports,
  intelReportPurchases,
  reportCards,
  intelReportLikes,
  // Enums
  reportTierEnum,
  reportCategoryEnum,
  reportStatusEnum,
  postingDestinationEnum,
  // Relations
  intelReportsRelations,
  intelReportPurchasesRelations,
  reportCardsRelations,
  intelReportLikesRelations,
  // Constants
  EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
  VECTOR_SIMILARITY_THRESHOLD,
  RRF_K,
  SEARCH_LIMITS,
  // Types
  type IntelReport,
  type NewIntelReport,
  type IntelReportPurchase,
  type NewIntelReportPurchase,
  type ReportCard,
  type NewReportCard,
  type IntelReportLike,
  type NewIntelReportLike,
  type ReportTier,
  type ReportCategory,
  type ReportStatus,
  type PostingDestination,
} from './intelReports';

// Security & Compliance (Security Audit Implementation)
export {
  // Tables
  userSessions,
  mfaAttempts,
  userEncryptedData,
  encryptionKeys,
  gdprRequests,
  dataRetentionLog,
  userConsents,
  securityEvents,
  e2eMessages,
  // Enums
  mfaAttemptTypeEnum,
  gdprRequestTypeEnum,
  gdprRequestStatusEnum,
  dataRetentionActionEnum,
  securityEventSeverityEnum,
  encryptionKeyTypeEnum,
  // Relations
  userSessionsRelations,
  mfaAttemptsRelations,
  userEncryptedDataRelations,
  gdprRequestsRelations,
  dataRetentionLogRelations,
  userConsentsRelations,
  securityEventsRelations,
  e2eMessagesRelations,
  // Types
  type UserSession,
  type NewUserSession,
  type MfaAttempt,
  type NewMfaAttempt,
  type UserEncryptedData,
  type NewUserEncryptedData,
  type EncryptionKey,
  type NewEncryptionKey,
  type GdprRequest,
  type NewGdprRequest,
  type DataRetentionLogEntry,
  type NewDataRetentionLogEntry,
  type UserConsent,
  type NewUserConsent,
  type SecurityEvent,
  type NewSecurityEvent,
  type E2eMessage,
  type NewE2eMessage,
  type MfaAttemptType,
  type GdprRequestType,
  type GdprRequestStatus,
  type DataRetentionAction,
  type SecurityEventSeverity,
  type EncryptionKeyType,
} from './security';

// Analytics Events - Transaction and Engagement Tracking (KB-07)
export {
  // Tables
  analyticsEvents,
  // Enums
  analyticsEventTypeEnum,
  // Relations
  analyticsEventsRelations,
  // Constants
  ANALYTICS_RETENTION_DAYS,
  ANONYMIZABLE_EVENTS,
  REVENUE_EVENTS,
  // Helper functions
  createAnalyticsEvent,
  // Types
  type AnalyticsEvent,
  type NewAnalyticsEvent,
  type AnalyticsEventType,
} from './analyticsEvents';

// Blog Posts - Topic Cluster SEO Architecture (Phase 3)
// Note: blogPosts/BlogPost are aliased to avoid conflict with blogEngine exports
export {
  // Tables
  blogClusters,
  blogPosts as blogPostsSimple,
  blogCitations,
  // Enums
  blogPostTypeEnum,
  blogPostStatusEnum as blogPostStatusEnumSimple,
  citationSourceTypeEnum,
  // Relations
  blogClustersRelations,
  blogPostsRelations as blogPostsRelationsSimple,
  blogCitationsRelations,
  // Helper functions
  calculateReadingTime,
  getWordCount,
  // Types
  type BlogCluster,
  type NewBlogCluster,
  type BlogPost as BlogPostSimple,
  type NewBlogPost as NewBlogPostSimple,
  type BlogCitation,
  type NewBlogCitation,
  type BlogPostType,
  type BlogPostStatus as BlogPostStatusSimple,
  type CitationSourceType,
  type BlogPostCitation as BlogPostCitationInterface,
  type BlogPostAuthor,
  type BlogPostSeoData,
} from './blogPosts';

// Perplexity-Style Blog - Topic Clusters with Citation Sourcing (Alternative schema)
export {
  // Tables
  clusters,
  posts,
  citations,
  // Relations
  clustersRelations,
  postsRelations,
  citationsRelations,
  // Types
  type Cluster,
  type NewCluster,
  type Post,
  type NewPost,
  type Citation,
  type NewCitation,
  type PostMetaSchema,
} from './blog';

// Perplexity-Style Blog Engine (Extended - AI-Generated Content + SEO Clusters)
export {
  // Tables
  topicClusters,
  blogPosts,
  blogSources,
  blogPostCitations,
  blogGenerationJobs,
  // Enums
  blogPostStatusEnum,
  contentSourceEnum,
  clusterTypeEnum,
  sourceStatusEnum,
  // Relations
  topicClustersRelations,
  blogPostsRelations,
  blogSourcesRelations,
  blogPostCitationsRelations,
  blogGenerationJobsRelations,
  // Constants
  DEFAULT_GENERATION_CONFIG,
  SOURCE_RELIABILITY,
  GENERATION_STEPS,
  // Types
  type TopicCluster,
  type NewTopicCluster,
  type BlogPost,
  type NewBlogPost,
  type BlogSource,
  type NewBlogSource,
  type BlogPostCitation,
  type NewBlogPostCitation,
  type BlogGenerationJob,
  type NewBlogGenerationJob,
  type BlogPostStatus,
  type ContentSource,
  type ClusterType,
  type SourceStatus,
} from './blogEngine';
