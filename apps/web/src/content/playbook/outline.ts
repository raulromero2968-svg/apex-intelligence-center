/**
 * AI Disruption Playbook - Structured Outline
 *
 * Designer-ready outline with bullet points under every subsection.
 * This file provides the complete hierarchical structure for the 28-page PDF.
 */

export const playbookOutline = {
  title: "AI Disruption Playbook – Structured Outline",
  version: "1.0",
  lastUpdated: "2025-12-08",
  estimatedPages: 28,
};

// =============================================================================
// FRONT MATTER
// =============================================================================

export const frontMatterOutline = {
  section: "Front Matter",
  pages: "1-4",

  titlePage: {
    title: "Title Page",
    bullets: [
      "Title, subtitle, Apex logo",
      'Tagline: "How knowledge workers can build income that survives 2030."',
    ],
  },

  authorPage: {
    title: "Author Page",
    bullets: [
      "Short founder bio + 2–3 sentences on Apex",
      '"Why I wrote this" box',
    ],
  },

  versionAndDate: {
    title: "Version & Date",
    bullets: [
      "Version number (v1.0)",
      "Date",
      "Contact / URL",
    ],
  },

  tldr: {
    title: "One-page TL;DR",
    bullets: [
      "3–5 bullets on what's changing",
      "3–5 bullets on what to do about it",
      "1–2 bullets on how Apex can help (optional, non-pushy)",
    ],
  },
};

// =============================================================================
// SECTION 1 – THE SHIFT: WHAT AI IS DOING TO WORK
// =============================================================================

export const section1Outline = {
  number: 1,
  title: "The Shift: What AI Is Doing to Work",
  pages: "5-10",

  subsections: [
    {
      number: "1.1",
      title: "The Headline vs. the Reality",
      bullets: [
        'Common scary headlines ("99% of jobs automated")',
        "Clarify: tasks vs jobs vs careers",
        "Explain:",
        "  • Automation of tasks inside jobs",
        "  • Restructuring of roles rather than instant mass unemployment",
        "Why the exact percentage matters less than direction and speed",
      ],
    },
    {
      number: "1.2",
      title: "The Erosion → Compression → Collapse Pattern",
      bullets: [
        "Erosion:",
        "  • Fewer inbound leads",
        "  • Slower promotions",
        "  • Subtle rate pressure",
        "",
        "Compression:",
        '  • More work, same or less pay',
        '  • Expectations of "AI productivity" without pay increase',
        "  • Competition from AI-augmented peers",
        "",
        "Collapse:",
        "  • Roles disappearing or being merged",
        "  • Clients insourcing or using AI + small internal team",
        "  • Platforms changing algorithms/terms in ways that hurt creators and freelancers",
        "",
        "Small visual: timeline with 3 labeled phases",
      ],
    },
    {
      number: "1.3",
      title: "Why Institutions Won't Save You",
      bullets: [
        "Governments:",
        "  • Regulatory lag",
        "  • Focus on macro indicators, not individual resilience",
        "",
        "Corporations:",
        "  • Incentive to cut costs and increase flexibility",
        '  • "Do more with fewer humans" dynamic',
        "",
        "Universities / Training:",
        "  • Curriculum lag",
        "  • Training for jobs that may not exist or will look different",
        "",
        "Reframe:",
        "  • It's not malice, it's structural",
        "  • You can't outsource your transition plan",
      ],
    },
    {
      number: "1.4",
      title: "The Value Inversion",
      bullets: [
        "Old world:",
        "  • Scarce: distribution, tools, credentials",
        "  • Valuable: being able to generate content/code/analysis",
        "",
        "New world:",
        '  • Abundant: AI generation at "good enough" quality',
        "  • Scarce:",
        "    – Curation (what matters)",
        "    – Judgment (what's true, safe, useful)",
        "    – Lived experience (patterns from reality)",
        "    – Trust (consistent track record)",
        "",
        "Diagram idea:",
        '  • Two columns: "Before AI saturation" vs "After AI saturation"',
        '  • Swap "generation" ⇄ "curation/judgment" in bold',
      ],
    },
  ],
};

// =============================================================================
// SECTION 2 – NEW GAME, NEW RULES
// =============================================================================

export const section2Outline = {
  number: 2,
  title: "New Game, New Rules",
  pages: "11-16",

  subsections: [
    {
      number: "2.1",
      title: "Assets vs. Hours",
      bullets: [
        "Define selling hours:",
        "  • Time-for-money",
        "  • No residual value once the job is done",
        "",
        "Define assets:",
        "  • Things you create once and sell/use many times",
        "  • Especially intelligence assets: playbooks, frameworks, analyses, datasets, curated packs",
        "",
        "Why assets:",
        "  • Compounding income",
        "  • Reduced fragility to single clients/employers",
        "  • Better negotiation leverage",
      ],
    },
    {
      number: "2.2",
      title: "Reputation Graphs vs. Resumes",
      bullets: [
        "Traditional resume:",
        "  • Static",
        "  • Self-reported",
        "  • Context-poor",
        "",
        "Reputation graph:",
        "  • Who you helped",
        "  • Who trusted your work",
        "  • In what context, and when",
        "",
        "Examples:",
        '  • "X people bought and positively rated your intel."',
        '  • "Y people rely on your curated lists."',
        '  • "Z high-trust users upvote your stuff consistently."',
        "",
        "Why this matters in AI era:",
        "  • Harder to fake over time",
        "  • Portable across roles and employers",
        "  • Better signal than titles",
      ],
    },
    {
      number: "2.3",
      title: "Communities as Economic Infrastructure",
      bullets: [
        "Platforms vs economies:",
        "  • Platforms: you post, they own the rails",
        "  • Economies: shared rules, hybrid currencies, governance",
        "",
        "Traits of economic infrastructure:",
        "  • People rely on it for income",
        "  • Clear rules and incentives",
        "  • Some form of shared ownership / governance",
        "",
        "Why this matters:",
        "  • Reduces platform risk",
        "  • Allows collective response to shocks (e.g., model changes, regulations)",
      ],
    },
    {
      number: "2.4",
      title: "Principles for the Post-AI Worker",
      bullets: [
        "Bullet set of core principles:",
        "  • Own assets – don't only sell hours",
        "  • Make your work observable – let others see your thinking and results",
        "  • Build reputation in public – in at least one ecosystem that isn't employer-owned",
        "  • Reduce single points of failure – avoid dependence on one client/platform/skill",
        "  • Align with antifragile systems – systems that get stronger under stress",
        "",
        'Callout box: "You don\'t have to implement all of this at once. You do need to start somewhere."',
      ],
    },
  ],
};

// =============================================================================
// SECTION 3 – PERSONA PLAYBOOKS (90-DAY PLANS)
// =============================================================================

export const section3Outline = {
  number: 3,
  title: "Persona Playbooks (90-Day Plans)",
  pages: "17-28",

  structureNote: `Each persona section follows a consistent structure:
  • "What AI disruption feels like for you"
  • "Risks if you do nothing"
  • "Your 90-day plan" (step-by-step, with checklists)`,

  subsections: [
    {
      number: "3.1",
      title: "Freelancers – From Rate Pressure to Reusable Assets",
      bullets: [
        "What disruption feels like:",
        "  • Clients experimenting with AI",
        "  • Rate pressure and scope creep",
        "  • More competition from AI-augmented peers",
        "",
        "Risks:",
        "  • Working harder for same or less",
        "  • No residual value from projects done",
        "",
        "90-day plan:",
        "  • Day 1–7: Project inventory & pattern extraction",
        "  • Day 7–14: Define 3–5 intel products (playbooks, templates, briefings)",
        "  • Day 14–45: Create v1 versions using existing docs + AI assistance",
        "  • Day 45–90: Publish, test with real people, iterate once",
        "",
        'Optional: "How this maps to Apex" sidebar',
      ],
    },
    {
      number: "3.2",
      title: "Curators – Turning Scrolling into a Portfolio",
      bullets: [
        "What disruption feels like:",
        "  • Feeds flooded with AI-generated content",
        "  • Engagement harder to sustain",
        "  • Curation feels like unpaid work",
        "",
        "Risks:",
        "  • Building audience on shifting algorithmic sand",
        "  • No durable proof of your pattern recognition",
        "",
        "90-day plan:",
        '  • Identify "signature threads"',
        "  • Cluster into themes",
        "  • Design field guides / briefings / curation packs",
        "  • Use AI to structure, then add judgment",
        "  • Publish + test",
        "",
        "Apex mapping sidebar",
      ],
    },
    {
      number: "3.3",
      title: "Analysts & Consultants – Stop Burying Your Best Work",
      bullets: [
        "What disruption feels like:",
        "  • AI takes over low-level research, slide drafting",
        "  • More pressure to justify fees",
        "  • High-value insight trapped in private decks",
        "",
        "Risks:",
        "  • Every project = one-time income only",
        "  • No accumulating portfolio of your frameworks",
        "",
        "90-day plan:",
        "  • Select high-impact projects",
        "  • Extract reusable frameworks and processes",
        "  • Design modular intel cards (playbooks, templates, briefings)",
        "  • Anonymize & de-risk",
        "  • Publish & learn",
        "",
        "Apex mapping sidebar",
      ],
    },
    {
      number: "3.4",
      title: "Educators – Serve the Commons Without Going Broke",
      bullets: [
        "What disruption feels like:",
        "  • AI clones generic teaching content",
        "  • Institutions seek to cut instructional staff",
        "  • Best material split across locked LMS and free platforms",
        "",
        "Risks:",
        "  • Burnout from giving away too much",
        "  • No sustainable model for deeper material",
        "",
        "90-day plan:",
        "  • Map assets",
        "  • Decide Commons vs Premium split",
        "  • Create free concept resources",
        "  • Design premium intel products (case studies, advanced packs)",
        "  • Cross-link and ship",
        "",
        "Apex mapping sidebar",
      ],
    },
  ],
};

// =============================================================================
// SECTION 4 – APEX AS AN EXECUTION PATH
// =============================================================================

export const section4Outline = {
  number: 4,
  title: "Apex as an Execution Path",
  pages: "29-34",

  subsections: [
    {
      number: "4.1",
      title: "Why We Built Apex",
      bullets: [
        "Founder's story in 1–2 pages:",
        "  • Realization about AI disruption",
        "  • Concern about workers with no transition plan",
        '  • Apex as "economic lifeboat" idea',
        "",
        "Core belief:",
        '  • "Knowledge workers need economic infrastructure, not just tools."',
      ],
    },
    {
      number: "4.2",
      title: "From History to Intelligence Assets",
      bullets: [
        'Define "intelligence assets" clearly',
        "Concrete examples:",
        '  • "B2B SaaS launch playbook"',
        '  • "Curated research pack on X"',
        '  • "Risk assessment framework for Y industry"',
        "",
        "Explain:",
        "  • How raw material (docs, threads, notes) becomes structured intel",
      ],
    },
    {
      number: "4.3",
      title: "Hybrid Economy: USD + Reputation Credits (RC)",
      bullets: [
        "USD:",
        "  • Direct payment for intel sales",
        "",
        "RC:",
        "  • Reputation currency earned via contribution",
        "  • Unlocks visibility, roles, governance",
        "",
        "Why both:",
        "  • You need cash to live",
        "  • You need reputation to matter and steer the system",
      ],
    },
    {
      number: "4.4",
      title: "Example Journeys",
      bullets: [
        "Freelancer journey:",
        "  • Upwork → Omnis → Intel cards → Marketplace → Commons excerpts",
        "",
        "Curator journey:",
        "  • Threads → X-to-Intel → Guides → Marketplace + Commons",
        "",
        "Analyst/Educator:",
        "  • Docs/slides → Omnis → Intel → Paid + free layers",
        "",
        "For each: 3-step visual and one short story",
      ],
    },
    {
      number: "4.5",
      title: "Getting Started in 7 Days",
      bullets: [
        "Simple checklist:",
        "  • Day 1–2: Pick 3–5 pieces of past work/threads",
        "  • Day 3–4: Define 1–2 intel card concepts from them",
        "  • Day 5–6: Draft v1 using your notes + AI assistance",
        "  • Day 7: Publish somewhere (preferably Apex), ask 3–5 people for feedback",
      ],
    },
  ],
};

// =============================================================================
// BACK MATTER
// =============================================================================

export const backMatterOutline = {
  section: "Back Matter",
  pages: "35-36",

  items: [
    {
      title: "Resources & Further Reading",
      bullets: [
        "Links to future-of-work essays, AI resources, etc.",
      ],
    },
    {
      title: "About Apex",
      bullets: [
        "Short company blurb + mission",
      ],
    },
    {
      title: "Community & Contact",
      bullets: [
        "Links to Discord/Slack, email, social handles",
      ],
    },
  ],
};

// =============================================================================
// FULL OUTLINE EXPORT
// =============================================================================

export const structuredOutline = {
  meta: playbookOutline,
  frontMatter: frontMatterOutline,
  sections: [
    section1Outline,
    section2Outline,
    section3Outline,
    section4Outline,
  ],
  backMatter: backMatterOutline,
};

export default structuredOutline;
