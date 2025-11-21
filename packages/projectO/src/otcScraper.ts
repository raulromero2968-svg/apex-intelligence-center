import type { OtcOrder } from './types';
import { projectOotcOrders } from '@apex/db/src/schema';

const OTC_BASE_URL = process.env.PROJECT_O_OTC_BASE_URL;
const OTC_API_KEY = process.env.PROJECT_O_OTC_API_KEY;

if (!OTC_BASE_URL) {
  throw new Error('PROJECT_O_OTC_BASE_URL environment variable is required');
}

interface OtcApiResponse {
  orders: Array<{
    id: string;
    side: 'buy' | 'sell';
    cardId: string;
    price: number;
    currency: string;
    size: number;
    trader?: string;
    source?: string;
  }>;
  pagination?: {
    next?: string;
  };
}

export async function fetchOtcOrderBook(): Promise<OtcOrder[]> {
  const orders: OtcOrder[] = [];
  let nextPage: string | undefined;

  do {
    const url = nextPage ? `${OTC_BASE_URL}${nextPage}` : `${OTC_BASE_URL}/api/orders`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (OTC_API_KEY) {
      headers['Authorization'] = `Bearer ${OTC_API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`OTC API error: ${response.status} ${response.statusText}`);
    }

    const data: OtcApiResponse = await response.json();

    for (const order of data.orders) {
      orders.push({
        orderId: order.id,
        side: order.side,
        cardId: order.cardId,
        price: order.price,
        priceCurrency: order.currency,
        size: order.size,
        traderHandle: order.trader ?? null,
        source: order.source ?? 'official_otc',
        raw: order,
      });
    }

    nextPage = data.pagination?.next;
  } while (nextPage);

  return orders;
}

export async function upsertOtcOrders(
  db: any,
  orders: OtcOrder[]
): Promise<number> {
  let upserted = 0;

  for (const order of orders) {
    try {
      await db
        .insert(projectOotcOrders)
        .values({
          orderId: order.orderId,
          side: order.side,
          cardId: order.cardId,
          price: order.price.toString(),
          priceCurrency: order.priceCurrency,
          size: order.size,
          traderHandle: order.traderHandle ?? null,
          source: order.source,
          raw: order.raw ?? {},
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projectOotcOrders.orderId,
          set: {
            side: order.side,
            cardId: order.cardId,
            price: order.price.toString(),
            priceCurrency: order.priceCurrency,
            size: order.size,
            traderHandle: order.traderHandle ?? null,
            source: order.source,
            raw: order.raw ?? {},
            updatedAt: new Date(),
          },
        });

      upserted++;
    } catch (error) {
      console.error(`[project-o-otc] Failed to upsert order ${order.orderId}:`, error);
    }
  }

  return upserted;
}
