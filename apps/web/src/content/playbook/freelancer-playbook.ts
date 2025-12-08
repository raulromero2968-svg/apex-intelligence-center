/**
 * Freelancer 90-Day Playbook - Full PDF-Ready Section
 *
 * Section 3.1 of the AI Disruption Playbook
 * "From Rate Pressure to Reusable Assets in 90 Days"
 *
 * This is the complete, designer-ready content for the Freelancer persona section.
 */

export const freelancerPlaybookMeta = {
  section: "3.1",
  title: "Freelancers",
  subtitle: "From Rate Pressure to Reusable Assets in 90 Days",
  targetAudience: "Writers, designers, marketers, developers, consultants",
  estimatedPages: 6,
  readingTime: "8 minutes",
};

// =============================================================================
// INTRODUCTION
// =============================================================================

export const freelancerIntro = {
  hook: `If you're a freelancer—writer, designer, marketer, developer, consultant—AI isn't a thought experiment. It's already showing up in your inbox.

Clients ask if you "use ChatGPT now."
Prospects want you to be cheaper and faster.
Some quietly experiment with AI instead of renewing contracts.

This section is about turning that pressure into leverage—by shifting from selling hours to owning reusable **intelligence assets** that can keep earning even when individual clients don't.`,
};

// =============================================================================
// WHAT AI DISRUPTION FEELS LIKE
// =============================================================================

export const whatDisruptionFeelsLike = {
  title: "What AI Disruption Feels Like for Freelancers",
  timeframe: "Over the next 2–5 years",

  patterns: [
    {
      pattern: 'More "DIY with AI" clients',
      details: [
        "They try AI to draft copy, designs, code, and only bring you in to \"polish.\"",
        "They expect your work to start from an AI baseline.",
      ],
    },
    {
      pattern: "Downward pressure on rates",
      details: [
        '"Since AI does the first draft, can you lower your quote?"',
        "You're asked to match competitors using AI-enhanced workflows at lower prices.",
      ],
    },
    {
      pattern: "Fragility of lead sources",
      details: [
        "Marketplaces flooded with new competitors",
        "Algorithmic changes affecting how you get discovered",
      ],
    },
  ],

  subtleErosion: {
    intro: 'On paper, you might still be "booked out." But the ground is moving under your feet:',
    signs: [
      "Projects are shorter",
      "Margins are thinner",
      "It's harder to raise your rates without pushback",
    ],
  },
};

// =============================================================================
// RISKS OF DOING NOTHING
// =============================================================================

export const risksOfDoingNothing = {
  title: "The Risk of Doing Nothing",

  intro: "If you keep operating exactly as you did five years ago:",

  risks: [
    "You stay locked in time-for-money mode",
    "Every project ends with:",
    "  • The client owning the value",
    "  • You owning… screenshots and a Stripe export",
    "The moment leads slow down, you have:",
    "  • No product",
    "  • No residual income",
    "  • No asset base that can support you",
  ],

  conclusion: "Your skills still matter—but **how you package them** will decide whether you're resilient or fragile.",
};

// =============================================================================
// THE OPPORTUNITY: INTELLIGENCE ASSETS
// =============================================================================

export const theOpportunity = {
  title: "Your Opportunity: Intelligence Assets",

  rawMaterial: {
    intro: "You already have, buried in past projects:",
    items: [
      "Processes you repeat",
      "Patterns you've seen across clients",
      "Checks you always run",
      "Frameworks you use automatically without naming them",
    ],
  },

  transformation: {
    intro: 'Those are not just "experience." They are the raw material for intelligence assets:',
    assetTypes: [
      {
        type: "Playbooks",
        description: "step-by-step processes that worked",
      },
      {
        type: "Templates & checklists",
        description: "reusable structures",
      },
      {
        type: "Briefings",
        description: '"Here\'s what I\'ve learned about X niche / problem"',
      },
      {
        type: "Curated packs",
        description: "tools, resources, patterns with your commentary",
      },
    ],
  },

  keyInsight: "Instead of doing the same project 20 times for 20 clients, you can **own the underlying approach**—and sell it more than once.",

  purpose: "That's what this 90-day plan is for.",
};

// =============================================================================
// 90-DAY PLAN
// =============================================================================

export const ninetyDayPlan = {
  title: "90-Day Plan: From Projects to Intel Products",

  goal: {
    intro: "Goal:",
    description: "In the next 90 days, create and launch **3–5 intelligence assets** based on your past work, so that:",
    outcomes: [
      "You're no longer 100% dependent on new client work",
      "Every project has a chance to turn into a product",
      "You get used to thinking like an asset owner, not just a service provider",
    ],
  },

  overview: {
    intro: "We'll break it down into four phases:",
    phases: [
      { number: 1, name: "Inventory", days: "Days 1–7" },
      { number: 2, name: "Design", days: "Days 7–21" },
      { number: 3, name: "Build", days: "Days 21–60" },
      { number: 4, name: "Launch & Learn", days: "Days 60–90" },
    ],
  },
};

// =============================================================================
// PHASE 1: INVENTORY
// =============================================================================

export const phase1Inventory = {
  phase: 1,
  title: "Inventory – Find the Gold in Your Past Work",
  days: "Days 1–7",

  instructions: {
    step1: {
      action: "Grab a doc or notebook. List your last 10–20 client projects. For each, write:",
      items: [
        'Client type (anonymized): "early-stage SaaS," "local gym," "personal brand coach"',
        'What problem they came with: "no leads," "low conversion," "broken onboarding"',
        "What you actually did:",
        '  • Not just "designed a website"',
        '  • E.g., "rewrote offer, redesigned homepage, set up email capture, built a 3-email sequence"',
      ],
    },

    step2: {
      action: "Then, ask two questions:",
      questions: [
        {
          question: '"Did this work well?"',
          subQuestions: [
            "Did the client get a good result?",
            "Would you be happy to replicate this elsewhere?",
          ],
        },
        {
          question: '"Did I use a repeatable pattern?"',
          subQuestions: [
            "Did you follow a similar structure for 3+ different clients?",
            "Even if it felt improvised at the time?",
          ],
        },
      ],
    },

    step3: 'Mark the projects where the answer to both is "yes."',
  },

  checklist: {
    title: "Checklist – Phase 1",
    items: [
      "Write out 10–20 recent projects",
      'Mark 3–5 "success stories" with repeatable patterns',
      "Jot 1–2 sentences per project about your *process*, not just deliverable",
    ],
  },
};

// =============================================================================
// PHASE 2: DESIGN
// =============================================================================

export const phase2Design = {
  phase: 2,
  title: "Design – Turn Projects into Intel Products",
  days: "Days 7–21",

  intro: 'For each of your 3–5 "pattern projects," you\'re going to define one intel asset.',

  assetTypes: {
    intro: "Common asset types:",
    types: [
      { type: "Playbook", description: '"Here\'s exactly how I did it"' },
      { type: "Template / Checklist", description: '"Copy this structure, fill in your details"' },
      { type: "Briefing", description: '"Here\'s the landscape and what actually works"' },
    ],
  },

  questions: {
    intro: "For each project, answer:",
    items: [
      {
        question: "1. What outcome did I help create?",
        examples: [
          '"Increased trial sign-ups"',
          '"Stopped churn for new SaaS users"',
          '"Generated warm leads from cold traffic"',
        ],
      },
      {
        question: "2. What repeatable steps did I take?",
        instruction: "List 5–10 steps in order",
        note: "Don't worry about perfect wording yet",
      },
      {
        question: "3. Who else has this problem?",
        subItems: [
          "Industry: B2B SaaS? Creators? Local businesses?",
          "Stage: early, scaling, mature?",
        ],
      },
    ],
  },

  naming: {
    intro: "Then design a named asset:",
    instruction: 'Name it in a way where someone in your niche would say, "I want that."',
    examples: [
      '"The 7-Step Launch Playbook for Pre-Revenue SaaS"',
      '"Onboarding Email Sequence Template That Cut Churn for 3 Clients"',
      '"Local Service Lead Gen Checklist (What Actually Matters in 2025)"',
    ],
  },

  checklist: {
    title: "Checklist – Phase 2",
    items: [
      "For each of 3–5 projects, define 1 asset type (playbook, template, briefing)",
      "Write a working title that focuses on **outcome**",
      'Write a one-line promise: "This helps [who] [do/avoid what]"',
    ],
  },
};

// =============================================================================
// PHASE 3: BUILD
// =============================================================================

export const phase3Build = {
  phase: 3,
  title: "Build – Create Asset v1 Using What You Already Have",
  days: "Days 21–60",

  intro: {
    statement: "You don't need to start from zero. You already have:",
    materials: [
      "Old proposals",
      "Deliverables",
      "Project notes",
      "Emails and Loom recordings",
      "Figma / code / docs",
    ],
    call: "Use them.",
  },

  steps: [
    {
      step: 1,
      title: "Collect raw material",
      instructions: [
        "Gather documents and messages from relevant projects",
        "Highlight:",
        "  • Steps you took",
        "  • Decisions you made",
        "  • Mistakes you avoided",
        "  • Questions you asked the client",
      ],
    },
    {
      step: 2,
      title: "Lay out a simple structure",
      formats: [
        {
          format: "Playbook",
          structure: [
            "Who this is for",
            "When to use it",
            "Step 1–7 (or similar) with explanations",
            "Pitfalls and variations",
            "Example from a past project",
          ],
        },
        {
          format: "Template/Checklist",
          structure: [
            "Context: when to use",
            "The actual template or checklist",
            "A worked example or filled-in version",
          ],
        },
        {
          format: "Briefing",
          structure: [
            "Problem statement",
            "Key dynamics in the market",
            "What's changing because of AI",
            "Recommended approaches and pitfalls",
          ],
        },
      ],
    },
    {
      step: 3,
      title: "Use AI as your assistant, not your boss",
      aiTasks: [
        "Summarize your notes",
        "Suggest section headings",
        "Smooth rough language",
      ],
      yourTasks: [
        "Correct what's wrong",
        "Add real examples",
        "Emphasize nuances an AI wouldn't know",
      ],
    },
  ],

  keyAdvice: "Aim for **clarity over polish**. A useful, slightly ugly asset beats a beautiful, vague one.",

  checklist: {
    title: "Checklist – Phase 3",
    items: [
      "Collect raw material for each asset (notes, docs, emails)",
      "Choose a clear structure (playbook / template / briefing format)",
      "Draft v1 for 3–5 assets using AI as helper where useful",
      "Add at least 1 real example or case snippet per asset",
    ],
  },
};

// =============================================================================
// PHASE 4: LAUNCH & LEARN
// =============================================================================

export const phase4Launch = {
  phase: 4,
  title: "Launch & Learn – Put Assets in the World",
  days: "Days 60–90",

  intro: "A product nobody sees doesn't help you.",

  steps: [
    {
      step: 1,
      title: "Pick a platform",
      options: [
        {
          platform: "Apex",
          instructions: [
            "Import your docs into Apex (via Omnis or direct upload)",
            "Let the system help structure them into intel cards",
            "Refine, tag, and publish to the marketplace",
            "Consider publishing free excerpts or simplified versions in Commons",
          ],
        },
        {
          platform: "Alternative (if no Apex yet)",
          instructions: [
            "A simple landing page + Stripe",
            "Gumroad / Lemon Squeezy / Notion / PDF download",
            "Anything that lets people pay and access",
          ],
        },
      ],
    },
    {
      step: 2,
      title: "Share with a small, relevant audience",
      instructions: {
        pickAudience: [
          "Past clients",
          "Peers in your niche",
          "People who follow you for this exact topic",
        ],
        sampleMessage: `"I put my process for X into a structured guide/template.
If you have [problem], I'd love your honest feedback. Here's the link."`,
      },
    },
    {
      step: 3,
      title: "Ask specific questions",
      questions: [
        '"What part was most useful?"',
        '"What felt confusing, too generic, or unnecessary?"',
        '"If this worked as promised, what would it be worth to you?"',
      ],
    },
    {
      step: 4,
      title: "Iterate once",
      instructions: [
        "Add what multiple people said they needed",
        "Remove or simplify the parts no one cared about",
        "Adjust positioning and price if needed",
      ],
      keyAdvice: "You don't need 20 iterations. You need **one solid revision based on real humans.**",
    },
  ],

  checklist: {
    title: "Checklist – Phase 4",
    items: [
      "Choose where you'll publish each asset",
      "Share with at least 5–10 targeted people",
      "Collect feedback from at least 3 people",
      "Make one focused revision pass per asset",
    ],
  },
};

// =============================================================================
// VISUAL MAP (Designer Instructions)
// =============================================================================

export const visualMap = {
  title: "Quick Visual Map",
  designerNote: "For your designer",

  diagram: {
    description: "Suggest a simple 4-step diagram:",
    steps: [
      {
        step: 1,
        label: "Projects",
        icon: "icons of client logos / generic briefcases",
      },
      {
        step: 2,
        label: "Patterns",
        icon: "magnifying glass on recurring steps",
      },
      {
        step: 3,
        label: "Intel Assets",
        icon: 'cards labeled "Playbook," "Template," "Briefing"',
      },
      {
        step: 4,
        label: "Portfolio",
        icon: "stack of assets with $ and RC icons",
      },
    ],
    caption: '"Stop letting every project disappear into your archive. Turn patterns into products."',
  },
};

// =============================================================================
// APEX SIDEBAR (Optional)
// =============================================================================

export const apexSidebar = {
  title: "How This Maps to Apex",
  type: "Sidebar",

  example: {
    title: "Apex Path for Freelancers (Example)",
    steps: [
      {
        step: 1,
        title: "Connect",
        description: "Link your Upwork or upload a few past briefs and deliverables into Apex Omnis.",
      },
      {
        step: 2,
        title: "Transform",
        description: "Use AI to draft intel cards (playbooks, templates) based on those projects. You review, correct, and add real-world nuance.",
      },
      {
        step: 3,
        title: "Publish & Earn",
        description: "Publish intel to the marketplace → earn **USD** from purchases and **RC** from upvotes and Commons contributions.",
      },
      {
        step: 4,
        title: "Compound",
        description: "Over time, your intel portfolio and RC balance grow—giving you income + reputation that doesn't vanish when a client churns.",
      },
    ],
  },
};

// =============================================================================
// FULL SECTION EXPORT
// =============================================================================

export const freelancerPlaybook = {
  meta: freelancerPlaybookMeta,
  intro: freelancerIntro,
  whatDisruptionFeelsLike,
  risksOfDoingNothing,
  theOpportunity,
  ninetyDayPlan,
  phases: [
    phase1Inventory,
    phase2Design,
    phase3Build,
    phase4Launch,
  ],
  visualMap,
  apexSidebar,
};

// =============================================================================
// MARKDOWN EXPORT (For PDF Generation)
// =============================================================================

export const freelancerPlaybookMarkdown = `# 3.1 Freelancers

## From Rate Pressure to Reusable Assets in 90 Days

If you're a freelancer—writer, designer, marketer, developer, consultant—AI isn't a thought experiment. It's already showing up in your inbox.

Clients ask if you "use ChatGPT now."
Prospects want you to be cheaper and faster.
Some quietly experiment with AI instead of renewing contracts.

This section is about turning that pressure into leverage—by shifting from selling hours to owning reusable **intelligence assets** that can keep earning even when individual clients don't.

---

## What AI Disruption Feels Like for Freelancers

Over the next 2–5 years, AI disruption will likely feel like this:

### More "DIY with AI" clients
- They try AI to draft copy, designs, code, and only bring you in to "polish."
- They expect your work to start from an AI baseline.

### Downward pressure on rates
- "Since AI does the first draft, can you lower your quote?"
- You're asked to match competitors using AI-enhanced workflows at lower prices.

### Fragility of lead sources
- Marketplaces flooded with new competitors
- Algorithmic changes affecting how you get discovered

On paper, you might still be "booked out." But the **ground is moving under your feet**:

- Projects are shorter
- Margins are thinner
- It's harder to raise your rates without pushback

---

## The Risk of Doing Nothing

If you keep operating exactly as you did five years ago:

- You stay locked in **time-for-money** mode
- Every project ends with:
  - The client owning the value
  - You owning… screenshots and a Stripe export
- The moment leads slow down, you have:
  - No product
  - No residual income
  - No asset base that can support you

Your skills still matter—but **how you package them** will decide whether you're resilient or fragile.

---

## Your Opportunity: Intelligence Assets

You already have, buried in past projects:

- Processes you repeat
- Patterns you've seen across clients
- Checks you always run
- Frameworks you use automatically without naming them

Those are not just "experience." They are the raw material for **intelligence assets**:

- **Playbooks**: step-by-step processes that worked
- **Templates & checklists**: reusable structures
- **Briefings**: "Here's what I've learned about X niche / problem"
- **Curated packs**: tools, resources, patterns with your commentary

Instead of doing the same project 20 times for 20 clients, you can **own the underlying approach**—and sell it more than once.

That's what this 90-day plan is for.

---

## 90-Day Plan: From Projects to Intel Products

**Goal:**
In the next 90 days, create and launch **3–5 intelligence assets** based on your past work, so that:

- You're no longer 100% dependent on new client work
- Every project has a chance to turn into a product
- You get used to thinking like an asset owner, not just a service provider

We'll break it down into four phases:

1. Inventory (Days 1–7)
2. Design (Days 7–21)
3. Build (Days 21–60)
4. Launch & Learn (Days 60–90)

---

### Phase 1: Inventory – Find the Gold in Your Past Work (Days 1–7)

Grab a doc or notebook. List your **last 10–20 client projects**. For each, write:

- Client type (anonymized): *"early-stage SaaS," "local gym," "personal brand coach"*
- What problem they came with: *"no leads," "low conversion," "broken onboarding"*
- What you actually did:
  - Not just "designed a website"
  - E.g., "rewrote offer, redesigned homepage, set up email capture, built a 3-email sequence"

Then, ask two questions:

1. **"Did this work well?"**
   - Did the client get a good result?
   - Would you be happy to replicate this elsewhere?

2. **"Did I use a repeatable pattern?"**
   - Did you follow a similar structure for 3+ different clients?
   - Even if it felt improvised at the time?

Mark the projects where the answer to both is "yes."

> **Checklist – Phase 1**
>
> - [ ] Write out 10–20 recent projects
> - [ ] Mark 3–5 "success stories" with repeatable patterns
> - [ ] Jot 1–2 sentences per project about your *process*, not just deliverable

---

### Phase 2: Design – Turn Projects into Intel Products (Days 7–21)

For each of your 3–5 "pattern projects," you're going to define **one intel asset**.

Common asset types:

- **Playbook** – "Here's exactly how I did it"
- **Template / Checklist** – "Copy this structure, fill in your details"
- **Briefing** – "Here's the landscape and what actually works"

For each project, answer:

1. **What outcome did I help create?**
   - "Increased trial sign-ups"
   - "Stopped churn for new SaaS users"
   - "Generated warm leads from cold traffic"

2. **What repeatable steps did I take?**
   - List 5–10 steps in order
   - Don't worry about perfect wording yet

3. **Who else has this problem?**
   - Industry: B2B SaaS? Creators? Local businesses?
   - Stage: early, scaling, mature?

Then design a **named asset**:

Examples:

- "The 7-Step Launch Playbook for Pre-Revenue SaaS"
- "Onboarding Email Sequence Template That Cut Churn for 3 Clients"
- "Local Service Lead Gen Checklist (What Actually Matters in 2025)"

Name it in a way where someone in your niche would say, "I want that."

> **Checklist – Phase 2**
>
> - [ ] For each of 3–5 projects, define 1 asset type (playbook, template, briefing)
> - [ ] Write a working title that focuses on **outcome**
> - [ ] Write a one-line promise: "This helps [who] [do/avoid what]"

---

### Phase 3: Build – Create Asset v1 Using What You Already Have (Days 21–60)

You don't need to start from zero. You already have:

- Old proposals
- Deliverables
- Project notes
- Emails and Loom recordings
- Figma / code / docs

Use them.

For each asset:

**1. Collect raw material**

- Gather documents and messages from relevant projects
- Highlight:
  - Steps you took
  - Decisions you made
  - Mistakes you avoided
  - Questions you asked the client

**2. Lay out a simple structure**

For a **playbook**, structure like:
- Who this is for
- When to use it
- Step 1–7 (or similar) with explanations
- Pitfalls and variations
- Example from a past project

For a **template/checklist**:
- Context: when to use
- The actual template or checklist
- A worked example or filled-in version

For a **briefing**:
- Problem statement
- Key dynamics in the market
- What's changing because of AI
- Recommended approaches and pitfalls

**3. Use AI as your assistant, not your boss**

Let AI:
- Summarize your notes
- Suggest section headings
- Smooth rough language

You:
- Correct what's wrong
- Add real examples
- Emphasize nuances an AI wouldn't know

Aim for **clarity over polish**. A useful, slightly ugly asset beats a beautiful, vague one.

> **Checklist – Phase 3**
>
> - [ ] Collect raw material for each asset (notes, docs, emails)
> - [ ] Choose a clear structure (playbook / template / briefing format)
> - [ ] Draft v1 for 3–5 assets using AI as helper where useful
> - [ ] Add at least 1 real example or case snippet per asset

---

### Phase 4: Launch & Learn – Put Assets in the World (Days 60–90)

A product nobody sees doesn't help you.

Your job now is to:

**1. Pick a platform**

If you're using Apex:
- Import your docs into Apex (via Omnis or direct upload)
- Let the system help structure them into intel cards
- Refine, tag, and publish to the marketplace
- Consider publishing **free excerpts** or simplified versions in Commons

If you don't have Apex yet:
- Use:
  - A simple landing page + Stripe
  - Gumroad / Lemon Squeezy / Notion / PDF download
  - Anything that lets people pay and access

**2. Share with a small, relevant audience**

Pick 5–10 people:
- Past clients
- Peers in your niche
- People who follow you for this exact topic

Send them a short message:

> "I put my process for X into a structured guide/template.
> If you have [problem], I'd love your honest feedback. Here's the link."

**3. Ask specific questions**

- "What part was most useful?"
- "What felt confusing, too generic, or unnecessary?"
- "If this worked as promised, what would it be worth to you?"

**4. Iterate once**

- Add what multiple people said they needed
- Remove or simplify the parts no one cared about
- Adjust positioning and price if needed

You don't need 20 iterations. You need **one solid revision based on real humans.**

> **Checklist – Phase 4**
>
> - [ ] Choose where you'll publish each asset
> - [ ] Share with at least 5–10 targeted people
> - [ ] Collect feedback from at least 3 people
> - [ ] Make one focused revision pass per asset

---

## Quick Visual Map

**[For Designer: 4-Step Diagram]**

1. **Projects** – icons of client logos / generic briefcases
2. **Patterns** – magnifying glass on recurring steps
3. **Intel Assets** – cards labeled "Playbook," "Template," "Briefing"
4. **Portfolio** – stack of assets with $ and RC icons

> *"Stop letting every project disappear into your archive. Turn patterns into products."*

---

## How This Maps to Apex (Sidebar)

> **Apex Path for Freelancers (Example)**
>
> **Step 1 – Connect**
> Link your Upwork or upload a few past briefs and deliverables into Apex Omnis.
>
> **Step 2 – Transform**
> Use AI to draft intel cards (playbooks, templates) based on those projects.
> You review, correct, and add real-world nuance.
>
> **Step 3 – Publish & Earn**
> Publish intel to the marketplace → earn **USD** from purchases and **RC** from upvotes and Commons contributions.
>
> **Step 4 – Compound**
> Over time, your intel portfolio and RC balance grow—giving you income + reputation that doesn't vanish when a client churns.
`;

export default freelancerPlaybook;
