/**
 * SEO Components Barrel Export
 *
 * Provides structured data and meta tag components for SEO:
 * - ArticleStructuredData: JSON-LD for articles
 * - PredictionEventStructuredData: JSON-LD for prediction market events
 *
 * @module seo
 */

// Article structured data
export { ArticleStructuredData } from './ArticleStructuredData';

// Prediction event structured data (KB-07 SEO patterns)
export {
  PredictionEventStructuredData,
  generatePredictionOGMeta,
  generateTrilemmaOGImageUrl,
  type PredictionEventStructuredDataProps,
  type BostromScenarioType,
  type PredictionMarketSource,
  type CorrigibilityMeta,
  type TrilemmaDistribution,
} from './PredictionEventStructuredData';
