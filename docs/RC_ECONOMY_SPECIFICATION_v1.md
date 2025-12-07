# RC Economy Specification v1

> **Version:** 1.0
> **Last Updated:** 2024-12-07
> **Status:** Production Ready
> **Owners:** Founder (Spec), Grok (Backend), Gemini (Frontend)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Core Concepts](#2-core-concepts)
3. [Earn Events](#3-earn-events)
4. [Spend & Use Cases](#4-spend--use-cases)
5. [Data Model](#5-data-model)
6. [Anti-Abuse & Safeguards](#6-anti-abuse--safeguards)
7. [Contributor Levels](#7-contributor-levels)
8. [Transparency & Explainability](#8-transparency--explainability)
9. [Implementation Reference](#9-implementation-reference)

---

## 1. Purpose

The **Reputation Credits (RC)** system exists to:

- **Measure long-term contribution and trust**, not wealth
- **Unlock roles, visibility, and governance** based on earned merit
- **Create a time-based moat** (you cannot buy your way to old reputation)
- **Align with antifragility & ethical safeguards** (no casino vibes, no opaque scoring)

### RC Is NOT

| What RC Is NOT | Why |
|----------------|-----|
| A tradable token | No secondary markets, no P2P trading |
| A speculative instrument | No price discovery, no "mooning" |
| A hidden score | Users always see exactly how RC works |
| Directly convertible to cash | RC unlocks features, not withdrawals |

### Core Principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **RC Cannot Be Bought or Traded** | RC transactions are unidirectional. No transfer function exists. No external exchange is possible. |
| 2 | **RC Is Earned by Provable Contribution** | All RC transactions are logged in `rc_transactions` table with `reference_type` and `reference_id` for auditability. |
| 3 | **RC Grants Influence and Access, Not Cash** | RC thresholds gate feature access. No cash-out mechanism exists. |
| 4 | **RC Is Rate-Limited** | Daily cap of 50 RC from passive events (upvotes, saves). Publishing caps apply independently. |

---

## 2. Core Concepts

### 2.1 RC Balance

- Integer value associated with a user
- Stored in `commons_user_profiles.reputation_credits`
- Never goes below 0 (enforced at transaction level)

### 2.2 RC Events

Discrete actions that earn or lock/unlock RC. Each event:
- Has a unique `event_code`
- Awards a fixed or variable `rc_amount`
- May have caps (per item, per day, per month, lifetime)
- Creates an auditable `rc_transactions` record

### 2.3 RC Thresholds

Levels that gate roles, features, or perks:

| Threshold | Unlocks |
|-----------|---------|
| 100 RC | Creator badge |
| 300 RC | Curator role |
| 500 RC | Creator+ Dashboard |
| 1000 RC | Moderator eligibility, 5% fee discount |
| 2500 RC | Governor tier |
| 5000 RC | 10% fee discount |
| 10000 RC | 15% fee discount |

### 2.4 RC Caps & Limits

| Cap Type | Value | Purpose |
|----------|-------|---------|
| Daily passive cap | 50 RC | Prevents overnight farming |
| Daily total cap | 100 RC | Absolute daily ceiling |
| Per-item caps | Varies | Prevents single-item exploitation |
| Cooldown periods | Varies | Prevents rapid-fire gaming |

---

## 3. Earn Events

### 3.1 Event Types (v1)

#### Intelligence Marketplace Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `PUBLISH_INTEL_APPROVED` | Intel card published and passes review | +5 | Once per card |
| `INTEL_FIRST_PUBLISH` | First intel card ever published | +100 | Lifetime |
| `INTEL_UPVOTED` | Unique user upvotes intel card | +1 | Max +50 per card |
| `INTEL_BOOKMARKED` | Unique user bookmarks intel card | +2 | Max +40 per card |
| `INTEL_PURCHASED` | Someone purchases intel card | +10 | Max +100/day |
| `INTEL_5STAR_RATING` | Receive 5-star rating from verified purchaser | +15 | - |

#### Commons Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `COMMONS_PUBLISH_APPROVED` | Free resource published and approved | +10 | Max +50/day |
| `COMMONS_UPVOTED` | Unique upvote on Commons content | +1 | Max +30 per item |
| `COMMONS_DOWNLOADED` | Per 100 downloads milestone | +1 | Max +50 per item |

#### Comment & Curation Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `HELPFUL_COMMENT` | Comment marked helpful by author | +1 | Max +30/day |
| `HELPFUL_COMMENT_UPVOTES` | Comment reaches 3+ upvotes | +2 | Max +30/day |
| `EXCEPTIONAL_COMMENT` | Mod-flagged as exceptional | +3 | - |
| `EARLY_CURATOR_REWARD` | Upvoted early, content later hit 50+ upvotes | +0.5 | Max +20 per card |

#### Governance Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `GOVERNANCE_PARTICIPATION` | Vote on proposal that meets quorum | +1 | Configurable |
| `GOVERNANCE_WORKING_GROUP` | Part of implementing working group | +2-3 | - |
| `PROPOSAL_VOTE_SUCCESS` | Voted with majority on passed proposal | +25 | - |

#### Moderation Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `VALID_REPORT_SPAM` | User flags content; mod marks valid | +2 | Max +10/month |

#### Omnis Events

| Event Code | Trigger | RC Award | Caps |
|------------|---------|----------|------|
| `OMNIS_CONNECT_FIRST` | First data source connected | +50 | Lifetime |
| `OMNIS_BATCH_PROCESS` | Process 10+ items in single batch | +25 | Max +100/day |

### 3.2 Daily RC Earn Caps

```
MAX_DAILY_RC_PASSIVE = 50   # Upvotes, saves, comments
MAX_DAILY_RC_TOTAL = 100    # Including publishing, governance
```

**Rationale:** Prevents overnight whales and farming. Consistent contribution beats burst activity.

---

## 4. Spend & Use Cases

RC is primarily a **key**, not a currency you spend down constantly.

### 4.1 Threshold-Based Unlocks

| Feature | RC Threshold | Effect |
|---------|--------------|--------|
| **Creator+ Dashboard** | >= 500 RC | Advanced analytics, buyer cohorts, revenue insights |
| **Curator Role** | >= 300 RC | Create lists, tag collections, higher vote weight |
| **Moderator Eligibility** | >= 1000 RC | Apply/nominate to mod pool, access flag queues |
| **Governor Tier** | >= 2500 RC | Submit top-level proposals, weighted protocol votes |

### 4.2 Staked / Temporary Uses

#### Boost an Intel Card

| Parameter | Value |
|-----------|-------|
| Cost | Stake 20 RC |
| Duration | 7 days |
| Effect | Slight ranking boost, labeled "Boosted by RC" |
| Return | 20 RC returned minus 2 RC friction fee |

#### Submit Governance Proposal

| Parameter | Value |
|-----------|-------|
| Cost | Stake 100 RC |
| Success | Proposal meets quorum & passes -> 100 RC returned |
| Failure | Proposal fails or marked spammy -> 50-100 RC slashed |

### 4.3 Fee Discounts (Threshold-Based)

| Threshold | Discount | Effective Fee |
|-----------|----------|---------------|
| >= 1000 RC | 5% | 15% -> 14.25% |
| >= 5000 RC | 10% | 15% -> 13.5% |
| >= 10000 RC | 15% | 15% -> 12.75% |

---

## 5. Data Model

### 5.1 Core Tables

#### `commons_user_profiles`

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
reputation_credits  INTEGER DEFAULT 0
contributor_level   ENUM('bronze', 'silver', 'gold', 'platinum')
-- Additional fields for profile, preferences
```

#### `commons_rc_transactions`

```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES commons_user_profiles(id)
amount           INTEGER NOT NULL  -- Positive or negative
balance          INTEGER NOT NULL  -- Balance after transaction
reason           TEXT NOT NULL
reason_code      TEXT NOT NULL     -- e.g., 'intel_upvoted'
reference_type   TEXT              -- 'intel', 'comment', 'governance'
reference_id     UUID
metadata         JSONB
created_at       TIMESTAMPTZ
```

### 5.2 Computed Values

- **Contributor Level**: Derived from `rc_balance` and thresholds at read time
- **RC Tier**: Computed, not stored separately (unless cached for performance)

### 5.3 Indexes

- `user_id` + `created_at` for transaction history
- `reason_code` for event analytics
- `reference_type` + `reference_id` for linking to source objects

---

## 6. Anti-Abuse & Safeguards

### 6.1 Sybil Resistance (v1 Lightweight)

| Mechanism | Description |
|-----------|-------------|
| **Email Verification** | Required for account creation |
| **Device Fingerprinting** | Track unique devices per account |
| **Phone Verification** | Required for RC > 1000 or moderator roles |
| **Account Age Minimum** | Min 7 days before RC-heavy features unlock |
| **Warming Period** | New accounts (< 7 days) have RC earnings reduced by 50% |
| **Vote Weight** | Votes from accounts < 30 days old count at 25% weight |

### 6.2 RC Review & Reversals

| Power | Description |
|-------|-------------|
| **Flag Suspicious** | Accounts flagged as suspicious have RC earnings paused |
| **Freeze New Gains** | Mods can halt new RC while investigating |
| **Reverse RC Events** | System can reverse RC for confirmed fraudulent activity |
| **Temporary Bans** | Repeat offenders can receive earning bans |

### 6.3 Voting Ring Detection

**Signals Monitored:**
- Same IP/device clusters voting on same content
- Accounts created in batches voting together
- Unusual timing patterns (bot-like intervals)
- Graph analysis of voting patterns

**Response:** Flagged for manual review. RC withheld pending investigation.

### 6.4 Moderation Override Powers

- Flag accounts as 'suspicious' (RC earnings paused pending review)
- Revoke RC gains from confirmed abuse (logged as negative in `rc_transactions`)
- Temporary or permanent RC earning bans for repeat offenders
- All moderation actions logged and reviewable by Governor tier

---

## 7. Contributor Levels

| Level | RC Threshold | Privileges |
|-------|--------------|------------|
| **Newcomer** | 0 | Basic publishing, standard marketplace, comment & vote |
| **Creator** | 100 | Verified creator badge, basic analytics |
| **Curator** | 300 | Create curated lists, featured nominations, higher vote weight |
| **Creator+** | 500 | Advanced analytics dashboard, revenue insights, A/B testing |
| **Moderator** | 1000 | Moderation tools, report queue, Light KYC required |
| **Governor** | 2500 | High-impact proposals, weighted governance votes, view mod logs |

---

## 8. Transparency & Explainability

### 8.1 Public Documentation

- All earn events documented with RC amounts and caps
- All spend/threshold uses documented
- All anti-abuse mechanisms explained
- Change log for rule updates

### 8.2 User Dashboard Features

| Feature | Description |
|---------|-------------|
| Current RC Balance | Prominent display |
| Lifetime RC Earned | Total accumulated |
| Transaction History | Filterable log of all RC changes |
| Progress to Next Level | Visual indicator |
| Monthly RC Summary | Breakdown by source |

### 8.3 Per-Transaction Transparency

Every RC change includes:
- **Visible log entry:** "+5 RC for publishing X"
- **Hover tooltip:** "You earned this because..."
- **Linkable reference:** Click to see the intel/comment/vote

### 8.4 System Health Metrics (v1.1)

Public economy indicators:
- Total RC in circulation
- Distribution by level
- Average RC per active user
- RC velocity (earning rate)

---

## 9. Implementation Reference

### 9.1 File Locations

| Component | Path |
|-----------|------|
| Content Spec | `/apps/web/src/content/rc-economy/index.ts` |
| Transaction Service | `/apps/web/src/lib/payments/rc-economy.ts` |
| Database Schema | `/packages/db/src/schema/apexCommons.ts` |
| API Router | `/apps/web/src/server/api/routers/apexCommons.ts` |

### 9.2 Key Functions

```typescript
// Earn RC with limit checks
earnRC(userId, reasonCode, referenceType?, referenceId?, customAmount?): Promise<RcTransactionResult>

// Spend RC for features
spendRC(userId, amount, reasonCode, referenceType?, referenceId?): Promise<RcTransactionResult>

// Check daily limits and cooldowns
checkEarningEligibility(userId, action, limits?): Promise<RcEarningCheck>

// Get user's current state
getUserRCBalance(userId): Promise<{ balance, level, dailyEarned, dailyRemaining }>

// Admin adjustments with audit trail
adjustRC(userId, amount, reason, adminId): Promise<RcTransactionResult>
```

### 9.3 Redis Keys for Rate Limiting

```
rc:limit:{userId}          # Rate limit tracking
rc:daily:{userId}:{date}   # Daily earnings counter
rc:cooldown:{userId}:{action}  # Per-action cooldown
```

### 9.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rc/balance` | GET | User's RC balance and stats |
| `/api/rc/history` | GET | Transaction history (paginated) |
| `/api/intel/:id/rc` | GET | RC summary for specific intel |
| `/api/rc/economy` | GET | Global economy stats (admin) |

---

## Appendix A: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-07 | Initial specification |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **RC** | Reputation Credits - non-tradeable contribution tokens |
| **Threshold** | Minimum RC required to unlock a feature |
| **Stake** | Temporary lock of RC for an action (may be returned) |
| **Spend** | Permanent consumption of RC |
| **Sybil** | Fake accounts created to game the system |
| **Warming Period** | Time before new accounts earn full RC |

---

*This specification is the canonical reference for RC Economy v1. All implementation should align with this document.*
