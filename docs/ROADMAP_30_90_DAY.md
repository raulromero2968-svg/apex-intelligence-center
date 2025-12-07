# 30/90-Day Roadmap: Team Assignments

> **Purpose:** Clear ownership and deliverables for Founder, Grok (Backend), and Gemini (Frontend)
> **Scope:** RC Economy v1 + AI Disruption Launch
> **Created:** 2024-12-07

---

## Team Roles

| Role | Primary Responsibilities |
|------|-------------------------|
| **Founder/Orchestrator** | Strategy, content, user research, community |
| **Grok (Backend)** | Database, API, RC logic, infrastructure |
| **Gemini (Frontend)** | UI components, user experience, visualizations |

---

## Days 1-30: Foundation

### Founder/Orchestrator

#### Strategy & Content

| Task | Deliverable | Priority |
|------|-------------|----------|
| Finalize RC Spec v1 | Approved spec document | P0 |
| AI Disruption Playbook outline | Table of contents + 2 persona sections | P0 |
| User interviews (10-15) | Interview notes + key insights | P1 |
| Landing page copy refinement | Updated copy using user language | P1 |

#### Publishing

| Task | Deliverable | Cadence |
|------|-------------|---------|
| 99% Jobs essay | Published + waitlist CTA | Week 1 |
| Persona-focused threads | 1 thread/week minimum | Weekly |
| Commons positioning | Draft messaging doc | Week 3 |

#### Research Outputs

- User interview summary with direct quotes
- Top 3 objections/concerns identified
- Waitlist segmentation by persona

---

### Grok (Backend)

#### RC Core Implementation

| Task | Description | Priority |
|------|-------------|----------|
| `rc_events` logic | Event processing with caps and validation | P0 |
| `rc_balance` updates | Atomic balance updates with transaction records | P0 |
| Daily caps enforcement | Redis-based daily limit tracking | P0 |
| Cooldown system | Per-action cooldown with TTL | P1 |

#### RC Earn Flows (v1)

| Flow | Status | Notes |
|------|--------|-------|
| Publish intel | Implement | +5 RC on approval |
| Intel upvoted | Implement | +1 RC, max 50/card |
| Intel bookmarked | Implement | +2 RC, max 40/card |
| Commons publish | Implement | +10 RC on approval |
| First publish bonus | Implement | +100 RC lifetime |

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/rc/me` | GET | User's RC balance + daily stats |
| `GET /api/rc/history` | GET | Paginated transaction history |
| `GET /api/intel/:id/rc` | GET | RC contribution summary for intel |
| `POST /api/rc/earn` | POST | Internal: trigger RC earn event |

#### Database

- Verify `commons_rc_transactions` indexes are optimal
- Add `rc_earned_to_date` denormalized field to intel_cards (optional)
- Implement transaction rollback for failed operations

---

### Gemini (Frontend)

#### RC Visibility

| Component | Description | Priority |
|-----------|-------------|----------|
| RC indicator (profile) | Show balance + level on user profile | P0 |
| RC summary (per-intel) | Show "Earned X RC" on intel cards | P1 |
| RC log view | Transaction history with filtering | P1 |
| Level progress bar | Visual progress to next tier | P2 |

#### Onboarding

| Component | Description | Priority |
|-----------|-------------|----------|
| "How Apex Works" visual | 3-step explainer for landing/onboarding | P0 |
| RC intro modal | First-time user RC explanation | P1 |
| Waitlist flow | Email capture with persona segmentation | P0 |

#### Design System

- RC badge component (shows balance)
- Contributor level badge (bronze/silver/gold/platinum)
- Transaction row component (for history)
- Tooltip component (for "Why you earned this")

---

## Days 31-60: Expansion

### Founder/Orchestrator

#### Content & Community

| Task | Deliverable | Priority |
|------|-------------|----------|
| Ship AI Disruption Playbook PDF | Designed, downloadable lead magnet | P0 |
| Curate first 10-20 beta creators | Vetted list from interviews + social | P0 |
| Weekly office hours | "Assetization" sessions with creators | P1 |
| Commons content seeding | 5-10 high-quality free resources | P1 |

#### Messaging Refinement

- Update landing page based on interview feedback
- Create persona-specific landing variants (if warranted)
- Document creator success stories (even small ones)

---

### Grok (Backend)

#### RC Events Expansion

| Flow | Description | Priority |
|------|-------------|----------|
| Helpful comments | +1 to +3 RC for marked helpful comments | P1 |
| Governance vote | +1 RC per meaningful vote | P1 |
| Valid report | +2 RC for upheld abuse reports | P2 |
| Early curator bonus | +0.5 RC for early upvotes on successful content | P2 |

#### Threshold Enforcement

| Feature | Threshold | Implementation |
|---------|-----------|----------------|
| Creator+ dashboard | 500 RC | Feature flag check |
| Curator tools | 300 RC | Role assignment |
| Moderator eligibility | 1000 RC | Application unlock |

#### Infrastructure

- Rate limiting hardening (Redis failover)
- RC audit log API for admin
- Batch RC processing for high-volume events

---

### Gemini (Frontend)

#### RC Explanations

| Component | Description | Priority |
|-----------|-------------|----------|
| "How RC Works" page | Full explanation with examples | P0 |
| Tooltips on transactions | "You earned this because..." | P1 |
| Level unlock notifications | Toast when reaching new level | P1 |

#### Intel Enhancement

| Component | Description | Priority |
|-----------|-------------|----------|
| Boost with RC UI | Stake 20 RC for visibility boost | P1 |
| "Boosted by RC" badge | Visual indicator on boosted content | P1 |
| Free vs Premium badges | Clear Commons/Marketplace distinction | P0 |

#### Creator Dashboard

- RC earnings chart (7/30/90 day views)
- Top-performing intel by RC earned
- Level progression visualization

---

## Days 61-90: Polish & Governance Prep

### Founder/Orchestrator

#### Creator Success

| Task | Deliverable | Priority |
|------|-------------|----------|
| First paid intel sales | At least 5 creators with sales | P0 |
| Creator case studies | 2-3 documented success stories | P1 |
| Community guidelines | Published moderation standards | P1 |

#### Governance Foundation

- Draft governance proposal format
- Identify potential Governor-tier candidates
- Document decision-making process for community

#### Content Expansion

- Additional playbook sections (based on feedback)
- Creator onboarding documentation
- Video walkthrough of RC system

---

### Grok (Backend)

#### Governance Infrastructure

| Feature | Description | Priority |
|---------|-------------|----------|
| Proposal creation | Stake 100 RC to create | P1 |
| Voting system | Weight by RC, quorum requirements | P1 |
| Proposal resolution | Automatic pass/fail + RC return/slash | P2 |

#### Advanced RC Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Fee discounts | Apply 5/10/15% based on RC thresholds | P1 |
| RC decay prep | Design for v1.1 12-month rolling window | P2 |
| Economy stats API | Public health metrics | P2 |

#### Security & Abuse

- Voting ring detection (graph analysis)
- Sybil account flagging
- Admin RC adjustment audit trail

---

### Gemini (Frontend)

#### Governance UI

| Component | Description | Priority |
|-----------|-------------|----------|
| Proposals list | Browse active/past proposals | P1 |
| Proposal detail | View, discuss, vote | P1 |
| Vote confirmation | Stake display, weight explanation | P1 |

#### Trust & Safety

| Component | Description | Priority |
|-----------|-------------|----------|
| User rights page | Bill of Rights content | P0 |
| Appeal submission | Form for moderation appeals | P1 |
| RC security alerts | Notification for unusual activity | P2 |

#### Analytics & Transparency

- Public economy dashboard (circulation, distribution)
- Ranking explanation tooltips
- RC changelog viewer

---

## Success Metrics by Day 90

### Founder

| Metric | Target |
|--------|--------|
| Waitlist signups | 1,000+ |
| User interviews completed | 15+ |
| Beta creators onboarded | 20+ |
| Playbook downloads | 500+ |

### Grok (Backend)

| Metric | Target |
|--------|--------|
| RC earn events implemented | 8+ types |
| API uptime | 99.5%+ |
| Avg RC transaction latency | < 200ms |
| Zero critical RC bugs | 0 |

### Gemini (Frontend)

| Metric | Target |
|--------|--------|
| RC visibility components | 10+ |
| "How RC Works" page | Live |
| Creator dashboard | MVP complete |
| User comprehension (survey) | 80%+ understand RC basics |

---

## Dependencies & Blockers

### Cross-Team Dependencies

| From | To | Dependency |
|------|-----|------------|
| Grok | Gemini | RC API endpoints before UI |
| Founder | Grok | Finalized RC spec before implementation |
| Founder | Gemini | Copy and content for UI |
| Gemini | Founder | UI mockups for user testing |

### Known Risks

| Risk | Mitigation |
|------|------------|
| RC gaming attempts | Built-in caps + monitoring |
| Low beta creator engagement | Direct outreach + office hours |
| Governance complexity | Defer full governance to post-90 |
| Scope creep | Strict v1 feature freeze |

---

## Communication Cadence

| Meeting | Frequency | Attendees |
|---------|-----------|-----------|
| Daily standup | Daily | All |
| RC spec review | Weekly | Founder + Grok |
| UI review | Weekly | Founder + Gemini |
| Full sync | Weekly | All |
| Retrospective | End of 30/60/90 | All |

---

## Appendix: Feature Prioritization

### P0 (Must Have for Day 30)
- RC balance tracking
- Basic earn events (publish, upvote)
- RC display on profile
- "How Apex Works" explainer

### P1 (Must Have for Day 60)
- Transaction history
- Threshold-based unlocks
- "How RC Works" full page
- Helpful comment RC

### P2 (Nice to Have for Day 90)
- Governance voting
- Fee discounts
- Economy public dashboard
- RC boost for intel

---

*This roadmap should be reviewed weekly and adjusted based on progress and learnings.*
