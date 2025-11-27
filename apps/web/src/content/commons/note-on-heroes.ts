/**
 * A Note on Heroes
 *
 * The anti-idolatry principle that filters for trust
 */

export const noteOnHeroes = {
  title: "A Note on Heroes",
  subtitle: "Gratitude, Not Idolatry",

  introduction: "We refuse to turn people into gods.",

  sections: [
    {
      heading: "Admire the Work, Not the Person",
      content: "Great ideas come from flawed humans. We celebrate contributions while remembering that no one is infallible. The moment we worship the creator, we stop thinking critically about the creation."
    },
    {
      heading: "No Gurus, Just Tools",
      content: "This isn't a cult of personality. It's a library. We're here to build systems that work, not to follow charismatic leaders. If you're looking for a savior, you won't find one here."
    },
    {
      heading: "Gratitude Without Worship",
      content: "We're grateful for the people who came before us—those who built the frameworks, wrote the code, survived the failures. But gratitude doesn't mean blind loyalty. We take what works, acknowledge the source, and keep building."
    }
  ],

  callout: {
    type: "values-filter",
    message: "This is our values filter. If you're comfortable with nuance and uncomfortable with cults, you belong here."
  }
} as const;
