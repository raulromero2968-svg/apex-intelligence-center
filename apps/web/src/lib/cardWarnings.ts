/**
 * Card Warning Utilities
 *
 * Functions to determine if a card should display educational warnings
 * based on 7-day price gains and manipulation flags.
 */

export interface CardWarningData {
  shouldWarn: boolean;
  cardName: string;
  gainPercent: number;
  isManipulated: boolean;
  manipulationReason?: string;
}

/**
 * Determines if a card should trigger a warning dialog
 *
 * @param card - Card data with gain and manipulation info
 * @returns Warning data if warning should be shown, null otherwise
 */
export function shouldShowCardWarning(card: {
  name: string;
  sevenDayGainPercent?: number | null;
  isManipulated?: boolean | null;
  manipulationReason?: string | null;
}): CardWarningData | null {
  const gainPercent = card.sevenDayGainPercent ?? 0;
  const isManipulated = card.isManipulated ?? false;

  // Show warning if gain is >100% OR card is manipulated
  if (gainPercent > 100 || isManipulated) {
    return {
      shouldWarn: true,
      cardName: card.name,
      gainPercent,
      isManipulated,
      manipulationReason: card.manipulationReason ?? undefined,
    };
  }

  return null;
}

/**
 * Calculate 7-day gain percentage from price data
 *
 * @param currentPrice - Current market price
 * @param priceSevenDaysAgo - Price 7 days ago
 * @returns Percentage gain (e.g., 150 for +150%)
 */
export function calculate7DayGain(
  currentPrice: number,
  priceSevenDaysAgo: number
): number {
  if (priceSevenDaysAgo === 0) return 0;

  const gain = ((currentPrice - priceSevenDaysAgo) / priceSevenDaysAgo) * 100;
  return Math.round(gain * 10) / 10; // Round to 1 decimal place
}

/**
 * Check if a card has been flagged recently (within last 7 days)
 * to avoid showing warnings repeatedly
 */
export function wasRecentlyFlagged(lastFlaggedAt: Date | null | undefined): boolean {
  if (!lastFlaggedAt) return false;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return new Date(lastFlaggedAt) > sevenDaysAgo;
}

/**
 * Local storage key for tracking which cards a user has already seen warnings for
 */
const SEEN_WARNINGS_KEY = 'apex_seen_card_warnings';

/**
 * Check if user has already seen warning for this card
 */
export function hasSeenWarning(cardId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const seenWarnings = JSON.parse(
      localStorage.getItem(SEEN_WARNINGS_KEY) || '{}'
    ) as Record<string, number>;

    // Check if warning was seen in last 24 hours
    const seenTime = seenWarnings[cardId];
    if (!seenTime) return false;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return seenTime > oneDayAgo;
  } catch {
    return false;
  }
}

/**
 * Mark that user has seen warning for this card
 */
export function markWarningAsSeen(cardId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const seenWarnings = JSON.parse(
      localStorage.getItem(SEEN_WARNINGS_KEY) || '{}'
    ) as Record<string, number>;

    seenWarnings[cardId] = Date.now();

    // Clean up old entries (older than 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    Object.keys(seenWarnings).forEach((key) => {
      if (seenWarnings[key] < sevenDaysAgo) {
        delete seenWarnings[key];
      }
    });

    localStorage.setItem(SEEN_WARNINGS_KEY, JSON.stringify(seenWarnings));
  } catch (error) {
    console.error('Failed to save warning state:', error);
  }
}
