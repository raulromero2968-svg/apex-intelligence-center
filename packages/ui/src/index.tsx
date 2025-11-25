/**
 * @apex/ui
 *
 * Shared UI components for Apex Intelligence Platform.
 * Works across web (Next.js) and mobile (React Native) targets.
 */

// Version
export const version = '0.2.0';

// Market Components
export {
  CryptoMarketDashboard,
  type CryptoMarketDashboardProps,
  type TokenPrice,
  type PortfolioHolding,
  type PriceAlert,
} from './components/CryptoMarketDashboard';

export {
  MarketDashboardWithEthics,
  type MarketDashboardWithEthicsProps,
  type AutomationContext,
  type EthicsAssessment,
  type TradeAction,
} from './components/finance/MarketDashboardWithEthics';

// Ethics Components
export {
  JobImpactPanel,
  type JobImpactPanelProps,
  type AssessmentContext,
  type ImpactAssessment,
  type FrameworkCompliance,
  type ReskillingRecommendation,
  type MitigationAction,
  type RiskCategory,
  type AutomationLevel,
  type WorkforceImpact,
} from './components/ethics/JobImpactPanel';
