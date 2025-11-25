/**
 * Finance/Crypto TCG Market Integration
 *
 * Real-time market data for TCG/NFT pricing and analytics.
 * Integrates with cryptocurrency APIs for market insights.
 *
 * Features:
 * - Real-time crypto price fetching
 * - NFT market analytics
 * - TCG card pricing models
 * - Market trend analysis
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CryptoPrice {
  token: string;
  symbol: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: Date;
}

export interface NftMarketData {
  collection: string;
  floorPrice: number;
  currency: string;
  volume24h: number;
  sales24h: number;
  holders: number;
  timestamp: Date;
}

export interface TcgCardPrice {
  cardId: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  priceUsd: number;
  priceEth?: number;
  priceChange24h: number;
  listings: number;
  lastSale?: {
    price: number;
    currency: string;
    timestamp: Date;
  };
}

export interface MarketTrend {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  indicators: {
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'hold';
  }[];
  summary: string;
}

export interface PriceAlert {
  id: string;
  cardId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  createdAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUPPORTED_TOKENS = [
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable X' },
] as const;

export const RARITY_MULTIPLIERS: Record<TcgCardPrice['rarity'], number> = {
  common: 1.0,
  uncommon: 2.5,
  rare: 5.0,
  epic: 15.0,
  legendary: 50.0,
};

// Cache for rate limiting
const priceCache = new Map<string, { data: CryptoPrice; expiry: number }>();
const CACHE_TTL_MS = 60000; // 1 minute cache

// ============================================================================
// CRYPTO PRICE FETCHING
// ============================================================================

/**
 * Fetch cryptocurrency price
 */
export async function fetchCryptoPrice(tokenId: string): Promise<CryptoPrice> {
  // Check cache
  const cached = priceCache.get(tokenId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    // In production, use CoinGecko or similar API
    // const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`);

    // Simulated response for development
    const token = SUPPORTED_TOKENS.find((t) => t.id === tokenId);
    const mockPrice: CryptoPrice = {
      token: tokenId,
      symbol: token?.symbol || tokenId.toUpperCase(),
      priceUsd: getMockPrice(tokenId),
      change24h: (Math.random() - 0.5) * 10, // -5% to +5%
      volume24h: Math.random() * 1000000000,
      marketCap: Math.random() * 100000000000,
      timestamp: new Date(),
    };

    // Cache result
    priceCache.set(tokenId, { data: mockPrice, expiry: Date.now() + CACHE_TTL_MS });

    return mockPrice;
  } catch (error) {
    console.error(`Failed to fetch ${tokenId} price:`, error);
    throw new Error(`Price fetch failed for ${tokenId}`);
  }
}

function getMockPrice(tokenId: string): number {
  const basePrices: Record<string, number> = {
    ethereum: 3200,
    bitcoin: 67000,
    solana: 145,
    polygon: 0.85,
    'immutable-x': 2.1,
  };
  const base = basePrices[tokenId] || 1;
  return base * (0.95 + Math.random() * 0.1); // ±5% variation
}

/**
 * Fetch multiple crypto prices
 */
export async function fetchMultiplePrices(tokenIds: string[]): Promise<CryptoPrice[]> {
  return Promise.all(tokenIds.map(fetchCryptoPrice));
}

// ============================================================================
// TCG CARD PRICING
// ============================================================================

/**
 * Calculate TCG card price based on market data
 */
export function calculateCardPrice(
  basePrice: number,
  rarity: TcgCardPrice['rarity'],
  supplyCount: number,
  demandScore: number, // 0-100
  ethPrice?: number
): TcgCardPrice {
  // Apply rarity multiplier
  let price = basePrice * RARITY_MULTIPLIERS[rarity];

  // Scarcity adjustment (fewer supply = higher price)
  const scarcityMultiplier = Math.max(1, 1000 / supplyCount);
  price *= Math.min(scarcityMultiplier, 10); // Cap at 10x

  // Demand adjustment
  const demandMultiplier = 0.5 + (demandScore / 100) * 1.5; // 0.5x to 2x
  price *= demandMultiplier;

  // Round to 2 decimals
  price = Math.round(price * 100) / 100;

  return {
    cardId: `card-${Date.now()}`,
    name: 'Calculated Card',
    rarity,
    priceUsd: price,
    priceEth: ethPrice ? price / ethPrice : undefined,
    priceChange24h: 0,
    listings: supplyCount,
  };
}

/**
 * Estimate card value from attributes
 */
export interface CardAttributes {
  attack: number;
  defense: number;
  special: number;
  element: string;
  edition: 'standard' | 'foil' | 'holographic' | 'first_edition';
}

export function estimateCardValue(
  rarity: TcgCardPrice['rarity'],
  attributes: CardAttributes
): number {
  let baseValue = 1.0;

  // Rarity base
  baseValue *= RARITY_MULTIPLIERS[rarity];

  // Stats contribution (normalized to 0-100 scale)
  const statScore = (attributes.attack + attributes.defense + attributes.special) / 3;
  baseValue *= 1 + statScore / 100;

  // Edition multipliers
  const editionMultipliers = {
    standard: 1.0,
    foil: 1.5,
    holographic: 3.0,
    first_edition: 5.0,
  };
  baseValue *= editionMultipliers[attributes.edition];

  return Math.round(baseValue * 100) / 100;
}

// ============================================================================
// MARKET ANALYSIS
// ============================================================================

/**
 * Analyze market trend for a token
 */
export function analyzeMarketTrend(priceHistory: number[]): MarketTrend {
  if (priceHistory.length < 2) {
    return {
      direction: 'neutral',
      strength: 50,
      indicators: [],
      summary: 'Insufficient data for trend analysis',
    };
  }

  // Simple Moving Average
  const sma7 = calculateSma(priceHistory, 7);
  const sma21 = calculateSma(priceHistory, 21);

  // RSI (simplified)
  const rsi = calculateRsi(priceHistory);

  // Determine direction
  const currentPrice = priceHistory[priceHistory.length - 1];
  const direction: MarketTrend['direction'] =
    sma7 > sma21 && currentPrice > sma7 ? 'bullish' :
    sma7 < sma21 && currentPrice < sma7 ? 'bearish' : 'neutral';

  // Calculate strength
  const priceMomentum = ((currentPrice - priceHistory[0]) / priceHistory[0]) * 100;
  const strength = Math.min(100, Math.max(0, 50 + priceMomentum));

  return {
    direction,
    strength,
    indicators: [
      { name: 'SMA 7', value: sma7, signal: currentPrice > sma7 ? 'buy' : 'sell' },
      { name: 'SMA 21', value: sma21, signal: currentPrice > sma21 ? 'buy' : 'sell' },
      { name: 'RSI', value: rsi, signal: rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'hold' },
    ],
    summary: generateTrendSummary(direction, strength, rsi),
  };
}

function calculateSma(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateRsi(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function generateTrendSummary(
  direction: MarketTrend['direction'],
  strength: number,
  rsi: number
): string {
  const directionText = {
    bullish: 'upward momentum',
    bearish: 'downward pressure',
    neutral: 'sideways movement',
  };

  const strengthText = strength > 70 ? 'strong' : strength > 40 ? 'moderate' : 'weak';

  let rsiNote = '';
  if (rsi > 70) rsiNote = ' RSI indicates overbought conditions.';
  else if (rsi < 30) rsiNote = ' RSI indicates oversold conditions.';

  return `Market showing ${strengthText} ${directionText[direction]}.${rsiNote}`;
}

// ============================================================================
// PRICE ALERTS
// ============================================================================

const alerts: PriceAlert[] = [];

/**
 * Create price alert
 */
export function createPriceAlert(
  cardId: string,
  targetPrice: number,
  condition: 'above' | 'below'
): PriceAlert {
  const alert: PriceAlert = {
    id: `alert-${Date.now()}`,
    cardId,
    targetPrice,
    condition,
    isTriggered: false,
    createdAt: new Date(),
  };

  alerts.push(alert);
  return alert;
}

/**
 * Check and trigger alerts
 */
export function checkAlerts(cardId: string, currentPrice: number): PriceAlert[] {
  const triggered: PriceAlert[] = [];

  for (const alert of alerts) {
    if (alert.cardId !== cardId || alert.isTriggered) continue;

    const shouldTrigger =
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);

    if (shouldTrigger) {
      alert.isTriggered = true;
      triggered.push(alert);
    }
  }

  return triggered;
}

/**
 * Get active alerts for a card
 */
export function getActiveAlerts(cardId?: string): PriceAlert[] {
  return alerts.filter((a) => !a.isTriggered && (!cardId || a.cardId === cardId));
}

// ============================================================================
// PORTFOLIO TRACKING
// ============================================================================

export interface PortfolioHolding {
  cardId: string;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  holdings: Array<PortfolioHolding & { value: number; pnl: number; pnlPercent: number }>;
}

/**
 * Calculate portfolio summary
 */
export function calculatePortfolioSummary(holdings: PortfolioHolding[]): PortfolioSummary {
  const enrichedHoldings = holdings.map((h) => {
    const value = h.quantity * h.currentPrice;
    const cost = h.quantity * h.avgPurchasePrice;
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

    return { ...h, value, pnl, pnlPercent };
  });

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.quantity * h.avgPurchasePrice, 0);
  const profitLoss = totalValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    profitLoss,
    profitLossPercent,
    holdings: enrichedHoldings,
  };
}
