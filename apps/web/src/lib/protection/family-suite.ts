/**
 * Family Protection Suite - Ethical Safeguards
 *
 * Implements the 8 Ethical Rules to protect users from financial ruin and addiction.
 * Architecture: 13_LAUNCH_07
 *
 * The 8 Rules:
 * 1. Hard Cap: $1M max portfolio tracking (unless KYC verified)
 * 2. Reality Check: Block screen after 4-hour session
 * 3. Loss Aversion: Explicitly highlight realized losses
 * 4. Anti-FOMO: Warning banner on >50% 24h spikes
 * 5. Minor Lockout: <18 accounts cannot access predictions/buy links
 * 6. Diverse Portfolio: Warning on >80% concentration
 * 7. Verified Sources: Filter unverified Twitter hype
 * 8. Cool Down: 60-second delay on "Buy" buttons after hype notifications
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface FamilyProtectionConfig {
  userId: string;
  dateOfBirth?: Date;
  kycVerified: boolean;
  breakModeUntil?: Date;
  breakModeActivatedBy?: 'child' | 'parent';
}

export interface SessionCheck {
  shouldBlock: boolean;
  reason?: string;
  sessionDurationMinutes: number;
  warningThresholdMinutes: number;
}

export interface PortfolioRisk {
  isHighRisk: boolean;
  concentrationPct: number;
  topHoldingPct: number;
  warnings: string[];
}

export interface FOMOCheck {
  showWarning: boolean;
  priceChange24h: number;
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
  message?: string;
}

/**
 * Rule 1: Check if portfolio value exceeds hard cap
 * Returns true if user should be blocked from adding more value
 */
export async function checkPortfolioHardCap(
  userId: string,
  currentValue: number,
  kycVerified: boolean
): Promise<{ blocked: boolean; limit: number; message?: string }> {
  const HARD_CAP_UNVERIFIED = 1_000_000; // $1M
  const HARD_CAP_VERIFIED = 10_000_000; // $10M for KYC users

  const limit = kycVerified ? HARD_CAP_VERIFIED : HARD_CAP_UNVERIFIED;

  if (currentValue >= limit) {
    return {
      blocked: true,
      limit,
      message: kycVerified
        ? 'Portfolio limit reached. Contact support for enterprise tier.'
        : 'Portfolio limit reached. Complete KYC verification to increase limit.',
    };
  }

  return { blocked: false, limit };
}

/**
 * Rule 2: Reality Check Modal - Block screen after 4-hour session
 */
export function checkSessionDuration(
  sessionStartTime: Date,
  currentTime: Date = new Date()
): SessionCheck {
  const SESSION_LIMIT_MS = 4 * 60 * 60 * 1000; // 4 hours
  const WARNING_THRESHOLD_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours

  const durationMs = currentTime.getTime() - sessionStartTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);

  if (durationMs >= SESSION_LIMIT_MS) {
    return {
      shouldBlock: true,
      reason: 'Session limit reached. Time to take a break. The market will be here tomorrow.',
      sessionDurationMinutes: durationMinutes,
      warningThresholdMinutes: 240,
    };
  }

  if (durationMs >= WARNING_THRESHOLD_MS) {
    return {
      shouldBlock: false,
      reason: 'You have been browsing for over 3.5 hours. Consider taking a break soon.',
      sessionDurationMinutes: durationMinutes,
      warningThresholdMinutes: 210,
    };
  }

  return {
    shouldBlock: false,
    sessionDurationMinutes: durationMinutes,
    warningThresholdMinutes: 210,
  };
}

/**
 * Rule 4: Anti-FOMO Check - Warn on >50% 24h price spikes
 */
export function checkFOMO(
  currentPrice: number,
  price24hAgo: number
): FOMOCheck {
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  if (Math.abs(changePercent) > 100) {
    return {
      showWarning: true,
      priceChange24h: changePercent,
      volatilityLevel: 'extreme',
      message:
        'EXTREME VOLATILITY: This card has moved >100% in 24 hours. Do not invest money you cannot afford to lose.',
    };
  }

  if (Math.abs(changePercent) > 50) {
    return {
      showWarning: true,
      priceChange24h: changePercent,
      volatilityLevel: 'high',
      message:
        'High Volatility Risk: This card has spiked significantly. Be cautious of pump-and-dump schemes.',
    };
  }

  if (Math.abs(changePercent) > 30) {
    return {
      showWarning: true,
      priceChange24h: changePercent,
      volatilityLevel: 'medium',
      message: 'Moderate price movement detected. Research carefully before investing.',
    };
  }

  return {
    showWarning: false,
    priceChange24h: changePercent,
    volatilityLevel: 'low',
  };
}

/**
 * Rule 5: Minor Lockout - Check if user is under 18
 */
export function checkMinorStatus(dateOfBirth: Date): {
  isMinor: boolean;
  age: number;
  restrictedFeatures: string[];
} {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
      ? age - 1
      : age;

  if (actualAge < 18) {
    return {
      isMinor: true,
      age: actualAge,
      restrictedFeatures: [
        'Market Predictions',
        'Buy Links',
        'Speculative Trading Tools',
        'Arbitrage Scanner',
      ],
    };
  }

  return {
    isMinor: false,
    age: actualAge,
    restrictedFeatures: [],
  };
}

/**
 * Rule 6: Portfolio Concentration Risk
 */
export function checkPortfolioConcentration(holdings: Array<{
  cardName: string;
  value: number;
}>): PortfolioRisk {
  if (holdings.length === 0) {
    return {
      isHighRisk: false,
      concentrationPct: 0,
      topHoldingPct: 0,
      warnings: [],
    };
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const topHolding = holdings.reduce((max, h) => (h.value > max.value ? h : max), holdings[0]);
  const topHoldingPct = (topHolding.value / totalValue) * 100;

  const warnings: string[] = [];

  if (topHoldingPct > 80) {
    warnings.push(
      `CRITICAL: ${topHolding.cardName} represents ${topHoldingPct.toFixed(1)}% of your portfolio. This is extremely risky.`
    );
  } else if (topHoldingPct > 50) {
    warnings.push(
      `WARNING: ${topHolding.cardName} represents ${topHoldingPct.toFixed(1)}% of your portfolio. Consider diversifying.`
    );
  }

  // Check if top 3 holdings represent >80% of portfolio
  const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);
  const top3Value = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.value, 0);
  const top3Pct = (top3Value / totalValue) * 100;

  if (top3Pct > 80) {
    warnings.push(
      `High Concentration Risk: Your top 3 holdings represent ${top3Pct.toFixed(1)}% of portfolio value.`
    );
  }

  return {
    isHighRisk: warnings.length > 0,
    concentrationPct: top3Pct,
    topHoldingPct,
    warnings,
  };
}

/**
 * Rule 8: Cool Down Timer State
 * Returns timestamp when buy button should be enabled
 */
export function getCoolDownEndTime(hypeNotificationTime: Date): Date {
  const COOL_DOWN_MS = 60 * 1000; // 60 seconds
  return new Date(hypeNotificationTime.getTime() + COOL_DOWN_MS);
}

/**
 * Check if user is in Break Mode (parent-activated or self-activated)
 */
export async function checkBreakMode(userId: string): Promise<{
  inBreakMode: boolean;
  endsAt?: Date;
  activatedBy?: 'child' | 'parent';
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.breakModeUntil) {
    return { inBreakMode: false };
  }

  const now = new Date();
  if (user.breakModeUntil > now) {
    return {
      inBreakMode: true,
      endsAt: user.breakModeUntil,
      activatedBy: user.breakModeActivatedBy || undefined,
    };
  }

  return { inBreakMode: false };
}

/**
 * Activate Break Mode for a user
 */
export async function activateBreakMode(
  userId: string,
  durationHours: number,
  activatedBy: 'child' | 'parent'
): Promise<void> {
  const breakModeUntil = new Date();
  breakModeUntil.setHours(breakModeUntil.getHours() + durationHours);

  await db
    .update(users)
    .set({
      breakModeUntil,
      breakModeActivatedBy: activatedBy,
    })
    .where(eq(users.id, userId));
}

/**
 * Generate Parent Dashboard shareable link token
 * Read-only view of child's collection
 */
export function generateParentDashboardToken(userId: string): string {
  // In production, this would generate a JWT with limited scope
  // For now, return a simple encoded token
  const payload = {
    userId,
    scope: 'parent_view',
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
