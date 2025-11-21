/**
 * Contrarian RAG Agent - Main Worker Function
 * 
 * Orchestrates the complete Contrarian RAG pipeline:
 * - Query embedding
 * - MMR retrieval with sentiment/cluster filtering
 * - Mainstream and contrarian answer generation
 * - False-correction loop detection
 * - Resilience scoring
 * 
 * This is the entry point called by the Intelligence Bus worker.
 */

import type {
  QueuedJobEnvelope,
  ContrarianJobPayload,
} from '@apex/shared/src/contracts/queues';
import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@apex/shared/src/logger';
import {
  retrieveCandidates,
  applyMMR,
  filterBySentimentAndCluster,
  type RetrievalConstraints,
} from './retrieval';
import {
  buildMainstreamPrompt,
  buildContrarianPrompt,
  extractSources,
} from './prompts';
import { detectFalseCorrectionLoop } from './falseCorrectionDetector';
import {
  computeResilienceScore,
  type AnswerForResilience,
} from './resilienceScoring';

const logger = createLogger('contrarian-rag-agent');

/**
 * Result payload structure matching user specification
 */
export interface ContrarianResultPayload {
  jobId: string;
  traceId: string;
  status: 'ok' | 'error';
  mainstreamAnswer: {
    text: string;
    sources: Array<{ id: string; url: string | null; type: string; author: string | null }>;
  } | null;
  contrarianAnswer: {
    text: string;
    sources: Array<{ id: string; url: string | null; type: string; author: string | null }>;
  } | null;
  diagnostics: {
    falseCorrectionLoopScore: number; // 0-1
    resilienceScore: number; // 0-1
    usedLowPrestigeSources: boolean;
    sentimentClusterSummary: Record<string, unknown>;
  };
  error: string | null;
}

/**
 * Run a contrarian RAG job
 * 
 * This is the main function called by the contrarian worker.
 * 
 * @param envelope - Job envelope containing jobId, traceId, payload, etc.
 * @returns Result payload with answers and diagnostics
 */
export async function runContrarianJob(
  envelope: QueuedJobEnvelope<ContrarianJobPayload>
): Promise<ContrarianResultPayload> {
  const { jobId, traceId, payload } = envelope;
  const { query, mode, constraints = {}, language = 'en' } = payload;

  return Sentry.startSpan(
    {
      name: 'contrarian.runJob',
      op: 'contrarian.rag',
      tags: {
        jobId,
        traceId,
        mode,
        language,
      },
    },
    async () => {
      try {
        logger.info('Starting contrarian RAG job', { jobId, traceId, query: query.slice(0, 100) });

        // 1. Generate query embedding (using OpenAI for 1536 dimensions to match database)
        const queryEmbedding = await generateQueryEmbedding(query);

        // 2. Parse constraints into retrieval constraints
        const retrievalConstraints = parseConstraints(constraints);

        // 3. Retrieve candidate documents
        const candidates = await retrieveCandidates(
          queryEmbedding,
          retrievalConstraints,
          50 // Initial retrieval limit
        );

        if (candidates.length === 0) {
          logger.warn('No candidates retrieved', { jobId });
          return {
            jobId,
            traceId,
            status: 'ok',
            mainstreamAnswer: null,
            contrarianAnswer: null,
            diagnostics: {
              falseCorrectionLoopScore: 0.0,
              resilienceScore: 0.0,
              usedLowPrestigeSources: false,
              sentimentClusterSummary: {},
            },
            error: null,
          };
        }

        // 4. Apply MMR for diversity
        const mmrCandidates = applyMMR(candidates, queryEmbedding, 0.7, 20);

        // 5. Filter by sentiment and cluster
        const filteredCandidates = filterBySentimentAndCluster(mmrCandidates, retrievalConstraints);

        // 6. Split candidates for mainstream vs contrarian
        const { mainstreamCandidates, contrarianCandidates } = splitCandidatesForMode(
          filteredCandidates,
          mode
        );

        // 7. Generate mainstream answer (if needed)
        let mainstreamAnswer: AnswerForResilience | null = null;
        if (mode === 'mainstream' || mode === 'both') {
          mainstreamAnswer = await generateAnswer(
            query,
            mainstreamCandidates,
            'mainstream',
            language
          );
        }

        // 8. Generate contrarian answer (if needed)
        let contrarianAnswer: AnswerForResilience | null = null;
        if (mode === 'contrarian' || mode === 'both') {
          contrarianAnswer = await generateAnswer(
            query,
            contrarianCandidates,
            'contrarian',
            language
          );
        }

        // 9. Compute false-correction loop score
        const falseCorrectionLoopScore = mainstreamAnswer
          ? await detectFalseCorrectionLoop(
              query,
              mainstreamAnswer.text,
              contrarianAnswer ? [contrarianAnswer.text] : []
            )
          : 0.0;

        // 10. Compute resilience score
        const resilienceScore = await computeResilienceScore(
          mainstreamAnswer,
          contrarianAnswer,
          filteredCandidates
        );

        // 11. Check if low-prestige sources were used
        const usedLowPrestigeSources = checkLowPrestigeUsage(
          mainstreamAnswer,
          contrarianAnswer,
          filteredCandidates
        );

        // 12. Generate sentiment cluster summary
        const sentimentClusterSummary = generateSentimentClusterSummary(filteredCandidates);

        logger.info('Contrarian RAG job completed', {
          jobId,
          hasMainstream: !!mainstreamAnswer,
          hasContrarian: !!contrarianAnswer,
          falseCorrectionScore: falseCorrectionLoopScore,
          resilienceScore,
        });

        return {
          jobId,
          traceId,
          status: 'ok',
          mainstreamAnswer: mainstreamAnswer
            ? {
                text: mainstreamAnswer.text,
                sources: mainstreamAnswer.sources,
              }
            : null,
          contrarianAnswer: contrarianAnswer
            ? {
                text: contrarianAnswer.text,
                sources: contrarianAnswer.sources,
              }
            : null,
          diagnostics: {
            falseCorrectionLoopScore,
            resilienceScore,
            usedLowPrestigeSources,
            sentimentClusterSummary,
          },
          error: null,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        Sentry.captureException(error, {
          extra: {
            jobId,
            traceId,
            query: query.slice(0, 100),
            mode,
          },
        });

        logger.error('Contrarian RAG job failed', {
          jobId,
          traceId,
          error: errorMessage,
        });

        return {
          jobId,
          traceId,
          status: 'error',
          mainstreamAnswer: null,
          contrarianAnswer: null,
          diagnostics: {
            falseCorrectionLoopScore: 0.0,
            resilienceScore: 0.0,
            usedLowPrestigeSources: false,
            sentimentClusterSummary: {},
          },
          error: errorMessage,
        };
      }
    }
  );
}

/**
 * Parse user constraints into retrieval constraints
 */
function parseConstraints(constraints: Record<string, unknown>): RetrievalConstraints {
  const result: RetrievalConstraints = {};

  if (typeof constraints.minSentiment === 'number') {
    result.minSentiment = constraints.minSentiment;
  }
  if (typeof constraints.maxSentiment === 'number') {
    result.maxSentiment = constraints.maxSentiment;
  }
  if (Array.isArray(constraints.clusterIds)) {
    result.clusterIds = constraints.clusterIds as number[];
  }
  if (Array.isArray(constraints.excludeClusterIds)) {
    result.excludeClusterIds = constraints.excludeClusterIds as number[];
  }
  if (Array.isArray(constraints.sourceTypes)) {
    result.sourceTypes = constraints.sourceTypes as string[];
  }
  if (Array.isArray(constraints.excludeSourceTypes)) {
    result.excludeSourceTypes = constraints.excludeSourceTypes as string[];
  }
  if (typeof constraints.language === 'string') {
    result.language = constraints.language;
  }

  return result;
}

/**
 * Split candidates for mainstream vs contrarian modes
 */
function splitCandidatesForMode(
  candidates: import('./retrieval').CandidateDoc[],
  mode: 'mainstream' | 'contrarian' | 'both'
): {
  mainstreamCandidates: import('./retrieval').CandidateDoc[];
  contrarianCandidates: import('./retrieval').CandidateDoc[];
} {
  // Define prestige levels
  const highPrestigeTypes = ['article', 'research', 'official', 'review'];
  const lowPrestigeTypes = ['forum', 'social', 'other'];

  if (mode === 'mainstream') {
    // Mainstream: prefer high-prestige sources
    const mainstream = candidates.filter((c) => highPrestigeTypes.includes(c.sourceType));
    const fallback = candidates.filter((c) => !highPrestigeTypes.includes(c.sourceType));
    return {
      mainstreamCandidates: [...mainstream, ...fallback].slice(0, 15),
      contrarianCandidates: [],
    };
  }

  if (mode === 'contrarian') {
    // Contrarian: prefer low-prestige, fringe sources
    const contrarian = candidates.filter((c) => lowPrestigeTypes.includes(c.sourceType));
    const fallback = candidates.filter((c) => !lowPrestigeTypes.includes(c.sourceType));
    return {
      mainstreamCandidates: [],
      contrarianCandidates: [...contrarian, ...fallback].slice(0, 15),
    };
  }

  // Both: split roughly 50/50 with preference for prestige
  const mainstream = candidates.filter((c) => highPrestigeTypes.includes(c.sourceType));
  const contrarian = candidates.filter((c) => lowPrestigeTypes.includes(c.sourceType));
  const neutral = candidates.filter(
    (c) => !highPrestigeTypes.includes(c.sourceType) && !lowPrestigeTypes.includes(c.sourceType)
  );

  return {
    mainstreamCandidates: [...mainstream, ...neutral.slice(0, 5)].slice(0, 10),
    contrarianCandidates: [...contrarian, ...neutral.slice(5)].slice(0, 10),
  };
}

/**
 * Generate query embedding using OpenAI (1536 dimensions to match database)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: query,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embeddings API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.data[0]?.embedding || [];
}

/**
 * Generate an answer using LLM
 */
async function generateAnswer(
  query: string,
  candidates: import('./retrieval').CandidateDoc[],
  answerType: 'mainstream' | 'contrarian',
  language: string
): Promise<AnswerForResilience> {
  if (candidates.length === 0) {
    return {
      text: `I don't have enough relevant information to provide a ${answerType} answer to this query.`,
      sources: [],
    };
  }

  const prompt =
    answerType === 'mainstream'
      ? buildMainstreamPrompt(query, candidates, language)
      : buildContrarianPrompt(query, candidates, language);

  // Call OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            answerType === 'mainstream'
              ? 'You are an expert TCG market analyst providing mainstream, consensus-based analysis.'
              : 'You are a contrarian TCG market analyst providing alternative perspectives that challenge mainstream views.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: answerType === 'mainstream' ? 0.3 : 0.5, // Contrarian can be slightly more creative
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answerText = data.choices[0]?.message?.content || '';

  // Extract sources from answer
  const sources = extractSources(answerText, candidates);

  return {
    text: answerText,
    sources,
  };
}

/**
 * Check if low-prestige sources were used
 */
function checkLowPrestigeUsage(
  mainstreamAnswer: AnswerForResilience | null,
  contrarianAnswer: AnswerForResilience | null,
  candidates: import('./retrieval').CandidateDoc[]
): boolean {
  const lowPrestigeTypes = ['forum', 'social', 'other'];
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const allSourceIds = new Set([
    ...(mainstreamAnswer?.sources.map((s) => s.id) || []),
    ...(contrarianAnswer?.sources.map((s) => s.id) || []),
  ]);

  for (const sourceId of allSourceIds) {
    const candidate = candidateMap.get(sourceId);
    if (candidate && lowPrestigeTypes.includes(candidate.sourceType)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate sentiment cluster summary
 */
function generateSentimentClusterSummary(
  candidates: import('./retrieval').CandidateDoc[]
): Record<string, unknown> {
  const clusterMap = new Map<number | null, { count: number; avgSentiment: number; sum: number }>();

  for (const candidate of candidates) {
    const cluster = candidate.clusterId;
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, { count: 0, avgSentiment: 0, sum: 0 });
    }
    const stats = clusterMap.get(cluster)!;
    stats.count++;
    if (candidate.sentimentScore !== null) {
      stats.sum += candidate.sentimentScore;
    }
  }

  const summary: Record<string, unknown> = {
    totalClusters: clusterMap.size,
    clusters: {},
  };

  for (const [clusterId, stats] of clusterMap.entries()) {
    const avgSentiment = stats.count > 0 ? stats.sum / stats.count : null;
    summary.clusters[clusterId === null ? 'null' : String(clusterId)] = {
      documentCount: stats.count,
      averageSentiment: avgSentiment,
    };
  }

  return summary;
}

