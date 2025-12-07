/**
 * 30-Day Execution Checklist
 *
 * A punchy, realistic 30-day plan to ship:
 * - Lead magnet (AI Disruption Playbook)
 * - RC Economy v1 spec
 * - User interviews
 * - First cohort of users
 */

export interface ChecklistItem {
  id: string;
  task: string;
  description?: string;
  deliverable?: string;
  priority: 'critical' | 'high' | 'medium';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ChecklistWeek {
  week: number;
  theme: string;
  focus: string;
  items: ChecklistItem[];
}

// =============================================================================
// WEEK 1: LOCK NARRATIVE & PREPARE
// =============================================================================

export const week1: ChecklistWeek = {
  week: 1,
  theme: "Lock Narrative & Prepare",
  focus: "Finalize messaging, prepare RC spec, start playbook skeleton",
  items: [
    {
      id: "w1-1",
      task: "Lock the 'grandma line' positioning",
      description: "Paste into all docs: 'Apex is where knowledge workers turn their past work and daily scrolling into assets they can sell, in cash and reputation, before AI eats their jobs.'",
      deliverable: "One-liner added to README, landing page, pitch deck",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w1-2",
      task: "Finalize RC v1 rules document",
      description: "Complete earn/spend table with caps, anti-abuse guardrails, and contributor levels",
      deliverable: "rc-economy/index.ts with full specification",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w1-3",
      task: "Create AI Disruption Playbook skeleton",
      description: "Set up Google Doc or Notion with 4 sections: The Shift, New Rules, Persona Playbooks, Apex Path",
      deliverable: "Skeleton doc with section headers and page targets",
      priority: "high",
      status: "pending",
    },
    {
      id: "w1-4",
      task: "Draft RC explainer page copy",
      description: "Simple landing page section explaining how RC works for creators",
      deliverable: "Copy ready for /library/governance or dedicated page",
      priority: "high",
      status: "pending",
    },
    {
      id: "w1-5",
      task: "Set up interview tracking sheet",
      description: "Create spreadsheet to track: Name, Persona, Date, Status, Key Quotes, Follow-up",
      deliverable: "Airtable/Google Sheet with columns",
      priority: "medium",
      status: "pending",
    },
    {
      id: "w1-6",
      task: "Identify 20 potential interviewees",
      description: "List 5 per persona (Freelancer, Curator, Analyst, Educator) from your network or cold outreach targets",
      deliverable: "Contact list with outreach status",
      priority: "high",
      status: "pending",
    },
  ],
};

// =============================================================================
// WEEK 2: TALK TO HUMANS & DRAFT PLAYBOOK
// =============================================================================

export const week2: ChecklistWeek = {
  week: 2,
  theme: "Talk to Humans & Draft Playbook",
  focus: "Conduct interviews, capture real language, write macro sections",
  items: [
    {
      id: "w2-1",
      task: "Schedule 10-15 interviews",
      description: "3-4 of each persona. Use Calendly or direct outreach.",
      deliverable: "10+ confirmed interviews on calendar",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w2-2",
      task: "Conduct interviews with script",
      description: "Use the interview scripts. Record calls (with permission). Talk 20%, listen 80%.",
      deliverable: "10+ completed interviews",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w2-3",
      task: "Write 3-bullet summary after each call",
      description: "Within 10 minutes: Biggest fear, Words they used, What 'a win' looks like",
      deliverable: "Summary per interview in tracking sheet",
      priority: "high",
      status: "pending",
    },
    {
      id: "w2-4",
      task: "Write Section 1: The Shift",
      description: "5-6 pages: 30-40% tasks automated, Erosion→Compression→Collapse phases, institutional failure",
      deliverable: "Draft pages in playbook doc",
      priority: "high",
      status: "pending",
    },
    {
      id: "w2-5",
      task: "Write Section 2: New Game, New Rules",
      description: "5-6 pages: Value inversion, Assets vs Hours, Reputation graphs vs CVs",
      deliverable: "Draft pages in playbook doc",
      priority: "high",
      status: "pending",
    },
    {
      id: "w2-6",
      task: "Add email capture for Playbook",
      description: "Simple landing page section or popup: 'Get the free playbook'",
      deliverable: "Email capture form connected to mailing list",
      priority: "medium",
      status: "pending",
    },
    {
      id: "w2-7",
      task: "Synthesize interview patterns",
      description: "Review all summaries. What fears repeat? What words echo? What do they want?",
      deliverable: "Pattern document with themes and quotes",
      priority: "high",
      status: "pending",
    },
  ],
};

// =============================================================================
// WEEK 3: PERSONA PLAYBOOKS & LANDING ITERATION
// =============================================================================

export const week3: ChecklistWeek = {
  week: 3,
  theme: "Persona Playbooks & Landing Iteration",
  focus: "Write persona sections, polish playbook, improve landing page",
  items: [
    {
      id: "w3-1",
      task: "Write Freelancer Playbook (2-3 pages)",
      description: "What disruption feels like + 90-day assetization plan",
      deliverable: "Complete Freelancer section in playbook",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w3-2",
      task: "Write Curator Playbook (2-3 pages)",
      description: "What disruption feels like + 90-day monetization plan",
      deliverable: "Complete Curator section in playbook",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w3-3",
      task: "Write Analyst Playbook (2-3 pages)",
      description: "What disruption feels like + 90-day archive extraction plan",
      deliverable: "Complete Analyst section in playbook",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w3-4",
      task: "Write Educator Playbook (2-3 pages)",
      description: "What disruption feels like + free/paid split plan",
      deliverable: "Complete Educator section in playbook",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w3-5",
      task: "Write Section 4: Apex as Execution Path",
      description: "4-6 pages: Omnis, Marketplace, Commons, Governance explained. Example flows.",
      deliverable: "Complete Section 4 in playbook",
      priority: "high",
      status: "pending",
    },
    {
      id: "w3-6",
      task: "Finalize Playbook PDF v1",
      description: "Export to PDF. Basic design. Title page, sections, CTA at end.",
      deliverable: "ai-disruption-playbook-v1.pdf",
      priority: "high",
      status: "pending",
    },
    {
      id: "w3-7",
      task: "Add 3-step visual to landing page",
      description: "Work → Assets → USD + RC visual flow",
      deliverable: "Visual component on landing page",
      priority: "medium",
      status: "pending",
    },
    {
      id: "w3-8",
      task: "Add RC example story to landing",
      description: "'Jane earns $420 + 130 RC this month' concrete example",
      deliverable: "Story section on landing page",
      priority: "medium",
      status: "pending",
    },
    {
      id: "w3-9",
      task: "Add 'No crypto / export anytime' micro-copy",
      description: "Address objections directly in subtle copy",
      deliverable: "Trust signals on landing page",
      priority: "medium",
      status: "pending",
    },
  ],
};

// =============================================================================
// WEEK 4: START CLOSED BETA & CONTENT ENGINE
// =============================================================================

export const week4: ChecklistWeek = {
  week: 4,
  theme: "Start Closed Beta & Content Engine",
  focus: "Invite first users, help them build assets, publish content",
  items: [
    {
      id: "w4-1",
      task: "Identify top 10-20 interviewees for beta",
      description: "Select highest-signal interviewees who showed genuine interest",
      deliverable: "Beta invite list with contact info",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w4-2",
      task: "Send beta invites",
      description: "Personal email inviting to early closed beta. Clear value prop + expectations.",
      deliverable: "10-20 beta invites sent",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w4-3",
      task: "Onboard 3-5 beta users personally",
      description: "1:1 calls to help them build first intel assets. White-glove service.",
      deliverable: "3-5 users with published intel cards",
      priority: "critical",
      status: "pending",
    },
    {
      id: "w4-4",
      task: "Publish the 99% Jobs essay",
      description: "With improved TL;DR and CTA. Link to playbook.",
      deliverable: "Essay live on /blog or /insights",
      priority: "high",
      status: "pending",
    },
    {
      id: "w4-5",
      task: "Publish one tactical how-to",
      description: "'From X/Twitter to Intel in 30 Minutes' or 'Upwork to Intel' with screenshots",
      deliverable: "Tutorial post with visuals",
      priority: "high",
      status: "pending",
    },
    {
      id: "w4-6",
      task: "Start weekly community ritual",
      description: "'Intel Office Hours' or 'Lifeboat Building Hour' in Discord/Slack. Live help session.",
      deliverable: "First session scheduled and promoted",
      priority: "medium",
      status: "pending",
    },
    {
      id: "w4-7",
      task: "Collect beta feedback",
      description: "Short survey or 10-min call with each beta user. What works? What's confusing?",
      deliverable: "Feedback document with actionable items",
      priority: "high",
      status: "pending",
    },
    {
      id: "w4-8",
      task: "Iterate on RC rules based on feedback",
      description: "Any obvious issues? Adjust caps or events if needed.",
      deliverable: "RC spec v1.1 updates (if needed)",
      priority: "medium",
      status: "pending",
    },
  ],
};

// =============================================================================
// FULL CHECKLIST
// =============================================================================

export const thirtyDayChecklist = {
  title: "30-Day Execution Checklist",
  subtitle: "From Strategy to Shipped",
  version: "1.0",

  overview: {
    goal: "By Day 30, you will have:",
    outcomes: [
      "A compelling lead magnet (AI Disruption Playbook) that encodes your worldview",
      "Real user language shaping your copy (from 10-15 interviews)",
      "A concrete, testable RC economy spec",
      "The first cohort of users building assets inside Apex",
    ],
  },

  weeks: [week1, week2, week3, week4],

  metrics: {
    title: "Success Metrics",
    targets: [
      { metric: "Interviews completed", target: "10-15", byWeek: 2 },
      { metric: "Playbook v1 published", target: "1", byWeek: 3 },
      { metric: "Email signups", target: "50+", byWeek: 4 },
      { metric: "Beta users onboarded", target: "10-20", byWeek: 4 },
      { metric: "Intel cards published (by users)", target: "5+", byWeek: 4 },
    ],
  },

  whatNotToDo: {
    title: "What NOT To Do This Month",
    items: [
      "Don't build complex features—manual onboarding is fine",
      "Don't wait for perfect design—ship ugly if useful",
      "Don't spend on ads—focus on 1:1 relationships",
      "Don't scale before validation—depth beats breadth",
      "Don't overthink RC numbers—you can adjust later",
    ],
  },

  nextPhase: {
    title: "After 30 Days (The 90-Day Plan)",
    preview: [
      "Scale to 50-100 active creators",
      "Build richer RC graph (curation rewards, early-signal bonuses)",
      "Launch Commons v1 (free tier)",
      "First governance proposal",
      "Public launch",
    ],
  },
};

export default thirtyDayChecklist;
