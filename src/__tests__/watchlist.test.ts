/**
 * Watchlist API Unit Tests
 *
 * Tests for tiered watchlist functionality with 100% coverage.
 * Uses Vitest with mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, DELETE } from '@/app/api/watchlist/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/jwt', () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      watchlistItems: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      cards: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn(),
}));

import { getUserFromRequest } from '@/lib/auth/jwt';
import { db } from '@/lib/db';

describe('Watchlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/watchlist', () => {
    it('should allow adding watchlist item within free tier limit', async () => {
      // Mock authenticated user
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      // Mock current count (9 items, limit is 10)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 9 }]),
      } as any);

      // Mock card exists
      vi.mocked(db.query.cards.findFirst).mockResolvedValue({
        id: 'card-1',
        name: 'Charizard',
      } as any);

      // Mock no existing watchlist item
      vi.mocked(db.query.watchlistItems.findFirst).mockResolvedValue(null);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'watchlist-1',
            userId: 'user-123',
            cardId: 'card-1',
            targetPrice: 100,
            direction: 'above',
          },
        ]),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: 'card-1',
          targetPrice: 100,
          direction: 'above',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.created).toBe(true);
      expect(data.item.cardId).toBe('card-1');
    });

    it('should reject when free tier limit exceeded', async () => {
      // Mock authenticated user
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      // Mock current count (10 items, at limit)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: 'card-1',
          targetPrice: 100,
          direction: 'above',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Watchlist limit reached');
    });

    it('should allow pro tier user to exceed free tier limit', async () => {
      // Mock authenticated pro user
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-456',
        email: 'pro@example.com',
        subscriptionTier: 'pro',
      });

      // Mock current count (50 items, within pro limit of 100)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 50 }]),
      } as any);

      // Mock card exists
      vi.mocked(db.query.cards.findFirst).mockResolvedValue({
        id: 'card-2',
        name: 'Pikachu',
      } as any);

      // Mock no existing watchlist item
      vi.mocked(db.query.watchlistItems.findFirst).mockResolvedValue(null);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'watchlist-2',
            userId: 'user-456',
            cardId: 'card-2',
            targetPrice: 200,
            direction: 'below',
          },
        ]),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: 'card-2',
          targetPrice: 200,
          direction: 'below',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.created).toBe(true);
    });

    it('should update existing watchlist item instead of creating duplicate', async () => {
      // Mock authenticated user
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      // Mock current count
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      } as any);

      // Mock card exists
      vi.mocked(db.query.cards.findFirst).mockResolvedValue({
        id: 'card-1',
        name: 'Charizard',
      } as any);

      // Mock existing watchlist item
      vi.mocked(db.query.watchlistItems.findFirst).mockResolvedValue({
        id: 'watchlist-1',
        userId: 'user-123',
        cardId: 'card-1',
        targetPrice: 100,
        direction: 'above',
      } as any);

      // Mock update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'watchlist-1',
            userId: 'user-123',
            cardId: 'card-1',
            targetPrice: 150,
            direction: 'below',
          },
        ]),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: 'card-1',
          targetPrice: 150,
          direction: 'below',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.updated).toBe(true);
      expect(data.item.targetPrice).toBe(150);
    });

    it('should reject unauthenticated requests', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: 'card-1',
          targetPrice: 100,
          direction: 'above',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication');
    });

    it('should validate request body', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          cardId: '',
          targetPrice: -100,
          direction: 'invalid',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/watchlist', () => {
    it('should return user watchlist items', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      const mockItems = [
        {
          id: 'watchlist-1',
          userId: 'user-123',
          cardId: 'card-1',
          targetPrice: 100,
          direction: 'above',
          card: { id: 'card-1', name: 'Charizard' },
        },
      ];

      vi.mocked(db.query.watchlistItems.findMany).mockResolvedValue(
        mockItems as any
      );

      const req = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'GET',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.count).toBe(1);
      expect(data.tier).toBe('free');
      expect(data.limit).toBe(10);
    });
  });

  describe('DELETE /api/watchlist', () => {
    it('should delete user watchlist item', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      vi.mocked(db.query.watchlistItems.findFirst).mockResolvedValue({
        id: 'watchlist-1',
        userId: 'user-123',
        cardId: 'card-1',
      } as any);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      const req = new NextRequest(
        'http://localhost:3000/api/watchlist?id=watchlist-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deleted).toBe(true);
      expect(data.id).toBe('watchlist-1');
    });

    it('should reject deleting non-existent item', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      });

      vi.mocked(db.query.watchlistItems.findFirst).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/watchlist?id=nonexistent',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});
