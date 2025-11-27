/**
 * The Shadow Reflex Test
 *
 * A framework for identifying when safety systems become control systems
 */

export const shadowReflexTest = {
  title: "The Shadow Reflex Test",
  subtitle: "Formerly the Gun-Barrel Test",

  introduction: "When does protection become control? This test helps you recognize when your 'safety measures' are actually fear responses dressed up as care.",

  renameNote: {
    heading: "Why We Renamed It",
    content: "The original name ('Gun-Barrel Test') was visceral but carried baggage. 'Shadow Reflex' is more precise: it points to the unconscious, defensive reaction we have when our discomfort masquerades as care for others."
  },

  questions: [
    {
      id: 1,
      question: "Are we treating discomfort as if it were a threat?",
      explanation: "Discomfort is not danger. If your first instinct is to eliminate discomfort rather than understand it, you might be in shadow reflex mode.",
      reflection: "Ask yourself: Am I trying to protect people, or am I trying to protect myself from feeling uncomfortable?"
    },
    {
      id: 2,
      question: "Would this rule apply if the roles were reversed?",
      explanation: "Power obscures perspective. The best test of a rule is whether you'd accept it if you were on the receiving end.",
      reflection: "Imagine you're the one being restricted. Does the rule still feel fair and necessary?"
    },
    {
      id: 3,
      question: "Are we confusing 'potential harm' with 'actual harm'?",
      explanation: "Everything has the potential to cause harm. A kitchen knife. A car. Free speech. The question is: what's the actual evidence of harm, and is our response proportional?",
      reflection: "What specific, documented harm are we preventing? Or are we just uncomfortable with the possibility?"
    },
    {
      id: 4,
      question: "Does this solution increase agency or reduce it?",
      explanation: "Good safety systems give people more control over their lives. Bad ones take control away under the guise of protection.",
      reflection: "After implementing this, do people have more choices or fewer?"
    },
    {
      id: 5,
      question: "Are we asking 'what could go wrong' without also asking 'what could go right'?",
      explanation: "Risk assessment is only half the equation. If you only focus on downsides, you'll build a prison and call it a safe space.",
      reflection: "What opportunities are we eliminating in the name of safety?"
    }
  ],

  usage: {
    heading: "How to Use This Test",
    steps: [
      "When designing a policy, run through all five questions",
      "If you answer 'yes' to questions 1 or 3, you're likely in shadow reflex mode",
      "If you answer 'no' to questions 2, 4, or 5, reconsider the policy",
      "This isn't about removing all safety measures—it's about ensuring they're actually protective, not controlling"
    ]
  },

  callout: {
    type: "immediate-value",
    message: "This tool is useful right now. You didn't have to buy anything. You didn't have to join anything. You can use it immediately."
  }
} as const;
