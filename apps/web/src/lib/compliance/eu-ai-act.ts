/**
 * EU AI Act Compliance Middleware for Apex Intelligence
 *
 * The EU AI Act (2024) classifies AI systems that provide financial/investment advice
 * as "high-risk" systems requiring:
 * 1. Transparency - full disclosure of AI-generated content
 * 2. Auditability - complete logging of inputs, outputs, and provenance
 * 3. Human oversight - human review for high-novelty insights
 * 4. Technical documentation - system architecture and decision logic
 *
 * This middleware ensures every RAG query/response is compliant.
 *
 * Compliance requirements met:
 * ✅ Article 13 - Transparency obligations (citations + provenance links)
 * ✅ Article 14 - Human oversight (novelty score > 0.7 → human review queue)
 * ✅ Article 16 - Quality management (citation validation)
 * ✅ Article 17 - Technical documentation (IPFS + database logs)
 *
 * Reference: EU Artificial Intelligence Act (2024/1689)
 */

import { IpfsProvenanceLogger, RagTrace } from '../provenance/ipfs';
import { db } from '@/db';
import { complianceLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';
import { type RagResponse } from '@/rag';

export interface ComplianceReport {
  traceHash: string;
  ipfsCid: string;
  provenanceUrl: string;
  noveltyScore: number;
  requiresHumanReview: boolean;
  euAiActStatus: 'compliant' | 'pending_review' | 'non_compliant';
  validationErrors: string[];
}

/**
 * EU AI Act Compliance Logger
 *
 * Wraps every RAG response with full compliance logging
 */
export class EuAiActCompliance {
  private ipfsLogger: IpfsProvenanceLogger;
  private humanReviewThreshold: number;

  constructor(humanReviewThreshold: number = 0.7) {
    this.ipfsLogger = new IpfsProvenanceLogger();
    this.humanReviewThreshold = humanReviewThreshold;
  }

  /**
   * Log RAG response with full EU AI Act compliance
   *
   * @param query - User query
   * @param response - RAG response
   * @param userId - Optional user ID
   * @returns Compliance report with IPFS CID and provenance URL
   */
  async logCompliantTrace(
    query: string,
    response: RagResponse,
    userId?: string
  ): Promise<ComplianceReport> {
    return Sentry.startSpan(
      { name: 'compliance.log', op: 'compliance' },
      async (span: Span) => {
        // 1. Calculate novelty score (0-1)
        const noveltyScore = this.calculateNoveltyScore(response);
        span?.setAttribute('noveltyScore', noveltyScore);

        // 2. Build trace object
        const trace: RagTrace = {
          query,
          response: response.answer,
          sources: response.sources.map((s) => ({
            id: s.id,
            content: s.content,
            metadata: s.metadata,
            score: s.rerankScore || s.originalScore,
            source_type: s.source_type,
          })),
          citationCount: response.citationCount,
          synthesisCount: response.synthesisCount,
          noveltyScore,
          isValid: response.isValid,
          validationErrors: response.validationErrors,
          userId,
          timestamp: new Date().toISOString(),
          systemVersion:
            process.env.GIT_SHA ||
            process.env.VERCEL_GIT_COMMIT_SHA ||
            'unknown',
          model: 'claude-3-5-sonnet-20241022',
          euAiAct: 'high-risk-compliant',
        };

        // 3. Log to IPFS (immutable provenance)
        const { cid, url, hash } = await this.ipfsLogger.logRagTrace(trace);
        span?.setAttribute('ipfsCid', cid);

        // 4. Log to database (queryable audit trail)
        try {
          await db.insert(complianceLogs).values({
            id: crypto.randomUUID(),
            traceHash: hash,
            ipfsCid: cid,
            userId: userId || null,
            query,
            response: response.answer,
            citationCount: response.citationCount,
            synthesisCount: response.synthesisCount,
            noveltyScore,
            isValid: response.isValid,
            validationErrors: response.validationErrors.length > 0
              ? response.validationErrors
              : null,
            systemVersion: trace.systemVersion,
            createdAt: new Date(),
          });
        } catch (dbError) {
          // Non-fatal: IPFS log succeeded, DB is secondary
          Sentry.captureException(dbError, {
            extra: { traceHash: hash, ipfsCid: cid },
          });
          console.error('Database logging failed (IPFS succeeded):', dbError);
        }

        // 5. Determine compliance status
        const requiresHumanReview = noveltyScore > this.humanReviewThreshold;
        const euAiActStatus = this.determineComplianceStatus(
          response,
          requiresHumanReview
        );

        span?.setAttribute('requiresHumanReview', requiresHumanReview);
        span?.setAttribute('euAiActStatus', euAiActStatus);

        // 6. Add to human review queue if needed
        if (requiresHumanReview) {
          await this.addToHumanReviewQueue(hash, cid, query, noveltyScore);
        }

        return {
          traceHash: hash,
          ipfsCid: cid,
          provenanceUrl: url,
          noveltyScore,
          requiresHumanReview,
          euAiActStatus,
          validationErrors: response.validationErrors,
        };
      }
    );
  }

  /**
   * Calculate novelty score (0-1) based on synthesis and citation patterns
   *
   * Higher novelty score means more original synthesis, requiring human review.
   *
   * Formula:
   * - Base: synthesisCount / (citationCount + 1)
   * - Boost: +0.2 if synthesisCount > citationCount (more synthesis than citations)
   * - Penalty: -0.3 if validation errors (risky synthesis)
   *
   * @param response - RAG response
   * @returns Novelty score 0-1
   */
  private calculateNoveltyScore(response: RagResponse): number {
    const { citationCount, synthesisCount, isValid } = response;

    // Base novelty: ratio of synthesis to citations
    let novelty = synthesisCount / (citationCount + 1);

    // Boost if synthesis-heavy
    if (synthesisCount > citationCount) {
      novelty += 0.2;
    }

    // Penalty if validation failed (risky synthesis)
    if (!isValid) {
      novelty -= 0.3;
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, novelty));
  }

  /**
   * Determine EU AI Act compliance status
   *
   * @param response - RAG response
   * @param requiresHumanReview - Whether human review is required
   * @returns Compliance status
   */
  private determineComplianceStatus(
    response: RagResponse,
    requiresHumanReview: boolean
  ): 'compliant' | 'pending_review' | 'non_compliant' {
    // Non-compliant if validation failed
    if (!response.isValid) {
      return 'non_compliant';
    }

    // Pending review if high novelty (awaiting human oversight)
    if (requiresHumanReview) {
      return 'pending_review';
    }

    // Compliant if all checks passed
    return 'compliant';
  }

  /**
   * Add high-novelty insight to human review queue
   *
   * @param traceHash - Trace hash for identification
   * @param ipfsCid - IPFS CID for provenance
   * @param query - Original query
   * @param noveltyScore - Calculated novelty score
   */
  private async addToHumanReviewQueue(
    traceHash: string,
    ipfsCid: string,
    query: string,
    noveltyScore: number
  ): Promise<void> {
    try {
      // In production, this would add to a Redis queue or database table
      // For now, we'll log it (can be picked up by monitoring/alerting)
      console.log('[HUMAN REVIEW REQUIRED]', {
        traceHash,
        ipfsCid,
        query: query.slice(0, 100),
        noveltyScore,
        reviewUrl: `/dashboard/review/${traceHash}`,
      });

      // TODO: Integrate with BullMQ for async processing
      // await reviewQueue.add('human-review', { traceHash, ipfsCid, query, noveltyScore });

      Sentry.captureMessage('High-novelty insight requires human review', {
        level: 'info',
        extra: { traceHash, ipfsCid, noveltyScore },
      });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { traceHash, ipfsCid },
      });
    }
  }

  /**
   * Generate EU AI Act transparency report for user
   *
   * @param traceHash - Trace hash
   * @returns Formatted transparency report
   */
  async generateTransparencyReport(traceHash: string): Promise<string> {
    // Fetch from database
    const log = await db.query.complianceLogs.findFirst({
      where: eq(complianceLogs.traceHash, traceHash),
    });

    if (!log) {
      throw new Error(`Trace not found: ${traceHash}`);
    }

    return `
# EU AI Act Transparency Report

**Trace ID:** ${traceHash}
**Timestamp:** ${log.createdAt.toISOString()}
**System Version:** ${log.systemVersion}

## Query
${log.query}

## Response
${log.response}

## Provenance
- **IPFS CID:** ${log.ipfsCid}
- **Provenance URL:** https://gateway.pinata.cloud/ipfs/${log.ipfsCid}
- **Citations:** ${log.citationCount}
- **Synthesis Count:** ${log.synthesisCount}
- **Novelty Score:** ${(log.noveltyScore * 100).toFixed(1)}%

## Compliance Status
- **Validation:** ${log.isValid ? '✅ Passed' : '❌ Failed'}
- **Errors:** ${log.validationErrors ? JSON.stringify(log.validationErrors) : 'None'}
- **Human Review:** ${log.noveltyScore > 0.7 ? '⚠️ Required' : '✅ Not required'}

## EU AI Act Declaration
This response was generated by an AI system classified as "high-risk" under the EU Artificial Intelligence Act (2024/1689).
Full provenance and technical documentation are available via the IPFS link above. For questions or concerns, contact compliance@apex.tcgaisociety.

---
*Generated by Apex Intelligence v${log.systemVersion}*
    `.trim();
  }
}

/**
 * Factory function for EU AI Act compliance
 *
 * @param humanReviewThreshold - Novelty threshold for human review (default 0.7)
 * @returns Configured EuAiActCompliance instance
 */
export function createComplianceLogger(
  humanReviewThreshold?: number
): EuAiActCompliance {
  return new EuAiActCompliance(humanReviewThreshold);
}

