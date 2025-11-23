/**
 * Price API Service
 * Integrates with TCGPlayer, eBay, and other price sources
 */

import { apiClient } from './client';
import { API_CONFIG, API_ENDPOINTS } from './config';

export interface CardPrice {
  cardId: string;
  name: string;
  set: string;
  number?: string;
  rarity?: string;
  prices: {
    market: number;
    low: number;
    mid: number;
    high: number;
  };
  graded?: {
    psa9?: number;
    psa10?: number;
    bgs9?: number;
    bgs10?: number;
  };
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volume24h?: number;
  lastUpdated: string;
  source: 'tcgplayer' | 'ebay' | 'mock';
}

export interface PriceHistory {
  cardId: string;
  data: Array<{
    date: string;
    price: number;
    volume?: number;
  }>;
}

export interface SearchResult {
  cards: CardPrice[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Mock data for development
 */
const MOCK_PRICES: CardPrice[] = [
  {
    cardId: 'charizard-base-set-4',
    name: 'Charizard',
    set: 'Base Set',
    number: '4',
    rarity: 'Holo Rare',
    prices: {
      market: 425.0,
      low: 380.0,
      mid: 425.0,
      high: 475.0,
    },
    graded: {
      psa9: 1850.0,
      psa10: 8200.0,
      bgs9: 1650.0,
      bgs10: 12500.0,
    },
    priceChange24h: 2.5,
    priceChange7d: 5.8,
    priceChange30d: -3.2,
    volume24h: 47,
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  },
  {
    cardId: 'one-ring-serialized',
    name: 'The One Ring (Serialized)',
    set: 'The Lord of the Rings: Tales of Middle-earth',
    number: '001',
    rarity: 'Mythic Rare',
    prices: {
      market: 2100000.0,
      low: 2000000.0,
      mid: 2100000.0,
      high: 2200000.0,
    },
    priceChange24h: 0.0,
    priceChange7d: 0.0,
    priceChange30d: 0.0,
    volume24h: 0,
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  },
  {
    cardId: 'pikachu-vmax-rainbow',
    name: 'Pikachu VMAX (Rainbow Rare)',
    set: 'Vivid Voltage',
    number: '188',
    rarity: 'Secret Rare',
    prices: {
      market: 145.0,
      low: 125.0,
      mid: 145.0,
      high: 165.0,
    },
    graded: {
      psa9: 180.0,
      psa10: 425.0,
    },
    priceChange24h: 1.2,
    priceChange7d: -2.1,
    priceChange30d: 8.5,
    volume24h: 23,
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  },
];

class PriceService {
  /**
   * Search for cards by name
   */
  async searchCards(
    query: string,
    options?: {
      page?: number;
      pageSize?: number;
      set?: string;
      game?: 'pokemon' | 'mtg' | 'onepiece' | 'lorcana';
    }
  ): Promise<SearchResult> {
    // Use mock data in development
    if (API_CONFIG.priceAPIs.useMockData) {
      return this.searchMockData(query, options);
    }

    const params = new URLSearchParams({
      q: query,
      page: String(options?.page || 1),
      pageSize: String(options?.pageSize || 20),
      ...(options?.set && { set: options.set }),
      ...(options?.game && { game: options.game }),
    });

    const response = await apiClient.get<SearchResult>(
      `${API_ENDPOINTS.prices.search}?${params}`
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Get price data for a specific card
   */
  async getCardPrice(cardId: string): Promise<CardPrice> {
    // Use mock data in development
    if (API_CONFIG.priceAPIs.useMockData) {
      const mockCard = MOCK_PRICES.find((c) => c.cardId === cardId);
      if (!mockCard) {
        throw new Error('Card not found');
      }
      return mockCard;
    }

    const response = await apiClient.get<CardPrice>(
      API_ENDPOINTS.prices.card(cardId)
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Get price history for a card
   */
  async getPriceHistory(
    cardId: string,
    period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
  ): Promise<PriceHistory> {
    // Use mock data in development
    if (API_CONFIG.priceAPIs.useMockData) {
      return this.getMockPriceHistory(cardId, period);
    }

    const response = await apiClient.get<PriceHistory>(
      `${API_ENDPOINTS.prices.history(cardId)}?period=${period}`
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Get prices for multiple cards (batch)
   */
  async getBatchPrices(cardIds: string[]): Promise<CardPrice[]> {
    // Use mock data in development
    if (API_CONFIG.priceAPIs.useMockData) {
      return MOCK_PRICES.filter((c) => cardIds.includes(c.cardId));
    }

    const response = await apiClient.post<CardPrice[]>(
      API_ENDPOINTS.prices.batch,
      { cardIds }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Mock data helpers
   */
  private searchMockData(
    query: string,
    options?: { page?: number; pageSize?: number }
  ): SearchResult {
    const filtered = MOCK_PRICES.filter((card) =>
      card.name.toLowerCase().includes(query.toLowerCase())
    );

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      cards: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  private getMockPriceHistory(cardId: string, period: string): PriceHistory {
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      all: 730,
    }[period] || 30;

    const basePrice = MOCK_PRICES.find((c) => c.cardId === cardId)?.prices.market || 100;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic price fluctuation
      const variance = (Math.random() - 0.5) * 0.1; // ±5%
      const trendFactor = (days - i) / days * 0.05; // Slight upward trend
      const price = basePrice * (1 + variance + trendFactor);

      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 50),
      });
    }

    return { cardId, data };
  }
}

export const priceService = new PriceService();
