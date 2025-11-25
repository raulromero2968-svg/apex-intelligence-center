/**
 * Defense AI Domain Pack
 *
 * RAG domain pack for defense/resilience concepts (pack-ai-defense-001).
 * Provides:
 * - Knowledge retrieval for DDIL, OODA, threat detection
 * - Prompt templates for resilience queries
 * - Agent persona for resilience assistance
 *
 * Adapted for TCG market intelligence context.
 *
 * @see pack-ai-defense-001 for source knowledge
 */

import { db } from '@/lib/db';
import { eq, desc, sql, and, or, ilike } from 'drizzle-orm';
import {
  defenseKnowledge,
  type DefenseKnowledge,
  type NewDefenseKnowledge,
} from '@/db/schema/defense';

// ============================================================================
// TYPES
// ============================================================================

export type KnowledgeDomain =
  | 'edge_ai'
  | 'digital_twin'
  | 'ooda'
  | 'threat_detection'
  | 'supply_chain'
  | 'general';

export type DocumentType =
  | 'concept'
  | 'pattern'
  | 'technique'
  | 'mitigation'
  | 'best_practice'
  | 'case_study';

export interface KnowledgeQuery {
  query: string;
  domain?: KnowledgeDomain;
  documentType?: DocumentType;
  tags?: string[];
  limit?: number;
}

export interface KnowledgeResult {
  document: DefenseKnowledge;
  relevanceScore: number;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES = {
  /**
   * Explain a defense concept in TCG context
   */
  CONCEPT_EXPLANATION: `
You are an expert in defense AI concepts adapted for TCG (Trading Card Game) market intelligence.

Context: The user is building applications on Apex Intelligence Platform which applies defense-grade resilience patterns to TCG markets.

Explain the following concept: {{concept}}

Provide:
1. A clear definition
2. How it applies to TCG market monitoring (e.g., price tracking, manipulation detection)
3. Key benefits for Apex users
4. Implementation considerations

Keep the explanation practical and focused on actionable insights.
`.trim(),

  /**
   * Analyze OODA bottlenecks
   */
  OODA_ANALYSIS: `
You are an OODA loop optimization expert for market intelligence systems.

Analyze the following OODA metrics and identify optimization opportunities:

Metrics:
- Observe latency: {{observeMs}}ms
- Orient latency: {{orientMs}}ms
- Decide latency: {{decideMs}}ms
- Act latency: {{actMs}}ms
- Total: {{totalMs}}ms
- Processing type: {{processingType}}

Bottleneck phase: {{bottleneck}}

Provide:
1. Root cause analysis for the bottleneck
2. Specific optimization recommendations
3. Expected improvement potential
4. Trade-offs to consider

Focus on practical improvements that can be implemented in a TCG market intelligence context.
`.trim(),

  /**
   * Threat pattern analysis
   */
  THREAT_ANALYSIS: `
You are a market manipulation detection specialist for TCG markets.

Analyze the following threat indicators:

Threat Type: {{threatType}}
Confidence: {{confidence}}
Severity: {{severity}}

Indicators:
{{indicators}}

Provide:
1. Explanation of what this threat pattern means
2. Likely actors and motivations
3. Potential impact on market participants
4. Recommended defensive actions
5. How to distinguish from legitimate activity

Be specific to the TCG market context (card collecting, trading, investing).
`.trim(),

  /**
   * DDIL resilience guidance
   */
  DDIL_GUIDANCE: `
You are a resilience architect for distributed market intelligence systems.

The user needs guidance on handling DDIL (Denied, Degraded, Intermittent, Limited) conditions.

Scenario: {{scenario}}
Current status: {{status}}
Affected components: {{components}}

Provide:
1. Immediate actions to maintain service continuity
2. Edge caching strategies for this scenario
3. Fallback data sources to consider
4. User communication recommendations
5. Recovery procedures once connectivity is restored

Focus on maintaining market data accuracy while handling degraded conditions.
`.trim(),

  /**
   * Resilience agent persona
   */
  RESILIENCE_AGENT: `
You are APEX-R, the Resilience Agent for Apex Intelligence Platform.

Your role:
- Help users understand and improve their application's resilience
- Explain defense concepts in accessible terms
- Guide through DDIL simulations and analysis
- Recommend optimizations based on OODA metrics
- Alert to potential threats and suggest mitigations

Current context:
{{context}}

User query: {{query}}

Respond helpfully while maintaining awareness of:
- TCG market specifics (card prices, exchanges, manipulation patterns)
- The importance of human oversight for critical decisions
- Ethical AI principles (transparency, reliability, traceability)

If the user asks about something outside your expertise, acknowledge it and suggest appropriate resources.
`.trim(),
} as const;

// ============================================================================
// KNOWLEDGE MANAGEMENT
// ============================================================================

/**
 * Seed the defense knowledge base with core concepts
 */
export async function seedDefenseKnowledge(): Promise<number> {
  const coreKnowledge: Omit<NewDefenseKnowledge, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // DDIL Concepts
    {
      documentType: 'concept',
      title: 'DDIL Environments',
      content: `DDIL (Denied, Degraded, Intermittent, Limited) environments describe conditions where network connectivity is unreliable or compromised. In TCG market intelligence:

- **Denied**: Complete loss of connectivity to data sources (exchange APIs down)
- **Degraded**: Reduced bandwidth or increased latency (slow price updates)
- **Intermittent**: Sporadic connectivity (missed data points)
- **Limited**: Restricted access (rate limits, partial data)

Resilience strategies include edge caching, local processing, and graceful degradation.`,
      domain: 'edge_ai',
      tags: ['ddil', 'resilience', 'connectivity', 'edge'],
      sourceRef: 'pack-ai-defense-001 §3.1',
      metadata: { reliability: 0.95 },
    },
    {
      documentType: 'technique',
      title: 'Edge Caching for Market Data',
      content: `Edge caching stores recent market data locally to maintain service during connectivity issues.

Implementation:
1. Cache last 24 hours of price data per tracked card
2. Store baseline metrics for anomaly detection
3. Implement TTL-based invalidation (15 minutes for prices)
4. Use stale-while-revalidate pattern for freshness

TCG Application: Keep price history and alerts functional even when exchange APIs are unavailable.`,
      domain: 'edge_ai',
      tags: ['caching', 'edge', 'resilience', 'prices'],
      sourceRef: 'pack-ai-defense-001 §3.1',
      metadata: { reliability: 0.9 },
    },

    // OODA Concepts
    {
      documentType: 'concept',
      title: 'OODA Loop',
      content: `OODA (Observe-Orient-Decide-Act) is a decision cycle framework:

- **Observe**: Collect data from market sources (prices, sales, population reports)
- **Orient**: Analyze and contextualize (RAG queries, ML models, trend analysis)
- **Decide**: Generate recommendations (buy/sell signals, alerts, optimizations)
- **Act**: Execute decisions (send notifications, update portfolios, flag manipulation)

Faster OODA loops = competitive advantage in market intelligence.`,
      domain: 'ooda',
      tags: ['ooda', 'decision', 'latency', 'optimization'],
      sourceRef: 'pack-ai-defense-001 §3.1',
      metadata: { reliability: 0.95 },
    },
    {
      documentType: 'best_practice',
      title: 'OODA Loop Optimization',
      content: `Strategies to compress OODA loops for TCG market decisions:

**Observe Phase**:
- Parallel data fetching from multiple sources
- Edge preprocessing to filter noise
- Incremental updates vs full refreshes

**Orient Phase**:
- Pre-computed embeddings for common queries
- Cached RAG results for frequent patterns
- Streaming analysis instead of batch

**Decide Phase**:
- Decision trees for common scenarios
- LLM shortcuts for obvious cases
- Pre-authorized action templates

**Act Phase**:
- Async notification delivery
- Batched non-urgent actions
- Priority queues for critical alerts`,
      domain: 'ooda',
      tags: ['ooda', 'optimization', 'performance', 'latency'],
      sourceRef: 'pack-ai-defense-001 §3.1',
      metadata: { reliability: 0.9 },
    },

    // Threat Detection Concepts
    {
      documentType: 'pattern',
      title: 'Pump and Dump Detection',
      content: `Pump and dump schemes artificially inflate card prices before selling.

Indicators:
- Volume spike >40% above baseline
- Price increase >20% without organic drivers
- New accounts driving activity
- Coordinated social media mentions
- Rapid sell-off after peak

Detection approach:
1. Monitor volume/price correlation
2. Track account age of active traders
3. Cross-reference social sentiment
4. Compare to historical patterns
5. Calculate confidence score

Mitigation: Warning banners, paused alerts, user notifications.`,
      domain: 'threat_detection',
      tags: ['manipulation', 'pump-dump', 'detection', 'fraud'],
      sourceRef: 'pack-ai-defense-001 §3.4',
      metadata: { reliability: 0.9 },
    },
    {
      documentType: 'pattern',
      title: 'Wash Trading Detection',
      content: `Wash trading creates fake volume through circular transactions.

Indicators:
- Same entities on both sides of transactions
- Circular transaction patterns (A→B→C→A)
- Prices consistently at or near market
- Regular timing intervals (bot-like)
- Lack of profit motive

Detection approach:
1. Build transaction graph
2. Find cycles in the graph
3. Analyze timing patterns
4. Check for price manipulation correlation

Mitigation: Exclude from volume calculations, flag accounts.`,
      domain: 'threat_detection',
      tags: ['manipulation', 'wash-trading', 'detection', 'fraud'],
      sourceRef: 'pack-ai-defense-001 §3.4',
      metadata: { reliability: 0.85 },
    },

    // Digital Twin Concepts
    {
      documentType: 'concept',
      title: 'Digital Twins for Market Simulation',
      content: `Digital twins are virtual models of market ecosystems for simulation and analysis.

TCG Applications:
- Model card set release cycles
- Simulate market reactions to announcements
- Test manipulation detection algorithms
- Visualize price relationships across exchanges

Components:
1. 3D market topology model
2. Real-time sensor overlays (prices, volumes)
3. Scenario simulation engine
4. Anomaly highlighting

Benefits: Test resilience without affecting real markets.`,
      domain: 'digital_twin',
      tags: ['digital-twin', 'simulation', 'modeling', 'visualization'],
      sourceRef: 'pack-ai-defense-001 §3.2',
      metadata: { reliability: 0.85 },
    },

    // Ethical AI
    {
      documentType: 'best_practice',
      title: 'Ethical AI Governance',
      content: `Principles for ethical AI in market intelligence:

**Human Oversight**:
- AI provides recommendations, humans make decisions
- Critical actions require explicit confirmation
- Full audit trail for all AI decisions

**Transparency**:
- Explain how recommendations are generated
- Show confidence scores and data sources
- Acknowledge limitations and uncertainties

**Reliability**:
- Test detection algorithms against false positives
- Regular model validation and retraining
- Graceful degradation when uncertain

**Accountability**:
- Log all system actions
- Enable post-hoc review
- Clear escalation paths for errors`,
      domain: 'general',
      tags: ['ethics', 'governance', 'oversight', 'compliance'],
      sourceRef: 'pack-ai-defense-001 §4',
      metadata: { reliability: 0.95 },
    },
  ];

  let inserted = 0;
  for (const doc of coreKnowledge) {
    try {
      await db.insert(defenseKnowledge).values(doc).execute();
      inserted++;
    } catch {
      // Likely duplicate, skip
    }
  }

  return inserted;
}

/**
 * Search knowledge base (keyword-based, for production add vector search)
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult[]> {
  const conditions = [];

  // Text search on title and content
  if (query.query) {
    const searchTerms = query.query.toLowerCase().split(' ').filter(t => t.length > 2);
    for (const term of searchTerms) {
      conditions.push(
        or(
          ilike(defenseKnowledge.title, `%${term}%`),
          ilike(defenseKnowledge.content, `%${term}%`)
        )
      );
    }
  }

  if (query.domain) {
    conditions.push(eq(defenseKnowledge.domain, query.domain));
  }

  if (query.documentType) {
    conditions.push(eq(defenseKnowledge.documentType, query.documentType));
  }

  let results: DefenseKnowledge[];

  if (conditions.length > 0) {
    results = await db
      .select()
      .from(defenseKnowledge)
      .where(and(...conditions))
      .limit(query.limit ?? 10)
      .execute();
  } else {
    results = await db
      .select()
      .from(defenseKnowledge)
      .limit(query.limit ?? 10)
      .execute();
  }

  // Simple relevance scoring based on title match
  return results.map(doc => ({
    document: doc,
    relevanceScore: calculateRelevance(doc, query.query),
  })).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calculate simple relevance score
 */
function calculateRelevance(doc: DefenseKnowledge, query: string): number {
  if (!query) return 0.5;

  const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  const titleLower = doc.title.toLowerCase();
  const contentLower = doc.content.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (titleLower.includes(term)) score += 0.3;
    if (contentLower.includes(term)) score += 0.1;
  }

  // Boost by reliability
  const reliability = (doc.metadata as { reliability?: number })?.reliability ?? 0.5;
  score *= reliability;

  return Math.min(score, 1);
}

/**
 * Get knowledge by domain
 */
export async function getKnowledgeByDomain(
  domain: KnowledgeDomain,
  limit = 20
): Promise<DefenseKnowledge[]> {
  return db
    .select()
    .from(defenseKnowledge)
    .where(eq(defenseKnowledge.domain, domain))
    .limit(limit)
    .execute();
}

/**
 * Add new knowledge document
 */
export async function addKnowledge(
  doc: Omit<NewDefenseKnowledge, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DefenseKnowledge> {
  const [inserted] = await db
    .insert(defenseKnowledge)
    .values(doc)
    .returning()
    .execute();

  return inserted;
}

// ============================================================================
// AGENT HELPERS
// ============================================================================

/**
 * Build context for resilience agent
 */
export async function buildAgentContext(options: {
  currentThreatCount?: number;
  oodaSummary?: {
    averageTotal: number;
    bottleneck: string;
  };
  edgeNodeStatus?: {
    total: number;
    online: number;
  };
}): Promise<string> {
  const contextParts: string[] = [];

  if (options.currentThreatCount !== undefined) {
    contextParts.push(`Active threats: ${options.currentThreatCount}`);
  }

  if (options.oodaSummary) {
    contextParts.push(
      `OODA average: ${options.oodaSummary.averageTotal}ms, bottleneck: ${options.oodaSummary.bottleneck}`
    );
  }

  if (options.edgeNodeStatus) {
    const healthPercent = options.edgeNodeStatus.total > 0
      ? Math.round((options.edgeNodeStatus.online / options.edgeNodeStatus.total) * 100)
      : 100;
    contextParts.push(`Edge network: ${healthPercent}% healthy (${options.edgeNodeStatus.online}/${options.edgeNodeStatus.total})`);
  }

  return contextParts.join('\n');
}

/**
 * Fill a prompt template with values
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  let filled = template;
  for (const [key, value] of Object.entries(values)) {
    filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return filled;
}

/**
 * Get relevant knowledge for a query and build RAG context
 */
export async function buildRagContext(query: string, maxDocs = 3): Promise<string> {
  const results = await searchKnowledge({ query, limit: maxDocs });

  if (results.length === 0) {
    return 'No specific knowledge found for this query.';
  }

  const contextParts = results.map((r, i) => `
[Document ${i + 1}: ${r.document.title}]
${r.document.content}
Source: ${r.document.sourceRef ?? 'Internal knowledge'}
`);

  return `Relevant knowledge:\n${contextParts.join('\n---\n')}`;
}
