import SectionShell from "../(sections)/SectionShell";

export default function BlogPage() {
  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:border-cyan-400/40 transition group"
          >
            <div className="mb-3 h-40 rounded-lg bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-400/20" />
            <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition">
              Blog Post #{i + 1}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Expert commentary on TCG market trends and collecting strategies.
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
