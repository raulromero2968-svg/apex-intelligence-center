// lib/types.ts
// Core entity types for Apex Intelligence platform

// ============================================================================
// MODEL CARDS & MARKET
// ============================================================================

export interface ApexCard {
  id: string;
  name: string;
  slug: string;
  /** Model type: alpha gen, risk model, signal, etc. */
  type: "alpha" | "risk" | "signal" | "factor" | "ensemble" | "specialty";
  /** Rarity tier affects visual treatment and stake requirements */
  rarity: "common" | "uncommon" | "rare" | "legendary" | "mythic";
  /** Card creator/author */
  creator: {
    id: string;
    name: string;
    reputation: number;
  };
  /** Performance metrics */
  performance: {
    sharpe: number;
    returns7d: number;
    returns30d: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
  };
  /** Market data */
  market: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    holders: number;
  };
  /** Reputation stake info */
  staking: {
    totalStaked: number;
    stakerCount: number;
    apy: number;
  };
  /** Card metadata */
  description: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Deck strategy type */
  strategy: "momentum" | "mean-reversion" | "arbitrage" | "macro" | "multi-factor" | "custom";
  /** Cards in this deck with weights */
  cards: Array<{
    cardId: string;
    card: ApexCard;
    weight: number;
  }>;
  /** Deck performance */
  performance: {
    returns7d: number;
    returns30d: number;
    sharpe: number;
    volatility: number;
  };
  /** Creator info */
  creator: {
    id: string;
    name: string;
  };
  /** Visibility */
  visibility: "public" | "private" | "unlisted";
  /** Follower/copy count */
  followers: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INTEL & RESEARCH
// ============================================================================

export interface IntelArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  /** Article category */
  category: "market-analysis" | "set-analysis" | "investment-guide" | "strategy" | "vintage-analysis" | "breaking-intel";
  /** Author info */
  author: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  /** Reading metadata */
  readTime: number;
  publishedAt: string;
  updatedAt?: string;
  /** Premium gating */
  isPremium: boolean;
  /** Featured image */
  imageUrl?: string;
  /** SEO */
  tags: string[];
  metaDescription?: string;
}

export interface IntelSeries {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Articles in this series */
  articles: IntelArticle[];
  /** Series metadata */
  coverImageUrl?: string;
  isComplete: boolean;
  totalArticles: number;
}

// ============================================================================
// USER & REPUTATION
// ============================================================================

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  /** Reputation system */
  reputation: {
    score: number;
    rank: number;
    tier: "novice" | "analyst" | "strategist" | "oracle" | "apex";
    totalEarned: number;
    totalStaked: number;
  };
  /** Achievements */
  achievements: Achievement[];
  /** Portfolio summary */
  portfolio: {
    totalValue: number;
    cardsOwned: number;
    decksCreated: number;
  };
  /** Social */
  followers: number;
  following: number;
  /** Account metadata */
  createdAt: string;
  lastActiveAt: string;
  /** Subscription tier */
  subscription: "free" | "analyst" | "pro" | "apex";
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  /** Rarity of achievement */
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  /** When earned */
  earnedAt: string;
  /** Progress if not yet complete */
  progress?: {
    current: number;
    target: number;
  };
}

export interface ReputationEvent {
  id: string;
  userId: string;
  /** Event type */
  type:
    | "stake-win"
    | "stake-loss"
    | "article-published"
    | "prediction-correct"
    | "prediction-wrong"
    | "deck-copied"
    | "referral"
    | "achievement-earned";
  /** Rep change (positive or negative) */
  amount: number;
  /** Related entity */
  relatedId?: string;
  relatedType?: "card" | "deck" | "article" | "prediction";
  /** Event metadata */
  description: string;
  createdAt: string;
}

// ============================================================================
// DOMAIN HEALTH & MONITORING
// ============================================================================

export interface DomainHealthRecord {
  id: string;
  domain: string;
  /** Health check results */
  status: "healthy" | "degraded" | "down" | "unknown";
  /** Individual check results */
  checks: {
    dns: CheckResult;
    ssl: CheckResult;
    http: CheckResult;
    performance: CheckResult;
  };
  /** Response time in ms */
  responseTime: number;
  /** Last check timestamp */
  lastCheckedAt: string;
  /** Uptime percentage (30 day) */
  uptime30d: number;
  /** Historical data */
  history: Array<{
    timestamp: string;
    status: "healthy" | "degraded" | "down";
    responseTime: number;
  }>;
}

interface CheckResult {
  status: "pass" | "warn" | "fail";
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// MARKET DATA
// ============================================================================

export interface MarketSnapshot {
  timestamp: string;
  /** Overall market stats */
  totalVolume24h: number;
  totalMarketCap: number;
  activeCards: number;
  activeTraders: number;
  /** Top movers */
  topGainers: Array<{
    card: ApexCard;
    change: number;
  }>;
  topLosers: Array<{
    card: ApexCard;
    change: number;
  }>;
  /** Market sentiment */
  sentiment: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  /** Risk regime */
  riskRegime: "risk-on" | "risk-off" | "neutral" | "volatile";
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// NOTIFICATIONS & ALERTS
// ============================================================================

export interface PriceAlert {
  id: string;
  userId: string;
  cardId: string;
  card: ApexCard;
  /** Alert condition */
  condition: "above" | "below" | "change-percent";
  targetValue: number;
  /** Alert status */
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "alert" | "achievement" | "social" | "system" | "intel";
  title: string;
  message: string;
  /** Link to related content */
  actionUrl?: string;
  /** Read status */
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// PAGE METADATA (for [...slug] router)
// ============================================================================

export interface PageMeta {
  title: string;
  subtitle?: string;
  description: string;
  category?: string;
  status?: {
    label: string;
    variant: "live" | "beta" | "coming-soon" | "premium";
  };
  /** Parent path for breadcrumbs */
  parentPath?: string;
  parentLabel?: string;
  /** OpenGraph image override */
  ogImage?: string;
}
