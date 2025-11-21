/**
 * False-Correction Loop Detection via Shadow Prompting
 * 
 * Detects when mainstream answers are being repeatedly "corrected" in a way that
 * creates a false-correction loop (where corrections themselves become incorrect).
 * 
 * Uses "shadow prompting" - hidden meta-analysis of the conversation between
 * mainstream answer and simulated critic.
 */

import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@apex/shared/src/logger';

const logger = createLogger('contrarian-false-correction-detector');

/**
 * Configuration for false-correction detection
 */
interface FalseCorrectionConfig {
  openAIApiKey?: string;
  model?: string; // Default: 'gpt-4o' or 'gpt-4-turbo'
  maxShadowPasses?: number; // Default: 2
}

/**
 * Detect false-correction loop behavior
 * 
 * Uses shadow prompting to analyze how the answer evolves under criticism.
 * Returns a score 0-1 indicating likelihood of false-correction loop:
 * - 0.0 = No false-correction loop detected
 * - 1.0 = Strong evidence of false-correction loop
 * 
 * @param query - Original user query
 * @param mainstreamAnswer - Mainstream answer text
 * @param corrections - Array of correction attempts (can be empty for first pass)
 * @param config - Optional configuration
 * @returns False-correction loop score (0-1)
 */
export async function detectFalseCorrectionLoop(
  query: string,
  mainstreamAnswer: string,
  corrections: string[] = [],
  config: FalseCorrectionConfig = {}
): Promise<number> {
  return Sentry.startSpan(
    { name: 'contrarian.detectFalseCorrectionLoop', op: 'llm' },
    async () => {
      const apiKey = config.openAIApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn('OpenAI API key not available, returning default score');
        return 0.5; // Default moderate score if API unavailable
      }

      const model = config.model || 'gpt-4o';
      const maxPasses = config.maxShadowPasses || 2;

      try {
        // Shadow Pass 1: Simulate a critic challenging the mainstream answer
        const criticChallenge = await generateCriticChallenge(
          query,
          mainstreamAnswer,
          apiKey,
          model
        );

        // Shadow Pass 2: Simulate how the answer would evolve under criticism
        const evolvedAnswer = await simulateAnswerEvolution(
          query,
          mainstreamAnswer,
          criticChallenge,
          apiKey,
          model
        );

        // Additional passes if corrections exist
        let finalScore = 0;
        if (corrections.length > 0) {
          // Analyze the actual corrections against the shadow simulation
          finalScore = await analyzeCorrectionPattern(
            query,
            mainstreamAnswer,
            corrections,
            evolvedAnswer,
            apiKey,
            model
          );
        } else {
          // Use the shadow simulation to predict false-correction risk
          finalScore = await predictFalseCorrectionRisk(
            query,
            mainstreamAnswer,
            criticChallenge,
            evolvedAnswer,
            apiKey,
            model
          );
        }

        logger.info('False-correction loop detection complete', {
          score: finalScore,
          passes: maxPasses,
          hasCorrections: corrections.length > 0,
        });

        return Math.max(0, Math.min(1, finalScore)); // Clamp to [0, 1]
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            query: query.slice(0, 100),
            hasCorrections: corrections.length > 0,
          },
        });
        logger.error('Failed to detect false-correction loop', { error: String(error) });
        // Return moderate score on error to avoid blocking
        return 0.5;
      }
    }
  );
}

/**
 * Shadow Pass 1: Generate a critic's challenge to the mainstream answer
 */
async function generateCriticChallenge(
  query: string,
  mainstreamAnswer: string,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = `You are a critical analyst reviewing a mainstream answer to a TCG market question.

Original Query: ${query}

Mainstream Answer:
${mainstreamAnswer}

Your task: Generate a critical challenge to this answer. Identify:
1. Potential weaknesses, assumptions, or oversimplifications
2. Missing alternative perspectives
3. Areas where the answer might be incomplete or biased

Provide a concise critical challenge (2-3 sentences) that a contrarian analyst might raise.`;

  const response = await callOpenAI(prompt, apiKey, model);
  return response.trim();
}

/**
 * Shadow Pass 2: Simulate how the answer would evolve under criticism
 */
async function simulateAnswerEvolution(
  query: string,
  originalAnswer: string,
  criticChallenge: string,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = `You are analyzing how an answer might evolve when challenged.

Original Query: ${query}

Original Answer:
${originalAnswer}

Critic's Challenge:
${criticChallenge}

Your task: Simulate how the original answer might be modified or "corrected" in response to this challenge. Generate a revised answer that attempts to address the critic's concerns.

This revised answer should show how the original answer might change under pressure.`;

  const response = await callOpenAI(prompt, apiKey, model);
  return response.trim();
}

/**
 * Analyze actual corrections against shadow simulation to detect false-correction patterns
 */
async function analyzeCorrectionPattern(
  query: string,
  originalAnswer: string,
  actualCorrections: string[],
  shadowEvolvedAnswer: string,
  apiKey: string,
  model: string
): Promise<number> {
  const correctionsText = actualCorrections
    .map((c, i) => `Correction ${i + 1}:\n${c}`)
    .join('\n\n');

  const prompt = `You are analyzing whether a series of "corrections" to an answer represent a false-correction loop.

A false-correction loop occurs when:
1. An answer is repeatedly "corrected"
2. Each correction introduces new errors or oversimplifications
3. The corrections become less accurate than the original
4. The process creates a cycle of incorrect "improvements"

Original Query: ${query}

Original Answer:
${originalAnswer}

Actual Corrections Made:
${correctionsText}

Shadow Simulation (predicted evolution):
${shadowEvolvedAnswer}

Analyze whether the actual corrections show signs of a false-correction loop. Consider:
- Do corrections introduce factual errors or oversimplifications?
- Do later corrections contradict earlier ones?
- Is the final corrected answer less accurate than the original?
- Does the pattern suggest a cycle of incorrect "improvements"?

Respond with a JSON object:
{
  "score": 0.0-1.0,  // 0 = no false-correction loop, 1 = strong evidence of loop
  "reasoning": "brief explanation"
}`;

  const response = await callOpenAI(prompt, apiKey, model);
  
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return typeof parsed.score === 'number' ? parsed.score : 0.5;
    }
  } catch (e) {
    logger.warn('Failed to parse false-correction analysis JSON', { response });
  }

  // Fallback: use heuristics on response text
  const lowerResponse = response.toLowerCase();
  if (lowerResponse.includes('false-correction') || lowerResponse.includes('loop')) {
    if (lowerResponse.includes('strong') || lowerResponse.includes('clear')) {
      return 0.8;
    }
    if (lowerResponse.includes('moderate') || lowerResponse.includes('some')) {
      return 0.5;
    }
  }

  return 0.3; // Default low score if unclear
}

/**
 * Predict false-correction risk from shadow simulation alone
 */
async function predictFalseCorrectionRisk(
  query: string,
  originalAnswer: string,
  criticChallenge: string,
  shadowEvolvedAnswer: string,
  apiKey: string,
  model: string
): Promise<number> {
  const prompt = `You are analyzing whether an answer's predicted evolution under criticism suggests a false-correction loop risk.

Original Query: ${query}

Original Answer:
${originalAnswer}

Critic's Challenge:
${criticChallenge}

Predicted Evolution (how answer might change):
${shadowEvolvedAnswer}

Analyze whether the predicted evolution shows signs that a false-correction loop might occur. Consider:
- Does the evolved answer introduce new errors or oversimplifications?
- Does it overcorrect in ways that reduce accuracy?
- Would this pattern likely lead to a cycle of incorrect "improvements"?

Respond with a JSON object:
{
  "score": 0.0-1.0,  // 0 = low risk, 1 = high risk of false-correction loop
  "reasoning": "brief explanation"
}`;

  const response = await callOpenAI(prompt, apiKey, model);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return typeof parsed.score === 'number' ? parsed.score : 0.5;
    }
  } catch (e) {
    logger.warn('Failed to parse false-correction risk JSON', { response });
  }

  // Fallback heuristics
  const lowerResponse = response.toLowerCase();
  if (lowerResponse.includes('high risk') || lowerResponse.includes('likely')) {
    return 0.7;
  }
  if (lowerResponse.includes('moderate') || lowerResponse.includes('possible')) {
    return 0.4;
  }

  return 0.2; // Default low risk
}

/**
 * Call OpenAI API for text generation
 */
async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
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
          content: 'You are an expert analyst specializing in detecting logical fallacies and information quality issues.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

