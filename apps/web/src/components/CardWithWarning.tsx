/**
 * CardWithWarning
 *
 * Wrapper component that displays a card and automatically shows
 * educational warning dialogs for high-risk cards (>100% 7d gain
 * or manipulation flags).
 *
 * Usage:
 * ```tsx
 * <CardWithWarning
 *   cardId={card.id}
 *   cardName={card.name}
 *   sevenDayGainPercent={card.sevenDayGainPercent}
 *   isManipulated={card.isManipulated}
 *   manipulationReason={card.manipulationReason}
 * >
 *   <YourCardComponent {...card} />
 * </CardWithWarning>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import CardWarningDialog from './CardWarningDialog';
import { useCardWarning } from '@/hooks/useCardWarning';

interface CardWithWarningProps {
  cardId: string;
  cardName: string;
  sevenDayGainPercent?: number | null;
  isManipulated?: boolean | null;
  manipulationReason?: string | null;
  autoShow?: boolean; // Default: true
  children: ReactNode;
}

export default function CardWithWarning({
  cardId,
  cardName,
  sevenDayGainPercent,
  isManipulated,
  manipulationReason,
  autoShow = true,
  children,
}: CardWithWarningProps) {
  const { isWarningOpen, warningData, closeWarning } = useCardWarning({
    cardId,
    cardName,
    sevenDayGainPercent,
    isManipulated,
    manipulationReason,
    autoShow,
  });

  return (
    <>
      {children}

      {warningData && (
        <CardWarningDialog
          isOpen={isWarningOpen}
          onClose={closeWarning}
          cardName={warningData.cardName}
          gainPercent={warningData.gainPercent}
          isManipulated={warningData.isManipulated}
          manipulationReason={warningData.manipulationReason}
        />
      )}
    </>
  );
}
