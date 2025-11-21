/**
 * Hook for managing card warning dialogs
 *
 * Automatically shows warnings for cards with >100% 7-day gains
 * or manipulation flags, with smart deduplication.
 */

import { useState, useEffect } from 'react';
import {
  shouldShowCardWarning,
  hasSeenWarning,
  markWarningAsSeen,
  type CardWarningData,
} from '@/lib/cardWarnings';

interface UseCardWarningOptions {
  cardId: string;
  cardName: string;
  sevenDayGainPercent?: number | null;
  isManipulated?: boolean | null;
  manipulationReason?: string | null;
  autoShow?: boolean; // If true, shows warning automatically on mount
}

export function useCardWarning({
  cardId,
  cardName,
  sevenDayGainPercent,
  isManipulated,
  manipulationReason,
  autoShow = true,
}: UseCardWarningOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningData, setWarningData] = useState<CardWarningData | null>(null);

  useEffect(() => {
    if (!autoShow) return;

    // Check if warning should be shown
    const warning = shouldShowCardWarning({
      name: cardName,
      sevenDayGainPercent,
      isManipulated,
      manipulationReason,
    });

    if (warning && !hasSeenWarning(cardId)) {
      setWarningData(warning);
      setIsWarningOpen(true);
    }
  }, [cardId, cardName, sevenDayGainPercent, isManipulated, manipulationReason, autoShow]);

  const handleCloseWarning = () => {
    setIsWarningOpen(false);
    markWarningAsSeen(cardId);
  };

  const showWarning = () => {
    const warning = shouldShowCardWarning({
      name: cardName,
      sevenDayGainPercent,
      isManipulated,
      manipulationReason,
    });

    if (warning) {
      setWarningData(warning);
      setIsWarningOpen(true);
    }
  };

  return {
    isWarningOpen,
    warningData,
    showWarning,
    closeWarning: handleCloseWarning,
  };
}
