/**
 * Tier Enforcement Unit Tests
 *
 * Tests for subscription tier limits and rate limiting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTierLimits, hasTierFeature } from '@/lib/stripe';
import { canAccessFeature } from '@/lib/tier-enforcement';

describe('Tier Enforcement', () => {
  describe('getTierLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = getTierLimits('free');
      expect(limits.watchlistLimit).toBe(10);
      expect(limits.dailyApiLimit).toBe(100);
      expect(limits.features).toContain('basic_alerts');
      expect(limits.features).not.toContain('web_push');
    });

    it('should return correct limits for pro tier', () => {
      const limits = getTierLimits('pro');
      expect(limits.watchlistLimit).toBe(100);
      expect(limits.dailyApiLimit).toBe(10000);
      expect(limits.features).toContain('web_push');
      expect(limits.features).toContain('priority_feed');
    });

    it('should return correct limits for enterprise tier', () => {
      const limits = getTierLimits('enterprise');
      expect(limits.watchlistLimit).toBe(999999);
      expect(limits.dailyApiLimit).toBe(1000000);
      expect(limits.features).toContain('dedicated_support');
      expect(limits.features).toContain('custom_integrations');
    });
  });

  describe('hasTierFeature', () => {
    it('should allow free tier to access basic features', () => {
      expect(hasTierFeature('free', 'basic_alerts')).toBe(true);
      expect(hasTierFeature('free', 'public_data')).toBe(true);
    });

    it('should deny free tier access to premium features', () => {
      expect(hasTierFeature('free', 'web_push')).toBe(false);
      expect(hasTierFeature('free', 'priority_feed')).toBe(false);
      expect(hasTierFeature('free', 'dedicated_support')).toBe(false);
    });

    it('should allow pro tier to access pro features', () => {
      expect(hasTierFeature('pro', 'web_push')).toBe(true);
      expect(hasTierFeature('pro', 'priority_feed')).toBe(true);
    });

    it('should deny pro tier access to enterprise features', () => {
      expect(hasTierFeature('pro', 'dedicated_support')).toBe(false);
      expect(hasTierFeature('pro', 'custom_integrations')).toBe(false);
    });

    it('should allow enterprise tier to access all features', () => {
      expect(hasTierFeature('enterprise', 'web_push')).toBe(true);
      expect(hasTierFeature('enterprise', 'dedicated_support')).toBe(true);
      expect(hasTierFeature('enterprise', 'custom_integrations')).toBe(true);
    });
  });

  describe('canAccessFeature', () => {
    it('should correctly check feature access', () => {
      expect(canAccessFeature('free', 'basic_alerts')).toBe(true);
      expect(canAccessFeature('free', 'web_push')).toBe(false);
      expect(canAccessFeature('pro', 'web_push')).toBe(true);
      expect(canAccessFeature('enterprise', 'custom_integrations')).toBe(true);
    });
  });
});

describe('Tier Limits Boundary Testing', () => {
  it('should enforce exact limits for free tier', () => {
    const limits = getTierLimits('free');
    // Free tier can have exactly 10 watchlist items
    expect(limits.watchlistLimit).toBe(10);
    // 11th item should be rejected (tested in watchlist.test.ts)
  });

  it('should enforce exact limits for pro tier', () => {
    const limits = getTierLimits('pro');
    expect(limits.watchlistLimit).toBe(100);
    expect(limits.dailyApiLimit).toBe(10000);
  });

  it('should have effectively unlimited limits for enterprise', () => {
    const limits = getTierLimits('enterprise');
    expect(limits.watchlistLimit).toBeGreaterThan(999000);
    expect(limits.dailyApiLimit).toBeGreaterThan(999000);
  });
});
