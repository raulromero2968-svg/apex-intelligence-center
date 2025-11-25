/**
 * Threat Detection Service
 *
 * Implements threat pattern recognition (pack-ai-defense-001 §3.4).
 * Detects and classifies market manipulation patterns:
 * - Pump & dump schemes
 * - Wash trading
 * - Price manipulation
 * - Shill bidding
 * - Bot activity
 *
 * Uses MITRE ATT&CK-style classification adapted for TCG domain.
 *
 * @see pack-ai-defense-001 for threat taxonomy
 */

import { db } from '@/lib/db';
import { eq, desc, gte, and, or, sql, inArray } from 'drizzle-orm';
import {
  threatEvents,
  networkNodes,
  networkEdges,
  type ThreatEvent,
  type NewThreatEvent,
  type NetworkNode,
  type NewNetworkNode,
  type NetworkEdge,
  type NewNetworkEdge,
} from '@/db/schema/defense';

// ============================================================================
// TYPES
// ============================================================================

export type ThreatType =
  | 'pump_dump'
  | 'wash_trading'
  | 'price_manipulation'
  | 'shill_bidding'
  | 'account_compromise'
  | 'bot_activity'
  | 'ddil_attack'
  | 'unknown';

export type ThreatSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ThreatStatus = 'detected' | 'investigating' | 'confirmed' | 'mitigated' | 'false_positive';

export interface ThreatIndicators {
  volumeSpike?: number; // Percentage increase
  priceDeviation?: number; // Percentage from baseline
  accountAge?: number; // Days
  transactionPattern?: string;
  ipAddresses?: string[];
  relatedCardIds?: string[];
  sellerIds?: string[];
}

export interface ThreatDetectionResult {
  threatType: ThreatType;
  confidence: number;
  severity: ThreatSeverity;
  description: string;
  indicators: ThreatIndicators;
  suggestedActions: string[];
}

// TCG-specific MITRE ATT&CK style technique IDs
export const THREAT_TECHNIQUES = {
  PUMP_DUMP: 'TCG-T001',
  WASH_TRADING: 'TCG-T002',
  PRICE_MANIPULATION: 'TCG-T003',
  SHILL_BIDDING: 'TCG-T004',
  ACCOUNT_COMPROMISE: 'TCG-T005',
  BOT_ACTIVITY: 'TCG-T006',
  DDIL_ATTACK: 'TCG-T007',
} as const;

// ============================================================================
// THREAT DETECTION
// ============================================================================

/**
 * Analyze market activity for threats
 */
export async function detectThreats(data: {
  cardId?: string;
  volumeData?: { current: number; baseline: number };
  priceData?: { current: number; baseline: number; history: number[] };
  transactionData?: Array<{
    sellerId: string;
    buyerId: string;
    price: number;
    timestamp: Date;
  }>;
  accountData?: Array<{
    id: string;
    ageInDays: number;
    transactionCount: number;
  }>;
}): Promise<ThreatDetectionResult[]> {
  const threats: ThreatDetectionResult[] = [];

  // Check for pump & dump patterns
  if (data.volumeData && data.priceData) {
    const pumpDump = detectPumpDump(data.volumeData, data.priceData);
    if (pumpDump) threats.push(pumpDump);
  }

  // Check for wash trading
  if (data.transactionData) {
    const washTrading = detectWashTrading(data.transactionData);
    if (washTrading) threats.push(washTrading);
  }

  // Check for shill bidding
  if (data.transactionData && data.accountData) {
    const shillBidding = detectShillBidding(data.transactionData, data.accountData);
    if (shillBidding) threats.push(shillBidding);
  }

  // Check for bot activity
  if (data.transactionData) {
    const botActivity = detectBotActivity(data.transactionData);
    if (botActivity) threats.push(botActivity);
  }

  return threats;
}

/**
 * Detect pump & dump patterns
 */
function detectPumpDump(
  volume: { current: number; baseline: number },
  price: { current: number; baseline: number; history: number[] }
): ThreatDetectionResult | null {
  const volumeSpike = ((volume.current - volume.baseline) / volume.baseline) * 100;
  const priceSpike = ((price.current - price.baseline) / price.baseline) * 100;

  // Check for classic pump & dump signals
  if (volumeSpike < 40 || priceSpike < 20) {
    return null;
  }

  // Calculate confidence based on multiple factors
  let confidence = 0;

  // Volume spike factor
  if (volumeSpike > 100) confidence += 0.3;
  else if (volumeSpike > 60) confidence += 0.2;
  else confidence += 0.1;

  // Price spike factor
  if (priceSpike > 50) confidence += 0.3;
  else if (priceSpike > 30) confidence += 0.2;
  else confidence += 0.1;

  // Check for price history volatility (pump pattern)
  if (price.history.length >= 5) {
    const recentPrices = price.history.slice(-5);
    const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const volatility = recentPrices.reduce((sum, p) => sum + Math.abs(p - avgRecent), 0) / recentPrices.length;
    const volatilityPercent = (volatility / avgRecent) * 100;

    if (volatilityPercent > 20) confidence += 0.2;
  }

  // Determine severity
  let severity: ThreatSeverity = 'low';
  if (confidence > 0.7) severity = 'critical';
  else if (confidence > 0.5) severity = 'high';
  else if (confidence > 0.3) severity = 'medium';

  return {
    threatType: 'pump_dump',
    confidence: Math.min(confidence, 1),
    severity,
    description: `Potential pump & dump detected: ${volumeSpike.toFixed(0)}% volume spike with ${priceSpike.toFixed(0)}% price increase`,
    indicators: {
      volumeSpike,
      priceDeviation: priceSpike,
    },
    suggestedActions: [
      'Add manipulation warning banner to card page',
      'Pause price alerts for this card',
      'Notify users with this card in watchlist',
      'Flag for manual review',
    ],
  };
}

/**
 * Detect wash trading patterns (circular transactions)
 */
function detectWashTrading(
  transactions: Array<{
    sellerId: string;
    buyerId: string;
    price: number;
    timestamp: Date;
  }>
): ThreatDetectionResult | null {
  if (transactions.length < 3) return null;

  // Build transaction graph
  const graph = new Map<string, Set<string>>();
  const reverseTransactions = new Map<string, number>();

  for (const tx of transactions) {
    if (!graph.has(tx.sellerId)) {
      graph.set(tx.sellerId, new Set());
    }
    graph.get(tx.sellerId)!.add(tx.buyerId);

    // Track reverse transactions (A->B and B->A)
    const key = [tx.sellerId, tx.buyerId].sort().join('-');
    reverseTransactions.set(key, (reverseTransactions.get(key) ?? 0) + 1);
  }

  // Find circular patterns
  let circularCount = 0;
  for (const [, count] of reverseTransactions) {
    if (count >= 2) circularCount++;
  }

  if (circularCount === 0) return null;

  const circularRatio = circularCount / transactions.length;
  let confidence = circularRatio * 2; // Scale up

  let severity: ThreatSeverity = 'low';
  if (confidence > 0.6) severity = 'high';
  else if (confidence > 0.4) severity = 'medium';

  return {
    threatType: 'wash_trading',
    confidence: Math.min(confidence, 1),
    severity,
    description: `Potential wash trading: ${circularCount} circular transaction patterns detected`,
    indicators: {
      transactionPattern: 'circular',
    },
    suggestedActions: [
      'Flag involved accounts for review',
      'Exclude these transactions from price calculations',
      'Monitor for continued activity',
    ],
  };
}

/**
 * Detect shill bidding (new accounts bidding up prices)
 */
function detectShillBidding(
  transactions: Array<{
    sellerId: string;
    buyerId: string;
    price: number;
    timestamp: Date;
  }>,
  accounts: Array<{
    id: string;
    ageInDays: number;
    transactionCount: number;
  }>
): ThreatDetectionResult | null {
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  let newAccountBids = 0;
  let totalBids = 0;

  for (const tx of transactions) {
    const buyerAccount = accountMap.get(tx.buyerId);
    if (buyerAccount) {
      totalBids++;
      // Account less than 30 days old with few transactions
      if (buyerAccount.ageInDays < 30 && buyerAccount.transactionCount < 5) {
        newAccountBids++;
      }
    }
  }

  if (totalBids === 0 || newAccountBids === 0) return null;

  const newAccountRatio = newAccountBids / totalBids;
  if (newAccountRatio < 0.3) return null;

  const confidence = Math.min(newAccountRatio * 1.5, 1);
  let severity: ThreatSeverity = 'low';
  if (confidence > 0.7) severity = 'high';
  else if (confidence > 0.5) severity = 'medium';

  return {
    threatType: 'shill_bidding',
    confidence,
    severity,
    description: `Potential shill bidding: ${(newAccountRatio * 100).toFixed(0)}% of bids from new accounts`,
    indicators: {
      accountAge: 30, // threshold used
    },
    suggestedActions: [
      'Review new account bidding patterns',
      'Consider requiring account age for bidding',
      'Flag seller for monitoring',
    ],
  };
}

/**
 * Detect bot activity (timing patterns)
 */
function detectBotActivity(
  transactions: Array<{
    sellerId: string;
    buyerId: string;
    price: number;
    timestamp: Date;
  }>
): ThreatDetectionResult | null {
  if (transactions.length < 10) return null;

  // Sort by timestamp
  const sorted = [...transactions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Calculate time intervals between transactions
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime());
  }

  if (intervals.length === 0) return null;

  // Check for suspiciously regular intervals
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgInterval;

  // Very low CV suggests automated activity
  if (coefficientOfVariation > 0.3) return null;

  const confidence = Math.max(0, 1 - coefficientOfVariation * 3);
  let severity: ThreatSeverity = 'low';
  if (confidence > 0.7) severity = 'medium';
  else if (confidence > 0.5) severity = 'low';
  else return null;

  return {
    threatType: 'bot_activity',
    confidence,
    severity,
    description: `Potential bot activity: Suspiciously regular transaction timing (CV: ${coefficientOfVariation.toFixed(2)})`,
    indicators: {
      transactionPattern: 'regular_timing',
    },
    suggestedActions: [
      'Implement CAPTCHA for suspicious accounts',
      'Rate limit transactions from identified accounts',
      'Monitor for pattern continuation',
    ],
  };
}

// ============================================================================
// THREAT EVENT MANAGEMENT
// ============================================================================

/**
 * Record a detected threat event
 */
export async function recordThreatEvent(
  detection: ThreatDetectionResult,
  affectedNodeIds: string[] = [],
  affectedCardIds: string[] = []
): Promise<ThreatEvent> {
  const [event] = await db
    .insert(threatEvents)
    .values({
      threatType: detection.threatType,
      techniqueId: THREAT_TECHNIQUES[detection.threatType.toUpperCase() as keyof typeof THREAT_TECHNIQUES],
      severity: detection.severity,
      confidence: detection.confidence,
      affectedNodeIds,
      affectedCardIds,
      description: detection.description,
      indicators: detection.indicators,
      status: 'detected',
      suggestedActions: detection.suggestedActions,
      detectedAt: new Date(),
    })
    .returning()
    .execute();

  return event;
}

/**
 * Update threat event status
 */
export async function updateThreatStatus(
  eventId: string,
  status: ThreatStatus,
  mitigationTaken?: string
): Promise<ThreatEvent | null> {
  const updateData: Partial<ThreatEvent> = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'confirmed') {
    updateData.confirmedAt = new Date();
  }
  if (status === 'mitigated') {
    updateData.mitigatedAt = new Date();
    if (mitigationTaken) {
      updateData.mitigationTaken = mitigationTaken;
    }
  }

  const [updated] = await db
    .update(threatEvents)
    .set(updateData)
    .where(eq(threatEvents.id, eventId))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Get active threats
 */
export async function getActiveThreats(options?: {
  severity?: ThreatSeverity;
  threatType?: ThreatType;
  limit?: number;
}): Promise<ThreatEvent[]> {
  const conditions = [
    or(
      eq(threatEvents.status, 'detected'),
      eq(threatEvents.status, 'investigating'),
      eq(threatEvents.status, 'confirmed')
    ),
  ];

  if (options?.severity) {
    conditions.push(eq(threatEvents.severity, options.severity));
  }
  if (options?.threatType) {
    conditions.push(eq(threatEvents.threatType, options.threatType));
  }

  return db
    .select()
    .from(threatEvents)
    .where(and(...conditions))
    .orderBy(desc(threatEvents.detectedAt))
    .limit(options?.limit ?? 100)
    .execute();
}

/**
 * Get threats for specific cards
 */
export async function getThreatsForCards(cardIds: string[]): Promise<ThreatEvent[]> {
  if (cardIds.length === 0) return [];

  return db
    .select()
    .from(threatEvents)
    .where(
      sql`${threatEvents.affectedCardIds} ?| ${cardIds}`
    )
    .orderBy(desc(threatEvents.detectedAt))
    .execute();
}

// ============================================================================
// NETWORK GRAPH
// ============================================================================

/**
 * Add or update a network node
 */
export async function upsertNetworkNode(
  data: Omit<NewNetworkNode, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NetworkNode> {
  // Check if node exists by external ID
  if (data.externalId && data.externalSource) {
    const [existing] = await db
      .select()
      .from(networkNodes)
      .where(
        and(
          eq(networkNodes.externalId, data.externalId),
          eq(networkNodes.externalSource, data.externalSource)
        )
      )
      .limit(1)
      .execute();

    if (existing) {
      const [updated] = await db
        .update(networkNodes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(networkNodes.id, existing.id))
        .returning()
        .execute();
      return updated;
    }
  }

  const [node] = await db
    .insert(networkNodes)
    .values(data)
    .returning()
    .execute();

  return node;
}

/**
 * Add a network edge
 */
export async function addNetworkEdge(
  data: Omit<NewNetworkEdge, 'id' | 'createdAt'>
): Promise<NetworkEdge> {
  const [edge] = await db
    .insert(networkEdges)
    .values(data)
    .returning()
    .execute();

  return edge;
}

/**
 * Get network graph for visualization
 */
export async function getNetworkGraph(options?: {
  nodeTypes?: NetworkNode['nodeType'][];
  threatLevels?: NetworkNode['threatLevel'][];
  limit?: number;
}): Promise<{
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}> {
  let nodeQuery = db.select().from(networkNodes);

  const conditions = [];
  if (options?.nodeTypes && options.nodeTypes.length > 0) {
    conditions.push(inArray(networkNodes.nodeType, options.nodeTypes));
  }
  if (options?.threatLevels && options.threatLevels.length > 0) {
    conditions.push(inArray(networkNodes.threatLevel, options.threatLevels));
  }

  if (conditions.length > 0) {
    nodeQuery = db.select().from(networkNodes).where(and(...conditions));
  }

  const nodes = await nodeQuery.limit(options?.limit ?? 500).execute();

  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeIds = nodes.map(n => n.id);

  const edges = await db
    .select()
    .from(networkEdges)
    .where(
      or(
        inArray(networkEdges.sourceNodeId, nodeIds),
        inArray(networkEdges.targetNodeId, nodeIds)
      )
    )
    .execute();

  return { nodes, edges };
}

/**
 * Update node threat level based on connected threats
 */
export async function updateNodeThreatLevel(
  nodeId: string,
  threatLevel: NetworkNode['threatLevel'],
  riskScore: number
): Promise<NetworkNode | null> {
  const [updated] = await db
    .update(networkNodes)
    .set({
      threatLevel,
      riskScore,
      status: threatLevel === 'critical' ? 'compromised' : threatLevel === 'high' ? 'suspicious' : 'healthy',
      updatedAt: new Date(),
    })
    .where(eq(networkNodes.id, nodeId))
    .returning()
    .execute();

  return updated ?? null;
}

// ============================================================================
// THREAT ANALYTICS
// ============================================================================

/**
 * Get threat summary statistics
 */
export async function getThreatSummary(days = 7): Promise<{
  totalThreats: number;
  bySeverity: Record<ThreatSeverity, number>;
  byType: Record<ThreatType, number>;
  byStatus: Record<ThreatStatus, number>;
  avgConfidence: number;
  avgTimeToMitigation: number | null;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const threats = await db
    .select()
    .from(threatEvents)
    .where(gte(threatEvents.detectedAt, startDate))
    .execute();

  const bySeverity: Record<ThreatSeverity, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const byType: Record<ThreatType, number> = {
    pump_dump: 0,
    wash_trading: 0,
    price_manipulation: 0,
    shill_bidding: 0,
    account_compromise: 0,
    bot_activity: 0,
    ddil_attack: 0,
    unknown: 0,
  };

  const byStatus: Record<ThreatStatus, number> = {
    detected: 0,
    investigating: 0,
    confirmed: 0,
    mitigated: 0,
    false_positive: 0,
  };

  let totalConfidence = 0;
  let mitigationTimes: number[] = [];

  for (const t of threats) {
    bySeverity[t.severity]++;
    byType[t.threatType]++;
    byStatus[t.status]++;
    totalConfidence += t.confidence;

    if (t.mitigatedAt && t.detectedAt) {
      mitigationTimes.push(t.mitigatedAt.getTime() - t.detectedAt.getTime());
    }
  }

  return {
    totalThreats: threats.length,
    bySeverity,
    byType,
    byStatus,
    avgConfidence: threats.length > 0 ? totalConfidence / threats.length : 0,
    avgTimeToMitigation:
      mitigationTimes.length > 0
        ? mitigationTimes.reduce((a, b) => a + b, 0) / mitigationTimes.length
        : null,
  };
}
