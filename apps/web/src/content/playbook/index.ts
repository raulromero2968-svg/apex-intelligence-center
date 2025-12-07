/**
 * AI Disruption Playbook Content
 *
 * "The AI Disruption Playbook: How Knowledge Workers Can Build Income That Survives 2030"
 *
 * This is the lead magnet for Apex Intelligence - a 25-30 page PDF that educates
 * knowledge workers on AI disruption and positions Apex as an execution path.
 */

export const playbookMeta = {
  title: "The AI Disruption Playbook",
  subtitle: "How Knowledge Workers Can Build Income That Survives 2030",
  version: "1.0",
  estimatedPages: 28,
  targetAudiences: ["Freelancer", "Curator", "Analyst", "Educator"] as const,
};

// =============================================================================
// SECTION 1: THE SHIFT (5-6 pages)
// =============================================================================

export const section1TheShift = {
  title: "The Shift",
  subtitle: "What's Actually Happening",
  content: {
    opening: `By 2030, 30-40% of knowledge work tasks will be automated. Not jobs—tasks.

This distinction matters. Your job won't disappear overnight. Instead, it will erode piece by piece until you're competing with AI on price for whatever's left.

Most people won't notice until it's too late.`,

    threePhases: {
      title: "The Three Phases of AI Disruption",
      phases: [
        {
          name: "Erosion (2024-2026)",
          description: "AI handles routine tasks. You still feel secure.",
          signs: [
            "Clients ask if you used AI (they're not impressed if you did)",
            "Junior positions stop hiring",
            "You get asked to 'polish' AI-generated first drafts",
            "Projects that took days now take hours—but pay follows",
          ],
          feeling: "The water's fine. Maybe even easier.",
        },
        {
          name: "Compression (2026-2028)",
          description: "Rates compress. Volume drops. Quality ceiling collapses.",
          signs: [
            "Your best clients start using AI directly",
            "Platforms flood with AI-assisted competitors",
            "The 'human premium' you charged evaporates",
            "Your expertise becomes 'prompting ability'",
          ],
          feeling: "Something's wrong but you can't pinpoint it.",
        },
        {
          name: "Collapse (2028-2030)",
          description: "The old model breaks. Only asset-holders survive.",
          signs: [
            "Your industry's equivalent of 'Uber moment' happens",
            "Work is project-based, not relationship-based",
            "Either you own assets or you're a commodity",
            "No amount of skill saves you—only positioning does",
          ],
          feeling: "Why didn't anyone warn me?",
        },
      ],
    },

    institutionalFailure: {
      title: "Why Institutions Won't Save You",
      points: [
        {
          institution: "Government",
          why: "Regulatory cycles are 5-10 years. AI moves in months. By the time they act, you're already displaced.",
        },
        {
          institution: "Corporations",
          why: "Their incentive is cost reduction. They'll adopt AI to replace you, not to empower you.",
        },
        {
          institution: "Universities",
          why: "Curricula lag reality by 3-5 years. They're still teaching skills AI already does better.",
        },
      ],
      conclusion: "You are the only institution fast enough to save yourself.",
    },
  },
};

// =============================================================================
// SECTION 2: NEW GAME, NEW RULES (5-6 pages)
// =============================================================================

export const section2NewRules = {
  title: "New Game, New Rules",
  subtitle: "The Value Inversion",
  content: {
    valueInversion: {
      title: "The Value Inversion",
      oldWorld: {
        label: "Pre-AI Value Chain",
        sequence: ["Research", "Generate", "Curate", "Judge", "Publish"],
        mostValuable: "Generate (creation was hard)",
      },
      newWorld: {
        label: "Post-AI Value Chain",
        sequence: ["Generate (AI)", "Curate", "Judge", "Synthesize", "Vouch"],
        mostValuable: "Judge & Vouch (trust is scarce)",
      },
      explanation: `When generation becomes trivially cheap, the bottleneck shifts upstream.

What's valuable now:
- Knowing what to generate (taste)
- Knowing if it's good (judgment)
- Being trusted when you say it's good (reputation)

The person who generates content is now the least valuable link. The person who curates, judges, and vouches is the most valuable.`,
    },

    assetsVsHours: {
      title: "Assets vs. Hours",
      comparison: [
        {
          model: "Hours-for-Dollars",
          characteristics: [
            "Linear income: 1 hour = $X",
            "Ceiling = your available time",
            "No compounding",
            "You start from zero every month",
          ],
          aiVulnerability: "Extremely high. AI works 24/7 for $0/hour.",
        },
        {
          model: "Asset-Based Income",
          characteristics: [
            "Non-linear: 1 asset = $X × N buyers",
            "No ceiling (digital replication is free)",
            "Compounds with reputation",
            "Past work keeps paying",
          ],
          aiVulnerability: "Low if positioned correctly. AI can't replicate your judgment, curation, or reputation.",
        },
      ],
      keyInsight: "The shift isn't from employee to entrepreneur. It's from time-seller to asset-owner.",
    },

    reputationGraphs: {
      title: "Reputation Graphs vs. CVs",
      cvProblem: `A CV is a claim. You say you're good.

In a world of AI noise, claims are worthless. Anyone can claim anything. AI can generate a perfect CV in seconds.`,

      reputationSolution: `A reputation graph is proof. Others say you're good.

Every upvote, every purchase, every citation, every curation—these are third-party attestations that you can't fake.

Your CV is what you say about yourself.
Your reputation graph is what the network says about you.

In a world of infinite content, the only scarce resource is verified trust.`,

      actionItem: "Start building a reputation graph. Every piece of public work, every endorsement, every successful sale—it all compounds.",
    },
  },
};

// =============================================================================
// SECTION 3: PERSONA PLAYBOOKS (10-12 pages)
// =============================================================================

export const section3PersonaPlaybooks = {
  title: "Persona Playbooks",
  subtitle: "Your 90-Day Assetization Plan",

  freelancer: {
    persona: "Freelancer",
    subtitle: "From 'Rate Pressure' to Reusable Assets in 90 Days",

    whatDisruptionFeelsLike: {
      title: "What AI Disruption Feels Like For You",
      description: `Over the next 2-5 years, if you're a freelancer (writer, designer, marketer, dev), AI disruption will feel like:

- More clients trying AI first, then coming to you "to polish"
- Prospects asking for lower rates because "AI already did the first draft"
- Projects that used to take 20 hours now taking 5—with clients wanting to pay for 5

AI isn't just a tool. It's a **pricing anchor** that pushes your perceived value down.

Your risk isn't that "no one will ever hire freelancers again."
Your risk is that **you work more for less, with no assets to show for a decade of skill.**`,
    },

    ninetyDayPlan: {
      goal: "By Day 90, you should have 3-5 intelligence assets live that: reuse your best client work, could realistically sell multiple times, and position you as the person for a specific problem.",

      steps: [
        {
          step: 1,
          name: "Inventory",
          days: "1-7",
          tasks: [
            "List your last 10-20 client projects",
            "For each, answer: What problem did they bring? What did I do to solve it? What reusable patterns did I use?",
            "Circle 3-5 projects where you got great results with a repeatable approach",
          ],
        },
        {
          step: 2,
          name: "Define Intel Products",
          days: "7-14",
          tasks: [
            "For each circled project, design one asset: playbook, briefing, or template",
            "Name them in outcome language (not clever titles)",
            "Examples: 'B2B SaaS Launch Playbook: From Zero to First 50 Customers', 'Cold Email Research Template for 60%+ Open Rates'",
          ],
        },
        {
          step: 3,
          name: "Create v1",
          days: "14-45",
          tasks: [
            "Draft each asset in structured format: Goal, Who it's for, When to use it, Step-by-step, Examples",
            "Ask: Would past-me have paid for this to skip mistakes?",
            "Don't seek perfection—seek honest, battle-tested clarity",
          ],
        },
        {
          step: 4,
          name: "Ship & Learn",
          days: "45-90",
          tasks: [
            "Pick a home (Apex or another platform)",
            "On Apex: Import docs into Omnis → AI drafts intel cards → Edit/refine → Publish",
            "Share with 5-10 people in your niche",
            "Ask: Would this have saved you time/money? What's missing? What would you pay?",
            "Iterate once. Don't get stuck in infinite polish.",
          ],
        },
      ],
    },
  },

  curator: {
    persona: "Curator",
    subtitle: "Turn Your Daily Scrolling Into a Revenue Stream",

    whatDisruptionFeelsLike: {
      title: "What AI Disruption Feels Like For You",
      description: `If you're a Twitter/X power user, LinkedIn thought leader, or newsletter curator:

- Your feeds are filling with AI-generated noise
- Your carefully researched threads compete with GPT-written ones
- Hours of curation feel like unpaid labor
- You have 50K followers but $0 in direct monetization

AI isn't your enemy—it's making your curation MORE valuable. The problem is you have no way to capture that value.`,
    },

    ninetyDayPlan: {
      goal: "Turn your existing curation habit into structured intelligence assets that earn while you sleep.",

      steps: [
        {
          step: 1,
          name: "Audit",
          days: "1-7",
          tasks: [
            "Export your last 50 bookmarks/saves",
            "Identify 5 recurring themes you always find yourself saving",
            "Note which saves you've shared or referenced most",
          ],
        },
        {
          step: 2,
          name: "Structure",
          days: "7-14",
          tasks: [
            "For each theme, create a 'briefing template': Key sources, Common misconceptions, Your take, Implications",
            "Turn 3 of your best threads into structured intel cards",
            "Add context that Twitter didn't allow",
          ],
        },
        {
          step: 3,
          name: "Systematize",
          days: "14-45",
          tasks: [
            "Connect your curation sources to Apex (Omnis)",
            "Set up weekly 'intelligence briefing' creation",
            "Build a free Commons tier (reputation) + paid Intel tier (income)",
          ],
        },
        {
          step: 4,
          name: "Launch",
          days: "45-90",
          tasks: [
            "Publish 5 intel cards from your best curations",
            "Share excerpts on your existing platforms with 'full analysis' CTA",
            "Track which topics resonate; double down",
          ],
        },
      ],
    },
  },

  analyst: {
    persona: "Analyst/Consultant",
    subtitle: "Unlock Value From the Decks Rotting in Your Google Drive",

    whatDisruptionFeelsLike: {
      title: "What AI Disruption Feels Like For You",
      description: `If you build strategies, analyses, or frameworks for clients:

- You've written the same insight in 17 different decks
- Each client paid once for knowledge that could help 1000 others
- Your best work is locked in NDAs or just forgotten
- AI is democratizing the 'analysis' part—your real value is judgment

The irony: You've created millions in value. You captured almost none of it.`,
    },

    ninetyDayPlan: {
      goal: "Extract reusable, anonymized intelligence from your consulting archive and start compounding on your expertise.",

      steps: [
        {
          step: 1,
          name: "Archive Audit",
          days: "1-14",
          tasks: [
            "Review last 2 years of decks/documents",
            "Tag patterns: frameworks, recurring findings, methodologies",
            "Identify what you can anonymize vs. what's too client-specific",
          ],
        },
        {
          step: 2,
          name: "Framework Extraction",
          days: "14-30",
          tasks: [
            "Pull out 5-10 reusable frameworks",
            "Strip client details, keep structure",
            "Write 'how to use this' context",
          ],
        },
        {
          step: 3,
          name: "Build & Test",
          days: "30-60",
          tasks: [
            "Create intel cards for top 3 frameworks",
            "Test pricing: what would YOU pay to skip developing this?",
            "Offer early access to past clients for testimonials",
          ],
        },
        {
          step: 4,
          name: "Position",
          days: "60-90",
          tasks: [
            "Build a reputation as THE source for [specific domain] intelligence",
            "Use intel sales as qualified leads for higher-ticket consulting",
            "Create a flywheel: consulting → intel → reputation → more consulting",
          ],
        },
      ],
    },
  },

  educator: {
    persona: "Educator",
    subtitle: "Balance Free Knowledge With Sustainable Income",

    whatDisruptionFeelsLike: {
      title: "What AI Disruption Feels Like For You",
      description: `If you teach, train, or create educational content:

- Students expect free content (YouTube, articles)
- Paid courses compete with $0 alternatives
- You want to share knowledge but need income
- AI can explain basics—your value is synthesis and experience

The tension: Sharing freely builds reach. But reach doesn't pay rent.`,
    },

    ninetyDayPlan: {
      goal: "Create a two-tier system: free content for reach, premium intel for income. Let reputation on one drive sales on the other.",

      steps: [
        {
          step: 1,
          name: "Content Split",
          days: "1-14",
          tasks: [
            "Inventory all your teaching materials",
            "Divide into 'foundational' (can be free) vs 'advanced' (should be paid)",
            "Target split: 60% free / 40% paid",
          ],
        },
        {
          step: 2,
          name: "Free Tier Setup",
          days: "14-30",
          tasks: [
            "Publish foundational content to Commons (free)",
            "Make it genuinely useful—not a teaser",
            "Build reputation and following",
          ],
        },
        {
          step: 3,
          name: "Paid Tier Setup",
          days: "30-60",
          tasks: [
            "Create intel cards for advanced content",
            "Price based on outcome value, not time invested",
            "Bundle related cards for higher average order value",
          ],
        },
        {
          step: 4,
          name: "Flywheel Activation",
          days: "60-90",
          tasks: [
            "Cross-promote: free content → 'for more, see my intel'",
            "Track which free content drives paid conversions",
            "Use RC rewards to incentivize free sharing",
          ],
        },
      ],
    },
  },
};

// =============================================================================
// SECTION 4: APEX AS EXECUTION PATH (4-6 pages)
// =============================================================================

export const section4ApexPath = {
  title: "One Execution Path: Apex Intelligence",
  subtitle: "How the Platform Works",

  intro: `Everything in this playbook can be done manually. You could:
- Create PDFs and sell on Gumroad
- Build a Notion template store
- Start a Substack and paywall content

But these approaches have limitations:
- No built-in reputation system
- No AI-assisted asset creation
- No network effects
- Fragmented monetization

Apex Intelligence is one execution path that addresses these. Here's how it works.`,

  coreProducts: [
    {
      name: "Omnis",
      tagline: "Your AI extraction engine",
      description: "Connect your data sources (Upwork, Twitter, Notion, uploads). AI processes your past work and generates draft intelligence cards. You review, refine, and publish.",
      userBenefit: "Skip the blank page. Start with your own proven content.",
    },
    {
      name: "Intelligence Marketplace",
      tagline: "Sell what you know",
      description: "Publish intel cards with real USD pricing. Keep 85% of every sale. Build a library of assets that sell while you sleep.",
      userBenefit: "Turn expertise into recurring income.",
    },
    {
      name: "Commons",
      tagline: "Build reputation by giving",
      description: "Publish free intel to build reputation. Earn Reputation Credits (RC) when others find your work useful. RC unlocks roles, visibility, and fee discounts.",
      userBenefit: "Give freely, get rewarded. Let free work drive paid sales.",
    },
    {
      name: "Governance",
      tagline: "Shape the platform",
      description: "Use RC to vote on proposals. High-RC contributors become curators, moderators, governors. The platform is built by its users.",
      userBenefit: "Not just a marketplace—a network you help own.",
    },
  ],

  exampleFlows: [
    {
      name: "Upwork → Omnis → Intel",
      description: "Connect your Upwork portfolio. Omnis extracts patterns from your proposals and projects. Review and publish as intel cards.",
      outcome: "Turn past gig work into sellable assets.",
    },
    {
      name: "Twitter/X → Intel → Commons",
      description: "Connect your Twitter account. Omnis structures your best threads. Publish full versions as paid intel, excerpts as free Commons.",
      outcome: "Monetize your curation habit.",
    },
    {
      name: "Commons → Reputation → Consulting",
      description: "Give generously on Commons. Build RC and reputation. Use your Apex profile as proof of expertise when pitching clients.",
      outcome: "Let the network vouch for you.",
    },
  ],

  noHype: {
    title: "What Apex Is NOT",
    points: [
      "Not crypto—RC has no external exchange. You can't speculate on it.",
      "Not a get-rich-quick scheme—building reputation takes real work.",
      "Not a walled garden—export your content and earnings anytime.",
      "Not a guru platform—we explicitly reject personality cults.",
    ],
  },

  cta: {
    headline: "Ready to Build?",
    description: "Join the early access waitlist and be among the first to turn your knowledge into assets.",
    buttonText: "Join Early Access",
    url: "/subscribe",
  },
};

// =============================================================================
// FULL PLAYBOOK EXPORT
// =============================================================================

export const aiDisruptionPlaybook = {
  meta: playbookMeta,
  sections: [
    { number: 1, ...section1TheShift },
    { number: 2, ...section2NewRules },
    { number: 3, ...section3PersonaPlaybooks },
    { number: 4, ...section4ApexPath },
  ],
};

export default aiDisruptionPlaybook;
