# Educational Card Warning System

## Overview

This feature displays educational pop-ups on any card with **>100% 7-day gain** or a **manipulation flag**. The modal warns users that historically, 89% of such moves reverse within 30 days, encouraging them to consider waiting.

**Key Features:**
- 🚨 Automatic detection of high-risk cards (>100% 7d gain OR manipulation flag)
- ⏱️ Forced 5-second view before users can close the warning
- 💾 Smart deduplication (won't show same warning within 24 hours)
- 🎨 Prominent orange/red warning design with clear messaging
- ♿ Fully accessible with ARIA attributes and keyboard support

## Database Schema

### New Fields Added to `cards` Table

```sql
-- 7-day price gain percentage
seven_day_gain_percent REAL

-- Market manipulation detection
is_manipulated BOOLEAN DEFAULT false
manipulation_reason TEXT
last_flagged_at TIMESTAMP

-- Indexes for performance
CREATE INDEX idx_cards_high_risk
  ON cards (is_manipulated, seven_day_gain_percent)
  WHERE is_manipulated = true OR seven_day_gain_percent > 100;

CREATE INDEX idx_cards_last_flagged
  ON cards (last_flagged_at)
  WHERE last_flagged_at IS NOT NULL;
```

## Migration

Run the migration to add the new fields:

```bash
# The migration is located at:
# prisma/migrations/20251121_add_card_warning_fields/migration.sql

# Apply migration (use your existing migration process)
# For example:
npm run db:migrate
# or
pnpm db:migrate
```

## Usage

### Option 1: Wrapper Component (Recommended)

Wrap any card component with `CardWithWarning`:

```tsx
import CardWithWarning from '@/components/CardWithWarning';

function MyCardList({ cards }) {
  return (
    <div>
      {cards.map((card) => (
        <CardWithWarning
          key={card.id}
          cardId={card.id}
          cardName={card.name}
          sevenDayGainPercent={card.sevenDayGainPercent}
          isManipulated={card.isManipulated}
          manipulationReason={card.manipulationReason}
          autoShow={true} // Shows warning automatically on mount
        >
          <YourCardComponent card={card} />
        </CardWithWarning>
      ))}
    </div>
  );
}
```

### Option 2: Custom Implementation

Use the hook and dialog directly for more control:

```tsx
import { useCardWarning } from '@/hooks/useCardWarning';
import CardWarningDialog from '@/components/CardWarningDialog';

function MyCardComponent({ card }) {
  const { isWarningOpen, warningData, closeWarning, showWarning } = useCardWarning({
    cardId: card.id,
    cardName: card.name,
    sevenDayGainPercent: card.sevenDayGainPercent,
    isManipulated: card.isManipulated,
    manipulationReason: card.manipulationReason,
    autoShow: false, // Manual control
  });

  return (
    <div>
      <button onClick={showWarning}>View Card Details</button>

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
    </div>
  );
}
```

## API Integration

### Updating Card Data

To populate the warning fields, you'll need to:

1. **Calculate 7-day gains** from price history:
   ```typescript
   import { calculate7DayGain } from '@/lib/cardWarnings';

   const currentPrice = 100;
   const priceSevenDaysAgo = 40;
   const gainPercent = calculate7DayGain(currentPrice, priceSevenDaysAgo);
   // Returns: 150 (150% gain)

   // Update card in database
   await db.update(cards)
     .set({ sevenDayGainPercent: gainPercent })
     .where(eq(cards.id, cardId));
   ```

2. **Flag manipulated cards**:
   ```typescript
   await db.update(cards)
     .set({
       isManipulated: true,
       manipulationReason: 'Unusual volume spike with price disconnect',
       lastFlaggedAt: new Date(),
     })
     .where(eq(cards.id, cardId));
   ```

### Example: Automated Background Job

```typescript
import { db } from '@/db';
import { cards, prices } from '@/db/schema';
import { calculate7DayGain } from '@/lib/cardWarnings';
import { eq, sql, gte } from 'drizzle-orm';

export async function updateCardWarningFlags() {
  // Get all cards with recent price data
  const cardsWithPrices = await db.query.cards.findMany({
    with: {
      prices: {
        orderBy: [desc(prices.date)],
        limit: 30, // Last 30 days
      },
    },
  });

  for (const card of cardsWithPrices) {
    if (card.prices.length < 2) continue;

    // Calculate 7-day gain
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentPrice = card.prices[0]?.market || 0;
    const oldPrice = card.prices.find(p =>
      new Date(p.date) <= sevenDaysAgo
    )?.market;

    if (oldPrice) {
      const gainPercent = calculate7DayGain(currentPrice, oldPrice);

      await db.update(cards)
        .set({ sevenDayGainPercent: gainPercent })
        .where(eq(cards.id, card.id));
    }

    // Detect manipulation (example: >200% gain in 7 days)
    if (card.sevenDayGainPercent && card.sevenDayGainPercent > 200) {
      await db.update(cards)
        .set({
          isManipulated: true,
          manipulationReason: 'Extreme price movement (>200% in 7 days)',
          lastFlaggedAt: new Date(),
        })
        .where(eq(cards.id, card.id));
    }
  }
}
```

## Utility Functions

### `shouldShowCardWarning(card)`

Determines if a warning should be shown for a card.

```typescript
import { shouldShowCardWarning } from '@/lib/cardWarnings';

const warning = shouldShowCardWarning({
  name: 'Charizard VMAX',
  sevenDayGainPercent: 150,
  isManipulated: false,
  manipulationReason: null,
});

if (warning) {
  console.log('Should show warning:', warning.shouldWarn);
  console.log('Card name:', warning.cardName);
  console.log('Gain %:', warning.gainPercent);
}
```

### `calculate7DayGain(currentPrice, priceSevenDaysAgo)`

Calculates percentage gain between two prices.

```typescript
import { calculate7DayGain } from '@/lib/cardWarnings';

const gain = calculate7DayGain(150, 100);
console.log(gain); // 50 (50% gain)
```

### `hasSeenWarning(cardId)` / `markWarningAsSeen(cardId)`

Checks and marks warnings as seen (stored in localStorage).

```typescript
import { hasSeenWarning, markWarningAsSeen } from '@/lib/cardWarnings';

if (!hasSeenWarning('card_123')) {
  // Show warning
  markWarningAsSeen('card_123');
}
```

## Components

### `CardWarningDialog`

The main warning modal component.

**Props:**
- `isOpen` (boolean) - Controls dialog visibility
- `onClose` (function) - Called when user closes dialog (after 5s)
- `cardName` (string) - Name of the card
- `gainPercent` (number) - 7-day gain percentage
- `isManipulated` (boolean) - Whether card is flagged
- `manipulationReason` (string, optional) - Reason for manipulation flag

### `CardWithWarning`

Wrapper component that automatically shows warnings.

**Props:**
- `cardId` (string) - Unique card ID
- `cardName` (string) - Card name
- `sevenDayGainPercent` (number | null) - 7-day gain %
- `isManipulated` (boolean | null) - Manipulation flag
- `manipulationReason` (string | null) - Manipulation reason
- `autoShow` (boolean, default: true) - Auto-show on mount
- `children` (ReactNode) - Card component to wrap

## Design Specifications

### Warning Trigger Conditions

A warning is shown when **ANY** of these conditions are met:
- ✅ Card has >100% 7-day gain
- ✅ Card has `isManipulated = true`

### Warning Behavior

1. **First View**: Dialog appears automatically on card view
2. **Forced Duration**: User must wait 5 seconds before closing
3. **Close Button**: Shows countdown (5, 4, 3, 2, 1) then "X"
4. **Escape Key**: Only works after 5 seconds
5. **Backdrop Click**: Only works after 5 seconds
6. **Deduplication**: Won't show again for 24 hours per card

### Visual Design

- **Colors**: Orange/Red gradient background for urgency
- **Icon**: Alert triangle (⚠️) in header
- **Typography**: Clear hierarchy with bold percentages
- **Animation**: Smooth spring animation on open/close
- **Backdrop**: Dark blur to focus attention

## Testing

### Manual Testing

```tsx
// Test Component
import CardWithWarning from '@/components/CardWithWarning';

export default function TestPage() {
  const testCard = {
    id: 'test_card_1',
    name: 'Charizard VMAX (Secret)',
    sevenDayGainPercent: 150, // >100% triggers warning
    isManipulated: false,
  };

  return (
    <CardWithWarning
      cardId={testCard.id}
      cardName={testCard.name}
      sevenDayGainPercent={testCard.sevenDayGainPercent}
      isManipulated={testCard.isManipulated}
    >
      <div className="p-4 border rounded">
        <h3>{testCard.name}</h3>
        <p>Up {testCard.sevenDayGainPercent}%</p>
      </div>
    </CardWithWarning>
  );
}
```

### Test Cases

1. ✅ Card with >100% gain shows warning
2. ✅ Card with manipulation flag shows warning
3. ✅ Card with both flags shows warning with manipulation details
4. ✅ Cannot close before 5 seconds
5. ✅ Can close after 5 seconds
6. ✅ Warning doesn't show again within 24 hours
7. ✅ Escape key works after 5 seconds
8. ✅ Backdrop click works after 5 seconds

## Files Added/Modified

### New Files
- `apps/web/src/components/CardWarningDialog.tsx` - Main warning modal
- `apps/web/src/components/CardWithWarning.tsx` - Wrapper component
- `apps/web/src/hooks/useCardWarning.ts` - Warning management hook
- `apps/web/src/lib/cardWarnings.ts` - Utility functions
- `apps/web/prisma/migrations/20251121_add_card_warning_fields/migration.sql` - Database migration

### Modified Files
- `apps/web/src/db/schema.ts` - Added warning fields to cards table
- `apps/web/src/db/queries/cards.ts` - Updated to select warning fields

## Future Enhancements

Potential improvements for future iterations:

1. **Analytics Tracking**: Log warning views and user actions
2. **A/B Testing**: Test different warning messages
3. **Customizable Thresholds**: Allow admins to adjust >100% threshold
4. **Historical Data**: Show chart of price movement in warning
5. **User Preferences**: Let users opt-out of warnings (with confirmation)
6. **API Endpoint**: `/api/cards/[id]/warning-status` for dynamic checks
7. **Admin Dashboard**: View flagged cards and manage manipulation flags

## Support

For issues or questions:
- Check this documentation first
- Review component source code for inline comments
- Test with the example code provided above

---

**Shipped:** November 21, 2025
**Author:** Apex Intelligence Team
