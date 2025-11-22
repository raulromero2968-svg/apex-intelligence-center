# Manipulation Shield Banner System - Testing Guide

**Ship Date:** November 21, 2025
**Status:** ✅ Shipped

## Overview

The Manipulation Shield Banner System detects coordinated pump patterns using LAMP + Contrarian analysis and displays a non-dismissible red warning banner on card pages.

## Features Implemented

### 1. Detection Logic (LAMP + Contrarian Score > 75)

**Scoring System:**
- **LAMP Score (0-100):** Based on sentiment analysis
  - Bullish: 70 (high risk during pump)
  - Neutral: 30 (medium risk)
  - Bearish: 0 (low risk)

- **Contrarian Score (0-100):** Based on diversity
  - Low diversity (< 0.3): High score (70-100) = coordination suspected
  - High diversity (> 0.6): Low score (0-40) = organic activity

- **Combined Score:** LAMP + Contrarian (0-200)
- **Threshold:** Alert triggered when combined score > 75

**Example:**
- Bullish sentiment (70) + Low diversity 0.15 (85) = **155 (ALERT!)**
- Neutral sentiment (30) + High diversity 0.7 (30) = **60 (No alert)**

### 2. Red Banner (Non-dismissible)

✅ Displays on card detail page
✅ Cannot be dismissed
✅ Shows manipulation metrics:
  - Volume spike percentage
  - Baseline volume
  - Current volume (24h)
  - LAMP sentiment
  - Contrarian diversity score
  - Historical success rate: **6%**

### 3. Push Notification

✅ Browser notification: "Manipulation detected – historical success rate 6%"
✅ Custom event dispatched for in-app notifications
✅ Notification permission handling

### 4. Auto-pause Alerts

✅ All price alerts for the flagged card are automatically paused
✅ Watchlist items marked as triggered
✅ Prevents false alerts during manipulation

### 5. Database Logging

✅ Alerts saved to `manipulation_alerts` table
✅ Card flagged with `is_manipulated = true`
✅ Manipulation reason stored
✅ Timestamp tracking

## Testing

### Method 1: Test API Endpoint (Recommended)

Use the test endpoint to create a mock manipulation alert:

```bash
# 1. Get a card ID from your database
# Example: clxxx... (any valid card ID)

# 2. Trigger test alert
curl -X POST http://localhost:3000/api/manipulation/test \
  -H "Content-Type: application/json" \
  -d '{"cardId": "YOUR_CARD_ID_HERE"}'

# 3. Visit the card page
# Open: http://localhost:3000/card/YOUR_CARD_ID_HERE
```

**Expected Behavior:**
1. ✅ Red banner appears on card page
2. ✅ Banner shows "Manipulation Shield: Coordinated Pump Detected"
3. ✅ Banner displays metrics (volume spike, LAMP sentiment, Contrarian diversity)
4. ✅ Banner shows "historical success rate: 6%"
5. ✅ Banner says "Price alerts automatically paused for this card"
6. ✅ Banner cannot be dismissed (no close button)
7. ✅ Push notification sent (if browser permissions granted)

### Method 2: Scan API (Production-like)

Trigger a full scan across all cards:

```bash
# Set CRON_SECRET in your .env file
# CRON_SECRET=your-secret-here

curl -X POST http://localhost:3000/api/manipulation/scan \
  -H "Authorization: Bearer your-secret-here"
```

### Method 3: Manual Database Insert

```sql
-- Insert a test manipulation alert
INSERT INTO manipulation_alerts (
  id,
  card_id,
  volume_spike_pct,
  baseline_volume,
  current_volume,
  lamp_sentiment,
  contrarian_diversity,
  severity,
  is_active,
  detected_at,
  created_at
) VALUES (
  'test_alert_001',
  'YOUR_CARD_ID',
  85.5,
  12.3,
  142,
  'bullish',
  0.15,
  'critical',
  true,
  NOW(),
  NOW()
);

-- Flag the card
UPDATE cards
SET
  is_manipulated = true,
  manipulation_reason = 'LAMP+Contrarian score 155 (threshold: 75)',
  last_flagged_at = NOW()
WHERE id = 'YOUR_CARD_ID';
```

## Banner Persistence Test

**Requirement:** Banner survives page refresh

1. Create test alert (using Method 1)
2. Verify banner appears
3. **Refresh the page** (F5 or Cmd+R)
4. ✅ Banner should still be displayed
5. Open card page in new tab
6. ✅ Banner should appear in new tab

**Why it persists:**
- Alert stored in database (`manipulation_alerts` table)
- Card page fetches alert on every load
- No localStorage or session storage used (database is source of truth)

## Files Modified/Created

### Core Logic
- `apps/web/src/services/manipulation-detector.ts` - Detection engine with scoring system
- `apps/web/src/components/ManipulationWarningBanner.tsx` - Non-dismissible red banner (already existed)

### API Endpoints
- `apps/web/src/app/api/manipulation/[cardId]/route.ts` - Fetch alert for card (already existed)
- `apps/web/src/app/api/manipulation/scan/route.ts` - Scan all cards (updated)
- `apps/web/src/app/api/manipulation/test/route.ts` - Test endpoint (NEW)

### UI
- `apps/web/src/app/card/[id]/page.tsx` - Card detail page with banner display (updated)

### Database
- `manipulation_alerts` table (already exists from migration)

## Success Criteria

- [x] Banner shows when LAMP + Contrarian score > 75
- [x] Banner is non-dismissible (no close button)
- [x] Push notification shows "Manipulation detected – historical success rate 6%"
- [x] All alerts auto-paused for flagged card
- [x] Alert logged to manipulation_alerts table
- [x] Tested with mock pump data (via test API)
- [x] Banner survives page refresh (database-backed)

## Production Deployment

1. Ensure database migration has run (manipulation_alerts table exists)
2. Set CRON_SECRET environment variable for scan endpoint
3. Set up cron job to call `/api/manipulation/scan` periodically (e.g., every 15 minutes)
4. Monitor logs for manipulation detections

## Example Cron Job (Vercel)

```json
{
  "crons": [
    {
      "path": "/api/manipulation/scan",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Monitoring

Check logs for:
- `[ManipulationDetector] 🚨 MANIPULATION DETECTED` - Alert triggered
- `[ManipulationDetector] 🛡️ Activating Manipulation Shield` - Shield activated
- `[ManipulationDetector] ✅ Shield activated` - Complete

## Notes

- Test endpoint only works in development mode
- Scan endpoint requires authentication (CRON_SECRET)
- Push notifications require browser permission
- Banner persists until alert is resolved (is_active = false)
