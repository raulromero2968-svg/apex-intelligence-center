# Apex Commons: User Journey Implementation

## Overview

This document describes the implementation of the **"Skeptical Builder"** user journey for Apex Commons—a public commons for better systems that rejects tech savior narratives and guru worship.

## The User Journey

### Target Persona: The Skeptical Builder

Someone who is:
- Tired of "tech savior" narratives
- Wary of cults of personality
- Afraid of accidentally building harmful systems
- Looking for genuine tools to build better systems

### Journey Phases

#### Phase 1: Discovery (The Hook)
**Location:** Hero section on `/commons`

**Purpose:** Capture attention with messaging that feels different

**Key Elements:**
- Hero text: "Build Tools, Not Temples"
- Value proposition: "A library of frameworks for people tired of tech savior narratives"
- Visual: Transmutation gradient (dark → light, shadow → clarity)
- CTA: "See Our Values" and "Try a Tool (Free)"

**Internal Monologue:** "This doesn't feel like another guru trying to sell me something..."

---

#### Phase 2: Landing (The "Vibe Check")
**Location:** Note on Heroes section

**Purpose:** Lower defenses by explicitly rejecting idolatry

**Key Elements:**
- "We refuse to turn people into gods"
- Three principles:
  1. Admire the work, not the person
  2. No gurus, just tools
  3. Gratitude without worship
- Values filter callout

**Internal Monologue:** "Wait—'We refuse to turn people into gods'? 'Gratitude, not idolatry'? Okay, I'm listening..."

**Result:** User realizes this isn't a cult; it's a library.

---

#### Phase 3: Engagement (The Tool)
**Location:** Shadow Reflex Test section

**Purpose:** Provide immediate, useful value

**Key Elements:**
- Interactive test with 5 questions
- Teaser mode shows first question
- Full test is free, no signup required
- Questions like: "Are we treating discomfort as if it were a threat?"

**Internal Monologue:** "I can use this right now on that decision I made yesterday..."

**Result:** User gets value immediately without buying or joining anything.

---

#### Phase 4: Deepening (The Oath)
**Location:** Founder's Oath section

**Purpose:** Create emotional connection through honesty

**Key Elements:**
- "I remember I've been both harmed and harmful"
- Six principles including:
  - "I build tools, not temples"
  - "I design for transmutation, not elimination"
  - "I design for the outsider, the menace, the misfit"
- Connection to System Safety

**Internal Monologue:** "This feels honest. It acknowledges the 'menace' and the 'outsider' in me."

**Result:** User recognizes that this network understands the complexity of power.

---

#### Phase 5: Retention (The Return)
**Location:** Subscribe section

**Purpose:** Invite users to return when they need it

**Key Elements:**
- Simple email subscription
- Clear promise: "No spam. No guru worship. Just tools."
- Return promise: "Return when your team is in crisis. Return when you need to design a safety policy."

**Internal Monologue:** "I'll come back when I need this. It's a library, not a course."

**Result:** User subscribes and knows they can return for tools when needed.

---

## Visual Design System: Transmutation

### Color Palette
- **Cyan (400-500):** Clarity, tools, utility
- **Purple (400-500):** Transformation, wisdom
- **Orange (400-500):** Energy, agency
- **Slate (700-900):** Foundation, seriousness

### Gradient Philosophy
All gradients represent **transmutation**—the movement from:
- Dark → Light
- Shadow → Clarity
- Control → Agency
- Fear → Understanding

### Key Visual Patterns
1. **Ambient glows:** Subtle, never aggressive
2. **Border gradients:** Shift on hover (cyan → purple → orange)
3. **Calm navigation:** Receding, not sticky/aggressive
4. **Whitespace:** Ample, allowing breathing room

---

## Component Architecture

### Core Components

#### 1. `NoteOnHeroes.tsx`
**Purpose:** Trust-building filter
**Features:**
- Three sections with icons
- Values filter callout
- Transmutation gradient separator

#### 2. `ShadowReflexTest.tsx`
**Purpose:** Interactive engagement tool
**Features:**
- Teaser mode (shows question 1)
- Full test mode (all 5 questions)
- Progress tracking
- No signup required

#### 3. `FoundersOath.tsx`
**Purpose:** Deepening through honesty
**Features:**
- Expandable principles
- Connection to System Safety
- Key quote highlighting

---

## Content Files

### Location: `/apps/web/src/content/commons/`

1. **note-on-heroes.ts:** Anti-idolatry principles
2. **shadow-reflex-test.ts:** 5-question framework
3. **founders-oath.ts:** 6 ethical principles

---

## Integration Points

### Homepage Integration
**Location:** `/apps/web/src/app/page.tsx`

A prominent CTA card introduces Apex Commons:
- Purple/cyan gradient background
- "New: Apex Commons" badge
- Clear value proposition
- Links to `/commons`

### Navigation
**Location:** `/apps/web/src/components/nav/MainNav.tsx`

- "Commons" link featured with special styling
- Purple/cyan gradient border when active
- Positioned first in navigation

---

## User Flow Map

```
Homepage
  ↓
  Commons CTA (Discovery)
  ↓
/commons
  ↓
  Hero: "Build Tools, Not Temples" (Hook)
  ↓
  Note on Heroes (Vibe Check)
  ↓
  Shadow Reflex Test (Engagement)
  ↓
  Founder's Oath (Deepening)
  ↓
  Subscribe (Retention)
```

---

## Design Principles

### 1. Enchanted Utility
Serious tools with a warm tone. Not cold and clinical, not flashy and hype-driven.

### 2. Transmutation Over Elimination
Visual design suggests transformation, not purification. We don't eliminate darkness; we transform it.

### 3. No Aggressive Marketing
- No sticky headers
- No pop-ups
- No artificial urgency
- No scarcity tactics

### 4. Immediate Value
Every tool can be used right away, no signup required. Value first, relationship later.

---

## Success Metrics

This journey is designed to filter:

### Filter OUT:
- People looking for a savior
- Those seeking guru worship
- Quick-fix seekers

### Filter IN:
- Builders seeking responsibility
- People comfortable with nuance
- Those who've experienced being both harmed and harmful

---

## Technical Implementation

### Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** CSS transitions + Tailwind

### Key Files
```
apps/web/src/
├── app/
│   ├── page.tsx (Homepage with Commons CTA)
│   └── commons/
│       └── page.tsx (Main Commons journey)
├── components/
│   └── commons/
│       ├── NoteOnHeroes.tsx
│       ├── ShadowReflexTest.tsx
│       ├── FoundersOath.tsx
│       └── index.ts
└── content/
    └── commons/
        ├── note-on-heroes.ts
        ├── shadow-reflex-test.ts
        ├── founders-oath.ts
        └── index.ts
```

---

## Future Enhancements

### Phase 2 Content
1. **First Three Essays** to make Commons feel "lived-in"
   - "Why We Renamed the Gun-Barrel Test"
   - "The Cost of Hero Worship in Tech"
   - "Transmutation vs. Elimination: A Framework"

2. **Additional Tools**
   - "No Push" Policy Generator
   - System Safety Checklist
   - Anti-Manipulation Audit

3. **Community Features**
   - Commons Library (user-submitted frameworks)
   - Case Studies section
   - Discussion forum (carefully moderated)

---

## Philosophy in Practice

This implementation embodies the core Apex Commons principles:

1. **Anti-Idolatry:** No hero worship, clear attribution
2. **Transmutation:** Visual design shows transformation, not elimination
3. **Shadow Reflex:** Tool that helps identify when safety becomes control
4. **Immediate Value:** No paywalls, no signup gates
5. **Honesty:** "I've been both harmed and harmful"

---

## Maintenance Notes

- Content should remain **concise and actionable**
- Tools should be **immediately useful**
- No feature bloat—resist the urge to add complexity
- Keep the "library, not a course" metaphor consistent

---

## Contact & Contributions

This is a public commons. Contributions welcome, but:
- No guru narratives
- No fear-based design
- Tools over testimonials
- Frameworks over hero stories

---

*"Build tools, not temples. We're here to create systems that work, not to follow charismatic leaders."*
