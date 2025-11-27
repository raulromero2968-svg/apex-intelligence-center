/**
 * IPFS Provenance Logging for Apex Intelligence
 *
 * This module provides immutable provenance tracking via IPFS (Pinata).
 * Every RAG query/response is logged to IPFS for:
 * - EU AI Act high-risk compliance (transparency + auditability)
 * - Patent protection (timestamped human conception statements)
 * - Trust building (users can verify provenance chains)
 *
 * Why IPFS + Pinata:
 * - Content-addressed storage (CID = cryptographic hash of content)
 * - Immutable and tamper-proof
 * - Distributed (not dependent on single server)
 * - Pinata provides reliable pinning service + gateway
 *
 * Cost: ~$20/mo for 100GB storage (sufficient for 1M+ RAG traces)
 */

import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

/**
 * RAG trace object for IPFS logging
 */
export interface RagTrace {
  query: string;
  response: string;
  sources: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    score: number;
    source_type: string;
  }>;
  citationCount: number;
  synthesisCount: number;
  noveltyScore: number; // 0-1, >0.7 triggers human review
  isValid: boolean;
  validationErrors?: string[];
  userId?: string;
  timestamp: string; // ISO 8601
  systemVersion: string; // Git SHA
  model: string;
  euAiAct: 'high-risk-compliant';
}

/**
 * Human conception statement for novel insights
 */
export interface HumanConceptionStatement {
  insightId: string;
  researcherId: string;
  statement: string;
  promptChain: any[];
  signature: string;
  timestamp: string;
}

/**
 * IPFS Pinning Service (Pinata)
 */
export class IpfsProvenanceLogger {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private baseUrl = 'https://api.pinata.cloud';
  private gatewayUrl = 'https://gateway.pinata.cloud/ipfs';

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || '';
    this.apiSecret = process.env.PINATA_API_SECRET || '';
    this.jwt = process.env.PINATA_JWT || '';

    if (!this.jwt && (!this.apiKey || !this.apiSecret)) {
      console.warn(
        'Pinata credentials not set. IPFS provenance logging will fail. Set PINATA_JWT or (PINATA_API_KEY + PINATA_API_SECRET) in environment variables.'
      );
    }
  }

  /**
   * Log RAG trace to IPFS
   *
   * @param trace - Complete RAG trace with query, response, sources, citations
   * @returns IPFS CID and gateway URL
   *
   * @example
   * ```typescript
   * const logger = new IpfsProvenanceLogger();
   * const { cid, url } = await logger.logRagTrace(trace);
   * console.log(`Provenance: ${url}`);
   * ```
   */
  async logRagTrace(trace: RagTrace): Promise<{ cid: string; url: string; hash: string }> {
    const enrichedTrace = {
      ...trace,
      timestamp: trace.timestamp || new Date().toISOString(),
      systemVersion: trace.systemVersion || process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      euAiAct: 'high-risk-compliant' as const,
    };

    // Generate cryptographic hash for quick verification
    const hash = this.hashTrace(enrichedTrace);

    try {
      const cid = await this.pinJson(enrichedTrace, {
        name: `rag-trace-${hash.slice(0, 12)}`,
        keyvalues: {
          type: 'rag_trace',
          noveltyScore: String(trace.noveltyScore),
          citationCount: String(trace.citationCount),
          timestamp: enrichedTrace.timestamp,
        },
      });

      const url = `${this.gatewayUrl}/${cid}`;

      return { cid, url, hash };
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          traceHash: hash,
          query: trace.query.slice(0, 100),
        },
      });
      throw new Error(`Failed to log RAG trace to IPFS: ${error}`);
    }
  }

  /**
   * Log human conception statement to IPFS
   *
   * @param statement - Human-authored conception statement for novel insight
   * @returns IPFS CID and gateway URL
   */
  async logConceptionStatement(
    statement: HumanConceptionStatement
  ): Promise<{ cid: string; url: string }> {
    try {
      const cid = await this.pinJson(statement, {
        name: `conception-${statement.insightId}`,
        keyvalues: {
          type: 'human_conception',
          researcherId: statement.researcherId,
          insightId: statement.insightId,
          timestamp: statement.timestamp,
        },
      });

      const url = `${this.gatewayUrl}/${cid}`;

      return { cid, url };
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          insightId: statement.insightId,
          researcherId: statement.researcherId,
        },
      });
      throw new Error(`Failed to log conception statement to IPFS: ${error}`);
    }
  }

  /**
   * Pin JSON to IPFS via Pinata
   *
   * @param data - JSON data to pin
   * @param metadata - Optional pinata metadata
   * @returns IPFS CID
   */
  private async pinJson(
    data: any,
    metadata?: {
      name?: string;
      keyvalues?: Record<string, string>;
    }
  ): Promise<string> {
    const body = {
      pinataContent: data,
      pinataMetadata: metadata || {},
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Use JWT if available, otherwise use API key/secret
    if (this.jwt) {
      headers.Authorization = `Bearer ${this.jwt}`;
    } else {
      headers.pinata_api_key = this.apiKey;
      headers.pinata_secret_api_key = this.apiSecret;
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Pinata API error (${response.status}): ${errorText}`
      );
    }

    const result = await response.json();
    return result.IpfsHash; // CID
  }

  /**
   * Generate SHA-256 hash of RAG trace for quick verification
   *
   * @param trace - RAG trace object
   * @returns Hex-encoded SHA-256 hash (64 characters)
   */
  private hashTrace(trace: RagTrace): string {
    const canonical = JSON.stringify(trace, Object.keys(trace).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Verify trace integrity against IPFS CID
   *
   * @param cid - IPFS CID
   * @param trace - Expected trace object
   * @returns True if trace matches CID content
   */
  async verifyTrace(cid: string, trace: RagTrace): Promise<boolean> {
    try {
      const response = await fetch(`${this.gatewayUrl}/${cid}`);
      if (!response.ok) {
        return false;
      }

      const storedTrace = await response.json();
      const storedHash = this.hashTrace(storedTrace);
      const expectedHash = this.hashTrace(trace);

      return storedHash === expectedHash;
    } catch (error) {
      Sentry.captureException(error, { extra: { cid } });
      return false;
    }
  }
}

/**
 * Factory function for IPFS provenance logger
 *
 * @returns Configured IpfsProvenanceLogger instance
 */
export function createIpfsLogger(): IpfsProvenanceLogger {
  return new IpfsProvenanceLogger();
}

/**
 * Quick hash function for trace identification
 *
 * @param data - Any JSON-serializable data
 * @returns SHA-256 hash
 */
export function hashData(data: any): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

