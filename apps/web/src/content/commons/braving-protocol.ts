/**
 * BRAVING Protocol
 *
 * Production-ready trust operations based on Brené Brown's framework
 * Adapted as executable exercises with types, error handling, and validation
 */

export interface BravingExercise {
  element: 'B' | 'R' | 'A' | 'V' | 'I' | 'N' | 'G';
  name: string;
  objective: string;
  steps: string[];
  errorHandling: {
    condition: string;
    fallback: string;
  };
  metrics: {
    successCriteria: string;
    target: string;
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  frequency: string;
}

export const bravingProtocol = {
  title: "BRAVING Protocol",
  subtitle: "Trust Operations for Antifragile Relationships",

  introduction: "Trust isn't a feeling—it's an API. These exercises implement Brené Brown's BRAVING framework as executable protocols. Run 1-2 exercises per week, cycling through all elements. Each includes error handling for when things don't go as planned.",

  interface: {
    description: "TypeScript-inspired mental model for clarity",
    code: `interface BravingExercise {
  element: 'B' | 'R' | 'A' | 'V' | 'I' | 'N' | 'G';
  objective: string;
  steps: string[];
  errorHandling: (issue: string) => string;
  metrics: { successCriteria: string; track: () => number };
}`
  },

  exercises: [
    {
      element: 'B' as const,
      name: "Boundaries",
      objective: "Establish explicit relational contracts to prevent overreach",
      steps: [
        "List 3 personal boundaries (e.g., 'No teasing about seriousness without check-in')",
        "Share with partner: 'My boundary is X; violation feels like Y'",
        "Negotiate mutual agreement; document in shared note",
        "Test: Simulate breach in role-play; practice enforcement"
      ],
      errorHandling: {
        condition: "Partner resists or dismisses boundary",
        fallback: "Query: 'What makes this hard?' Retry with empathy. If persistent, escalate to neutral mediator"
      },
      metrics: {
        successCriteria: "100% mutual sign-off on documented boundaries",
        target: "<1 violation per week"
      },
      tradeoffs: {
        pros: ["Reduces ambiguity", "Prevents resentment accumulation", "Creates clear expectations"],
        cons: ["May feel rigid initially", "Requires ongoing maintenance", "Can surface underlying conflicts"]
      },
      frequency: "Initial setup + quarterly review"
    },
    {
      element: 'R' as const,
      name: "Reliability",
      objective: "Verify action-word alignment like connection pooling",
      steps: [
        "Track 5 recent commitments (yours and partner's)",
        "Rate fulfillment on 0-10 scale; discuss discrepancies",
        "Set future test: 'I'll do X by Y; confirm?'",
        "Follow-up review: Analyze patterns with logged data"
      ],
      errorHandling: {
        condition: "Commitment not fulfilled",
        fallback: "Try/catch: Acknowledge failure + reschedule. If pattern repeats, downweight trust priors for that domain"
      },
      metrics: {
        successCriteria: "Reliability score = average fulfillment rating",
        target: ">8 for green status"
      },
      tradeoffs: {
        pros: ["Builds predictability", "Surfaces hidden patterns", "Creates accountability"],
        cons: ["Tracking overhead", "Can feel transactional", "Requires honest self-assessment"]
      },
      frequency: "Weekly tracking, monthly review"
    },
    {
      element: 'A' as const,
      name: "Accountability",
      objective: "Implement error correction and repair protocols",
      steps: [
        "Recall recent hurt (e.g., 'Felt dismissed when...')",
        "Practice script: 'I own X; sorry for Y; I'll amend by Z'",
        "Role-swap: Partner practices; give constructive feedback",
        "Apply live: Use in next real conflict"
      ],
      errorHandling: {
        condition: "Deflection or defensiveness occurs",
        fallback: "Pause: 'Let's table and revisit in 24h.' Resume only when both parties are regulated"
      },
      metrics: {
        successCriteria: "Repair success rate = resolved conflicts / total conflicts",
        target: ">80% resolution within 48h"
      },
      tradeoffs: {
        pros: ["Strengthens bonds through repair", "Models healthy conflict resolution", "Builds trust through ownership"],
        cons: ["Emotional cost of vulnerability", "Requires both parties' participation", "Can surface deeper issues"]
      },
      frequency: "As needed + monthly practice drill"
    },
    {
      element: 'V' as const,
      name: "Vault",
      objective: "Test confidentiality like token revocation protocols",
      steps: [
        "Share low-sensitivity info (e.g., 'My quirky habit is...')",
        "Set explicit rule: 'This stays in vault'",
        "Monitor for leaks over one week",
        "Debrief: 'Felt safe? Any breaches?'"
      ],
      errorHandling: {
        condition: "Breach detected",
        fallback: "Revoke access: Limit future shares until trust rebuilt. Gradual restoration with verification"
      },
      metrics: {
        successCriteria: "Leak rate",
        target: "0 breaches"
      },
      tradeoffs: {
        pros: ["Builds psychological safety", "Establishes trustworthiness", "Creates intimacy container"],
        cons: ["Paranoia risk if overused", "Requires tracking shared info", "Can limit natural conversation flow"]
      },
      frequency: "Monthly trust deposit"
    },
    {
      element: 'I' as const,
      name: "Integrity",
      objective: "Sync core values like schema migrations",
      steps: [
        "Map top 5 values each (independently, then share)",
        "Compare: 'Where do we align? Where do we diverge?'",
        "Test action: 'How does X behavior match stated values?'",
        "Commit to one alignment tweak this week"
      ],
      errorHandling: {
        condition: "Significant value misalignment discovered",
        fallback: "Negotiate: Which values are negotiable vs. non-negotiable? Accept as conscious trade-off or escalate"
      },
      metrics: {
        successCriteria: "Alignment percentage = shared values / total unique values",
        target: ">60% core alignment"
      },
      tradeoffs: {
        pros: ["Deepens connection through shared meaning", "Surfaces incompatibilities early", "Creates values-based decision framework"],
        cons: ["May reveal difficult truths", "Requires ongoing calibration", "Values can shift over time"]
      },
      frequency: "Quarterly deep dive"
    },
    {
      element: 'N' as const,
      name: "Non-Judgment",
      objective: "Create judgment-free endpoints for vulnerability",
      steps: [
        "Share vulnerability: 'I'm struggling with...'",
        "Partner responds without advice or judgment—pure witnessing",
        "Swap roles; rate perceived safety (1-10)",
        "Iterate: Add prompts like 'Just listen' or 'I need witnessing'"
      ],
      errorHandling: {
        condition: "Judgment detected in response",
        fallback: "Flag: 'That felt judgy; can you try again?' Retry with explicit instruction"
      },
      metrics: {
        successCriteria: "Safety average rating",
        target: ">8 on 1-10 scale"
      },
      tradeoffs: {
        pros: ["Fosters openness", "Creates safe space for processing", "Reduces shame response"],
        cons: ["Hard for analytical minds", "Requires active listening practice", "Can feel unnatural initially"]
      },
      frequency: "Weekly practice"
    },
    {
      element: 'G' as const,
      name: "Generosity",
      objective: "Assume best intent like optimistic caching",
      steps: [
        "Recall ambiguity: 'When you said X, I assumed Y (negative)'",
        "Reframe generously: 'Alternative interpretation: Z (positive)'",
        "Discuss actual intent with partner",
        "Apply forward: Default to generous parse in future ambiguities"
      ],
      errorHandling: {
        condition: "Malice is actually confirmed",
        fallback: "Adjust priors without overgeneralizing. This instance was harmful; pattern recognition requires more data"
      },
      metrics: {
        successCriteria: "Reframe success = generous assumptions validated / total reframes",
        target: ">70% validation rate"
      },
      tradeoffs: {
        pros: ["Reduces unnecessary conflict", "Builds trust through benefit of doubt", "Improves mood and relationship satisfaction"],
        cons: ["Naivety risk if unchecked", "Requires cross-reference with data", "Can enable harmful behavior if overdone"]
      },
      frequency: "Daily practice, weekly review"
    }
  ],

  implementation: {
    heading: "Implementation in Personal OS",
    content: "Hook BRAVING exercises into your Vulnerability Drills module. Prefix each drill with the target element (e.g., 'Drill with B focus'). Error handling ensures graceful degradation—if one element fails, others continue operating.",
    integrationPoint: "Middleware Layer → Trust Operations → BRAVING Protocol"
  },

  monitoring: {
    heading: "BRAVING Vitals Dashboard",
    metrics: [
      {
        name: "Trust Latency",
        description: "Time to full surrender in trusted relationship",
        healthyRange: "Decreasing trend over 6 months"
      },
      {
        name: "Boundary Violation Rate",
        description: "Breaches per month",
        healthyRange: "<1"
      },
      {
        name: "Repair Cycle Time",
        description: "Time from rupture to resolution",
        healthyRange: "<48 hours"
      },
      {
        name: "Vault Integrity",
        description: "Confidentiality breaches",
        healthyRange: "0"
      }
    ]
  },

  callout: {
    type: "executable-framework",
    message: "These aren't abstract principles—they're runnable exercises. Pick one element this week. Execute the steps. Log the metrics. Iterate based on data, not vibes."
  }
} as const;

export type BravingElement = typeof bravingProtocol.exercises[number]['element'];
export type BravingExerciseType = typeof bravingProtocol.exercises[number];
