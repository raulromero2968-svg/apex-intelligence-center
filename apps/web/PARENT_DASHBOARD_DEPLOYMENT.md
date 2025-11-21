# Parent Dashboard Deployment Guide

## Overview
The Parent Dashboard (Full Access) feature is now complete and ready for deployment.

## Features Implemented
✅ Parent-child account relationships
✅ Account freeze/unfreeze (parent only, child cannot unfreeze)
✅ Real-time portfolio value monitoring
✅ Watchlist display
✅ Active alerts display
✅ Session history tracking
✅ Parental controls (bedtime mode, cooldown, spending limits)
✅ Server-side rendering with OAuth family linking

## Database Migration

### Step 1: Run the migration
```bash
cd apps/web
pnpm db:migrate
```

This will apply migration `0026_parent_dashboard.sql` which adds:
- `parent_id` column to users table
- `account_type` enum ('parent', 'child', 'independent')
- `account_frozen`, `account_frozen_at`, `account_frozen_by` columns
- `bedtime_enabled`, `bedtime_start`, `bedtime_end` columns
- `cooldown_enabled` column
- `spending_limit_cents` column (always $0 for child accounts)
- New `session_history` table for tracking child activity
- Indexes for efficient queries

### Step 2: Verify schema
```bash
pnpm db:studio
```

Check that all new columns and tables are created successfully.

## API Routes

### Family Linking
- `POST /api/family/link` - Link child account to parent
- `GET /api/family/link` - Get all linked children
- `DELETE /api/family/link` - Unlink child from parent

### Account Freeze
- `POST /api/family/freeze` - Freeze or unfreeze child account
- `GET /api/family/freeze?childId=xxx` - Get freeze status

### Parental Controls
- `POST /api/family/controls` - Update parental controls
- `GET /api/family/controls?childId=xxx` - Get current settings

## Frontend Routes

### Parent Dashboard
- `/parent/[childId]` - Full parent dashboard with real-time monitoring

Components:
- `PortfolioValueCard` - Real-time portfolio value (auto-refresh every 30s)
- `WatchlistCard` - Child's watchlist items
- `AlertsCard` - Active alerts and notifications
- `SessionHistoryCard` - Session activity history
- `ParentalControlsCard` - Toggle controls (bedtime, cooldown, spending)
- `FreezeAccountButton` - One-click freeze/unfreeze with confirmation modal

## Testing Checklist

### 1. Database
- [ ] Migration runs successfully
- [ ] All new columns exist in users table
- [ ] session_history table created
- [ ] Indexes created properly

### 2. API Endpoints
- [ ] `/api/family/link` creates parent-child relationship
- [ ] `/api/family/freeze` freezes account instantly
- [ ] `/api/family/controls` updates all control settings
- [ ] Rate limiting works (max requests per minute)
- [ ] Authentication checks pass

### 3. Parent Dashboard
- [ ] Dashboard loads for authenticated parent
- [ ] Real-time portfolio value updates
- [ ] Watchlist displays correctly
- [ ] Alerts show with proper severity
- [ ] Session history shows recent activity
- [ ] Parental controls can be toggled
- [ ] Freeze button works with confirmation
- [ ] Child cannot unfreeze their own account

### 4. Security
- [ ] Only parents can access /parent/[childId]
- [ ] Children cannot view other children's data
- [ ] Freeze status prevents child login
- [ ] Session revocation works immediately
- [ ] OAuth family linking is secure

## Environment Variables

Ensure these are set in your `.env`:
```bash
# Database
POSTGRES_URL=postgresql://...
DATABASE_URL=postgresql://...

# JWT (for authentication)
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Redis (for session management)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Success Criteria

✅ Parent can instantly freeze child account
✅ Child cannot unfreeze themselves
✅ Real-time portfolio updates every 30 seconds
✅ Bedtime mode blocks access during specified hours
✅ Cooldown enforces 60-second delay on buy buttons
✅ Spending limit always $0 for child accounts
✅ Session history tracks all child activity

## Deployment to Vercel

```bash
# 1. Commit changes
git add .
git commit -m "feat: Parent Dashboard (Full Access) - Phase 4"

# 2. Push to branch
git push -u origin claude/parent-dashboard-full-019f54XqpSAtaSJqovKZreun

# 3. Vercel will auto-deploy
# 4. Run migration on production database via Vercel CLI or dashboard
```

## Support

If you encounter issues:
1. Check database migration logs
2. Verify environment variables
3. Test API endpoints with curl or Postman
4. Check browser console for frontend errors
5. Review server logs for authentication issues

## Future Enhancements

- Real-time notifications via WebSocket or Server-Sent Events
- Export session history as CSV
- Bulk actions (freeze multiple children)
- Scheduled bedtime mode (automated)
- Email notifications for parent alerts
