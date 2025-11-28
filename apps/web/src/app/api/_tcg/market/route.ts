/**
 * TCG Market API Routes
 *
 * Finance and crypto market integration for TCG.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCryptoPrice,
  fetchMultiplePrices,
  calculateCardPrice,
  estimateCardValue,
  analyzeMarketTrend,
  createPriceAlert,
  getActiveAlerts,
  calculatePortfolioSummary,
  SUPPORTED_TOKENS,
  RARITY_MULTIPLIERS,
  type TcgCardPrice,
  type CardAttributes,
  type PortfolioHolding,
} from '@/lib/tcg-domains';

/**
 * POST /api/tcg/market
 * Market operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'price-crypto': {
        const { tokenId } = body;
        if (!tokenId) {
          return NextResponse.json({ error: 'tokenId required' }, { status: 400 });
        }

        const price = await fetchCryptoPrice(tokenId);
        return NextResponse.json({ success: true, price });
      }

      case 'price-multiple': {
        const { tokenIds } = body as { tokenIds: string[] };
        if (!tokenIds?.length) {
          return NextResponse.json({ error: 'tokenIds array required' }, { status: 400 });
        }

        const prices = await fetchMultiplePrices(tokenIds);
        return NextResponse.json({ success: true, prices });
      }

      case 'calculate-card-price': {
        const { basePrice, rarity, supplyCount, demandScore, ethPrice } = body;

        if (!basePrice || !rarity || !supplyCount) {
          return NextResponse.json(
            { error: 'basePrice, rarity, and supplyCount required' },
            { status: 400 }
          );
        }

        const cardPrice = calculateCardPrice(basePrice, rarity, supplyCount, demandScore || 50, ethPrice);
        return NextResponse.json({ success: true, cardPrice });
      }

      case 'estimate-value': {
        const { rarity, attributes } = body as {
          rarity: TcgCardPrice['rarity'];
          attributes: CardAttributes;
        };

        if (!rarity || !attributes) {
          return NextResponse.json(
            { error: 'rarity and attributes required' },
            { status: 400 }
          );
        }

        const value = estimateCardValue(rarity, attributes);
        return NextResponse.json({ success: true, estimatedValue: value });
      }

      case 'analyze-trend': {
        const { priceHistory } = body as { priceHistory: number[] };

        if (!priceHistory?.length) {
          return NextResponse.json({ error: 'priceHistory array required' }, { status: 400 });
        }

        const trend = analyzeMarketTrend(priceHistory);
        return NextResponse.json({ success: true, trend });
      }

      case 'create-alert': {
        const { cardId, targetPrice, condition } = body;

        if (!cardId || !targetPrice || !condition) {
          return NextResponse.json(
            { error: 'cardId, targetPrice, and condition required' },
            { status: 400 }
          );
        }

        const alert = createPriceAlert(cardId, targetPrice, condition);
        return NextResponse.json({ success: true, alert });
      }

      case 'portfolio-summary': {
        const { holdings } = body as { holdings: PortfolioHolding[] };

        if (!holdings?.length) {
          return NextResponse.json({ error: 'holdings array required' }, { status: 400 });
        }

        const summary = calculatePortfolioSummary(holdings);
        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing market request:', error);
    return NextResponse.json(
      { error: 'Failed to process market request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tcg/market
 * Get market info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'tokens':
        return NextResponse.json({ success: true, tokens: SUPPORTED_TOKENS });

      case 'rarities':
        return NextResponse.json({ success: true, rarities: RARITY_MULTIPLIERS });

      case 'alerts':
        const cardId = searchParams.get('cardId') || undefined;
        const alerts = getActiveAlerts(cardId);
        return NextResponse.json({ success: true, alerts });

      case 'prices':
        const tokenId = searchParams.get('tokenId') || 'ethereum';
        const price = await fetchCryptoPrice(tokenId);
        return NextResponse.json({ success: true, price });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: tokens, rarities, alerts, or prices' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching market info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market info' },
      { status: 500 }
    );
  }
}
