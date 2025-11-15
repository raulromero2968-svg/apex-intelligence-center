import SectionShell from "../(sections)/SectionShell";

export default function IntelPage() {
  return (
    <SectionShell title="Intel" kicker="Apex Intelligence">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:border-cyan-400/40 transition group"
          >
            <div className="mb-3 h-40 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/20" />
            <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition">
              Intelligence Report #{i + 1}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Market analysis and insights for serious TCG collectors and investors.
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
