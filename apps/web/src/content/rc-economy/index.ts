/**
 * RC Economy v1 - Rules & Guardrails
 *
 * Reputation Credit (RC) is Apex's non-tradeable contribution token.
 * It rewards genuine contribution and gates influence/access.
 *
 * This is the canonical specification for RC economy v1.
 */

// =============================================================================
// CORE PRINCIPLES
// =============================================================================

export const rcPrinciples = {
  title: "RC Core Principles",
  principles: [
    {
      number: 1,
      name: "RC Cannot Be Bought or Traded",
      description: "No token sales. No secondary markets. No 'boost with money.' RC is earned through provable contribution only.",
      implementation: "RC transactions are unidirectional. No transfer function exists. No external exchange is possible.",
    },
    {
      number: 2,
      name: "RC Is Earned by Provable Contribution",
      description: "Every RC earn event corresponds to a verifiable action: publishing, curation, Commons contribution, governance participation.",
      implementation: "All RC transactions are logged in rc_transactions table with reference_type and reference_id for auditability.",
    },
    {
      number: 3,
      name: "RC Grants Influence and Access, Not Cash",
      description: "RC unlocks roles, visibility, governance weight, and fee discounts. It's not directly convertible to USD.",
      implementation: "RC thresholds gate feature access. No cash-out mechanism exists.",
    },
    {
      number: 4,
      name: "RC Is Rate-Limited",
      description: "Daily caps prevent gaming and whale accumulation. Consistent contribution beats burst activity.",
      implementation: "Daily cap of 50 RC from passive events (upvotes, saves). Publishing caps apply independently.",
    },
  ],
};

// =============================================================================
// RC EARN EVENTS
// =============================================================================

export interface RcEarnEvent {
  eventCode: string;
  displayName: string;
  rcAmount: number;
  cap?: number; // Max RC earnable from this event (per item or total)
  capPeriod?: 'per_item' | 'per_day' | 'per_month' | 'lifetime';
  sourceProduct: 'omnis' | 'intelligence' | 'commons' | 'governance' | 'system';
  description: string;
  triggerCondition: string;
}

export const rcEarnEvents: RcEarnEvent[] = [
  // Omnis Events
  {
    eventCode: 'omnis_connect_first',
    displayName: 'Connect First Source',
    rcAmount: 50,
    cap: 50,
    capPeriod: 'lifetime',
    sourceProduct: 'omnis',
    description: 'First-time bonus for connecting a data source',
    triggerCondition: 'User connects first Omnis source (any type)',
  },
  {
    eventCode: 'omnis_batch_process',
    displayName: 'Batch Processing Bonus',
    rcAmount: 25,
    cap: 100,
    capPeriod: 'per_day',
    sourceProduct: 'omnis',
    description: 'Processing 10+ items in a single batch',
    triggerCondition: 'Omnis processes >=10 primitives in one sync',
  },

  // Intelligence Marketplace Events
  {
    eventCode: 'intel_first_publish',
    displayName: 'First Intel Published',
    rcAmount: 100,
    cap: 100,
    capPeriod: 'lifetime',
    sourceProduct: 'intelligence',
    description: 'One-time bonus for publishing first intel card',
    triggerCondition: 'User publishes first intel card (status: published)',
  },
  {
    eventCode: 'intel_publish',
    displayName: 'Publish Intel Card',
    rcAmount: 5,
    cap: 25,
    capPeriod: 'per_day',
    sourceProduct: 'intelligence',
    description: 'Publish a new intel card (after first)',
    triggerCondition: 'Intel card transitions to status: published',
  },
  {
    eventCode: 'intel_purchased',
    displayName: 'Intel Purchased',
    rcAmount: 10,
    cap: 100,
    capPeriod: 'per_day',
    sourceProduct: 'intelligence',
    description: 'Someone purchased your intel card',
    triggerCondition: 'intel_purchases record created with status: completed',
  },
  {
    eventCode: 'intel_upvoted',
    displayName: 'Intel Upvoted',
    rcAmount: 1,
    cap: 50,
    capPeriod: 'per_item',
    sourceProduct: 'intelligence',
    description: 'Per upvote on your intel card (capped per card)',
    triggerCondition: 'intel_votes record with value: +1 created',
  },
  {
    eventCode: 'intel_bookmarked',
    displayName: 'Intel Bookmarked',
    rcAmount: 2,
    cap: 40,
    capPeriod: 'per_item',
    sourceProduct: 'intelligence',
    description: 'Intel card saved to user library (stronger intent)',
    triggerCondition: 'user_libraries record created',
  },
  {
    eventCode: 'intel_5star_rating',
    displayName: '5-Star Rating Received',
    rcAmount: 15,
    sourceProduct: 'intelligence',
    description: 'Receive a 5-star rating from a verified purchaser',
    triggerCondition: 'intel_ratings record with rating: 5 created',
  },
  {
    eventCode: 'intel_helpful_comment',
    displayName: 'Helpful Comment',
    rcAmount: 3,
    cap: 30,
    capPeriod: 'per_day',
    sourceProduct: 'intelligence',
    description: 'Comment marked helpful by author or 3+ upvotes',
    triggerCondition: 'Comment reaches helpful threshold',
  },

  // Commons Events
  {
    eventCode: 'commons_publish',
    displayName: 'Publish to Commons',
    rcAmount: 10,
    cap: 50,
    capPeriod: 'per_day',
    sourceProduct: 'commons',
    description: 'Publish free content to the Commons',
    triggerCondition: 'Intel card published with visibility: public and price: 0',
  },
  {
    eventCode: 'commons_upvoted',
    displayName: 'Commons Upvoted',
    rcAmount: 1,
    cap: 30,
    capPeriod: 'per_item',
    sourceProduct: 'commons',
    description: 'Per upvote on Commons content',
    triggerCondition: 'Vote on free Commons content',
  },
  {
    eventCode: 'commons_downloaded',
    displayName: 'Commons Downloaded',
    rcAmount: 1,
    cap: 50,
    capPeriod: 'per_item',
    sourceProduct: 'commons',
    description: 'Per 100 downloads of Commons content',
    triggerCondition: 'Commons content reaches download milestones (100, 200, etc.)',
  },

  // Curation Events
  {
    eventCode: 'curator_early_upvote',
    displayName: 'Early Curator Bonus',
    rcAmount: 2,
    cap: 20,
    capPeriod: 'per_day',
    sourceProduct: 'intelligence',
    description: 'Upvoted content that later performed well (early signal)',
    triggerCondition: 'Content you upvoted in first 24h later reaches top 10% engagement',
  },

  // Governance Events
  {
    eventCode: 'governance_vote',
    displayName: 'Governance Vote',
    rcAmount: 5,
    cap: 25,
    capPeriod: 'per_day',
    sourceProduct: 'governance',
    description: 'Vote on a governance proposal',
    triggerCondition: 'governance_votes record created',
  },
  {
    eventCode: 'governance_proposal_passed',
    displayName: 'Proposal Vote Success',
    rcAmount: 25,
    sourceProduct: 'governance',
    description: 'Voted with majority on a passed proposal',
    triggerCondition: 'Proposal passes and user voted with winning side',
  },

  // Moderation Events
  {
    eventCode: 'report_upheld',
    displayName: 'Valid Report',
    rcAmount: 2,
    cap: 10,
    capPeriod: 'per_day',
    sourceProduct: 'system',
    description: 'Reported spam/abuse that was upheld by moderators',
    triggerCondition: 'User report leads to content removal or penalty',
  },
];

// =============================================================================
// RC SPEND / USE CASES
// =============================================================================

export interface RcUseCase {
  useCaseCode: string;
  displayName: string;
  rcCost: number | 'threshold';
  rcThreshold?: number;
  costType: 'spend' | 'stake' | 'threshold';
  duration?: string;
  description: string;
  effect: string;
}

export const rcUseCases: RcUseCase[] = [
  // Visibility Features
  {
    useCaseCode: 'boost_visibility',
    displayName: 'Boost Intel Visibility',
    rcCost: 20,
    costType: 'spend',
    duration: '7 days',
    description: 'Temporary visibility boost for an intel card',
    effect: 'Slight ranking lift in search/browse. Clearly labeled "Boosted".',
  },

  // Governance Features
  {
    useCaseCode: 'create_proposal',
    displayName: 'Create Governance Proposal',
    rcCost: 100,
    costType: 'stake',
    description: 'Stake RC to create a governance proposal',
    effect: 'RC is staked. Refunded if proposal meets quorum and passes.',
  },

  // Role Thresholds
  {
    useCaseCode: 'unlock_creator_plus',
    displayName: 'Creator+ Dashboard',
    rcCost: 'threshold',
    rcThreshold: 500,
    costType: 'threshold',
    description: 'Unlock advanced creator analytics and insights',
    effect: 'Access to Creator+ dashboard with advanced analytics, insights, better rev share visibility.',
  },
  {
    useCaseCode: 'unlock_curator',
    displayName: 'Curator Role',
    rcCost: 'threshold',
    rcThreshold: 300,
    costType: 'threshold',
    description: 'Unlock curator tools and weighted votes',
    effect: 'Access to curation lists, featured sections, higher weight on quality votes.',
  },
  {
    useCaseCode: 'unlock_moderator',
    displayName: 'Moderator Eligibility',
    rcCost: 'threshold',
    rcThreshold: 1000,
    costType: 'threshold',
    description: 'Become eligible for moderator role',
    effect: 'Can be elected/appointed as moderator. Access to moderation tools.',
  },
  {
    useCaseCode: 'unlock_governor',
    displayName: 'Governor Tier',
    rcCost: 'threshold',
    rcThreshold: 2500,
    costType: 'threshold',
    description: 'Full governance participation',
    effect: 'Weighted votes on protocol-wide decisions. Can create high-impact proposals.',
  },

  // Fee Discounts (Threshold-based)
  {
    useCaseCode: 'fee_discount_tier1',
    displayName: 'Fee Discount Tier 1',
    rcCost: 'threshold',
    rcThreshold: 1000,
    costType: 'threshold',
    description: 'Marketplace fee discount for consistent contributors',
    effect: '5% fee discount on intel sales (15% → 14.25%)',
  },
  {
    useCaseCode: 'fee_discount_tier2',
    displayName: 'Fee Discount Tier 2',
    rcCost: 'threshold',
    rcThreshold: 5000,
    costType: 'threshold',
    description: 'Higher fee discount for power contributors',
    effect: '10% fee discount on intel sales (15% → 13.5%)',
  },
  {
    useCaseCode: 'fee_discount_tier3',
    displayName: 'Fee Discount Tier 3',
    rcCost: 'threshold',
    rcThreshold: 10000,
    costType: 'threshold',
    description: 'Maximum fee discount for top contributors',
    effect: '15% fee discount on intel sales (15% → 12.75%)',
  },
];

// =============================================================================
// ANTI-ABUSE MECHANICS
// =============================================================================

export const antiAbuseMechanics = {
  title: "Anti-Abuse Guardrails",

  dailyCaps: {
    name: "Per-Day RC Caps",
    description: "Maximum RC earnable per day from passive events",
    rules: [
      { category: "Passive events (upvotes, saves, comments)", cap: 50 },
      { category: "Publishing events", cap: 25 },
      { category: "Governance events", cap: 25 },
      { category: "Total daily cap (all sources)", cap: 100 },
    ],
    rationale: "Prevents sudden massive farming. Consistent contribution beats burst activity.",
  },

  sybilResistance: {
    name: "Sybil Resistance",
    description: "Prevent fake account abuse",
    mechanisms: [
      {
        name: "Account Friction",
        description: "Email verification + device fingerprinting for account creation",
      },
      {
        name: "Warming Period",
        description: "New accounts (< 7 days) have RC earnings reduced by 50%",
      },
      {
        name: "Vote Weight",
        description: "Votes from accounts < 30 days old count at 25% weight for creator RC",
      },
      {
        name: "Light KYC",
        description: "Phone verification required for RC > 1000 or moderator roles",
      },
    ],
  },

  decayMechanism: {
    name: "RC Decay (v1.1 - Optional)",
    description: "Keep reputation fresh and relevant",
    status: "Planned for v1.1, not v1.0",
    proposal: {
      mechanism: "Rolling 12-month window for 'active' RC",
      details: [
        "Display 'Lifetime RC' (never decreases) for prestige",
        "Use '12-Month RC' for governance weight and role thresholds",
        "Prevents 'rest on laurels' - must stay active to maintain influence",
      ],
    },
  },

  moderationOverride: {
    name: "Moderation Override",
    description: "Admin intervention for coordinated abuse",
    powers: [
      "Flag accounts as 'suspicious' (RC earnings paused pending review)",
      "Revoke RC gains from confirmed abuse (recorded in rc_transactions as negative)",
      "Temporary or permanent RC earning bans for repeat offenders",
    ],
    transparency: "All moderation actions logged and reviewable by Governor tier",
  },

  votingRingDetection: {
    name: "Voting Ring Detection",
    description: "Detect and prevent coordinated voting",
    signals: [
      "Same IP/device clusters voting on same content",
      "Accounts created in batches voting together",
      "Unusual timing patterns (bot-like intervals)",
      "Graph analysis of voting patterns",
    ],
    response: "Flagged for manual review. RC withheld pending investigation.",
  },
};

// =============================================================================
// CONTRIBUTOR LEVELS
// =============================================================================

export const contributorLevels = {
  title: "Contributor Levels",
  description: "RC thresholds unlock progressively higher roles and privileges",

  levels: [
    {
      name: "Newcomer",
      rcThreshold: 0,
      privileges: [
        "Basic publishing",
        "Standard marketplace access",
        "Comment and vote",
      ],
    },
    {
      name: "Creator",
      rcThreshold: 100,
      privileges: [
        "All Newcomer privileges",
        "Verified creator badge",
        "Access to basic analytics",
      ],
    },
    {
      name: "Curator",
      rcThreshold: 300,
      privileges: [
        "All Creator privileges",
        "Create curated lists",
        "Featured section nominations",
        "Higher vote weight on quality",
      ],
    },
    {
      name: "Creator+",
      rcThreshold: 500,
      privileges: [
        "All Curator privileges",
        "Advanced analytics dashboard",
        "Revenue insights",
        "A/B testing for titles",
      ],
    },
    {
      name: "Moderator",
      rcThreshold: 1000,
      privileges: [
        "All Creator+ privileges",
        "Content moderation tools",
        "Report review queue",
        "Light KYC required",
      ],
    },
    {
      name: "Governor",
      rcThreshold: 2500,
      privileges: [
        "All Moderator privileges",
        "Create high-impact proposals",
        "Weighted governance votes",
        "Protocol decision participation",
        "View moderation logs",
      ],
    },
  ],
};

// =============================================================================
// TRANSPARENCY & EXPLAINABILITY
// =============================================================================

export const transparencyRules = {
  title: "Transparency & Explainability",

  publicDocs: {
    name: "Public Rules Page",
    description: "Live documentation of RC rules",
    requirements: [
      "All earn events documented with RC amounts and caps",
      "All spend/threshold uses documented",
      "All anti-abuse mechanisms explained",
      "Change log for rule updates",
    ],
  },

  userDashboard: {
    name: "User RC Dashboard",
    description: "Personal RC transparency",
    features: [
      "Current RC balance",
      "Lifetime RC earned",
      "RC transaction history (filterable)",
      "Progress toward next level",
      "Monthly RC summary",
    ],
  },

  systemHealth: {
    name: "System Health Metrics",
    description: "Public economy health indicators (v1.1)",
    metrics: [
      "Total RC in circulation",
      "Distribution by level",
      "Average RC per active user",
      "RC velocity (earning rate)",
    ],
  },
};

// =============================================================================
// IMPLEMENTATION NOTES
// =============================================================================

export const implementationNotes = {
  title: "Implementation Notes for Developers",

  rcTransaction: {
    description: "All RC changes go through a central function",
    pseudocode: `
async function creditRC(
  userId: string,
  amount: number,
  reason: RcReasonCode,
  sourceProduct: SourceProduct,
  referenceType?: string,
  referenceId?: string
): Promise<RcTransaction> {
  // 1. Validate reason code exists
  // 2. Check daily caps
  // 3. Check per-item caps if applicable
  // 4. Get current balance
  // 5. Insert rc_transactions record
  // 6. Update user_rc_profiles balance
  // 7. Return transaction record
}
    `,
  },

  capEnforcement: {
    description: "Cap checking happens before credit",
    pseudocode: `
async function checkCaps(
  userId: string,
  eventCode: string,
  referenceId?: string
): Promise<{ allowed: boolean; remainingCapacity: number }> {
  // 1. Get event definition
  // 2. If per_day cap: count today's credits for this event
  // 3. If per_item cap: count credits for this item
  // 4. If lifetime cap: count all-time credits for this event
  // 5. Return remaining capacity
}
    `,
  },

  levelCalculation: {
    description: "Contributor level is computed, not stored",
    pseudocode: `
function getContributorLevel(rcBalance: number): ContributorLevel {
  if (rcBalance >= 2500) return 'governor';
  if (rcBalance >= 1000) return 'moderator';
  if (rcBalance >= 500) return 'creator_plus';
  if (rcBalance >= 300) return 'curator';
  if (rcBalance >= 100) return 'creator';
  return 'newcomer';
}
    `,
  },
};

// =============================================================================
// EXPORT
// =============================================================================

export const rcEconomySpec = {
  version: "1.0",
  lastUpdated: "2024-12-07",
  principles: rcPrinciples,
  earnEvents: rcEarnEvents,
  useCases: rcUseCases,
  antiAbuse: antiAbuseMechanics,
  levels: contributorLevels,
  transparency: transparencyRules,
  implementation: implementationNotes,
};

export default rcEconomySpec;
