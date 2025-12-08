/**
 * ProContext Component Tests
 *
 * Tests for the Trust-First content gating component:
 * - Content is hidden (blurred) for guests
 * - Content is revealed for authenticated users with correct tier
 * - Tier hierarchy is respected (apex > intelligence > free)
 * - Loading states are handled correctly
 *
 * Philosophy: "Value Exchange, Not FOMO"
 * These tests ensure we gate content professionally without manipulation.
 *
 * @see ProContext.tsx
 * @see Core Values: Transparency, Trust
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks
// ============================================================================

// Mock localStorage (jsdom provides window.localStorage but we mock it for control)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _setStore: (newStore: Record<string, string>) => {
      store = { ...newStore };
    },
    _getStore: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock document.cookie (jsdom provides document)
let cookieStore = '';
Object.defineProperty(document, 'cookie', {
  get: () => cookieStore,
  set: (value: string) => {
    cookieStore = value;
  },
  configurable: true,
});

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  cookieStore = '';
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

const setAuthState = (authenticated: boolean, tier: 'free' | 'intelligence' | 'apex' = 'free') => {
  if (authenticated) {
    localStorageMock.setItem('apex-auth-token', 'test-token-123');
    localStorageMock.setItem('apex-user-tier', tier);
  } else {
    localStorageMock.clear();
  }
};

// ============================================================================
// Tests
// ============================================================================

describe('ProContext Component', () => {
  describe('Guest User (Not Authenticated)', () => {
    it('should show blurred preview for guest users', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext title="Premium Analysis" tier="intelligence">
          <div data-testid="premium-content">
            This is premium content that should be hidden
          </div>
        </ProContext>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // The content should be in a blurred container
      const blurredContainer = document.querySelector('.blur-md');
      expect(blurredContainer).toBeInTheDocument();

      // The professional threshold card should be visible
      expect(screen.getByText('Premium Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Institutional-grade analysis/i)).toBeInTheDocument();
    });

    it('should display sign-in prompt for unauthenticated users', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext title="Advanced Chart" tier="intelligence">
          <div>Chart content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Should show sign-in link
      expect(screen.getByText(/Already a subscriber/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in to access/i)).toBeInTheDocument();
    });

    it('should show methodology explanation in gate', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext
          title="Prediction Model"
          tier="apex"
          methodology="Uses ML regression on 2.3M transactions"
          dataSourceCount={23000}
          computeLevel="intensive"
        >
          <div>Prediction content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Should explain why access is required (transparency)
      expect(screen.getByText(/Why this requires/i)).toBeInTheDocument();
      expect(screen.getByText(/ML-Enhanced/i)).toBeInTheDocument();
      expect(screen.getByText(/23,000 data points/i)).toBeInTheDocument();
      expect(screen.getByText(/Uses ML regression on 2.3M transactions/i)).toBeInTheDocument();
    });

    it('should link to pricing page with correct tier', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="apex">
          <div>Apex content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Should have link to pricing with tier param
      const accessButton = screen.getByRole('link', { name: /Access Apex Tools/i });
      expect(accessButton).toHaveAttribute('href', '/pricing?tier=apex');
    });
  });

  describe('Authenticated User with Correct Tier', () => {
    it('should reveal content for authenticated user with intelligence tier', async () => {
      setAuthState(true, 'intelligence');

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext title="Intelligence Analysis" tier="intelligence">
          <div data-testid="visible-content">
            This content should be visible to intelligence tier users
          </div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Content should be visible (not blurred)
      expect(screen.getByTestId('visible-content')).toBeInTheDocument();
      expect(screen.getByText(/This content should be visible/i)).toBeInTheDocument();

      // Should not show the gate/paywall
      expect(screen.queryByText(/Institutional-grade analysis available/i)).not.toBeInTheDocument();
    });

    it('should show access badge for authenticated users', async () => {
      setAuthState(true, 'intelligence');

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="intelligence">
          <div>Content here</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Should show the tier badge
      expect(screen.getByText(/INTELLIGENCE ANALYSIS/i)).toBeInTheDocument();
    });

    it('should allow apex users to access intelligence content', async () => {
      setAuthState(true, 'apex'); // Higher tier

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="intelligence">
          <div data-testid="intel-content">Intelligence tier content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Apex users should see intelligence content (tier hierarchy)
      expect(screen.getByTestId('intel-content')).toBeInTheDocument();
    });
  });

  describe('Tier Hierarchy', () => {
    it('should deny intelligence users access to apex content', async () => {
      setAuthState(true, 'intelligence'); // Lower tier

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="apex">
          <div data-testid="apex-content">Apex-only content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Should show blurred content (intelligence cannot access apex)
      const blurredContainer = document.querySelector('.blur-md');
      expect(blurredContainer).toBeInTheDocument();

      // Should prompt to upgrade to apex
      expect(screen.getByRole('link', { name: /Access Apex Tools/i })).toBeInTheDocument();
    });

    it('should deny free users access to intelligence content', async () => {
      setAuthState(true, 'free');

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="intelligence">
          <div>Intelligence content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Free users should see gate
      const blurredContainer = document.querySelector('.blur-md');
      expect(blurredContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      const { container } = render(
        <ProContext>
          <div>Content</div>
        </ProContext>
      );

      // Should show loading spinner initially
      expect(screen.getByText(/Loading analysis/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Convenience Components', () => {
    it('IntelligenceContext should default to intelligence tier', async () => {
      setAuthState(true, 'intelligence');

      const { IntelligenceContext } = await import('../ProContext');

      render(
        <IntelligenceContext title="Intel Report">
          <div data-testid="intel-data">Data visible</div>
        </IntelligenceContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('intel-data')).toBeInTheDocument();
    });

    it('ApexContext should default to apex tier', async () => {
      setAuthState(true, 'apex');

      const { ApexContext } = await import('../ProContext');

      render(
        <ApexContext title="Apex Prediction">
          <div data-testid="apex-data">Top tier data</div>
        </ApexContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('apex-data')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on blurred preview', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext>
          <div>Hidden content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // Blurred content should be aria-hidden
      const blurredContainer = document.querySelector('[aria-hidden="true"]');
      expect(blurredContainer).toBeInTheDocument();
    });

    it('should have accessible CTA button', async () => {
      setAuthState(false);

      const { ProContext } = await import('../ProContext');

      render(
        <ProContext tier="intelligence">
          <div>Content</div>
        </ProContext>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
      });

      // CTA should be a link with accessible name
      const ctaLink = screen.getByRole('link', { name: /Access Intelligence Tools/i });
      expect(ctaLink).toBeInTheDocument();
    });
  });
});

describe('Trust-First Messaging', () => {
  it('should NOT use FOMO language', async () => {
    setAuthState(false);

    const { ProContext } = await import('../ProContext');

    render(
      <ProContext tier="apex">
        <div>Content</div>
      </ProContext>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
    });

    // Should NOT contain manipulative FOMO phrases
    expect(screen.queryByText(/limited time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exclusive/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/don't miss out/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hurry/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/only \d+ left/i)).not.toBeInTheDocument();
  });

  it('should include professional, trust-building language', async () => {
    setAuthState(false);

    const { ProContext } = await import('../ProContext');

    render(
      <ProContext tier="intelligence" methodology="Historical transaction analysis">
        <div>Content</div>
      </ProContext>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading analysis/i)).not.toBeInTheDocument();
    });

    // Should contain professional language
    expect(screen.getByText(/No commitment required/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument();
    expect(screen.getByText(/Methodology/i)).toBeInTheDocument();
  });
});
