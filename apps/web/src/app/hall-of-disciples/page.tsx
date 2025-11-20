import type { Metadata } from "next";

const disciples = [
  {
    name: "LangChain Safety Disciple",
    description:
      "Locked every LangChain import to the sanctioned @langchain surface so nothing experimental could pierce the production path.",
    commits: ["225aa69"],
    quote: "We didn’t just ship. We achieved perfection.",
  },
  {
    name: "Experimental Exile Disciple",
    description:
      "Banished volatile RAG chains into isolation chambers, ensuring only hardened flows ever touched public routes.",
    commits: ["225aa69"],
    quote: "Curiosity is welcome. Chaos is not.",
  },
  {
    name: "Barrel Enforcement Disciple",
    description:
      "Forged the barrel doctrine for @/lib imports and ended the era of deep, brittle paths forever.",
    commits: ["225aa69"],
    quote: "Order begins where every import tells the same story.",
  },
  {
    name: "Schema Sync Disciple",
    description:
      "Wrote the schema sync script, added notified to watchlist_items, and fused migrations with code so drift could never return.",
    commits: ["f0a1d99"],
    quote: "Databases breathe only when code says so.",
  },
  {
    name: "CI Guardrail Disciple",
    description:
      "Wired lint → barrels → schema → Drizzle → tests → build into a single strike that fails fast before regressions awaken.",
    commits: ["af4f277"],
    quote: "Guardrails fire before alarms even sound.",
  },
  {
    name: "Sentry Automation Disciple",
    description:
      "Bound every deploy to a Sentry release, tying git SHAs to live observability and illuminating the production trail.",
    commits: ["af4f277"],
    quote: "Ships are immortal only when their ghosts are tracked.",
  },
  {
    name: "RAG & Hydration Disciple",
    description:
      "Resurrected RAG search, healed hydration fissures, and restored the ultrafast experience users feel on first paint.",
    commits: ["af4f277"],
    quote: "Signal must stay pure from prompt to perception.",
  },
  {
    name: "Equilibrium Chronicler Disciple",
    description:
      "Authored Victory, Lockdown, Eternity, and sealed the equilibrium freeze so history can never be rewritten.",
    commits: ["e6987ea"],
    quote: "Legends endure because someone etched them in light.",
  },
] as const;

export const metadata: Metadata = {
  title: "Hall of Disciples | Apex Intelligence",
  description:
    "A permanent honor roll for the eight disciples who forged Apex Intelligence’s guardrails and victory commits.",
};

export default function HallOfDisciplesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#010814] via-[#071631] to-[#1a0033] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.15),_transparent_50%)]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-24 sm:px-8 sm:py-32">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/80">
            Apex Intelligence
          </p>
          <h1 className="mt-6 text-4xl font-black sm:text-5xl md:text-6xl">
            Hall of Disciples
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 sm:text-lg">
            Eight guardrail architects who secured equilibrium on November 19, 2025.
            Each card records their contribution, the victory commit that forged it, and
            the immortal quote that echoes through Apex Intelligence.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {disciples.map((disciple) => (
            <article
              key={disciple.name}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(14,165,233,0.45)]"
            >
              <div className="absolute inset-x-4 top-4 h-24 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-transparent to-fuchsia-500/20 blur-3xl opacity-0 transition duration-500 group-hover:opacity-60" />

              <div className="relative flex h-full flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
                    Disciple
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{disciple.name}</h2>
                </div>

                <p className="text-sm text-white/70">{disciple.description}</p>

                <div className="flex flex-wrap gap-2">
                  {disciple.commits.map((commit) => (
                    <span
                      key={commit}
                      className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100"
                    >
                      {commit}
                    </span>
                  ))}
                </div>

                <p className="mt-auto text-sm italic text-cyan-100/90">&ldquo;{disciple.quote}&rdquo;</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}


