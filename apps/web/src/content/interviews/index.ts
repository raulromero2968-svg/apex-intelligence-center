/**
 * User Interview Scripts
 *
 * Semi-structured interview guides for validating Apex Intelligence
 * with each of the four target personas.
 *
 * Goal: Talk 20%, listen 80%. Extract real language, fears, and desires.
 */

// =============================================================================
// UNIVERSAL COMPONENTS
// =============================================================================

export const universalOpener = {
  script: `"This isn't a sales call. I'm building something for people like you, and I want to understand how AI is changing your work and income—in your words. Anything you share stays confidential unless you explicitly OK a quote."`,
  followUp: `"Can you walk me through what you do and how you currently make money?"`,
  notes: [
    "Establish trust immediately - this is research, not a pitch",
    "Let them self-describe before categorizing",
    "Note their exact words - these become copy",
  ],
};

export const closingQuestions = {
  futureVision: "If this platform existed tomorrow and worked exactly as I described, what's the first thing you'd do on it?",
  referral: "Who else do you know who thinks about this stuff? Would you be open to an intro?",
  followUp: "Can I follow up in a month to show you what we built?",
};

export const interviewTips = {
  general: [
    "Record the call (with permission)",
    "Don't interrupt—let silences happen",
    "Follow energy—if they light up on a topic, dig deeper",
    "Note exact phrases in quotes",
    "Watch for emotion—fear, frustration, hope",
  ],
  postInterview: [
    "Write 3-bullet summary within 10 minutes",
    "Capture: Biggest fear, Words they used, What 'a win' looks like",
    "Tag patterns across interviews",
  ],
};

// =============================================================================
// FREELANCER INTERVIEW SCRIPT
// =============================================================================

export const freelancerScript = {
  persona: "Freelancer",
  description: "Writers, designers, developers, marketers on Upwork/Fiverr/direct clients",
  duration: "30-45 minutes",

  sections: [
    {
      name: "Context & Income Mix",
      duration: "5-8 minutes",
      questions: [
        {
          question: "What does your work mix look like right now? (types of clients & projects)",
          probes: [
            "What percentage is repeat clients vs. new?",
            "What's your average project size in dollars?",
            "How many hours/week are you working?",
          ],
        },
        {
          question: "How do clients usually find you?",
          probes: [
            "Which channels bring the best clients?",
            "How much time do you spend on acquisition?",
          ],
        },
        {
          question: "How has that changed in the last 1-2 years?",
          probes: [
            "Are you working more or less than before?",
            "Are your rates up, down, or flat?",
          ],
        },
      ],
    },
    {
      name: "AI Impact",
      duration: "8-12 minutes",
      questions: [
        {
          question: "Have clients mentioned AI tools like ChatGPT, Claude, etc. in conversations?",
          probes: [
            "What do they say exactly?",
            "How does that make you feel?",
          ],
        },
        {
          question: "Has AI changed your rates, scope, or how fast clients expect you to work?",
          probes: [
            "Any specific examples?",
            "Have you had to lower rates to compete?",
            "Do projects take less time now?",
          ],
        },
        {
          question: "Have you lost or gained projects explicitly because of AI?",
          probes: [
            "Tell me about a specific project you lost",
            "Have you won work because you're human?",
          ],
        },
      ],
    },
    {
      name: "Assets & Reuse",
      duration: "8-12 minutes",
      questions: [
        {
          question: "How often do you reuse the same frameworks / playbooks across clients?",
          probes: [
            "What do you reuse most?",
            "Is it documented or in your head?",
          ],
        },
        {
          question: "Do you have docs/templates you wish you could just package and sell?",
          probes: [
            "What would those look like?",
            "What's stopping you?",
          ],
        },
        {
          question: "What stops you from productizing your expertise today?",
          probes: [
            "Is it time? Tech? Not knowing where to sell?",
            "Have you tried before?",
          ],
        },
      ],
    },
    {
      name: "Emotional Layer",
      duration: "5-8 minutes",
      questions: [
        {
          question: "What worries you most about the next 3-5 years of your work?",
          probes: [
            "Be specific—what's the scenario you fear?",
            "How often do you think about this?",
          ],
        },
        {
          question: "What's your best-case scenario?",
          probes: [
            "What would 'winning' look like for you?",
            "What would have to be true?",
          ],
        },
      ],
    },
    {
      name: "Product Probe (Apex)",
      duration: "8-10 minutes",
      questions: [
        {
          question: `"Imagine a platform that helps you turn past projects into reusable 'intel' you can sell repeatedly, plus earn some kind of reputation score based on how helpful people find it. Does that sound compelling, confusing, or meh?"`,
          probes: [
            "What's the first objection or concern that comes to mind?",
            "What would make it a no-brainer for you to try?",
            "What would you need to see to trust it?",
          ],
        },
        {
          question: "If this existed tomorrow, what's the first thing you'd upload or turn into an asset?",
          probes: [
            "Why that specifically?",
            "What would you charge for it?",
            "Who would buy it?",
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// CURATOR INTERVIEW SCRIPT
// =============================================================================

export const curatorScript = {
  persona: "Curator",
  description: "X/Twitter power users, newsletter writers, information synthesizers",
  duration: "30-45 minutes",

  sections: [
    {
      name: "Behavior & Habits",
      duration: "5-8 minutes",
      questions: [
        {
          question: "How many hours per day/week do you spend reading, bookmarking, and posting?",
          probes: [
            "What's your morning routine?",
            "What tools do you use to save/organize?",
          ],
        },
        {
          question: "What kinds of content do you mostly share or comment on?",
          probes: [
            "What niches are you known for?",
            "What gets the best engagement?",
          ],
        },
        {
          question: "How do you currently get rewarded for this work? (likes, followers, DMs, clients)",
          probes: [
            "Does any of it convert to money?",
            "What's the best thing you've gotten from your online presence?",
          ],
        },
      ],
    },
    {
      name: "Pain Points",
      duration: "8-12 minutes",
      questions: [
        {
          question: "What about your current curation habit feels like 'unpaid work'?",
          probes: [
            "How many hours per week are 'unpaid'?",
            "Does that frustrate you?",
          ],
        },
        {
          question: "Have you ever tried turning threads into products (courses, PDFs, etc.)? What happened?",
          probes: [
            "What worked? What didn't?",
            "What stopped you from continuing?",
          ],
        },
        {
          question: "What's the hardest part of monetizing your curation?",
          probes: [
            "Is it packaging? Distribution? Pricing?",
            "What would make it easier?",
          ],
        },
      ],
    },
    {
      name: "AI & Feed Saturation",
      duration: "5-8 minutes",
      questions: [
        {
          question: "Have you noticed AI-generated noise in your feeds? How does it affect you?",
          probes: [
            "Can you usually tell what's AI-written?",
            "Does it make your job harder?",
          ],
        },
        {
          question: "Do you worry about your threads competing with AI-written ones?",
          probes: [
            "What makes your curation different from AI?",
            "How do you communicate that difference?",
          ],
        },
      ],
    },
    {
      name: "Product Probe",
      duration: "10-12 minutes",
      questions: [
        {
          question: `"If you could click a button that turned your last 10 high-signal threads into structured 'intelligence reports' you could sell, how likely are you to use that? Why or why not?"`,
          probes: [
            "What would the reports need to include?",
            "What would you charge?",
            "Who's your buyer?",
          ],
        },
        {
          question: `"What would you need to see on the platform to feel it respects your work (not just milking your content)?"`,
          probes: [
            "What's a red flag for you?",
            "What would make you trust it?",
          ],
        },
        {
          question: "If there was a 'free tier' where you share curations for reputation, and a 'paid tier' where you sell intel, how would you split your content?",
          probes: [
            "What percentage free vs. paid?",
            "What makes something 'worth paying for'?",
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// ANALYST/CONSULTANT INTERVIEW SCRIPT
// =============================================================================

export const analystScript = {
  persona: "Analyst / Consultant",
  description: "Strategy consultants, industry analysts, business advisors",
  duration: "35-50 minutes",

  sections: [
    {
      name: "Work Context",
      duration: "5-8 minutes",
      questions: [
        {
          question: "Walk me through your current work—who do you work for and what do you deliver?",
          probes: [
            "What's your typical deliverable?",
            "How long is an average engagement?",
          ],
        },
        {
          question: "How much of your work lives in private decks/PDFs that only one client sees?",
          probes: [
            "Estimate: 50%? 80%? 95%?",
            "How does that feel?",
          ],
        },
      ],
    },
    {
      name: "Reuse & Assets",
      duration: "10-12 minutes",
      questions: [
        {
          question: "How often do you find yourself writing similar insights in different client decks?",
          probes: [
            "What themes repeat?",
            "Do you have 'go-to' frameworks?",
          ],
        },
        {
          question: "What prevents you from reusing that material more broadly?",
          probes: [
            "Is it NDAs? Time? Not knowing how?",
            "Have you thought about productizing?",
          ],
        },
        {
          question: "How would your employer feel about you building 'your own asset base' on top of your job?",
          probes: [
            "Is there a policy?",
            "Would you do it anyway?",
            "What would need to change?",
          ],
        },
      ],
    },
    {
      name: "AI Impact",
      duration: "8-10 minutes",
      questions: [
        {
          question: "How is AI affecting your industry and your role specifically?",
          probes: [
            "Are clients using AI themselves?",
            "Is your work getting commoditized?",
          ],
        },
        {
          question: "What parts of your job do you think AI will handle in 3 years?",
          probes: [
            "What will still need a human?",
            "Where's your moat?",
          ],
        },
      ],
    },
    {
      name: "Product Probe",
      duration: "10-12 minutes",
      questions: [
        {
          question: `"If you could anonymize key insights from past engagements and package them as 'intel cards' that others could buy, would that feel risky or empowering?"`,
          probes: [
            "What's the risk?",
            "What's the upside?",
            "How would you price it?",
          ],
        },
        {
          question: "What would a 'safe' version of this look like for you?",
          probes: [
            "What guardrails would you need?",
            "What content is 'safe' vs. too client-specific?",
          ],
        },
        {
          question: "If intel sales could serve as qualified leads for higher-ticket consulting, would that change your interest?",
          probes: [
            "How would that funnel work for you?",
            "What would someone need to buy before you'd talk to them?",
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// EDUCATOR INTERVIEW SCRIPT
// =============================================================================

export const educatorScript = {
  persona: "Educator",
  description: "Teachers, trainers, course creators, content educators",
  duration: "30-45 minutes",

  sections: [
    {
      name: "Teaching Context",
      duration: "5-8 minutes",
      questions: [
        {
          question: "Where does your best teaching live today? (slides, videos, random documents)",
          probes: [
            "What format is most of it in?",
            "How organized is it?",
          ],
        },
        {
          question: "How do you currently share your knowledge?",
          probes: [
            "Paid courses? Free content? Workshops?",
            "What ratio is paid vs. free?",
          ],
        },
      ],
    },
    {
      name: "The Free vs. Paid Tension",
      duration: "10-12 minutes",
      questions: [
        {
          question: "What's the tension between 'I want to share knowledge' and 'I still need to pay bills'?",
          probes: [
            "How do you decide what's free vs. paid?",
            "Does it feel like a constant negotiation?",
          ],
        },
        {
          question: "Have you tried giving a lot away for free? How did that go?",
          probes: [
            "Did it build an audience?",
            "Did that audience convert to paying?",
          ],
        },
        {
          question: "What's your philosophy on free content?",
          probes: [
            "Teaser? Loss leader? Genuine gift?",
            "What do you expect in return?",
          ],
        },
      ],
    },
    {
      name: "AI Impact",
      duration: "5-8 minutes",
      questions: [
        {
          question: "How is AI changing education in your field?",
          probes: [
            "Are students using AI?",
            "Does that devalue your content?",
          ],
        },
        {
          question: "What can you teach that AI can't?",
          probes: [
            "What's your unique value?",
            "How do you communicate that?",
          ],
        },
      ],
    },
    {
      name: "Product Probe",
      duration: "10-12 minutes",
      questions: [
        {
          question: `"If you had a public library where you share part of your material (for reputation) and a marketplace layered on top (for income), how would you split things? 80/20? 50/50?"`,
          probes: [
            "What would go in each tier?",
            "How would you decide?",
          ],
        },
        {
          question: "What if your free content earned you 'reputation credits' that unlocked platform benefits?",
          probes: [
            "Would that motivate more free sharing?",
            "What benefits would matter to you?",
          ],
        },
        {
          question: "What would make you try a new platform for educational content?",
          probes: [
            "What features are must-haves?",
            "What's a dealbreaker?",
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// POST-INTERVIEW TEMPLATE
// =============================================================================

export const postInterviewTemplate = {
  title: "Post-Interview Summary Template",
  fields: [
    {
      field: "interviewee_info",
      label: "Interviewee Info",
      template: "Name: ___ | Persona: ___ | Date: ___",
    },
    {
      field: "biggest_fear",
      label: "Biggest Fear",
      template: "In their words: \"___\"",
    },
    {
      field: "words_they_used",
      label: "Key Words/Phrases",
      template: "Quote exact language that stood out: ___",
    },
    {
      field: "what_winning_looks_like",
      label: "What 'Winning' Looks Like",
      template: "Their ideal outcome: ___",
    },
    {
      field: "apex_reaction",
      label: "Reaction to Apex Concept",
      template: "Compelling / Confusing / Meh — Why: ___",
    },
    {
      field: "first_action",
      label: "First Thing They'd Do",
      template: "If Apex existed: ___",
    },
    {
      field: "objections",
      label: "Objections/Concerns",
      template: "What worried them: ___",
    },
    {
      field: "trust_signals",
      label: "Trust Signals Needed",
      template: "What would make them try it: ___",
    },
    {
      field: "notable_quotes",
      label: "Notable Quotes",
      template: "Copy-worthy phrases: ___",
    },
    {
      field: "follow_up",
      label: "Follow-Up",
      template: "Agreed to: ___ | Referrals: ___",
    },
  ],
};

// =============================================================================
// EXPORT
// =============================================================================

export const interviewScripts = {
  universalOpener,
  closingQuestions,
  tips: interviewTips,
  scripts: {
    freelancer: freelancerScript,
    curator: curatorScript,
    analyst: analystScript,
    educator: educatorScript,
  },
  postInterviewTemplate,
};

export default interviewScripts;
