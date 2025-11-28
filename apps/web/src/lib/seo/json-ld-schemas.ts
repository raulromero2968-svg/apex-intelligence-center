/**
 * JSON-LD SEO Schema Utilities (KB-07)
 *
 * Structured data schemas for:
 * - Foundational Literature (ScholarlyArticle + Book)
 * - Prediction Markets (PredictionEvent - custom schema)
 * - Simulation Models (Dataset + ResearchProject)
 * - Philosophy Research (Article + CreativeWork)
 *
 * Features:
 * - Google Rich Results compatibility
 * - Bostrom visuals as OG images for shareable simulations
 * - Trilemma probability visualizations
 * - Utopia schema for posthuman abundance framing
 *
 * @module lib/seo/json-ld-schemas
 */

import type { FoundationalWork } from '@/data/foundational-literature';

// ============================================================================
// BASE TYPES
// ============================================================================

export interface JsonLdSchema {
  '@context': string;
  '@type': string | string[];
  [key: string]: unknown;
}

// ============================================================================
// FOUNDATIONAL LITERATURE SCHEMAS
// ============================================================================

/**
 * Generate JSON-LD for a foundational literature work
 *
 * Uses ScholarlyArticle + Book schema for ancient texts
 *
 * @param work - Foundational work data
 * @param pageUrl - URL of the page displaying this work
 * @returns JSON-LD schema object
 */
export function generateLiteratureSchema(
  work: FoundationalWork,
  pageUrl: string
): JsonLdSchema {
  const isAncient = work.dateApprox.includes('BCE');
  const datePublished = parseApproxDate(work.dateApprox);

  return {
    '@context': 'https://schema.org',
    '@type': ['Book', 'ScholarlyArticle'],
    name: work.title,
    headline: work.title,
    description: work.description,
    author: {
      '@type': work.author === 'Anonymous' || work.author?.includes('Anonymous')
        ? 'Organization'
        : 'Person',
      name: work.author || 'Anonymous',
    },
    datePublished: datePublished,
    dateCreated: datePublished,
    genre: work.category,
    keywords: work.keyThemes.join(', '),
    url: pageUrl,
    isPartOf: {
      '@type': 'Collection',
      name: 'Apex Intelligence Foundational Literature Collection',
      description: 'Curated collection of ~25 foundational works from prehistory to 1870',
    },
    // Custom Apex extensions
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'ethicsScore',
        value: work.ethicsScore,
        description: 'FHI longtermism alignment score (0-1)',
      },
      {
        '@type': 'PropertyValue',
        name: 'corrigibilityFlag',
        value: work.corrigibilityFlag,
        description: 'Safe for AI training without bias filtering',
      },
      {
        '@type': 'PropertyValue',
        name: 'category',
        value: work.category,
        description: 'Literature category (religion, philosophy, literature, history, science)',
      },
    ],
    // For ancient texts, use HistoricalDocument indicator
    ...(isAncient && {
      temporalCoverage: work.dateApprox,
      spatialCoverage: inferSpatialCoverage(work),
    }),
  };
}

/**
 * Generate JSON-LD for literature collection page
 */
export function generateLiteratureCollectionSchema(
  works: FoundationalWork[],
  pageUrl: string
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Foundational Literature for AI Training',
    description:
      'Curated collection of ~25 foundational works from prehistory to 1870 that shaped human thought, ethics, science, and culture. Used for ethical AI training and simulation market alignment.',
    url: pageUrl,
    numberOfItems: works.length,
    collectionSize: works.length,
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      url: 'https://apexomnis.io',
    },
    dateModified: new Date().toISOString(),
    // Categories breakdown
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'religionWorks',
        value: works.filter((w) => w.category === 'religion').length,
      },
      {
        '@type': 'PropertyValue',
        name: 'philosophyWorks',
        value: works.filter((w) => w.category === 'philosophy').length,
      },
      {
        '@type': 'PropertyValue',
        name: 'literatureWorks',
        value: works.filter((w) => w.category === 'literature').length,
      },
      {
        '@type': 'PropertyValue',
        name: 'scienceWorks',
        value: works.filter((w) => w.category === 'science' || w.category === 'history').length,
      },
    ],
    hasPart: works.slice(0, 10).map((work) => ({
      '@type': 'Book',
      name: work.title,
      author: work.author,
      datePublished: parseApproxDate(work.dateApprox),
    })),
  };
}

// ============================================================================
// PREDICTION MARKET SCHEMAS
// ============================================================================

export interface PredictionEventData {
  id: string;
  title: string;
  description: string;
  outcome: string;
  probability: number;
  volume: number;
  endDate: string;
  scenarioType?: string;
  ethicsScore?: number;
}

/**
 * Generate JSON-LD for a prediction market event
 *
 * Uses custom PredictionEvent schema (not official Schema.org but
 * follows best practices for Google rich snippets)
 *
 * @param event - Prediction event data
 * @param pageUrl - URL of the page displaying this event
 * @returns JSON-LD schema object
 */
export function generatePredictionEventSchema(
  event: PredictionEventData,
  pageUrl: string
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    url: pageUrl,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    endDate: event.endDate,
    organizer: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      url: 'https://apexomnis.io',
    },
    // Prediction-specific data as custom properties
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'outcome',
        value: event.outcome,
        description: 'Predicted outcome being traded',
      },
      {
        '@type': 'PropertyValue',
        name: 'probability',
        value: event.probability,
        description: 'Current probability estimate (0-1)',
      },
      {
        '@type': 'PropertyValue',
        name: 'volume',
        value: event.volume,
        description: 'Total trading volume',
      },
      ...(event.scenarioType
        ? [
            {
              '@type': 'PropertyValue',
              name: 'bostromScenarioType',
              value: event.scenarioType,
              description: 'Bostrom trilemma scenario type',
            },
          ]
        : []),
      ...(event.ethicsScore !== undefined
        ? [
            {
              '@type': 'PropertyValue',
              name: 'ethicsScore',
              value: event.ethicsScore,
              description: 'FHI longtermism ethical alignment score',
            },
          ]
        : []),
    ],
  };
}

// ============================================================================
// SIMULATION MODEL SCHEMAS
// ============================================================================

export interface SimulationModelData {
  id: string;
  name: string;
  description: string;
  prediction: number;
  confidence: number;
  eggrollGeneration: number;
  eggrollFitness: number;
  scenarioType?: string;
}

/**
 * Generate JSON-LD for a simulation model
 *
 * Uses Dataset + ResearchProject schemas for academic credibility
 *
 * @param model - Simulation model data
 * @param pageUrl - URL of the page displaying this model
 * @returns JSON-LD schema object
 */
export function generateSimulationModelSchema(
  model: SimulationModelData,
  pageUrl: string
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': ['Dataset', 'ResearchProject'],
    name: model.name,
    description: model.description,
    url: pageUrl,
    creator: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      url: 'https://apexomnis.io',
    },
    dateModified: new Date().toISOString(),
    // EGGROLL training metadata
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'predictionValue',
        value: model.prediction,
        description: 'Model prediction output (0-1 for probabilities)',
      },
      {
        '@type': 'PropertyValue',
        name: 'confidence',
        value: model.confidence,
        description: 'Model confidence in prediction',
      },
      {
        '@type': 'PropertyValue',
        name: 'eggrollGeneration',
        value: model.eggrollGeneration,
        description: 'EGGROLL evolutionary generation number',
      },
      {
        '@type': 'PropertyValue',
        name: 'eggrollFitness',
        value: model.eggrollFitness,
        description: 'EGGROLL fitness score from evolutionary training',
      },
      ...(model.scenarioType
        ? [
            {
              '@type': 'PropertyValue',
              name: 'bostromScenarioType',
              value: model.scenarioType,
              description: 'Bostrom trilemma scenario type (simulation, posthuman, extinction)',
            },
          ]
        : []),
    ],
    // Keywords for discoverability
    keywords: [
      'simulation model',
      'EGGROLL training',
      'Bostrom trilemma',
      'prediction market',
      'evolutionary optimization',
      model.scenarioType,
    ]
      .filter(Boolean)
      .join(', '),
  };
}

// ============================================================================
// BOSTROM TRILEMMA VISUALIZATION SCHEMAS
// ============================================================================

export interface BostromProbabilities {
  extinction: number;
  avoidance: number;
  simulation: number;
  corrigibilityCapped?: boolean;
}

/**
 * Generate JSON-LD for Bostrom trilemma visualization
 *
 * Uses DataSet schema with probability visualizations
 *
 * @param probabilities - Bostrom trilemma probabilities
 * @param pageUrl - URL of the visualization page
 * @returns JSON-LD schema object
 */
export function generateBostromVisualizationSchema(
  probabilities: BostromProbabilities,
  pageUrl: string
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: "Bostrom's Simulation Trilemma Probabilities",
    description:
      "Visualization of Nick Bostrom's simulation argument trilemma probabilities. At least one branch must have high probability: (1) extinction before posthuman stage, (2) posthumans avoid ancestor simulations, or (3) we are almost certainly in a simulation.",
    url: pageUrl,
    creator: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      url: 'https://apexomnis.io',
    },
    dateModified: new Date().toISOString(),
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    // Probability data
    distribution: {
      '@type': 'DataDownload',
      contentUrl: pageUrl,
      encodingFormat: 'application/json',
    },
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'extinctionProbability',
        value: probabilities.extinction,
        description: 'Probability that civilizations go extinct before posthuman capability',
      },
      {
        '@type': 'PropertyValue',
        name: 'avoidanceProbability',
        value: probabilities.avoidance,
        description: 'Probability that posthumans avoid running ancestor simulations',
      },
      {
        '@type': 'PropertyValue',
        name: 'simulationProbability',
        value: probabilities.simulation,
        description: 'Probability that we are living in a simulation',
      },
      ...(probabilities.corrigibilityCapped !== undefined
        ? [
            {
              '@type': 'PropertyValue',
              name: 'corrigibilityCapped',
              value: probabilities.corrigibilityCapped,
              description: 'Whether probabilities were capped by corrigibility safeguards',
            },
          ]
        : []),
    ],
    // Academic references
    citation: {
      '@type': 'ScholarlyArticle',
      name: 'Are You Living in a Computer Simulation?',
      author: {
        '@type': 'Person',
        name: 'Nick Bostrom',
      },
      datePublished: '2003',
      url: 'https://www.simulation-argument.com/simulation.html',
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse approximate historical dates into ISO format
 * Returns "0001-01-01" for ancient dates (Schema.org doesn't support BCE)
 */
function parseApproxDate(dateApprox: string): string {
  // Try to extract year
  const yearMatch = dateApprox.match(/(\d+)/);
  if (!yearMatch) return '0001-01-01';

  const year = parseInt(yearMatch[1]);
  const isBCE = dateApprox.toLowerCase().includes('bce');

  if (isBCE) {
    // Schema.org doesn't support BCE dates well, use special indicator
    return '0001-01-01';
  }

  // For CE dates, construct ISO date
  return `${year.toString().padStart(4, '0')}-01-01`;
}

/**
 * Infer spatial coverage from work metadata
 */
function inferSpatialCoverage(work: FoundationalWork): string {
  const authorLower = (work.author || '').toLowerCase();
  const titleLower = work.title.toLowerCase();

  if (authorLower.includes('mesopotamian') || titleLower.includes('gilgamesh')) {
    return 'Mesopotamia';
  }
  if (authorLower.includes('vedic') || titleLower.includes('vedas')) {
    return 'Ancient India';
  }
  if (
    authorLower.includes('plato') ||
    authorLower.includes('aristotle') ||
    authorLower.includes('homer')
  ) {
    return 'Ancient Greece';
  }
  if (authorLower.includes('virgil') || authorLower.includes('aurelius')) {
    return 'Roman Empire';
  }
  if (authorLower.includes('confucius')) {
    return 'Ancient China';
  }
  if (authorLower.includes('muhammad')) {
    return 'Arabian Peninsula';
  }
  if (authorLower.includes('dante')) {
    return 'Italy';
  }
  if (authorLower.includes('shakespeare') || authorLower.includes('newton')) {
    return 'England';
  }
  if (authorLower.includes('kant') || authorLower.includes('hegel')) {
    return 'Germany';
  }
  if (authorLower.includes('cervantes')) {
    return 'Spain';
  }

  return 'Global';
}

// ============================================================================
// OG IMAGE UTILITIES FOR SHAREABLE VISUALIZATIONS
// ============================================================================

/**
 * Generate OG image URL for Bostrom visualization
 *
 * Uses dynamic OG image generation (via Vercel OG or similar)
 *
 * @param probabilities - Bostrom trilemma probabilities
 * @returns URL for OG image
 */
export function getBostromOgImageUrl(probabilities: BostromProbabilities): string {
  const params = new URLSearchParams({
    ext: probabilities.extinction.toFixed(2),
    avoid: probabilities.avoidance.toFixed(2),
    sim: probabilities.simulation.toFixed(2),
    corr: probabilities.corrigibilityCapped ? '1' : '0',
  });

  return `/api/og/bostrom?${params.toString()}`;
}

/**
 * Generate OG image URL for literature work
 *
 * @param work - Foundational work data
 * @returns URL for OG image
 */
export function getLiteratureOgImageUrl(work: FoundationalWork): string {
  const params = new URLSearchParams({
    title: work.title,
    author: work.author || 'Anonymous',
    category: work.category,
    ethics: work.ethicsScore.toFixed(2),
  });

  return `/api/og/literature?${params.toString()}`;
}

// ============================================================================
// REACT COMPONENT HELPERS
// ============================================================================

/**
 * Render JSON-LD script tag content
 *
 * For use in Next.js pages:
 * ```tsx
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }}
 * />
 * ```
 *
 * @param schema - JSON-LD schema object
 * @returns JSON string for script tag
 */
export function renderJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema, null, 0);
}

/**
 * Generate complete head metadata for literature page
 */
export function generateLiteraturePageMeta(
  work: FoundationalWork,
  pageUrl: string
): {
  title: string;
  description: string;
  ogImage: string;
  jsonLd: JsonLdSchema;
} {
  return {
    title: `${work.title} - Foundational Literature | Apex Intelligence`,
    description: `${work.description.slice(0, 155)}...`,
    ogImage: getLiteratureOgImageUrl(work),
    jsonLd: generateLiteratureSchema(work, pageUrl),
  };
}

/**
 * Generate complete head metadata for Bostrom visualization page
 */
export function generateBostromPageMeta(
  probabilities: BostromProbabilities,
  pageUrl: string
): {
  title: string;
  description: string;
  ogImage: string;
  jsonLd: JsonLdSchema;
} {
  return {
    title: "Bostrom's Simulation Trilemma | Apex Intelligence",
    description: `Current probabilities: Extinction ${(probabilities.extinction * 100).toFixed(1)}%, Avoidance ${(probabilities.avoidance * 100).toFixed(1)}%, Simulation ${(probabilities.simulation * 100).toFixed(1)}%`,
    ogImage: getBostromOgImageUrl(probabilities),
    jsonLd: generateBostromVisualizationSchema(probabilities, pageUrl),
  };
}
