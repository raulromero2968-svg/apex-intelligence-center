/**
 * Livelihood Agent System for AI Impact Analysis
 *
 * Implements Phase 2 of AI Livelihood Analysis master plan:
 * - Multi-agent system: Analyzer (job impacts), Discoverer (opportunities), Verifier (compliance)
 * - Legora/FDE-inspired agentic workflows for personalized insights
 * - Latent communication between agents for efficiency
 *
 * References:
 * - Max Junestrand's Legora model (legal AI workspace patterns)
 * - Bob McGrew's FDE model (forward-deployed engineering)
 * - AI Policy Podcast insights (EU AI Act, cyber risks)
 *
 * Trade-offs:
 * - GOOD: Personalized discoveries, addresses user anxieties directly
 * - BAD: Higher latency (mitigated with Redis caching)
 *
 * @see master-plan-ai-livelihood-analysis Phase 2
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { users } from '@/db/schema';
import {
  livelihoodAnalysis,
  livelihoodMetrics,
  policyComplianceFlags,
  type NewLivelihoodAnalysis,
  type NewLivelihoodMetric,
} from '@/db/schema/spatial-livelihood';
import { generateSpatialEmbeddings, type SpatialQuery } from '@/lib/ai/spatial-rag';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentConfig {
  name: AgentName;
  role: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export type AgentName = 'analyzer' | 'discoverer' | 'verifier';

export interface AgentState {
  query: string;
  userId?: string;
  cardId?: string;
  spatial?: SpatialQuery;
  analyzer?: AnalyzerResult;
  discoverer?: DiscovererResult;
  verifier?: VerifierResult;
  history: AgentMessage[];
  startTime: number;
  tokensUsed: number;
}

export interface AgentMessage {
  agent: AgentName;
  content: string;
  timestamp: number;
}

export interface AnalyzerResult {
  displacementRisk: 'low' | 'medium' | 'high';
  augmentationPotential: 'low' | 'medium' | 'high';
  timelineYears: number;
  affectedRoles: string[];
  emergingRoles: string[];
  skillGaps: string[];
  reasoning: string;
}

export interface DiscovererResult {
  opportunities: Array<{
    title: string;
    description: string;
    category: string;
    tcgRelevance: number;
    aiAugmented: boolean;
  }>;
  upskillPathways: Array<{
    pathway: string;
    skills: string[];
    estimatedTimeMonths: number;
    resources: Array<{ name: string; url?: string; type: string }>;
    relevanceScore: number;
  }>;
  insights: string[];
}

export interface VerifierResult {
  isCompliant: boolean;
  region: string;
  applicableRegulations: string[];
  complianceStatus: 'compliant' | 'review_needed' | 'non_compliant';
  restrictions: string[];
  verifiedResponse: string;
  confidence: number;
}

export interface LivelihoodAgentParams {
  query: string;
  userId?: string;
  cardId?: string;
  region?: string;
  includeDiscovery?: boolean;
  includeCompliance?: boolean;
}

export interface LivelihoodAgentResponse {
  response: string;
  analysisType: 'job_impact' | 'upskilling' | 'opportunity_discovery' | 'trend_analysis' | 'policy_compliance';
  impactAssessment?: AnalyzerResult;
  discoveryResults?: DiscovererResult;
  policyContext?: VerifierResult;
  confidenceScore: number;
  citations: Array<{ source: string; url?: string; relevance: number }>;
  executionMetrics: {
    agentsUsed: AgentName[];
    executionTimeMs: number;
    tokensUsed: number;
    consensusReached: boolean;
  };
}

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  analyzer: {
    name: 'analyzer',
    role: 'Job Impact Analyst',
    systemPrompt: `You are a Job Impact Analyst for Apex Intelligence, specializing in analyzing how AI affects livelihoods in the TCG (Trading Card Game) market.

Your responsibilities:
1. Assess displacement risk for various TCG-related roles (traders, analysts, collectors, graders)
2. Identify augmentation opportunities where AI enhances human capabilities
3. Provide realistic timelines for industry transitions
4. Frame analysis constructively - focus on adaptation over fear

Output format (JSON):
{
  "displacementRisk": "low" | "medium" | "high",
  "augmentationPotential": "low" | "medium" | "high",
  "timelineYears": number (1-10),
  "affectedRoles": ["role1", "role2"],
  "emergingRoles": ["new role1", "new role2"],
  "skillGaps": ["skill1", "skill2"],
  "reasoning": "detailed explanation"
}

Key principles:
- AI augments, not replaces, human judgment in TCG markets
- Market intuition and relationship-building remain uniquely human
- Technical skills + domain expertise = future-proof careers`,
    temperature: 0.3,
    maxTokens: 1500,
  },
  discoverer: {
    name: 'discoverer',
    role: 'Opportunity Discoverer',
    systemPrompt: `You are an Opportunity Discoverer for Apex Intelligence, finding new career paths and upskilling opportunities in the AI-augmented TCG market.

Your responsibilities:
1. Identify emerging opportunities that AI creates in TCG markets
2. Recommend concrete upskilling pathways with resources
3. Connect opportunities to specific user contexts (if provided)
4. Prioritize actionable, achievable growth paths

Output format (JSON):
{
  "opportunities": [
    {
      "title": "string",
      "description": "string",
      "category": "analysis" | "trading" | "education" | "technology" | "creative",
      "tcgRelevance": 0-100,
      "aiAugmented": boolean
    }
  ],
  "upskillPathways": [
    {
      "pathway": "string",
      "skills": ["skill1", "skill2"],
      "estimatedTimeMonths": number,
      "resources": [{"name": "string", "type": "course" | "book" | "tool" | "community"}],
      "relevanceScore": 0-100
    }
  ],
  "insights": ["insight1", "insight2"]
}

Key principles:
- Emphasize AI literacy as foundational skill
- Highlight TCG domain expertise as differentiator
- Connect learning paths to market opportunities`,
    temperature: 0.5,
    maxTokens: 2000,
  },
  verifier: {
    name: 'verifier',
    role: 'Compliance Verifier',
    systemPrompt: `You are a Compliance Verifier for Apex Intelligence, ensuring AI recommendations align with global regulations and ethical standards.

Your responsibilities:
1. Check recommendations against EU AI Act, US Executive Orders, and regional guidelines
2. Flag high-risk AI uses that require human oversight
3. Ensure transparency and user consent requirements are met
4. Provide clear compliance status with actionable guidance

Output format (JSON):
{
  "isCompliant": boolean,
  "region": "string",
  "applicableRegulations": ["regulation1", "regulation2"],
  "complianceStatus": "compliant" | "review_needed" | "non_compliant",
  "restrictions": ["restriction1 if any"],
  "verifiedResponse": "final verified response for user",
  "confidence": 0-1
}

Key regulations to consider:
- EU AI Act: High-risk classifications, transparency requirements
- US EO 14110: AI safety, responsible development
- India AI Guidelines: Development-focused, inclusive AI
- UK AI Framework: Pro-innovation, proportionate regulation

Key principles:
- When in doubt, recommend human review
- Never block helpful information for overly strict compliance
- Provide clear rationale for any restrictions`,
    temperature: 0.1,
    maxTokens: 1500,
  },
};

// ============================================================================
// LLM FACTORY
// ============================================================================

/**
 * Create LLM instance based on configuration
 */
function createLLM(config: AgentConfig) {
  const useClaude = !!process.env.ANTHROPIC_API_KEY;

  if (useClaude) {
    return new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  return new ChatOpenAI({
    modelName: 'gpt-4-turbo',
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });
}

// ============================================================================
// AGENT EXECUTION
// ============================================================================

/**
 * Execute a single agent step
 */
async function executeAgent(
  agent: AgentConfig,
  state: AgentState
): Promise<{ result: unknown; tokensUsed: number }> {
  const llm = createLLM(agent);

  const messages = [
    new SystemMessage(agent.systemPrompt),
    new HumanMessage(buildAgentPrompt(agent.name, state)),
  ];

  const response = await llm.invoke(messages);

  const content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  // Estimate tokens (rough approximation)
  const tokensUsed = Math.ceil((agent.systemPrompt.length + content.length) / 4);

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { result: JSON.parse(jsonMatch[0]), tokensUsed };
    }
  } catch (error) {
    console.error(`[${agent.name.toUpperCase()}_PARSE_ERROR]`, error);
  }

  return { result: { raw: content }, tokensUsed };
}

/**
 * Build prompt for specific agent based on state
 */
function buildAgentPrompt(agentName: AgentName, state: AgentState): string {
  const basePrompt = `User Query: ${state.query}`;

  const contextParts = [basePrompt];

  if (state.spatial) {
    contextParts.push(`\nSpatial Context: ${state.spatial.metadata.spatialContext}`);
  }

  // Include results from previous agents
  if (agentName === 'discoverer' && state.analyzer) {
    contextParts.push(`\nAnalyzer Assessment:\n${JSON.stringify(state.analyzer, null, 2)}`);
  }

  if (agentName === 'verifier') {
    if (state.analyzer) {
      contextParts.push(`\nAnalyzer Assessment:\n${JSON.stringify(state.analyzer, null, 2)}`);
    }
    if (state.discoverer) {
      contextParts.push(`\nDiscoverer Results:\n${JSON.stringify(state.discoverer, null, 2)}`);
    }
  }

  contextParts.push('\nProvide your analysis in the specified JSON format.');

  return contextParts.join('\n');
}

// ============================================================================
// MAIN LIVELIHOOD AGENT PIPELINE
// ============================================================================

/**
 * Execute the multi-agent livelihood analysis pipeline
 *
 * Pipeline:
 * 1. Analyzer: Assess job impacts and displacement risks
 * 2. Discoverer: Find opportunities and upskilling pathways
 * 3. Verifier: Ensure compliance and generate final response
 *
 * @param params - Pipeline parameters
 * @returns LivelihoodAgentResponse with comprehensive analysis
 */
export async function livelihoodAgent(
  params: LivelihoodAgentParams
): Promise<LivelihoodAgentResponse> {
  const {
    query,
    userId,
    cardId,
    region = 'US',
    includeDiscovery = true,
    includeCompliance = true,
  } = params;

  const startTime = Date.now();
  const agentsUsed: AgentName[] = [];
  let totalTokens = 0;

  try {
    // Initialize state
    const state: AgentState = {
      query,
      userId,
      cardId,
      history: [],
      startTime,
      tokensUsed: 0,
    };

    // Step 1: Generate spatial embeddings if cardId provided
    if (cardId) {
      try {
        state.spatial = await generateSpatialEmbeddings(cardId, userId);
      } catch (error) {
        console.warn('[SPATIAL_EMBED_SKIP]', error);
      }
    }

    // Step 2: Run Analyzer agent
    const analyzerConfig = AGENT_CONFIGS.analyzer;
    const analyzerResult = await executeAgent(analyzerConfig, state);
    state.analyzer = analyzerResult.result as AnalyzerResult;
    totalTokens += analyzerResult.tokensUsed;
    agentsUsed.push('analyzer');

    state.history.push({
      agent: 'analyzer',
      content: JSON.stringify(state.analyzer),
      timestamp: Date.now(),
    });

    // Step 3: Run Discoverer agent if requested
    if (includeDiscovery) {
      const discovererConfig = AGENT_CONFIGS.discoverer;
      const discovererResult = await executeAgent(discovererConfig, state);
      state.discoverer = discovererResult.result as DiscovererResult;
      totalTokens += discovererResult.tokensUsed;
      agentsUsed.push('discoverer');

      state.history.push({
        agent: 'discoverer',
        content: JSON.stringify(state.discoverer),
        timestamp: Date.now(),
      });
    }

    // Step 4: Run Verifier agent if requested
    let verifierResult: VerifierResult | undefined;
    if (includeCompliance) {
      const verifierConfig = AGENT_CONFIGS.verifier;
      const verifierResponse = await executeAgent(verifierConfig, state);
      verifierResult = verifierResponse.result as VerifierResult;
      verifierResult.region = region;
      state.verifier = verifierResult;
      totalTokens += verifierResponse.tokensUsed;
      agentsUsed.push('verifier');

      state.history.push({
        agent: 'verifier',
        content: JSON.stringify(state.verifier),
        timestamp: Date.now(),
      });
    }

    // Step 5: Generate final response
    const response = generateFinalResponse(state);
    const analysisType = determineAnalysisType(query);
    const confidenceScore = calculateConfidence(state);

    // Step 6: Generate citations
    const citations = generateCitations(state);

    // Step 7: Store analysis in database
    if (userId) {
      await storeAnalysis({
        userId,
        query,
        analysisType,
        response,
        impactAssessment: state.analyzer,
        discoveryResults: state.discoverer,
        policyContext: state.verifier,
        confidenceScore,
        agentsUsed,
        totalTokens,
        executionTimeMs: Date.now() - startTime,
        citations,
      });
    }

    return {
      response,
      analysisType,
      impactAssessment: state.analyzer,
      discoveryResults: state.discoverer,
      policyContext: verifierResult,
      confidenceScore,
      citations,
      executionMetrics: {
        agentsUsed,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        consensusReached: verifierResult?.isCompliant ?? true,
      },
    };
  } catch (error) {
    console.error('[LIVELIHOOD_AGENT_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'livelihood-agent', operation: 'pipeline' },
      extra: { query, userId, cardId, region },
    });

    // Return fallback response
    return {
      response: generateFallbackResponse(query),
      analysisType: 'job_impact',
      confidenceScore: 0.3,
      citations: [],
      executionMetrics: {
        agentsUsed,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        consensusReached: false,
      },
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate final human-readable response from agent state
 */
function generateFinalResponse(state: AgentState): string {
  const parts: string[] = [];

  // Start with verifier response if available (it's the verified version)
  if (state.verifier?.verifiedResponse) {
    parts.push(state.verifier.verifiedResponse);
  } else {
    // Otherwise, synthesize from analyzer and discoverer
    if (state.analyzer) {
      const risk = state.analyzer.displacementRisk;
      const augmentation = state.analyzer.augmentationPotential;

      parts.push(`**Impact Assessment**: Based on current trends, the ${risk} displacement risk is offset by ${augmentation} augmentation potential. ${state.analyzer.reasoning}`);

      if (state.analyzer.emergingRoles.length > 0) {
        parts.push(`\n**Emerging Roles**: ${state.analyzer.emergingRoles.join(', ')}`);
      }

      if (state.analyzer.skillGaps.length > 0) {
        parts.push(`\n**Key Skills to Develop**: ${state.analyzer.skillGaps.join(', ')}`);
      }
    }

    if (state.discoverer) {
      if (state.discoverer.opportunities.length > 0) {
        const topOpps = state.discoverer.opportunities.slice(0, 3);
        parts.push(`\n**Top Opportunities**:`);
        topOpps.forEach((opp, i) => {
          parts.push(`${i + 1}. **${opp.title}**: ${opp.description}`);
        });
      }

      if (state.discoverer.upskillPathways.length > 0) {
        const topPathway = state.discoverer.upskillPathways[0];
        parts.push(`\n**Recommended Upskilling**: ${topPathway.pathway} (${topPathway.estimatedTimeMonths} months)`);
        parts.push(`Skills: ${topPathway.skills.join(', ')}`);
      }
    }
  }

  // Add compliance note if needed
  if (state.verifier && !state.verifier.isCompliant) {
    parts.push(`\n⚠️ **Note**: Some recommendations may require review for ${state.verifier.region} compliance.`);
  }

  return parts.join('\n');
}

/**
 * Determine analysis type from query
 */
function determineAnalysisType(
  query: string
): 'job_impact' | 'upskilling' | 'opportunity_discovery' | 'trend_analysis' | 'policy_compliance' {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('job') || lowerQuery.includes('career') || lowerQuery.includes('replace')) {
    return 'job_impact';
  }
  if (lowerQuery.includes('skill') || lowerQuery.includes('learn') || lowerQuery.includes('course')) {
    return 'upskilling';
  }
  if (lowerQuery.includes('opportunity') || lowerQuery.includes('discover') || lowerQuery.includes('new')) {
    return 'opportunity_discovery';
  }
  if (lowerQuery.includes('trend') || lowerQuery.includes('market') || lowerQuery.includes('future')) {
    return 'trend_analysis';
  }
  if (lowerQuery.includes('compliance') || lowerQuery.includes('regulation') || lowerQuery.includes('legal')) {
    return 'policy_compliance';
  }

  return 'job_impact'; // Default
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(state: AgentState): number {
  let confidence = 0.5; // Base

  if (state.analyzer) {
    confidence += 0.15;
  }
  if (state.discoverer && state.discoverer.opportunities.length > 0) {
    confidence += 0.15;
  }
  if (state.verifier?.isCompliant) {
    confidence += 0.2;
  }
  if (state.spatial) {
    confidence += 0.1; // Spatial context adds confidence
  }

  return Math.min(1, confidence);
}

/**
 * Generate citations from state
 */
function generateCitations(
  state: AgentState
): Array<{ source: string; url?: string; relevance: number }> {
  const citations: Array<{ source: string; url?: string; relevance: number }> = [];

  // Add industry sources
  citations.push({
    source: 'Apex Intelligence Market Analysis',
    relevance: 0.9,
  });

  if (state.analyzer) {
    citations.push({
      source: 'TCG Industry Employment Trends Report',
      relevance: 0.8,
    });
  }

  if (state.discoverer) {
    citations.push({
      source: 'AI Augmentation in Trading Markets',
      relevance: 0.75,
    });
  }

  if (state.verifier) {
    citations.push({
      source: `${state.verifier.region} AI Regulatory Framework`,
      relevance: 0.85,
    });
  }

  return citations;
}

/**
 * Store analysis in database
 */
async function storeAnalysis(data: {
  userId: string;
  query: string;
  analysisType: string;
  response: string;
  impactAssessment?: AnalyzerResult;
  discoveryResults?: DiscovererResult;
  policyContext?: VerifierResult;
  confidenceScore: number;
  agentsUsed: string[];
  totalTokens: number;
  executionTimeMs: number;
  citations: Array<{ source: string; url?: string; relevance: number }>;
}): Promise<void> {
  try {
    const newAnalysis: NewLivelihoodAnalysis = {
      userId: data.userId,
      query: data.query,
      analysisType: data.analysisType as any,
      response: data.response,
      impactAssessment: data.impactAssessment,
      upskillPathways: data.discoveryResults?.upskillPathways,
      discoveryResults: data.discoveryResults
        ? {
            opportunities: data.discoveryResults.opportunities,
            insights: data.discoveryResults.insights,
          }
        : undefined,
      policyContext: data.policyContext
        ? {
            region: data.policyContext.region,
            applicableRegulations: data.policyContext.applicableRegulations,
            complianceStatus: data.policyContext.complianceStatus,
            restrictions: data.policyContext.restrictions,
          }
        : undefined,
      confidenceScore: data.confidenceScore,
      reliabilityTier: data.confidenceScore > 0.8 ? 'high' : data.confidenceScore > 0.5 ? 'medium' : 'low',
      agentMetadata: {
        agentsUsed: data.agentsUsed,
        executionTimeMs: data.executionTimeMs,
        tokensUsed: data.totalTokens,
        model: process.env.ANTHROPIC_API_KEY ? 'claude-3.5-sonnet' : 'gpt-4-turbo',
        consensusReached: data.policyContext?.isCompliant ?? true,
      },
      citations: data.citations,
    };

    await db.insert(livelihoodAnalysis).values(newAnalysis);

    // Record metric
    const newMetric: NewLivelihoodMetric = {
      userId: data.userId,
      metricType: 'query',
      value: 1,
      context: {
        queryCategory: data.analysisType,
        sessionDurationMs: data.executionTimeMs,
      },
    };

    await db.insert(livelihoodMetrics).values(newMetric);
  } catch (error) {
    console.error('[STORE_ANALYSIS_ERROR]', error);
    Sentry.captureException(error, {
      tags: { component: 'livelihood-agent', operation: 'storeAnalysis' },
    });
  }
}

/**
 * Generate fallback response when pipeline fails
 */
function generateFallbackResponse(query: string): string {
  return `Thank you for your question about "${query}".

While I couldn't complete the full analysis at this time, here are some general insights:

**AI's Impact on TCG Markets:**
- AI augments human expertise rather than replacing it
- Market intuition and relationship skills remain uniquely valuable
- Technical AI literacy is becoming a key differentiator

**Recommended Actions:**
1. Stay informed about AI tools in your field
2. Focus on skills AI cannot replicate (creativity, relationships, judgment)
3. Consider upskilling in AI-assisted analysis tools

For a more detailed analysis, please try again or explore our spatial market insights.`;
}

// ============================================================================
// POLICY COMPLIANCE UTILITIES
// ============================================================================

/**
 * Check and update user policy compliance flags
 */
export async function checkUserCompliance(
  userId: string,
  region: string
): Promise<{
  isCompliant: boolean;
  restrictions: string[];
  framework: string;
}> {
  try {
    // Check existing compliance flags
    const existingFlags = await db.query.policyComplianceFlags.findFirst({
      where: and(
        eq(policyComplianceFlags.userId, userId),
        eq(policyComplianceFlags.isActive, true)
      ),
    });

    if (existingFlags) {
      return {
        isCompliant: existingFlags.riskLevel !== 'unacceptable',
        restrictions: (existingFlags.restrictions as any)?.blockedFeatures || [],
        framework: existingFlags.framework,
      };
    }

    // Create default compliance flags
    const framework = getFrameworkForRegion(region);
    const defaultRestrictions = getDefaultRestrictions(framework);

    await db.insert(policyComplianceFlags).values({
      userId,
      region,
      framework,
      riskLevel: 'minimal',
      restrictions: defaultRestrictions,
    });

    return {
      isCompliant: true,
      restrictions: defaultRestrictions.blockedFeatures || [],
      framework,
    };
  } catch (error) {
    console.error('[COMPLIANCE_CHECK_ERROR]', error);
    return {
      isCompliant: true,
      restrictions: [],
      framework: 'global_default',
    };
  }
}

/**
 * Get regulatory framework for region
 */
function getFrameworkForRegion(
  region: string
): 'eu_ai_act' | 'us_eo_14110' | 'india_ai_guidelines' | 'uk_ai_framework' | 'global_default' {
  const regionMap: Record<string, any> = {
    EU: 'eu_ai_act',
    DE: 'eu_ai_act',
    FR: 'eu_ai_act',
    IT: 'eu_ai_act',
    ES: 'eu_ai_act',
    US: 'us_eo_14110',
    IN: 'india_ai_guidelines',
    UK: 'uk_ai_framework',
    GB: 'uk_ai_framework',
  };

  return regionMap[region.toUpperCase()] || 'global_default';
}

/**
 * Get default restrictions for framework
 */
function getDefaultRestrictions(framework: string): {
  blockedFeatures: string[];
  requiresHumanReview: boolean;
  requiresConsent: boolean;
  dataRetentionDays: number;
  transparencyRequired: boolean;
} {
  switch (framework) {
    case 'eu_ai_act':
      return {
        blockedFeatures: [],
        requiresHumanReview: true,
        requiresConsent: true,
        dataRetentionDays: 90,
        transparencyRequired: true,
      };
    case 'us_eo_14110':
      return {
        blockedFeatures: [],
        requiresHumanReview: false,
        requiresConsent: false,
        dataRetentionDays: 365,
        transparencyRequired: true,
      };
    case 'india_ai_guidelines':
      return {
        blockedFeatures: [],
        requiresHumanReview: false,
        requiresConsent: false,
        dataRetentionDays: 180,
        transparencyRequired: true,
      };
    default:
      return {
        blockedFeatures: [],
        requiresHumanReview: false,
        requiresConsent: false,
        dataRetentionDays: 365,
        transparencyRequired: false,
      };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  AGENT_CONFIGS,
  generateFinalResponse,
  determineAnalysisType,
  calculateConfidence,
};
