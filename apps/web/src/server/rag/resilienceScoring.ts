/**
 * Resilience Scoring for Contrarian RAG
 * 
 * Computes a resilience score (0-1) indicating how robust and stable
 * the answers are under perturbations and how well they handle uncertainty.
 */

import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@apex/shared/src/logger';
import type { CandidateDoc } from './retrieval';

const logger = createLogger('contrarian-resilience-scoring');

/**
 * Answer structure for resilience analysis
 */
export interface AnswerForResilience {
  text: string;
  sources: Array<{ id: string; url: string | null; type: string; author: string | null }>;
}

/**
 * Compute resilience score for answers
 * 
 * High resilience (close to 1.0) indicates:
 * - Both answers acknowledge uncertainties
 * - Both use diverse sources
 * - Answers remain stable under perturbations (e.g., slight query changes)
 * 
 * Low resilience (close to 0.0) indicates:
 * - Overconfident answers without uncertainty acknowledgment
 * - Narrow source diversity
 * - Answers change significantly under small perturbations
 * 
 * @param mainstreamAnswer - Mainstream answer
 * @param contrarianAnswer - Contrarian answer (can be null)
 * @param candidates - Retrieved candidate documents
 * @returns Resilience score (0-1)
 */
export async function computeResilienceScore(
  mainstreamAnswer: AnswerForResilience | null,
  contrarianAnswer: AnswerForResilience | null,
  candidates: CandidateDoc[]
): Promise<number> {
  return Sentry.startSpan(
    { name: 'contrarian.computeResilienceScore', op: 'analysis' },
    async () => {
      if (!mainstreamAnswer && !contrarianAnswer) {
        return 0.0; // No answers = no resilience
      }

      const scores: number[] = [];

      // 1. Uncertainty Acknowledgment Score
      if (mainstreamAnswer) {
        scores.push(scoreUncertaintyAcknowledgment(mainstreamAnswer.text));
      }
      if (contrarianAnswer) {
        scores.push(scoreUncertaintyAcknowledgment(contrarianAnswer.text));
      }

      // 2. Source Diversity Score
      const allSources = [
        ...(mainstreamAnswer?.sources || []),
        ...(contrarianAnswer?.sources || []),
      ];
      scores.push(scoreSourceDiversity(allSources, candidates));

      // 3. Answer Stability Score (simulated via perturbation)
      if (mainstreamAnswer && contrarianAnswer) {
        scores.push(
          await scoreAnswerStability(mainstreamAnswer.text, contrarianAnswer.text)
        );
      } else if (mainstreamAnswer) {
        scores.push(await scoreAnswerStability(mainstreamAnswer.text, null));
      }

      // 4. Source Prestige Diversity Score
      scores.push(scorePrestigeDiversity(allSources, candidates));

      // Average the component scores
      const finalScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0.5;

      logger.debug('Computed resilience score', {
        componentScores: scores,
        finalScore,
        hasMainstream: !!mainstreamAnswer,
        hasContrarian: !!contrarianAnswer,
      });

      return Math.max(0, Math.min(1, finalScore)); // Clamp to [0, 1]
    }
  );
}

/**
 * Score uncertainty acknowledgment in answer text
 * 
 * Looks for phrases indicating uncertainty, limitations, or speculation.
 */
function scoreUncertaintyAcknowledgment(answerText: string): number {
  const uncertaintyPhrases = [
    'uncertain',
    'unclear',
    'may',
    'might',
    'possibly',
    'perhaps',
    'speculation',
    'limited data',
    'incomplete',
    'not definitive',
    'could',
    'appears',
    'seems',
    'likely',
    'probably',
    'estimate',
    'approximate',
    'caution',
    'warning',
    'limitation',
    'uncertainty',
    'unknown',
    'unverified',
  ];

  const lowerText = answerText.toLowerCase();
  let matchCount = 0;

  for (const phrase of uncertaintyPhrases) {
    if (lowerText.includes(phrase)) {
      matchCount++;
    }
  }

  // Normalize: 0-2 matches = low (0.2-0.4), 3-5 = medium (0.5-0.7), 6+ = high (0.8-1.0)
  if (matchCount === 0) {
    return 0.1; // No uncertainty acknowledgment
  }
  if (matchCount <= 2) {
    return 0.3;
  }
  if (matchCount <= 5) {
    return 0.6;
  }
  return Math.min(1.0, 0.7 + (matchCount - 5) * 0.05); // Cap at 1.0
}

/**
 * Score source diversity
 * 
 * Measures how diverse the sources are (different types, clusters, authors).
 */
function scoreSourceDiversity(
  sources: Array<{ id: string; url: string | null; type: string; author: string | null }>,
  candidates: CandidateDoc[]
): number {
  if (sources.length === 0) {
    return 0.0;
  }

  // Build maps from source IDs to candidate docs
  const candidateMap = new Map<string, CandidateDoc>();
  for (const candidate of candidates) {
    candidateMap.set(candidate.id, candidate);
  }

  const sourceTypes = new Set<string>();
  const clusters = new Set<number | null>();
  const authors = new Set<string | null>();

  for (const source of sources) {
    const candidate = candidateMap.get(source.id);
    if (candidate) {
      sourceTypes.add(candidate.sourceType);
      clusters.add(candidate.clusterId);
      authors.add(candidate.sourceAuthor);
    }
    sourceTypes.add(source.type);
    authors.add(source.author);
  }

  // Diversity score based on unique values
  const typeDiversity = sourceTypes.size / Math.max(sources.length, 1);
  const clusterDiversity = clusters.size / Math.max(sources.length, 1);
  const authorDiversity = authors.size / Math.max(sources.length, 1);

  // Weighted average (clusters are most important for diversity)
  const diversityScore = typeDiversity * 0.3 + clusterDiversity * 0.5 + authorDiversity * 0.2;

  // Bonus for having multiple sources
  const sourceCountBonus = Math.min(0.2, sources.length * 0.05);

  return Math.min(1.0, diversityScore + sourceCountBonus);
}

/**
 * Score answer stability under perturbations
 * 
 * Simulates how answers might change with slight query modifications.
 * In a full implementation, this would re-run retrieval and generation.
 * Here we use heuristics based on answer characteristics.
 */
async function scoreAnswerStability(
  mainstreamText: string,
  contrarianText: string | null
): Promise<number> {
  // Heuristic: Answers with more citations and structured reasoning are more stable
  const mainstreamStability = scoreTextStability(mainstreamText);
  
  if (!contrarianText) {
    return mainstreamStability;
  }

  const contrarianStability = scoreTextStability(contrarianText);
  
  // Average, with slight bonus if both are stable
  const avgStability = (mainstreamStability + contrarianStability) / 2;
  const bonus = mainstreamStability > 0.7 && contrarianStability > 0.7 ? 0.1 : 0;
  
  return Math.min(1.0, avgStability + bonus);
}

/**
 * Score text stability based on structural characteristics
 */
function scoreTextStability(text: string): number {
  let score = 0.5; // Base score

  // Citations indicate grounding in sources (more stable)
  const citationCount = (text.match(/\[Document \d+ - ID: [^\]]+\]/g) || []).length;
  score += Math.min(0.2, citationCount * 0.05);

  // Structured reasoning (numbered lists, bullet points) suggests stability
  const listMarkers = (text.match(/\d+\.|[-*•]/g) || []).length;
  score += Math.min(0.15, listMarkers * 0.02);

  // Length suggests thoroughness (more stable)
  if (text.length > 500) {
    score += 0.1;
  } else if (text.length < 100) {
    score -= 0.1; // Very short answers may be less stable
  }

  // Uncertainty phrases (from resilience scoring) also indicate stability
  // because they show the answer acknowledges limitations
  const uncertaintyPhrases = text.match(
    /\b(may|might|possibly|perhaps|could|appears|seems|likely|probably|uncertain|unclear)\b/gi
  );
  if (uncertaintyPhrases && uncertaintyPhrases.length > 0) {
    score += 0.05; // Slight bonus for acknowledging uncertainty
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Score prestige diversity
 * 
 * Measures whether answers use both high-prestige and low-prestige sources.
 * High diversity = using both mainstream and fringe sources.
 */
function scorePrestigeDiversity(
  sources: Array<{ id: string; url: string | null; type: string; author: string | null }>,
  candidates: CandidateDoc[]
): number {
  if (sources.length === 0) {
    return 0.0;
  }

  // Define prestige levels by source type
  const prestigeLevels: Record<string, number> = {
    // High prestige
    'article': 0.9,
    'research': 0.95,
    'official': 1.0,
    // Medium prestige
    'review': 0.6,
    'sale': 0.5,
    // Low prestige (fringe)
    'forum': 0.2,
    'social': 0.1,
    'other': 0.3,
  };

  const candidateMap = new Map<string, CandidateDoc>();
  for (const candidate of candidates) {
    candidateMap.set(candidate.id, candidate);
  }

  const prestigeScores: number[] = [];
  for (const source of sources) {
    const candidate = candidateMap.get(source.id);
    const sourceType = candidate?.sourceType || source.type;
    const prestige = prestigeLevels[sourceType.toLowerCase()] || 0.5;
    prestigeScores.push(prestige);
  }

  // Diversity = variance in prestige scores
  // High variance = using both high and low prestige sources = good diversity
  if (prestigeScores.length === 0) {
    return 0.0;
  }

  const mean = prestigeScores.reduce((sum, s) => sum + s, 0) / prestigeScores.length;
  const variance =
    prestigeScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / prestigeScores.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: stdDev of 0.3+ = high diversity (0.8-1.0), 0.1-0.3 = medium (0.5-0.7), <0.1 = low (0.2-0.4)
  if (stdDev >= 0.3) {
    return Math.min(1.0, 0.8 + (stdDev - 0.3) * 0.5);
  }
  if (stdDev >= 0.1) {
    return 0.5 + (stdDev - 0.1) * 1.0; // 0.5 to 0.7
  }
  return 0.2 + stdDev * 3.0; // 0.2 to 0.5
}

