# Apex Commons - Phased Execution Plan & Specialist Delegation

**Status:** Planning Phase
**Created:** 2025-12-02
**Target:** apexcommons.org - Educational Resource Library

---

## Executive Summary

This document provides a **phased execution plan** for building Apex Commons and **concrete delegation prompts** for each specialist agent (DB, API/tRPC, Full Stack, Security, DevOps, UX, Data/RC). Each prompt is copy-paste ready for specialist GPTs or agents.

---

## 1. High-Level Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React + TypeScript + TailwindCSS |
| API Layer | tRPC v11 |
| Data Layer | Drizzle ORM on PostgreSQL |
| Auth | Manus OAuth (shared users table with Apex Intelligence) |
| Hosting | Vercel (already wired) |
| Sessions | Redis (Upstash) |

### Core Domains

| Domain | Description |
|--------|-------------|
| **Users** | roles, bio, subjects, gradeLevel, RC (Reputation Credits), contributorLevel |
| **Resources** | educational content (files, metadata, tags, standards) |
| **Engagement** | votes, views, downloads, comments |
| **Collections** | curated sets of resources |
| **Governance** | proposals + votes (RC-gated) |
| **Economy** | RC transactions (earn/spend) |
| **Moderation** | flags + review workflows |

### Build Strategy

Multi-specialist, dependency-aware orchestration:
**DB → API/tRPC → Auth & Security → Frontend → RC & Analytics → Deployment**

---

## 2. Phased Execution Plan

### Phase 1 - Data & Backend Foundations

**Goals:**
- Complete Drizzle schema for all Apex Commons tables
- Wire up DB client + migrations
- Create core tRPC routers + procedures (CRUD & queries)
- Define RC & governance primitives (at least schema + stubs)

**Key Specialists:**
- Database Architect (schema + relations)
- API Architect (tRPC router design)
- Security Specialist (RBAC model surface)

**Deliverables:**
- [ ] `resources` table with full metadata
- [ ] `resourceVotes` table
- [ ] `collections` + `collectionResources` tables
- [ ] `proposals` + `proposalVotes` tables
- [ ] `rcTransactions` ledger table
- [ ] `moderationFlags` table
- [ ] tRPC routers for all domains
- [ ] Migrations running cleanly

---

### Phase 2 - Core User Experiences (Frontend)

**Pages to Ship:**

| Route | Access | Description |
|-------|--------|-------------|
| `/browse` | Public | Browse library with filters, search, pagination |
| `/resource/:id` | Public (auth for actions) | Resource detail with voting, downloads, comments |
| `/contribute` | Teacher role | Multi-step resource submission form |
| `/dashboard` | Teacher role | Teacher dashboard with metrics |
| `/governance` | Public (gated actions) | Community proposals and voting |

**Key Specialists:**
- Full Stack Dev (React + tRPC client integration)
- UX Specialist (flows, accessibility, clear quality guidance)
- Visual Architect (keep alignment with Apex brand / themes)

**Deliverables:**
- [ ] Browse page with filters and pagination
- [ ] Resource detail page with all tabs
- [ ] Contribute wizard with quality guidelines
- [ ] Teacher dashboard with metrics
- [ ] Governance page with proposal management

---

### Phase 3 - Auth, RBAC, RC & Moderation

**Goals:**
- Fully integrate Manus OAuth with Drizzle `users` table
- Implement RBAC: `user`, `teacher`, `moderator`, `admin`
- Implement Reputation Credits (RC) engine + transactions
- Implement voting limits, proposal eligibility, and moderation tools

**Key Specialists:**
- Security Specialist (OAuth, RBAC, route guarding)
- API Architect (tRPC middlewares for auth/roles)
- Data Scientist (RC reward rules & analytics plan)

**Deliverables:**
- [ ] OAuth integration with user sync
- [ ] Role-based middleware (`requireAuth`, `requireRole`)
- [ ] RC transaction logging
- [ ] Contributor level calculations
- [ ] Moderation workflow APIs

---

### Phase 4 - Production Readiness & Polish

**Goals:**
- CI/CD sanity checks (typecheck, lint, tests) for Vercel
- Monitoring & logging basics
- SEO for `/browse` + `/resource/:id`
- UX polish, performance passes (lazy loading, skeletons)

**Key Specialists:**
- Cloud & DevOps (Vercel env + DB + migrations + logs)
- SEO/Growth (metadata, schema.org, sitemaps)
- UX Specialist (final accessibility & polish)

**Deliverables:**
- [ ] CI pipeline with type checking and linting
- [ ] Error tracking integration
- [ ] SEO metadata for all public pages
- [ ] Performance optimizations
- [ ] Accessibility audit passed

---

## 3. Specialist Delegation Prompts

### 3A. Database Architect - Drizzle Schema Completion

**To:** Database Architect Specialist

**Task:** Design and finalize the Drizzle ORM schema for Apex Commons (PostgreSQL), including all missing tables and relations.

#### Current Situation

- Tech: Next.js 14 + React + tRPC + Drizzle + Manus OAuth
- Existing schema: Located at `/packages/db/src/schema.ts`
- Existing tables include `users`, but Commons-specific tables need to be added
- Required new tables:
  - `commonsResources`
  - `resourceVotes`
  - `collections`
  - `proposals`
  - `rcTransactions`
  - `moderationFlags`

#### Requirements

**1. CommonsResources**
```typescript
// Core educational resource content
{
  id: text().primaryKey().$defaultFn(() => nanoid()),
  contributorId: text().notNull().references(() => users.id),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(), // 'lessonPlan' | 'worksheet' | 'assessment' | 'activity' | 'other'
  subject: text().notNull(), // 'math' | 'science' | 'english' | 'history' | 'art' | 'pe' | 'other'
  gradeLevel: text().notNull(), // 'elementary' | 'middle' | 'high' | 'college' | 'professional'
  resourceType: text().notNull(), // 'document' | 'presentation' | 'video' | 'interactive' | 'other'
  files: text().notNull(), // JSON array: [{ name, url, type, size }]
  thumbnailUrl: text(),
  tags: text(), // JSON array
  standards: text(), // JSON array of education standards
  duration: integer(), // estimated time in minutes
  status: text().notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'archived'
  qualityScore: real().default(0),
  viewCount: integer().default(0),
  downloadCount: integer().default(0),
  upvotes: integer().default(0),
  downvotes: integer().default(0),
  reviewedBy: text().references(() => users.id),
  reviewedAt: integer(),
  createdAt: integer().notNull().$defaultFn(() => Date.now()),
  updatedAt: integer().notNull().$defaultFn(() => Date.now())
}
```

**2. ResourceVotes**
- One row per `(userId, resourceId)` vote
- Fields: `id`, `resourceId`, `userId`, `value` (`+1` or `-1`), `createdAt`
- Enforce uniqueness on `(resourceId, userId)`

**3. Collections**
- User-curated sets of resources
- Fields: `id`, `ownerId`, `title`, `description`, `visibility` (`public`/`private`/`unlisted`), `tags` (JSON), `createdAt`, `updatedAt`
- Join table `collectionResources` for many-to-many: `id`, `collectionId`, `resourceId`, `orderIndex`

**4. Proposals**
- For community governance (e.g., "Change RC reward rules", "Feature new subject area")
- Fields: `id`, `authorId`, `title`, `summary`, `body`, `status` (`draft`, `active`, `accepted`, `rejected`, `withdrawn`), `createdAt`, `activatedAt`, `closedAt`, `minRcToCreate`, `snapshotRc` (author's RC when created), `tags` (JSON)

**5. ProposalVotes**
- RC-weighted voting: for/against/abstain
- Fields: `id`, `proposalId`, `voterId`, `choice` (`for`, `against`, `abstain`), `weightRc` (RC weight at vote time), `createdAt`
- Uniqueness on `(proposalId, voterId)`

**6. RcTransactions**
- Ledger of RC events
- Fields: `id`, `userId`, `amount` (positive or negative), `reason` (enum string), `meta` (JSON payload), `createdAt`
- Example `reason` values: `resource_approved`, `resource_upvoted`, `proposal_created`, `proposal_passed`, `moderation_action`, `manual_adjustment`

**7. ModerationFlags**
- For resources (and later comments)
- Fields: `id`, `resourceId`, `reporterId`, `reason` (short category), `details` (text), `status` (`open`, `under_review`, `resolved`, `dismissed`), `resolvedBy`, `resolvedAt`, `createdAt`

**8. Relations & Indexes**
- Add foreign keys to `users` table where relevant (`contributorId`, `reviewedBy`, etc.)
- Index hot paths:
  - Resources by `status`, `category`, `subject`, `gradeLevel`
  - Votes by `resourceId`, `proposalId`
  - RcTransactions by `userId`

#### Instructions

1. Express all tables using Drizzle's PostgreSQL syntax (`pgTable`, `text`, `integer`, `real`, etc.), consistent with the existing schema style
2. Use integer timestamps (`createdAt`/`updatedAt` in milliseconds) consistently with existing tables
3. Provide commented sections grouping related tables (Resources, Governance, RC, Moderation)
4. Include TypeScript `relations(...)` helpers for proper type inference
5. Keep enums as `text` columns with TypeScript union types inferred at the application level
6. Prefix all new tables with `commons_` to namespace within the larger Apex ecosystem

#### Expected Output

- A complete schema definition for all missing tables
- A short description of each relation and key index
- Notes on any migration caveats (e.g., backfilling timestamps)

#### Success Criteria

- Schema compiles under TypeScript strict mode
- Migrations run without errors on a fresh PostgreSQL DB
- The shape of tables fully supports the features in the Apex Commons spec

---

### 3B. API Architect - tRPC Router Design

**To:** API Architect Specialist

**Task:** Design and specify the full tRPC router structure and core procedures for Apex Commons.

#### Current Situation

- Backend stack: tRPC v11 + Drizzle ORM + Manus OAuth
- Frontend: Next.js 14 + React + TS; already has landing page and theme system
- Existing tRPC setup at `/apps/web/src/server/api/`
- We have tables: `commonsResources`, `resourceVotes`, `collections`, `collectionResources`, `proposals`, `proposalVotes`, `rcTransactions`, `moderationFlags` (from DB specialist)

#### High-Level Routers

Define a router layout:
- `commonsResourceRouter`
- `commonsCollectionRouter`
- `commonsGovernanceRouter`
- `commonsUserRouter`
- `commonsModerationRouter`
- `commonsMetricsRouter`

#### Router Specifications

**1. commonsResourceRouter**
```typescript
browseResources(input: {
  search?: string,
  subject?: Subject,
  gradeLevel?: GradeLevel,
  category?: Category,
  resourceType?: ResourceType,
  tags?: string[],
  sort?: 'newest' | 'popular' | 'highestRated',
  cursor?: string,
  limit?: number
}) -> { resources: ResourceCard[], nextCursor?: string }

getResourceById({ id: string }) -> ResourceDetail | null

createResource(input: CreateResourceInput) -> Resource  // role: teacher

updateResource(input: UpdateResourceInput) -> Resource  // owner or moderator

incrementView({ id: string }) -> void

trackDownload({ id: string }) -> { url: string }  // returns signed URL

voteOnResource({ resourceId: string, value: 1 | -1 }) -> void  // auth required

listRelatedResources({ resourceId: string }) -> ResourceCard[]
```

**2. commonsCollectionRouter**
```typescript
listUserCollections({ userId?: string }) -> Collection[]

getCollectionById({ id: string }) -> CollectionWithResources

createCollection(input) -> Collection

updateCollection(input) -> Collection

deleteCollection({ id: string }) -> void

addResourceToCollection({ collectionId, resourceId }) -> void

removeResourceFromCollection({ collectionId, resourceId }) -> void
```

**3. commonsGovernanceRouter**
```typescript
listActiveProposals() -> Proposal[]

listProposalHistory({ status?, authorId? }) -> Proposal[]

getProposalById({ id: string }) -> ProposalDetail

createProposal(input) -> Proposal  // requires user.rc >= minRcToCreate

voteOnProposal({ proposalId, choice: 'for' | 'against' | 'abstain' }) -> void
```

**4. commonsUserRouter**
```typescript
getCurrentCommonsUser() -> CommonsUser

getCommonsUserProfile({ id: string }) -> CommonsUserProfile

updateCommonsUserProfile(input: { bio?, subjects?, gradeLevel? }) -> CommonsUser

getUserStats({ id: string }) -> UserStats  // RC totals, resources, approvals
```

**5. commonsModerationRouter** (role: moderator | admin)
```typescript
listPendingResources() -> Resource[]

reviewResource({ resourceId, decision: 'approve' | 'reject', notes?: string }) -> void

listFlags({ status?: FlagStatus }) -> ModerationFlag[]

resolveFlag({ flagId, resolution: 'resolved' | 'dismissed' }) -> void
```

**6. commonsMetricsRouter**
```typescript
teacherDashboardMetrics({ userId: string }) -> {
  totalResources: number,
  pending: number,
  approved: number,
  rejected: number,
  totalViews: number,
  totalDownloads: number,
  netUpvotes: number,
  rcEarned: number
}

siteWideStats() -> SiteStats  // for governance view
```

#### Instructions

1. Specify router & procedure names, input types, and output shapes in TypeScript terms
2. Indicate which procedures are:
   - public
   - auth-required
   - role-guarded (`teacher`, `moderator`, `admin`)
3. Show how to use tRPC middleware to:
   - attach Manus user to context
   - enforce roles & minimum RC requirements for governance actions
4. Design for pagination on browse endpoints (cursor-based)
5. Include error scenarios: unauthorized, invalid filters, missing resources, proposal already closed, duplicate votes, etc.

#### Expected Output

- Router tree definition (namespaces and procedures)
- Types and interfaces for core inputs/outputs
- Description of auth/role middleware & error handling pattern

#### Success Criteria

- All frontend pages in the spec can be implemented *only* by calling these routers
- RBAC and RC checks are enforced server-side, not just in the UI
- tRPC types flow cleanly to the client (no `any`)

---

### 3C. Security Specialist - Manus OAuth & RBAC

**To:** Security Specialist

**Task:** Integrate Manus OAuth with Drizzle users, and define a robust RBAC + authorization layer for Apex Commons.

#### Current Situation

- JWT-based auth already exists at `/apps/web/src/lib/auth/`
- We must wire it into:
  - `users` table (id, email, role, RC, etc.)
  - tRPC context (current user, roles, RC)
- Roles: `user`, `teacher`, `moderator`, `admin`

#### Security Requirements

**1. Auth Flow**
- Use existing OAuth to authenticate and create/update user rows in `users`
- On login, if user doesn't exist, create with default role `user`
- Provide an upgrade path for `teacher` (manual flag or future teacher verification flow)
- Sync Commons-specific fields (`reputationCredits`, `contributorLevel`, `subjects`, etc.)

**2. RBAC Policy**

| Role | Permissions |
|------|-------------|
| `user` | Browse, view, download, upvote/downvote |
| `teacher` | All user + submit resources, manage own content, access `/dashboard` |
| `moderator` | All teacher + approve/reject resources, resolve flags, adjust RC in moderation |
| `admin` | Full control including manual RC adjustments and role changes |

**3. Route Protection**

Create tRPC middleware:
```typescript
requireAuth()  // Ensures valid session exists
requireRole('teacher' | 'moderator' | 'admin')  // Checks role hierarchy
requireMinRc(amount: number)  // For governance actions
```

Protect:
- `/contribute` page APIs → `requireRole('teacher')`
- `/dashboard` APIs → `requireRole('teacher')`
- Moderation APIs → `requireRole('moderator')`
- RC & role management APIs → `requireRole('admin')`

**4. Token & Session Handling**
- Follow OAuth/OIDC best practices:
  - Access tokens in HttpOnly cookies only
  - 15-minute access token expiry (already configured)
  - Redis session revocation for logout
- Ensure CSRF protection on state-changing endpoints

#### Instructions

1. Outline the integration between OAuth user payload and our `users` table
2. Define how the tRPC context is built per request (pulling session and RC/role into context)
3. Provide patterns for implementing `requireAuth`, `requireRole`, and `requireMinRc` middlewares
4. Call out any security pitfalls we must avoid

#### Expected Output

- Clear description of auth flow and data mapping
- Middleware designs for RBAC enforcement
- A checklist of security best practices for Apex Commons

#### Success Criteria

- All protected actions are impossible without auth and appropriate roles
- No secrets or tokens are exposed client-side
- Flows align with OAuth2/OIDC best practices

---

### 3D. Full Stack Dev - Core Pages & tRPC Integration

**To:** Full Stack Dev Specialist

**Task:** Implement all remaining Apex Commons pages and hook them up to tRPC, using the existing theme system and brand.

#### Current Situation

- Stack: Next.js 14 + React + TypeScript + Tailwind
- Existing assets:
  - `/apps/web/src/app/` - 47+ existing pages
  - `/apps/web/src/components/` - 56+ component directories
  - Dark/light theme support exists
- tRPC + Drizzle + OAuth will be wired up by other specialists

#### Pages to Build

**1. Browse Library - `/commons/browse`**

Layout: searchable, filterable grid

Components:
- Search bar (debounced)
- Filters: subject, grade level, resource type, category
- Sort dropdown (newest/popular/highest rated)
- Resource cards: title, description snippet, subject, grade, badges, quality indicators, views/downloads

Behavior:
- On load, call `commonsResourceRouter.browseResources`
- Use cursor-based pagination (infinite scroll or paged)
- Respect light/dark theme

**2. Resource Detail - `/commons/resource/[id]`**

Layout:
- Main content: title, description, metadata, file list, thumbnail
- Side panel: stats (views, downloads, upvotes/downvotes, qualityScore)
- Tabs: "Overview", "Files", "Standards & Tags", "Comments"

Actions:
- Upvote/downvote buttons (auth required)
- Download buttons (fire `trackDownload` then open file)
- Show related resources
- Basic comments section (can be stubbed initially)

**3. Contribute Resource - `/commons/contribute` (teacher only)**

Multi-step form:
1. Basic info: title, description, category, subject, grade level
2. Files upload: allow multiple files
3. Metadata: tags, standards, duration estimate, resourceType
4. Review & Submit: summary + quality guidelines

Show quality guidance panel with bullet-point standards:
- Clarity and organization
- Accessibility considerations
- Age-appropriateness
- Copyright safety

**4. Teacher Dashboard - `/commons/dashboard` (teacher only)**

Overview cards:
- Total resources
- Pending / approved / rejected
- Total RC earned

Tables/charts:
- Resource performance (views, downloads, upvotes, RC)

Use `commonsMetricsRouter.teacherDashboardMetrics`

**5. Community Governance - `/commons/governance`**

Sections:
- Active proposals: cards with title, summary, status, voting progress
- Proposal history: past decisions with filters
- "New proposal" flow:
  - Only enabled if user has minimum RC
  - Simple form: title, summary, body, category/tags

Voting:
- Buttons: For / Against / Abstain
- Show user's RC weight and that voting is public & logged

#### Instructions

1. Use TypeScript everywhere, strongly typed via tRPC hooks
2. Respect existing theme & visual language
3. Implement loading + error states for all data fetching
4. Ensure mobile-first responsiveness and semantic HTML for accessibility

#### Expected Output

- React page components and shared UI components
- tRPC hooks usage (`trpc.commonsResource.browseResources.useQuery`, etc.)
- Integration with auth state (show/hide buttons based on role)

#### Success Criteria

- All nav links point to working pages
- No TypeScript errors
- Basic pages are fully functional end-to-end

---

### 3E. UX Specialist - Flows, Guidelines & Accessibility

**To:** UX Specialist

**Task:** Define UX flows, content structure, and accessibility patterns for the new Apex Commons pages.

#### Focus Areas

**1. Browse & Discovery**
- Make filters intuitive and non-overwhelming
- Provide empty states when no resources match filters
- Clear visual hierarchy for trusted, high-quality content ("Apex Verified" badge vs community score)

**2. Contribute Flow**
- Multi-step wizard with progress indicator
- Inline validation and examples for teachers
- Friendly, non-intimidating microcopy emphasizing "support", not "policing"

**3. Teacher Dashboard**
- At-a-glance metrics
- Emphasis on impact (e.g., "You've helped X students" if possible later)
- Obvious affordances for improving content ("Add thumbnail", "Update tags")

**4. Governance**
- Display proposals in plain language
- Show implications of voting (what passing means)
- Make RC requirements and weights transparent

**5. Accessibility**
- WCAG 2.1 AA minimum
- Proper contrast in both light and dark themes
- Keyboard navigability & focus states
- ARIA labels for interactive components

#### Expected Output

- Wireframe descriptions for each page
- A checklist of UX and accessibility requirements for developers
- Copy guidelines for quality standards and governance explanations

---

### 3F. Data Scientist - RC System & Metrics

**To:** Data Scientist Specialist

**Task:** Design the Reputation Credits (RC) rules and metrics model for Apex Commons.

#### Context

- `rcTransactions` table logs changes with `reason` and `amount`
- RC is used for:
  - Contributor levels (bronze/silver/gold/platinum)
  - Governance eligibility (creating proposals, voting weight)
  - Recognizing teacher impact

#### Requirements

**1. RC Earning Rules (v1)**

| Event | RC Earned | Caps/Notes |
|-------|-----------|------------|
| Resource approved | +50 RC | Per resource |
| Resource view | +0.1 RC | Max 100 RC/resource/day |
| Resource download | +0.5 RC | Max 100 RC/resource/day |
| Net positive votes | +5 RC | Per 10 net upvotes |
| Proposal passed (you voted with majority) | +10 RC | Per proposal |
| First approved resource | +100 RC bonus | One-time |

**2. RC Spending / Locking**
- Creating a proposal requires minimum 500 RC
- Optionally lock or stake RC on proposals (design for later)

**3. Contributor Levels**

| Level | RC Threshold | Badge |
|-------|--------------|-------|
| Bronze | 0+ | Bronze star |
| Silver | 500+ | Silver star |
| Gold | 2000+ | Gold star |
| Platinum | 10000+ | Platinum star |

**4. Metrics for Dashboards**

Teacher Dashboard:
- Resources submitted / approved / pending / rejected
- Total views / downloads / net upvotes
- RC earned (lifetime + last 30 days)
- Contributor level progress bar

Site-wide (admin):
- Total resources
- Active contributors
- RC in circulation
- Governance participation rate

#### Expected Output

- RC rule table (event → RC amount, caps, anti-abuse notes)
- ContributorLevel thresholds
- Derived metrics needed for dashboards
- Anti-gaming considerations

---

### 3G. Cloud & DevOps - Vercel, DB & Observability

**To:** Cloud & DevOps Specialist

**Task:** Ensure Apex Commons is production-ready on Vercel with reliable DB, migrations, and basic monitoring.

#### Context

- Vercel project already exists
- Adding tRPC backend + Drizzle DB for Commons tables
- Existing PostgreSQL setup in place

#### Requirements

**1. Database**
- Use existing PostgreSQL (Supabase/Neon) with Drizzle
- Configure connection URLs via Vercel env vars
- Set up `drizzle-kit` migrations in CI (or a deploy script)
- Ensure Commons tables are added via migration, not recreating DB

**2. Build & Runtime**
- Confirm build command and output match the current stack
- tRPC runs on Vercel serverless functions
- Ensure bundle size stays reasonable

**3. Env Management**

Document all `process.env.*` variables:
```env
# Existing
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Commons-specific (if any)
COMMONS_FILE_STORAGE_URL  # For uploaded resources
COMMONS_MIN_RC_PROPOSAL   # Governance threshold
```

**4. Monitoring & Logs**
- Use Vercel logs plus optional error tracking (Sentry)
- Ensure 4xx/5xx behavior is observable
- Add structured logging for RC transactions and governance actions

#### Expected Output

- Deployment checklist for Apex Commons
- Env var schema and example `.env.example`
- Recommended runtime configuration
- Migration strategy for adding Commons tables

---

## 4. How to Use This Document

1. **Treat this as your Orchestrator-level plan**
2. **Copy the relevant specialist prompt blocks** into your individual agents:
   - Database Architect → Section 3A
   - API Architect → Section 3B
   - Security Specialist → Section 3C
   - Full Stack Dev → Section 3D
   - UX Specialist → Section 3E
   - Data Scientist → Section 3F
   - DevOps → Section 3G
3. **As specialists return code and designs**, integrate and sanity-check for consistency
4. **Iterate** as needed when specialists surface questions or conflicts

---

## 5. Dependencies & Integration Points

```
Phase 1 (Foundation)
├── 3A. DB Architect (schema)
│   └── 3B. API Architect (tRPC) ─┐
│                                 │
└── 3C. Security (RBAC) ──────────┤
                                  │
Phase 2 (Frontend)                │
├── 3D. Full Stack Dev ◄──────────┘
│   └── depends on: schema, routers, auth
│
└── 3E. UX Specialist
    └── parallel with Full Stack

Phase 3 (RC & Governance)
├── 3F. Data Scientist
│   └── defines RC rules for Phase 1 DB schema
│
└── integrates with 3B (API) and 3D (Frontend)

Phase 4 (Production)
└── 3G. DevOps
    └── final integration and deployment
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Schema compiles | Zero TypeScript errors |
| Migrations run | Clean on fresh DB |
| All routes typed | No `any` in tRPC |
| Pages functional | All 5 core pages working |
| Auth enforced | No unauth access to protected routes |
| Accessibility | WCAG 2.1 AA compliance |
| Build time | < 5 minutes |
| Bundle size | < 500KB initial JS |

---

## 7. Related Documentation

- [Apex Commons Heroes Principle](./APEX_COMMONS_HEROES_PRINCIPLE.md) - Community values
- [Ethical Enforcement](./ETHICAL_ENFORCEMENT.md) - Moderation guidelines
- [Development Guide](./DEVELOPMENT.md) - Local setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-02 | Initial execution plan & delegation prompts | Planning Team |

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Assign specialists to each section
3. [ ] Begin Phase 1: DB Architect creates schema
4. [ ] Begin Phase 1: API Architect designs routers (can parallel with schema)
5. [ ] Security Specialist reviews auth integration points
6. [ ] Kick off Phase 2 when Phase 1 deliverables are ready

---

*This plan builds Apex Commons from the existing Apex Intelligence infrastructure into a production-ready, community-governed educational resource library.*
