import SectionShell from "../(sections)/SectionShell";

export default function ServicesPage() {
  return (
    <SectionShell title="What We Do" kicker="Our Work">
      <div className="space-y-6 mb-8">
        <p className="text-white/80 leading-relaxed">
          Apex Intelligence produces analysis and tools—not products for sale. We are a small
          operation focused on careful work, not scale. Everything we publish aims to help people
          think more clearly about the systems they live in.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Cultural Analysis",
            description: "Essays on film, media, and how stories train our instincts. We explore the architecture of everyday power—how narratives shape what we notice and what we ignore.",
          },
          {
            title: "Systems Thinking",
            description: "Clear-eyed maps of how states, capitalism, security, and AI interact. We analyze flows of power without paranoia or conspiracy, focused on what can actually be understood.",
          },
          {
            title: "Research & Prototypes",
            description: "Experiments in designing tools that support self-determination and protect mental health. When we build something, it has explicit constraints on what it will not be used for.",
          },
          {
            title: "Public Notes",
            description: "Dispatches on what we're learning, where we're uncertain, and what we got wrong. We practice transparency about our limits—no fake expertise, no mystique.",
          },
        ].map((service, i) => (
          <article
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-cyan-400/40 transition"
          >
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">{service.title}</h3>
            <p className="text-white/70">{service.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg border border-white/10 bg-white/5">
        <p className="text-white/60 text-sm">
          <strong className="text-white">Note:</strong> We are not selling investment advice,
          market tips, or trading signals. We do research and share what we learn. If something
          we make starts causing harm, we are obligated to redesign or shut it down.
        </p>
      </div>
    </SectionShell>
  );
}

