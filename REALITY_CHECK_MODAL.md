# Reality Check Modal Implementation

## Overview

A mandatory, unskippable modal that appears every 2 hours of active session time to encourage users to take breaks. The modal cannot be disabled and displays session information and daily spending.

## Features

- **Automatic Triggering**: Appears every 2 hours of active session time
- **Unskippable**: 10-second countdown before the modal can be dismissed
- **Session Tracking**: Uses Page Visibility API to only count active time
- **Persistent**: Survives page refreshes via localStorage
- **Spending Display**: Shows total daily spend
- **Redis Force Trigger**: Admins can force-trigger for all users via API

## Architecture

### Components

1. **sessionActivityTracker.ts** (`apps/web/src/lib/sessionActivityTracker.ts`)
   - Tracks active session time using Page Visibility API
   - Heartbeat mechanism (1s intervals)
   - Persists data to localStorage
   - Triggers callback at 2-hour intervals

2. **RealityCheckModal.tsx** (`apps/web/src/components/ui/RealityCheckModal.tsx`)
   - Unskippable modal with 10s countdown
   - Displays session time and daily spend
   - Cannot be closed via Escape or backdrop click until countdown completes
   - Styled with gradient backgrounds and animations

3. **RealityCheckProvider.tsx** (`apps/web/src/components/ui/RealityCheckProvider.tsx`)
   - Integrates session tracker with modal
   - Polls for Redis force triggers every 30s
   - Updates spending data from spendTracker

4. **spendTracker.ts** (`apps/web/src/lib/spendTracker.ts`)
   - Tracks daily spending in localStorage
   - Provides API for adding transactions
   - Resets daily at midnight

### API Routes

1. **GET /api/reality-check/status**
   - Checks if reality check should be triggered
   - Returns trigger status and ID

2. **POST /api/reality-check/acknowledge**
   - Acknowledges user has seen the modal
   - Prevents duplicate triggers for same event

3. **POST /api/reality-check/trigger**
   - Admin endpoint to force trigger for all users
   - Sets global flag in Redis with 1-hour TTL

4. **DELETE /api/reality-check/trigger**
   - Clears active trigger

## Usage

### Normal Operation

The modal automatically appears after 2 hours of active session time. Users must wait 10 seconds before they can continue.

### Testing

Open browser console and run:

```javascript
// Force trigger the modal immediately
const tracker = window.__APEX_SESSION_TRACKER__;
if (tracker) {
  tracker.resetSession();
  // Set to 2 hours - 1 second
  tracker.sessionData.totalActiveTime = (2 * 60 * 60 * 1000) - 1000;
  tracker.saveSessionData();
}
```

Or use the force trigger API:

```bash
# Force trigger for all users
curl -X POST http://localhost:3000/api/reality-check/trigger

# Clear trigger
curl -X DELETE http://localhost:3000/api/reality-check/trigger
```

### Simulating Spend

```javascript
// Add mock spending data
const { addTransaction } = require('@/lib/spendTracker');
addTransaction(49.99, 'Premium subscription');
addTransaction(15.00, 'Research credits');
```

## Configuration

### Adjusting Trigger Interval

Edit `REALITY_CHECK_INTERVAL` in `sessionActivityTracker.ts`:

```typescript
const REALITY_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
```

### Adjusting Countdown Duration

Edit `COUNTDOWN_SECONDS` in `RealityCheckModal.tsx`:

```typescript
const COUNTDOWN_SECONDS = 10;
```

## Integration

The Reality Check system is integrated into the main app layout at `apps/web/src/app/layout.tsx`:

```tsx
import RealityCheckProvider from '@/components/ui/RealityCheckProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* ... other components ... */}
        <RealityCheckProvider />
      </body>
    </html>
  );
}
```

## Data Storage

### localStorage Keys

- `apex_session_activity`: Session tracking data
  ```json
  {
    "startTime": 1700000000000,
    "totalActiveTime": 7200000,
    "lastHeartbeat": 1700007200000,
    "lastRealityCheck": 7200000
  }
  ```

- `apex_daily_spend`: Daily spending data
  ```json
  {
    "date": "2025-11-21",
    "totalSpend": 94.98,
    "transactions": [
      {
        "amount": 49.99,
        "description": "Premium subscription",
        "timestamp": 1700000000000
      }
    ]
  }
  ```

### Redis Keys

- `reality-check:global-trigger`: Global trigger ID (1 hour TTL)
- `reality-check:ack:{userId}`: User acknowledgment (24 hour TTL)

## Production Considerations

1. **Spend Tracking**: Replace localStorage implementation with actual database queries for user transactions

2. **User Identification**: Implement proper user authentication to track acknowledgments per user

3. **Redis Pub/Sub**: Consider using WebSocket for real-time trigger delivery instead of polling

4. **Analytics**: Track modal completion rates, skip attempts, and session duration statistics

5. **Accessibility**: Ensure screen readers properly announce the countdown and modal content

6. **Mobile**: Test on mobile devices for proper rendering and touch interactions

## Success Criteria

✅ Cannot be disabled or skipped
✅ Shows session time in hours/minutes
✅ Shows daily spending amount
✅ 10-second unskippable countdown
✅ Triggers every 2 hours of active time
✅ Survives page refreshes
✅ Can be force-triggered via Redis/API
✅ Tracks only active time (pauses when tab hidden)

## Files Created

```
apps/web/src/
├── lib/
│   ├── sessionActivityTracker.ts    # Session time tracking
│   └── spendTracker.ts              # Daily spend tracking
├── components/ui/
│   ├── RealityCheckModal.tsx        # Modal component
│   └── RealityCheckProvider.tsx     # Integration provider
└── app/api/reality-check/
    ├── status/route.ts              # Check trigger status
    ├── acknowledge/route.ts         # Acknowledge modal
    └── trigger/route.ts             # Force trigger
```

## License

Part of APEX Intelligence Center - Production Equilibrium Build
