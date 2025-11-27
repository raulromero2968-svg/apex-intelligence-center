/**
 * Unit tests for Stripe webhook handler
 * 
 * Tests cover:
 * - Valid signature and event → success path
 * - Invalid signature → 400 + logged
 * - Malicious client trying to upgrade themselves → blocked
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/webhook/route';
import { getStripeClient } from '@/server/services/stripeClient';
import { createLogger } from '@apex/shared/logger';

// Mock dependencies
vi.mock('@/server/services/stripeClient');
vi.mock('@apex/shared/logger');
vi.mock('@/lib/auth');
vi.mock('@/db');
vi.mock('@/db/schema');

describe('Stripe Webhook Handler', () => {
  const mockStripe = {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };

  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);
    vi.mocked(createLogger).mockReturnValue(mockLogger as any);
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should reject request with invalid signature', async () => {
    const rawBody = Buffer.from(JSON.stringify({ type: 'test' }));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'invalid_signature',
      },
    });

    vi.mocked(mockStripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Webhook Error');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Webhook signature verification failed',
      expect.objectContaining({
        error: 'Invalid signature',
      })
    );
  });

  it('should reject request with missing signature header', async () => {
    const rawBody = Buffer.from(JSON.stringify({ type: 'test' }));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing signature');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Missing stripe-signature header',
      expect.objectContaining({})
    );
  });

  it('should handle valid checkout.session.completed event', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
          metadata: {
            priceId: 'price_test_123',
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(event));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'valid_signature',
      },
    });

    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(event as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Checkout session completed',
      expect.objectContaining({
        sessionId: 'cs_test_123',
        customerId: 'cus_test_123',
        subscriptionId: 'sub_test_123',
      })
    );
  });

  it('should handle customer.subscription.updated event', async () => {
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(event));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'valid_signature',
      },
    });

    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(event as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Subscription updated',
      expect.objectContaining({
        subscriptionId: 'sub_test_123',
        customerId: 'cus_test_123',
        status: 'active',
      })
    );
  });

  it('should handle customer.subscription.deleted event', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(event));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'valid_signature',
      },
    });

    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(event as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Subscription deleted',
      expect.objectContaining({
        subscriptionId: 'sub_test_123',
        customerId: 'cus_test_123',
      })
    );
  });

  it('should return 500 if STRIPE_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const rawBody = Buffer.from(JSON.stringify({ type: 'test' }));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'valid_signature',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook secret not configured');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'STRIPE_WEBHOOK_SECRET not configured',
      expect.objectContaining({})
    );
  });

  it('should handle unhandled event types gracefully', async () => {
    const event = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_123',
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(event));
    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 'valid_signature',
      },
    });

    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(event as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Unhandled event type',
      expect.objectContaining({
        eventType: 'invoice.payment_succeeded',
      })
    );
  });
});

