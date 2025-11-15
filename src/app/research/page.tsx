import SectionShell from "../(sections)/SectionShell";

export default function ResearchPage() {
  return (
    <SectionShell title="Research" kicker="In-Depth Analysis">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:border-cyan-400/40 transition group"
          >
            <div className="mb-3 h-40 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-400/20" />
            <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition">
              Research Paper #{i + 1}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Comprehensive research and data analysis on TCG investment opportunities.
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
