/**
 * The Founder's Oath (Apex Omnis)
 *
 * A commitment to ethical systems building
 */

export const foundersOath = {
  title: "The Founder's Oath",
  subtitle: "Apex Omnis: The Commitment to Ethical Building",

  introduction: "This oath acknowledges the complexity of power. It's not a marketing statement—it's a recognition that the people building systems have been both harmed and harmful.",

  oath: [
    {
      principle: "I remember I've been both harmed and harmful",
      elaboration: "I don't pretend to be above the damage. I've been the outsider, the menace, the person who didn't fit. And I've also caused harm—through ignorance, through carelessness, through the systems I built without thinking."
    },
    {
      principle: "I build tools, not temples",
      elaboration: "What I create is meant to be used, questioned, and improved—not worshipped. If people start treating my work as scripture, I've failed."
    },
    {
      principle: "I design for transmutation, not elimination",
      elaboration: "The goal isn't to erase risk, discomfort, or conflict. It's to transform those forces into something generative. Safety through resilience, not through control."
    },
    {
      principle: "I refuse to use fear as a design principle",
      elaboration: "Fear-based design creates prisons. I will build systems that expand agency, not restrict it. If my first instinct is 'what if something goes wrong,' I will also ask 'what if something goes right.'"
    },
    {
      principle: "I admit when I don't know",
      elaboration: "Certainty is a luxury I can't afford. When I'm uncertain, I say so. When I make a mistake, I name it. The alternative is to build on a foundation of lies."
    },
    {
      principle: "I design for the outsider, the menace, the misfit",
      elaboration: "Because I've been one. Because the systems that exclude 'dangerous' people today will exclude someone you love tomorrow. I won't build walls that keep people out—I'll build frameworks that hold complexity."
    }
  ],

  closing: {
    heading: "This Oath Lives in Practice",
    content: "These principles aren't aspirational—they're operational. Every tool, every framework, every line of code should reflect this commitment. When they don't, we fix them."
  },

  connection: {
    heading: "Connected to System Safety",
    content: "This oath isn't abstract philosophy—it's the foundation of how we build. These principles come from lived experience: from being both excluded and excluding, from building systems that helped and systems that hurt. We don't pretend to be perfect. We just commit to being honest."
  }
} as const;
