/**
 * PredictionEvent JSON-LD Structured Data for SEO (KB-07)
 *
 * Implements Schema.org-compliant structured data for prediction market events:
 * - Bostrom trilemma simulations with probability visualizations
 * - TCG market predictions with outcome probabilities
 * - Deep utopia framing for posthuman scenarios
 * - Corrigibility metadata for AI safety compliance
 *
 * Features:
 * - Dynamic getStaticProps-compatible generation
 * - OG image support for Bostrom trilemma diagrams
 * - Utopia schema extensions for posthuman abundance framing
 *
 * References:
 * - KB-07: SEO patterns (JSON-LD, OG images)
 * - KB-02: EGGROLL RAG-Fusion architecture
 * - FHI alignment principles for ethical predictions
 */

import React from 'react';

/**
 * Bostrom trilemma scenario types for prediction events
 */
export type BostromScenarioType = 'extinction' | 'posthuman' | 'simulated_reality';

/**
 * Prediction event source markets
 */
export type PredictionMarketSource = 'polymarket' | 'manifold' | 'kalshi' | 'apex_simulation';

/**
 * Corrigibility metadata for AI safety compliance
 */
export interface CorrigibilityMeta {
  /** Whether agent accepts shutdown/corrections */
  corrigible: boolean;
  /** POST-Agency posterior goal update capability */
  postAgencyEnabled: boolean;
  /** Deep utopia abundance framing */
  utopiaFraming: boolean;
  /** Recursive reward cap to prevent value drift */
  recursiveRewardCap: number;
  /** Ethical disclaimer for Bostrom-related predictions */
  ethicalDisclaimer?: string;
}

/**
 * Probability distribution for trilemma scenarios
 */
export interface TrilemmaDistribution {
  extinction: number;
  posthuman: number;
  simulatedReality: number;
}

/**
 * Props for PredictionEvent structured data
 */
export interface PredictionEventStructuredDataProps {
  /** Unique identifier for the prediction */
  predictionId: string;
  /** Title of the prediction event */
  title: string;
  /** Description of what's being predicted */
  description: string;
  /** URL for the prediction page */
  url: string;
  /** OG image URL (supports Bostrom trilemma diagrams) */
  image?: string;
  /** ISO date when prediction was made */
  datePredicted: string;
  /** ISO date when prediction resolves/expires */
  dateResolves?: string;
  /** Primary probability (0-1) */
  probability: number;
  /** Trilemma distribution for Bostrom scenarios */
  trilemmaDistribution?: TrilemmaDistribution;
  /** Bostrom scenario type if applicable */
  bostromScenario?: BostromScenarioType;
  /** EGGROLL integer weight (1-10) */
  integerWeight?: number;
  /** Confidence score from evolution (0-1) */
  confidence?: number;
  /** Source market for the prediction */
  source?: PredictionMarketSource;
  /** External market URL if applicable */
  externalMarketUrl?: string;
  /** Category for the prediction */
  category?: string;
  /** Related TCG card ID if applicable */
  tcgCardId?: string;
  /** Corrigibility metadata for AI safety */
  corrigibility?: CorrigibilityMeta;
  /** Creator/author of the prediction */
  author?: string;
  /** Whether this is a deep utopia framed prediction */
  deepUtopiaFramed?: boolean;
}

/**
 * Generate PredictionEvent structured data for SEO
 *
 * Creates Schema.org-compliant JSON-LD for prediction market events.
 * Extends Event schema with prediction-specific properties.
 *
 * @example
 * ```tsx
 * // In a Next.js page component
 * export async function getStaticProps() {
 *   const prediction = await fetchPrediction(id);
 *   return { props: { prediction } };
 * }
 *
 * export default function PredictionPage({ prediction }) {
 *   return (
 *     <>
 *       <PredictionEventStructuredData {...prediction} />
 *       <PredictionDisplay prediction={prediction} />
 *     </>
 *   );
 * }
 * ```
 */
export function PredictionEventStructuredData({
  predictionId,
  title,
  description,
  url,
  image = '/og-prediction-event.png',
  datePredicted,
  dateResolves,
  probability,
  trilemmaDistribution,
  bostromScenario,
  integerWeight,
  confidence,
  source = 'apex_simulation',
  externalMarketUrl,
  category,
  tcgCardId,
  corrigibility,
  author = 'Apex Intelligence',
  deepUtopiaFramed = false,
}: PredictionEventStructuredDataProps) {
  // Build base structured data
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `https://apex-intelligence.io/predictions/${predictionId}`,
    name: title,
    description: description,
    url: url,
    image: image.startsWith('http') ? image : `https://apex-intelligence.io${image}`,
    startDate: datePredicted,
    endDate: dateResolves || datePredicted,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      url: 'https://apex-intelligence.io',
    },
    performer: {
      '@type': 'Organization',
      name: author,
    },
  };

  // Add prediction-specific extensions
  const predictionExtension: Record<string, unknown> = {
    '@type': 'CreativeWork',
    '@id': `https://apex-intelligence.io/predictions/${predictionId}#prediction`,
    name: `Prediction: ${title}`,
    dateCreated: datePredicted,
    probability: probability,
  };

  // Add EGGROLL metadata if available
  if (integerWeight !== undefined) {
    predictionExtension.additionalProperty = [
      {
        '@type': 'PropertyValue',
        name: 'eggrollIntegerWeight',
        value: integerWeight,
        description: 'EGGROLL evolution integer weight (1-10 scale)',
      },
    ];
  }

  if (confidence !== undefined) {
    predictionExtension.additionalProperty = [
      ...(predictionExtension.additionalProperty as unknown[] || []),
      {
        '@type': 'PropertyValue',
        name: 'confidenceScore',
        value: confidence,
        description: 'Model confidence score (0-1)',
      },
    ];
  }

  // Add Bostrom trilemma data if applicable
  if (bostromScenario || trilemmaDistribution) {
    const trilemmaData: Record<string, unknown> = {
      '@type': 'DataFeed',
      '@id': `https://apex-intelligence.io/predictions/${predictionId}#trilemma`,
      name: 'Bostrom Trilemma Distribution',
      description: 'Probability distribution across Bostrom simulation trilemma scenarios',
    };

    if (trilemmaDistribution) {
      trilemmaData.dataFeedElement = [
        {
          '@type': 'DataFeedItem',
          name: 'Extinction Probability',
          item: {
            '@type': 'Observation',
            value: trilemmaDistribution.extinction,
            measuredProperty: 'extinctionScenarioProbability',
          },
        },
        {
          '@type': 'DataFeedItem',
          name: 'Posthuman Probability',
          item: {
            '@type': 'Observation',
            value: trilemmaDistribution.posthuman,
            measuredProperty: 'posthumanScenarioProbability',
          },
        },
        {
          '@type': 'DataFeedItem',
          name: 'Simulated Reality Probability',
          item: {
            '@type': 'Observation',
            value: trilemmaDistribution.simulatedReality,
            measuredProperty: 'simulatedRealityProbability',
          },
        },
      ];
    }

    if (bostromScenario) {
      trilemmaData.mainEntity = bostromScenario;
    }

    predictionExtension.isPartOf = trilemmaData;
  }

  // Add deep utopia framing metadata
  if (deepUtopiaFramed) {
    predictionExtension.additionalProperty = [
      ...(predictionExtension.additionalProperty as unknown[] || []),
      {
        '@type': 'PropertyValue',
        name: 'deepUtopiaFramed',
        value: true,
        description: 'Prediction framed through deep utopia lens emphasizing posthuman flourishing',
      },
    ];
  }

  // Add corrigibility metadata for AI safety transparency
  if (corrigibility) {
    predictionExtension.additionalProperty = [
      ...(predictionExtension.additionalProperty as unknown[] || []),
      {
        '@type': 'PropertyValue',
        name: 'aiCorrigibility',
        value: JSON.stringify({
          corrigible: corrigibility.corrigible,
          postAgencyEnabled: corrigibility.postAgencyEnabled,
          utopiaFraming: corrigibility.utopiaFraming,
          recursiveRewardCap: corrigibility.recursiveRewardCap,
        }),
        description: 'AI safety corrigibility metadata per Thornley/POST-Agency',
      },
    ];

    // Add ethical disclaimer if present
    if (corrigibility.ethicalDisclaimer) {
      predictionExtension.disclaimer = corrigibility.ethicalDisclaimer;
    }
  }

  // Add market source metadata
  if (source) {
    predictionExtension.provider = {
      '@type': 'Organization',
      name: getMarketSourceName(source),
      url: externalMarketUrl || getMarketSourceUrl(source),
    };
  }

  // Add category if specified
  if (category) {
    structuredData.about = {
      '@type': 'Thing',
      name: category,
    };
  }

  // Add TCG card reference if applicable
  if (tcgCardId) {
    structuredData.subjectOf = {
      '@type': 'Product',
      '@id': `https://apex-intelligence.io/cards/${tcgCardId}`,
      productID: tcgCardId,
    };
  }

  // Combine base event with prediction extension
  structuredData.workFeatured = predictionExtension;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}

/**
 * Get human-readable market source name
 */
function getMarketSourceName(source: PredictionMarketSource): string {
  const names: Record<PredictionMarketSource, string> = {
    polymarket: 'Polymarket',
    manifold: 'Manifold Markets',
    kalshi: 'Kalshi',
    apex_simulation: 'Apex Intelligence Simulation',
  };
  return names[source] || source;
}

/**
 * Get market source URL
 */
function getMarketSourceUrl(source: PredictionMarketSource): string {
  const urls: Record<PredictionMarketSource, string> = {
    polymarket: 'https://polymarket.com',
    manifold: 'https://manifold.markets',
    kalshi: 'https://kalshi.com',
    apex_simulation: 'https://apex-intelligence.io/simulations',
  };
  return urls[source] || 'https://apex-intelligence.io';
}

/**
 * Generate OG meta tags for prediction events
 *
 * Companion function for generating Open Graph meta tags
 * to be used alongside the JSON-LD structured data.
 */
export function generatePredictionOGMeta({
  title,
  description,
  image,
  url,
  probability,
  bostromScenario,
}: Pick<
  PredictionEventStructuredDataProps,
  'title' | 'description' | 'image' | 'url' | 'probability' | 'bostromScenario'
>): Record<string, string> {
  const ogImage = image?.startsWith('http')
    ? image
    : `https://apex-intelligence.io${image || '/og-prediction-event.png'}`;

  // Generate probability-aware description
  const probabilityPercent = Math.round(probability * 100);
  const enhancedDescription = bostromScenario
    ? `${description} | ${getBostromScenarioLabel(bostromScenario)}: ${probabilityPercent}% probability`
    : `${description} | ${probabilityPercent}% probability`;

  return {
    'og:title': title,
    'og:description': enhancedDescription,
    'og:image': ogImage,
    'og:url': url,
    'og:type': 'article',
    'og:site_name': 'Apex Intelligence',
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': enhancedDescription,
    'twitter:image': ogImage,
  };
}

/**
 * Get human-readable Bostrom scenario label
 */
function getBostromScenarioLabel(scenario: BostromScenarioType): string {
  const labels: Record<BostromScenarioType, string> = {
    extinction: 'Extinction Scenario',
    posthuman: 'Posthuman Scenario',
    simulated_reality: 'Simulated Reality',
  };
  return labels[scenario] || scenario;
}

/**
 * Generate Bostrom trilemma OG image URL with probability visualization
 *
 * Creates a dynamic OG image URL for trilemma diagrams with probability bars.
 * Uses a hypothetical image generation service endpoint.
 */
export function generateTrilemmaOGImageUrl(
  trilemmaDistribution: TrilemmaDistribution,
  predictionId: string
): string {
  const params = new URLSearchParams({
    ext: trilemmaDistribution.extinction.toFixed(3),
    post: trilemmaDistribution.posthuman.toFixed(3),
    sim: trilemmaDistribution.simulatedReality.toFixed(3),
    id: predictionId,
  });

  return `https://apex-intelligence.io/api/og/trilemma?${params.toString()}`;
}

export default PredictionEventStructuredData;
